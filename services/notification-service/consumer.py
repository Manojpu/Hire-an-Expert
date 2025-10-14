#!/usr/bin/env python
import json
import logging

import pika

from config import settings
from message_validator import validate_message_fields
from notification_sender import (
    send_booking_cancellation_notification,
    send_booking_confirmation_to_client,
    send_booking_reminder,
    send_booking_request_to_expert,
    send_payment_confirmation,
    send_welcome_message,
)


logger = logging.getLogger(__name__)

# Constants
EXCHANGE_NAME = "hire_an_expert_events"
QUEUE_NAME = "notification_queue"
ROUTING_KEYS = [
    "booking.*",  # All booking events
    "payment.*",  # All payment events
    "user.*"      # All user events
]

HANDLERS = {
    "booking.created": send_booking_request_to_expert,
    "booking.accepted": send_booking_confirmation_to_client,
    "booking.cancelled": send_booking_cancellation_notification,
    "booking.reminder.24hr": send_booking_reminder,
    "payment.successful": send_payment_confirmation,
    "user.welcome": send_welcome_message,
}


def setup_rabbitmq():
    """
    Set up RabbitMQ connection, exchange, queue, and bindings.
    """
    # Set up connection parameters
    credentials = pika.PlainCredentials(settings.rabbitmq_user, settings.rabbitmq_pass)
    parameters = pika.ConnectionParameters(
        host=settings.rabbitmq_host,
        port=settings.rabbitmq_port,
        credentials=credentials
    )

    # Connect to RabbitMQ server
    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()

    # Declare exchange - topic type for routing based on patterns
    channel.exchange_declare(
        exchange=EXCHANGE_NAME,
        exchange_type='topic',
        durable=True
    )

    # Declare queue
    channel.queue_declare(
        queue=QUEUE_NAME,
        durable=True
    )

    # Bind queue to exchange with routing keys
    for routing_key in ROUTING_KEYS:
        channel.queue_bind(
            exchange=EXCHANGE_NAME,
            queue=QUEUE_NAME,
            routing_key=routing_key
        )

    return connection, channel

def callback(ch, method, properties, body):
    """
    Callback function executed when a message is received.
    """
    try:
        routing_key = method.routing_key
        
        try:
            message = json.loads(body)
        except json.JSONDecodeError:
            logger.error(f"Failed to parse message as JSON: {body}")
            # Negative acknowledgment for malformed message
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
            return
        
        logger.info(f"Received message with routing key: {routing_key}")
        logger.debug(f"Message content: {message}")

        # Ensure message has the required fields for the event type
        if not validate_message_fields(routing_key, message):
            logger.warning(f"Message missing required fields for {routing_key}: {message}")
            # Negative acknowledgment for invalid message
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
            return

        handler = HANDLERS.get(routing_key)
        if handler:
            success = handler(message)
            if not success:
                logger.error("Handler reported failure for routing key %s", routing_key)
        else:
            logger.warning("No handler registered for routing key %s", routing_key)

        # Acknowledge message
        ch.basic_ack(delivery_tag=method.delivery_tag)
        
    except json.JSONDecodeError:
        logger.error("Failed to decode message as JSON")
        # Negative acknowledgment for malformed message
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    except Exception as e:
        logger.error(f"Error processing message: {str(e)}")
        # Negative acknowledgment on processing error, requeue
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

def start_consuming():
    """
    Start consuming messages from RabbitMQ.
    """
    connection, channel = setup_rabbitmq()
    
    # Set prefetch count to 1 to ensure fair dispatch
    channel.basic_qos(prefetch_count=1)
    
    # Start consuming
    channel.basic_consume(
        queue=QUEUE_NAME,
        on_message_callback=callback
    )
    
    logger.info("Notification Service started. Waiting for messages...")
    
    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        channel.stop_consuming()
    finally:
        connection.close()
        
if __name__ == "__main__":
    start_consuming()