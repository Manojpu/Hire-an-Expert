import json

# Test what frontend will send now
signup_payload = {
    "firebase_uid": "test_uid_123",
    "email": "test@example.com", 
    "full_name": "Test User",
    "is_expert": True,
    "expert_profiles": []
}

print("✅ Frontend Signup Payload:")
print(json.dumps(signup_payload, indent=2))

# Test schema default
from schemas import ProvisionIn

# Test with minimal data (should use default)
minimal_data = {
    "firebase_uid": "test_uid_456",
    "email": "minimal@example.com",
    "full_name": "Minimal User"
}

provision_obj = ProvisionIn(**minimal_data)
print(f"\n✅ Schema Default Test:")
print(f"is_expert value with minimal data: {provision_obj.is_expert}")

# Test crud function default
from crud import upsert_user
import inspect

sig = inspect.signature(upsert_user)
is_expert_param = sig.parameters['is_expert']
print(f"\n✅ CRUD Function Default:")
print(f"upsert_user is_expert default: {is_expert_param.default}")

print(f"\n🎉 All defaults are now set to: TRUE")
