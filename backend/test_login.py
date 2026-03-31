import requests
import json

url = "http://localhost:8000/api/token/"
data = {
    "username": "admin@emmanuel.com",
    "password": "Admin123!"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    if response.status_code == 200:
        print("LOGIN SUCCESSFUL")
    else:
        print("LOGIN FAILED")
except Exception as e:
    print(f"Error connecting to backend: {e}")
