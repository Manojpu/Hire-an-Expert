# User Profile Service

A microservice for managing user profiles in the Hire-an-Expert platform.

## Features

- Create user profiles linked to Firebase authentication
- Retrieve user profiles
- Update user profile information
- Authentication via JWT tokens from the auth service

## Tech Stack

- **FastAPI**: Modern, fast web framework for API development
- **PostgreSQL**: Database for storing profile data
- **SQLAlchemy**: SQL toolkit and ORM
- **Docker & Docker Compose**: For containerization and easy deployment
- **JWT**: For secure authentication

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Python 3.10+ (for local development)

### Running with Docker

1. Clone the repository
2. Navigate to the user-service directory
3. Run the service using Docker Compose:

```bash
docker-compose up
```

The service will be available at http://localhost:8001

### Running Locally for Development

1. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run PostgreSQL database (either locally or via Docker):

```bash
docker-compose up -d postgres
```

4. Set up your environment variables (see .env.example)

5. Run the FastAPI application:

```bash
uvicorn app.main:app --reload
```

## API Endpoints

- `GET /`: Health check endpoint
- `POST /api/profiles/`: Create a new user profile
- `GET /api/profiles/me`: Get the current user's profile
- `PUT /api/profiles/me`: Update the current user's profile
- `GET /api/profiles/{profile_id}`: Get a specific user's profile

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET_KEY`: Secret key for JWT validation
- `ALGORITHM`: JWT algorithm (default: HS256)
- `DEBUG`: Enable debug mode (True/False)

## Project Structure

```
user-service/
├── app/
│   ├── api/
│   │   └── endpoints/
│   │       └── profile.py
│   ├── core/
│   │   └── auth.py
│   ├── crud/
│   │   └── profile.py
│   ├── db/
│   │   └── database.py
│   ├── models/
│   │   └── profile.py
│   ├── schemas/
│   │   └── profile.py
│   └── main.py
├── .env
├── docker-compose.yaml
├── Dockerfile
└── requirements.txt
```
