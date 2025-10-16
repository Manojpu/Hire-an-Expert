# Notification System Architecture

This document describes the notification system architecture for the Hire-an-Expert platform. The system follows an event-driven architecture using RabbitMQ as the message broker.

## Overview

The notification system consists of:

1. **Publishers**: Services that generate events (e.g., Booking Service)
2. **Message Broker**: RabbitMQ topic exchange
3. **Consumer**: Notification Service that processes events and sends notifications

## Event Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│                 │     │                  │     │                  │
│ Booking Service ├────►│  RabbitMQ Topic  ├────►│  Notification    │
│ (Publisher)     │     │  Exchange        │     │  Service         │
│                 │     │                  │     │  (Consumer)      │
└─────────────────┘     └──────────────────┘     └──────────────────┘
                              │                         │
┌─────────────────┐           │                         │
│                 │           │                         ▼
│ Payment Service ├───────────┘               ┌──────────────────┐
│ (Publisher)     │                           │                  │
│                 │                           │  Notification    │
└─────────────────┘                           │  Channels        │
                                              │  (Email, SMS,    │
┌─────────────────┐                           │  Push, etc.)     │
│                 │                           │                  │
│ User Service    ├───────────────────────────►                  │
│ (Publisher)     │                           │                  │
│                 │                           └──────────────────┘
└─────────────────┘
```

## RabbitMQ Configuration

- **Exchange**: `hire_an_expert_events` (topic exchange)
- **Queue**: `notification_queue`
- **Bindings**:
  - `booking.*` - All booking events
  - `payment.*` - All payment events
  - `user.*` - All user events

## Event Types

### Booking Events

- `booking.created`: When a new booking is created
- `booking.accepted`: When an expert accepts a booking
- `booking.cancelled`: When a booking is cancelled
- `booking.reminder.24hr`: 24-hour reminder before a booking

### Payment Events

- `payment.successful`: When a payment is successfully processed
- `payment.failed`: When a payment fails
- `payment.refunded`: When a payment is refunded

### User Events

- `user.welcome`: When a new user registers
- `user.profile_updated`: When a user updates their profile
- `user.password_reset`: When a user requests a password reset

## Message Format

All messages are JSON objects with the following structure:

```json
{
  "event_type": "booking.created",
  "timestamp": "2023-10-15T14:30:00Z",
  "payload": {
    "booking_id": "123e4567-e89b-12d3-a456-426614174000",
    "client_id": "789e4567-e89b-12d3-a456-426614174111",
    "expert_id": "456e4567-e89b-12d3-a456-426614174222",
    "scheduled_time": "2023-10-16T10:00:00Z",
    "service_name": "Code Review"
  }
}
```

## Publisher Implementation (Booking Service)

The Booking Service publishes events when:

1. A new booking is created (`booking.created`)
2. A booking is accepted by an expert (`booking.accepted`)
3. A booking is cancelled (`booking.cancelled`)
4. A scheduled script runs to send reminders (`booking.reminder.24hr`)

## Consumer Implementation (Notification Service)

The Notification Service:

1. Connects to RabbitMQ
2. Declares the exchange and queue
3. Binds the queue to the exchange with routing keys
4. Consumes messages from the queue
5. Processes messages based on routing key
6. Sends notifications via appropriate channels

## Extending the System

To add a new notification type:

1. Define a new routing key pattern (e.g., `review.submitted`)
2. Update the consumer to handle the new event type
3. Add a new function in `notification_sender.py`
4. Update the service generating the event to publish with the new routing key

## Deployment Architecture

In a production environment:

1. Each service runs in its own container
2. RabbitMQ runs as a separate service
3. Services communicate via the message broker
4. Multiple instances of the Notification Service can be deployed for high availability

## Error Handling

1. Failed messages are negatively acknowledged and requeued
2. Dead letter exchanges can be implemented for persistent failures
3. Logging is comprehensive across all components

## Future Improvements

1. **Notification Preferences**: Allow users to specify notification preferences
2. **Templating System**: Implement a templating system for notification content
3. **Batch Processing**: Group similar notifications to avoid overwhelming users
4. **Notification History**: Store notification history for user reference
5. **Analytics**: Track notification open/click rates
