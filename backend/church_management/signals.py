from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import Profile

from django.contrib.auth.models import Group

@receiver(post_save, sender=User)
def handle_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.get_or_create(user=instance)
    
    # Sync groups based on role
    if hasattr(instance, 'profile'):
        role_map = {
            'admin': 'Admin',
            'attendance_officer': 'Attendance Officer',
            'viewer': 'Viewer'
        }
        group_name = role_map.get(instance.profile.role)
        if group_name:
            group, _ = Group.objects.get_or_create(name=group_name)
            if group not in instance.groups.all():
                instance.groups.clear()  # Usually simpler to clear and add one role
                instance.groups.add(group)
        
        instance.profile.save()
