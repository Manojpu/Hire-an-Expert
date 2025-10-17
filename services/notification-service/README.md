# Notification Service

This service is responsible for handling notifications in the Hire-an-Expert platform.

## Features

- Listens for events from other microservices via RabbitMQ
- Sends notifications based on different types of events (bookings, payments, user actions)
- Provides a health check endpoint

## Event Types Handled

- `booking.created`: When a new booking is created
- `booking.accepted`: When an expert accepts a booking
- `booking.cancelled`: When a booking is cancelled
- `booking.reminder.24hr`: 24-hour reminder before a booking
- `payment.successful`: When a payment is successfully processed
- `user.welcome`: When a new user registers

## Setup and Installation

### Prerequisites

- Python 3.8+
- RabbitMQ
- Docker and Docker Compose (optional)

### Local Development

1. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Set up environment variables (or create a .env file):

```
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASS=guest
USER_SERVICE_URL=http://localhost:8006
REQUEST_TIMEOUT_SECONDS=10

# Optional email configuration (required for production email delivery)
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your-smtp-username
EMAIL_PASSWORD=your-smtp-password
EMAIL_FROM=notifications@hireanexpert.com
EMAIL_SENDER_NAME=Hire an Expert Notifications

# Optional frontend link used in email templates
FRONTEND_BASE_URL=https://app.hireanexpert.com
```

4. Start the service:

```bash
uvicorn main:app --reload
```

### Using Docker

```bash
docker-compose up -d
```

## API Endpoints

- `/`: Service information
- `/health`: Health check endpoint
- `/docs`: OpenAPI documentation (Swagger UI)

## Extending the Service

To add a new notification type:

1. Add the new routing key to the `ROUTING_KEYS` list in `consumer.py`
2. Implement the handler in `notification_sender.py`
3. Register the handler in the `HANDLERS` dictionary in `consumer.py`
4. Update `EVENT_REQUIRED_FIELDS` in `message_validator.py` if new fields are required

## License

See the LICENSE file in the root project directory.
