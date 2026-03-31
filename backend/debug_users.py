import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from church_management.models import Profile

def check_users():
    print(f"{'Username':<30} | {'Email':<30} | {'Is Active':<10} | {'2FA Enabled':<10}")
    print("-" * 85)
    for user in User.objects.all():
        profile = getattr(user, 'profile', None)
        is_2fa = profile.is_two_factor_enabled if profile else "No Profile"
        print(f"{user.username:<30} | {user.email:<30} | {str(user.is_active):<10} | {str(is_2fa):<10}")

if __name__ == "__main__":
    check_users()
