#!/usr/bin/env python3
"""
Test the authentication endpoint directly
"""
import requests
import json

def test_health_endpoint():
    """Test if the service is running"""
    try:
        print("Testing health endpoint...")
        response = requests.get("http://127.0.0.1:8001/health", timeout=5)
        print(f"Health check status: {response.status_code}")
        if response.status_code == 200:
            print(f"Health response: {response.json()}")
            return True
        else:
            print(f"Health check failed: {response.text}")
            return False
    except Exception as e:
        print(f"Health check error: {e}")
        return False

def test_authentication_endpoint():
    """Test authentication endpoint with invalid token"""
    try:
        print("\nTesting authentication with invalid token...")
        
        headers = {
            "Authorization": "Bearer invalid_token_test",
            "Content-Type": "application/json"
        }
        
        # Try to access a protected endpoint
        response = requests.get(
            "http://127.0.0.1:8001/users/test-user-id", 
            headers=headers, 
            timeout=5
        )
        
        print(f"Auth test status: {response.status_code}")
        print(f"Auth test response: {response.text}")
        
        if response.status_code == 401:
            print("✅ Authentication properly rejects invalid tokens")
            return True
        else:
            print(f"❌ Unexpected response: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"Authentication test error: {e}")
        return False

def test_without_authentication():
    """Test endpoint without authentication"""
    try:
        print("\nTesting endpoint without authentication...")
        
        # Try to access a protected endpoint without auth
        response = requests.get(
            "http://127.0.0.1:8001/users/test-user-id", 
            timeout=5
        )
        
        print(f"No auth test status: {response.status_code}")
        print(f"No auth test response: {response.text}")
        
        if response.status_code == 401 or response.status_code == 403:
            print("✅ Endpoint properly requires authentication")
            return True
        else:
            print(f"❌ Unexpected response: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"No auth test error: {e}")
        return False

def main():
    """Main test function"""
    print("User Service Authentication Test")
    print("=" * 40)
    
    # Test if service is running
    service_running = test_health_endpoint()
    
    if not service_running:
        print("❌ Service is not running. Start it with:")
        print("cd services/user-service-v2")
        print("python -m uvicorn main:app --reload --port 8001")
        return
    
    # Test authentication
    auth_test = test_authentication_endpoint()
    no_auth_test = test_without_authentication()
    
    print("\n" + "=" * 40)
    print("TEST SUMMARY:")
    print(f"Service Health: {'✅ PASS' if service_running else '❌ FAIL'}")
    print(f"Auth Rejection: {'✅ PASS' if auth_test else '❌ FAIL'}")
    print(f"No Auth Block: {'✅ PASS' if no_auth_test else '❌ FAIL'}")

if __name__ == "__main__":
    main()
