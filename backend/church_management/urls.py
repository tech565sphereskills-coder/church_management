from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProfileViewSet, MemberViewSet, ServiceViewSet, AttendanceRecordViewSet,
    MemberFollowUpViewSet, RegisterView, StatsViewSet, SMSViewSet, 
    CommunicationLogViewSet, ExpenseViewSet, CalendarEventViewSet, AuditLogViewSet,
    BudgetViewSet, PledgeViewSet, SMSTemplateViewSet, ContributionViewSet,
    DepartmentViewSet, ChildViewSet, ChildCheckInViewSet, PrayerRequestViewSet,
    SettingsViewSet, CheckInQueueViewSet, FamilyViewSet, InventoryItemViewSet,
    TwoFactorViewSet, TwoFactorTokenObtainPairView
)

router = DefaultRouter()
router.register(r'register', RegisterView, basename='register')
router.register(r'profiles', ProfileViewSet)
router.register(r'members', MemberViewSet)
router.register(r'services', ServiceViewSet)
router.register(r'attendance', AttendanceRecordViewSet)
router.register(r'follow-ups', MemberFollowUpViewSet)
router.register(r'stats', StatsViewSet, basename='stats')
router.register(r'sms', SMSViewSet, basename='sms')
router.register(r'sms-templates', SMSTemplateViewSet)
router.register(r'communication-logs', CommunicationLogViewSet)
router.register(r'check-in-queue', CheckInQueueViewSet)
# Settings moved to manual path below for singleton behavior
router.register(r'contributions', ContributionViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'calendar', CalendarEventViewSet)
router.register(r'audit-logs', AuditLogViewSet)
router.register(r'departments', DepartmentViewSet)
router.register(r'children', ChildViewSet)
router.register(r'child-checkins', ChildCheckInViewSet)
router.register(r'prayer-requests', PrayerRequestViewSet)
router.register(r'budgets', BudgetViewSet)
router.register(r'pledges', PledgeViewSet)
router.register(r'families', FamilyViewSet)
router.register(r'inventory', InventoryItemViewSet)
router.register(r'two-factor', TwoFactorViewSet, basename='two-factor')

urlpatterns = [
    path('settings/', SettingsViewSet.as_view({'get': 'list', 'patch': 'partial_update'})),
    path('', include(router.urls)),
]
