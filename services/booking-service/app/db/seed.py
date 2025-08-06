from sqlalchemy.orm import Session
from app.db.models import User, Gig
from app.core.logging import logger

def seed_database(db: Session):
    """Seed the database with some initial test data."""
    logger.info("Checking if test data needs to be seeded...")
    
    # Check if we have any users
    user_count = db.query(User).count()
    if user_count == 0:
        logger.info("No users found. Adding test users...")
        test_users = [
            User(id=1),  # This matches the hardcoded user ID in session.py
            User(id=2),
            User(id=3)
        ]
        db.add_all(test_users)
        db.commit()
        logger.info(f"Added {len(test_users)} test users")
    
    # Check if we have any gigs
    gig_count = db.query(Gig).count()
    if gig_count == 0:
        logger.info("No gigs found. Adding test gigs...")
        test_gigs = [
            Gig(id=1),
            Gig(id=2),
            Gig(id=3),
            Gig(id=4),
            Gig(id=5)
        ]
        db.add_all(test_gigs)
        db.commit()
        logger.info(f"Added {len(test_gigs)} test gigs")
    
    logger.info("Database seeding completed")
