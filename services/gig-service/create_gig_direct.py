#!/usr/bin/env python3
"""
Direct database gig creation (bypass API issues)
"""

from app.db import crud, session
from app.db.schemas import GigCreate, ExpertCategoryEnum
import uuid

def create_gig_directly():
    """Create a gig directly in the database"""
    
    # Get database session
    db = next(session.get_db())
    
    try:
        # Create the gig data (matching your API response format)
        gig_data = GigCreate(
            name="Janindu",
            title="bla", 
            bio="bla",
            category=ExpertCategoryEnum.AUTOMOBILE_ADVICE,
            hourly_rate=1000.0,
            service_description="bla",
            availability_preferences="bla",
            education="bla",
            experience="bla", 
            references="bla",
            background_check_consent=True,
            languages=["English"]
        )
        
        # Create with expert ID "1" to match your API response
        result = crud.create_gig(db=db, gig=gig_data, expert_id="1")
        
        print(f"✓ Gig created successfully!")
        print(f"  ID: {result.id}")
        print(f"  Name: {result.name}")
        print(f"  Expert ID: {result.expert_id}")
        print(f"  Status: {result.status}")
        print(f"  Created At: {result.created_at}")
        
        return result.id
        
    except Exception as e:
        print(f"✗ Error creating gig: {e}")
        import traceback
        traceback.print_exc()
        return None
    finally:
        db.close()

if __name__ == "__main__":
    print("Creating gig directly in database...")
    gig_id = create_gig_directly()
    
    if gig_id:
        print(f"\n✓ Gig {gig_id} should now be visible in frontend!")
