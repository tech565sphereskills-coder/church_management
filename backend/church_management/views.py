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

    @action(detail=True, methods=['get'])
    def attendance(self, request, pk=None):
        member = self.get_object()
        records = AttendanceRecord.objects.filter(member=member).select_related('service').order_by('-marked_at')
        total_services = Service.objects.count()
        
        data = []
        for r in records:
            data.append({
                'id': str(r.id),
                'marked_at': r.marked_at,
                'service': {
                    'id': str(r.service.id),
                    'name': r.service.name,
                    'service_date': r.service.service_date,
                    'service_type': r.service.service_type,
                }
            })
        return Response({
            'records': data,
            'total_services': total_services
        })

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
                'id': str(r.id),
                'marked_at': r.marked_at,
                'members': {
                    'id': str(r.member.id),
                    'full_name': r.member.full_name,
                    'department': r.member.department
                }
            })
        return Response(data)

    @action(detail=False, methods=['get'])
    def history(self, request):
        # Placeholder for complex filtering
        records = AttendanceRecord.objects.select_related('member', 'service').order_by('-marked_at')
        data = []
        for r in records:
            data.append({
                'id': str(r.id),
                'marked_at': r.marked_at,
                'member_id': str(r.member.id),
                'member_name': r.member.full_name,
                'service_date': r.service.service_date,
                'service_type': r.service.service_type,
                'service_name': r.service.name,
            })
        
        # Simple stats
        stats = {
            'totalServices': Service.objects.count(),
            'totalAttendance': AttendanceRecord.objects.count(),
            'averageAttendance': 0,
            'attendanceByType': {}
        }
        
        return Response({
            'records': data,
            'stats': stats
        })

    @action(detail=False, methods=['post'])
    def mark(self, request):
        member_id = request.data.get('member_id')
        service_id = request.data.get('service_id')
        timestamp = request.data.get('timestamp')
        
        try:
            member = Member.objects.get(id=member_id)
            service = Service.objects.get(id=service_id)
            AttendanceRecord.objects.create(
                member=member,
                service=service,
                marked_by=request.user,
                marked_at=timestamp or timezone.now()
            )
            return Response({'status': 'marked'}, status=201)
        except Exception as e:
            return Response({'error': str(e)}, status=400)

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
            'weeklyAverage': round(weekly_attendance / 7) if weekly_attendance else 0
        })

    @action(detail=False, methods=['get'])
    def service_comparison(self, request):
        # Mock data/Simple implementation
        return Response([
            {'month': 'Jan', 'sunday': 45, 'midweek': 30, 'special': 10},
            {'month': 'Feb', 'sunday': 50, 'midweek': 35, 'special': 5},
        ])

    @action(detail=False, methods=['get'])
    def monthly_attendance(self, request):
        return Response([
            {'date': '2024-01', 'attendance': 120},
            {'date': '2024-02', 'attendance': 145},
        ])

    @action(detail=False, methods=['get'])
    def member_growth(self, request):
        return Response([
            {'month': 'Jan', 'totalMembers': 100, 'newMembers': 5},
            {'month': 'Feb', 'totalMembers': 108, 'newMembers': 8},
        ])

    @action(detail=False, methods=['get'])
    def department_distribution(self, request):
        return Response([
            {'name': 'Choir', 'value': 25},
            {'name': 'Ushering', 'value': 15},
        ])

    @action(detail=False, methods=['get'])
    def quick_stats(self, request):
        return Response({
            'averageAttendance': 42,
            'retentionRate': 85,
            'firstTimerConversion': 40,
            'inactiveMembers': 12,
        })

class SMSViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def templates(self, request):
        return Response([])

    @action(detail=False, methods=['get'])
    def messages(self, request):
        return Response([])

    @action(detail=False, methods=['post'])
    def send(self, request):
        return Response({'status': 'sent'})

class SettingsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        return Response({
            'id': '1',
            'church_name': 'RCCG Sanctuary',
            'address': '',
            'contact_email': '',
            'attendance_reminders': True,
            'new_member_alerts': True,
            'weekly_reports': True,
        })

    def partial_update(self, request):
        return Response({'status': 'updated'})
