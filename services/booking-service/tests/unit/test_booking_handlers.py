"""
Unit tests for the booking service API endpoint handlers.
"""
import pytest
from unittest.mock import MagicMock, patch
import uuid
from datetime import datetime, timedelta
from app.db.models import BookingStatus
from app.endpoints.booking import get_bookings, get_bookings_by_user_new_endpoint, create_booking

class TestGetBookings:
    def test_get_bookings_success(self):
        """Test getting all bookings successfully."""
        # Arrange
        mock_db = MagicMock()
        mock_bookings = [MagicMock(), MagicMock()]
        
        with patch('app.endpoints.booking.crud.get_bookings', return_value=mock_bookings):
            # Act
            result = get_bookings(db=mock_db)
            
            # Assert
            assert result == mock_bookings
    
    def test_get_bookings_invalid_pagination(self):
        """Test getting bookings with invalid pagination parameters."""
        # Arrange
        mock_db = MagicMock()
        
        # Act & Assert - negative skip
        with pytest.raises(Exception) as exc_info:
            get_bookings(skip=-1, limit=10, db=mock_db)
        assert "Skip parameter must be non-negative" in str(exc_info.value)
        
        # Act & Assert - zero limit
        with pytest.raises(Exception) as exc_info:
            get_bookings(skip=0, limit=0, db=mock_db)
        assert "Limit parameter must be between" in str(exc_info.value)
        
        # Act & Assert - excessive limit
        with pytest.raises(Exception) as exc_info:
            get_bookings(skip=0, limit=1001, db=mock_db)
        assert "Limit parameter must be between" in str(exc_info.value)
    
    def test_get_bookings_error_handling(self):
        """Test error handling during get bookings."""
        # Arrange
        mock_db = MagicMock()
        
        with patch('app.endpoints.booking.crud.get_bookings', side_effect=Exception("Database error")):
            # Act & Assert
            with pytest.raises(Exception) as exc_info:
                get_bookings(db=mock_db)
            assert "Failed to get bookings" in str(exc_info.value)

class TestGetBookingsByUser:
    def test_get_bookings_by_user_success(self):
        """Test getting bookings for a specific user successfully."""
        # Arrange
        mock_db = MagicMock()
        user_id = str(uuid.uuid4())
        mock_bookings = [MagicMock(), MagicMock()]
        
        # Act
        with patch('app.endpoints.booking.crud.get_bookings_by_user', return_value=mock_bookings):
            with patch('app.endpoints.booking.get_gig_details', return_value=None):
                result = get_bookings_by_user_new_endpoint(db=mock_db, current_user_id=user_id, include_gig_details=False)
                
                # Assert
                assert result == mock_bookings
    
    def test_get_bookings_by_user_with_gig_details(self):
        """Test getting bookings with gig details for a specific user."""
        # Arrange
        mock_db = MagicMock()
        user_id = str(uuid.uuid4())
        gig_id = uuid.uuid4()
        
        mock_booking1 = MagicMock()
        mock_booking1.id = uuid.uuid4()
        mock_booking1.user_id = uuid.UUID(user_id)
        mock_booking1.gig_id = gig_id
        mock_booking1.status = BookingStatus.PENDING
        mock_booking1.scheduled_time = datetime.utcnow()
        mock_booking1.created_at = datetime.utcnow()
        
        mock_bookings = [mock_booking1]
        mock_gig_details = {
            "id": str(gig_id),
            "service_description": "Test Gig",
            "hourly_rate": 100.0,
            "currency": "USD"
        }
        
        # Act
        with patch('app.endpoints.booking.crud.get_bookings_by_user', return_value=mock_bookings):
            with patch('app.endpoints.booking.get_gig_details', return_value=mock_gig_details):
                result = get_bookings_by_user_new_endpoint(db=mock_db, current_user_id=user_id, include_gig_details=True)
                
                # Assert
                assert len(result) == 1
                assert result[0]["gig_details"] == mock_gig_details
    
    def test_get_bookings_by_user_error_handling(self):
        """Test error handling during get bookings by user."""
        # Arrange
        mock_db = MagicMock()
        user_id = str(uuid.uuid4())
        
        with patch('app.endpoints.booking.crud.get_bookings_by_user', side_effect=Exception("Database error")):
            # Act & Assert
            with pytest.raises(Exception) as exc_info:
                get_bookings_by_user_new_endpoint(db=mock_db, current_user_id=user_id)
            assert "Error retrieving bookings" in str(exc_info.value)

class TestCreateBooking:
    def test_create_booking_success(self):
        """Test creating a booking successfully."""
        # Arrange
        mock_db = MagicMock()
        user_id = str(uuid.uuid4())
        gig_id = str(uuid.uuid4())
        scheduled_time = datetime.utcnow() + timedelta(days=1)
        
        booking_data = MagicMock()
        booking_data.gig_id = uuid.UUID(gig_id)
        booking_data.scheduled_time = scheduled_time
        
        mock_created_booking = MagicMock()
        mock_created_booking.id = uuid.uuid4()
        mock_created_booking.user_id = uuid.UUID(user_id)
        mock_created_booking.gig_id = uuid.UUID(gig_id)
        mock_created_booking.scheduled_time = scheduled_time
        mock_created_booking.status = BookingStatus.PENDING
        
        # Act
        with patch('app.endpoints.booking.crud.create_booking', return_value=mock_created_booking):
            result = create_booking(booking=booking_data, db=mock_db, current_user_id=user_id)
            
            # Assert
            assert result == mock_created_booking
    
    def test_create_booking_error_handling(self):
        """Test error handling during booking creation."""
        # Arrange
        mock_db = MagicMock()
        user_id = str(uuid.uuid4())
        
        booking_data = MagicMock()
        
        with patch('app.endpoints.booking.crud.create_booking', side_effect=Exception("Database error")):
            # Act & Assert
            with pytest.raises(Exception) as exc_info:
                create_booking(booking=booking_data, db=mock_db, current_user_id=user_id)
            assert "Failed to create booking" in str(exc_info.value)