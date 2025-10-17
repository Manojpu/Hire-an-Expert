"""Utility helpers for publishing domain events to RabbitMQ."""
from __future__ import annotations

import json
import logging
from typing import Any, Dict

import pika
from pika.exceptions import AMQPConnectionError

from config import settings

logger = logging.getLogger(__name__)


class PublishEventError(RuntimeError):
    """Raised when an event cannot be published to RabbitMQ."""


def _build_connection_parameters() -> pika.ConnectionParameters:
    credentials = pika.PlainCredentials(settings.rabbitmq_user, settings.rabbitmq_pass)
    return pika.ConnectionParameters(
        host=settings.rabbitmq_host,
        port=settings.rabbitmq_port,
        credentials=credentials,
        heartbeat=settings.rabbitmq_heartbeat,
        blocked_connection_timeout=settings.rabbitmq_blocked_connection_timeout,
    )


def publish_event(routing_key: str, message: Dict[str, Any]) -> None:
    """Publish a message to the configured RabbitMQ exchange.

    Args:
        routing_key: Topic-style routing key (e.g. ``user.welcome``).
        message: JSON-serialisable payload to send.
    """

    connection = None
    try:
        parameters = _build_connection_parameters()
        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()

        channel.exchange_declare(
            exchange=settings.rabbitmq_exchange,
            exchange_type="topic",
            durable=True,
        )

        payload = json.dumps(message)
        channel.basic_publish(
            exchange=settings.rabbitmq_exchange,
            routing_key=routing_key,
            body=payload,
            properties=pika.BasicProperties(
                delivery_mode=2,
                content_type="application/json",
            ),
        )

        logger.info("Published event '%s' with payload: %s", routing_key, payload)
    except AMQPConnectionError as exc:
        logger.error("RabbitMQ connection error while publishing %s: %s", routing_key, exc)
        raise PublishEventError("Failed to connect to RabbitMQ") from exc
    except Exception as exc:  # noqa: BLE001
        logger.exception("Unexpected error publishing event %s", routing_key)
        raise PublishEventError("Failed to publish event") from exc
    finally:
        if connection and connection.is_open:
            try:
                connection.close()
            except Exception:  # noqa: BLE001
                logger.debug("Failed to close RabbitMQ connection cleanly", exc_info=True)
