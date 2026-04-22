from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User, Group
from django.contrib.auth.signals import user_logged_in, user_logged_out
from .models import Profile, AuditLog, Notification, Member, Contribution, PrayerRequest
from .views import log_activity

@receiver(post_save, sender=User)
def handle_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.get_or_create(user=instance)
    
    if hasattr(instance, 'profile'):
        role_map = {
            'admin': 'Admin',
            'attendance_officer': 'Attendance Officer',
            'finance_officer': 'Finance Officer',
            'children_officer': 'Children Officer',
            'prayer_officer': 'Prayer Officer',
            'viewer': 'Viewer'
        }
        group_name = role_map.get(instance.profile.role)
        if group_name:
            group, _ = Group.objects.get_or_create(name=group_name)
            if group not in instance.groups.all():
                instance.groups.clear()
                instance.groups.add(group)

@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    log_activity(user, AuditLog.Action.LOGIN, 'User', user.id, user.username)

@receiver(user_logged_out)
def log_user_logout(sender, request, user, **kwargs):
    log_activity(user, 'logout', 'User', user.id, user.username)

# Notification Signals
@receiver(post_save, sender=Member)
def notify_new_member(sender, instance, created, **kwargs):
    if created:
        Notification.objects.create(
            title="New Member Registered",
            description=f"{instance.full_name} has just been registered as a {instance.status.replace('_', ' ')}.",
            type='success'
        )

@receiver(post_save, sender=Contribution)
def notify_large_contribution(sender, instance, created, **kwargs):
    if created and instance.amount >= 50000:
        Notification.objects.create(
            title="Significant Contribution Received",
            description=f"A {instance.contribution_type} of #{instance.amount:,.2f} was recorded from {instance.member.full_name if instance.member else 'Anonymous'}.",
            type='info'
        )

@receiver(post_save, sender=PrayerRequest)
def notify_new_prayer_request(sender, instance, created, **kwargs):
    if created:
        Notification.objects.create(
            title="New Prayer Request",
            description=f"A new prayer request has been submitted by {instance.requester_name or instance.member.full_name if instance.member else 'Anonymous'}.",
            type='warning'
        )
