#!/usr/bin/env python3
"""
Simple test to verify profile editing works
"""

import requests
import json

BASE_URL = "http://localhost:8002"

def test_profile_update():
    print("Testing Profile Update...")
    
    # Test updating user profile (using user ID 1 for simplicity)
    print("\n1. Testing PUT update user profile:")
    update_data = {
        "name": "John Doe Updated",
        "email": "john.updated@example.com",
        "phone": "+1234567890",
        "bio": "Updated bio text",
        "location": "New York, USA"
    }
    
    response = requests.put(f"{BASE_URL}/users/1", json=update_data)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Updated profile: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"Error: {response.text}")

if __name__ == "__main__":
    test_profile_update()
