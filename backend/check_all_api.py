import os
import django
import json
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User

def test_endpoints():
    client = Client()
    user, _ = User.objects.get_or_create(username='admin_test', email='admin@test.com')
    if _:
        user.set_password('password123')
        user.save()
    client.force_login(user)
    
    endpoints = [
        '/api/members/',
        '/api/stats/',
        '/api/stats/quick_stats/',
        '/api/stats/department_distribution/',
        '/api/settings/',
    ]
    
    for url in endpoints:
        print(f"Testing {url} ...")
        response = client.get(url)
        print(f"  Status: {response.status_code}")
        if response.status_code == 200:
            try:
                data = response.json()
                if isinstance(data, list):
                    print(f"  Count: {len(data)}")
                else:
                    print(f"  Keys: {list(data.keys())}")
            except:
                print("  (Not JSON)")
        else:
            print(f"  Error: {response.content[:100]}")

if __name__ == "__main__":
    test_endpoints()
