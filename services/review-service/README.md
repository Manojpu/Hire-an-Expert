# Review Service API

A comprehensive review system for the Hire-an-Expert platform that allows users to create, manage, and interact with reviews for gigs and sellers.

## Features

### Core Features

- ✅ Create reviews for completed bookings
- ✅ Rate gigs with 1-5 star rating system
- ✅ Add optional text comments
- ✅ Update and delete own reviews (soft delete)
- ✅ Paginated review listings
- ✅ Review statistics and analytics

### Advanced Features

- ✅ Mark reviews as helpful/unhelpful
- ✅ Verified review system
- ✅ Multiple sorting options (date, rating, helpfulness)
- ✅ Filter by verified reviews only
- ✅ Seller and buyer review history
- ✅ Comprehensive review statistics

### Security Features

- ✅ JWT-based authentication
- ✅ User authorization (can only review own bookings)
- ✅ Prevent duplicate reviews per booking
- ✅ Prevent self-helpful voting
- ✅ Booking verification via booking service

## API Endpoints

### Review Management

#### Create Review

```http
POST /api/reviews/
Content-Type: application/json
Authorization: Bearer <token>

{
  "gig_id": "gig_123",
  "booking_id": "booking_456",
  "rating": 5,
  "comment": "Excellent work!"
}
```

#### Get Review by ID

```http
GET /api/reviews/{review_id}
```

#### Update Review

```http
PUT /api/reviews/{review_id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "rating": 4,
  "comment": "Updated review"
}
```

#### Delete Review

```http
DELETE /api/reviews/{review_id}
Authorization: Bearer <token>
```

### Review Listings

#### Get Gig Reviews (Paginated)

```http
GET /api/reviews/gig/{gig_id}/reviews?page=1&size=10&verified_only=false&sort_by=created_at
```

#### Get Seller Reviews

```http
GET /api/reviews/seller/{seller_id}/reviews?page=1&size=10
```

#### Get My Reviews

```http
GET /api/reviews/buyer/my-reviews?page=1&size=10
Authorization: Bearer <token>
```

### Statistics

#### Get Gig Review Statistics

```http
GET /api/reviews/gig/{gig_id}/stats
```

Response:

```json
{
  "total_reviews": 25,
  "average_rating": 4.3,
  "rating_distribution": {
    "1": 1,
    "2": 2,
    "3": 3,
    "4": 8,
    "5": 11
  },
  "verified_reviews_count": 15
}
```

#### Get Seller Review Statistics

```http
GET /api/reviews/seller/{seller_id}/stats
```

### Helpful Votes

#### Mark Review as Helpful

```http
POST /api/reviews/{review_id}/helpful
Authorization: Bearer <token>
```

#### Remove Helpful Mark

```http
DELETE /api/reviews/{review_id}/helpful
Authorization: Bearer <token>
```

### Admin Functions

#### Verify Review

```http
POST /api/reviews/{review_id}/verify
Authorization: Bearer <admin_token>
```

## Database Schema

### Reviews Table

```sql
CREATE TABLE reviews (
    id VARCHAR PRIMARY KEY,
    gig_id VARCHAR NOT NULL,
    booking_id VARCHAR UNIQUE NOT NULL,
    buyer_id VARCHAR NOT NULL,
    seller_id VARCHAR NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0 CHECK (helpful_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Review Helpful Table

```sql
CREATE TABLE review_helpful (
    id VARCHAR PRIMARY KEY,
    review_id VARCHAR REFERENCES reviews(id),
    user_id VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(review_id, user_id)
);
```

## Query Parameters

### Pagination

- `page`: Page number (default: 1, minimum: 1)
- `size`: Items per page (default: 10, minimum: 1, maximum: 50)

### Filtering

- `verified_only`: Show only verified reviews (boolean, default: false)

### Sorting

- `sort_by`: Sort order options:
  - `created_at`: By creation date (newest first) - default
  - `rating_desc`: By rating (highest first)
  - `rating_asc`: By rating (lowest first)
  - `helpful`: By helpfulness count (most helpful first)

## Business Rules

1. **One Review Per Booking**: Each booking can only have one review
2. **Completed Bookings Only**: Reviews can only be created for completed bookings
3. **Owner Authorization**: Users can only review their own bookings
4. **Update Permissions**: Users can only update/delete their own reviews
5. **Helpful Voting**: Users cannot mark their own reviews as helpful
6. **Soft Delete**: Reviews are soft-deleted (marked as inactive) for data integrity
7. **Rating Range**: Ratings must be between 1-5 inclusive

## Error Handling

The API returns appropriate HTTP status codes:

- `200 OK`: Successful GET requests
- `201 Created`: Successful POST requests
- `204 No Content`: Successful DELETE requests
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate review)
- `503 Service Unavailable`: External service unavailable

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/review_service

# JWT Authentication
INTERNAL_JWT_SECRET_KEY=your-secret-key
ALGORITHM=HS256

# External Services
BOOKING_SERVICE_URL=http://booking-service:8003
GIG_SERVICE_URL=http://gig-service:8004

# CORS
CORS_ORIGINS=["*"]
```

## Development Setup

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Run database migrations:

```bash
# Tables are automatically created on startup
```

4. Start the service:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8005 --reload
```

## Docker Setup

```bash
# Build image
docker build -t review-service .

# Run container
docker run -p 8005:8005 --env-file .env review-service
```

## Testing

The service includes comprehensive validation and error handling. Test the endpoints using:

1. FastAPI automatic docs: `http://localhost:8005/docs`
2. ReDoc documentation: `http://localhost:8005/redoc`
3. Health check: `http://localhost:8005/health`

## Integration with Other Services

### Booking Service Integration

- Validates booking existence and status
- Ensures booking is completed before allowing reviews
- Retrieves seller_id from booking data

### Future Integrations

- **Gig Service**: Validate gig existence
- **User Service**: Validate user profiles
- **Notification Service**: Send notifications for new reviews

## Performance Considerations

- Database indexes on frequently queried fields (gig_id, buyer_id, seller_id)
- Pagination to handle large datasets
- Soft deletes to maintain data integrity
- Efficient aggregation queries for statistics

## Security Considerations

- JWT token validation for all authenticated endpoints
- Input validation and sanitization
- Rate limiting (TODO: implement)
- SQL injection prevention via SQLAlchemy ORM
- CORS configuration for web client access
