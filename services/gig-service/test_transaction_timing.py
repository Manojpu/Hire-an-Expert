#!/usr/bin/env python3
"""
Test transaction isolation issue
"""

import requests
import json
import time

def test_transaction_timing():
    """Test if there's a transaction timing issue"""
    
    # Check initial count
    from app.db.session import engine
    from sqlalchemy import text
    
    print("=== Checking initial database state ===")
    with engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) FROM gigs"))
        initial_count = result.scalar()
        print(f"Initial gigs count: {initial_count}")
    
    # Test data
    gig_data = {
        "name": "Transaction Test Expert",
        "title": "Transaction Test Title", 
        "bio": "Transaction test bio",
        "category": "automobile-advice",
        "hourly_rate": 300.0,
        "service_description": "Transaction test service",
        "availability_preferences": "Transaction test availability",
        "education": "Transaction test education",
        "experience": "Transaction test experience", 
        "references": "Transaction test references",
        "background_check_consent": True,
        "languages": ["English"]
    }
    
    try:
        print("\n=== Making API call ===")
        response = requests.post(
            "http://localhost:8002/gigs/",
            json=gig_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 201:
            result = response.json()
            print("✓ API call successful!")
            print(f"  Returned ID: {result['id']}")
            gig_id = result['id']
            
            # Check database immediately after API call
            print(f"\n=== Checking database immediately after API call ===")
            with engine.connect() as conn:
                result = conn.execute(text("SELECT COUNT(*) FROM gigs"))
                new_count = result.scalar()
                print(f"New gigs count: {new_count}")
                print(f"Count difference: {new_count - initial_count}")
                
                # Search for the specific gig
                result = conn.execute(text(f"SELECT id, name, expert_id FROM gigs WHERE id = '{gig_id}'"))
                row = result.fetchone()
                if row:
                    print(f"✓ Found gig in database: {row.id}")
                else:
                    print(f"✗ Gig {gig_id} not found in database")
                    
                # List all gigs
                result = conn.execute(text("SELECT id, name, expert_id, created_at FROM gigs ORDER BY created_at DESC"))
                all_gigs = result.fetchall()
                print(f"\nAll gigs in database ({len(all_gigs)} total):")
                for gig in all_gigs:
                    print(f"  {gig.id}: {gig.name} (Expert: {gig.expert_id}) - {gig.created_at}")
            
            # Wait a moment and check again
            print(f"\n=== Waiting 3 seconds and checking again ===")
            time.sleep(3)
            
            with engine.connect() as conn:
                result = conn.execute(text(f"SELECT id, name, expert_id FROM gigs WHERE id = '{gig_id}'"))
                row = result.fetchone()
                if row:
                    print(f"✓ Still found gig in database: {row.id}")
                else:
                    print(f"✗ Gig {gig_id} still not found in database")
                    
        else:
            print(f"✗ API call failed: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"✗ Error during test: {e}")

if __name__ == "__main__":
    test_transaction_timing()
