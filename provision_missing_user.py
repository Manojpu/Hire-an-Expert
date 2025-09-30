import requests
import json

def provision_missing_user():
    print("🔧 Manually provisioning missing user...")
    
    # The missing user from the 404 error
    missing_firebase_uid = "H6osS6XiUTgbyS2NovcAgVCpCqE3"
    
    user_service_url = "http://127.0.0.1:8006/internal/users/provision"
    payload = {
        "firebase_uid": missing_firebase_uid,
        "email": f"user_{missing_firebase_uid}@example.com",  # We don't know the real email
        "name": f"user_{missing_firebase_uid}@example.com",   # Using UID as fallback
        "is_expert": False,
        "expert_profiles": []
    }
    headers = {
        "X-Webhook-Secret": "7f6b8e2e6b9147f0b34a84d5b673d3e85d3a21b6b3c847c0a9e32f8f8a172ab4",
        "Content-Type": "application/json"
    }
    
    print(f"📤 Provisioning user: {missing_firebase_uid}")
    print(f"📦 Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(user_service_url, json=payload, headers=headers)
        print(f"📥 Response Status: {response.status_code}")
        print(f"📥 Response Text: {response.text}")
        
        if response.status_code == 200:
            print("✅ User provisioned successfully!")
            
            # Now test the lookup
            print("\n🧪 Testing user lookup after provisioning...")
            lookup_url = f"http://127.0.0.1:8006/users/firebase/{missing_firebase_uid}"
            lookup_response = requests.get(lookup_url)
            print(f"📥 Lookup Status: {lookup_response.status_code}")
            print(f"📥 Lookup Response: {lookup_response.text}")
            
        else:
            print("❌ User provisioning failed!")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    provision_missing_user()
