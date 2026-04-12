from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.models import User
from rest_framework import viewsets, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action
from django.db.models import Count, Q, Avg, Sum
from django.db.models.functions import TruncMonth

from ..models import (
    Role, Profile, Member, Service, AttendanceRecord, MemberFollowUp, 
    Contribution, Department, Child, ChildCheckIn, PrayerRequest, ChurchSettings,
    CommunicationLog, Expense, CalendarEvent, AuditLog, SMSTemplate, Budget, Pledge,
    CheckInQueue, Family, InventoryItem
)
from ..serializers import (
    AttendanceRecordSerializer, MemberFollowUpSerializer,
    UserSerializer, RegisterSerializer, ContributionSerializer,
    DepartmentSerializer, ProfileSerializer, MemberSerializer,
    ServiceSerializer, ChildSerializer, ChildCheckInSerializer,
    PrayerRequestSerializer, ChurchSettingsSerializer, CommunicationLogSerializer,
    ExpenseSerializer, CalendarEventSerializer, AuditLogSerializer,
    SMSTemplateSerializer, BudgetSerializer, PledgeSerializer,
    CheckInQueueSerializer, FamilySerializer, InventoryItemSerializer
)
from ..permissions import (
    IsAdmin, IsFinanceOfficer, IsAttendanceOfficerOrHigher, 
    IsViewerOrHigher, ReadOnly, IsChildrenOfficerOrHigher,
    IsPrayerOfficerOrHigher
)

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 1000

# Helper for auditing
def log_activity(user, action, model_name, object_id, object_name, details=None):
    try:
        AuditLog.objects.create(
            user=user if user and user.is_authenticated else None,
            action=action,
            model_name=model_name,
            object_id=str(object_id),
            object_name=object_name,
            details=details or {}
        )
    except Exception as e:
        print(f"Failed to log activity: {e}")

class AuditableModelViewSetMixin:
    def perform_create(self, serializer):
        instance = serializer.save()
        if hasattr(self.request, 'user'):
            log_activity(
                self.request.user, 
                AuditLog.Action.CREATE, 
                instance.__class__.__name__, 
                instance.id, 
                str(instance)
            )

    def perform_update(self, serializer):
        instance = serializer.save()
        if hasattr(self.request, 'user'):
            log_activity(
                self.request.user, 
                AuditLog.Action.UPDATE, 
                instance.__class__.__name__, 
                instance.id, 
                str(instance)
            )

    def perform_destroy(self, instance):
        instance_id = instance.id
        instance_name = str(instance)
        model_name = instance.__class__.__name__
        instance.delete()
        if hasattr(self.request, 'user'):
            log_activity(
                self.request.user, 
                AuditLog.Action.DELETE, 
                model_name, 
                instance_id, 
                instance_name
            )
