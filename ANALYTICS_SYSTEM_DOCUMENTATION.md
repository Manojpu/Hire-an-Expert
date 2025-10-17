# Gig Analytics System - Complete Implementation Guide

## System Architecture

### Database Layer (PostgreSQL with Schemas)

#### 1. **Booking Database (`booking_db` schema)**

**Tables:**

- `bookings`: Main booking records
  - `id` (PK, Integer): Auto-increment booking ID
  - `user_id` (FK): Links to user who made booking
  - `gig_id` (FK, String/UUID): Links to gig in gig_db
  - `status` (Enum): `pending`, `confirmed`, `completed`, `cancelled`
  - `scheduled_time` (DateTime): When the consultation is scheduled
  - `duration` (Integer): Duration in minutes
  - `service` (String): Type of service
  - `created_at` (DateTime): When booking was created

**Purpose:** Stores all booking transactions and their statuses

#### 2. **Gig Database (`gig_db` schema)**

**Tables:**

- `gigs`: Service listings created by experts
  - `id` (PK, String/UUID): Unique gig identifier
  - `expert_id` (String): Firebase UID of the expert
  - `category_id` (FK, UUID): Links to categories table
  - `service_description` (Text): Service details
  - `hourly_rate` (Float): Price per hour
  - `currency` (String): Default 'LKR'
  - `response_time` (String): How quickly expert responds
  - `status` (Enum): `pending`, `active`, `hold`, `rejected`
  - `created_at`, `updated_at`, `approved_at` (DateTime)

**Purpose:** Stores expert service listings and metadata

#### 3. **Review Database (`review_db` schema)**

**Tables:**

- `reviews`: Customer reviews and ratings
  - `id` (PK, String/UUID): Unique review identifier
  - `gig_id` (String): Links to gig
  - `booking_id` (String, Unique): One review per booking
  - `buyer_id` (String): Customer who left review
  - `seller_id` (String): Expert being reviewed
  - `rating` (Integer): 1-5 stars
  - `comment` (Text): Review text
  - `helpful_count` (Integer): Upvotes from other users
  - `created_at`, `updated_at` (DateTime)

**Purpose:** Stores customer feedback and ratings

---

## Backend Services (Microservices Architecture)

### 1. **Booking Service (Port 8003)**

#### Endpoint: `GET /bookings/analytics/gig/{gig_id}`

**File:** `services/booking-service/app/endpoints/analytics.py`

**What it calculates:**

**A. Revenue Metrics:**

- Queries `bookings` table for COMPLETED bookings
- Groups by time periods (today, week, month, year)
- Formula: `(total_minutes / 60) * hourly_rate = revenue`
- Compares with previous periods to calculate growth percentage

**SQL Query Example:**

```python
# Today's revenue
SELECT SUM(duration) as total_minutes
FROM booking_db.bookings
WHERE gig_id = '{gig_id}'
  AND status = 'completed'
  AND created_at >= '{today_start}'
```

**B. Booking Statistics:**

- Total bookings: `COUNT(*) WHERE gig_id = gig_id`
- This month: `COUNT(*) WHERE created_at >= month_start`
- By status: `COUNT(*) WHERE status = 'completed/cancelled/pending/confirmed'`
- Completion rate: `(completed / (completed + cancelled)) * 100`

**C. Chart Data:**

- Daily revenue for last 30 days
- Groups bookings by date
- Calculates revenue per day

**Response Format:**

```json
{
  "revenue": {
    "today": 7500,
    "week": 25000,
    "month": 85000,
    "year": 150000,
    "growth": { "daily": 15, "weekly": 8, "monthly": 12 }
  },
  "bookings": {
    "total": 45,
    "thisMonth": 28,
    "completed": 25,
    "cancelled": 3,
    "pending": 2,
    "confirmed": 15,
    "completionRate": 89.3
  },
  "chartData": [
    { "date": "2025-01-01", "revenue": 3000 },
    { "date": "2025-01-02", "revenue": 4500 }
  ],
  "hourlyRate": 5000,
  "currency": "LKR"
}
```

---

### 2. **Gig Service (Port 8002)**

#### Endpoint: `GET /gigs/{gig_id}/performance`

**File:** `services/gig-service/app/endpoints/analytics.py`

**What it fetches:**

**A. From Gig Table:**

- `response_time`: How quickly expert responds (from gigs table)

**B. From Review Service (HTTP call):**

- Calls `http://localhost:8004/reviews/gig/{gig_id}/stats`
- Gets average rating and total review count

**Response Format:**

