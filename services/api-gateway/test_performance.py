"""
Performance and load testing for the API Gateway
Tests timeout handling, concurrent requests, and stress scenarios
"""
import asyncio
import time
import statistics
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import AsyncMock, patch, Mock
from starlette.testclient import TestClient
import httpx

from main import app, client

test_client = TestClient(app)

class TestPerformance:
    """Performance and stress testing"""
    
    def test_health_check_response_time(self):
        """Test health check response time"""
        start_time = time.time()
        response = test_client.get("/health")
        end_time = time.time()
        
        response_time = end_time - start_time
        assert response.status_code == 200
        assert response_time < 1.0  # Should respond within 1 second
    
    def test_concurrent_health_checks(self):
        """Test concurrent health check requests"""
        def make_request():
            return test_client.get("/health")
        
        # Run 10 concurrent requests
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request) for _ in range(10)]
            responses = [future.result() for future in futures]
        
        # All should succeed
        for response in responses:
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "OK"
    
    def test_auth_route_performance(self):
        """Test auth route performance"""
        with patch.object(client, 'request') as mock_request:
            # Mock fast service response
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_response.content = b'{"success": true}'
            mock_response.headers = {"content-type": "application/json"}
            mock_request.return_value = mock_response
            
            start_time = time.time()
            response = test_client.post("/api/auth/login", json={"email": "test@test.com"})
            end_time = time.time()
            
            response_time = end_time - start_time
            assert response.status_code == 200
            assert response_time < 2.0  # Should respond within 2 seconds
    
    def test_timeout_handling(self):
        """Test request timeout handling"""
        with patch.object(client, 'post') as mock_auth, \
             patch.object(client, 'request') as mock_request:
            
            # Mock successful auth
            mock_auth_response = AsyncMock()
            mock_auth_response.status_code = 200
            mock_auth_response.json = Mock(return_value={"user_id": "123"})
            mock_auth.return_value = mock_auth_response
            
            # Mock timeout error
            mock_request.side_effect = httpx.TimeoutException("Request timeout")
            
            headers = {"Authorization": "Bearer valid_token"}
            start_time = time.time()
            response = test_client.get("/api/gigs/", headers=headers)
            end_time = time.time()
            
            # Should handle timeout gracefully
            assert response.status_code == 503
            assert "Service unavailable" in response.json()["error"]
            
            # Should not take too long to timeout
            assert end_time - start_time < 35  # Timeout + buffer

class TestIntegration:
    """Integration testing scenarios"""
    
    def test_auth_flow_integration(self):
        """Test complete authentication flow"""
        with patch.object(client, 'post') as mock_auth, \
             patch.object(client, 'request') as mock_request:
            
            # Test login (no auth required)
            mock_login_response = AsyncMock()
            mock_login_response.status_code = 200
            mock_login_response.content = b'{"token": "jwt_token", "user_id": "123"}'
            mock_login_response.headers = {"content-type": "application/json"}
            mock_request.return_value = mock_login_response
            
            login_response = test_client.post("/api/auth/login", 
                                            json={"email": "test@test.com", "password": "password"})
            assert login_response.status_code == 200
            
            # Reset mocks for protected route
            mock_auth.reset_mock()
            mock_request.reset_mock()
            
            # Test protected route with token
            mock_auth_response = AsyncMock()
            mock_auth_response.status_code = 200
            mock_auth_response.json = Mock(return_value={"user_id": "123"})
            mock_auth.return_value = mock_auth_response
            
            mock_gigs_response = AsyncMock()
            mock_gigs_response.status_code = 200
            mock_gigs_response.content = b'{"gigs": [{"id": 1, "title": "Test Gig"}]}'
            mock_gigs_response.headers = {"content-type": "application/json"}
            mock_request.return_value = mock_gigs_response
            
            headers = {"Authorization": "Bearer jwt_token"}
            gigs_response = test_client.get("/api/gigs/", headers=headers)
            assert gigs_response.status_code == 200
    
    def test_multi_service_workflow(self):
        """Test workflow involving multiple services"""
        with patch.object(client, 'post') as mock_auth, \
             patch.object(client, 'request') as mock_request:
            
            # Mock auth for all requests
            mock_auth_response = AsyncMock()
            mock_auth_response.status_code = 200
            mock_auth_response.json = Mock(return_value={"user_id": "123"})
            mock_auth.return_value = mock_auth_response
            
            # Mock service responses
            def mock_service_response(url, **kwargs):
                response = AsyncMock()
                response.status_code = 200
                response.headers = {"content-type": "application/json"}
                
                if "gigs" in url:
                    response.content = b'{"gigs": [{"id": 1}]}'
                elif "bookings" in url:
                    response.content = b'{"booking_id": 1}'
                elif "payments" in url:
                    response.content = b'{"payment_id": 1, "status": "success"}'
                else:
                    response.content = b'{"success": true}'
                
                return response
            
            mock_request.side_effect = mock_service_response
            
            headers = {"Authorization": "Bearer valid_token"}
            
            # 1. Get gigs
            gigs_response = test_client.get("/api/gigs/", headers=headers)
            assert gigs_response.status_code == 200
            
            # 2. Create booking
            booking_response = test_client.post("/api/bookings/", 
                                              json={"gig_id": 1}, 
                                              headers=headers)
            assert booking_response.status_code == 200
            
            # 3. Process payment
            payment_response = test_client.post("/api/payments/", 
                                              json={"booking_id": 1, "amount": 100}, 
                                              headers=headers)
            assert payment_response.status_code == 200

