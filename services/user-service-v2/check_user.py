import asyncio
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_async_db, async_engine
from models import User
from sqlalchemy import select

async def check_user_exists():
    user_id = "67555423-27ee-4b0c-be76-89975fd1b6a6"
    
    async with async_engine.begin() as conn:
        # Create a new session
        async_session = AsyncSession(conn)
        
        try:
            # Check if user exists by ID
            result = await async_session.execute(select(User).where(User.id == uuid.UUID(user_id)))
            user = result.scalar_one_or_none()
            
            if user:
                print(f"✅ User found by ID: {user.id}")
                print(f"   Firebase UID: {user.firebase_uid}")
                print(f"   Email: {user.email}")
                print(f"   Name: {user.name}")
            else:
                print(f"❌ No user found with ID: {user_id}")
                
                # Check all users
                result = await async_session.execute(select(User))
                all_users = result.scalars().all()
                print(f"Total users in database: {len(all_users)}")
                for user in all_users:
                    print(f"   - ID: {user.id}, Firebase UID: {user.firebase_uid}, Email: {user.email}")
                    
        except Exception as e:
            print(f"Error checking user: {e}")

if __name__ == "__main__":
    asyncio.run(check_user_exists())
