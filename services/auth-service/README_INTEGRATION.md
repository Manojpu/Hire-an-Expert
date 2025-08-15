# Auth Service - User Service Integration

This document describes the integration between the Auth Service (Firebase) and User Service.

## Overview

The Auth Service now automatically integrates with the User Service to:
1. **Create users** in the User Service when they sign up through Firebase
2. **Retrieve user data** from the User Service when they log in

## Integration Flow

### Signup Flow
1. User submits signup request to Auth Service
2. Auth Service creates user in Firebase
3. Auth Service automatically creates user in User Service
4. Response includes both Firebase UID and User Service data

### Login Flow
1. User submits login request to Auth Service
2. Auth Service authenticates with Firebase
3. Auth Service retrieves user data from User Service
4. Response includes Firebase token and User Service data

## Configuration

### Environment Variables
- `USER_SERVICE_URL`: URL of the User Service (default: `http://localhost:8001`)

### Service Dependencies
- `httpx`: For HTTP communication with User Service

## API Endpoints

### POST /signup
Creates a new user in both Firebase and User Service.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"  // Optional
}
```

**Response:**
```json
{
  "message": "User created successfully for user {firebase_uid}",
  "user": {
    "id": "uuid",
    "firebase_uid": "firebase_uid",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "client",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### POST /login
Authenticates user and retrieves user data.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "firebase_jwt_token",
  "user": {
    "id": "uuid",
    "firebase_uid": "firebase_uid",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "client",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

## Error Handling

### User Service Unavailable
- If User Service is down, Auth Service will still create/authenticate users in Firebase
- Response will include a message indicating User Service integration failed
- Firebase authentication remains functional

### User Already Exists
- If user already exists in User Service, the existing user data is returned
- No duplicate user creation occurs

## Testing

Run the integration test:
```bash
cd services/auth-service
python test_integration.py
```

## Setup Instructions

1. **Install dependencies:**
   ```bash
   cd services/auth-service
   pipenv install
   ```

2. **Set environment variables:**
   ```bash
   export USER_SERVICE_URL=http://localhost:8001
   ```

3. **Start services:**
   ```bash
   # Start User Service first
   cd ../user-service-v2
   python main.py
   
   # Start Auth Service
   cd ../auth-service
   python main.py
   ```

## Troubleshooting

### Common Issues

1. **User Service Connection Failed**
   - Check if User Service is running on the correct port
   - Verify `USER_SERVICE_URL` environment variable
   - Check network connectivity between services

2. **Firebase Configuration**
   - Ensure `serviceAccountKey.json` is present and valid
   - Verify Firebase project configuration

3. **Database Issues**
   - Ensure User Service database is running and accessible
   - Check database migrations are applied

### Logs
- Auth Service logs include User Service communication details
- Check console output for integration status messages 