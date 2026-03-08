from django.utils import timezone
from datetime import timedelta
import pandas as pd
import pyotp
import qrcode
import base64
import io
from io import BytesIO
from django.http import HttpResponse
from django.contrib.auth.models import User
from rest_framework import viewsets, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.db.models import Count, Q, Avg, Sum
from django.db.models.functions import TruncMonth
from .models import (
    Role, Profile, Member, Service, AttendanceRecord, MemberFollowUp, 
    Contribution, Department, Child, ChildCheckIn, PrayerRequest, ChurchSettings,
    CommunicationLog, Expense, CalendarEvent, AuditLog, SMSTemplate, Budget, Pledge,
    CheckInQueue, Family, InventoryItem
)
from .serializers import (
    AttendanceRecordSerializer, MemberFollowUpSerializer,
    UserSerializer, RegisterSerializer, ContributionSerializer,
    DepartmentSerializer, ProfileSerializer, MemberSerializer,
    ServiceSerializer, ChildSerializer, ChildCheckInSerializer,
    PrayerRequestSerializer, ChurchSettingsSerializer, CommunicationLogSerializer,
    ExpenseSerializer, CalendarEventSerializer, AuditLogSerializer,
    SMSTemplateSerializer, BudgetSerializer, PledgeSerializer,
    CheckInQueueSerializer, FamilySerializer, InventoryItemSerializer
)
from .permissions import (
    IsAdmin, IsFinanceOfficer, IsAttendanceOfficerOrHigher, 
    IsViewerOrHigher, ReadOnly, IsChildrenOfficerOrHigher,
    IsPrayerOfficerOrHigher
)

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

    def partial_update(self, request, *args, **kwargs):
        try:
            response = super().partial_update(request, *args, **kwargs)
            profile = self.get_object()
            log_activity(
                request.user, 
                'update_permissions_attempt', 
                'Profile', 
                profile.id, 
                profile.user.username,
                details={'permissions': request.data, 'status_code': response.status_code}
            )
            return response
        except Exception as e:
            log_activity(
                request.user,
                'update_permissions_error',
                'Profile',
                kwargs.get('pk', 'unknown'),
                'unknown',
                details={'error': str(e), 'data': request.data}
            )
            raise e

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def assign_role(self, request, pk=None):
        if not (hasattr(request.user, 'profile') and request.user.profile.role == 'admin'):
            return Response({'error': 'Permission denied'}, status=403)
            
        profile = self.get_object()
        role = request.data.get('role')
        if role in Role.values:
            profile.role = role
            
            # Reset all permissions first
            profile.can_manage_members = False
            profile.can_manage_attendance = False
            profile.can_manage_financials = False
            profile.can_manage_departments = False
            profile.can_manage_children = False
            profile.can_manage_prayer_requests = False
            profile.can_manage_calendar = False
            profile.can_view_reports = False
            profile.can_manage_settings = False
            
            # Set defaults based on role
            if role == Role.ADMIN:
                profile.can_manage_members = True
                profile.can_manage_attendance = True
                profile.can_manage_financials = True
                profile.can_manage_departments = True
                profile.can_manage_children = True
                profile.can_manage_prayer_requests = True
                profile.can_manage_calendar = True
                profile.can_view_reports = True
                profile.can_manage_settings = True
            elif role == Role.ATTENDANCE_OFFICER:
                profile.can_manage_attendance = True
                profile.can_manage_members = True
                profile.can_view_reports = True
            elif role == Role.FINANCE_OFFICER:
                profile.can_manage_financials = True
                profile.can_view_reports = True
            elif role == Role.CHILDREN_OFFICER:
                profile.can_manage_children = True
                profile.can_manage_members = True
                profile.can_view_reports = True
            elif role == Role.PRAYER_OFFICER:
                profile.can_manage_prayer_requests = True
                profile.can_view_reports = True
            elif role == Role.HOD:
                profile.can_manage_attendance = True
                profile.can_manage_members = True
                profile.can_view_reports = True
            elif role == Role.VIEWER:
                profile.can_view_reports = True
                
            profile.save()
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        return Response({'error': 'invalid role'}, status=400)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def remove_role(self, request, pk=None):
        if not (hasattr(request.user, 'profile') and request.user.profile.role == 'admin'):
            return Response({'error': 'Permission denied'}, status=403)
            
        profile = self.get_object()
        profile.role = None # Set to None/Pending
        profile.save()
        serializer = self.get_serializer(profile)
        return Response(serializer.data)

    def perform_destroy(self, instance):
        user = instance.user
        instance_id = instance.id
        username = user.username
        
        # Log before deletion
        log_activity(
            self.request.user, 
            AuditLog.Action.DELETE, 
            'Profile/User', 
            instance_id, 
            f"User: {username}"
        )
        
        # User.CASCADE will delete the Profile, but we delete from ProfileViewSet
        # so we delete the User object directly.
        user.delete()

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'profile') and user.profile.role == 'admin':
            return Profile.objects.all()
        return Profile.objects.filter(user=user)

    def get_permissions(self):
        if self.action == 'destroy':
            return [IsAdmin()]
        return super().get_permissions()

