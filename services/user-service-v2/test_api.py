#!/usr/bin/env python3
"""
Simple test script for the User Service API
Run this after starting the service to test basic functionality
"""

import requests
import json
import uuid
from typing import Dict, Any

BASE_URL = "http://localhost:8001"
API_BASE = f"{BASE_URL}/api/v1"

def test_health_check():
    """Test health check endpoint"""
    print("Testing health check...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_root_endpoint():
    """Test root endpoint"""
    print("Testing root endpoint...")
    response = requests.get(f"{BASE_URL}/")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_create_user():
    """Test user creation (without auth for demo)"""
    print("Testing user creation...")
    
    # This would normally require a Firebase token
    # For demo purposes, we'll just show the expected format
    user_data = {
        "firebase_uid": f"firebase_test_{uuid.uuid4()}",
        "name": "Test User",
        "email": f"test_{uuid.uuid4()}@example.com",
        "phone": "+1234567890",
        "role": "client",
        "bio": "Test user for API testing",
        "profile_image_url": "https://example.com/avatar.jpg"
    }
    
    print(f"User data to create: {json.dumps(user_data, indent=2)}")
    print("Note: This endpoint requires Firebase authentication")
    print()

def test_get_user_by_id():
    """Test getting user by ID"""
    print("Testing get user by ID...")
    
    # Use a sample UUID (this won't exist in the database)
    sample_user_id = str(uuid.uuid4())
    response = requests.get(f"{API_BASE}/users/{sample_user_id}")
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_get_user_by_firebase_uid():
    """Test getting user by Firebase UID"""
    print("Testing get user by Firebase UID...")
    
    # Use a sample Firebase UID (this won't exist in the database)
    sample_firebase_uid = f"firebase_test_{uuid.uuid4()}"
    response = requests.get(f"{API_BASE}/users/firebase/{sample_firebase_uid}")
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_preference_operations():
    """Test preference operations (without auth for demo)"""
    print("Testing preference operations...")
    
    sample_user_id = str(uuid.uuid4())
    preference_data = {
        "key": "language",
        "value": "en"
    }
    
    print(f"Sample preference data: {json.dumps(preference_data, indent=2)}")
    print(f"Would be created for user: {sample_user_id}")
    print("Note: These endpoints require Firebase authentication")
    print()

def test_admin_endpoints():
    """Test admin endpoints (without auth for demo)"""
    print("Testing admin endpoints...")
    
    print("Admin endpoints require admin role authentication:")
    print("- GET /api/v1/admin/users - List all users")
    print("- DELETE /api/v1/admin/users/{user_id} - Delete user")
    print()

def generate_curl_examples():
    """Generate example cURL commands"""
    print("Example cURL commands:")
    print()
    
    # Health check
    print("1. Health check:")
    print(f"curl -X GET '{BASE_URL}/health'")
    print()
    
    # Get user by ID
    sample_user_id = str(uuid.uuid4())
    print("2. Get user by ID:")
    print(f"curl -X GET '{API_BASE}/users/{sample_user_id}'")
    print()
    
    # Create user (with auth)
    print("3. Create user (requires Firebase token):")
    print(f"curl -X POST '{API_BASE}/users' \\")
    print("  -H 'Content-Type: application/json' \\")
    print("  -H 'Authorization: Bearer YOUR_FIREBASE_TOKEN' \\")
    print("  -d '{")
    print('    "firebase_uid": "firebase_user_123",')
    print('    "name": "John Doe",')
    print('    "email": "john@example.com",')
    print('    "phone": "+1234567890",')
    print('    "role": "client",')
    print('    "bio": "Software developer"')
    print("  }'")
    print()
    
    # Update user (with auth)
    print("4. Update user (requires Firebase token):")
    print(f"curl -X PUT '{API_BASE}/users/{sample_user_id}' \\")
    print("  -H 'Content-Type: application/json' \\")
    print("  -H 'Authorization: Bearer YOUR_FIREBASE_TOKEN' \\")
    print("  -d '{")
    print('    "name": "John Smith",')
    print('    "bio": "Updated bio"')
    print("  }'")
    print()
    
    # Add preference (with auth)
    print("5. Add preference (requires Firebase token):")
    print(f"curl -X POST '{API_BASE}/users/{sample_user_id}/preferences' \\")
    print("  -H 'Content-Type: application/json' \\")
    print("  -H 'Authorization: Bearer YOUR_FIREBASE_TOKEN' \\")
    print("  -d '{")
    print('    "key": "language",')
    print('    "value": "en"')
    print("  }'")
    print()

def main():
    """Run all tests"""
    print("=" * 60)
    print("User Service API Test Script")
    print("=" * 60)
    print()
    
    try:
        test_health_check()
        test_root_endpoint()
        test_create_user()
        test_get_user_by_id()
        test_get_user_by_firebase_uid()
        test_preference_operations()
        test_admin_endpoints()
        generate_curl_examples()
        
        print("=" * 60)
        print("Test script completed!")
        print("Visit http://localhost:8001/docs for interactive API documentation")
        print("=" * 60)
        
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the service.")
        print("Make sure the service is running on http://localhost:8001")
        print("Start it with: uvicorn main:app --host 0.0.0.0 --port 8001 --reload")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main() 