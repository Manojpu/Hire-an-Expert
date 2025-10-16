"""
Force save current vectors to MongoDB GridFS
"""
import asyncio
from app.database.mongodb import MongoDB
from app.rag.vector_store import FAISSVectorStore

async def force_save():
    print("💾 Force saving vectors to MongoDB GridFS...\n")
    
    db = MongoDB()
    await db.connect()
    
    vector_store = FAISSVectorStore(db=db)
    await vector_store.initialize()
    
    print(f"📊 Current stats:")
    stats = vector_store.get_stats()
    print(f"   Vectors: {stats['total_vectors']}")
    print(f"   Metadata: {stats['metadata_count']}\n")
    
    if stats['total_vectors'] > 0:
        print("💾 Saving to MongoDB GridFS...")
        await vector_store._save_to_mongodb()
        print("✅ Saved successfully!\n")
        
        # Verify
        print("🔍 Verifying in GridFS...")
        index_file = await db.fs.find_one({"filename": "faiss_index.bin"})
        metadata_file = await db.fs.find_one({"filename": "faiss_metadata.pkl"})
        
        if index_file:
            print(f"✅ FAISS index: {index_file.length:,} bytes")
        if metadata_file:
            print(f"✅ Metadata: {metadata_file.length:,} bytes")
    else:
        print("⚠️ No vectors to save. Load sample data first:")
        print("   python load_sample_data.py")
    
    await db.disconnect()

if __name__ == "__main__":
    asyncio.run(force_save())
