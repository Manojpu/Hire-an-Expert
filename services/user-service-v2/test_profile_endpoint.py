#!/usr/bin/env python3
"""
Quick test to verify the profile update endpoints work
"""

import requests
import json

BASE_URL = "http://localhost:8002"
USER_ID = "67555423-27ee-4b0c-be76-89975fd1b6a6"  # From the logs

def test_profile_update():
    print("Testing Profile Update Endpoints...")
    
    # Test the test endpoint (without auth)
    print(f"\n1. Testing PUT /test/users/{USER_ID}:")
    update_data = {
        "name": "John Doe Updated",
        "email": "john.updated@example.com",
        "phone": "+1234567890",
        "bio": "This is my updated bio",
        "location": "New York, USA"
    }
    
    response = requests.put(f"{BASE_URL}/test/users/{USER_ID}", json=update_data)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Updated profile: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"Error: {response.text}")

if __name__ == "__main__":
    test_profile_update()