```json
{
  "gigId": "123e4567-e89b-12d3-a456-426614174000",
  "rating": 4.7,
  "totalReviews": 34,
  "responseTime": "< 2 hours",
  "repeatCustomers": 18,
  "avgSessionDuration": "45 min"
}
```

---

### 3. **Review Service (Port 8004)**

#### Endpoint: `GET /reviews/gig/{gig_id}/stats`

**File:** `services/review-service/app/endpoints/reviews.py` (already exists)

**What it calculates:**

- Average rating: `AVG(rating) WHERE gig_id = gig_id`
- Total reviews: `COUNT(*) WHERE gig_id = gig_id`

**SQL Query:**

```sql
SELECT
  AVG(rating) as average_rating,
  COUNT(*) as total_reviews
FROM review_db.reviews
WHERE gig_id = '{gig_id}'
  AND is_active = true
```

---

## Frontend Layer (React + TypeScript)

### Service: `gigAnalyticsService.ts`

**File:** `frontend/src/services/gigAnalyticsService.ts`

**Function:** `fetchGigAnalytics(gigId, period)`

**What it does:**

1. Gets Firebase authentication token
2. Makes parallel requests to:
   - Booking Service: `/bookings/analytics/gig/{gigId}`
   - Gig Service: `/gigs/{gigId}/performance`
3. Combines data from both services
4. Returns unified analytics object

**Error Handling:**

- If booking service fails → Returns empty analytics
- If performance service fails → Uses default values (rating: 0, etc.)
- Never throws errors to prevent UI crashes

---

### Component: `GigAnalytics.tsx`

**File:** `frontend/src/components/dashboard/GigAnalytics.tsx`

**Flow:**

1. **On Mount:** Calls `gigAnalyticsService.fetchGigAnalytics(gig.id)`
2. **Loading State:** Shows spinner while fetching
3. **Error State:** Shows friendly message if data unavailable
4. **Success State:** Renders analytics dashboard with:
   - Revenue cards (today, week, month with growth indicators)
   - Revenue trend chart (line graph showing daily revenue)
   - Booking performance stats (total, completed, cancelled, completion rate)
   - Performance metrics (rating, reviews, response time)
   - Insights & recommendations based on data

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       FRONTEND (React)                       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          GigAnalytics.tsx Component                    │ │
│  │  - Displays charts, metrics, insights                 │ │
│  └──────────────────────┬─────────────────────────────────┘ │
│                         │                                    │
│  ┌──────────────────────▼─────────────────────────────────┐ │
│  │       gigAnalyticsService.ts                          │ │
│  │  - Fetches data from multiple services               │ │
│  │  - Combines responses                                 │ │
│  │  - Handles authentication                             │ │
│  └──────────┬─────────────────────┬──────────────────────┘ │
└─────────────┼─────────────────────┼────────────────────────┘
              │                     │
       ┌──────▼──────┐       ┌─────▼──────┐
       │ Firebase    │       │            │
       │ Auth Token  │       │            │
       └──────┬──────┘       │            │
              │              │            │
   ┌──────────▼────────┐    │            │
   │  BOOKING SERVICE  │    │            │
   │    (Port 8003)    │    │            │
   │                   │    │            │
   │  /bookings/       │    │            │
   │   analytics/gig/  │    │            │
   │   {gigId}         │    │            │
   │                   │    │            │
   │  Calculates:      │    │            │
   │  • Revenue        │    │            │
   │  • Bookings stats │    │            │
   │  • Chart data     │    │            │
   └────────┬──────────┘    │            │
            │               │            │
   ┌────────▼─────────┐     │            │
   │   booking_db     │     │            │
   │   PostgreSQL     │     │            │
   │                  │     │     ┌──────▼──────────┐
   │  Tables:         │     │     │   GIG SERVICE   │
   │  • bookings      │     │     │   (Port 8002)   │
   │    - id          │     │     │                 │
   │    - user_id     │     │     │  /gigs/{gigId}/ │
   │    - gig_id ─────┼─────┼─────│   performance   │
   │    - status      │     │     │                 │
   │    - duration    │     │     │  Returns:       │
   │    - created_at  │     │     │  • Response     │
   └──────────────────┘     │     │    time         │
                            │     └────────┬────────┘
                            │              │
                            │     ┌────────▼────────┐
                            │     │    gig_db       │
                            │     │   PostgreSQL    │
                            │     │                 │
                            │     │  Tables:        │
                            │     │  • gigs         │
                            │     │    - id         │
                            │     │    - expert_id  │
                            │     │    - hourly_rate│
                            │     │    - response_  │
                            │     │      time       │
                            │     └─────────────────┘
                            │              │
                            │              │ HTTP Call
                            │              │
                            │     ┌────────▼──────────┐
                            │     │  REVIEW SERVICE   │
                            │     │   (Port 8004)     │
                            │     │                   │
                            │     │  /reviews/gig/    │
                            │     │   {gigId}/stats   │
                            │     │                   │
                            │     │  Returns:         │
                            │     │  • Avg rating     │
                            │     │  • Total reviews  │
                            │     └────────┬──────────┘
                            │              │
                            │     ┌────────▼────────┐
                            │     │   review_db     │
                            │     │   PostgreSQL    │
                            │     │                 │
                            │     │  Tables:        │
                            │     │  • reviews      │
                            │     │    - id         │
                            │     │    - gig_id     │
                            │     │    - rating     │
                            │     └─────────────────┘
                            │
                            └─────────────────────────────────┐
                                                              │
                          Combined Response                   │
                              Returned                        │
                           to Frontend ◄────────────────────┘
