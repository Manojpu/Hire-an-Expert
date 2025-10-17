# Gig Analytics System - Complete Implementation Guide

## Overview

This document explains the comprehensive analytics system for expert gig performance tracking across the platform.

## Architecture

### Database Layer

#### 1. Booking Service Database (`booking_db` schema)

**Table: `bookings`**

```sql
- id: Integer (PK)
- user_id: Integer (FK to users)
- gig_id: String (FK to gigs)
- status: Enum (PENDING, CONFIRMED, COMPLETED, CANCELLED)
- scheduled_time: DateTime
- duration: Integer (minutes)
- service: String
- type: String
- notes: Text
- created_at: DateTime
```

#### 2. Gig Service Database (`gig_db` schema)

**Table: `gigs`**

```sql
- id: String (UUID, PK)
- expert_id: String (Firebase UID)
- category_id: UUID (FK to categories)
- service_description: Text
- hourly_rate: Float
- currency: String
- response_time: String
- status: Enum (PENDING, ACTIVE, HOLD, REJECTED)
- created_at: DateTime
- updated_at: DateTime
```

#### 3. Review Service Database (`review_db` schema)

**Table: `reviews`**

```sql
- id: String (UUID, PK)
- gig_id: String (FK to gigs)
- booking_id: String (FK to bookings)
- buyer_id: String (FK to users)
- seller_id: String (FK to users)
- rating: Integer (1-5)
- comment: Text
- is_active: Boolean
- helpful_count: Integer
- created_at: DateTime
```

### Backend Services

#### 1. Booking Service Analytics Endpoint

**File:** `services/booking-service/app/endpoints/analytics.py`

**Endpoint:** `GET /bookings/analytics/gig/{gig_id}`
**Parameters:**

- `gig_id` (path): The gig UUID
- `period` (query): 'day', 'week', 'month', or 'year' (default: 'month')

**Response:**

```json
{
  "revenue": {
    "today": 7500,
    "week": 25000,
    "month": 85000,
    "year": 250000,
    "growth": {
      "daily": 15.2,
      "weekly": 8.5,
      "monthly": 12.3
    }
  },
  "bookings": {
    "total": 45,
    "thisMonth": 12,
    "completed": 38,
    "cancelled": 3,
    "pending": 2,
    "confirmed": 2,
    "completionRate": 92.7
  },
  "chartData": [
    { "date": "2025-10-01", "revenue": 5000 },
    { "date": "2025-10-02", "revenue": 7500 },
    ...
  ],
  "hourlyRate": 5000,
  "currency": "LKR"
}
```

**Calculations:**

- **Revenue**: `SUM(duration_minutes / 60 * hourly_rate)` for COMPLETED bookings
- **Growth**: `((current_period - previous_period) / previous_period) * 100`
- **Completion Rate**: `(completed_bookings / (completed + cancelled)) * 100`
- **Chart Data**: Daily aggregation of revenue grouped by `DATE(created_at)`

#### 2. Gig Service Performance Endpoint

**File:** `services/gig-service/app/endpoints/analytics.py`

**Endpoint:** `GET /gigs/{gig_id}/performance`

**Response:**

```json
{
  "gigId": "dbb43947-e69f-4667-b5da-5f523c84a17b",
  "rating": 4.8,
  "totalReviews": 23,
  "responseTime": "< 2 hours",
  "repeatCustomers": 15,
  "avgSessionDuration": "45 min"
}
```

**Data Sources:**

- **rating & totalReviews**: Fetched from Review Service API
- **responseTime**: From `gigs` table
- **repeatCustomers**: Future enhancement (requires booking analysis)
- **avgSessionDuration**: Future enhancement (calculated from booking durations)

#### 3. Review Service Stats Endpoint

**Endpoint:** `GET /reviews/gig/{gig_id}/stats`

**Response:**

```json
{
  "average_rating": 4.8,
  "total_reviews": 23,
  "rating_distribution": {
    "5": 15,
    "4": 6,
    "3": 2,
    "2": 0,
    "1": 0
  }
}
```

### Frontend Layer

#### 1. Analytics Service

**File:** `frontend/src/services/gigAnalyticsService.ts`

**Function:** `fetchGigAnalytics(gigId: string, period: string)`

**Flow:**

1. Get Firebase authentication token
2. Fetch booking analytics from Booking Service
3. Fetch performance metrics from Gig Service
4. Combine data into unified analytics object
5. Return fallback values if services are unavailable

#### 2. GigAnalytics Component

