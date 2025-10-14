"""
This module provides utilities for validating message formats.
"""

import logging
from typing import Dict, Any, List, Set

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Define required fields for each event type
EVENT_REQUIRED_FIELDS = {
    "booking.created": {"booking_id", "client_id", "expert_id", "scheduled_time", "service_name"},
    "booking.accepted": {"booking_id", "client_id", "expert_id", "scheduled_time", "service_name"},
    "booking.cancelled": {"booking_id", "client_id", "expert_id"},
    "booking.reminder.24hr": {"booking_id", "client_id", "expert_id", "booking_time"},
    "payment.successful": {"booking_id", "client_id", "payment_id"},
    "user.welcome": {"user_id"}
}

def validate_message_fields(routing_key: str, message: Dict[str, Any]) -> bool:
    """
    Validate that a message contains all required fields for its event type.
    
    Args:
        routing_key (str): The routing key for the message
        message (Dict[str, Any]): The message content
        
    Returns:
        bool: True if the message has all required fields, False otherwise
    """
    # If we don't have defined field requirements for this event type, consider it valid
    if routing_key not in EVENT_REQUIRED_FIELDS:
        return True
    
    required_fields = EVENT_REQUIRED_FIELDS[routing_key]
    message_fields = set(message.keys())
    
    # Check if all required fields are present
    missing_fields = required_fields - message_fields
    
    if missing_fields:
        logger.warning(f"Message for {routing_key} missing required fields: {missing_fields}")
        return False
        
    return True