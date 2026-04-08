import requests

BASE_URL = "http://127.0.0.1:8000/api"

def test_login(username, password):
    print(f"Testing login for: {username}")
    payload = {
        "username": username,
        "password": password
    }
    try:
        response = requests.post(f"{BASE_URL}/token/", json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    # Test with email (expected to fail before fix)
    test_login("admin@emmanuel.com", "admin123") # Assuming a password, but we'll see the error
    
    # Test with username (expected to work or give different error if password wrong)
    test_login("admin", "admin123")
