"""
Unit tests for the Payment service CRUD operations.
"""
import pytest
from unittest.mock import MagicMock, patch
import uuid
from datetime import datetime
from app.db.crud import create_payment, get_payment, update_payment_status, get_payments_by_booking
from app.db.models import Payment, PaymentStatus
from app.db.schemas import PaymentCreate

@pytest.fixture
def mock_db():
    """Create a mock database session for testing."""
    mock = MagicMock()
    return mock

@pytest.fixture
def sample_payment_id():
    """Return a sample payment UUID for testing."""
    return str(uuid.uuid4())

@pytest.fixture
def sample_booking_id():
    """Return a sample booking UUID for testing."""
    return str(uuid.uuid4())

@pytest.fixture
def sample_payment_intent_id():
    """Return a sample payment intent ID for testing."""
    return "pi_" + str(uuid.uuid4())

class TestCreatePayment:
    def test_create_payment_success(self, mock_db, sample_booking_id, sample_payment_intent_id):
        """Test creating a payment with valid data."""
        # Arrange
        amount = 100.50
        payment_data = PaymentCreate(
            booking_id=uuid.UUID(sample_booking_id),
            payment_intent_id=sample_payment_intent_id,
            amount=amount,
            currency="USD",
            status=PaymentStatus.PENDING
        )
        
        # Configure mock behavior
        mock_db_payment = MagicMock()
        mock_db_payment.id = uuid.uuid4()
        mock_db_payment.booking_id = uuid.UUID(sample_booking_id)
        mock_db_payment.payment_intent_id = sample_payment_intent_id
        mock_db_payment.amount = amount
        mock_db_payment.currency = "USD"
        mock_db_payment.status = PaymentStatus.PENDING.value
        
        mock_db.add.return_value = None
        mock_db.commit.return_value = None
        mock_db.refresh.return_value = None
        
        # Act
        with patch('app.db.crud.Payment', return_value=mock_db_payment):
            result = create_payment(mock_db, payment_data)
        
        # Assert
        assert result == mock_db_payment
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once_with(mock_db_payment)

class TestGetPayment:
    def test_get_payment_success(self, mock_db, sample_payment_id):
        """Test retrieving a payment that exists."""
        # Arrange
        mock_payment = MagicMock()
        mock_query = MagicMock()
        mock_filter = MagicMock()
        
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.first.return_value = mock_payment
        
        # Act
        result = get_payment(mock_db, sample_payment_id)
        
        # Assert
        assert result == mock_payment
        mock_db.query.assert_called_once_with(Payment)
        mock_query.filter.assert_called_once()
        mock_filter.first.assert_called_once()
    
    def test_get_payment_not_found(self, mock_db, sample_payment_id):
        """Test retrieving a payment that doesn't exist."""
        # Arrange
        mock_query = MagicMock()
        mock_filter = MagicMock()
        
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.first.return_value = None
        
        # Act
        result = get_payment(mock_db, sample_payment_id)
        
        # Assert
        assert result is None
        mock_db.query.assert_called_once_with(Payment)
        mock_query.filter.assert_called_once()
        mock_filter.first.assert_called_once()

class TestUpdatePaymentStatus:
    def test_update_payment_status_success(self, mock_db, sample_payment_id):
        """Test updating a payment status that exists."""
        # Arrange
        new_status = PaymentStatus.SUCCEEDED
        
        mock_payment = MagicMock()
        mock_query = MagicMock()
        mock_filter = MagicMock()
        
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.first.return_value = mock_payment
        
        # Act
        result = update_payment_status(mock_db, sample_payment_id, new_status)
        
        # Assert
        assert result == mock_payment
        assert mock_payment.status == new_status.value
        mock_db.commit.assert_called_once()
    
    def test_update_payment_status_not_found(self, mock_db, sample_payment_id):
        """Test updating a payment status that doesn't exist."""
        # Arrange
        new_status = PaymentStatus.SUCCEEDED
        
        mock_query = MagicMock()
        mock_filter = MagicMock()
        
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.first.return_value = None
        
        # Act
        result = update_payment_status(mock_db, sample_payment_id, new_status)
        
        # Assert
        assert result is None
        mock_db.commit.assert_not_called()

class TestGetPaymentsByBooking:
    def test_get_payments_by_booking_success(self, mock_db, sample_booking_id):
        """Test retrieving payments for a specific booking."""
        # Arrange
        mock_payments = [MagicMock(), MagicMock()]
        mock_query = MagicMock()
        mock_filter = MagicMock()
        
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.all.return_value = mock_payments
        
        # Act
        result = get_payments_by_booking(mock_db, sample_booking_id)
        
        # Assert
        assert result == mock_payments
        mock_db.query.assert_called_once_with(Payment)
        mock_query.filter.assert_called_once()
        mock_filter.all.assert_called_once()
    
    def test_get_payments_by_booking_empty(self, mock_db, sample_booking_id):
        """Test retrieving payments for a booking with no payments."""
        # Arrange
        mock_query = MagicMock()
        mock_filter = MagicMock()
        
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.all.return_value = []
        
        # Act
        result = get_payments_by_booking(mock_db, sample_booking_id)
        
        # Assert
        assert result == []
        mock_db.query.assert_called_once_with(Payment)
        mock_query.filter.assert_called_once()
        mock_filter.all.assert_called_once()