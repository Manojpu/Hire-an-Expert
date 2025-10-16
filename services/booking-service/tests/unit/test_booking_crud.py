"""
Unit tests for the booking service CRUD operations.
"""
import pytest
from unittest.mock import MagicMock, patch
import uuid
from datetime import datetime
from app.db.crud import (
    create_booking, get_booking, update_booking,
    delete_booking, get_bookings_by_user
)
from app.db.models import Booking, BookingStatus
from app.db.schemas import BookingCreate, BookingUpdate

@pytest.fixture
def mock_db():
    """Create a mock database session for testing."""
    mock = MagicMock()
    return mock

@pytest.fixture
def sample_booking_id():
    """Return a sample booking UUID for testing."""
    return str(uuid.uuid4())

@pytest.fixture
def sample_user_id():
    """Return a sample user UUID for testing."""
    return str(uuid.uuid4())

@pytest.fixture
def sample_gig_id():
    """Return a sample gig UUID for testing."""
    return str(uuid.uuid4())

class TestCreateBooking:
    def test_create_booking_success(self, mock_db, sample_user_id, sample_gig_id):
        """Test creating a booking with valid data."""
        # Arrange
        scheduled_time = datetime.utcnow()
        booking_data = BookingCreate(
            gig_id=uuid.UUID(sample_gig_id),
            scheduled_time=scheduled_time
        )
        
        # Configure mock behavior
        mock_db_booking = MagicMock()
        mock_db_booking.id = uuid.uuid4()
        mock_db_booking.user_id = uuid.UUID(sample_user_id)
        mock_db_booking.gig_id = uuid.UUID(sample_gig_id)
        mock_db_booking.scheduled_time = scheduled_time
        mock_db_booking.status = BookingStatus.PENDING
        
        mock_db.add.return_value = None
        mock_db.commit.return_value = None
        mock_db.refresh.return_value = None
        
        # Act
        with patch('app.db.crud.Booking', return_value=mock_db_booking):
            result = create_booking(mock_db, booking_data, sample_user_id)
        
        # Assert
        assert result == mock_db_booking
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once_with(mock_db_booking)

class TestGetBooking:
    def test_get_booking_success(self, mock_db, sample_booking_id):
        """Test retrieving a booking that exists."""
        # Arrange
        mock_booking = MagicMock()
        mock_query = MagicMock()
        mock_filter = MagicMock()
        
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.first.return_value = mock_booking
        
        # Act
        result = get_booking(mock_db, sample_booking_id)
        
        # Assert
        assert result == mock_booking
        mock_db.query.assert_called_once()
        mock_query.filter.assert_called_once()
        mock_filter.first.assert_called_once()
    
    def test_get_booking_not_found(self, mock_db, sample_booking_id):
        """Test retrieving a booking that doesn't exist."""
        # Arrange
        mock_query = MagicMock()
        mock_filter = MagicMock()
        
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.first.return_value = None
        
        # Act
        result = get_booking(mock_db, sample_booking_id)
        
        # Assert
        assert result is None
        mock_db.query.assert_called_once()
        mock_query.filter.assert_called_once()
        mock_filter.first.assert_called_once()
    
    def test_get_booking_invalid_id(self, mock_db):
        """Test retrieving a booking with an invalid UUID."""
        # Arrange
        invalid_id = "not-a-uuid"
        
        # Act & Assert
        with pytest.raises(ValueError):
            get_booking(mock_db, invalid_id)

class TestUpdateBooking:
    def test_update_booking_success(self, mock_db, sample_booking_id):
        """Test updating a booking that exists."""
        # Arrange
        new_status = BookingStatus.CONFIRMED
        new_time = datetime.utcnow()
        booking_update = BookingUpdate(status=new_status, scheduled_time=new_time)
        
        mock_booking = MagicMock()
        mock_query = MagicMock()
        mock_filter = MagicMock()
        
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.first.return_value = mock_booking
        
        # Act
        result = update_booking(mock_db, sample_booking_id, booking_update)
        
        # Assert
        assert result == mock_booking
        assert mock_booking.status == new_status
        assert mock_booking.scheduled_time == new_time
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once_with(mock_booking)
    
    def test_update_booking_not_found(self, mock_db, sample_booking_id):
        """Test updating a booking that doesn't exist."""
        # Arrange
        booking_update = BookingUpdate(status=BookingStatus.CONFIRMED)
        
        mock_query = MagicMock()
        mock_filter = MagicMock()
        
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.first.return_value = None
        
        # Act
        result = update_booking(mock_db, sample_booking_id, booking_update)
        
        # Assert
        assert result is None
        mock_db.commit.assert_not_called()

class TestDeleteBooking:
    def test_delete_booking_success(self, mock_db, sample_booking_id):
        """Test deleting a booking that exists."""
        # Arrange
        mock_booking = MagicMock()
        mock_query = MagicMock()
        mock_filter = MagicMock()
        
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.first.return_value = mock_booking
        
        # Act
        result = delete_booking(mock_db, sample_booking_id)
        
        # Assert
        assert result is True
        mock_db.delete.assert_called_once_with(mock_booking)
        mock_db.commit.assert_called_once()
    
    def test_delete_booking_not_found(self, mock_db, sample_booking_id):
        """Test deleting a booking that doesn't exist."""
        # Arrange
        mock_query = MagicMock()
        mock_filter = MagicMock()
        
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.first.return_value = None
        
        # Act
        result = delete_booking(mock_db, sample_booking_id)
        
        # Assert
        assert result is False
        mock_db.delete.assert_not_called()
        mock_db.commit.assert_not_called()

class TestGetBookingsByUser:
    def test_get_bookings_by_user_success(self, mock_db, sample_user_id):
        """Test retrieving bookings for a specific user."""
        # Arrange
        mock_bookings = [MagicMock(), MagicMock()]
        mock_query = MagicMock()
        mock_filter = MagicMock()
        
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.all.return_value = mock_bookings
        
        # Act
        result = get_bookings_by_user(mock_db, sample_user_id)
        
        # Assert
        assert result == mock_bookings
        mock_db.query.assert_called_once()
        mock_query.filter.assert_called_once()
        mock_filter.all.assert_called_once()
    
    def test_get_bookings_by_user_empty(self, mock_db, sample_user_id):
        """Test retrieving bookings for a user with no bookings."""
        # Arrange
        mock_query = MagicMock()
        mock_filter = MagicMock()
        
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.all.return_value = []
        
        # Act
        result = get_bookings_by_user(mock_db, sample_user_id)
        
        # Assert
        assert result == []
        mock_db.query.assert_called_once()
        mock_query.filter.assert_called_once()
        mock_filter.all.assert_called_once()