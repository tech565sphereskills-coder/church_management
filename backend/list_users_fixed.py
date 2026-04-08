import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User

def list_users():
    print(f"{'Username':<20} | {'Email':<30} | {'Is Active':<10}")
    print("-" * 65)
    for user in User.objects.all():
        print(f"{user.username:<20} | {user.email:<30} | {str(user.is_active):<10}")

if __name__ == "__main__":
    list_users()
