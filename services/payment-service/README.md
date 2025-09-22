# Payment Service - Hire an Expert Marketplace

A comprehensive FastAPI-based payment service with Stripe Connect integration, escrow functionality, and commission handling for the "Hire an Expert" marketplace platform.

## 🚀 Features

- **Escrow Payments**: Funds are authorized but not captured until service completion
- **Stripe Connect**: Automatic expert account creation and management
- **Commission Handling**: Platform takes configurable commission (default 10%)
- **Secure Payments**: No card data storage, token-based payments
- **Webhook Integration**: Real-time payment status updates
- **Idempotency**: Safe payment operation retries
- **Audit Trail**: Complete transaction logging

## 🛠 Tech Stack

- **Backend**: FastAPI + SQLAlchemy
- **Database**: PostgreSQL
- **Payments**: Stripe Python SDK + Stripe Connect
- **Authentication**: JWT tokens (integration ready)

## 📁 Project Structure

```
payment-service/
├── app/
│   ├── main.py                 # FastAPI application
│   ├── models.py              # SQLAlchemy models
│   ├── schemas.py             # Pydantic request/response models
│   ├── database.py            # Database configuration
│   ├── stripe_service.py      # Stripe integration
│   ├── payment_service.py     # Business logic layer
│   ├── webhook_handler.py     # Stripe webhook processing
│   └── endpoints/
│       ├── payments.py        # Payment endpoints
│       ├── experts.py         # Expert account endpoints
│       └── webhooks.py        # Webhook endpoints
├── requirements.txt
├── .env.example
└── README.md
```

## 🚀 Quick Start

### 1. Installation

```bash
# Clone and navigate to payment service
cd services/payment-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# - Add your Stripe API keys
# - Configure database connection
# - Set webhook secret
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb payment_db

# The tables will be created automatically when the service starts
```

### 4. Run the Service

```bash
# Start the FastAPI server
python -m app.main

# Or use uvicorn directly
uvicorn app.main:app --host 0.0.0.0 --port 8005 --reload
```

The service will be available at:

- **API**: http://localhost:8005
- **Documentation**: http://localhost:8005/docs
- **Health Check**: http://localhost:8005/health

## 🔄 Payment Flow

### 1. Expert Onboarding

```python
# Create Stripe Connect account for expert
POST /api/v1/experts/create-account
{
    "user_id": "expert_123",
    "name": "John Doe",
    "email": "john@example.com",
    "country": "US",
    "business_type": "individual"
}

# Response includes onboarding link
{
    "expert": {...},
    "account_link": "https://connect.stripe.com/express/...",
    "dashboard_link": null
}
```

### 2. Payment Initiation (Escrow)

```python
# Client initiates payment
POST /api/v1/payments/initiate
{
    "client_id": "client_456",
    "expert_id": 123,
    "gig_id": "gig_789",
    "amount": 100.00,
    "currency": "USD",
    "description": "Web Development Service",
    "idempotency_key": "unique_key_123"
}

# Response with client secret for frontend
{
    "payment": {
        "payment_uuid": "uuid_here",
        "status": "pending",
        "amount": 100.00,
        "commission": 10.00,
        "expert_amount": 90.00,
        ...
    },
    "client_secret": "pi_xxx_secret_xxx",
    "publishable_key": "pk_test_...",
    "application_fee_amount": 1000  # 10.00 in cents
}
```

### 3. Frontend Payment Confirmation

```javascript
// Use Stripe.js on frontend to confirm payment
const stripe = Stripe(publishable_key);
const result = await stripe.confirmCardPayment(client_secret, {
  payment_method: {
    card: cardElement,
    billing_details: {
      name: "Client Name",
    },
  },
});

// Payment is now authorized (in escrow)
```

### 4. Service Completion & Payment Capture

```python
# When service is completed, capture payment
POST /api/v1/payments/capture
{
    "payment_uuid": "uuid_here",
    "notes": "Service completed successfully"
}

# Funds are released to expert (minus commission)
```

### 5. Alternative: Refund

```python
# If service is cancelled, refund client
POST /api/v1/payments/refund
{
    "payment_uuid": "uuid_here",
    "reason": "Service cancelled by client"
}
```

## 📊 API Endpoints

### Payments

- `POST /api/v1/payments/initiate` - Create payment with escrow
- `POST /api/v1/payments/capture` - Release funds to expert
- `POST /api/v1/payments/refund` - Refund client
- `GET /api/v1/payments/history/{user_id}` - Payment history
- `GET /api/v1/payments/{payment_uuid}` - Payment details
- `GET /api/v1/payments/status/{payment_uuid}` - Payment status

### Expert Accounts

- `POST /api/v1/experts/create-account` - Create Stripe Connect account
- `GET /api/v1/experts/{user_id}` - Expert details
- `GET /api/v1/experts/{user_id}/dashboard-link` - Stripe dashboard access
- `POST /api/v1/experts/{user_id}/refresh-onboarding` - Refresh onboarding

### Webhooks

- `POST /api/v1/webhooks/stripe` - Stripe webhook handler
- `GET /api/v1/webhooks/test` - Webhook health check

## 🔒 Security Features

- **No Card Storage**: All card data handled by Stripe
- **Webhook Verification**: Authentic Stripe events only
- **Idempotency Keys**: Prevent duplicate payments
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error responses
- **CORS Protection**: Configurable allowed origins

## 💰 Commission System

The platform automatically deducts commission using Stripe Connect's `application_fee_amount`:

- **Default Rate**: 10% (configurable per expert)
- **Calculation**: Automatic during payment initiation
- **Transfer**: Commission stays with platform, remainder goes to expert
- **Transparency**: Commission amount visible in all responses

## 🔄 Webhook Events

The service handles these Stripe webhook events:

- `payment_intent.succeeded` - Payment authorized (escrow)
- `payment_intent.payment_failed` - Payment failed
- `charge.succeeded` - Payment captured
- `charge.failed` - Capture failed
- `account.updated` - Expert account status changes

## 🧪 Testing

### Test Payment Flow

```bash
# 1. Create test expert account
curl -X POST http://localhost:8005/api/v1/experts/create-account \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_expert",
    "name": "Test Expert",
    "email": "expert@test.com"
  }'

# 2. Initiate test payment
curl -X POST http://localhost:8005/api/v1/payments/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "test_client",
    "expert_id": 1,
    "gig_id": "test_gig",
    "amount": 50.00
  }'

# 3. Check payment status
curl http://localhost:8005/api/v1/payments/status/{payment_uuid}
```

### Stripe Test Cards

Use Stripe's test card numbers:

- **Success**: 4242424242424242
- **Decline**: 4000000000000002
- **Authentication**: 4000002500003155

## 🚀 Production Deployment

### Environment Variables

```bash
# Production Stripe keys
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Secure database
DATABASE_URL=postgresql://user:pass@db:5432/payment_db

# Production settings
DEBUG=false
ALLOWED_ORIGINS=https://yourdomain.com
```

### Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app/ ./app/
EXPOSE 8005

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8005"]
```

## 🔍 Monitoring & Logging

- **Health Checks**: `/health` endpoint
- **Structured Logging**: JSON logs for production
- **Metrics**: Payment volume, success rates, commission tracking
- **Alerts**: Failed payments, webhook processing errors

## 🤝 Integration Points

The Payment Service integrates with:

- **User Service**: User authentication and profiles
- **Gig Service**: Service details and completion status
- **Notification Service**: Payment status updates
- **Frontend**: Payment forms and status displays

This service provides a complete, production-ready payment solution for marketplace platforms with robust escrow functionality and seamless Stripe Connect integration.
