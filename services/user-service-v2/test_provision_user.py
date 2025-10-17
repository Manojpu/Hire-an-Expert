import pytest
from fastapi.testclient import TestClient
from main import app
import uuid

# You may need to adjust the import path for your app
client = TestClient(app)

WEBHOOK_SECRET = "7f6b8e2e6b9147f0b34a84d5b673d3e85d3a21b6b3c847c0a9e32f8f8a172ab4"

@pytest.fixture
def provision_payload():
    return {
        "firebase_uid": str(uuid.uuid4()),
        "email": "testuser@example.com",
        "name": "Test User",
        "is_expert": True,
        "expert_profiles": []
    }

def test_provision_user_success(provision_payload, monkeypatch):
    published = {}

    def fake_publish(routing_key, message):
        published.setdefault("count", 0)
        published["count"] += 1
        published["event"] = (routing_key, message)

    monkeypatch.setattr("routes.publish_event", fake_publish)

    response = client.post(
        "/internal/users/provision",
        json=provision_payload,
        headers={"X-Webhook-Secret": WEBHOOK_SECRET}
    )
    assert response.status_code == 200 or response.status_code == 201
    data = response.json()
    assert data["email"] == provision_payload["email"]
    assert data["name"] == provision_payload["name"]
    assert data["is_expert"] == provision_payload["is_expert"]
    assert published["count"] == 1
    event_routing_key, payload = published["event"]
    assert event_routing_key == "user.welcome"
    assert payload["user_id"]
    assert payload["user_type"] == ("expert" if provision_payload["is_expert"] else "user")

    # A second provisioning for the same UID should not send another welcome event
    response_repeat = client.post(
        "/internal/users/provision",
        json=provision_payload,
        headers={"X-Webhook-Secret": WEBHOOK_SECRET}
    )
    assert response_repeat.status_code in {200, 201}
    assert published["count"] == 1

def test_provision_user_invalid_secret(provision_payload, monkeypatch):
    def fail_publish(*args, **kwargs):  # pragma: no cover - should not run
        raise AssertionError("publish_event should not be called")

    monkeypatch.setattr("routes.publish_event", fail_publish)

    response = client.post(
        "/internal/users/provision",
        json=provision_payload,
        headers={"X-Webhook-Secret": "invalid_secret"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid secret"
