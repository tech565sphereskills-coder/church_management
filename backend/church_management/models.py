import uuid
from django.db import models
from django.contrib.auth.models import User

class Role(models.TextChoices):
    ADMIN = 'admin', 'Admin'
    ATTENDANCE_OFFICER = 'attendance_officer', 'Attendance Officer'
    FINANCE_OFFICER = 'finance_officer', 'Finance Officer'
    CHILDREN_OFFICER = 'children_officer', 'Children Officer'
    PRAYER_OFFICER = 'prayer_officer', 'Prayer Officer'
    VIEWER = 'viewer', 'Viewer'

class Gender(models.TextChoices):
    MALE = 'male', 'Male'
    FEMALE = 'female', 'Female'

class MemberStatus(models.TextChoices):
    ACTIVE = 'active', 'Active'
    INACTIVE = 'inactive', 'Inactive'
    FIRST_TIMER = 'first_timer', 'First Timer'

class ServiceType(models.TextChoices):
    SUNDAY_SERVICE = 'sunday_service', 'Sunday Service'
    MIDWEEK_SERVICE = 'midweek_service', 'Midweek Service'
    SPECIAL_PROGRAM = 'special_program', 'Special Program'

class ContributionType(models.TextChoices):
    TITHE = 'tithe', 'Tithe'
    OFFERING = 'offering', 'Offering'
    WELFARE = 'welfare', 'Welfare'
    BUILDING_FUND = 'building_fund', 'Building Fund'
    THANKSGIVING = 'thanksgiving', 'Thanksgiving'
    SEEDS = 'seeds', 'Seeds'
    OTHER = 'other', 'Other'

class PaymentMethod(models.TextChoices):
    CASH = 'cash', 'Cash'
    BANK_TRANSFER = 'bank_transfer', 'Bank Transfer'
    POS = 'pos', 'POS'
    CHEQUE = 'cheque', 'Cheque'
    ONLINE = 'online', 'Online'

class PrayerStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    PRAYING = 'praying', 'Praying'
    ANSWERED = 'answered', 'Answered'

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=255, blank=True, null=True)
    avatar_url = models.URLField(max_length=500, blank=True, null=True)
    role = models.CharField(max_length=50, choices=Role.choices, default=Role.VIEWER)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.user.email

class Department(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True)
    leader = models.ForeignKey('Member', on_delete=models.SET_NULL, null=True, blank=True, related_name='led_departments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Member(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, unique=True)
    gender = models.CharField(max_length=10, choices=Gender.choices)
    department = models.ForeignKey('Department', on_delete=models.SET_NULL, null=True, blank=True, related_name='members')
    date_of_birth = models.DateField(blank=True, null=True)
    date_joined = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=MemberStatus.choices, default=MemberStatus.FIRST_TIMER)
    invited_by = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    qr_code = models.CharField(max_length=50, unique=True, blank=True, null=True)
    photo_url = models.URLField(max_length=500, blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_members')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.full_name

    def save(self, *args, **kwargs):
        if not self.qr_code:
            # Generate QR code if not exists
            self.qr_code = f"RCCG-{str(uuid.uuid4())[:8].upper()}"
        super().save(*args, **kwargs)

class Service(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    service_type = models.CharField(max_length=50, choices=ServiceType.choices)
    service_date = models.DateField()
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.service_date})"

class AttendanceRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='attendance_records')
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='attendance_records')
    marked_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='marked_attendance')
    marked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('member', 'service')

