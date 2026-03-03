from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.models import User
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Profile, Member, Service, AttendanceRecord, MemberFollowUp
from .serializers import (
    ProfileSerializer, MemberSerializer, ServiceSerializer, 
    AttendanceRecordSerializer, MemberFollowUpSerializer,
    UserSerializer, RegisterSerializer
)

class RegisterView(viewsets.GenericViewSet, viewsets.mixins.CreateModelMixin):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def me(self, request):
        profile = request.user.profile
        serializer = self.get_serializer(profile)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def assign_role(self, request, pk=None):
        profile = self.get_object()
        role = request.data.get('role')
        if role in ['admin', 'attendance_officer', 'viewer']:
            profile.role = role
            profile.save()
            return Response({'status': 'role assigned'})
        return Response({'error': 'invalid role'}, status=400)

    @action(detail=True, methods=['post'])
    def remove_role(self, request, pk=None):
        profile = self.get_object()
        profile.role = None
        profile.save()
        return Response({'status': 'role removed'})

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

class MemberViewSet(viewsets.ModelViewSet):
    queryset = Member.objects.all()
    serializer_class = MemberSerializer
    permission_classes = [permissions.IsAuthenticated]

class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated]

class AttendanceRecordViewSet(viewsets.ModelViewSet):
    queryset = AttendanceRecord.objects.all()
    serializer_class = AttendanceRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(marked_by=self.request.user)

    @action(detail=False, methods=['get'])
    def weekly(self, request):
        today = timezone.now().date()
        week_start = today - timedelta(days=6)
        
        # Get count per day for last 7 days
        data = []
        for i in range(7):
            date = week_start + timedelta(days=i)
            count = AttendanceRecord.objects.filter(marked_at__date=date).count()
            data.append({
                'date': date.strftime('%a'),
                'attendance': count
            })
        return Response(data)

    @action(detail=False, methods=['get'])
    def recent(self, request):
        records = AttendanceRecord.objects.select_related('member').order_by('-marked_at')[:5]
        data = []
        for r in records:
            data.append({
                'id': r.id,
                'marked_at': r.marked_at,
                'members': {
                    'id': r.member.id,
                    'full_name': r.member.full_name,
                    'department': r.member.department
                }
            })
        return Response(data)

class MemberFollowUpViewSet(viewsets.ModelViewSet):
    queryset = MemberFollowUp.objects.all()
    serializer_class = MemberFollowUpSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'])
    def calculate(self, request):
        MemberFollowUp.recalculate()
        return Response({'status': 'calculation completed'})

    def get_queryset(self):
        return self.queryset.filter(needs_follow_up=True)

class StatsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        today = timezone.now().date()
        week_start = today - timedelta(days=7)
        
        today_attendance = AttendanceRecord.objects.filter(marked_at__date=today).count()
        total_members = Member.objects.count()
        active_members = Member.objects.filter(status='active').count()
        weekly_attendance = AttendanceRecord.objects.filter(marked_at__date__gte=week_start).count()
        
        return Response({
            'todayAttendance': today_attendance,
            'totalMembers': total_members,
            'activeMembers': active_members,
            'weeklyAverage': round(weekly_attendance / 7)
        })
