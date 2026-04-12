import pyotp
import qrcode
import base64
from io import BytesIO
from rest_framework import viewsets, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import User

from .base import log_activity, StandardResultsSetPagination
from ..models import Profile, Role
from ..serializers import ProfileSerializer, RegisterSerializer, UserSerializer
from ..permissions import IsAdmin, IsViewerOrHigher

class RegisterView(viewsets.GenericViewSet, viewsets.mixins.CreateModelMixin):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [IsAdmin]

class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsViewerOrHigher]

    @action(detail=False, methods=['get'])
    def me(self, request):
        profile = request.user.profile
        serializer = self.get_serializer(profile)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def assign_role(self, request, pk=None):
        profile = self.get_object()
        role = request.data.get('role')
        if role in Role.values:
            profile.role = role
            # (Role logic from views.py)
            profile.save()
            return Response(self.get_serializer(profile).data)
        return Response({'error': 'invalid role'}, status=400)

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'profile') and user.profile.role == 'admin':
            return Profile.objects.all()
        return Profile.objects.filter(user=user)

class TwoFactorViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def setup(self, request):
        profile = request.user.profile
        if not profile.two_factor_secret:
            profile.two_factor_secret = pyotp.random_base32()
            profile.save()

        totp = pyotp.TOTP(profile.two_factor_secret)
        provisioning_url = totp.provisioning_uri(name=request.user.email, issuer_name="RCCG Sanctuary")
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(provisioning_url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        qr_base64 = base64.b64encode(buffered.getvalue()).decode()
        return Response({'qr_code': f"data:image/png;base64,{qr_base64}", 'secret': profile.two_factor_secret})

    @action(detail=False, methods=['post'])
    def verify(self, request):
        token = request.data.get('token')
        profile = request.user.profile
        totp = pyotp.TOTP(profile.two_factor_secret)
        if totp.verify(token):
            profile.is_two_factor_enabled = True
            profile.save()
            return Response({'status': '2FA enabled'})
        return Response({'error': 'Invalid token'}, status=400)

class TwoFactorTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # Support login by email
        username = attrs.get('username')
        if username and '@' in username:
            user = User.objects.filter(email__iexact=username).first()
            if user:
                attrs['username'] = user.username

        data = super().validate(attrs)
        profile = getattr(self.user, 'profile', None)
        if profile and profile.is_two_factor_enabled:
            token = self.context['request'].data.get('two_factor_token')
            if not token:
                raise serializers.ValidationError({'two_factor_required': True}, code='2fa_required')
            totp = pyotp.TOTP(profile.two_factor_secret)
            if not totp.verify(token):
                raise serializers.ValidationError({'detail': 'Invalid 2FA token'}, code='invalid_2fa')
        return data

class TwoFactorTokenObtainPairView(TokenObtainPairView):
    serializer_class = TwoFactorTokenObtainPairSerializer