class TestEdgeCases:
    """Test edge cases and boundary conditions"""
    
    def test_empty_request_body(self):
        """Test handling of empty request body"""
        with patch.object(client, 'request') as mock_request:
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_response.content = b'{"success": true}'
            mock_response.headers = {"content-type": "application/json"}
            mock_request.return_value = mock_response
            
            response = test_client.post("/api/auth/ping")
            assert response.status_code == 200
    
    def test_large_request_body(self):
        """Test handling of large request body"""
        with patch.object(client, 'request') as mock_request:
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_response.content = b'{"success": true}'
            mock_response.headers = {"content-type": "application/json"}
            mock_request.return_value = mock_response
            
            # Create large payload (1MB)
            large_data = {"data": "x" * (1024 * 1024)}
            response = test_client.post("/api/auth/upload", json=large_data)
            assert response.status_code == 200
    
    def test_special_characters_in_path(self):
        """Test handling of special characters in URL paths"""
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
            
            # Test URL with special characters (URL encoded)
            response = test_client.get("/api/gigs/search%20term", headers=headers)
            # Should handle gracefully (either 200 or service-specific error)
            assert response.status_code in [200, 404, 400]
    
    def test_malformed_authorization_header(self):
        """Test handling of malformed authorization headers"""
        test_cases = [
            "Invalid format",
            "Bearer",
            "Bearer ",
            "bearer token",
            "Token abc123"
        ]
        
        for auth_header in test_cases:
            headers = {"Authorization": auth_header}
            response = test_client.get("/api/gigs/", headers=headers)
            
            # Should either be 401 (invalid token) or handled gracefully
            assert response.status_code in [401, 403]
    
    def test_response_header_handling(self):
        """Test that response headers from services are preserved"""
        with patch.object(client, 'post') as mock_auth, \
             patch.object(client, 'request') as mock_request:
            
            # Mock auth
            mock_auth_response = AsyncMock()
            mock_auth_response.status_code = 200
            mock_auth_response.json = Mock(return_value={"user_id": "123"})
            mock_auth.return_value = mock_auth_response
            
            # Mock service response with custom headers
            mock_service_response = AsyncMock()
            mock_service_response.status_code = 200
            mock_service_response.content = b'{"data": "test"}'
            mock_service_response.headers = {
                "content-type": "application/json",
                "x-custom-header": "custom-value",
                "x-rate-limit": "100"
            }
            mock_request.return_value = mock_service_response
            
            headers = {"Authorization": "Bearer valid_token"}
            response = test_client.get("/api/gigs/", headers=headers)
            
            assert response.status_code == 200
            # Custom headers should be preserved
            assert "x-custom-header" in response.headers
            assert response.headers["x-custom-header"] == "custom-value"

class TestSecurityEdgeCases:
    """Test security-related edge cases"""
    
    def test_jwt_token_extraction(self):
        """Test various JWT token formats"""
        test_cases = [
            ("Bearer jwt.token.here", True),
            ("bearer jwt.token.here", True), 
            ("BEARER jwt.token.here", True),
            ("jwt.token.here", True),  # Should handle token without Bearer prefix
            ("", False),
            ("Bearer", False),
            ("Bearer ", False),
        ]
        
        for token, should_work in test_cases:
            with patch.object(client, 'post') as mock_auth:
                if should_work:
                    # Mock successful auth
                    mock_response = AsyncMock()
                    mock_response.status_code = 200
                    mock_response.json = Mock(return_value={"user_id": "123"})
                    mock_auth.return_value = mock_response
                
                headers = {"Authorization": token} if token else {}
                response = test_client.get("/api/gigs/", headers=headers)
                
                # Fixed logic: check if token is valid and not just "Bearer"
                if should_work and token.strip() and not token.strip() in ["Bearer", "bearer", "BEARER"]:
                    # Should succeed with valid token
                    assert response.status_code in [200, 503]  # 503 is acceptable if service is down
                else:
                    # Should fail with invalid/empty token
                    assert response.status_code == 401
    
    def test_auth_service_different_responses(self):
        """Test handling of different auth service responses"""
        response_scenarios = [
            (200, {"user_id": "123"}, True),
            (401, {"error": "Invalid token"}, False),
            (403, {"error": "Forbidden"}, False),
            (500, {"error": "Internal error"}, False),
        ]
        
        for status_code, response_data, should_allow in response_scenarios:
            with patch.object(client, 'post') as mock_auth, \
                 patch.object(client, 'request') as mock_request:
                
                # Mock auth response
                mock_auth_response = AsyncMock()
                mock_auth_response.status_code = status_code
                mock_auth_response.json = Mock(return_value=response_data)
                mock_auth.return_value = mock_auth_response
                
                if should_allow:
                    # Mock successful service response
                    mock_service_response = AsyncMock()
                    mock_service_response.status_code = 200
                    mock_service_response.content = b'{"success": true}'
                    mock_service_response.headers = {"content-type": "application/json"}
                    mock_request.return_value = mock_service_response
                
                headers = {"Authorization": "Bearer test_token"}
                response = test_client.get("/api/gigs/", headers=headers)
                
                if should_allow:
                    assert response.status_code == 200
                else:
                    assert response.status_code == 401

if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])
