from config import settings

print("=== Firebase Configuration Debug ===")
print(f"Project ID: '{settings.firebase_project_id}'")
print(f"Client Email: '{settings.firebase_client_email}'")
print(f"Private Key ID: '{settings.firebase_private_key_id}'")
print(f"Private Key starts with: '{settings.firebase_private_key[:50] if settings.firebase_private_key else 'None'}...'")
print(f"Auth URI: '{settings.firebase_auth_uri}'")
print(f"Token URI: '{settings.firebase_token_uri}'")
