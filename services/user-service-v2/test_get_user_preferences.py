import uuid
import pytest
from fastapi.testclient import TestClient
from main import app
from models import User

client = TestClient(app)

def fake_current_user():
    return User(id=uuid.uuid4(), email="existing@example.com", firebase_uid="test-firebase-uid", is_expert=True)

app.dependency_overrides = getattr(app, 'dependency_overrides', {})
try:
    from auth import get_user_by_id_or_current
    app.dependency_overrides[get_user_by_id_or_current] = fake_current_user
except ImportError:
    pass

@pytest.mark.asyncio
async def test_get_user_preferences_success(monkeypatch):
    user_id = str(uuid.uuid4())
    # Mock get_user_preferences to return a list of fake preferences
    async def fake_get_user_preferences(db, user_uuid):
        return [
            {"key": "theme", "value": "dark"},
            {"key": "notifications", "value": "enabled"}
        ]
    import crud
    monkeypatch.setattr(crud, "get_user_preferences", fake_get_user_preferences)
    response = client.get(f"/users/{user_id}/preferences")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert data[0]["key"] == "theme"
    assert data[0]["value"] == "dark"

@pytest.mark.asyncio
async def test_get_user_preferences_invalid_id():
    response = client.get("/users/invalid-uuid/preferences")
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid user ID format"
