import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, MetaData, Column, String, Float, Integer, DateTime, Enum, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.pool import StaticPool
from app.db.models import GigStatus
from app.db.session import get_db, get_current_user_id
from main import app
import uuid
import json
import enum
from datetime import datetime
from sqlalchemy.sql import func

# Create test-specific base with SQLite compatible types
TestBase = declarative_base()

# Recreate models for testing with SQLite-compatible types
class Category(TestBase):
    __tablename__ = "categories"

    id = Column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(
        String(100), unique=True, nullable=False
    )

    created_at = Column(DateTime, server_default=func.now())
    gigs = relationship("Gig", back_populates="category")

    def __repr__(self):
        return f"<Category(id={self.id}, name='{self.name}')>"

class Certification(TestBase):
    __tablename__ = "certifications"

    id = Column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    gig_id = Column(String, index=True)
    url = Column(String, nullable=False)
    thumbnail_url = Column(String, nullable=True)
    uploaded_at = Column(DateTime, server_default=func.now())

    def __repr__(self):
        return f"<Certification(id={self.id}, gig_id='{self.gig_id}')>"

class Gig(TestBase):
    __tablename__ = 'gigs'
    
    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    expert_id = Column(String, index=True)
    category_id = Column(String(36), ForeignKey("categories.id"), nullable=False)
    service_description = Column(Text)
    hourly_rate = Column(Float, nullable=False)
    currency = Column(String, default='LKR')
    availability_preferences = Column(Text)
    response_time = Column(String, default='< 24 hours')
    thumbnail_url = Column(String, nullable=True)
    
    # Use JSON string instead of PostgreSQL ARRAY for SQLite compatibility
    expertise_areas_json = Column(String, default='[]')
    experience_years = Column(Integer)
    work_experience = Column(Text)
    
    # System fields
    status = Column(Enum(GigStatus), default=GigStatus.DRAFT)

    # Relationships
    category = relationship("Category", back_populates="gigs")
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    approved_at = Column(DateTime, nullable=True)
    
    # Property to handle the expertise_areas conversion between list and JSON
    @property
    def expertise_areas(self):
        if self.expertise_areas_json:
            return json.loads(self.expertise_areas_json)
        return []
    
    @expertise_areas.setter
    def expertise_areas(self, value):
        self.expertise_areas_json = json.dumps(value)

    def __repr__(self):
        return f"<Gig(id={self.id}, expert_id={self.expert_id})>"

# Use in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="session")
def test_engine():
    """Create a test database engine that will be used for all tests."""
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, 
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestBase.metadata.create_all(bind=engine)
    yield engine
    TestBase.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session(test_engine):
    """
    Create a fresh database session for a test.
    This fixture will be used for each individual test function.
    """
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()

@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with a database session override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    def mock_get_current_user_id():
        # Return a consistent test user ID for all tests
        return "test-expert-id"
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user_id] = mock_get_current_user_id
    
    with TestClient(app) as c:
        yield c
    
    # Clean up
    app.dependency_overrides = {}

@pytest.fixture
def test_category(db_session):
    """Create a test category for use in tests."""
    # Use our local Category model with a unique slug
    unique_id = str(uuid.uuid4()).split("-")[0]
    category = Category(
        id=str(uuid.uuid4()),
        name=f"Test Category {unique_id}",
        slug=f"test-category-{unique_id}"
    )
    db_session.add(category)
    db_session.commit()
    db_session.refresh(category)
    return category

@pytest.fixture
def test_gig(db_session, test_category):
    """Create a test gig for use in tests."""
    # Use our local Gig model
    gig = Gig(
        id=str(uuid.uuid4()),
        expert_id="test-expert-id",
        category_id=test_category.id,
        service_description="Test service description",
        hourly_rate=100.0,
        currency="LKR",
        expertise_areas=["test1", "test2"],  # This will use our property setter
        experience_years=5,
        status=GigStatus.ACTIVE
    )
    db_session.add(gig)
    db_session.commit()
    db_session.refresh(gig)
    return gig