**File:** `frontend/src/components/dashboard/GigAnalytics.tsx`

**Features:**

- Revenue cards (Today, Week, Month) with growth indicators
- Revenue trend chart (using EarningsChart component)
- Booking performance metrics
- Performance metrics (rating, reviews, response time)
- Insights and recommendations

**State Management:**

```typescript
- analytics: GigAnalyticsData | null
- loading: boolean
- error: string | null
```

## Data Flow

```
User clicks "Analytics" tab
  ↓
GigAnalytics component mounts
  ↓
useEffect calls gigAnalyticsService.fetchGigAnalytics(gigId)
  ↓
Service fetches auth token from Firebase
  ↓
Parallel API calls:
  ├─→ Booking Service (/bookings/analytics/gig/{id})
  │     ↓
  │   Queries booking_db for:
  │     - Revenue calculations
  │     - Booking statistics
  │     - Chart data (daily revenue)
  │
  └─→ Gig Service (/gigs/{id}/performance)
        ↓
      Calls Review Service (/reviews/gig/{id}/stats)
        ↓
      Returns performance metrics
  ↓
Combine data and render UI
```

## Environment Variables

### Booking Service

```env
USER_SERVICE_URL=http://host.docker.internal:8001
DATABASE_URL=postgresql://...
CORS_ORIGINS=http://localhost:3000
```

### Gig Service

```env
REVIEW_SERVICE_URL=http://localhost:8004
DATABASE_URL=postgresql://...
```

### Frontend

```env
VITE_BOOKING_SERVICE_URL=http://localhost:8003
VITE_GIG_SERVICE_URL=http://localhost:8002
```

## Docker Setup

### Hot Reload Configuration

All services use:

```yaml
volumes:
  - .:/app
environment:
  - WATCHFILES_FORCE_POLLING=true
command: python main.py # with uvicorn --reload
```

### Network Communication

Services communicate via:

- `host.docker.internal` for services on host machine
- Container names for Docker network communication

## Testing the Analytics

### 1. Create Test Bookings

```bash
POST http://localhost:8003/bookings
{
  "gig_id": "your-gig-id",
  "user_id": 1,
  "scheduled_time": "2025-10-20T10:00:00Z",
  "duration": 60,
  "status": "COMPLETED"
}
```

### 2. Test Analytics Endpoint

```bash
curl -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  http://localhost:8003/bookings/analytics/gig/YOUR_GIG_ID?period=month
```

### 3. Test Performance Endpoint

```bash
curl -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  http://localhost:8002/gigs/YOUR_GIG_ID/performance
```

### 4. View in Frontend

Navigate to: `http://localhost:3000/expert/gig/YOUR_GIG_ID/analytics`

## Future Enhancements

1. **Real Repeat Customer Tracking**

   - Analyze booking history to identify repeat customers
   - Track customer retention rates

2. **Average Session Duration**

   - Calculate from actual booking durations
   - Track trends over time

3. **Revenue Forecasting**

   - Predict future revenue based on trends
   - Show projected earnings

4. **Comparison with Platform Averages**

   - Compare gig performance with similar categories
   - Benchmark metrics

5. **Export Analytics**

   - PDF/Excel export functionality
   - Email reports

6. **Advanced Filters**
   - Date range selection
   - Status filtering
   - Category comparison

## Troubleshooting

### Issue: 401 Unauthorized

**Solution:** Check USER_SERVICE_URL environment variable in booking service

### Issue: Empty Analytics Data

**Solution:** Create test bookings with COMPLETED status

### Issue: Performance Service Unavailable

**Solution:** Verify gig-service and review-service are running

### Issue: CORS Errors

**Solution:** Verify CORS_ORIGINS includes http://localhost:3000

## API Authentication

All analytics endpoints require Firebase authentication:

```typescript
headers: {
  'Authorization': `Bearer ${firebase_id_token}`,
  'Content-Type': 'application/json'
}
```

## Deployment Checklist

- [ ] All services have analytics endpoints registered
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] CORS configured for production domains
- [ ] Service-to-service auth implemented
- [ ] Error handling and fallbacks tested
- [ ] Rate limiting configured
- [ ] Monitoring and logging set up

## Summary

The analytics system provides comprehensive insights by:

1. **Aggregating data** from booking, gig, and review services
2. **Calculating metrics** like revenue, growth, and completion rates
3. **Visualizing trends** with charts and statistics
4. **Providing recommendations** based on performance data

All data is fetched in real-time from the respective microservices, ensuring accuracy and consistency across the platform.
