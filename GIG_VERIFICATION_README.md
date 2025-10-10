# Gig Verification System Implementation

## Overview
A comprehensive admin panel feature for verifying expert gig applications with document verification, role management, and status tracking.

## Features Implemented

### 1. **Gig Verification Table**
- Displays pending gigs with expert name, category, hourly rate, and status
- Real-time data fetching from gig and user services
- Search functionality by expert name or category
- Professional UI with loading states and error handling

### 2. **Comprehensive Verification Modal**
- Detailed gig information display
- Expert profile information with role status
- Document viewer with verification controls
- Support for both existing experts and user-to-expert applications
- Professional approval/rejection workflow

### 3. **Document Management**
- View documents in new tab
- Download functionality
- Individual document verification tracking
- Visual indicators for verified/unverified status
- Support for different document types

### 4. **Role-Based Verification**
- **Existing Experts**: Verify only gig-specific certificates
- **User Applications**: Verify identity documents + gig certificates
- Automatic role promotion from user to expert upon approval

## Files Created/Modified

### New Files
1. `src/types/gigVerification.ts` - TypeScript interfaces
2. `src/services/adminGigService.ts` - API service layer
3. `src/components/admin/GigVerificationModal.tsx` - Verification modal component

### Modified Files
1. `src/pages/admin/AdminRequests.tsx` - Updated with gig verification table

## Required API Endpoints

### API Gateway Routes (Port 8000)
All requests go through the API Gateway which routes to:
- Gig Service: Port 8002
- User Service: Port 8006

### Gig Service Endpoints (via API Gateway)
```
GET    /api/gigs/admin/pending                    - Get all pending gigs
GET    /api/gigs/admin/{gigId}                    - Get specific gig details
GET    /api/gigs/admin/{gigId}/certificates       - Get gig certificates
GET    /api/gigs/admin/categories/{categoryId}    - Get category details
POST   /api/gigs/admin/{gigId}/approve           - Approve gig
POST   /api/gigs/admin/{gigId}/reject            - Reject gig
```

### User Service Endpoints (via API Gateway)
```
GET    /api/user-v2/admin/users/{userId}                          - Get user details
GET    /api/user-v2/admin/users/{userId}/verification-documents  - Get user verification documents
POST   /api/user-v2/admin/users/{userId}/promote-to-expert      - Promote user to expert role
```

## Database Schema Requirements

### Gig Service Database
```sql
-- Gig table
CREATE TABLE gigs (
    id UUID PRIMARY KEY,
    expert_id UUID NOT NULL,
    category_id INTEGER NOT NULL,
    service_description TEXT,
    hourly_rate DECIMAL,
    currency VARCHAR(10),
    availability_preferences TEXT,
    response_time VARCHAR(50),
    experience_years INTEGER,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    created_at TIMESTAMP DEFAULT NOW(),
    thumbnail_url TEXT
);

-- Certificate table (updated schema)
CREATE TABLE certificates (
    id UUID PRIMARY KEY,
    gig_id UUID NOT NULL REFERENCES gigs(id),
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Category table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);
```

### User Service Database
```sql
-- Users table (existing)
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    role VARCHAR(20) DEFAULT 'user', -- user, expert, admin
    profile_image_url TEXT
);

-- Verification documents table
CREATE TABLE verification_documents (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- ID_CARD, PASSPORT, etc.
    document_url TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT NOW()
);
```

## Environment Variables
Add to your `.env` file (for Vite):
```
VITE_API_GATEWAY_URL=http://localhost:8000
```

Note: Vite uses `VITE_` prefix for environment variables accessible in the browser.
The frontend communicates with services through the API Gateway:
- API Gateway: localhost:8000
- Gig Service: localhost:8002 (via `/api/gigs` path)
- User Service: localhost:8006 (via `/api/user-v2` path)

## API Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description"
}
```

## Verification Workflow

### For Existing Experts
1. Verify gig-specific certificates
2. Mark documents as verified
3. Approve/reject gig
4. Update gig status in database

### For User → Expert Applications
1. Verify identity documents (first priority)
2. Verify gig-specific certificates
3. Mark all documents as verified
4. Approve: Promote user to expert + approve gig
5. Reject: Reject application

## Security Considerations

1. **API Gateway**: All requests go through the API Gateway for centralized routing
2. **Document Access**: Implement secure document URL generation
3. **No Authentication**: Simplified implementation without admin token validation (as requested)
4. **Audit Logging**: Log all verification actions (recommended for production)

## Usage Instructions

1. **View Verification Queue**: Navigate to Admin → Requests
2. **Review Gig**: Click "Review Details" arrow button
3. **Verify Documents**: 
   - Click "View" to open document in new tab
   - Click "Mark as Verified" after reviewing
4. **Complete Verification**:
   - Verify ALL documents (required)
   - Click "Approve Gig" or "Reject"

## Future Enhancements

1. **Bulk Operations**: Approve/reject multiple gigs
2. **Document Annotations**: Add notes during verification
3. **Verification History**: Track verification decisions
4. **Email Notifications**: Notify experts of decisions
5. **Document Expiry**: Track certificate expiration dates

## Error Handling

The system includes comprehensive error handling:
- Network failures with retry options
- Invalid document URLs
- Missing user/gig data
- Permission errors
- Validation failures

## Testing

Before deployment, test:
1. API endpoints return correct data
2. Document viewing works properly
3. Role promotion functions correctly
4. Status updates persist in database
5. Error scenarios are handled gracefully

## Support

For implementation questions or issues:
1. Check API endpoint responses
2. Verify database schema matches requirements
3. Ensure environment variables are set correctly
4. Check browser console for JavaScript errors