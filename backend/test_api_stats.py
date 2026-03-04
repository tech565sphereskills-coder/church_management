import os
import django
import json
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User

def test_api():
    client = Client()
    # Create or get a user for authentication
    user, _ = User.objects.get_or_create(username='admin_test', email='admin@test.com')
    if _:
        user.set_password('password123')
        user.save()
    
    client.force_login(user)
    
    print("Testing /api/stats/quick_stats/ ...")
    response = client.get('/api/stats/quick_stats/')
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("Response Data:")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Error Content: {response.content}")

    print("\nTesting /api/stats/department_distribution/ ...")
    response = client.get('/api/stats/department_distribution/')
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("Response Data:")
        print(json.dumps(response.json()[:5], indent=2)) # Print first 5
    else:
        print(f"Error Content: {response.content}")

if __name__ == "__main__":
    test_api()
