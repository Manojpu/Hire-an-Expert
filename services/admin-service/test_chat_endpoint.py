"""
Quick test for the /api/rag/chat endpoint
"""
import requests
import json

# Test through API Gateway
GATEWAY_URL = "http://localhost:8000"
ADMIN_URL = "http://localhost:8009"

def test_chat_endpoint():
    """Test the chat endpoint"""
    
    print("=" * 60)
    print("Testing /api/rag/chat endpoint")
    print("=" * 60)
    
    # Test data
    chat_data = {
        "messages": [
            {"role": "user", "content": "Hello, what can you tell me?"}
        ],
        "use_context": True
    }
    
    # Test 1: Direct to Admin Service
    print("\n1. Testing direct to Admin Service (localhost:8009)")
    try:
        response = requests.post(
            f"{ADMIN_URL}/api/rag/chat",
            json=chat_data,
            timeout=30
        )
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            print(f"   ✅ SUCCESS")
            result = response.json()
            print(f"   Response: {result.get('response', '')[:100]}...")
        else:
            print(f"   ❌ FAILED")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   ❌ ERROR: {str(e)}")
    
    # Test 2: Through API Gateway
    print("\n2. Testing through API Gateway (localhost:8000)")
    try:
        response = requests.post(
            f"{GATEWAY_URL}/api/rag/chat",
            json=chat_data,
            timeout=30
        )
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            print(f"   ✅ SUCCESS")
            result = response.json()
            print(f"   Response: {result.get('response', '')[:100]}...")
        else:
            print(f"   ❌ FAILED")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   ❌ ERROR: {str(e)}")
    
    # Test 3: Query endpoint for comparison
    print("\n3. Testing /api/rag/query endpoint (should work)")
    try:
        query_data = {
            "query": "What is machine learning?",
            "top_k": 3
        }
        response = requests.post(
            f"{GATEWAY_URL}/api/rag/query",
            json=query_data,
            timeout=30
        )
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            print(f"   ✅ SUCCESS")
            result = response.json()
            print(f"   Answer: {result.get('answer', '')[:100]}...")
        else:
            print(f"   ❌ FAILED")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   ❌ ERROR: {str(e)}")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    print("\nMake sure both services are running:")
    print("  - Admin Service on http://localhost:8009")
    print("  - API Gateway on http://localhost:8000")
    print()
    input("Press Enter to start tests...")
    test_chat_endpoint()
