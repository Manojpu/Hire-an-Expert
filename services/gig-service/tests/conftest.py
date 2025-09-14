import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.db.models import Base
from app.db.session import get_db, get_current_user_id
from main import app
import uuid

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
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

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
    from app.db.models import Category
    category = Category(
        id=uuid.uuid4(),
        name="Test Category",
        slug="test-category"
    )
    db_session.add(category)
    db_session.commit()
    db_session.refresh(category)
    return category

@pytest.fixture
def test_gig(db_session, test_category):
    """Create a test gig for use in tests."""
    from app.db.models import Gig, GigStatus
    gig = Gig(
        id=str(uuid.uuid4()),
        expert_id="test-expert-id",
        category_id=test_category.id,
        service_description="Test service description",
        hourly_rate=100.0,
        currency="LKR",
        expertise_areas=["test1", "test2"],
        experience_years=5,
        status=GigStatus.ACTIVE
    )
    db_session.add(gig)
    db_session.commit()
    db_session.refresh(gig)
    return gig
