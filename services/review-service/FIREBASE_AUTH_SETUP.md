# Firebase Authentication Setup for Review Service

## Overview

Your review service now supports Firebase authentication! Here's what's been implemented and how to set it up properly.

## What's Fixed ✅

1. **Authentication Module**: Created `app/core/auth.py` with Firebase integration
2. **User Model**: Simplified User class for token validation
3. **Dependencies**: Added `firebase-admin==6.4.0` to requirements.txt
4. **Error Handling**: Graceful fallback when Firebase is not configured
5. **Token Validation**: Proper Firebase ID token verification
6. **Docker Support**: Container rebuilt with Firebase admin SDK

## Current Authentication Flow

```mermaid
graph TB
    A[Client Request] --> B[Bearer Token]
    B --> C[Firebase Token Verification]
    C --> D{Valid Token?}
    D -->|Yes| E[Extract User Data]
    D -->|No| F[Return 401 Unauthorized]
    E --> G[Create User Object]
    G --> H[Proceed to Endpoint]
```

## Firebase Setup Options

### Option 1: Full Firebase Setup (Recommended for Production)

1. **Create Firebase Project**:

   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create new project or use existing
   - Enable Authentication

2. **Generate Service Account Key**:

   ```bash
   # Go to Firebase Console > Project Settings > Service Accounts
   # Click "Generate new private key"
   # Download the JSON file as 'serviceAccountKey.json'
   ```

3. **Place Service Account Key**:

   ```bash
   # Copy the downloaded JSON file to:
   /services/review-service/serviceAccountKey.json
   ```

4. **Rebuild Container**:
   ```bash
   docker stop review-service
   docker rm review-service
   docker build -t review-service .
   docker run -d --name review-service --network review-network -p 8005:8005 \
     -e DATABASE_URL=postgresql://review_user:review_pass_123@review-db:5432/review_service \
     -e INTERNAL_JWT_SECRET_KEY=docker-dev-secret-key \
     review-service
   ```

### Option 2: Development Mode (Current Setup)

The service currently runs in **development mode** without Firebase:

- ⚠️ **Warning**: Uses mock authentication for testing
- 🔧 **Dev User**: `dev-user-123` with email `dev@example.com`
- 🚫 **Not for Production**: Only for local development/testing

## API Authentication

### With Firebase Token

```bash
# Get Firebase ID token from your client app
curl -X POST "http://localhost:8005/api/reviews/" \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": "12345",
    "rating": 5,
    "comment": "Great service!"
  }'
```

### Development Mode (No Firebase)

```bash
# Any token works in development mode
curl -X POST "http://localhost:8005/api/reviews/" \
  -H "Authorization: Bearer dev-token-123" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": "12345",
    "rating": 5,
    "comment": "Great service!"
  }'
```

## Integration with Frontend

### JavaScript/React Example

```javascript
import { auth } from "./firebase-config";
import { getIdToken } from "firebase/auth";

async function createReview(reviewData) {
  try {
    // Get Firebase ID token
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    const token = await getIdToken(user);

    // Call review service
    const response = await fetch("http://localhost:8005/api/reviews/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reviewData),
    });

    if (!response.ok) throw new Error("Failed to create review");
    return await response.json();
  } catch (error) {
    console.error("Review creation failed:", error);
    throw error;
  }
}
```

## Testing Authentication

### 1. Health Check (No Auth Required)

```bash
curl http://localhost:8005/health
# Expected: {"status":"healthy","service":"review-service"}
```

### 2. Protected Endpoint (Auth Required)

```bash
curl -X GET "http://localhost:8005/api/reviews/buyer/my-reviews" \
  -H "Authorization: Bearer any-token-in-dev-mode"
```

### 3. API Documentation

```bash
# Open in browser
http://localhost:8005/docs
```

## Authentication Endpoints

| Endpoint                            | Auth Required | Description        |
| ----------------------------------- | ------------- | ------------------ |
| `GET /health`                       | ❌ No         | Health check       |
| `GET /docs`                         | ❌ No         | API documentation  |
| `POST /api/reviews/`                | ✅ Yes        | Create review      |
| `PUT /api/reviews/{id}`             | ✅ Yes        | Update review      |
| `DELETE /api/reviews/{id}`          | ✅ Yes        | Delete review      |
| `GET /api/reviews/buyer/my-reviews` | ✅ Yes        | Get user's reviews |
| `POST /api/reviews/{id}/helpful`    | ✅ Yes        | Mark as helpful    |
| `GET /api/reviews/gig/{id}/reviews` | ❌ No         | Public gig reviews |

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://review_user:review_pass_123@review-db:5432/review_service

# Authentication
INTERNAL_JWT_SECRET_KEY=your-secret-key

# Service URLs
BOOKING_SERVICE_URL=http://booking-service:8003
GIG_SERVICE_URL=http://gig-service:8004
USER_SERVICE_URL=http://user-service:8006
```

## Troubleshooting

### Firebase Token Issues

```bash
# Check container logs
docker logs review-service

# Common errors:
# 1. "serviceAccountKey.json not found" - Add Firebase service account
# 2. "Invalid token" - Check Firebase ID token format
# 3. "Firebase not initialized" - Running in dev mode (expected)
```

### Authentication Errors

- **401 Unauthorized**: Invalid or missing token
- **403 Forbidden**: Valid token but insufficient permissions
- **404 Not Found**: User not found (with real Firebase)

### Development Mode Indicators

```bash
# Look for these log messages:
# "⚠️ serviceAccountKey.json not found - Firebase authentication disabled"
# "⚠️ Firebase not initialized - using mock user"
```

## Production Deployment Checklist

- [ ] Firebase project created and configured
- [ ] Service account key (`serviceAccountKey.json`) added
- [ ] Environment variables set properly
- [ ] Container rebuilt with Firebase support
- [ ] Authentication tested with real Firebase tokens
- [ ] Remove development mode warnings from logs

## Security Notes

🔒 **Service Account Key**: Keep `serviceAccountKey.json` secure and never commit to version control

🚫 **Development Mode**: Only use mock authentication for local development

🔄 **Token Expiration**: Firebase ID tokens expire after 1 hour - implement token refresh

🌐 **CORS**: Configure proper CORS settings for production frontend domains

Your review service now has Firebase authentication! The service gracefully handles both production (with Firebase) and development (mock auth) modes. 🚀
