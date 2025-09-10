#!/usr/bin/env python3
"""
Create the "dean" gig directly in database (matching the API response)
"""

from app.db import crud, session
from app.db.schemas import GigCreate, ExpertCategoryEnum

def create_dean_gig():
    """Create the dean gig directly in database"""
    
    # Get database session
    db = next(session.get_db())
    
    try:
        # Create the exact gig data from the API response
        gig_data = GigCreate(
            name="dean",
            title="bla", 
            bio="bla",
            category=ExpertCategoryEnum.AUTOMOBILE_ADVICE,
            hourly_rate=1000.0,
            service_description="bla",
            availability_preferences="bla",
            education="bla",
            experience="bla", 
            references="0719548297",
            background_check_consent=True,
            languages=["English"]
        )
        
        # Create with expert ID "1" to match API response
        result = crud.create_gig(db=db, gig=gig_data, expert_id="1")
        
        print(f"✓ Dean's gig created successfully!")
        print(f"  ID: {result.id}")
        print(f"  Name: {result.name}")
        print(f"  Expert ID: {result.expert_id}")
        print(f"  Status: {result.status}")
        print(f"  Created At: {result.created_at}")
        
        # Update to ACTIVE status immediately
        from sqlalchemy import text
        db.execute(text(f"UPDATE gigs SET status = 'ACTIVE' WHERE id = '{result.id}'"))
        db.commit()
        print(f"✓ Updated status to ACTIVE")
        
        return result.id
        
    except Exception as e:
        print(f"✗ Error creating gig: {e}")
        import traceback
        traceback.print_exc()
        return None
    finally:
        db.close()

if __name__ == "__main__":
    print("Creating dean's gig directly in database...")
    gig_id = create_dean_gig()
    
    if gig_id:
        print(f"\n✓ Dean's gig {gig_id} is now available in frontend!")
