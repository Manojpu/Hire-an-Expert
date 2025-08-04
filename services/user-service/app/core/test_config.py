"""
Configuration for testing mode.
When TESTING_MODE is True, authentication is bypassed for easier endpoint testing.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Default to False, can be enabled via .env file or environment variable
TESTING_MODE = os.getenv("TESTING_MODE", "False").lower() == "true"

# Test user data to use when TESTING_MODE is True
TEST_USER = {
    "sub": "test-user-123",  # Mock Firebase UID
    "email": "test@example.com",
    "roles": ["client"]
}

def is_testing_mode():
    """Check if the service is running in testing mode."""
    return TESTING_MODE
