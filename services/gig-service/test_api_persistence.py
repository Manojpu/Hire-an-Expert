#!/usr/bin/env python3
"""
Test API endpoint to verify data persistence
"""

import requests
import json

def test_gig_api():
    """Test creating a gig via the API endpoint"""
    
    # Test data
    gig_data = {
        "name": "API Test Expert",
        "title": "API Test Title",
        "bio": "API test bio",
        "category": "automobile-advice", 
        "hourly_rate": 200.0,
        "service_description": "API test service description",
        "availability_preferences": "API test availability",
        "education": "API test education",
        "experience": "API test experience",
        "references": "API test references",
        "background_check_consent": True,
        "languages": ["English"]
    }
    
    try:
        # Make API call
        print("Making API call to create gig...")
        response = requests.post(
            "http://localhost:8002/gigs/",
            json=gig_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 201:
            result = response.json()
            print("✓ Gig created successfully!")
            print(f"  ID: {result['id']}")
            print(f"  Name: {result['name']}")
            print(f"  Expert ID: {result['expert_id']}")
            print(f"  Status: {result['status']}")
            return result['id']
        else:
            print(f"✗ API call failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"✗ Error making API call: {e}")
        return None

def verify_in_database(gig_id):
    """Verify the gig exists in the database"""
    
    from app.db.session import engine
    from sqlalchemy import text
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text(f"SELECT * FROM gigs WHERE id = '{gig_id}'"))
            row = result.fetchone()
            
            if row:
                print("✓ Gig found in database!")
                print(f"  DB ID: {row.id}")
                print(f"  DB Name: {row.name}")
                print(f"  DB Expert ID: {row.expert_id}")
                print(f"  DB Status: {row.status}")
                return True
            else:
                print(f"✗ Gig with ID {gig_id} NOT found in database")
                return False
                
    except Exception as e:
        print(f"✗ Error checking database: {e}")
        return False

if __name__ == "__main__":
    print("=== Testing Gig API Data Persistence ===")
    
    # Test API creation
    gig_id = test_gig_api()
    
    if gig_id:
        print(f"\n=== Verifying Persistence in Database ===")
        verify_in_database(gig_id)
    else:
        print("Skipping database verification due to API failure")
