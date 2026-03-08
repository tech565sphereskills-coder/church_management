import uuid
from django.db import models
from django.contrib.auth.models import User

class Role(models.TextChoices):
    ADMIN = 'admin', 'Admin'
    ATTENDANCE_OFFICER = 'attendance_officer', 'Attendance Officer'
    FINANCE_OFFICER = 'finance_officer', 'Finance Officer'
    CHILDREN_OFFICER = 'children_officer', 'Children Officer'
    PRAYER_OFFICER = 'prayer_officer', 'Prayer Officer'
    HOD = 'hod', 'HOD'
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
    DONATION = 'donation', 'Donation'
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

class ExpenseCategory(models.TextChoices):
    MAINTENANCE = 'maintenance', 'Maintenance'
    UTILITIES = 'utilities', 'Utilities'
    SALARY = 'salary', 'Salary / Welfare'
    PROJECTS = 'projects', 'Church Projects'
    ADMINISTRATION = 'administration', 'Administration'
    OUTREACH = 'outreach', 'Outreach / Evangelism'
    PURCHASE = 'purchase', 'Purchases / Equipment'
    OTHER = 'other', 'Other'

class EventType(models.TextChoices):
    SERVICE = 'service', 'Church Service'
    MEETING = 'meeting', 'Group Meeting'
    CONFERENCE = 'conference', 'Conference / Seminar'
    SPECIAL = 'special', 'Special Program'
    REHEARSAL = 'rehearsal', 'Rehearsal'
    OTHER = 'other', 'Other'

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=255, blank=True, null=True)
    avatar_url = models.URLField(max_length=500, blank=True, null=True)
    role = models.CharField(max_length=50, choices=Role.choices, null=True, blank=True, default=None)
    member = models.OneToOneField('Member', on_delete=models.SET_NULL, null=True, blank=True, related_name='user_profile')
    
    # Granular Permissions
    can_manage_members = models.BooleanField(default=False)
    can_manage_attendance = models.BooleanField(default=False)
    can_manage_financials = models.BooleanField(default=False)
    can_manage_departments = models.BooleanField(default=False)
    can_manage_children = models.BooleanField(default=False)
    can_manage_prayer_requests = models.BooleanField(default=False)
    can_manage_calendar = models.BooleanField(default=False)
    can_view_reports = models.BooleanField(default=False)
    can_manage_settings = models.BooleanField(default=False)

    # 2FA Settings
    two_factor_secret = models.CharField(max_length=32, blank=True, null=True)
    is_two_factor_enabled = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.user.email

class Department(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True)
    head_of_department = models.ForeignKey('Member', on_delete=models.SET_NULL, null=True, blank=True, related_name='headed_departments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Family(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    head = models.ForeignKey('Member', on_delete=models.SET_NULL, null=True, blank=True, related_name='headed_family')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Member(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    gender = models.CharField(max_length=10, choices=Gender.choices)
    departments = models.ManyToManyField('Department', blank=True, related_name='members')
    family = models.ForeignKey(Family, on_delete=models.SET_NULL, null=True, blank=True, related_name='members')
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

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['full_name', 'phone'], name='unique_member_name_phone')
        ]

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

    def __str__(self):
        return f"{self.contribution_type} - {self.amount}"

class Expense(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    description = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=ExpenseCategory.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='recorded_expenses')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.description} - {self.amount}"

class InventoryItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    quantity = models.IntegerField(default=1)
    category = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class CalendarEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    event_type = models.CharField(max_length=50, choices=EventType.choices, default=EventType.SERVICE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    location = models.CharField(max_length=255, blank=True, null=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='events')
    organizer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='organized_events')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.start_time.date()})"

class AuditLog(models.Model):
    class Action(models.TextChoices):
        CREATE = 'create', 'Create'
        UPDATE = 'update', 'Update'
        DELETE = 'delete', 'Delete'
        LOGIN = 'login', 'Login'
        EXPORT = 'export', 'Export'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='audit_logs')
    action = models.CharField(max_length=20, choices=Action.choices)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=100, blank=True, null=True)
    object_name = models.CharField(max_length=255, blank=True, null=True)
    details = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user} - {self.action} - {self.model_name} ({self.timestamp})"

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

class SMSTemplate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

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

class Budget(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.CharField(max_length=255) # Can match ContributionType or ExpenseCategory
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    month = models.IntegerField()
    year = models.IntegerField()
    budget_type = models.CharField(max_length=20, choices=[('income_target', 'Income Target'), ('expense_limit', 'Expense Limit')])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('category', 'month', 'year', 'budget_type')

    def __str__(self):
        return f"{self.category} ({self.month}/{self.year}) - {self.budget_type}"

class Pledge(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='pledges')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    target_date = models.DateField()
    purpose = models.CharField(max_length=255, blank=True, null=True)
    is_fulfilled = models.BooleanField(default=False)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.member.full_name} - {self.amount} ({'Fulfilled' if self.is_fulfilled else 'Pending'})"

class CheckInQueue(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    member = models.ForeignKey(Member, on_delete=models.CASCADE, null=True, blank=True, related_name='check_in_requests')
    phone_number = models.CharField(max_length=20)
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='check_in_requests')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.phone_number} - {self.status}"
