from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone

from .base import viewsets, AuditableModelViewSetMixin, log_activity, StandardResultsSetPagination
from ..models import (
    Department, Child, ChildCheckIn, PrayerRequest, ChurchSettings, 
    CalendarEvent, AuditLog, CheckInQueue, Member, Service, AttendanceRecord
)
from ..serializers import (
    DepartmentSerializer, ChildSerializer, ChildCheckInSerializer, 
    PrayerRequestSerializer, ChurchSettingsSerializer, CalendarEventSerializer, 
    AuditLogSerializer, CheckInQueueSerializer
)
from ..permissions import (
    IsAdmin, IsAdminOrHasSettingsPerm, IsViewerOrHigher, IsChildrenOfficerOrHigher, IsPrayerOfficerOrHigher,
    IsAttendanceOfficerOrHigher
)

class DepartmentViewSet(AuditableModelViewSetMixin, viewsets.ModelViewSet):
    queryset = Department.objects.all().order_by('name')
    serializer_class = DepartmentSerializer
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]

class ChildViewSet(AuditableModelViewSetMixin, viewsets.ModelViewSet):
    queryset = Child.objects.all().order_by('full_name')
    serializer_class = ChildSerializer
    pagination_class = StandardResultsSetPagination
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsChildrenOfficerOrHigher()]
        return [IsViewerOrHigher()]

class ChildCheckInViewSet(AuditableModelViewSetMixin, viewsets.ModelViewSet):
    queryset = ChildCheckIn.objects.all().order_by('-checked_in_at')
    serializer_class = ChildCheckInSerializer
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'checkout']:
            return [IsChildrenOfficerOrHigher()]
        return [IsViewerOrHigher()]

    @action(detail=True, methods=['post'])
    def checkout(self, request, pk=None):
        checkin = self.get_object()
        if checkin.checked_out_at:
            return Response({'error': 'Child already checked out'}, status=400)
        checkin.checked_out_at = timezone.now()
        checkin.save()
        return Response({'status': 'checked out successfully'})

class PrayerRequestViewSet(AuditableModelViewSetMixin, viewsets.ModelViewSet):
    queryset = PrayerRequest.objects.all().order_by('-created_at')
    serializer_class = PrayerRequestSerializer
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [IsPrayerOfficerOrHigher()]

class SettingsViewSet(viewsets.ViewSet):
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminOrHasSettingsPerm()]

    def list(self, request):
        settings = ChurchSettings.objects.first()
        if not settings:
            settings = ChurchSettings.objects.create(id=1)
        serializer = ChurchSettingsSerializer(settings, context={'request': request})
        return Response(serializer.data)

    def partial_update(self, request, pk=None):
        settings = ChurchSettings.objects.first()
        if not settings:
            settings = ChurchSettings.objects.create(id=1)
        serializer = ChurchSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            log_activity(
                user=request.user,
                action='update',
                model_name='ChurchSettings',
                object_id=str(settings.id),
                object_name=settings.church_name,
                details={'updates': request.data}
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CalendarEventViewSet(AuditableModelViewSetMixin, viewsets.ModelViewSet):
    queryset = CalendarEvent.objects.all().order_by('start_time')
    serializer_class = CalendarEventSerializer
    permission_classes = [permissions.IsAuthenticated]

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

class CheckInQueueViewSet(viewsets.ModelViewSet):
    queryset = CheckInQueue.objects.all().order_by('-created_at')
    serializer_class = CheckInQueueSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [IsAttendanceOfficerOrHigher()]

    def perform_create(self, serializer):
        # Determine today's service
        today = timezone.now().date()
        service = Service.objects.filter(service_date=today).first()
        if not service:
            # Fallback to the most recent service if none today
            service = Service.objects.all().order_by('-service_date').first()
        
        instance = serializer.save(service=service)
        
        # Check for auto-confirmation
        settings = ChurchSettings.objects.first()
        if settings and settings.auto_confirm_qr_checkin:
            # If a member_id was provided (likely from a QR scan), auto-confirm
            member_id = self.request.data.get('member_id')
            if member_id:
                try:
                    member = Member.objects.get(id=member_id)
                    self._mark_present(member, service)
                    instance.status = 'confirmed'
                    instance.save()
                except Member.DoesNotExist:
                    pass

    def _mark_present(self, member, service):
        AttendanceRecord.objects.get_or_create(
            member=member,
            service=service,
            defaults={'marked_by': self.request.user if self.request.user.is_authenticated else None}
        )

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        instance = self.get_object()
        if instance.status == 'confirmed':
            return Response({'error': 'Already confirmed'}, status=400)
            
        phone_number = request.data.get('phone_number')
        member = None
        
        if instance.member:
            member = instance.member
        elif phone_number:
            member = Member.objects.filter(phone=phone_number).first()
            
        if not member:
            return Response({'error': 'Member not found for this phone number'}, status=404)
            
        self._mark_present(member, instance.service)
        
        instance.status = 'confirmed'
        instance.save()
        
        return Response({'status': 'confirmed'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        instance = self.get_object()
        instance.status = 'rejected'
        instance.save()
        return Response({'status': 'rejected'})
