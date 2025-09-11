#!/usr/bin/env python3
"""
Test script to verify the preferences system is working correctly.
This will test the preference CRUD operations via the API.
"""

import requests
import json

BASE_URL = "http://localhost:8002"

def test_preferences():
    print("Testing Preferences System...")
    
    # Test 1: Get user preferences (assuming a user exists with ID 1)
    print("\n1. Testing GET user preferences:")
    response = requests.get(f"{BASE_URL}/users/1/preferences")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        preferences = response.json()
        print(f"Current preferences: {json.dumps(preferences, indent=2)}")
    else:
        print(f"Error: {response.text}")
    
    # Test 2: Create a new preference
    print("\n2. Testing POST new preference:")
    new_preference = {
        "key": "test_preference",
        "value": "test_value"
    }
    response = requests.post(f"{BASE_URL}/users/1/preferences", json=new_preference)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Created preference: {response.json()}")
    else:
        print(f"Error: {response.text}")
    
    # Test 3: Update an existing preference
    print("\n3. Testing PUT update preference:")
    update_preference = {
        "value": "updated_test_value"
    }
    response = requests.put(f"{BASE_URL}/users/1/preferences/test_preference", json=update_preference)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Updated preference: {response.json()}")
    else:
        print(f"Error: {response.text}")
    
    # Test 4: Get all preferences again to see the changes
    print("\n4. Testing GET all preferences after update:")
    response = requests.get(f"{BASE_URL}/users/1/preferences")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        preferences = response.json()
        print(f"Updated preferences: {json.dumps(preferences, indent=2)}")
    else:
        print(f"Error: {response.text}")
    
    # Test 5: Bulk upsert preferences
    print("\n5. Testing POST bulk upsert preferences:")
    bulk_preferences = [
        {"key": "email_notifications", "value": "false"},
        {"key": "sms_notifications", "value": "true"},
        {"key": "marketing_emails", "value": "false"}
    ]
    response = requests.post(f"{BASE_URL}/users/1/preferences/bulk", json=bulk_preferences)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Bulk upsert result: {response.json()}")
    else:
        print(f"Error: {response.text}")
    
    # Test 6: Get final state
    print("\n6. Testing GET final preferences state:")
    response = requests.get(f"{BASE_URL}/users/1/preferences")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        preferences = response.json()
        print(f"Final preferences: {json.dumps(preferences, indent=2)}")
    else:
        print(f"Error: {response.text}")

if __name__ == "__main__":
    test_preferences()