class MemberFollowUp(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    member = models.OneToOneField(Member, on_delete=models.CASCADE, related_name='follow_up')
    missed_consecutive_count = models.IntegerField(default=0)
    last_attended_date = models.DateField(blank=True, null=True)
    needs_follow_up = models.BooleanField(default=False)
    follow_up_notes = models.TextField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    @classmethod
    def recalculate(cls):
        active_members = Member.objects.filter(status='active')
        recent_services = Service.objects.all().order_by('-service_date')[:10]
        
        if not recent_services:
            return

        for member in active_members:
            consecutive_missed = 0
            last_attended_date = None
            
            for service in recent_services:
                attended = AttendanceRecord.objects.filter(member=member, service=service).exists()
                if attended:
                    last_attended_date = service.service_date
                    break
                consecutive_missed += 1
                
            if consecutive_missed >= 2:
                cls.objects.update_or_create(
                    member=member,
                    defaults={
                        'missed_consecutive_count': consecutive_missed,
                        'last_attended_date': last_attended_date,
                        'needs_follow_up': True
                    }
                )
            else:
                cls.objects.filter(member=member).update(needs_follow_up=False)

    def __str__(self):
        return f"Follow up for {self.member.full_name}"

class Contribution(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    member = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True, related_name='contributions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    contribution_type = models.CharField(max_length=50, choices=ContributionType.choices)
    date = models.DateField()
    payment_method = models.CharField(max_length=50, choices=PaymentMethod.choices)
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='recorded_contributions')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        member_name = self.member.full_name if self.member else "Anonymous"
        return f"{self.contribution_type} - {member_name} - {self.amount} ({self.date})"

class Child(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    full_name = models.CharField(max_length=255)
    gender = models.CharField(max_length=10, choices=Gender.choices)
    date_of_birth = models.DateField()
    allergies = models.TextField(blank=True, null=True)
    parent_1 = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='children_as_parent_1')
    parent_2 = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True, related_name='children_as_parent_2')
    emergency_contact = models.CharField(max_length=255, blank=True, null=True)
    check_in_code = models.CharField(max_length=10, unique=True, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.full_name

    def save(self, *args, **kwargs):
        if not self.check_in_code:
            self.check_in_code = str(uuid.uuid4())[:6].upper()
        super().save(*args, **kwargs)

class ChildCheckIn(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='check_ins')
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='child_check_ins')
    checked_in_at = models.DateTimeField(auto_now_add=True)
    checked_out_at = models.DateTimeField(blank=True, null=True)
    checked_in_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='child_check_ins_managed')

    def __str__(self):
        return f"{self.child.full_name} - {self.service.name}"

class PrayerRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    member = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True, related_name='prayer_requests')
    requester_name = models.CharField(max_length=255, blank=True, null=True) # For non-members or anonymous
    request_text = models.TextField()
    is_anonymous = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=PrayerStatus.choices, default=PrayerStatus.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        name = "Anonymous" if self.is_anonymous else (self.member.full_name if self.member else self.requester_name)
        return f"Prayer for {name} - {self.status}"
class ChurchSettings(models.Model):
    church_name = models.CharField(max_length=255, default='RCCG Emmanuel Sanctuary')
    address = models.TextField(blank=True, null=True)
    contact_email = models.EmailField(blank=True, null=True)
    logo_url = models.TextField(blank=True, null=True, default='/rccg_logo.png')
    attendance_reminders = models.BooleanField(default=True)
    new_member_alerts = models.BooleanField(default=True)
    weekly_reports = models.BooleanField(default=False)
    
    # SMTP configuration
    smtp_server = models.CharField(max_length=255, blank=True, null=True)
    smtp_port = models.IntegerField(default=587)
    smtp_user = models.CharField(max_length=255, blank=True, null=True)
    smtp_password = models.CharField(max_length=255, blank=True, null=True)
    smtp_use_tls = models.BooleanField(default=True)
    
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.church_name

class CommunicationLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    channel = models.CharField(max_length=10, choices=[('sms', 'SMS'), ('email', 'Email')])
    recipient_name = models.CharField(max_length=255)
    recipient_contact = models.CharField(max_length=255) # Phone or Email
    subject = models.CharField(max_length=255, blank=True, null=True)
    message = models.TextField()
    status = models.CharField(max_length=20, default='sent') # sent, failed, pending
    error_message = models.TextField(blank=True, null=True)
    sent_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.channel} to {self.recipient_name} - {self.status}"
