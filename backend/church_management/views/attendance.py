from django.utils import timezone
from datetime import timedelta
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count
import pandas as pd
import io
from django.http import HttpResponse

from .base import viewsets, AuditableModelViewSetMixin, log_activity, StandardResultsSetPagination
from ..models import AttendanceRecord, Service, Member, MemberFollowUp, Role
from ..serializers import AttendanceRecordSerializer, ServiceSerializer, MemberFollowUpSerializer
from ..permissions import IsAttendanceOfficerOrHigher, IsAdmin, IsViewerOrHigher

class ServiceViewSet(AuditableModelViewSetMixin, viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [IsAttendanceOfficerOrHigher]

class AttendanceRecordViewSet(AuditableModelViewSetMixin, viewsets.ModelViewSet):
    queryset = AttendanceRecord.objects.all().order_by('-marked_at')
    serializer_class = AttendanceRecordSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['member__surname', 'member__firstname', 'service__name']
    ordering_fields = ['marked_at']
    ordering = ['-marked_at']
    
    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return AttendanceRecord.objects.none()
        
        # Optimized with select_related
        queryset = AttendanceRecord.objects.all().select_related('member', 'service')
        
        profile = getattr(user, 'profile', None)
        if profile and profile.role == Role.HOD and profile.member:
            dept_ids = profile.member.headed_departments.values_list('id', flat=True)
            return queryset.filter(member__departments__id__in=dept_ids).distinct()
            
        return queryset

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
        records = self.get_queryset().order_by('-marked_at')[:10]
        data = []
        for r in records:
            data.append({
                'id': r.id,
                'marked_at': r.marked_at,
                'member_name': r.member.full_name,
                'member_photo': r.member.avatar_url if hasattr(r.member, 'avatar_url') else None,
            })
        return Response(data)

    @action(detail=False, methods=['get'])
    def history(self, request):
        queryset = self.get_queryset()
        queryset = self.filter_queryset(queryset)
        
        from_date = request.query_params.get('from_date')
        to_date = request.query_params.get('to_date')
        service_type = request.query_params.get('service_type')
        
        if from_date:
            queryset = queryset.filter(service__service_date__gte=from_date)
        if to_date:
            queryset = queryset.filter(service__service_date__lte=to_date)
        if service_type and service_type != 'all':
            queryset = queryset.filter(service__service_type=service_type)
            
        stats = {
            'totalAttendance': queryset.count(),
            'totalServices': queryset.values('service').distinct().count(),
            'attendanceByType': dict(
                queryset.values('service__service_type')
                .annotate(count=Count('id'))
                .values_list('service__service_type', 'count')
            )
        }
        if stats['totalServices'] > 0:
            stats['averageAttendance'] = round(stats['totalAttendance'] / stats['totalServices'])
        else:
            stats['averageAttendance'] = 0
            
        page = self.paginate_queryset(queryset)
        if page is not None:
            data = []
            for r in page:
                data.append({
                    'id': str(r.id),
                    'marked_at': r.marked_at,
                    'member_id': str(r.member.id),
                    'member_name': r.member.full_name,
                    'service_date': r.service.service_date,
                    'service_type': r.service.service_type,
                    'service_name': r.service.name,
                })
            return self.get_paginated_response({
                'records': data,
                'stats': stats
            })

        data = []
        for r in queryset:
            data.append({
                'id': str(r.id),
                'marked_at': r.marked_at,
                'member_id': str(r.member.id),
                'member_name': r.member.full_name,
                'service_date': r.service.service_date,
                'service_type': r.service.service_type,
                'service_name': r.service.name,
            })
        return Response({
            'records': data,
            'stats': stats
        })

class MemberFollowUpViewSet(viewsets.ModelViewSet):
    queryset = MemberFollowUp.objects.all()
    serializer_class = MemberFollowUpSerializer
    permission_classes = [IsAttendanceOfficerOrHigher]

    @action(detail=False, methods=['post'])
    def calculate(self, request):
        MemberFollowUp.recalculate()
        count = MemberFollowUp.objects.filter(needs_follow_up=True).count()
        return Response({'status': f'Calculation completed. {count} members need follow-up.'})

    def get_queryset(self):
        return self.queryset.filter(needs_follow_up=True).select_related('member')
