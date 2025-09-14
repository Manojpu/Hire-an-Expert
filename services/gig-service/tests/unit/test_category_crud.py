import pytest
import uuid
from tests import mock_crud as crud  # Use our mock crud
from app.db.schemas import CategoryCreate
from tests.conftest import Category  # Use our test model

def test_create_category(db_session):
    """Test creating a category."""
    # Arrange
    category_data = CategoryCreate(name="Test Category", slug="test-category")
    
    # Act
    result = crud.create_category(db_session, category_data)
    
    # Assert
    assert result.id is not None
    assert result.name == "Test Category"
    assert result.slug == "test-category"
    
    # Verify it's in the database
    db_category = db_session.query(Category).filter(Category.id == result.id).first()
    assert db_category is not None
    assert db_category.name == "Test Category"

def test_get_all_categories(db_session):
    """Test retrieving all categories."""
    # Arrange
    # Add multiple categories to the database with unique slugs
    unique_id1 = str(uuid.uuid4()).split("-")[0]
    unique_id2 = str(uuid.uuid4()).split("-")[0]
    
    category1 = Category(
        id=str(uuid.uuid4()), 
        name=f"Category {unique_id1}", 
        slug=f"category-{unique_id1}"
    )
    category2 = Category(
        id=str(uuid.uuid4()), 
        name=f"Category {unique_id2}", 
        slug=f"category-{unique_id2}"
    )
    db_session.add_all([category1, category2])
    db_session.commit()
    
    # Act
    result = crud.get_all_categories(db_session)
    
    # Assert
    assert len(result) >= 2
    category_names = [cat.name for cat in result]
    assert category1.name in category_names
    assert category2.name in category_names

def test_get_category_by_id(db_session, test_category):
    """Test retrieving a category by ID."""
    # Arrange - test_category fixture
    
    # Act
    result = crud.get_category(db_session, test_category.id)
    
    # Assert
    assert result is not None
    assert result.id == test_category.id
    assert result.name == test_category.name

def test_get_category_by_slug(db_session, test_category):
    """Test retrieving a category by slug."""
    # Act
    result = crud.get_category(db_session, test_category.slug)
    
    # Assert
    assert result is not None
    assert result.id == test_category.id
    assert result.name == test_category.name

def test_get_category_not_found(db_session):
    """Test retrieving a non-existent category."""
    # Arrange
    non_existent_id = str(uuid.uuid4())
    
    # Act
    result = crud.get_category(db_session, non_existent_id)
    
    # Assert
    assert result is None
