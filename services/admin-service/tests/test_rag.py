"""
Test script for RAG system
"""
import asyncio
import sys
sys.path.append('.')

from app.rag.vector_store import FAISSVectorStore
from app.rag.gemini_service import GeminiService
from app.rag.document_processor import DocumentProcessor
from app.rag.rag_engine import RAGEngine
from app.database.mongodb import MongoDB
from app.config import settings

async def test_rag_system():
    """Test the complete RAG system"""
    
    print("🧪 Testing RAG System\n")
    
    # Initialize components
    print("1️⃣ Initializing components...")
    db = MongoDB()
    await db.connect()
    
    vector_store = FAISSVectorStore()
    await vector_store.initialize()
    
    gemini = GeminiService()
    doc_processor = DocumentProcessor()
    
    rag_engine = RAGEngine(
        vector_store=vector_store,
        gemini_service=gemini,
        doc_processor=doc_processor,
        db=db
    )
    print("✅ All components initialized\n")
    
    # Test 1: Ingest text
    print("2️⃣ Testing text ingestion...")
    test_text = """
    Python is a high-level, interpreted programming language. 
    It was created by Guido van Rossum and first released in 1991.
    Python emphasizes code readability with its use of significant indentation.
    It supports multiple programming paradigms including procedural, object-oriented, and functional programming.
    Python is widely used in web development, data science, artificial intelligence, and automation.
    """
    
    result = await rag_engine.ingest_text(
        text=test_text,
        title="Introduction to Python",
        source_type="test"
    )
    print(f"✅ Ingested: {result['chunks_created']} chunks\n")
    
    # Test 2: Query without context
    print("3️⃣ Testing query without context...")
    query_result = await rag_engine.query(
        question="What is JavaScript?",
        include_sources=False
    )
    print(f"Answer: {query_result['answer'][:200]}...")
    print(f"Context used: {query_result['context_used']}\n")
    
    # Test 3: Query with context
    print("4️⃣ Testing query with context...")
    query_result = await rag_engine.query(
        question="Who created Python and when?",
        include_sources=True
    )
    print(f"Answer: {query_result['answer']}")
    print(f"Context used: {query_result['context_used']}")
    print(f"Sources: {query_result['num_sources']}\n")
    
    # Test 4: Get statistics
    print("5️⃣ Getting system statistics...")
    stats = await rag_engine.get_stats()
    print(f"Total vectors: {stats['vector_store']['total_vectors']}")
    print(f"Total documents: {stats['database']['total_documents']}")
    print(f"LLM Model: {stats['system']['llm_model']}\n")
    
    # Test 5: List documents
    print("6️⃣ Listing documents...")
    docs = await rag_engine.list_documents()
    print(f"Total documents: {len(docs)}")
    if docs:
        print(f"Latest: {docs[0].get('title', 'N/A')}\n")
    
    # Cleanup
    print("🧹 Cleaning up...")
    if docs:
        await rag_engine.delete_document(docs[0]['_id'])
        print("✅ Test document deleted")
    
    await db.disconnect()
    print("\n✅ All tests completed!")

if __name__ == "__main__":
    asyncio.run(test_rag_system())
