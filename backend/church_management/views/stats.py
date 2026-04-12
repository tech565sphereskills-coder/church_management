from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Q, Avg, Sum
from django.db.models.functions import TruncMonth
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator

from .base import viewsets
from ..models import Member, AttendanceRecord, Contribution, Service

class StatsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    # Cache the stats for 5 minutes since they are expensive to calculate
    @method_decorator(cache_page(60 * 5))
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

    @method_decorator(cache_page(60 * 15)) # Longer cache for history
    @action(detail=False, methods=['get'])
    def service_comparison(self, request):
        six_months_ago = timezone.now() - timedelta(days=180)
        
        comparison = (
            AttendanceRecord.objects.filter(marked_at__gte=six_months_ago)
            .annotate(month=TruncMonth('marked_at'))
            .values('month', 'service__service_type')
            .annotate(count=Count('id'))
            .order_by('month')
        )
        
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

    @method_decorator(cache_page(60 * 30))
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

    @method_decorator(cache_page(60 * 30))
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

    @method_decorator(cache_page(60 * 15))
    @action(detail=False, methods=['get'])
    def department_distribution(self, request):
        dist = (
            Member.objects.values('departments__name')
            .annotate(value=Count('id'))
            .order_by('-value')
        )
        data = [{'name': d['departments__name'] or 'None', 'value': d['value']} for d in dist]
        return Response(data)

    @method_decorator(cache_page(60 * 5)) # Dashboard fast refresh
    @action(detail=False, methods=['get'])
    def quick_stats(self, request):
        today = timezone.now().date()
        
        # Optimized combined member stats
        member_stats = Member.objects.aggregate(
            total=Count('id'),
            inactive_count=Count('id', filter=Q(status='inactive')),
            first_timers_count=Count('id', filter=Q(status='first_timer'))
        )
        
        total_members = member_stats['total']
        if total_members == 0:
            return Response({
                'todayAttendance': 0,
                'totalMembers': 0,
                'activeMembers': 0,
                'inactiveMembers': 0,
                'firstTimers': 0,
                'averageAttendance': 0,
                'totalTithes': 0,
                'totalOfferings': 0
            })
            
        today_attendance = AttendanceRecord.objects.filter(marked_at__date=today).count()
        
        # Average attendance across all services
        avg_att = AttendanceRecord.objects.values('service').annotate(count=Count('id')).aggregate(Avg('count'))['count__avg'] or 0
        
        now = timezone.now()
        this_month, this_year = now.month, now.year
        
        # Optimized combined contribution stats
        contribution_stats = Contribution.objects.filter(
            date__month=this_month, 
            date__year=this_year
        ).aggregate(
            tithes=Sum('amount', filter=Q(contribution_type='tithe')),
            offerings=Sum('amount', filter=Q(contribution_type='offering'))
        )
        
        return Response({
            'todayAttendance': today_attendance,
            'totalMembers': total_members,
            'activeMembers': total_members - member_stats['inactive_count'],
            'inactiveMembers': member_stats['inactive_count'],
            'firstTimers': member_stats['first_timers_count'],
            'averageAttendance': round(avg_att),
            'totalTithes': contribution_stats['tithes'] or 0,
            'totalOfferings': contribution_stats['offerings'] or 0,
            'growthRate': 0,
        })
