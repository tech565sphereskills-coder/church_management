from django.utils import timezone
from datetime import timedelta
import pandas as pd
import io
from django.http import HttpResponse
from django.contrib.auth.models import User
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Count, Q, Avg
from django.db.models.functions import TruncMonth
from .models import (
    Profile, Member, Service, AttendanceRecord, MemberFollowUp, 
    Contribution, Department, Child, ChildCheckIn, PrayerRequest, ChurchSettings,
    CommunicationLog, Expense, CalendarEvent
)
from .serializers import (
    AttendanceRecordSerializer, MemberFollowUpSerializer,
    UserSerializer, RegisterSerializer, ContributionSerializer,
    DepartmentSerializer, ProfileSerializer, MemberSerializer,
    ServiceSerializer, ChildSerializer, ChildCheckInSerializer,
    PrayerRequestSerializer, ChurchSettingsSerializer, CommunicationLogSerializer,
    ExpenseSerializer, CalendarEventSerializer
)
from .permissions import (
    IsAdmin, IsFinanceOfficer, IsAttendanceOfficerOrHigher, 
    IsViewerOrHigher, ReadOnly, IsChildrenOfficerOrHigher,
    IsPrayerOfficerOrHigher
)

class RegisterView(viewsets.GenericViewSet, viewsets.mixins.CreateModelMixin):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

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
        if not (hasattr(request.user, 'profile') and request.user.profile.role == 'admin'):
            return Response({'error': 'Permission denied'}, status=403)
            
        profile = self.get_object()
        role = request.data.get('role')
        if role in ['admin', 'attendance_officer', 'viewer']:
            profile.role = role
            profile.save()
            return Response({'status': f'role {role} assigned'})
        return Response({'error': 'invalid role'}, status=400)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def remove_role(self, request, pk=None):
        if not (hasattr(request.user, 'profile') and request.user.profile.role == 'admin'):
            return Response({'error': 'Permission denied'}, status=403)
            
        profile = self.get_object()
        profile.role = 'viewer' # Default to viewer instead of None
        profile.save()
        return Response({'status': 'role reset to viewer'})

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'profile') and user.profile.role == 'admin':
            return self.queryset
        return self.queryset.filter(user=user)

class MemberViewSet(viewsets.ModelViewSet):
    queryset = Member.objects.all()
    serializer_class = MemberSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAttendanceOfficerOrHigher()]
        return [IsViewerOrHigher()]

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

    @action(detail=False, methods=['post'], permission_classes=[IsAdmin])
    def import_members(self, request):
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

    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def export_excel(self, request):
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

class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [IsAttendanceOfficerOrHigher]

class AttendanceRecordViewSet(viewsets.ModelViewSet):
    queryset = AttendanceRecord.objects.all()
    serializer_class = AttendanceRecordSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [IsAttendanceOfficerOrHigher()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [IsViewerOrHigher()]

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
                    'department': r.member.department.name if r.member.department else None
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
            Member.objects.values('department__name')
            .annotate(value=Count('id'))
            .order_by('-value')
        )
        data = [{'name': d['department__name'] or 'None', 'value': d['value']} for d in dist]
        return Response(data)

    @action(detail=False, methods=['get'])
    def quick_stats(self, request):
        total_members = Member.objects.count()
        if total_members == 0:
            return Response({'averageAttendance': 0, 'retentionRate': 0, 'firstTimerConversion': 0, 'inactiveMembers': 0})
            
        inactive = Member.objects.filter(status='inactive').count()
        first_timers = Member.objects.filter(status='first_timer').count()
        
        # Average attendance per service
        avg_att = AttendanceRecord.objects.values('service').annotate(count=Count('id')).aggregate(Avg('count'))['count__avg'] or 0
        
        return Response({
            'averageAttendance': round(avg_att),
            'retentionRate': round(((total_members - inactive) / total_members) * 100),
            'firstTimerConversion': round((first_timers / total_members) * 100) if total_members else 0,
            'inactiveMembers': inactive,
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
        recipients = request.data.get('recipients', [])
        message = request.data.get('message', '')
        
        # Log each message
        for r in recipients:
            CommunicationLog.objects.create(
                channel='sms',
                recipient_name=r.get('name', 'Unknown'),
                recipient_contact=r.get('phone', 'Unknown'),
                message=message,
                sent_by=request.user,
                status='sent' # Simulated success
            )
            
        return Response({'status': f'Simulation: Message sent to {len(recipients)} recipients'})

class CommunicationLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CommunicationLog.objects.all().order_by('-created_at')
    serializer_class = CommunicationLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

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

class ContributionViewSet(viewsets.ModelViewSet):
    queryset = Contribution.objects.all().order_by('-date', '-created_at')
    serializer_class = ContributionSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin | IsFinanceOfficer]

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)

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

    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def export_excel(self, request):
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

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by('-date', '-created_at')
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin | IsFinanceOfficer]

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)

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

    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def export_excel(self, request):
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

class CalendarEventViewSet(viewsets.ModelViewSet):
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

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all().order_by('name')
    serializer_class = DepartmentSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]

class ChildViewSet(viewsets.ModelViewSet):
    queryset = Child.objects.all().order_by('full_name')
    serializer_class = ChildSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsChildrenOfficerOrHigher()]
        return [IsViewerOrHigher()]

class ChildCheckInViewSet(viewsets.ModelViewSet):
    queryset = ChildCheckIn.objects.all().order_by('-checked_in_at')
    serializer_class = ChildCheckInSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'checkout']:
            return [IsChildrenOfficerOrHigher()]
        return [IsViewerOrHigher()]

    def perform_create(self, serializer):
        serializer.save(checked_in_by=self.request.user)

    @action(detail=True, methods=['post'])
    def checkout(self, request, pk=None):
        checkin = self.get_object()
        if checkin.checked_out_at:
            return Response({'error': 'Child already checked out'}, status=400)
        
        checkin.checked_out_at = timezone.now()
        checkin.save()
        return Response({'status': 'checked out successfully'})

class PrayerRequestViewSet(viewsets.ModelViewSet):
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
                serializer.save(member=member)
            except Member.DoesNotExist:
                serializer.save()
        else:
            serializer.save()

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
