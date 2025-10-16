"""
Test PDF Upload and Metadata Extraction
This script tests if PDFs are uploaded correctly and metadata is extracted properly
"""
import asyncio
import os
from app.rag.rag_engine import RAGEngine
from app.database.mongodb import MongoDB

async def test_pdf_metadata():
    """Test PDF upload and metadata extraction"""
    
    # Initialize components
    print("🔧 Initializing RAG Engine...")
    mongo_db = MongoDB()
    await mongo_db.connect()
    
    rag_engine = RAGEngine(db=mongo_db)
    
    # Check if test PDF exists
    test_pdf = "uploads/test_sample.pdf"
    
    if not os.path.exists(test_pdf):
        print(f"❌ Test PDF not found at {test_pdf}")
        print("📝 Please place a PDF file at 'uploads/test_sample.pdf' to test")
        await mongo_db.disconnect()
        return
    
    print(f"✅ Found test PDF: {test_pdf}")
    
    # Test ingestion
    print("\n📤 Testing PDF upload and metadata extraction...")
    try:
        result = await rag_engine.ingest_file(
            file_path=test_pdf,
            source_type="test_upload"
        )
        
        print("\n✅ Upload Successful!")
        print(f"📄 Document ID: {result['document_id']}")
        print(f"📝 Filename: {result.get('filename', 'N/A')}")
        print(f"📊 Chunks Created: {result['chunks_created']}")
        
        # Get full document details
        print("\n🔍 Retrieving document details...")
        document = await rag_engine.get_document(result['document_id'])
        
        if document:
            print("\n📋 Document Metadata:")
            print(f"   Title: {document.get('title', 'N/A')}")
            print(f"   Filename: {document.get('filename', 'N/A')}")
            print(f"   File Type: {document.get('file_type', 'N/A')}")
            print(f"   File Size: {document.get('file_size', 0)} bytes")
            print(f"   Page Count: {document.get('page_count', 'N/A')}")
            
            # PDF-specific metadata
            if document.get('pdf_title'):
                print(f"\n📄 PDF Metadata:")
                print(f"   PDF Title: {document.get('pdf_title', 'N/A')}")
                print(f"   PDF Author: {document.get('pdf_author', 'N/A')}")
                print(f"   PDF Subject: {document.get('pdf_subject', 'N/A')}")
                print(f"   PDF Creator: {document.get('pdf_creator', 'N/A')}")
            
            print(f"\n📅 Created: {document.get('created_at', 'N/A')}")
            print(f"🏷️  Source Type: {document.get('source_type', 'N/A')}")
        
        # Test query
        print("\n🤖 Testing AI Query on uploaded document...")
        query_result = await rag_engine.query("What is this document about?")
        
        print(f"\n💬 AI Response:")
        print(f"   {query_result['answer'][:200]}...")
        print(f"   Sources Used: {query_result['num_sources']}")
        
    except Exception as e:
        print(f"\n❌ Error during test: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        await mongo_db.disconnect()
        print("\n✅ Test completed!")

if __name__ == "__main__":
    asyncio.run(test_pdf_metadata())
