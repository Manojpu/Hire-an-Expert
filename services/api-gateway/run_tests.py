"""
Test runner script for API Gateway
Runs all tests and generates coverage reports
"""
import os
import sys
import subprocess
import time
from pathlib import Path

def ensure_test_dependencies():
    """Ensure test dependencies are installed"""
    try:
        import pytest
        import httpx
        from starlette.testclient import TestClient
        print("✅ Test dependencies are available")
        return True
    except ImportError as e:
        print(f"❌ Missing test dependencies: {e}")
        print("Installing test dependencies...")
        
        # Install required packages
        packages = [
            "pytest>=7.0.0",
            "pytest-asyncio>=0.21.0", 
            "httpx>=0.24.0",
            "coverage>=6.0.0"
        ]
        
        for package in packages:
            try:
                result = subprocess.run([
                    sys.executable, "-m", "pip", "install", package
                ], capture_output=True, text=True)
                
                if result.returncode == 0:
                    print(f"✅ Installed {package}")
                else:
                    print(f"❌ Failed to install {package}: {result.stderr}")
                    return False
            except Exception as e:
                print(f"❌ Error installing {package}: {e}")
                return False
        
        print("✅ Test dependencies installed successfully!")
        return True

def run_basic_tests():
    """Run basic tests without pytest"""
    print("\n🧪 Running Basic Tests...")
    print("=" * 50)
    
    try:
        # Import and run basic tests
        from starlette.testclient import TestClient
        from main import app
        
        client = TestClient(app)
        
        tests_passed = 0
        tests_failed = 0
        
        # Test 1: Health Check
        print("🔍 Testing health check endpoint...")
        try:
            response = client.get("/health")
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "OK":
                    print("✅ Health check passed")
                    tests_passed += 1
                else:
                    print(f"❌ Health check failed: Invalid response data {data}")
                    tests_failed += 1
            else:
                print(f"❌ Health check failed: Status {response.status_code}")
                tests_failed += 1
        except Exception as e:
            print(f"❌ Health check error: {e}")
            tests_failed += 1
        
        # Test 2: 404 handling
        print("🔍 Testing 404 handling...")
        try:
            response = client.get("/nonexistent/route")
            if response.status_code == 404:
                print("✅ 404 handling passed")
                tests_passed += 1
            else:
                print(f"❌ 404 handling failed: Status {response.status_code}")
                tests_failed += 1
        except Exception as e:
            print(f"❌ 404 handling error: {e}")
            tests_failed += 1
        
        # Test 3: Auth required routes
        print("🔍 Testing auth required routes...")
        try:
            response = client.get("/api/gigs/")
            if response.status_code == 401:
                print("✅ Auth protection passed")
                tests_passed += 1
            else:
                print(f"❌ Auth protection failed: Status {response.status_code}")
                tests_failed += 1
        except Exception as e:
            print(f"❌ Auth protection error: {e}")
            tests_failed += 1
        
        # Test 4: CORS headers
        print("🔍 Testing CORS headers...")
        try:
            response = client.get("/health")
            cors_headers = [h.lower() for h in response.headers.keys()]
            if any("access-control" in h for h in cors_headers):
                print("✅ CORS headers passed")
                tests_passed += 1
            else:
                print("❌ CORS headers failed: No CORS headers found")
                tests_failed += 1
        except Exception as e:
            print(f"❌ CORS headers error: {e}")
            tests_failed += 1
        
        print(f"\n📊 Test Results: {tests_passed} passed, {tests_failed} failed")
        return tests_failed == 0
        
    except Exception as e:
        print(f"❌ Failed to run basic tests: {e}")
        return False