class MemberViewSet(AuditableModelViewSetMixin, viewsets.ModelViewSet):
    queryset = Member.objects.all()
    serializer_class = MemberSerializer
    
    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Member.objects.none()
        
        profile = getattr(user, 'profile', None)
        if profile and profile.role == Role.HOD and profile.member:
            dept_ids = profile.member.headed_departments.values_list('id', flat=True)
            return Member.objects.filter(department_id__in=dept_ids)
            
        return Member.objects.all()
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'import_members', 'export_excel', 'import_members_v2']:
            return [IsAttendanceOfficerOrHigher()]
        return [IsViewerOrHigher()]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        log_activity(
            request.user, 
            'view_details', 
            instance.__class__.__name__, 
            instance.id, 
            str(instance)
        )
        return super().retrieve(request, *args, **kwargs)

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

    @action(detail=False, methods=['post'], permission_classes=[IsAttendanceOfficerOrHigher])
    def import_members(self, request):
        log_activity(request.user, AuditLog.Action.EXPORT, 'Member', None, 'Member List Import')
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file provided'}, status=400)
            
        try:
            if file.name.endswith('.csv'):
                df = pd.read_csv(file)
            elif file.name.endswith(('.xls', '.xlsx')):
                df = pd.read_excel(file)
            else:
                return Response({'error': 'Unsupported file format'}, status=400)
                
            required_fields = ['full_name', 'email']
            for field in required_fields:
                if field not in df.columns:
                    return Response({'error': f'Missing required column: {field}'}, status=400)
            
            created_count = 0
            for _, row in df.iterrows():
                # Basic cleaned data
                data = {
                    'full_name': str(row['full_name']),
                    'email': str(row['email']) if pd.notna(row['email']) else None,
                    'phone': str(row['phone']) if 'phone' in df.columns and pd.notna(row['phone']) else None,
                    'address': str(row['address']) if 'address' in df.columns and pd.notna(row['address']) else None,
                    'status': str(row['status']).lower() if 'status' in df.columns and pd.notna(row['status']) else 'active',
                }
                
                # Check for existing by email if provided
                if data['email']:
                    member, created = Member.objects.get_or_create(email=data['email'], defaults=data)
                    if created: created_count += 1
                else:
                    Member.objects.create(**data)
                    created_count += 1
                    
            return Response({'status': f'Successfully imported {created_count} members'})
        except Exception as e:
            return Response({'error': str(e)}, status=400)

    @action(detail=False, methods=['get'], permission_classes=[IsAttendanceOfficerOrHigher])
    def export_excel(self, request):
        log_activity(request.user, AuditLog.Action.EXPORT, 'Member', None, 'Member List Export')
        members = Member.objects.all().values()
        df = pd.DataFrame(list(members))
        
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Members')
        
        output.seek(0)
        response = HttpResponse(
            output.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename=members_export.xlsx'
        return response

class ServiceViewSet(AuditableModelViewSetMixin, viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [IsAttendanceOfficerOrHigher]

class AttendanceRecordViewSet(AuditableModelViewSetMixin, viewsets.ModelViewSet):
    queryset = AttendanceRecord.objects.all()
    serializer_class = AttendanceRecordSerializer
    
    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return AttendanceRecord.objects.none()
        
        profile = getattr(user, 'profile', None)
        if profile and profile.role == Role.HOD and profile.member:
            dept_ids = profile.member.headed_departments.values_list('id', flat=True)
            return AttendanceRecord.objects.filter(member__departments__id__in=dept_ids).distinct()
            
        return AttendanceRecord.objects.all()

    def get_permissions(self):
        if self.action == 'create':
            return [IsAttendanceOfficerOrHigher()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [IsViewerOrHigher()]

    def perform_create(self, serializer):
        instance = serializer.save(marked_by=self.request.user)
        log_activity(
            self.request.user, 
            AuditLog.Action.CREATE, 
            instance.__class__.__name__, 
            instance.id, 
            str(instance)
        )

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
            depts = r.member.departments.all()
            data.append({
                'id': str(r.id),
                'marked_at': r.marked_at,
                'members': {
                    'id': str(r.member.id),
                    'full_name': r.member.full_name,
                    'department': depts[0].name if depts.exists() else None
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
        
        total_services = Service.objects.count()
        total_attendance = AttendanceRecord.objects.count()
        
        # Simple stats
        stats = {
            'totalServices': total_services,
            'totalAttendance': total_attendance,
            'averageAttendance': round(total_attendance / total_services) if total_services else 0,
            'attendanceByType': dict(
                AttendanceRecord.objects.values('service__service_type')
                .annotate(count=Count('id'))
                .values_list('service__service_type', 'count')
            )
        }
        
        return Response({
            'records': data,
            'stats': stats
        })

    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def export_excel(self, request):
        records = AttendanceRecord.objects.select_related('member', 'service').all()
        data = []
        for r in records:
            data.append({
                'Date': r.marked_at,
                'Member': r.member.full_name,
                'Service': r.service.name,
                'Service Date': r.service.service_date,
            })
            
        df = pd.DataFrame(data)
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Attendance')
            
        output.seek(0)
        response = HttpResponse(
            output.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename=attendance_export.xlsx'
        return response

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
    permission_classes = [IsAttendanceOfficerOrHigher]

    @action(detail=False, methods=['post'])
    def calculate(self, request):
        MemberFollowUp.recalculate()
        return Response({'status': 'calculation completed'})

    def get_queryset(self):
        return self.queryset.filter(needs_follow_up=True)

class StatsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, IsViewerOrHigher]

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
        # Last 6 months service comparison
        six_months_ago = timezone.now() - timedelta(days=180)
        
        comparison = (
            AttendanceRecord.objects.filter(marked_at__gte=six_months_ago)
            .annotate(month=TruncMonth('marked_at'))
            .values('month', 'service__service_type')
            .annotate(count=Count('id'))
            .order_by('month')
        )
        
        # Format for frontend
        data_map = {}
        for entry in comparison:
            m_str = entry['month'].strftime('%b')
            if m_str not in data_map:
                data_map[m_str] = {'month': m_str, 'sunday': 0, 'midweek': 0, 'special': 0}
            
            s_type = entry['service__service_type']
            if s_type == 'sunday_service':
                data_map[m_str]['sunday'] += entry['count']
            elif s_type == 'midweek_service':
                data_map[m_str]['midweek'] += entry['count']
            elif s_type == 'special_program':
                data_map[m_str]['special'] += entry['count']
                
        return Response(list(data_map.values()))

    @action(detail=False, methods=['get'])
    def monthly_attendance(self, request):
        one_year_ago = timezone.now() - timedelta(days=365)
        stats = (
            AttendanceRecord.objects.filter(marked_at__gte=one_year_ago)
            .annotate(month=TruncMonth('marked_at'))
            .values('month')
            .annotate(attendance=Count('id'))
            .order_by('month')
        )
        data = [{'date': s['month'].strftime('%Y-%m'), 'attendance': s['attendance']} for s in stats]
        return Response(data)

    @action(detail=False, methods=['get'])
    def member_growth(self, request):
        one_year_ago = timezone.now() - timedelta(days=365)
        growth = (
            Member.objects.filter(created_at__gte=one_year_ago)
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(newMembers=Count('id'))
            .order_by('month')
        )
        
        total = Member.objects.filter(created_at__lt=one_year_ago).count()
        data = []
        for g in growth:
            total += g['newMembers']
            data.append({
                'month': g['month'].strftime('%b'),
                'totalMembers': total,
                'newMembers': g['newMembers']
            })
        return Response(data)

    @action(detail=False, methods=['get'])
    def department_distribution(self, request):
        dist = (
            Member.objects.values('departments__name')
            .annotate(value=Count('id'))
            .order_by('-value')
        )
        data = [{'name': d['departments__name'] or 'None', 'value': d['value']} for d in dist]
        return Response(data)

    @action(detail=False, methods=['get'])
    def quick_stats(self, request):
        today = timezone.now().date()
        today_attendance = AttendanceRecord.objects.filter(marked_at__date=today).count()
        total_members = Member.objects.count()
        if total_members == 0:
            return Response({
                'todayAttendance': today_attendance,
                'totalMembers': 0,
                'activeMembers': 0,
                'inactiveMembers': 0,
                'firstTimers': 0,
                'averageAttendance': 0,
                'totalTithes': 0,
                'totalOfferings': 0
            })
            
        inactive = Member.objects.filter(status='inactive').count()
        first_timers = Member.objects.filter(status='first_timer').count()
        
        # Average attendance per service
        avg_att = AttendanceRecord.objects.values('service').annotate(count=Count('id')).aggregate(Avg('count'))['count__avg'] or 0
        
        # Financial totals for current month
        now = timezone.now()
        this_month = now.month
        this_year = now.year
        
        total_tithes = Contribution.objects.filter(
            contribution_type='tithe', 
            date__month=this_month, 
            date__year=this_year
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        total_offerings = Contribution.objects.filter(
            contribution_type='offering', 
            date__month=this_month, 
            date__year=this_year
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        return Response({
            'todayAttendance': today_attendance,
            'totalMembers': total_members,
            'activeMembers': total_members - inactive,
            'inactiveMembers': inactive,
            'firstTimers': first_timers,
            'averageAttendance': round(avg_att),
            'totalTithes': total_tithes,
            'totalOfferings': total_offerings,
            'growthRate': 0, # Placeholder for growth calculation
        })

class SMSTemplateViewSet(viewsets.ModelViewSet):
    queryset = SMSTemplate.objects.all().order_by('-created_at')
    serializer_class = SMSTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]

class SMSViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def messages(self, request):
        logs = CommunicationLog.objects.filter(channel='sms').order_by('-created_at')
        serializer = CommunicationLogSerializer(logs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def status(self, request):
        # In a real app, this would check if the SMS provider (Twilio/etc) is reachable
        return Response({
            'connected': True,
            'provider': 'Simulated Provider',
            'balance': 'Unlimited'
        })

    @action(detail=False, methods=['post'])
    def send(self, request):
        recipients = request.data.get('recipients', [])
        message = request.data.get('message', '')
        
        if not recipients or not message:
            return Response({'error': 'Recipients and message are required'}, status=400)

        # Log each message
        for r in recipients:
            CommunicationLog.objects.create(
                channel='sms',
                recipient_name=r.get('name', 'Unknown'),
                recipient_contact=r.get('phone', 'Unknown'),
                message=message,
                sent_by=request.user,
                status='sent' # Simulated success for now, but logged
            )
            
        return Response({'status': f'Success: Message queued for {len(recipients)} recipients'})

class CommunicationLogViewSet(AuditableModelViewSetMixin, viewsets.ModelViewSet):
    queryset = CommunicationLog.objects.all().order_by('-created_at')
    serializer_class = CommunicationLogSerializer
    permission_classes = [IsAdmin]

class SettingsViewSet(viewsets.ViewSet):
    permission_classes = [IsAdmin]

    def list(self, request):
        settings, created = ChurchSettings.objects.get_or_create(id=1)
        serializer = ChurchSettingsSerializer(settings)
        return Response(serializer.data)

    def partial_update(self, request, pk=None):
        try:
            settings, created = ChurchSettings.objects.get_or_create(id=1)
            serializer = ChurchSettingsSerializer(settings, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ContributionViewSet(AuditableModelViewSetMixin, viewsets.ModelViewSet):
    queryset = Contribution.objects.all().order_by('-date', '-created_at')
    serializer_class = ContributionSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin | IsFinanceOfficer]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        log_activity(
            request.user, 
            'view_details', 
            instance.__class__.__name__, 
            instance.id, 
            str(instance)
        )
        return super().retrieve(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)
        # Audit logging is handled by AuditableModelViewSetMixin.perform_create
        super().perform_create(serializer)

    def perform_update(self, serializer):
        # Audit logging is handled by AuditableModelViewSetMixin.perform_update
        super().perform_update(serializer)

    def perform_destroy(self, instance):
        # Audit logging is handled by AuditableModelViewSetMixin.perform_destroy
        super().perform_destroy(instance)

    @action(detail=True, methods=['get'])
    def generate_receipt(self, request, pk=None):
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.units import inch
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet
        
        contribution = self.get_object()
        settings, _ = ChurchSettings.objects.get_or_create(id=1)
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        
        # --- Professional RCCG Branding ---
        # Header Background
        p.setFillColor(colors.HexColor("#0f172a")) # Slate 900
        p.rect(0, height - 1.5*inch, width, 1.5*inch, fill=1)
        
        # Church Name
        p.setFillColor(colors.white)
        p.setFont("Helvetica-Bold", 20)
        p.drawString(0.5*inch, height - 0.7*inch, settings.church_name.upper())
        
        # Motto/Subtitle (Optional placeholder)
        p.setFont("Helvetica", 10)
        p.drawString(0.5*inch, height - 0.9*inch, "Official Treasury Division")
        
        # Receipt Label
        p.setFont("Helvetica-Bold", 40)
        p.setStrokeColor(colors.white)
        p.setFillColor(colors.white)
        p.drawRightString(width - 0.5*inch, height - 0.8*inch, "RECEIPT")
        
        # --- Info Section ---
        p.setFillColor(colors.black)
        p.setFont("Helvetica-Bold", 12)
        p.drawString(0.5*inch, height - 2.0*inch, "RECEIPT TO:")
        
        p.setFont("Helvetica", 11)
        p.drawString(0.5*inch, height - 2.2*inch, contribution.member.full_name if contribution.member else "Anonymous Contributor")
        if contribution.member:
            p.drawString(0.5*inch, height - 2.4*inch, f"ID: {str(contribution.member.id)[:8].upper()}")
            if contribution.member.email:
                p.drawString(0.5*inch, height - 2.6*inch, contribution.member.email)
        
        # Receipt Details Table-like box
        p.setFont("Helvetica-Bold", 12)
        p.drawRightString(width - 0.5*inch, height - 2.0*inch, "RECEIPT DETAILS:")
        p.setFont("Helvetica", 11)
        p.drawRightString(width - 0.5*inch, height - 2.2*inch, f"Number: #{str(contribution.id)[:8].upper()}")
        p.drawRightString(width - 0.5*inch, height - 2.4*inch, f"Date: {contribution.date}")
        p.drawRightString(width - 0.5*inch, height - 2.6*inch, f"Method: {contribution.payment_method.replace('_', ' ').title()}")
        
        # --- Main content box ---
        p.setStrokeColor(colors.HexColor("#e2e8f0")) # Slate 200
        p.setFillColor(colors.HexColor("#f8fafc")) # Slate 50
        p.rect(0.5*inch, 4.5*inch, width - 1*inch, 2.5*inch, fill=1)
        
        p.setFillColor(colors.black)
        p.setFont("Helvetica-Bold", 14)
        p.drawString(0.8*inch, 6.5*inch, "DESCRIPTION")
        p.drawRightString(width - 0.8*inch, 6.5*inch, "AMOUNT")
        p.line(0.8*inch, 6.3*inch, width - 0.8*inch, 6.3*inch)
        
        p.setFont("Helvetica", 12)
        p.drawString(0.8*inch, 5.8*inch, contribution.contribution_type.replace('_', ' ').title())
        p.drawRightString(width - 0.8*inch, 5.8*inch, f"NGN {contribution.amount:,.2f}")
        
        if contribution.notes:
            p.setFont("Helvetica-Oblique", 10)
            p.setFillColor(colors.grey)
            p.drawString(0.8*inch, 5.5*inch, f"Note: {contribution.notes}")
        
        # --- Totals ---
        p.setFillColor(colors.black)
        p.line(width - 3*inch, 5.0*inch, width - 0.8*inch, 5.0*inch)

class FamilyViewSet(AuditableModelViewSetMixin, viewsets.ModelViewSet):
    queryset = Family.objects.all()
    serializer_class = FamilySerializer
    permission_classes = [IsViewerOrHigher]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return super().get_permissions()

class InventoryItemViewSet(AuditableModelViewSetMixin, viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer
    permission_classes = [IsAdmin | IsFinanceOfficer]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin | IsFinanceOfficer]
        return [IsViewerOrHigher()]
        p.setFont("Helvetica-Bold", 16)
        p.drawString(width - 3*inch, 4.7*inch, "TOTAL")
        p.drawRightString(width - 0.8*inch, 4.7*inch, f"NGN {contribution.amount:,.2f}")
        
        # --- Footer ---
        p.setFont("Helvetica-Bold", 12)
        p.drawString(0.5*inch, 3.5*inch, "Authorized Signature")
        p.line(0.5*inch, 3.7*inch, 2.5*inch, 3.7*inch)
        
        p.setFont("Helvetica-Oblique", 10)
        p.drawCentredString(width/2, 2.5*inch, "This is an electronically generated receipt. No signature required.")
        p.setFont("Helvetica-Bold", 10)
        p.drawCentredString(width/2, 2.3*inch, f"God bless you for your {contribution.contribution_type.replace('_', ' ')}.")
        
        # Church Footer Info
        p.setFillColor(colors.grey)
        p.setFont("Helvetica", 9)
        p.drawCentredString(width/2, 1.0*inch, f"{settings.church_name} | {settings.address or ''}")
        if settings.contact_email:
            p.drawCentredString(width/2, 0.8*inch, f"Email: {settings.contact_email}")
            
        p.showPage()
        p.save()
        
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename=receipt_{contribution.id}.pdf'
        return response


    @action(detail=False, methods=['get'])
    def summary(self, request):
        from django.db.models import Sum
        month = request.query_params.get('month')
        year = request.query_params.get('year')
        
        queryset = self.get_queryset()
        if month and year:
            queryset = queryset.filter(date__month=month, date__year=year)
            
        summary_data = queryset.values('contribution_type').annotate(total=Sum('amount'))
        return Response(list(summary_data))

    @action(detail=False, methods=['get'], permission_classes=[IsAdmin | IsFinanceOfficer])
    def export_excel(self, request):
        log_activity(request.user, AuditLog.Action.EXPORT, 'Contribution', None, 'Contribution Export')
        contributions = Contribution.objects.select_related('member', 'recorded_by').all()
        data = []
        for c in contributions:
            data.append({
                'Date': c.date,
                'Member': c.member.full_name if c.member else 'Anonymous',
                'Type': c.contribution_type,
                'Amount': c.amount,
                'Note': c.notes,
                'Recorded By': c.recorded_by.username,
            })
            
        df = pd.DataFrame(data)
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Contributions')
            
        output.seek(0)
        response = HttpResponse(
            output.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename=financials_export.xlsx'
        return response

class ExpenseViewSet(AuditableModelViewSetMixin, viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by('-date', '-created_at')
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin | IsFinanceOfficer]

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)
        super().perform_create(serializer)

    def perform_update(self, serializer):
        super().perform_update(serializer)

    def perform_destroy(self, instance):
        super().perform_destroy(instance)


    @action(detail=False, methods=['get'])
    def summary(self, request):
        from django.db.models import Sum
        month = request.query_params.get('month')
        year = request.query_params.get('year')
        
        queryset = self.get_queryset()
        if month and year:
            queryset = queryset.filter(date__month=month, date__year=year)
            
        summary_data = queryset.values('category').annotate(total=Sum('amount'))
        return Response(list(summary_data))

    @action(detail=False, methods=['get'], permission_classes=[IsAdmin | IsFinanceOfficer])
    def export_excel(self, request):
        log_activity(request.user, AuditLog.Action.EXPORT, 'Expense', None, 'Expense Export')
        expenses = self.get_queryset().select_related('recorded_by').all()
        data = []
        for e in expenses:
            data.append({
                'Date': e.date,
                'Description': e.description,
                'Category': e.category,
                'Amount': e.amount,
                'Note': e.notes,
                'Recorded By': e.recorded_by.username if e.recorded_by else 'Unknown',
            })
            
        df = pd.DataFrame(data)
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Expenses')
            
        output.seek(0)
        response = HttpResponse(
            output.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename=expenses_export.xlsx'
        return response

class CalendarEventViewSet(AuditableModelViewSetMixin, viewsets.ModelViewSet):
    queryset = CalendarEvent.objects.all().order_by('start_time')
    serializer_class = CalendarEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsAdmin()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)

    @action(detail=False, methods=['get'])
    def unified_feed(self, request):
        """Returns both CalendarEvents and Services in a single feed."""
        start_date = request.query_params.get('start')
        end_date = request.query_params.get('end')
        
        events_qs = self.get_queryset()
        services_qs = Service.objects.all()
        
        if start_date and end_date:
            events_qs = events_qs.filter(start_time__date__range=[start_date, end_date])
            services_qs = services_qs.filter(service_date__range=[start_date, end_date])
            
        events = CalendarEventSerializer(events_qs, many=True).data
        # Map Service objects to a similar structure
        services = []
        for s in services_qs:
            services.append({
                'id': f"service-{s.id}",
                'title': s.name,
                'description': s.description,
                'event_type': 'service',
                'start_time': f"{s.service_date}T08:00:00Z", # Default time for Sunday/Midweek
                'end_time': f"{s.service_date}T10:00:00Z",
                'location': 'Main Sanctuary',
                'is_service_model': True
            })
            
        return Response(events + services)

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    filterset_fields = ['user', 'action', 'model_name']

    def get_queryset(self):
        return AuditLog.objects.all().order_by('-timestamp')

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

    def perform_create(self, serializer):
        instance = serializer.save(checked_in_by=self.request.user)
        log_activity(
            self.request.user, 
            AuditLog.Action.CREATE, 
            instance.__class__.__name__, 
            instance.id, 
            str(instance)
        )

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
        if self.action in ['update', 'partial_update', 'destroy', 'mark_as_prayed', 'mark_as_answered']:
            return [IsPrayerOfficerOrHigher()]
        return [IsPrayerOfficerOrHigher()] # Only prayer team can see the list

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            # If logged in, try to link to member profile if exists
            try:
                member = Member.objects.get(email=self.request.user.email)
                instance = serializer.save(member=member)
            except Member.DoesNotExist:
                instance = serializer.save()
        else:
            instance = serializer.save()
        
        log_activity(
            self.request.user if self.request.user.is_authenticated else None, 
            AuditLog.Action.CREATE, 
            'PrayerRequest', 
            instance.id, 
            f"Prayer: {instance.requester_name}"
        )

    @action(detail=True, methods=['post'])
    def mark_as_prayed(self, request, pk=None):
        request_obj = self.get_object()
        request_obj.status = 'praying'
        request_obj.save()
        return Response({'status': 'marked as praying'})

    @action(detail=True, methods=['post'])
    def mark_as_answered(self, request, pk=None):
        request_obj = self.get_object()
        request_obj.status = 'answered'
        request_obj.save()
        return Response({'status': 'marked as answered'})

class BudgetViewSet(AuditableModelViewSetMixin, viewsets.ModelViewSet):
    queryset = Budget.objects.all().order_by('-year', '-month')
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin | IsFinanceOfficer]

class PledgeViewSet(AuditableModelViewSetMixin, viewsets.ModelViewSet):
    queryset = Pledge.objects.all().order_by('-target_date')
    serializer_class = PledgeSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin | IsFinanceOfficer]
class CheckInQueueViewSet(viewsets.ModelViewSet):
    queryset = CheckInQueue.objects.all()
    serializer_class = CheckInQueueSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [IsAttendanceOfficerOrHigher()]

    def perform_create(self, serializer):
        phone_number = self.request.data.get('phone_number')
        # Try to find a member with this phone number
        member = Member.objects.filter(phone=phone_number).first()
        
        # Get latest active service
        today = timezone.now().date()
        service = Service.objects.filter(service_date=today).order_by('-created_at').first()
        
        if not service:
            # Fallback to absolute latest service if none today
            service = Service.objects.all().order_by('-service_date', '-id').first()

        serializer.save(member=member, service=service)
        
        # Log public check-in
        log_activity(
            None, 
            'public_check_in_request', 
            'CheckInQueue', 
            None, 
            f"Phone: {phone_number}",
            details={'member_found': member.id if member else None}
        )

    @action(detail=True, methods=['post'], permission_classes=[IsAttendanceOfficerOrHigher])
    def confirm(self, request, pk=None):
        queue_item = self.get_object()
        if queue_item.status != 'pending':
            return Response({'error': 'Already processed'}, status=400)

        # Check for phone number update if provided
        new_phone = request.data.get('phone_number')
        member = queue_item.member

        if member:
            if new_phone and new_phone != member.phone:
                # Update member's phone number
                old_phone = member.phone
                member.phone = new_phone
                member.save()
                log_activity(
                    request.user,
                    AuditLog.Action.UPDATE,
                    'Member',
                    member.id,
                    member.full_name,
                    details={'old_phone': old_phone, 'new_phone': new_phone}
                )

            # Mark attendance
            AttendanceRecord.objects.get_or_create(
                member=member,
                service=queue_item.service,
                defaults={'marked_by': request.user}
            )
            
            queue_item.status = 'confirmed'
            queue_item.save()
            
            return Response(self.get_serializer(queue_item).data)
        
        return Response({'error': 'No member linked to this request'}, status=400)

    @action(detail=True, methods=['post'], permission_classes=[IsAttendanceOfficerOrHigher])
    def reject(self, request, pk=None):
        queue_item = self.get_object()
        queue_item.status = 'rejected'
        queue_item.save()
        return Response(self.get_serializer(queue_item).data)
class TwoFactorViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'])
    def enable(self, request):
        profile = request.user.profile
        if profile.is_two_factor_enabled:
            return Response({'error': '2FA is already enabled'}, status=400)
            
        if not profile.two_factor_secret:
            profile.two_factor_secret = pyotp.random_base32()
            profile.save()
            
        totp = pyotp.TOTP(profile.two_factor_secret)
        provisioning_url = totp.provisioning_uri(
            name=request.user.email,
            issuer_name="RCCG Sanctuary"
        )
        
        # Generate QR Code as base64
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(provisioning_url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        qr_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        return Response({
            'qr_code': f"data:image/png;base64,{qr_base64}",
            'secret': profile.two_factor_secret
        })

    @action(detail=False, methods=['post'])
    def verify(self, request):
        token = request.data.get('token')
        profile = request.user.profile
        
        if not profile.two_factor_secret:
            return Response({'error': '2FA not initialized'}, status=400)
            
        totp = pyotp.TOTP(profile.two_factor_secret)
        if totp.verify(token):
            profile.is_two_factor_enabled = True
            profile.save()
            log_activity(request.user, AuditLog.Action.UPDATE, 'Profile', profile.id, '2FA Enabled')
            return Response({'status': '2FA enabled successfully'})
        else:
            return Response({'error': 'Invalid token'}, status=400)

    @action(detail=False, methods=['post'])
    def disable(self, request):
        token = request.data.get('token')
        profile = request.user.profile
        
        if not profile.is_two_factor_enabled:
            return Response({'error': '2FA is not enabled'}, status=400)
            
        totp = pyotp.TOTP(profile.two_factor_secret)
        if totp.verify(token):
            profile.is_two_factor_enabled = False
            # We keep the secret for now in case they want to re-enable, 
            # or we could clear it for full reset.
            profile.save()
            log_activity(request.user, AuditLog.Action.UPDATE, 'Profile', profile.id, '2FA Disabled')
            return Response({'status': '2FA disabled successfully'})
        else:
            return Response({'error': 'Invalid token'}, status=400)

        return Response({
            'is_enabled': request.user.profile.is_two_factor_enabled
        })

class TwoFactorTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # First, standard password validation
        try:
            data = super().validate(attrs)
        except Exception as e:
            raise e
            
        profile = getattr(self.user, 'profile', None)
        if profile and profile.is_two_factor_enabled:
            token = self.context['request'].data.get('two_factor_token')
            if not token:
                # Signal to frontend that 2FA is required
                raise serializers.ValidationError({
                    'two_factor_required': True,
                    'detail': '2FA token required'
                }, code='2fa_required')
            
            totp = pyotp.TOTP(profile.two_factor_secret)
            if not totp.verify(token):
                raise serializers.ValidationError({
                    'detail': 'Invalid 2FA token'
                }, code='invalid_2fa')
                
        return data

class TwoFactorTokenObtainPairView(TokenObtainPairView):
    serializer_class = TwoFactorTokenObtainPairSerializer
