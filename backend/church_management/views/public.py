from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from ..models import Member, Family
from ..serializers import MemberSerializer

class PublicMemberRegistrationViewSet(viewsets.GenericViewSet, viewsets.mixins.CreateModelMixin):
    """
    ViewSet for public member registration. 
    Allows unauthenticated users to create a member record.
    """
    queryset = Member.objects.all()
    serializer_class = MemberSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        # Automatically set some defaults for public registrations if needed
        # For example, we mark them as 'first_timer' by default if status isn't provided
        if 'status' not in self.request.data:
            serializer.save(status='first_timer')
        else:
            serializer.save()

    def create(self, request, *args, **kwargs):
        # We can add extra validation or rate limiting here if needed
        return super().create(request, *args, **kwargs)
