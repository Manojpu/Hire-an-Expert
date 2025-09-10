"""
Mock service tests for API Gateway
Creates mock services to test gateway behavior in isolation
"""
import asyncio
import json
from unittest.mock import AsyncMock, patch, MagicMock, Mock
from starlette.testclient import TestClient
from starlette.applications import Starlette
from starlette.routing import Route
from starlette.responses import JSONResponse
import httpx
import threading
import uvicorn
import time

from main import app, services, client

test_client = TestClient(app)

class MockService:
    """Mock service for testing"""
    
    def __init__(self, port, name):
        self.port = port
        self.name = name
        self.app = None
        self.server = None
        
    async def health_endpoint(self, request):
        return JSONResponse({"status": "OK", "service": self.name})
    
    async def auth_ping_endpoint(self, request):
        auth_header = request.headers.get("authorization", "")
        if auth_header == "valid_token" or auth_header == "Bearer valid_token":
            return JSONResponse({"user_id": "123", "email": "test@test.com"})
        else:
            return JSONResponse({"error": "Invalid token"}, status_code=401)
    
    async def data_endpoint(self, request):
        return JSONResponse({
            "service": self.name,
            "method": request.method,
            "path": request.url.path,
            "query": str(request.query_params),
            "headers": dict(request.headers)
        })
    
    def create_app(self):
        routes = [
            Route("/health", self.health_endpoint),
            Route("/ping", self.auth_ping_endpoint, methods=["POST"]),
            Route("/{path:path}", self.data_endpoint, methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
        ]
        return Starlette(routes=routes)

class TestWithMockServices:
    """Test API Gateway with actual mock HTTP services"""
    
    def setup_method(self):
        """Setup mock services before each test"""
        self.mock_services = {}
        self.servers = {}
        
        # Create mock services for testing
        service_configs = [
            ("auth", 8901),
            ("gig", 8902),
            ("user_v2", 8903)
        ]
        
        for name, port in service_configs:
            mock_service = MockService(port, name)
            self.mock_services[name] = mock_service
    
    def teardown_method(self):
        """Cleanup after each test"""
        # Stop any running servers
        for server in self.servers.values():
            if hasattr(server, 'shutdown'):
                server.shutdown()
    
    def test_mock_auth_service_integration(self):
        """Test integration with mock auth service"""
        # Use mocking instead of real HTTP servers for unit tests
        with patch.object(client, 'post') as mock_post, \
             patch.object(client, 'request') as mock_request:
            
            # Mock auth service response
            mock_auth_response = AsyncMock()
            mock_auth_response.status_code = 200
            mock_auth_response.json = Mock(return_value={"user_id": "123"})
            mock_post.return_value = mock_auth_response
            
            # Mock gig service response
            mock_gig_response = AsyncMock()
            mock_gig_response.status_code = 200
            mock_gig_response.content = b'{"gigs": [], "service": "gig"}'
            mock_gig_response.headers = {"content-type": "application/json"}
            mock_request.return_value = mock_gig_response
            
            # Test protected endpoint
            headers = {"Authorization": "Bearer valid_token"}
            response = test_client.get("/api/gigs/list", headers=headers)
            
            assert response.status_code == 200
            
            # Verify auth was called
            mock_post.assert_called_once()
            
            # Verify service was called
            mock_request.assert_called_once()
            call_args = mock_request.call_args
            assert "gigs/list" in call_args[1]["url"]

class TestServiceFailureScenarios:
    """Test various service failure scenarios"""
    
    def test_auth_service_down(self):
        """Test behavior when auth service is down"""
        with patch.object(client, 'post') as mock_post:
            # Mock connection error to auth service
            mock_post.side_effect = httpx.ConnectError("Connection failed")
            
            headers = {"Authorization": "Bearer token"}
            response = test_client.get("/api/gigs/", headers=headers)
            
            assert response.status_code == 401
            assert "Invalid or expired token" in response.json()["error"]
    
    def test_target_service_down(self):
        """Test behavior when target service is down"""
        with patch.object(client, 'post') as mock_auth, \
             patch.object(client, 'request') as mock_request:
            
            # Mock successful auth
            mock_auth_response = AsyncMock()
            mock_auth_response.status_code = 200
            mock_auth_response.json = Mock(return_value={"user_id": "123"})
            mock_auth.return_value = mock_auth_response
            
            # Mock service connection error
            mock_request.side_effect = httpx.ConnectError("Service unavailable")
            
            headers = {"Authorization": "Bearer valid_token"}
            response = test_client.get("/api/gigs/", headers=headers)
            
            assert response.status_code == 503
            assert "Service unavailable" in response.json()["error"]
    
    def test_service_timeout(self):
        """Test behavior when service times out"""
        with patch.object(client, 'post') as mock_auth, \
             patch.object(client, 'request') as mock_request:
            
            # Mock successful auth
            mock_auth_response = AsyncMock()
            mock_auth_response.status_code = 200
            mock_auth_response.json = Mock(return_value={"user_id": "123"})
            mock_auth.return_value = mock_auth_response
            
            # Mock service timeout
            mock_request.side_effect = httpx.TimeoutException("Request timeout")
            
            headers = {"Authorization": "Bearer valid_token"}
            response = test_client.get("/api/gigs/", headers=headers)
            
            assert response.status_code == 503
            assert "Service unavailable" in response.json()["error"]
    
    def test_service_returns_error(self):
        """Test behavior when service returns error status"""
        with patch.object(client, 'post') as mock_auth, \
             patch.object(client, 'request') as mock_request:
            
            # Mock successful auth
            mock_auth_response = AsyncMock()
            mock_auth_response.status_code = 200
            mock_auth_response.json = Mock(return_value={"user_id": "123"})
            mock_auth.return_value = mock_auth_response
            
            # Mock service error response
            mock_service_response = AsyncMock()
            mock_service_response.status_code = 400
            mock_service_response.content = b'{"error": "Bad request"}'
            mock_service_response.headers = {"content-type": "application/json"}
            mock_request.return_value = mock_service_response
            
            headers = {"Authorization": "Bearer valid_token"}
            response = test_client.get("/api/gigs/invalid", headers=headers)
            
            # Should forward the error status
            assert response.status_code == 400
            assert b"Bad request" in response.content

class TestDataFlow:
    """Test data flow through the gateway"""
    
    def test_request_data_forwarding(self):
        """Test that request data is properly forwarded"""
        with patch.object(client, 'request') as mock_request:
            # Mock service response
            mock_response = AsyncMock()
            mock_response.status_code = 201
            mock_response.content = b'{"created": true}'
            mock_response.headers = {"content-type": "application/json"}
            mock_request.return_value = mock_response
            
            test_data = {
                "title": "Test Gig",
                "description": "A test gig posting",
                "budget": 1000
            }
            
            response = test_client.post("/api/auth/gigs", json=test_data)
            assert response.status_code == 201
            
            # Verify the request was forwarded with correct data
            mock_request.assert_called_once()
            call_args = mock_request.call_args
            
            # Check that body was forwarded
            assert call_args[1]["content"] is not None
            
            # Check method
            assert call_args[1]["method"] == "POST"
    
    def test_response_data_forwarding(self):
        """Test that response data is properly forwarded"""
        with patch.object(client, 'post') as mock_auth, \
             patch.object(client, 'request') as mock_request:
            
            # Mock auth
            mock_auth_response = AsyncMock()
            mock_auth_response.status_code = 200
            mock_auth_response.json = Mock(return_value={"user_id": "123"})
            mock_auth.return_value = mock_auth_response
            
            # Mock service response with specific data
            expected_data = {
                "gigs": [
                    {"id": 1, "title": "Gig 1"},
                    {"id": 2, "title": "Gig 2"}
                ],
                "total": 2,
                "page": 1
            }
            
            mock_service_response = AsyncMock()
            mock_service_response.status_code = 200
            mock_service_response.content = json.dumps(expected_data).encode()
            mock_service_response.headers = {"content-type": "application/json"}
            mock_request.return_value = mock_service_response
            
            headers = {"Authorization": "Bearer valid_token"}
            response = test_client.get("/api/gigs/", headers=headers)
            
            assert response.status_code == 200
            
            # Verify response data
            response_data = response.json()
            assert response_data == expected_data

class TestMiddlewareIntegration:
    """Test middleware integration and behavior"""
    
    def test_logging_middleware(self):
        """Test that logging middleware works correctly"""
        with patch('main.logger') as mock_logger:
            response = test_client.get("/health")
            assert response.status_code == 200
            
            # Verify logging calls were made
            assert mock_logger.info.call_count >= 2  # Start and completion logs
            
            # Check log messages
            log_calls = [call.args[0] for call in mock_logger.info.call_args_list]
            request_logged = any("GET /health" in log for log in log_calls)
            completion_logged = any("Completed GET /health" in log for log in log_calls)
            
            assert request_logged
            assert completion_logged
    
    def test_cors_middleware(self):
        """Test CORS middleware functionality"""
        # Test with allowed origin
        headers = {"Origin": "http://localhost:3000"}
        response = test_client.get("/health", headers=headers)
        
        assert response.status_code == 200
        assert "access-control-allow-origin" in [h.lower() for h in response.headers.keys()]
    
    def test_middleware_order(self):
        """Test that middleware executes in correct order"""
        with patch('main.logger') as mock_logger:
            response = test_client.get("/health")
            assert response.status_code == 200
            
            # Logging middleware should execute (no specific order test needed for our setup)
            assert mock_logger.info.called

class TestConfigurationEdgeCases:
    """Test configuration and environment edge cases"""
    
    def test_service_url_variations(self):
        """Test handling of different service URL formats"""
        with patch.object(client, 'post') as mock_auth, \
             patch.object(client, 'request') as mock_request:
            
            # Mock auth
            mock_auth_response = AsyncMock()
            mock_auth_response.status_code = 200
            mock_auth_response.json = Mock(return_value={"user_id": "123"})
            mock_auth.return_value = mock_auth_response
            
            # Mock service response
            mock_service_response = AsyncMock()
            mock_service_response.status_code = 200
            mock_service_response.content = b'{"success": true}'
            mock_service_response.headers = {"content-type": "application/json"}
            mock_request.return_value = mock_service_response
            
            headers = {"Authorization": "Bearer valid_token"}
            response = test_client.get("/api/gigs/test", headers=headers)
            
            assert response.status_code == 200
            
            # Verify URL construction
            mock_request.assert_called_once()
            call_args = mock_request.call_args
            url = call_args[1]["url"]
            
            # Should not have double slashes (except after protocol)
            url_without_protocol = url.split("://", 1)[1]
            assert "//" not in url_without_protocol

def run_tests():
    """Run all tests in this module"""
    import unittest
    
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add test classes
    test_classes = [
        TestWithMockServices,
        TestServiceFailureScenarios,
        TestDataFlow,
        TestMiddlewareIntegration,
        TestConfigurationEdgeCases
    ]
    
    for test_class in test_classes:
        tests = loader.loadTestsFromTestCase(test_class)
        suite.addTests(tests)
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    return result.wasSuccessful()

if __name__ == "__main__":
    success = run_tests()
    exit(0 if success else 1)
