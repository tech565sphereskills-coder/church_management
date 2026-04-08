import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from church_management.models import Profile, Role

def create_admin_user():
    email = 'admin@emmanuel.com'
    username = 'admin'
    password = 'admin123'
    
    user, created = User.objects.get_or_create(username=username)
    user.email = email
    user.set_password(password)
    user.is_active = True
    user.is_staff = True
    user.is_superuser = True
    user.save()
    
    profile, p_created = Profile.objects.get_or_create(user=user)
    profile.role = Role.ADMIN
    profile.can_manage_members = True
    profile.can_manage_attendance = True
    profile.can_manage_financials = True
    profile.can_manage_departments = True
    profile.can_manage_children = True
    profile.can_manage_prayer_requests = True
    profile.can_manage_calendar = True
    profile.can_view_reports = True
    profile.can_manage_settings = True
    profile.save()
    
    if created:
        print(f"Created new admin user: {username} ({email})")
    else:
        print(f"Updated existing admin user: {username} ({email})")

if __name__ == "__main__":
    create_admin_user()
