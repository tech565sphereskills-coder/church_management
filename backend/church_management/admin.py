from django.contrib import admin
from .models import Profile, Member, Service, AttendanceRecord, MemberFollowUp

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'full_name', 'role', 'created_at')
    list_filter = ('role',)
    search_fields = ('user__username', 'user__email', 'full_name')

@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'phone', 'gender', 'status', 'qr_code')
    list_filter = ('gender', 'status', 'departments')
    search_fields = ('full_name', 'phone', 'email', 'qr_code')

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'service_type', 'service_date')
    list_filter = ('service_type', 'service_date')
    search_fields = ('name',)

@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ('member', 'service', 'marked_by', 'marked_at')
    list_filter = ('service', 'marked_at')

@admin.register(MemberFollowUp)
class MemberFollowUpAdmin(admin.ModelAdmin):
    list_display = ('member', 'missed_consecutive_count', 'last_attended_date', 'needs_follow_up')
    list_filter = ('needs_follow_up',)
