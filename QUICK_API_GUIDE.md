# Quick API Implementation Guide

## API Endpoints to Implement

### Gig Service (Port 8002) - Via API Gateway

#### 1. Get Pending Gigs
```
GET /admin/gigs/pending
Response: Array of gig objects with status 'PENDING'
```

#### 2. Get Gig Details
```
GET /admin/gigs/{gigId}
Response: Single gig object
```

#### 3. Get Gig Certificates
```
GET /admin/gigs/{gigId}/certificates
Response: Array of certificate objects for the gig
```

#### 4. Get Category Details
```
GET /admin/categories/{categoryId}
Response: Category object with id and name
```

#### 5. Approve Gig
```
POST /admin/gigs/{gigId}/approve
Body: { verified_documents: ["cert1", "cert2"] }
Action: Update gig status to 'APPROVED'
```

#### 6. Reject Gig
```
POST /admin/gigs/{gigId}/reject
Body: { reason: "Documents not verified" }
Action: Update gig status to 'REJECTED'
```

### User Service (Port 8006) - Via API Gateway

#### 1. Get User Details
```
GET /admin/users/{userId}
Response: User object with name, email, role
```

#### 2. Get User Verification Documents
```
GET /admin/users/{userId}/verification-documents
Response: Array of verification documents for users applying to become experts
```

#### 3. Promote User to Expert
```
POST /admin/users/{userId}/promote-to-expert
Action: Update user role from 'user' to 'expert'
```

## Sample Data Structures

### Gig Object
```json
{
  "id": "uuid",
  "expert_id": "uuid",
  "category_id": 1,
  "service_description": "Text",
  "hourly_rate": 5000,
  "currency": "LKR",
  "availability_preferences": "Text",
  "response_time": "2 hours",
  "experience_years": 5,
  "status": "PENDING",
  "created_at": "2024-01-01T00:00:00Z",
  "thumbnail_url": "optional"
}
```

### Certificate Object
```json
{
  "id": "uuid",
  "gig_id": "uuid",
  "url": "https://example.com/cert.pdf",
  "thumbnail_url": "optional",
  "uploaded_at": "2024-01-01T00:00:00Z"
}
```

### User Object
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user", // or "expert"
  "profile_image_url": "optional"
}
```

### Verification Document Object
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "document_type": "ID_CARD",
  "document_url": "https://example.com/id.jpg",
  "uploaded_at": "2024-01-01T00:00:00Z"
}
```

### Category Object
```json
{
  "id": 1,
  "name": "Web Development",
  "description": "optional"
}
```

## Quick Testing Steps

1. Create some test gigs with status 'PENDING'
2. Create test certificates linked to those gigs
3. Create test users with role 'user' (for promotion testing)
4. Create test categories
5. Test the admin verification flow

## Database Queries Examples

### Get Pending Gigs
```sql
SELECT * FROM gigs WHERE status = 'PENDING';
```

### Get Gig Certificates
```sql
SELECT * FROM certificates WHERE gig_id = ?;
```

### Promote User to Expert
```sql
UPDATE users SET role = 'expert' WHERE id = ?;
```

### Approve Gig
```sql
UPDATE gigs SET status = 'APPROVED' WHERE id = ?;
```