"""
Test RAG Routes through API Gateway
Tests the integration between API Gateway (port 8000) and Admin Service (port 8009)
"""

import requests
import json
import time

# API Gateway endpoint
GATEWAY_BASE = "http://localhost:8000"
RAG_ENDPOINT = f"{GATEWAY_BASE}/api/rag"

# Colors for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_test(name, passed, response=None):
    """Print test result"""
    status = f"{GREEN}✓ PASSED{RESET}" if passed else f"{RED}✗ FAILED{RESET}"
    print(f"\n{status} - {name}")
    if response:
        print(f"  Status: {response.status_code}")
        if response.status_code >= 400:
            print(f"  Response: {response.text[:200]}")

def test_gateway_health():
    """Test API Gateway health check"""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}Testing API Gateway Health{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")
    
    try:
        response = requests.get(f"{GATEWAY_BASE}/health", timeout=5)
        passed = response.status_code == 200
        print_test("Gateway Health Check", passed, response)
        if passed:
            print(f"  Gateway Response: {response.json()}")
        return passed
    except Exception as e:
        print_test("Gateway Health Check", False)
        print(f"  Error: {str(e)}")
        return False

def test_rag_health():
    """Test RAG service health through gateway"""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}Testing RAG Service Health (through Gateway){RESET}")
    print(f"{BLUE}{'='*60}{RESET}")
    
    try:
        response = requests.get(f"{RAG_ENDPOINT}/health", timeout=10)
        passed = response.status_code == 200
        print_test("RAG Health Check", passed, response)
        if passed:
            data = response.json()
            print(f"  Status: {data.get('status')}")
            print(f"  RAG Engine: {data.get('rag_engine')}")
            print(f"  Database: {data.get('database')}")
            print(f"  Vector Store: {data.get('vector_store')}")
        return passed
    except Exception as e:
        print_test("RAG Health Check", False)
        print(f"  Error: {str(e)}")
        return False

def test_rag_query():
    """Test RAG query endpoint through gateway"""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}Testing RAG Query (through Gateway){RESET}")
    print(f"{BLUE}{'='*60}{RESET}")
    
    query_data = {
        "question": "What is FastAPI?",
        "include_sources": True,
        "top_k": 3
    }
    
    try:
        response = requests.post(
            f"{RAG_ENDPOINT}/query",
            json=query_data,
            timeout=15
        )
        passed = response.status_code == 200
        print_test("RAG Query", passed, response)
        
        if passed:
            data = response.json()
            print(f"  Question: {query_data['question']}")
            print(f"  Answer: {data.get('answer', '')[:150]}...")
            print(f"  Sources: {len(data.get('sources', []))} found")
        return passed
    except Exception as e:
        print_test("RAG Query", False)
        print(f"  Error: {str(e)}")
        return False

def test_rag_chat():
    """Test RAG chat endpoint through gateway"""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}Testing RAG Chat (through Gateway){RESET}")
    print(f"{BLUE}{'='*60}{RESET}")
    
    chat_data = {
        "messages": [
            {"role": "user", "content": "Hello! Can you help me?"}
        ],
        "use_context": True
    }
    
    try:
        response = requests.post(
            f"{RAG_ENDPOINT}/chat",
            json=chat_data,
            timeout=15
        )
        passed = response.status_code == 200
        print_test("RAG Chat", passed, response)
        
        if passed:
            data = response.json()
            print(f"  User: {chat_data['messages'][0]['content']}")
            print(f"  AI Response: {data.get('response', '')[:150]}...")
            print(f"  Context Used: {data.get('context_used')}")
        return passed
    except Exception as e:
        print_test("RAG Chat", False)
        print(f"  Error: {str(e)}")
        return False

def test_list_documents():
    """Test listing documents through gateway"""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}Testing List Documents (through Gateway){RESET}")
    print(f"{BLUE}{'='*60}{RESET}")
    
    try:
        response = requests.get(f"{RAG_ENDPOINT}/documents", timeout=10)
        passed = response.status_code == 200
        print_test("List Documents", passed, response)
        
        if passed:
            data = response.json()
            print(f"  Total Documents: {len(data.get('documents', []))}")
            print(f"  Total Chunks: {data.get('total_chunks', 0)}")
        return passed
    except Exception as e:
        print_test("List Documents", False)
        print(f"  Error: {str(e)}")
        return False

def main():
    """Run all tests"""
    print(f"\n{YELLOW}{'='*60}{RESET}")
    print(f"{YELLOW}RAG API Gateway Integration Tests{RESET}")
    print(f"{YELLOW}Testing: API Gateway (port 8000) → Admin Service (port 8009){RESET}")
    print(f"{YELLOW}{'='*60}{RESET}")
    
    # Track results
    results = []
    
    # Run tests
    print(f"\n{BLUE}Starting tests...{RESET}")
    time.sleep(0.5)
    
    results.append(("Gateway Health", test_gateway_health()))
    time.sleep(0.5)
    
    results.append(("RAG Health", test_rag_health()))
    time.sleep(0.5)
    
    results.append(("RAG Query", test_rag_query()))
    time.sleep(0.5)
    
    results.append(("RAG Chat", test_rag_chat()))
    time.sleep(0.5)
    
    results.append(("List Documents", test_list_documents()))
    
    # Summary
    print(f"\n{YELLOW}{'='*60}{RESET}")
    print(f"{YELLOW}Test Summary{RESET}")
    print(f"{YELLOW}{'='*60}{RESET}")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = f"{GREEN}✓{RESET}" if result else f"{RED}✗{RESET}"
        print(f"  {status} {name}")
    
    print(f"\n{BLUE}Results: {passed}/{total} tests passed{RESET}")
    
    if passed == total:
        print(f"{GREEN}All tests passed! ✓{RESET}")
        print(f"\n{GREEN}✓ API Gateway successfully routes RAG requests to Admin Service{RESET}")
        print(f"{GREEN}✓ Frontend can now use: http://localhost:8000/api/rag/*{RESET}")
    else:
        print(f"{RED}Some tests failed. Check configuration.{RESET}")
        print(f"\n{YELLOW}Troubleshooting:{RESET}")
        print(f"  1. Ensure Admin Service is running on port 8009")
        print(f"  2. Ensure API Gateway is running on port 8000")
        print(f"  3. Check service logs for errors")
    
    print(f"\n{YELLOW}{'='*60}{RESET}\n")

if __name__ == "__main__":
    main()
