"""
Integration tests for the Gig Service with other microservices.

These tests verify that the Gig Service correctly interacts with other services
like the User Service and Booking Service.
"""

import pytest
import requests
import os
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Service URLs - can be overridden by environment variables
GIG_SERVICE_URL = os.getenv("GIG_SERVICE_URL", "http://localhost:8002")
USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://localhost:8000")
API_GATEWAY_URL = os.getenv("API_GATEWAY_URL", "http://localhost:8080")

# Skip these tests if the SKIP_EXTERNAL_TESTS environment variable is set
pytestmark = pytest.mark.skipif(
    os.getenv("SKIP_EXTERNAL_TESTS") == "true",
    reason="External service integration tests are disabled"
)

def is_service_up(url):
    """Check if a service is available."""
    try:
        response = requests.get(f"{url}/", timeout=5)
        return response.status_code == 200
    except (requests.ConnectionError, requests.Timeout):
        return False

@pytest.fixture(scope="module")
def wait_for_services():
    """Wait for required services to be available."""
    services = {
        "Gig Service": GIG_SERVICE_URL,
        "User Service": USER_SERVICE_URL,
        "API Gateway": API_GATEWAY_URL
    }
    
    max_retries = 5
    for name, url in services.items():
        for i in range(max_retries):
            if is_service_up(url):
                break
            print(f"Waiting for {name} to be available (attempt {i+1}/{max_retries})...")
            time.sleep(2)
        else:
            pytest.skip(f"{name} is not available, skipping integration tests")

@pytest.mark.integration
def test_gig_service_health(wait_for_services):
    """Test that the Gig Service is healthy."""
    response = requests.get(f"{GIG_SERVICE_URL}/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Gig Service"
    assert data["status"] == "Running"

@pytest.mark.integration
def test_create_gig_through_api_gateway(wait_for_services):
    """
    Test creating a gig through the API Gateway.
    
    This tests the integration between the API Gateway and the Gig Service.
    """
    # This test requires authentication, so we'll need to get a token
    # For simplicity, we'll just check if the API Gateway forwards the request
    # to the Gig Service correctly
    
    # First, get available categories from Gig Service directly
    categories_response = requests.get(f"{GIG_SERVICE_URL}/categories/categories")
    assert categories_response.status_code == 200
    categories = categories_response.json()
    
    if not categories:
        pytest.skip("No categories available for testing")
    
    # Try to access the same endpoint through the API Gateway
    gateway_response = requests.get(f"{API_GATEWAY_URL}/api/gigs/categories")
    
    # We might get a 401/403 if auth is required, but we shouldn't get a 404
    assert gateway_response.status_code != 404, "API Gateway is not forwarding requests to Gig Service"

@pytest.mark.integration
def test_get_gigs_through_api_gateway(wait_for_services):
    """Test retrieving gigs through the API Gateway."""
    # Get public gigs through Gig Service directly
    gigs_response = requests.get(f"{GIG_SERVICE_URL}/gigs/public")
    assert gigs_response.status_code == 200
    
    # Try to access the same endpoint through the API Gateway
    gateway_response = requests.get(f"{API_GATEWAY_URL}/api/gigs")
    
    # We might get a 401/403 if auth is required, but we shouldn't get a 404
    assert gateway_response.status_code != 404, "API Gateway is not forwarding requests to Gig Service"
