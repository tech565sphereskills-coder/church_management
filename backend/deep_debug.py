import os
import django
from django.utils import timezone
from datetime import timedelta
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.conf import settings
from church_management.models import Member, Contribution, AttendanceRecord
from django.contrib.auth.models import User
from django.test import Client

def debug_data():
    print(f"DATABASE NAME: {settings.DATABASES['default']['NAME']}")
    print(f"BASE_DIR: {settings.BASE_DIR}")
    
    total = Member.objects.count()
    print(f"TOTAL MEMBERS: {total}")
    for m in Member.objects.all():
        print(f"  - {m.full_name} (Status: {m.status}, ID: {m.id})")
        
    print(f"TOTAL CONTRIBUTIONS: {Contribution.objects.count()}")
    for c in Contribution.objects.all():
        print(f"  - {c.contribution_type}: {c.amount} (Date: {c.date})")

    # Mock API call
    from church_management.views import StatsViewSet
    from rest_framework.test import APIRequestFactory, force_authenticate
    
    factory = APIRequestFactory()
    view = StatsViewSet.as_view({'get': 'quick_stats'})
    
    user = User.objects.first()
    if not user:
        user = User.objects.create_superuser('admin_tmp', 'admin@tmp.com', 'password123')
    
    request = factory.get('/api/stats/quick_stats/')
    force_authenticate(request, user=user)
    response = view(request)
    
    class DecimalEncoder(json.JSONEncoder):
        def default(self, obj):
            if isinstance(obj, (int, float, complex)):
                return super().default(obj)
            return str(obj)

    print("\nAPI RESPONSE (quick_stats):")
    print(json.dumps(response.data, indent=2, cls=DecimalEncoder))

if __name__ == "__main__":
    debug_data()
