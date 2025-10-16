"""
Quick check for MongoDB GridFS vector storage
"""
import asyncio
from app.database.mongodb import MongoDB

async def check_gridfs():
    print("🔍 Checking MongoDB GridFS for vector data...\n")
    
    db = MongoDB()
    await db.connect()
    
    # List all GridFS files
    print("📁 Files in GridFS:")
    async for file in db.fs.find():
        print(f"\n   {file.filename}")
        print(f"   - ID: {file._id}")
        print(f"   - Size: {file.length:,} bytes")
        print(f"   - Uploaded: {file.uploadDate}")
        if hasattr(file, 'metadata') and file.metadata:
            for key, value in file.metadata.items():
                print(f"   - {key}: {value}")
    
    await db.disconnect()
    print("\n✅ Done!")

if __name__ == "__main__":
    asyncio.run(check_gridfs())
