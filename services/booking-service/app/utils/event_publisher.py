"""
This module provides functionality for publishing events to RabbitMQ.

It handles connections to RabbitMQ and publishing events to the
hire_an_expert_events exchange using topic-based routing.
"""

import json
import logging
import pika
from pika.exceptions import AMQPConnectionError
from typing import Dict, Any
from app.core.config import settings

# RabbitMQ configuration from settings
RABBITMQ_HOST = settings.RABBITMQ_HOST
RABBITMQ_PORT = settings.RABBITMQ_PORT
RABBITMQ_USER = settings.RABBITMQ_USER
RABBITMQ_PASS = settings.RABBITMQ_PASS

# Constants
EXCHANGE_NAME = "hire_an_expert_events"

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def publish_event(routing_key: str, message_body: Dict[str, Any]) -> bool:
    """
    Publish an event to RabbitMQ with the specified routing key.
    
    Args:
        routing_key (str): The routing key to use (e.g., booking.created)
        message_body (Dict[str, Any]): The message to publish as a dictionary
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Set up connection parameters
        credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
        parameters = pika.ConnectionParameters(
            host=RABBITMQ_HOST,
            port=RABBITMQ_PORT,
            credentials=credentials,
            heartbeat=600,  # Set heartbeat to 10 minutes
            blocked_connection_timeout=300  # Set timeout to 5 minutes
        )
        
        # Connect to RabbitMQ
        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()
        
        # Declare exchange - topic type for routing based on patterns
        channel.exchange_declare(
            exchange=EXCHANGE_NAME,
            exchange_type='topic',
            durable=True
        )
        
        # Convert message body to JSON string
        message_json = json.dumps(message_body)
        
        # Publish message
        channel.basic_publish(
            exchange=EXCHANGE_NAME,
            routing_key=routing_key,
            body=message_json,
            properties=pika.BasicProperties(
                delivery_mode=2,  # Make message persistent
                content_type='application/json'
            )
        )
        
        logger.info(f"Published event with routing key '{routing_key}'")
        logger.debug(f"Event data: {message_body}")
        
        # Close connection
        connection.close()
        return True
        
    except AMQPConnectionError as e:
        logger.error(f"Failed to connect to RabbitMQ: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Error publishing event: {str(e)}")
        return False

def publish_booking_created_event(booking_id: str, user_id: str, expert_id: str, 
                                 scheduled_time: str, service_name: str) -> bool:
    """
    Publish a booking.created event.
    
    Args:
        booking_id (str): The ID of the booking
        user_id (str): The ID of the user making the booking
        expert_id (str): The ID of the expert (gig owner)
        scheduled_time (str): The scheduled time of the booking
        service_name (str): The name of the service being booked
        
    Returns:
        bool: True if successful, False otherwise
    """
    message = {
        "booking_id": booking_id,
        "client_id": str(user_id),
        "expert_id": str(expert_id),
        "scheduled_time": scheduled_time,
        "service_name": service_name
    }
    return publish_event("booking.created", message)

def publish_booking_accepted_event(booking_id: str, user_id: str, expert_id: str,
                                  scheduled_time: str, service_name: str) -> bool:
    """
    Publish a booking.accepted event.
    
    Args:
        booking_id (str): The ID of the booking
        user_id (str): The ID of the user who made the booking
        expert_id (str): The ID of the expert who accepted the booking
        scheduled_time (str): The scheduled time of the booking
        service_name (str): The name of the service being booked
        
    Returns:
        bool: True if successful, False otherwise
    """
    message = {
        "booking_id": booking_id,
        "client_id": str(user_id),
        "expert_id": str(expert_id),
        "scheduled_time": scheduled_time,
        "service_name": service_name
    }
    return publish_event("booking.accepted", message)

def publish_booking_cancelled_event(booking_id: str, user_id: str, expert_id: str,
                                   reason: str = None) -> bool:
    """
    Publish a booking.cancelled event.
    
    Args:
        booking_id (str): The ID of the booking
        user_id (str): The ID of the user who made the booking
        expert_id (str): The ID of the expert for the booking
        reason (str, optional): Reason for cancellation
        
    Returns:
        bool: True if successful, False otherwise
    """
    message = {
        "booking_id": booking_id,
        "client_id": str(user_id),
        "expert_id": str(expert_id),
        "reason": reason or "No reason provided"
    }
    return publish_event("booking.cancelled", message)