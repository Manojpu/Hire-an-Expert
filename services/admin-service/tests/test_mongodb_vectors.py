"""
Test MongoDB GridFS vector storage
"""
import asyncio
from app.database.mongodb import MongoDB
from app.rag.vector_store import FAISSVectorStore

async def test_mongodb_storage():
    """Test saving and loading vectors from MongoDB"""
    
    print("🧪 Testing MongoDB GridFS Vector Storage\n")
    
    # Initialize MongoDB
    print("1. Connecting to MongoDB...")
    db = MongoDB()
    await db.connect()
    print("✅ Connected\n")
    
    # Initialize vector store
    print("2. Initializing vector store...")
    vector_store = FAISSVectorStore(db=db)
    await vector_store.initialize()
    print(f"✅ Initialized with {vector_store.index.ntotal} vectors\n")
    
    # Check stats
    stats = vector_store.get_stats()
    print("📊 Vector Store Stats:")
    print(f"   Total vectors: {stats['total_vectors']}")
    print(f"   Embedding model: {stats['embedding_model']}")
    print(f"   Metadata count: {stats['metadata_count']}")
    print()
    
    # Check if data exists in MongoDB GridFS
    print("3. Checking MongoDB GridFS...")
    index_file = await db.fs.find_one({"filename": "faiss_index.bin"})
    metadata_file = await db.fs.find_one({"filename": "faiss_metadata.pkl"})
    
    if index_file:
        print(f"✅ FAISS index found in GridFS")
        print(f"   File ID: {index_file._id}")
        print(f"   Size: {index_file.length:,} bytes")
        print(f"   Uploaded: {index_file.uploadDate}")
        if index_file.metadata:
            print(f"   Vectors: {index_file.metadata.get('vector_count', 'N/A')}")
    else:
        print("❌ FAISS index NOT found in GridFS")
    
    print()
    
    if metadata_file:
        print(f"✅ Metadata found in GridFS")
        print(f"   File ID: {metadata_file._id}")
        print(f"   Size: {metadata_file.length:,} bytes")
        print(f"   Uploaded: {metadata_file.uploadDate}")
        if metadata_file.metadata:
            print(f"   Entries: {metadata_file.metadata.get('entry_count', 'N/A')}")
    else:
        print("❌ Metadata NOT found in GridFS")
    
    print()
    
    # Test search if vectors exist
    if vector_store.index.ntotal > 0:
        print("4. Testing search...")
        results = vector_store.search("What is FastAPI?", k=3)
        print(f"✅ Found {len(results)} results")
        if results:
            print(f"   Top result: {results[0]['text'][:100]}...")
            print(f"   Similarity: {results[0]['similarity']:.4f}")
    else:
        print("⚠️ No vectors to search (add data using load_sample_data.py)")
    
    print()
    print("✅ Test complete!")
    
    # Cleanup
    await db.disconnect()

if __name__ == "__main__":
    asyncio.run(test_mongodb_storage())
