import requests
import json

# Test the provision endpoint
url = "http://127.0.0.1:8006/internal/users/provision"
headers = {
    "Content-Type": "application/json",
    "X-Webhook-Secret": "7f6b8e2e6b9147f0b34a84d5b673d3e85d3a21b6b3c847c0a9e32f8f8a172ab4"
}
payload = {
    "firebase_uid": "test123456",
    "email": "test@example.com",
    "name": "Test User",
    "is_expert": False,
    "expert_profiles": []
}

print("Testing provision endpoint...")
print(f"URL: {url}")
print(f"Headers: {headers}")
print(f"Payload: {json.dumps(payload, indent=2)}")

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"\nResponse Status: {response.status_code}")
    print(f"Response Text: {response.text}")
    
    if response.status_code == 200:
        print("✅ Success! User created successfully")
        user_data = response.json()
        print(f"Created user: {json.dumps(user_data, indent=2)}")
    else:
        print("❌ Failed to create user")
        
except Exception as e:
    print(f"❌ Error: {e}")

# Test getting the user by firebase_uid
if 'user_data' in locals():
    print("\n" + "="*50)
    print("Testing get user by firebase_uid...")
    get_url = f"http://127.0.0.1:8006/users/firebase/test123456"
    try:
        get_response = requests.get(get_url)
        print(f"GET Response Status: {get_response.status_code}")
        print(f"GET Response Text: {get_response.text}")
        
        if get_response.status_code == 200:
            print("✅ Success! User found")
        else:
            print("❌ User not found")
    except Exception as e:
        print(f"❌ Error getting user: {e}")
