# User Service - Hire an Expert Platform

A comprehensive user management service for the "Hire an Expert" platform, built with FastAPI and SQLAlchemy.

## Features

### 🔐 Authentication & Authorization
- User registration (client/expert)
- JWT-based authentication
- Role-based access control (client, expert, admin)
- Password hashing with bcrypt

### 👤 User Management
- Complete user profile management
- Profile picture support
- User verification system
- Admin user management

### 🎯 Expert Profiles
- Comprehensive expert profile creation
- Skills and categories management
- Experience and education tracking
- Rating and review system
- Availability management
- Location-based services

### 🛠️ Expert Services
- Service creation and management
- Pricing configuration
- Service duration settings
- Active/inactive service status

### 👥 Client Profiles
- Client preference management
- Booking history tracking
- Spending analytics

### 🔍 Search & Discovery
- Advanced expert search with filters
- Category and skill-based filtering
- Rating and price filtering
- Location-based search
- Pagination support

### 📊 Categories & Skills
- Predefined service categories
- Dynamic skill management
- Category-specific skills

## Database Schema

### Core Tables
- **users**: Base user information
- **expert_profiles**: Expert-specific data
- **client_profiles**: Client-specific data
- **expert_services**: Services offered by experts

### Relationships
- One-to-one: User ↔ ExpertProfile
- One-to-one: User ↔ ClientProfile
- One-to-many: ExpertProfile ↔ ExpertService

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - Register as client
- `POST /auth/register/expert` - Register as expert

### User Management
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update user profile
- `GET /users/{user_id}` - Get user by ID (admin)

### Expert Profiles
- `POST /experts/profile` - Create expert profile
- `GET /experts/profile/me` - Get my expert profile
- `PUT /experts/profile/me` - Update expert profile
- `GET /experts/{expert_id}` - Get expert profile (public)
- `GET /experts` - Search experts (public)

### Expert Services
- `POST /experts/services` - Create service
- `GET /experts/services/me` - Get my services
- `PUT /experts/services/{service_id}` - Update service
- `DELETE /experts/services/{service_id}` - Delete service

### Client Profiles
- `POST /clients/profile` - Create client profile
- `GET /clients/profile/me` - Get my client profile
- `PUT /clients/profile/me` - Update client profile

### Categories & Skills
- `GET /categories` - Get all categories
- `GET /skills/{category}` - Get skills by category

### Health Check
- `GET /health` - Service health check

## Setup Instructions

### 1. Environment Setup
```bash
# Navigate to user service directory
cd services/user-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Database Configuration
Create a `.env` file in the user-service directory:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/hire_expert_db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 3. Database Setup
```bash
# Run database migrations (if using Alembic)
alembic upgrade head

# Or create tables directly
python -c "from database import engine; from models import Base; Base.metadata.create_all(bind=engine)"
```

### 4. Run the Service
```bash
# Development mode
uvicorn main:app --reload --host 0.0.0.0 --port 8001

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8001
```

## API Documentation

Once the service is running, you can access:
- **Interactive API Docs**: http://localhost:8001/docs
- **ReDoc Documentation**: http://localhost:8001/redoc

## Example Usage

### Register as Expert
```bash
curl -X POST "http://localhost:8001/auth/register/expert" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "expert@example.com",
    "password": "securepassword123",
    "first_name": "John",
    "last_name": "Doe",
    "phone_number": "+1234567890"
  }'
```

### Create Expert Profile
```bash
curl -X POST "http://localhost:8001/experts/profile" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "headline": "Professional Car Mechanic",
    "bio": "10+ years of experience in automotive repair",
    "categories": ["vehicles"],
    "skills": ["car_repair", "engine_diagnosis"],
    "hourly_rate": 50.0,
    "experience_years": 10,
    "location": "New York, NY"
  }'
```

### Search Experts
```bash
curl -X GET "http://localhost:8001/experts?categories=vehicles&min_rating=4.0&max_hourly_rate=100&limit=10"
```

## Integration with Other Services

This user service is designed to work with:
- **Auth Service**: Firebase authentication integration
- **Messaging Service**: Real-time communication
- **Booking Service**: Session scheduling and management
- **Payment Service**: Transaction processing

## Development Guidelines

### Code Structure
- `models.py`: SQLAlchemy database models
- `schemas.py`: Pydantic request/response models
- `crud.py`: Database operations
- `dependencies.py`: FastAPI dependencies and utilities
- `database.py`: Database connection and session management
- `main.py`: FastAPI application and endpoints

### Adding New Features
1. Define models in `models.py`
2. Create schemas in `schemas.py`
3. Implement CRUD operations in `crud.py`
4. Add endpoints in `main.py`
5. Update documentation

### Testing
```bash
# Run tests (when implemented)
pytest

# Run with coverage
pytest --cov=.
```

## Deployment

### Docker
```bash
# Build image
docker build -t user-service .

# Run container
docker run -p 8001:8001 user-service
```

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT secret key
- `ALGORITHM`: JWT algorithm (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time

## Monitoring & Health Checks

The service includes:
- Health check endpoint (`/health`)
- Structured logging
- Error handling and validation
- Database connection monitoring

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Input validation with Pydantic
- SQL injection prevention with SQLAlchemy
- CORS configuration (configurable)

## Performance Considerations

- Database connection pooling
- Efficient query optimization
- Pagination for large datasets
- Indexed database fields
- Caching ready (Redis integration possible)

## Future Enhancements

- [ ] Email verification system
- [ ] Profile picture upload service
- [ ] Advanced search with Elasticsearch
- [ ] Real-time notifications
- [ ] Analytics and reporting
- [ ] Multi-language support
- [ ] Mobile app API optimization 