import requests
import json

base_url = "http://localhost:8000/api"
login_url = f"{base_url}/token/"
settings_url = f"{base_url}/settings/"

# Try both username and email if unsure
users_to_try = [
    {"username": "admin@emmanuel.com", "password": "Admin123!"},
    {"username": "admin", "password": "Admin123!"} or {"username": "admin", "password": "password"} # guessing
]

for credentials in users_to_try:
    print(f"Trying login for {credentials['username']}...")
    try:
        response = requests.post(login_url, json=credentials)
        if response.status_code == 200:
            token = response.json().get('access')
            print("Login successful.")
            
            headers = {"Authorization": f"Bearer {token}"}
            print(f"Fetching {settings_url}...")
            settings_resp = requests.get(settings_url, headers=headers)
            print(f"Status Code: {settings_resp.status_code}")
            print(f"Response Body: {settings_resp.text}")
            break
        else:
            print(f"Login failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error: {e}")
