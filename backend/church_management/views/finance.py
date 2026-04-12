from django.db.models import Sum
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter, OrderingFilter
import pandas as pd
import io
from django.http import HttpResponse

from .base import viewsets, AuditableModelViewSetMixin, log_activity, StandardResultsSetPagination
from ..models import Contribution, Expense, Budget, Pledge, InventoryItem, ChurchSettings
from ..serializers import (
    ContributionSerializer, ExpenseSerializer, BudgetSerializer, 
    PledgeSerializer, InventoryItemSerializer
)
from ..permissions import IsAdmin, IsFinanceOfficer, IsViewerOrHigher

class ContributionViewSet(AuditableModelViewSetMixin, viewsets.ModelViewSet):
    queryset = Contribution.objects.all().order_by('-date', '-created_at')
    serializer_class = ContributionSerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [permissions.IsAuthenticated, IsAdmin | IsFinanceOfficer]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['member__surname', 'member__firstname', 'notes', 'contribution_type']
    ordering_fields = ['date', 'amount', 'created_at']
    ordering = ['-date', '-created_at']

    def get_queryset(self):
        return Contribution.objects.all().select_related('member', 'recorded_by').order_by('-date')

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)
        super().perform_create(serializer)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        month = request.query_params.get('month')
        year = request.query_params.get('year')
        queryset = self.get_queryset()
        if month and year:
            queryset = queryset.filter(date__month=month, date__year=year)
        summary_data = queryset.values('contribution_type').annotate(total=Sum('amount'))
        return Response(list(summary_data))

class ExpenseViewSet(AuditableModelViewSetMixin, viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by('-date', '-created_at')
    serializer_class = ExpenseSerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [permissions.IsAuthenticated, IsAdmin | IsFinanceOfficer]

    def get_queryset(self):
        return Expense.objects.all().select_related('recorded_by').order_by('-date')

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)
        super().perform_create(serializer)

class InventoryItemViewSet(AuditableModelViewSetMixin, viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer
    permission_classes = [IsAdmin | IsFinanceOfficer]

class BudgetViewSet(AuditableModelViewSetMixin, viewsets.ModelViewSet):
    queryset = Budget.objects.all().order_by('-year', '-month')
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin | IsFinanceOfficer]

class PledgeViewSet(AuditableModelViewSetMixin, viewsets.ModelViewSet):
    queryset = Pledge.objects.all().order_by('-target_date')
    serializer_class = PledgeSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin | IsFinanceOfficer]
