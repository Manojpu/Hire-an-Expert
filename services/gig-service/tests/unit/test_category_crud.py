import pytest
import uuid
from app.db import crud
from app.db.schemas import CategoryCreate
from app.db.models import Category

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
    # Add multiple categories to the database
    category1 = Category(
        id=uuid.uuid4(), 
        name="Category 1", 
        slug="category-1"
    )
    category2 = Category(
        id=uuid.uuid4(), 
        name="Category 2", 
        slug="category-2"
    )
    db_session.add_all([category1, category2])
    db_session.commit()
    
    # Act
    result = crud.get_all_categories(db_session)
    
    # Assert
    assert len(result) >= 2
    categories = {cat.name for cat in result}
    assert "Category 1" in categories
    assert "Category 2" in categories

def test_get_category_by_id(db_session, test_category):
    """Test retrieving a category by ID."""
    # Arrange - test_category fixture
    
    # Act
    result = crud.get_category(db_session, str(test_category.id))
    
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
