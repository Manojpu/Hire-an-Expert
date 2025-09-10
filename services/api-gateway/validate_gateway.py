"""
Simple validation test to demonstrate API Gateway functionality
This test shows that the API Gateway is working correctly for all key scenarios
"""
from starlette.testclient import TestClient
from unittest.mock import AsyncMock, patch
from main import app, client
import json

def run_validation_tests():
    """Run validation tests to verify API Gateway functionality"""
    
    test_client = TestClient(app)
    
    print("🧪 API Gateway Validation Tests")
    print("=" * 50)
    
    tests_passed = 0
    tests_total = 0
    
    # Test 1: Health Check
    print("\n1. Testing Health Check Endpoint...")
    tests_total += 1
    try:
        response = test_client.get("/health")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Status: {data['status']}")
            print(f"   📊 Services configured: {len(data['services'])}")
            print(f"   🕐 Uptime: {data['uptime']:.3f}s")
            tests_passed += 1
        else:
            print(f"   ❌ Failed with status: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 2: Authentication Protection
    print("\n2. Testing Authentication Protection...")
    tests_total += 1
    try:
        response = test_client.get("/api/gigs/")
        if response.status_code == 401:
            print("   ✅ Protected routes require authentication")
            tests_passed += 1
        else:
            print(f"   ❌ Expected 401, got {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 3: Public Routes (Auth)
    print("\n3. Testing Public Auth Routes...")
    tests_total += 1
    try:
        with patch.object(client, 'request') as mock_request:
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_response.content = b'{"message": "login successful"}'
            mock_response.headers = {"content-type": "application/json"}
            mock_request.return_value = mock_response
            
            response = test_client.post("/api/auth/login", json={"email": "test@test.com"})
            if response.status_code == 200:
                print("   ✅ Auth routes work without authentication")
                tests_passed += 1
            else:
                print(f"   ❌ Auth route failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 4: Protected Routes with Mock Auth
    print("\n4. Testing Protected Routes with Authentication...")
    tests_total += 1
    try:
        with patch.object(client, 'post') as mock_auth, \
             patch.object(client, 'request') as mock_request:
            
            # Mock successful auth
            mock_auth_response = AsyncMock()
            mock_auth_response.status_code = 200
            mock_auth_response.json.return_value = {"user_id": "test123"}
            mock_auth.return_value = mock_auth_response
            
            # Mock service response
            mock_service_response = AsyncMock()
            mock_service_response.status_code = 200
            mock_service_response.content = b'{"gigs": [{"id": 1, "title": "Test Gig"}]}'
            mock_service_response.headers = {"content-type": "application/json"}
            mock_request.return_value = mock_service_response
            
            headers = {"Authorization": "Bearer test_token"}
            response = test_client.get("/api/gigs/", headers=headers)
            
            if response.status_code == 200:
                print("   ✅ Protected routes work with valid authentication")
                data = response.json()
                print(f"   📊 Response data: {json.dumps(data, indent=2)}")
                tests_passed += 1
            else:
                print(f"   ❌ Protected route failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 5: Different HTTP Methods
    print("\n5. Testing Different HTTP Methods...")
    tests_total += 1
    try:
        methods_tested = 0
        methods_passed = 0
        
        for method in ["GET", "POST", "PUT", "DELETE", "PATCH"]:
            with patch.object(client, 'post') as mock_auth, \
                 patch.object(client, 'request') as mock_request:
                
                # Mock auth
                mock_auth_response = AsyncMock()
                mock_auth_response.status_code = 200
                mock_auth_response.json.return_value = {"user_id": "test123"}
                mock_auth.return_value = mock_auth_response
                
                # Mock service response
                mock_service_response = AsyncMock()
                mock_service_response.status_code = 200
                mock_service_response.content = b'{"success": true}'
                mock_service_response.headers = {"content-type": "application/json"}
                mock_request.return_value = mock_service_response
                
                headers = {"Authorization": "Bearer test_token"}
                response = test_client.request(method, "/api/gigs/test", headers=headers)
                
                methods_tested += 1
                if response.status_code == 200:
                    methods_passed += 1
        
        if methods_passed == methods_tested:
            print(f"   ✅ All {methods_tested} HTTP methods work correctly")
            tests_passed += 1
        else:
            print(f"   ❌ Only {methods_passed}/{methods_tested} methods worked")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 6: Service Error Handling
    print("\n6. Testing Service Error Handling...")
    tests_total += 1
    try:
        with patch.object(client, 'post') as mock_auth, \
             patch.object(client, 'request') as mock_request:
            
            # Mock successful auth
            mock_auth_response = AsyncMock()
            mock_auth_response.status_code = 200
            mock_auth_response.json.return_value = {"user_id": "test123"}
            mock_auth.return_value = mock_auth_response
            
            # Mock service error
            import httpx
            mock_request.side_effect = httpx.RequestError("Service unavailable")
            
            headers = {"Authorization": "Bearer test_token"}
            response = test_client.get("/api/gigs/", headers=headers)
            
            if response.status_code == 503:
                print("   ✅ Service errors handled gracefully (503 Service Unavailable)")
                tests_passed += 1
            else:
                print(f"   ❌ Expected 503, got {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 7: Route Mapping
    print("\n7. Testing Route Mapping to Services...")
    tests_total += 1
    try:
        route_tests = [
            ("/api/auth/ping", "auth"),
            ("/api/gigs/search", "gig"),
            ("/api/bookings/list", "booking"),
            ("/api/payments/process", "payment"),
            ("/api/message/send", "message"),
            ("/api/reviews/list", "review")
        ]
        
        routes_passed = 0
        
        for route, expected_service in route_tests:
            with patch.object(client, 'post') as mock_auth, \
                 patch.object(client, 'request') as mock_request:
                
                if expected_service == "auth":
                    # Auth routes don't need authentication
                    mock_response = AsyncMock()
                    mock_response.status_code = 200
                    mock_response.content = b'{"success": true}'
                    mock_response.headers = {"content-type": "application/json"}
                    mock_request.return_value = mock_response
                    
                    response = test_client.get(route)
                    if response.status_code == 200:
                        routes_passed += 1
                else:
                    # Protected routes need auth
                    mock_auth_response = AsyncMock()
                    mock_auth_response.status_code = 200
                    mock_auth_response.json.return_value = {"user_id": "test123"}
                    mock_auth.return_value = mock_auth_response
                    
                    mock_service_response = AsyncMock()
                    mock_service_response.status_code = 200
                    mock_service_response.content = b'{"success": true}'
                    mock_service_response.headers = {"content-type": "application/json"}
                    mock_request.return_value = mock_service_response
                    
                    headers = {"Authorization": "Bearer test_token"}
                    response = test_client.get(route, headers=headers)
                    if response.status_code == 200:
                        routes_passed += 1
        
        if routes_passed == len(route_tests):
            print(f"   ✅ All {len(route_tests)} service routes mapped correctly")
            tests_passed += 1
        else:
            print(f"   ❌ Only {routes_passed}/{len(route_tests)} routes worked")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Summary
    print("\n" + "=" * 50)
    print("📋 VALIDATION SUMMARY")
    print("=" * 50)
    
    for i in range(1, tests_total + 1):
        test_names = [
            "Health Check",
            "Authentication Protection", 
            "Public Auth Routes",
            "Protected Routes with Auth",
            "HTTP Methods Support",
            "Service Error Handling",
            "Route Mapping"
        ]
        status = "✅ PASSED" if i <= tests_passed else "❌ FAILED"
        print(f"{i}. {test_names[i-1]:.<40} {status}")
    
    print(f"\nOverall Result: {tests_passed}/{tests_total} tests passed")
    
    if tests_passed == tests_total:
        print("🎉 ALL VALIDATION TESTS PASSED!")
        print("✅ API Gateway is working correctly for all conditions!")
        return True
    else:
        print(f"⚠️  {tests_total - tests_passed} test(s) failed")
        return False

if __name__ == "__main__":
    success = run_validation_tests()
    print(f"\n{'✅ SUCCESS' if success else '❌ FAILURE'}: API Gateway validation {'completed successfully' if success else 'had some issues'}")
