# Auth Service

Auth service for the Hire-an-Expert platform based on Firebase Authentication.

## Setup

### Service Account Key

This service requires a Firebase service account key to function. For security reasons, we do not include the actual key in the repository.

Follow these steps to set up your service account key:

1. Go to your [Firebase console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Project Settings > Service accounts
4. Click "Generate new private key"
5. Download the JSON file
6. Rename it to `serviceAccountKey.json`
7. Place it in the `services/auth-service/` directory

A template file `serviceAccountKey.example.json` is provided to show the required format.

### Environment Variables

Alternatively, you can provide the service account credentials as environment variables:

```
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_CERT_URL=your-client-cert-url
```

## Running the service

With Docker:

```
docker-compose up --build
```

Without Docker:

```
pip install -r requirements.txt
python main.py
```

## API Documentation

For integration details with the User Service, see [README_INTEGRATION.md](./README_INTEGRATION.md).
