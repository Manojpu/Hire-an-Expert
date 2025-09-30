import io
import uuid
import pytest
from fastapi.testclient import TestClient

from main import app
from models import User

client = TestClient(app)

# Patch: override authentication dependency to always return a fake user
def fake_current_user():
    return User(id=uuid.uuid4(), email="test@example.com", firebase_uid="test-firebase-uid", is_expert=True)

app.dependency_overrides = getattr(app, 'dependency_overrides', {})
try:
    from auth import get_user_by_id_or_current
    app.dependency_overrides[get_user_by_id_or_current] = fake_current_user
except ImportError:
    pass
def get_auth_headers():
    # You may need to mock authentication or provide a valid token if required
    return {}

def test_upload_verification_document(monkeypatch):
    # Mock current_user dependency if needed
    # You may need to adjust this depending on your auth setup
    
    # Prepare a fake file
    file_content = b"dummy file content"
    file = io.BytesIO(file_content)
    file.name = "testfile.pdf"

    # Use a valid DocumentType value from your enum, e.g. 'PASSPORT' or similar
    document_type = "PASSPORT"

    response = client.post(
        "/users/documents",
        files={
            "file": (file.name, file, "application/pdf"),
            "document_type": (None, document_type)
        },
        headers=get_auth_headers()
    )
    assert response.status_code in (200, 201)
    data = response.json()
    assert "id" in data
    assert data["document_url"].endswith(".pdf")
    assert data["document_type"] == document_type
