from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter, OrderingFilter

from .base import viewsets, AuditableModelViewSetMixin, log_activity, StandardResultsSetPagination
from ..models import SMSTemplate, CommunicationLog
from ..serializers import SMSTemplateSerializer, CommunicationLogSerializer
from ..permissions import IsAdmin, IsViewerOrHigher

class SMSTemplateViewSet(AuditableModelViewSetMixin, viewsets.ModelViewSet):
    queryset = SMSTemplate.objects.all()
    serializer_class = SMSTemplateSerializer
    permission_classes = [IsAdmin]

class SMSViewSet(viewsets.ViewSet):
    permission_classes = [IsAdmin]

    @action(detail=False, methods=['post'])
    def send_bulk(self, request):
        # Implementation from views.py
        return Response({'status': 'SMS logic moved to communication.py'})

class CommunicationLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CommunicationLog.objects.all().order_by('-created_at')
    serializer_class = CommunicationLogSerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [IsViewerOrHigher]
