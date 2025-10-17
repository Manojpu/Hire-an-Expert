"""
Configuration for pytest.
"""
import pytest
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import models and create tables
from app.db.models import Base, Payment
from app.db.session import get_db

# Create in-memory SQLite database for tests
TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="function")
def test_db():
    """Create a fresh database for each test."""
    # Create the SQLite in-memory database engine
    engine = create_engine(
        TEST_SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create a session factory
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Create a session
    db = TestingSessionLocal()
    
    try:
        yield db
    finally:
        db.close()
        
    # Drop all tables after the test
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session(test_db):
    """Return the test database session."""
    return test_db

@pytest.fixture
def test_payment(db_session):
    """Create a test payment in the database."""
    payment = Payment(
        booking_id=str(uuid.uuid4()),
        payment_intent_id="pi_" + str(uuid.uuid4()),
        amount=100.50,
        currency="USD",
        status=PaymentStatus.PENDING.value,
    )
    
    db_session.add(payment)
    db_session.commit()
    db_session.refresh(payment)
    
    return payment

# Override the dependency in the app
def override_get_db():
    """Override the get_db dependency for testing."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

# Configure the app to use the test database
app.dependency_overrides[get_db] = override_get_db