"""
Unit tests for Firebase authentication integration in the booking service.
"""
import pytest
from unittest.mock import MagicMock, patch
import uuid
from app.core.firebase_auth import get_current_user_id
from fastapi import HTTPException, Request

class TestGetCurrentUserId:
    def test_get_user_id_from_valid_token(self):
        """Test extracting user ID from a valid Firebase token."""
        # Arrange
        mock_request = MagicMock()
        mock_token = "valid-token"
        mock_user_id = str(uuid.uuid4())
        
        # Mock the request header
        mock_request.headers = {"Authorization": f"Bearer {mock_token}"}
        
        # Mock Firebase verification
        mock_auth = MagicMock()
        mock_auth.verify_id_token.return_value = {"uid": mock_user_id}
        
        # Act
        with patch('app.core.firebase_auth.auth', mock_auth):
            user_id = get_current_user_id(mock_request)
        
        # Assert
        assert user_id == mock_user_id
        mock_auth.verify_id_token.assert_called_once_with(mock_token)
    
    def test_get_user_id_missing_token(self):
        """Test handling missing authorization header."""
        # Arrange
        mock_request = MagicMock()
        mock_request.headers = {}  # No Authorization header
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            get_current_user_id(mock_request)
        
        assert exc_info.value.status_code == 401
        assert "Missing authorization header" in str(exc_info.value.detail)
    
    def test_get_user_id_invalid_token_format(self):
        """Test handling invalid token format."""
        # Arrange
        mock_request = MagicMock()
        mock_request.headers = {"Authorization": "InvalidFormat"}  # Not Bearer format
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            get_current_user_id(mock_request)
        
        assert exc_info.value.status_code == 401
        assert "Invalid authorization header format" in str(exc_info.value.detail)
    
    def test_get_user_id_firebase_verification_error(self):
        """Test handling Firebase token verification error."""
        # Arrange
        mock_request = MagicMock()
        mock_token = "invalid-token"
        
        # Mock the request header
        mock_request.headers = {"Authorization": f"Bearer {mock_token}"}
        
        # Mock Firebase verification error
        mock_auth = MagicMock()
        mock_auth.verify_id_token.side_effect = Exception("Invalid token")
        
        # Act & Assert
        with patch('app.core.firebase_auth.auth', mock_auth):
            with pytest.raises(HTTPException) as exc_info:
                get_current_user_id(mock_request)
        
        assert exc_info.value.status_code == 401
        assert "Invalid or expired token" in str(exc_info.value.detail)
        mock_auth.verify_id_token.assert_called_once_with(mock_token)