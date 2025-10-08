# Payment Service

Payment Service for the Hire-an-Expert platform, handling Stripe integration for gig bookings.

## Features

- Process payments using Stripe Checkout or Stripe Elements
- Track payment status and history
- Handle webhook events from Stripe
- Process refunds
- Synchronize payment status with the booking service

## Prerequisites

- Python 3.9+
- PostgreSQL or SQLite database
- Stripe account with API keys
- FastAPI

## Environment Setup

1. Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

2. Update the `.env` file with your Stripe API keys and other configurations:

```
# Stripe API Keys
STRIPE_PUBLIC_KEY=pk_test_your_public_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Database Connection
DATABASE_URL=sqlite:///./payments.db
# For PostgreSQL use:
# DATABASE_URL=postgresql://username:password@localhost/payment_db

# Service URLs
BOOKING_SERVICE_URL=http://localhost:8001
FRONTEND_URL=http://localhost:5173

# Payment settings
CURRENCY=LKR
PLATFORM_FEE_PERCENT=5

# Environment
ENVIRONMENT=development
```

## Installation

1. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
```

2. Install the requirements:

```bash
pip install -r requirements.txt
```

3. Initialize the database:

```bash
alembic upgrade head
```

## Running the Service

Start the service with:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8004
```

Or using Docker:

```bash
docker-compose up -d
```

## API Endpoints

### Payment Creation

- `POST /payments/create-checkout-session` - Create a Stripe Checkout session
- `POST /payments/create-payment-intent` - Create a payment intent for direct integration

### Payment Management

- `GET /payments/payment-status/{payment_intent_id}` - Get payment status
- `POST /payments/refund` - Process a refund
- `GET /payments/bookings/{booking_id}/payments` - Get all payments for a booking

### Webhooks

- `POST /payments/webhook` - Handle Stripe webhook events

## Testing

1. Run the test HTML page to test the integration:

```bash
# Open the test page in a browser
open test-payment-integration.html
```

2. Use test credit card numbers from Stripe:
   - `4242 4242 4242 4242` - Successful payment
   - `4000 0000 0000 0002` - Declined payment
   - `4000 0000 0000 3220` - 3D Secure authentication required

## Database Schema

The database has a `payments` table with the following schema:

- `id`: Primary key
- `booking_id`: Reference to the booking
- `payment_intent_id`: Stripe payment intent ID
- `amount`: Payment amount
- `currency`: Currency code (default: LKR)
- `status`: Payment status (PENDING, SUCCEEDED, FAILED, REFUNDED, CANCELED)
- `metadata`: Additional metadata as JSON
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update

## Frontend Integration

See the [Integration Guide](INTEGRATION_GUIDE.md) for detailed instructions on integrating with the frontend.

## Stripe Setup for Production

For production use:

1. Set up a Stripe account and get production API keys
2. Configure webhooks in the Stripe dashboard to point to your payment service
3. Enable relevant payment methods for your region
4. Set up proper error handling and monitoring

## Security Considerations

- Always use HTTPS in production
- Validate all webhook requests with the webhook secret
- Never log full card details or sensitive information
- Use proper authentication for all endpoints
- Regularly update dependencies to patch security vulnerabilities
