from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProfileViewSet, MemberViewSet, ServiceViewSet, AttendanceRecordViewSet, MemberFollowUpViewSet, RegisterView, StatsViewSet

router = DefaultRouter()
router.register(r'register', RegisterView, basename='register')
router.register(r'profiles', ProfileViewSet)
router.register(r'members', MemberViewSet)
router.register(r'services', ServiceViewSet)
router.register(r'attendance', AttendanceRecordViewSet)
router.register(r'follow-ups', MemberFollowUpViewSet)
router.register(r'stats', StatsViewSet, basename='stats')

urlpatterns = [
    path('', include(router.urls)),
]
