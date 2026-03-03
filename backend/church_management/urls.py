from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProfileViewSet, MemberViewSet, ServiceViewSet, AttendanceRecordViewSet,
    MemberFollowUpViewSet, RegisterView, StatsViewSet, SMSViewSet, 
    SettingsViewSet, ContributionViewSet, DepartmentViewSet,
    ChildViewSet, ChildCheckInViewSet, PrayerRequestViewSet,
    CommunicationLogViewSet, ExpenseViewSet
)

router = DefaultRouter()
router.register(r'register', RegisterView, basename='register')
router.register(r'profiles', ProfileViewSet)
router.register(r'members', MemberViewSet)
router.register(r'services', ServiceViewSet)
router.register(r'attendance', AttendanceRecordViewSet)
router.register(r'follow-ups', MemberFollowUpViewSet)
router.register(r'sms', SMSViewSet, basename='sms')
router.register(r'communication-logs', CommunicationLogViewSet)
# Settings moved to manual path below for singleton behavior
router.register(r'contributions', ContributionViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'departments', DepartmentViewSet)
router.register(r'children', ChildViewSet)
router.register(r'child-checkins', ChildCheckInViewSet)
router.register(r'prayer-requests', PrayerRequestViewSet)

urlpatterns = [
    path('settings/', SettingsViewSet.as_view({'get': 'list', 'patch': 'partial_update'})),
    path('', include(router.urls)),
]