def run_pytest_tests():
    """Run tests using pytest"""
    print("\n🧪 Running Pytest Tests...")
    print("=" * 50)
    
    test_files = [
        "test_main.py",
        "test_performance.py", 
        "test_integration.py"
    ]
    
    # Check which test files exist
    existing_files = []
    for test_file in test_files:
        if os.path.exists(test_file):
            existing_files.append(test_file)
            print(f"✅ Found {test_file}")
        else:
            print(f"⚠️  {test_file} not found")
    
    if not existing_files:
        print("❌ No test files found!")
        return False
    
    # Run pytest
    try:
        cmd = [sys.executable, "-m", "pytest"] + existing_files + ["-v", "--tb=short"]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        print("STDOUT:", result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        
        if result.returncode == 0:
            print("✅ All pytest tests passed!")
            return True
        else:
            print(f"❌ Some pytest tests failed (exit code: {result.returncode})")
            return False
            
    except Exception as e:
        print(f"❌ Error running pytest: {e}")
        return False

def run_coverage_tests():
    """Run tests with coverage"""
    print("\n📊 Running Coverage Analysis...")
    print("=" * 50)
    
    try:
        # Run tests with coverage
        cmd = [
            sys.executable, "-m", "coverage", "run", 
            "--source=main,config,middleware", 
            "-m", "pytest", "-v"
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Coverage tests completed")
            
            # Generate coverage report
            report_cmd = [sys.executable, "-m", "coverage", "report"]
            report_result = subprocess.run(report_cmd, capture_output=True, text=True)
            
            if report_result.returncode == 0:
                print("📋 Coverage Report:")
                print(report_result.stdout)
                
                # Generate HTML report
                html_cmd = [sys.executable, "-m", "coverage", "html"]
                html_result = subprocess.run(html_cmd, capture_output=True, text=True)
                
                if html_result.returncode == 0:
                    print("📄 HTML coverage report generated in htmlcov/")
                
            return True
        else:
            print(f"❌ Coverage tests failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error running coverage: {e}")
        return False

def run_manual_api_tests():
    """Run manual API tests"""
    print("\n🔧 Running Manual API Tests...")
    print("=" * 50)
    
    try:
        from unittest.mock import AsyncMock, patch
        from starlette.testclient import TestClient
        from main import app, client
        
        test_client = TestClient(app)
        tests_results = []
        
        # Test health endpoint
        print("🔍 Testing /health endpoint...")
        response = test_client.get("/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check: {data.get('status')}")
            print(f"📊 Uptime: {data.get('uptime', 0):.2f}s")
            print(f"🕐 Timestamp: {data.get('timestamp')}")
            tests_results.append(True)
        else:
            print(f"❌ Health check failed: {response.status_code}")
            tests_results.append(False)
        
        # Test auth required endpoint without token
        print("\n🔍 Testing protected endpoint without auth...")
        response = test_client.get("/api/gigs/")
        if response.status_code == 401:
            print("✅ Auth protection working correctly")
            tests_results.append(True)
        else:
            print(f"❌ Auth protection failed: {response.status_code}")
            tests_results.append(False)
        
        # Test unknown route
        print("\n🔍 Testing unknown route...")
        response = test_client.get("/unknown/endpoint")
        if response.status_code == 404:
            print("✅ 404 handling working correctly")
            tests_results.append(True)
        else:
            print(f"❌ 404 handling failed: {response.status_code}")
            tests_results.append(False)
        
        # Test with mock auth
        print("\n🔍 Testing with mocked auth...")
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
            mock_service_response.content = b'{"gigs": [], "message": "success"}'
            mock_service_response.headers = {"content-type": "application/json"}
            mock_request.return_value = mock_service_response
            
            headers = {"Authorization": "Bearer test_token"}
            response = test_client.get("/api/gigs/", headers=headers)
            
            if response.status_code == 200:
                print("✅ Mocked auth and service call successful")
                tests_results.append(True)
            else:
                print(f"❌ Mocked test failed: {response.status_code}")
                tests_results.append(False)
        
        passed = sum(tests_results)
        total = len(tests_results)
        print(f"\n📊 Manual Tests: {passed}/{total} passed")
        
        return passed == total
        
    except Exception as e:
        print(f"❌ Manual tests failed: {e}")
        return False

def main():
    """Main test runner"""
    print("🚀 API Gateway Test Runner")
    print("=" * 50)
    
    start_time = time.time()
    
    # Check if we're in the right directory
    if not os.path.exists("main.py"):
        print("❌ main.py not found. Make sure you're in the api-gateway directory!")
        return False
    
    # Run different test suites
    results = []
    
    # 1. Run manual API tests (always works)
    print("\n" + "="*50)
    manual_result = run_manual_api_tests()
    results.append(("Manual API Tests", manual_result))
    
    # 2. Try to install dependencies and run pytest
    print("\n" + "="*50)
    if ensure_test_dependencies():
        pytest_result = run_pytest_tests()
        results.append(("Pytest Tests", pytest_result))
        
        # 3. Try coverage if pytest worked
        if pytest_result:
            coverage_result = run_coverage_tests()
            results.append(("Coverage Tests", coverage_result))
    else:
        # 3. Run basic tests as fallback
        basic_result = run_basic_tests()
        results.append(("Basic Tests", basic_result))
    
    # Summary
    end_time = time.time()
    duration = end_time - start_time
    
    print("\n" + "="*50)
    print("📋 TEST SUMMARY")
    print("="*50)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:.<30} {status}")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    print(f"\nOverall: {passed}/{total} test suites passed")
    print(f"Duration: {duration:.2f} seconds")
    
    if passed == total:
        print("🎉 All tests passed!")
        return True
    else:
        print("⚠️  Some tests failed!")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