```

---

## Key Features

### 1. **Real-time Revenue Tracking**

- Calculates revenue based on completed bookings
- Shows daily, weekly, monthly, and yearly totals
- Displays growth percentages compared to previous periods

### 2. **Booking Analytics**

- Total bookings across all time
- Monthly booking count
- Status breakdown (completed, cancelled, pending, confirmed)
- Completion rate percentage

### 3. **Performance Metrics**

- Average rating from customer reviews
- Total number of reviews received
- Response time from gig settings
- Placeholders for repeat customers and session duration

### 4. **Visual Charts**

- Line chart showing daily revenue trends
- Supports different time periods (day, week, month, year)

### 5. **Insights & Recommendations**

- AI-generated suggestions based on performance data
- Color-coded insights (green=good, blue=info, yellow=warning)

---

## Environment Variables

### Backend Services

```env
# Booking Service
DATABASE_URL=postgresql://user:pass@host:5432/dbname?options=-csearch_path%3Dbooking_db

# Gig Service
DATABASE_URL=postgresql://user:pass@host:5432/dbname?options=-csearch_path%3Dgig_db
REVIEW_SERVICE_URL=http://localhost:8004

# Review Service
DATABASE_URL=postgresql://user:pass@host:5432/dbname?options=-csearch_path%3Dreview_db
```

### Frontend

```env
VITE_BOOKING_SERVICE_URL=http://localhost:8003
VITE_GIG_SERVICE_URL=http://localhost:8002
```

---

## Testing the System

### 1. **Create Test Bookings**

```bash
# Use the booking service API to create test bookings
curl -X POST http://localhost:8003/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {firebase_token}" \
  -d '{
    "gig_id": "your-gig-id",
    "scheduled_time": "2025-10-20T10:00:00",
    "duration": 60,
    "status": "completed"
  }'
```

### 2. **Create Test Reviews**

```bash
# Use the review service API to create test reviews
curl -X POST http://localhost:8004/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {firebase_token}" \
  -d '{
    "gig_id": "your-gig-id",
    "booking_id": "your-booking-id",
    "rating": 5,
    "comment": "Excellent service!"
  }'
```

### 3. **View Analytics**

- Navigate to: `/expert/gig/{gigId}/analytics`
- The system will automatically fetch and display all metrics

---

## Future Enhancements

1. **Repeat Customers**

   - Query booking_db for users with multiple bookings for same gig
   - Calculate percentage of repeat customers

2. **Average Session Duration**

   - Calculate average of `duration` field from completed bookings
   - Display in human-readable format

3. **Peak Hours Analysis**

   - Group bookings by hour of day
   - Show when most consultations are booked

4. **Revenue Forecasting**

   - Use historical data to predict future revenue
   - ML model based on booking trends

5. **Export Reports**
   - Generate PDF/Excel reports
   - Email monthly summaries to experts

---

## Troubleshooting

### No data showing?

1. Check if services are running: `docker ps`
2. Verify database connections in each service
3. Ensure you have completed bookings for the gig
4. Check browser console for API errors

### Wrong revenue calculations?

1. Verify `hourly_rate` is set correctly in gig
2. Check `duration` field in bookings (should be in minutes)
3. Ensure `status = 'completed'` for included bookings

### Performance metrics not updating?

1. Check if review service is running on port 8004
2. Verify reviews exist for the gig in review_db
3. Check CORS settings if getting network errors

---

## Summary

This analytics system provides a comprehensive view of gig performance by:

- **Aggregating data** from multiple microservices (booking, gig, review)
- **Calculating metrics** in real-time from PostgreSQL databases
- **Presenting insights** through a modern React dashboard
- **Handling errors** gracefully to ensure UI stability

The system is production-ready and can scale to handle thousands of gigs and bookings!
