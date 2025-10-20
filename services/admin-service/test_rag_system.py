"""
Test script for Lightweight RAG System
Run this to verify all components are working
"""
import requests
import json
import os

BASE_URL = "http://localhost:8009"

def test_health():
    """Test health endpoint"""
    print("\n=== Testing Health Check ===")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200

def test_root():
    """Test root endpoint"""
    print("\n=== Testing Root Endpoint ===")
    response = requests.get(f"{BASE_URL}/")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200

def test_upload_txt():
    """Test uploading a TXT file"""
    print("\n=== Testing TXT File Upload ===")
    
    # Create a sample text file
    sample_text = """
    This is a test document for the RAG system.
    It contains information about artificial intelligence and machine learning.
    
    Artificial Intelligence (AI) is the simulation of human intelligence by machines.
    Machine Learning is a subset of AI that enables systems to learn from data.
    
    The RAG system uses embeddings to create vector representations of text.
    These vectors are stored in Pinecone for efficient similarity search.
    """
    
    # Save to file
    with open("test_document.txt", "w") as f:
        f.write(sample_text)
    
    # Upload file
    with open("test_document.txt", "rb") as f:
        files = {"file": ("test_document.txt", f, "text/plain")}
        response = requests.post(f"{BASE_URL}/api/rag/upload", files=files)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    # Clean up
    os.remove("test_document.txt")
    
    return response.status_code == 200

def test_list_documents():
    """Test listing documents"""
    print("\n=== Testing List Documents ===")
    response = requests.get(f"{BASE_URL}/api/rag/list?limit=10&skip=0")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200

def test_query():
    """Test querying the RAG system"""
    print("\n=== Testing RAG Query ===")
    
    query_data = {
        "query": "What is artificial intelligence?",
        "top_k": 5
    }
    
    response = requests.post(
        f"{BASE_URL}/api/rag/query",
        json=query_data
    )
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"\nQuery: {query_data['query']}")
        print(f"\nAnswer: {result.get('answer', 'No answer')}")
        print(f"\nContext Used: {result.get('context_used', 0)} chunks")
        print(f"\nSources: {len(result.get('sources', []))} sources")
        
        if result.get('sources'):
            print("\nSource Details:")
            for i, source in enumerate(result['sources'][:2], 1):
                print(f"  {i}. {source.get('filename')} (Score: {source.get('score', 0):.4f})")
    else:
        print(f"Response: {response.text}")
    
    return response.status_code == 200

def test_stats():
    """Test getting system statistics"""
    print("\n=== Testing System Stats ===")
    response = requests.get(f"{BASE_URL}/api/rag/stats")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200

def run_all_tests():
    """Run all tests"""
    print("=" * 60)
    print("LIGHTWEIGHT RAG SYSTEM - TEST SUITE")
    print("=" * 60)
    
    tests = [
        ("Health Check", test_health),
        ("Root Endpoint", test_root),
        ("Upload TXT", test_upload_txt),
        ("List Documents", test_list_documents),
        ("Query RAG", test_query),
        ("System Stats", test_stats),
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"\n❌ Error in {test_name}: {str(e)}")
            results[test_name] = False
    
    # Print summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    for test_name, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test_name:.<40} {status}")
    
    total = len(results)
    passed = sum(results.values())
    print(f"\nTotal: {passed}/{total} tests passed")
    print("=" * 60)

if __name__ == "__main__":
    print("Make sure the Admin Service is running on http://localhost:8009")
    input("Press Enter to start tests...")
    run_all_tests()
