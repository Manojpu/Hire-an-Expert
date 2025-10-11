import requests
import json

# Test the auth service signup endpoint
url = "http://127.0.0.1:8001/signup"
headers = {
    "Content-Type": "application/json"
}
payload = {
    "firebase_uid": "auth_test_123",
    "email": "authtest@example.com"
}

print("Testing auth service signup endpoint...")
print(f"URL: {url}")
print(f"Payload: {json.dumps(payload, indent=2)}")

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"\nResponse Status: {response.status_code}")
    print(f"Response Text: {response.text}")
    
    if response.status_code == 200:
        print("✅ Auth service signup successful!")
    else:
        print("❌ Auth service signup failed")
        
except Exception as e:
    print(f"❌ Error: {e}")

# Test getting the user afterwards
print("\n" + "="*50)
print("Testing if user was created in user service...")
get_url = f"http://127.0.0.1:8006/users/firebase/auth_test_123"
try:
    get_response = requests.get(get_url)
    print(f"GET Response Status: {get_response.status_code}")
    print(f"GET Response Text: {get_response.text}")
    
    if get_response.status_code == 200:
        print("✅ User found in user service!")
    else:
        print("❌ User not found in user service")
except Exception as e:
    print(f"❌ Error getting user: {e}")
