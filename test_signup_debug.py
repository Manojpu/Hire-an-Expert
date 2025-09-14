import requests
import json

# Test the signup flow
def test_signup_flow():
    print("🧪 Testing Auth Service Signup Flow...")
    
    auth_service_url = "http://127.0.0.1:8001/signup"
    test_payload = {
        "firebase_uid": "test_signup_H6osS6XiUTgbyS2NovcAgVCpCqE3",
        "email": "testsignup@example.com"
    }
    
    print(f"📤 Sending request to: {auth_service_url}")
    print(f"📦 Payload: {json.dumps(test_payload, indent=2)}")
    
    try:
        response = requests.post(auth_service_url, json=test_payload)
        print(f"📥 Response Status: {response.status_code}")
        print(f"📥 Response Text: {response.text}")
        
        if response.status_code == 200:
            print("✅ Signup successful!")
        else:
            print("❌ Signup failed!")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

def test_user_service_direct():
    print("\n🧪 Testing User Service Direct Call...")
    
    user_service_url = "http://127.0.0.1:8006/internal/users/provision"
    test_payload = {
        "firebase_uid": "test_direct_H6osS6XiUTgbyS2NovcAgVCpCqE3",
        "email": "testdirect@example.com",
        "name": "testdirect@example.com",
        "is_expert": False,
        "expert_profiles": []
    }
    headers = {
        "X-Webhook-Secret": "7f6b8e2e6b9147f0b34a84d5b673d3e85d3a21b6b3c847c0a9e32f8f8a172ab4",
        "Content-Type": "application/json"
    }
    
    print(f"📤 Sending request to: {user_service_url}")
    print(f"📦 Payload: {json.dumps(test_payload, indent=2)}")
    print(f"📦 Headers: {headers}")
    
    try:
        response = requests.post(user_service_url, json=test_payload, headers=headers)
        print(f"📥 Response Status: {response.status_code}")
        print(f"📥 Response Text: {response.text}")
        
        if response.status_code == 200:
            print("✅ User Service call successful!")
        else:
            print("❌ User Service call failed!")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

def test_user_lookup():
    print("\n🧪 Testing User Lookup...")
    
    firebase_uid = "H6osS6XiUTgbyS2NovcAgVCpCqE3"
    lookup_url = f"http://127.0.0.1:8006/users/firebase/{firebase_uid}"
    
    print(f"📤 Looking up user: {lookup_url}")
    
    try:
        response = requests.get(lookup_url)
        print(f"📥 Response Status: {response.status_code}")
        print(f"📥 Response Text: {response.text}")
        
        if response.status_code == 200:
            print("✅ User found!")
        elif response.status_code == 404:
            print("❌ User not found - this is the issue!")
        else:
            print("❌ Unexpected response!")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    test_user_lookup()
    test_user_service_direct()
    test_signup_flow()
