#!/usr/bin/env python3
"""
Update gig status to ACTIVE for frontend visibility
"""

from app.db import session
from sqlalchemy import text

def update_gig_status():
    """Update gig status to ACTIVE"""
    
    # Get database session
    db = next(session.get_db())
    
    try:
        # Check current status first
        result = db.execute(text("SELECT id, name, expert_id, status FROM gigs WHERE expert_id = '1'"))
        row = result.fetchone()
        if row:
            print(f'Current gig status: {row.status}')
        
        # Try updating with different case variations
        for status_value in ['ACTIVE', 'active']:
            try:
                db.execute(text(f"UPDATE gigs SET status = '{status_value}' WHERE expert_id = '1'"))
                db.commit()
                print(f'✓ Updated gig status to {status_value}')
                break
            except Exception as e:
                print(f'Failed with {status_value}: {str(e)[:100]}...')
                db.rollback()
                continue
        
        # Verify the final status
        result = db.execute(text("SELECT id, name, expert_id, status FROM gigs WHERE expert_id = '1'"))
        row = result.fetchone()
        if row:
            print(f'✓ Final gig status: {row.status}')
            print(f'  ID: {row.id}')
            print(f'  Name: {row.name}')
        else:
            print('✗ Gig not found')
        
    except Exception as e:
        print(f'✗ Error updating status: {e}')
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    update_gig_status()
