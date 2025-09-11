# 🚀 Quick Setup Guide for New Developers

## Getting Started with the API Gateway

### 1. Clone and Navigate
```bash
git clone <repository-url>
cd services/api-gateway
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env    # Linux/macOS
copy .env.example .env  # Windows

# Edit .env file with your service URLs
# Update the SERVICE_URL values to match your local setup
```

### 3. Python Environment
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate    # Linux/macOS
venv\Scripts\activate       # Windows

# Install dependencies
pip install -r requirements.txt
```

### 4. Start the Gateway
```bash
python main.py
```

The API Gateway will be available at `http://localhost:8000`

### 5. Verify Setup
```bash
# Quick validation
python validate_gateway.py

# Full test suite
python run_tests.py
```

## 🔧 Common Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DEBUG` | Development mode | `true` |
| `PORT` | Server port | `8000` |
| `FRONTEND_URL` | Frontend application URL | `http://localhost:3000` |
| `AUTH_SERVICE_URL` | Authentication service | `http://localhost:8001` |
| `GIG_SERVICE_URL` | Gig management service | `http://localhost:8002` |
| `BOOKING_SERVICE_URL` | Booking service | `http://localhost:8003` |
| `PAYMENT_SERVICE_URL` | Payment service | `http://localhost:8004` |
| `MESSAGE_SERVICE_URL` | Messaging service | `http://localhost:8005` |
| `USER_SERVICE_V2_URL` | User management service | `http://localhost:8006` |
| `REVIEW_SERVICE_URL` | Review service | `http://localhost:8007` |

## 🚨 Important Notes

- **Never commit** your `.env` file to git
- The `.env.example` file shows all required variables
- Update service URLs to match your local development setup
- Make sure all microservices are running before testing the gateway

## 🆘 Need Help?

- Check the main README.md for detailed documentation
- Run `python validate_gateway.py` to test basic functionality
- Review the test files for usage examples
