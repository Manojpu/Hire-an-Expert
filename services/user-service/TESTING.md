# User Service Testing Guide

This guide explains how to test the User Profile Service without needing real Firebase authentication.

## Testing Mode

The service includes a testing mode that bypasses authentication requirements for development and testing purposes. When enabled:

1. No real JWT token verification is performed
2. A test user is automatically provided for authenticated endpoints
3. Additional test endpoints are available at `/api/test/*`

## How to Enable Testing Mode

### Option 1: Environment Variable

Set the `TESTING_MODE` environment variable to `True` in your `.env` file:

```
TESTING_MODE=True
```

### Option 2: Request Header

Add the `X-Testing-Mode: True` header to your requests when testing specific endpoints.

## Available Test Endpoints

When testing mode is enabled, these additional endpoints are available:

- `GET /api/test/token` - Get a test JWT token for authentication
- `GET /api/test/user` - View information about the test user

## Example Usage

### 1. Starting the Service in Test Mode

```bash
# Make sure TESTING_MODE=True is in your .env file
docker-compose up
```

### 2. Testing Endpoints without Authentication

When in testing mode, you can call authenticated endpoints without providing a token:

```bash
# Get the current user's profile
curl http://localhost:8001/api/profiles/me
```

### 3. Using a Test Token (Optional)

If you want to test with a token anyway:

```bash
# Get a test token
TEST_TOKEN=$(curl -s http://localhost:8001/api/test/token | jq -r '.access_token')

# Use the token in subsequent requests
curl -H "Authorization: Bearer $TEST_TOKEN" http://localhost:8001/api/profiles/me
```

### 4. Complete Testing Flow

```bash
# Create a new profile
curl -X POST http://localhost:8001/api/profiles/ \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-user-123",
    "display_name": "Test User",
    "bio": "A test user for development",
    "is_expert": true
  }'

# Get the profile
curl http://localhost:8001/api/profiles/me

# Update the profile
curl -X PUT http://localhost:8001/api/profiles/me \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "Updated test bio"
  }'

# Delete the profile
curl -X DELETE http://localhost:8001/api/profiles/test-user-123
```

## Security Warning

**IMPORTANT**: Testing mode should NEVER be enabled in production environments. It bypasses all authentication security and allows anyone to access protected endpoints.

To disable testing mode:

1. Set `TESTING_MODE=False` in your `.env` file or remove it entirely
2. Restart the service
