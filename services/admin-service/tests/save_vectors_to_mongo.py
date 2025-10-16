"""
Manually save FAISS vectors to MongoDB GridFS
"""
import asyncio
from app.database.mongodb import MongoDB
from app.rag.vector_store import FAISSVectorStore

async def save_to_mongodb():
    """Load local vectors and save to MongoDB"""
    
    print("🔄 Saving Vectors to MongoDB GridFS\n")
    
    # Connect to MongoDB
    print("1. Connecting to MongoDB...")
    db = MongoDB()
    await db.connect()
    print("✅ Connected\n")
    
    # Initialize vector store (will load from local cache)
    print("2. Loading vector store from local cache...")
    vector_store = FAISSVectorStore(db=db)
    await vector_store.initialize()
    print(f"✅ Loaded {vector_store.index.ntotal} vectors\n")
    
    # Force save to MongoDB
    print("3. Saving to MongoDB GridFS...")
    await vector_store._save_to_mongodb()
    print("✅ Saved to MongoDB\n")
    
    # Verify
    print("4. Verifying files in GridFS...")
    index_file = await db.db.fs.files.find_one({"filename": "faiss_index.bin"})
    metadata_file = await db.db.fs.files.find_one({"filename": "faiss_metadata.pkl"})
    
    if index_file:
        print(f"✅ faiss_index.bin: {index_file['length']:,} bytes")
        if 'metadata' in index_file:
            print(f"   Vectors: {index_file['metadata'].get('vector_count')}")
    else:
        print("❌ faiss_index.bin NOT found")
    
    if metadata_file:
        print(f"✅ faiss_metadata.pkl: {metadata_file['length']:,} bytes")
        if 'metadata' in metadata_file:
            print(f"   Entries: {metadata_file['metadata'].get('entry_count')}")
    else:
        print("❌ faiss_metadata.pkl NOT found")
    
    print("\n✅ Done!")
    
    await db.disconnect()

if __name__ == "__main__":
    asyncio.run(save_to_mongodb())
