"""
Integration tests for the Payment service API endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import uuid
from datetime import datetime
from app.db.models import PaymentStatus
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
    with patch('app.endpoints.payments.get_db') as mock:
        yield mock

@pytest.fixture
def sample_payment_data():
    """Return sample payment data for tests."""
    return {
        "booking_id": str(uuid.uuid4()),
        "amount": 100.50,
        "currency": "USD"
    }

@pytest.fixture
def sample_payment_response():
    """Return a sample payment response for tests."""
    payment_id = uuid.uuid4()
    booking_id = uuid.uuid4()
    payment_intent_id = "pi_" + str(uuid.uuid4())
    now = datetime.utcnow()
    
    return {
        "id": str(payment_id),
        "booking_id": str(booking_id),
        "payment_intent_id": payment_intent_id,
        "amount": 100.50,
        "currency": "USD",
        "status": PaymentStatus.PENDING.value,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }

class TestCreatePayment:
    def test_create_payment_success(self, mock_auth, mock_db_session, sample_payment_data):
        """Test successful payment creation with valid data."""
        # Arrange
        mock_payment_intent = MagicMock()
        mock_payment_intent.id = "pi_" + str(uuid.uuid4())
        mock_payment_intent.client_secret = "cs_" + str(uuid.uuid4())
        
        mock_stripe = MagicMock()
        mock_stripe.PaymentIntent.create.return_value = mock_payment_intent
        
        mock_crud = MagicMock()
        mock_crud.create_payment.return_value = MagicMock(
            id=uuid.uuid4(),
            booking_id=uuid.UUID(sample_payment_data["booking_id"]),
            payment_intent_id=mock_payment_intent.id,
            amount=sample_payment_data["amount"],
            currency=sample_payment_data["currency"],
            status=PaymentStatus.PENDING.value,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        # Act
        with patch('app.endpoints.payments.stripe', mock_stripe):
            with patch('app.endpoints.payments.crud', mock_crud):
                response = client.post("/payments/", json=sample_payment_data)
        
        # Assert
        assert response.status_code == 201
        assert "id" in response.json()
        assert "client_secret" in response.json()
        assert response.json()["status"] == PaymentStatus.PENDING.value
        mock_stripe.PaymentIntent.create.assert_called_once()
        mock_crud.create_payment.assert_called_once()

    def test_create_payment_invalid_data(self, mock_auth):
        """Test payment creation with invalid data."""
        # Arrange - missing required fields
        invalid_data = {}
        
        # Act
        response = client.post("/payments/", json=invalid_data)
        
        # Assert
        assert response.status_code == 422  # FastAPI validation error

class TestGetPayment:
    def test_get_payment_success(self, mock_auth, mock_db_session):
        """Test retrieving an existing payment."""
        # Arrange
        payment_id = str(uuid.uuid4())
        mock_crud = MagicMock()
        mock_payment = MagicMock(
            id=uuid.UUID(payment_id),
            booking_id=uuid.uuid4(),
            payment_intent_id="pi_" + str(uuid.uuid4()),
            amount=100.50,
            currency="USD",
            status=PaymentStatus.SUCCEEDED.value,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        mock_crud.get_payment.return_value = mock_payment
        
        # Act
        with patch('app.endpoints.payments.crud', mock_crud):
            response = client.get(f"/payments/{payment_id}")
        
        # Assert
        assert response.status_code == 200
        assert response.json()["id"] == payment_id
        assert response.json()["status"] == PaymentStatus.SUCCEEDED.value
        mock_crud.get_payment.assert_called_once_with(mock_db_session.return_value, payment_id)

    def test_get_payment_not_found(self, mock_auth, mock_db_session):
        """Test retrieving a non-existent payment."""
        # Arrange
        payment_id = str(uuid.uuid4())
        mock_crud = MagicMock()
        mock_crud.get_payment.return_value = None
        
        # Act
        with patch('app.endpoints.payments.crud', mock_crud):
            response = client.get(f"/payments/{payment_id}")
        
        # Assert
        assert response.status_code == 404
        mock_crud.get_payment.assert_called_once_with(mock_db_session.return_value, payment_id)

class TestWebhookHandler:
    def test_webhook_payment_succeeded(self, mock_db_session):
        """Test handling a payment_intent.succeeded webhook event."""
        # Arrange
        payment_intent_id = "pi_" + str(uuid.uuid4())
        webhook_payload = {
            "type": "payment_intent.succeeded",
            "data": {
                "object": {
                    "id": payment_intent_id,
                    "status": "succeeded",
                    "amount": 10050,  # Amount in cents
                    "currency": "usd"
                }
            }
        }
        
        mock_crud = MagicMock()
        mock_payment = MagicMock(
            id=uuid.uuid4(),
            payment_intent_id=payment_intent_id,
            status=PaymentStatus.PENDING.value
        )
        mock_crud.get_payment_by_intent.return_value = mock_payment
        
        # Mock stripe.Webhook.construct_event
        mock_stripe = MagicMock()
        mock_stripe.Webhook.construct_event.return_value = webhook_payload
        
        # Act
        with patch('app.endpoints.payments.stripe', mock_stripe):
            with patch('app.endpoints.payments.crud', mock_crud):
                response = client.post(
                    "/payments/webhook",
                    json=webhook_payload,
                    headers={"Stripe-Signature": "test_signature"}
                )
        
        # Assert
        assert response.status_code == 200
        mock_crud.get_payment_by_intent.assert_called_once_with(
            mock_db_session.return_value, payment_intent_id
        )
        mock_crud.update_payment_status.assert_called_once_with(
            mock_db_session.return_value, str(mock_payment.id), PaymentStatus.SUCCEEDED
        )

class TestGetPaymentsByBooking:
    def test_get_payments_by_booking_success(self, mock_auth, mock_db_session):
        """Test retrieving payments for a specific booking."""
        # Arrange
        booking_id = str(uuid.uuid4())
        mock_crud = MagicMock()
        mock_payments = [
            MagicMock(
                id=uuid.uuid4(),
                booking_id=uuid.UUID(booking_id),
                payment_intent_id="pi_" + str(uuid.uuid4()),
                amount=100.50,
                currency="USD",
                status=PaymentStatus.SUCCEEDED.value,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            ),
            MagicMock(
                id=uuid.uuid4(),
                booking_id=uuid.UUID(booking_id),
                payment_intent_id="pi_" + str(uuid.uuid4()),
                amount=50.25,
                currency="USD",
                status=PaymentStatus.REFUNDED.value,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
        ]
        mock_crud.get_payments_by_booking.return_value = mock_payments
        
        # Act
        with patch('app.endpoints.payments.crud', mock_crud):
            response = client.get(f"/payments/booking/{booking_id}")
        
        # Assert
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        assert len(response.json()) == 2
        mock_crud.get_payments_by_booking.assert_called_once_with(
            mock_db_session.return_value, booking_id
        )