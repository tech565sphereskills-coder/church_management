from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import Profile

from django.contrib.auth.models import Group
from django.contrib.auth.signals import user_logged_in, user_logged_out
from .models import AuditLog
from .views import log_activity # Assuming log_activity is accessible or move it to a utils.py

@receiver(post_save, sender=User)
def handle_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.get_or_create(user=instance)
    
    # Sync groups based on role
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
                instance.groups.clear()  # Usually simpler to clear and add one role
                instance.groups.add(group)
        
        # REMOVED: instance.profile.save() - This can cause stale profile data 
        # to overwrite recent changes when the User is saved.

@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    log_activity(user, AuditLog.Action.LOGIN, 'User', user.id, user.username)

@receiver(user_logged_out)
def log_user_logout(sender, request, user, **kwargs):
    log_activity(user, 'logout', 'User', user.id, user.username)
