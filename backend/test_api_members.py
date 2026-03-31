import requests
import json

def test_members_api():
    base_url = "http://localhost:8000"
    login_url = f"{base_url}/api/token/"
    members_url = f"{base_url}/api/members/"
    
    auth_data = {
        "username": "admin@emmanuel.com",
        "password": "Admin123!"
    }
    
    try:
        # Get token
        response = requests.post(login_url, json=auth_data)
        response.raise_for_status()
        token = response.json()["access"]
        
        # Get members
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(members_url, headers=headers)
        response.raise_for_status()
        members_data = response.json()
        
        print("Members API Response Structure:")
        print(json.dumps(members_data, indent=2)[:1000]) # Print first 1000 chars
        
        if isinstance(members_data, dict):
            print("\nResponse is a dictionary (possibly paginated)")
            print(f"Keys: {list(members_data.keys())}")
        elif isinstance(members_data, list):
            print("\nResponse is a list")
            print(f"Count: {len(members_data)}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_members_api()
