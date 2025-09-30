import pytest
from fastapi.testclient import TestClient
import uuid
import unittest.mock as mock
from app.db import crud
from tests import mock_crud

# Apply a monkeypatch to replace the app's crud module with our mock_crud for testing
crud_functions = [
    'create_category', 'get_all_categories', 'get_category',
    'create_gig', 'get_gig', 'get_gigs_by_expert', 
    'update_gig', 'update_gig_status', 'delete_gig',
    'get_gigs_filtered', 'get_gigs_count'
]

# Apply patches for the CRUD module
for func_name in crud_functions:
    if hasattr(crud, func_name) and hasattr(mock_crud, func_name):
        setattr(crud, func_name, getattr(mock_crud, func_name))

def test_get_root(client):
    """Test the health check endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Gig Service"
    assert data["status"] == "Running"
    assert data["port"] == 8002

def test_create_category(client):
    """Test creating a category via the API."""
    # Arrange
    category_data = {
        "name": "API Test Category",
        "slug": "api-test-category"
    }
    
    # Act
    response = client.post("/categories/", json=category_data)
    
    # Assert
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "API Test Category"
    assert data["slug"] == "api-test-category"
    assert "id" in data
    assert "created_at" in data

def test_get_all_categories(client, test_category):
    """Test retrieving all categories via the API."""
    # Act
    response = client.get("/categories/categories")
    
    # Assert
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    
    # Check if our test category is in the results
    category_names = [cat["name"] for cat in data]
    assert test_category.name in category_names

def test_create_gig(client, test_category):
    """Test creating a gig via the API."""
    # Arrange
    gig_data = {
        "category_id": str(test_category.id),
        "service_description": "API Test Service Description",
        "hourly_rate": 120.0,
        "expertise_areas": ["api", "testing"],
        "experience_years": 3
    }
    
    # Act
    response = client.post("/gigs/", json=gig_data)
    
    # Assert
    assert response.status_code == 201
    data = response.json()
    assert data["service_description"] == "API Test Service Description"
    assert data["hourly_rate"] == 120.0
    assert data["expertise_areas"] == ["api", "testing"]
    assert data["experience_years"] == 3
    assert data["category"]["id"] == str(test_category.id)
    assert "id" in data

def test_get_public_gigs(client, test_gig):
    """Test retrieving public gigs via the API."""
    # Act
    response = client.get("/gigs/public")
    
    # Assert
    assert response.status_code == 200
    data = response.json()
    assert "gigs" in data
    assert "total" in data
    assert "page" in data
    assert "size" in data
    assert "pages" in data
    
    # With our test data, we should have at least one gig
    assert data["total"] >= 1
    assert len(data["gigs"]) >= 1

def test_get_public_gigs_with_filters(client, test_gig, test_category):
    """Test retrieving public gigs with filters via the API."""
    # Act - filter by category
    response = client.get(f"/gigs/public?category_id={test_category.id}")
    
    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    
    # Filter by rate
    response = client.get("/gigs/public?min_rate=50&max_rate=150")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    
    # Filter with no matches
    response = client.get("/gigs/public?min_rate=500")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0

def test_get_gig_detail(client, test_gig):
    """Test retrieving a gig detail via the API."""
    # Act
    response = client.get(f"/gigs/{test_gig.id}")
    
    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["gig"]["id"] == test_gig.id
    assert data["gig"]["service_description"] == test_gig.service_description
    assert data["gig"]["hourly_rate"] == test_gig.hourly_rate

def test_get_gig_detail_not_found(client):
    """Test retrieving a non-existent gig via the API."""
    # Arrange
    non_existent_id = str(uuid.uuid4())
    
    # Act
    response = client.get(f"/gigs/{non_existent_id}")
    
    # Assert
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert data["detail"] == "Gig not found"
