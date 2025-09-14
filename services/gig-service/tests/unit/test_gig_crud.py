import pytest
from tests import mock_crud as crud  # Use our mock crud
from app.db.schemas import GigCreate, GigUpdate, GigFilters
from app.db.models import GigStatus
from tests.conftest import Gig  # Use our test model

def test_create_gig(db_session, test_category):
    """Test creating a gig."""
    # Arrange
    gig_data = GigCreate(
        category_id=str(test_category.id),
        service_description="Test service description",
        hourly_rate=100.0,
        expertise_areas=["test1", "test2"],
        experience_years=5
    )
    expert_id = "test-expert-id"
    
    # Act
    result = crud.create_gig(db_session, gig_data, expert_id)
    
    # Assert
    assert result.id is not None
    assert result.expert_id == expert_id
    assert result.service_description == "Test service description"
    assert result.hourly_rate == 100.0
    assert result.expertise_areas == ["test1", "test2"]
    assert result.experience_years == 5
    assert result.status == GigStatus.DRAFT  # Default status should be draft
    
    # Verify it's in the database
    db_gig = db_session.query(Gig).filter(Gig.id == result.id).first()
    assert db_gig is not None
    assert db_gig.expert_id == expert_id
    assert db_gig.service_description == "Test service description"

def test_get_gig(db_session, test_gig):
    """Test retrieving a gig by ID."""
    # Arrange - test_gig fixture
    
    # Act
    result = crud.get_gig(db_session, test_gig.id)
    
    # Assert
    assert result is not None
    assert result.id == test_gig.id
    assert result.expert_id == test_gig.expert_id
    assert result.service_description == test_gig.service_description
    assert result.hourly_rate == test_gig.hourly_rate

def test_get_gig_not_found(db_session):
    """Test retrieving a non-existent gig."""
    # Arrange
    non_existent_id = "non-existent-id"
    
    # Act
    result = crud.get_gig(db_session, non_existent_id)
    
    # Assert
    assert result is None

def test_get_gigs_by_expert(db_session, test_gig):
    """Test retrieving gigs by expert ID."""
    # Arrange - test_gig fixture is already added by the fixture
    expert_id = test_gig.expert_id
    
    # Act
    result = crud.get_gigs_by_expert(db_session, expert_id)
    
    # Assert
    assert len(result) >= 1
    assert any(gig.id == test_gig.id for gig in result)

def test_update_gig(db_session, test_gig):
    """Test updating a gig."""
    # Arrange
    gig_update = GigUpdate(
        service_description="Updated service description",
        hourly_rate=150.0
    )
    
    # Act
    result = crud.update_gig(db_session, test_gig.id, gig_update)
    
    # Assert
    assert result is not None
    assert result.id == test_gig.id
    assert result.service_description == "Updated service description"
    assert result.hourly_rate == 150.0
    
    # Verify it's updated in the database
    db_gig = db_session.query(Gig).filter(Gig.id == test_gig.id).first()
    assert db_gig.service_description == "Updated service description"
    assert db_gig.hourly_rate == 150.0

def test_update_gig_status(db_session, test_gig):
    """Test updating a gig's status."""
    # Arrange
    new_status = GigStatus.ACTIVE
    
    # Act
    result = crud.update_gig_status(db_session, test_gig.id, new_status)
    
    # Assert
    assert result is not None
    assert result.id == test_gig.id
    assert result.status == new_status
    
    # Verify it's updated in the database
    db_gig = db_session.query(Gig).filter(Gig.id == test_gig.id).first()
    assert db_gig.status == new_status

def test_delete_gig(db_session, test_gig):
    """Test deleting a gig."""
    # Arrange - test_gig fixture
    gig_id = test_gig.id
    
    # Act
    result = crud.delete_gig(db_session, gig_id)
    
    # Assert
    assert result is True
    
    # Verify it's deleted from the database
    db_gig = db_session.query(Gig).filter(Gig.id == gig_id).first()
    assert db_gig is None

def test_get_gigs_filtered(db_session, test_gig, test_category):
    """Test retrieving gigs with filters."""
    # Arrange
    filters = GigFilters(
        category_id=str(test_category.id),
        min_rate=50.0,
        max_rate=150.0,
        status=GigStatus.ACTIVE
    )
    
    # Act
    result = crud.get_gigs_filtered(db_session, filters)
    
    # Assert
    assert len(result) >= 1
    assert any(gig.id == test_gig.id for gig in result)

    # Test with no matching filters
    filters_no_match = GigFilters(
        min_rate=200.0,  # Higher than our test gig
        max_rate=300.0
    )
    no_match_result = crud.get_gigs_filtered(db_session, filters_no_match)
    assert len(no_match_result) == 0
