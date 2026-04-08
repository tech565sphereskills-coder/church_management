import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User

def reset_admin_password():
    try:
        user = User.objects.get(username='admin')
        user.set_password('admin123')
        user.is_active = True
        user.save()
        print("Successfully reset admin password to 'admin123'")
    except User.DoesNotExist:
        print("User 'admin' does not exist")

if __name__ == "__main__":
    reset_admin_password()
