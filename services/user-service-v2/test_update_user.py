
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
async def test_update_user_success(monkeypatch):
    user_id = str(uuid.uuid4())
    user_data = {
        "email": f"user{user_id[:8]}@example.com",
        "full_name": "Updated Name"
    }
    # Mock update_user to return a fake user
    async def fake_update_user(db, user_uuid, user_data_in):
        class FakeUser:
            id = user_uuid
            email = user_data_in["email"]
            full_name = user_data_in["full_name"]
        return FakeUser()
    # Mock get_user_by_email to return None (no conflict)
    async def fake_get_user_by_email(db, email):
        return None
    import crud
    monkeypatch.setattr(crud, "update_user", fake_update_user)
    monkeypatch.setattr(crud, "get_user_by_email", fake_get_user_by_email)
    response = client.put(f"/users/{user_id}", json=user_data)
    assert response.status_code in (200, 201)
    data = response.json()
    assert data["email"] == user_data["email"]
    assert data["full_name"] == user_data["full_name"]

def test_update_user_invalid_id():
    user_data = {"email": "test@example.com", "full_name": "Name"}
    response = client.put("/users/invalid-uuid", json=user_data)
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid user ID format"

@pytest.mark.asyncio
async def test_update_user_conflict(monkeypatch):
    user_id = str(uuid.uuid4())
    user_data = {"email": "conflict@example.com", "full_name": "Name"}
    # Mock get_user_by_email to return a user with a different id (conflict)
    async def fake_get_user_by_email(db, email):
        class FakeUser:
            id = uuid.uuid4()
        return FakeUser()
    # Mock update_user to not be called
    async def fake_update_user(db, user_uuid, user_data_in):
        assert False, "update_user should not be called on conflict"
    import crud
    monkeypatch.setattr(crud, "get_user_by_email", fake_get_user_by_email)
    monkeypatch.setattr(crud, "update_user", fake_update_user)
    response = client.put(f"/users/{user_id}", json=user_data)
    assert response.status_code == 409
    assert response.json()["detail"] == "User with this email already exists"
