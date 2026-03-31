import requests
import json

def test_departments_api():
    base_url = "http://localhost:8000"
    login_url = f"{base_url}/api/token/"
    depts_url = f"{base_url}/api/departments/"
    
    auth_data = {
        "username": "admin@emmanuel.com",
        "password": "Admin123!"
    }
    
    try:
        # Get token
        response = requests.post(login_url, json=auth_data)
        response.raise_for_status()
        token = response.json()["access"]
        
        # Get departments
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(depts_url, headers=headers)
        response.raise_for_status()
        depts_data = response.json()
        
        print("Departments API Response Structure:")
        print(json.dumps(depts_data, indent=2)[:1000]) # Print first 1000 chars
        
        if isinstance(depts_data, dict):
            print("\nResponse is a dictionary (possibly paginated)")
            print(f"Keys: {list(depts_data.keys())}")
        elif isinstance(depts_data, list):
            print("\nResponse is a list")
            print(f"Count: {len(depts_data)}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_departments_api()
