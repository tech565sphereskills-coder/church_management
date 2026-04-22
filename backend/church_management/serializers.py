from rest_framework import serializers
from .models import (
    Profile, Member, Service, AttendanceRecord, MemberFollowUp, 
    Contribution, Department, Child, ChildCheckIn, PrayerRequest,
    ChurchSettings, CommunicationLog, Expense, CalendarEvent, AuditLog,
    SMSTemplate, Budget, Pledge, CheckInQueue, Family, InventoryItem, Notification
)
from django.contrib.auth.models import User

class CheckInQueueSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.full_name', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)

    class Meta:
        model = CheckInQueue
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    full_name = serializers.CharField(required=False)
    family = serializers.PrimaryKeyRelatedField(queryset=Family.objects.all(), required=False, allow_null=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'email', 'full_name', 'family')

    def create(self, validated_data):
        full_name = validated_data.pop('full_name', '')
        family = validated_data.pop('family', None)
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        # Profile is created automatically by signal
        user.profile.full_name = full_name
        
        # Create or update member profile
        names = full_name.strip().split(' ')
        surname = names[0] if names else 'TBD'
        firstname = names[1] if len(names) > 1 else 'TBD'
        other_name = ' '.join(names[2:]) if len(names) > 2 else ''
        
        member, _ = Member.objects.get_or_create(
            surname=surname,
            firstname=firstname,
            phone='TBD', # Default value, can be updated later
            defaults={'gender': 'male', 'other_name': other_name}
        )
        member.family = family
        member.email = user.email
        member.save()
        
        user.profile.member = member
        user.profile.save()
        return user

class ProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    hod_departments = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = (
            'id', 'email', 'username', 'full_name', 'role', 'avatar_url', 'member',
            'can_manage_members', 'can_manage_attendance', 'can_manage_financials',
            'can_manage_departments', 'can_manage_children', 'can_manage_prayer_requests',
            'can_manage_calendar', 'can_view_reports', 'can_manage_settings',
            'hod_departments',
            'created_at', 'updated_at'
        )

    def get_hod_departments(self, obj):
        if obj.member:
            return [{'id': str(d.id), 'name': d.name} for d in obj.member.headed_departments.all()]
        return []

class FamilySerializer(serializers.ModelSerializer):
    head_name = serializers.CharField(source='head.full_name', read_only=True)
    spiritual_head_name = serializers.CharField(source='spiritual_head.full_name', read_only=True)
    member_count = serializers.IntegerField(source='members.count', read_only=True)

    class Meta:
        model = Family
        fields = '__all__'

class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = '__all__'

class MemberSerializer(serializers.ModelSerializer):
    department_names = serializers.SerializerMethodField()
    family_name = serializers.CharField(source='family.name', read_only=True)
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = Member
        fields = '__all__'
        validators = [
            serializers.UniqueTogetherValidator(
                queryset=Member.objects.all(),
                fields=['surname', 'firstname', 'phone'],
                message="A member with this name and phone number is already registered."
            )
        ]

    def get_department_names(self, obj):
        return [d.name for d in obj.departments.all()]

class DepartmentSerializer(serializers.ModelSerializer):
    hod_name = serializers.CharField(source='head_of_department.full_name', read_only=True)
    member_count = serializers.IntegerField(source='members.count', read_only=True)

    class Meta:
        model = Department
        fields = '__all__'

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = '__all__'

class AttendanceRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceRecord
        fields = '__all__'

class MemberFollowUpSerializer(serializers.ModelSerializer):
    class Meta:
        model = MemberFollowUp
        fields = '__all__'

class ContributionSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.full_name', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.full_name', read_only=True)

    class Meta:
        model = Contribution
        fields = '__all__'

class ChildSerializer(serializers.ModelSerializer):
    parent_1_name = serializers.CharField(source='parent_1.full_name', read_only=True)
    parent_2_name = serializers.CharField(source='parent_2.full_name', read_only=True)

    class Meta:
        model = Child
        fields = '__all__'

class ChildCheckInSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.full_name', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)

    class Meta:
        model = ChildCheckIn
        fields = '__all__'

class PrayerRequestSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.full_name', read_only=True)

    class Meta:
        model = PrayerRequest
        fields = '__all__'

class ChurchSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChurchSettings
        fields = '__all__'

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        
        # If user is not admin, mask sensitive SMTP fields
        if request and request.user and request.user.is_authenticated:
            if not (request.user.profile.role == 'admin' or request.user.profile.can_manage_settings):
                sensitive_fields = ['smtp_password', 'smtp_user', 'smtp_server', 'smtp_port']
                for field in sensitive_fields:
                    if field in ret:
                        ret[field] = '********'
        return ret

class CommunicationLogSerializer(serializers.ModelSerializer):
    sent_by_name = serializers.CharField(source='sent_by.username', read_only=True)

    class Meta:
        model = CommunicationLog
        fields = '__all__'

class ExpenseSerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.CharField(source='recorded_by.username', read_only=True)

    class Meta:
        model = Expense
        fields = '__all__'

class CalendarEventSerializer(serializers.ModelSerializer):
    organizer_name = serializers.CharField(source='organizer.username', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = CalendarEvent
        fields = '__all__'

class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = AuditLog
        fields = '__all__'

class SMSTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SMSTemplate
        fields = '__all__'

class BudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Budget
        fields = '__all__'

class PledgeSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.full_name', read_only=True)

    class Meta:
        model = Pledge
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
