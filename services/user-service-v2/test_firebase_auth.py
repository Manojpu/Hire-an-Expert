#!/usr/bin/env python3
"""
Test script to debug Firebase authentication issues
"""
import os
import sys
import asyncio
from firebase_admin import auth, credentials, initialize_app
import firebase_admin
from config import settings

def test_firebase_config():
    """Test Firebase configuration loading"""
    print("=== Testing Firebase Configuration ===")
    
    print(f"FIREBASE_PROJECT_ID: {settings.firebase_project_id}")
    print(f"FIREBASE_CLIENT_EMAIL: {settings.firebase_client_email}")
    print(f"FIREBASE_PRIVATE_KEY_ID: {settings.firebase_private_key_id}")
    print(f"FIREBASE_PRIVATE_KEY exists: {bool(settings.firebase_private_key)}")
    if settings.firebase_private_key:
        print(f"FIREBASE_PRIVATE_KEY preview: {settings.firebase_private_key[:50]}...")
    
    # Check for None values
    missing_fields = []
    if not settings.firebase_project_id:
        missing_fields.append("firebase_project_id")
    if not settings.firebase_client_email:
        missing_fields.append("firebase_client_email")
    if not settings.firebase_private_key:
        missing_fields.append("firebase_private_key")
    if not settings.firebase_private_key_id:
        missing_fields.append("firebase_private_key_id")
    
    if missing_fields:
        print(f"❌ Missing Firebase configuration fields: {missing_fields}")
        return False
    else:
        print("✅ All Firebase configuration fields are present")
        return True

def test_firebase_initialization():
    """Test Firebase Admin SDK initialization"""
    print("\n=== Testing Firebase Admin SDK Initialization ===")
    
    try:
        # Clear any existing app
        try:
            app = firebase_admin.get_app()
            firebase_admin.delete_app(app)
            print("Cleared existing Firebase app")
        except ValueError:
            pass
        
        # Create credentials
        cred_dict = {
            "type": "service_account",
            "project_id": settings.firebase_project_id,
            "private_key_id": settings.firebase_private_key_id,
            "private_key": settings.firebase_private_key.replace("\\n", "\n") if settings.firebase_private_key else None,
            "client_email": settings.firebase_client_email,
            "client_id": settings.firebase_client_id,
            "auth_uri": settings.firebase_auth_uri,
            "token_uri": settings.firebase_token_uri,
            "auth_provider_x509_cert_url": settings.firebase_auth_provider_x509_cert_url,
            "client_x509_cert_url": settings.firebase_client_x509_cert_url,
        }
        
        print("Creating Firebase credentials...")
        cred = credentials.Certificate(cred_dict)
        
        print("Initializing Firebase app...")
        app = initialize_app(cred)
        
        print(f"✅ Firebase app initialized successfully")
        print(f"Project ID: {app.project_id}")
        print(f"App name: {app.name}")
        
        return True
        
    except Exception as e:
        print(f"❌ Firebase initialization failed: {e}")
        print(f"Error type: {type(e)}")
        return False

def test_token_verification():
    """Test token verification with a sample token"""
    print("\n=== Testing Token Verification ===")
    
    # This would require a valid token from the frontend
    # For now, just test that the verification function is accessible
    try:
        # Test with an obviously invalid token to see the error handling
        test_token = "invalid_token_for_testing"
        print(f"Testing with invalid token: {test_token}")
        
        decoded_token = auth.verify_id_token(test_token)
        print(f"❌ This shouldn't happen - invalid token was accepted: {decoded_token}")
        return False
        
    except auth.InvalidIdTokenError as e:
        print(f"✅ InvalidIdTokenError properly raised for invalid token: {e}")
        return True
    except Exception as e:
        print(f"❌ Unexpected error during token verification: {e}")
        print(f"Error type: {type(e)}")
        return False

def main():
    """Main test function"""
    print("Firebase Authentication Debug Test")
    print("=" * 50)
    
    # Test configuration
    config_ok = test_firebase_config()
    
    # Test Firebase initialization
    if config_ok:
        init_ok = test_firebase_initialization()
        
        # Test token verification
        if init_ok:
            verification_ok = test_token_verification()
        else:
            verification_ok = False
    else:
        init_ok = False
        verification_ok = False
    
    print("\n" + "=" * 50)
    print("TEST SUMMARY:")
    print(f"Configuration: {'✅ PASS' if config_ok else '❌ FAIL'}")
    print(f"Initialization: {'✅ PASS' if init_ok else '❌ FAIL'}")
    print(f"Token Verification: {'✅ PASS' if verification_ok else '❌ FAIL'}")
    
    if config_ok and init_ok and verification_ok:
        print("\n🎉 All tests passed! Firebase authentication should work.")
    else:
        print("\n⚠️  Some tests failed. Check the errors above.")
        
        if not config_ok:
            print("- Fix Firebase configuration in .env file")
        if not init_ok:
            print("- Check Firebase credentials and service account setup")
        if not verification_ok:
            print("- Token verification issues need investigation")

if __name__ == "__main__":
    main()
