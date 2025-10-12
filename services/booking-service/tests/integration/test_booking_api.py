"""
Integration tests for the booking service API endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import uuid
from datetime import datetime, timedelta
from app.db.models import BookingStatus
from main import app

client = TestClient(app)

@pytest.fixture
def mock_auth():
    """Mock the authentication middleware to return a test user ID."""
    with patch('app.core.firebase_auth.get_current_user_id', return_value=str(uuid.uuid4())) as mock:
        yield mock

@pytest.fixture
def mock_db_session():
    """Mock the database session dependency."""
    with patch('app.endpoints.booking.session.get_db') as mock:
        yield mock

@pytest.fixture
def sample_booking_data():
    """Return sample booking data for tests."""
    return {
        "gig_id": str(uuid.uuid4()),
        "scheduled_time": (datetime.utcnow() + timedelta(days=1)).isoformat()
    }

@pytest.fixture
def sample_booking_response():
    """Return a sample booking response for tests."""
    booking_id = uuid.uuid4()
    user_id = uuid.uuid4()
    gig_id = uuid.uuid4()
    now = datetime.utcnow()
    scheduled_time = now + timedelta(days=1)
    
    return {
        "id": str(booking_id),
        "user_id": str(user_id),
        "gig_id": str(gig_id),
        "status": BookingStatus.PENDING,
        "scheduled_time": scheduled_time.isoformat(),
        "created_at": now.isoformat()
    }

class TestCreateBooking:
    def test_create_booking_success(self, mock_auth, mock_db_session, sample_booking_data):
        """Test successful booking creation with valid data."""
        # Arrange
        mock_crud = MagicMock()
        mock_crud.create_booking.return_value = MagicMock(
            id=uuid.uuid4(),
            user_id=uuid.UUID(mock_auth.return_value),
            gig_id=uuid.UUID(sample_booking_data["gig_id"]),
            status=BookingStatus.PENDING,
            scheduled_time=datetime.fromisoformat(sample_booking_data["scheduled_time"]),
            created_at=datetime.utcnow()
        )
        
        # Act
        with patch('app.endpoints.booking.crud', mock_crud):
            response = client.post("/bookings/", json=sample_booking_data)
        
        # Assert
        assert response.status_code == 201
        assert "id" in response.json()
        assert response.json()["status"] == BookingStatus.PENDING
        assert response.json()["gig_id"] == sample_booking_data["gig_id"]
        mock_crud.create_booking.assert_called_once()

    def test_create_booking_invalid_data(self, mock_auth):
        """Test booking creation with invalid data."""
        # Arrange - missing required fields
        invalid_data = {}
        
        # Act
        response = client.post("/bookings/", json=invalid_data)
        
        # Assert
        assert response.status_code == 422  # FastAPI validation error

class TestGetBooking:
    def test_get_booking_success(self, mock_auth, mock_db_session):
        """Test retrieving an existing booking."""
        # Arrange
        booking_id = str(uuid.uuid4())
        mock_crud = MagicMock()
        mock_booking = MagicMock(
            id=uuid.UUID(booking_id),
            user_id=uuid.UUID(mock_auth.return_value),
            gig_id=uuid.uuid4(),
            status=BookingStatus.CONFIRMED,
            scheduled_time=datetime.utcnow(),
            created_at=datetime.utcnow()
        )
        mock_crud.get_booking.return_value = mock_booking
        
        # Act
        with patch('app.endpoints.booking.crud', mock_crud):
            response = client.get(f"/bookings/{booking_id}")
        
        # Assert
        assert response.status_code == 200
        assert response.json()["id"] == booking_id
        mock_crud.get_booking.assert_called_once_with(mock_db_session.return_value, booking_id)

    def test_get_booking_not_found(self, mock_auth, mock_db_session):
        """Test retrieving a non-existent booking."""
        # Arrange
        booking_id = str(uuid.uuid4())
        mock_crud = MagicMock()
        mock_crud.get_booking.return_value = None
        
        # Act
        with patch('app.endpoints.booking.crud', mock_crud):
            response = client.get(f"/bookings/{booking_id}")
        
        # Assert
        assert response.status_code == 404
        mock_crud.get_booking.assert_called_once_with(mock_db_session.return_value, booking_id)

    def test_get_booking_invalid_id(self, mock_auth):
        """Test retrieving a booking with an invalid UUID."""
        # Arrange
        invalid_id = "not-a-uuid"
        
        # Act
        response = client.get(f"/bookings/{invalid_id}")
        
        # Assert
        assert response.status_code == 422  # FastAPI validation error

class TestUpdateBooking:
    def test_update_booking_status_success(self, mock_auth, mock_db_session):
        """Test successfully updating a booking status."""
        # Arrange
        booking_id = str(uuid.uuid4())
        update_data = {"status": BookingStatus.CONFIRMED}
        
        mock_crud = MagicMock()
        mock_booking = MagicMock(
            id=uuid.UUID(booking_id),
            user_id=uuid.UUID(mock_auth.return_value),
            status=BookingStatus.CONFIRMED
        )
        mock_crud.get_booking.return_value = mock_booking
        mock_crud.update_booking.return_value = mock_booking
        
        # Act
        with patch('app.endpoints.booking.crud', mock_crud):
            response = client.patch(f"/bookings/{booking_id}", json=update_data)
        
        # Assert
        assert response.status_code == 200
        assert response.json()["status"] == BookingStatus.CONFIRMED
        mock_crud.update_booking.assert_called_once()

class TestCancelBooking:
    def test_cancel_booking_success(self, mock_auth, mock_db_session):
        """Test successfully cancelling a booking."""
        # Arrange
        booking_id = str(uuid.uuid4())
        
        mock_crud = MagicMock()
        mock_booking = MagicMock(
            id=uuid.UUID(booking_id),
            user_id=uuid.UUID(mock_auth.return_value),
            status=BookingStatus.PENDING,
            scheduled_time=datetime.utcnow() + timedelta(days=1)
        )
        mock_crud.get_booking.return_value = mock_booking
        
        updated_booking = MagicMock(
            id=uuid.UUID(booking_id),
            user_id=uuid.UUID(mock_auth.return_value),
            status=BookingStatus.CANCELLED
        )
        mock_crud.update_booking.return_value = updated_booking
        
        # Act
        with patch('app.endpoints.booking.crud', mock_crud):
            response = client.post(f"/bookings/{booking_id}/cancel")
        
        # Assert
        assert response.status_code == 200
        assert response.json()["status"] == BookingStatus.CANCELLED
        mock_crud.update_booking.assert_called_once()

class TestGetUserBookings:
    def test_get_current_user_bookings_success(self, mock_auth, mock_db_session):
        """Test retrieving bookings for the current user."""
        # Arrange
        user_id = mock_auth.return_value
        
        mock_crud = MagicMock()
        mock_bookings = [
            MagicMock(
                id=uuid.uuid4(),
                user_id=uuid.UUID(user_id),
                gig_id=uuid.uuid4(),
                status=BookingStatus.PENDING,
                scheduled_time=datetime.utcnow(),
                created_at=datetime.utcnow()
            ),
            MagicMock(
                id=uuid.uuid4(),
                user_id=uuid.UUID(user_id),
                gig_id=uuid.uuid4(),
                status=BookingStatus.CONFIRMED,
                scheduled_time=datetime.utcnow(),
                created_at=datetime.utcnow()
            )
        ]
        mock_crud.get_bookings_by_user.return_value = mock_bookings
        
        # Act
        with patch('app.endpoints.booking.crud', mock_crud):
            with patch('app.endpoints.booking.get_gig_details', return_value=None):
                response = client.get("/bookings/by-current-user")
        
        # Assert
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        assert len(response.json()) == 2
        mock_crud.get_bookings_by_user.assert_called_once_with(mock_db_session.return_value, user_id)