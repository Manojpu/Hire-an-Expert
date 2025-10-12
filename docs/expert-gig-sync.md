# Expert/Gig Data Synchronization Summary

## Overview

This document outlines how expert application data flows between the frontend components and the Gig Service backend, ensuring consistency across all parts of the system.

## Data Flow Architecture

```
ApplyExpert.tsx → Gig Service → Category.tsx / Expert.tsx / ExpertDashboard
     ↓                ↓              ↓
ExpertApplicationForm → GigCreate → GigPublicResponse/GigDetailResponse
```

## Frontend Components Synced

### 1. **ApplyExpert.tsx** - Expert Application Form

- **Purpose**: Collects expert application data in 5 steps
- **Data Structure**: `ExpertApplicationForm`
- **Integration**: Converts form data and submits to Gig Service

### 2. **Category.tsx** - Expert Listing Page

- **Purpose**: Displays expert gig cards with filtering
- **Data Source**: `GET /api/gig-service/public` → `GigPublicResponse[]`
- **Fields Displayed**:
  - Name, title, bio preview
  - Category, hourly rate, rating
  - Profile image, response time
  - Total consultations

### 3. **Expert.tsx** - Individual Expert Profile

- **Purpose**: Detailed expert profile page
- **Data Source**: `GET /api/gig-service/expert/{expert_id}` → `GigDetailResponse`
- **Additional Fields**:
  - Service description, education, experience
  - Availability preferences, verification status

### 4. **ExpertDashboard** - Expert Management

- **Purpose**: Expert manages their own profile/gig
- **Data Source**: `GET /api/gig-service/my/gig` → `GigPrivateResponse`
- **Capabilities**: Update profile, view metrics, manage status

## Backend Gig Service Structure

### Database Model (`Gig`)

```python
class Gig(Base):
    # Identity
    id: str (UUID)
    expert_id: str (Firebase UID)
    user_id: str

    # Basic Profile (ApplyExpert Step 0)
    name: str
    title: str (Professional headline)
    bio: str
    profile_image_url: str
    banner_image_url: str
    languages: List[str]

    # Services (ApplyExpert Step 1)
    category: ExpertCategory
    service_description: str
    hourly_rate: float
    currency: str (default: 'LKR')
    availability_preferences: str
    response_time: str

    # Qualifications (ApplyExpert Step 2)
    education: str
    experience: str
    certifications: List[str] (file URLs)

    # Verification (ApplyExpert Step 3)
    government_id_url: str
    professional_license_url: str
    references: str
    background_check_consent: bool

    # System Fields
    status: GigStatus (draft/pending/approved/active)
    is_verified: bool
    rating: float
    total_reviews: int
    total_consultations: int
    created_at: datetime
    updated_at: datetime
    approved_at: datetime
```

### API Endpoints

#### Public Endpoints (for Category.tsx, Expert.tsx)

- `GET /public` - List gigs with filtering
- `GET /{gig_id}` - Get gig details
- `GET /expert/{expert_id}` - Get gig by expert Firebase UID

#### Expert Endpoints (for ExpertDashboard)

- `POST /` - Create new gig (from ApplyExpert)
- `GET /my/gig` - Get expert's own gig
- `PUT /my/gig` - Update expert's own gig
- `DELETE /my/gig` - Delete expert's gig

#### Admin Endpoints

- `GET /admin/pending` - Get pending approvals
- `PATCH /admin/{gig_id}/status` - Approve/reject gigs
- `PATCH /{gig_id}/metrics` - Update rating/consultation count

## Data Synchronization Points

### 1. **ApplyExpert Form Submission**

```typescript
// Convert form data
const gigData = convertFormToGigData(form, profileImageUrl, bannerImageUrl);

// Submit to Gig Service
const createdGig = await gigServiceAPI.create(gigData);

// Sync to frontend components
const expertData = convertApplicationToExpert(form, expertId);
syncExpertData(expertData);
```

### 2. **Category Page Loading**

```typescript
// Fetch filtered gigs
const response = await gigServiceAPI.getPublic({
  category: selectedCategory,
  min_rate: minPrice,
  max_rate: maxPrice,
  min_rating: minRating,
  search_query: searchTerm,
});

// Display in grid format
response.gigs.map((gig) => <GigCard {...gig} />);
```

### 3. **Expert Profile Loading**

```typescript
// Fetch expert details
const expert = await gigServiceAPI.getByExpert(expertId);

// Display detailed profile
<ExpertProfile {...expert} />;
```

### 4. **Expert Dashboard Loading**

```typescript
// Fetch expert's own gig
const myGig = await fetch("/api/gig-service/my/gig");

// Display in dashboard
<ProfileManagement data={myGig} />;
```

## Key Mappings

### ApplyExpert Form → Gig Service

| Form Field          | Gig Field                  | Step | Type         |
| ------------------- | -------------------------- | ---- | ------------ |
| `name`              | `name`                     | 0    | string       |
| `title`             | `title`                    | 0    | string       |
| `bio`               | `bio`                      | 0    | string       |
| `photo`             | `profile_image_url`        | 0    | file → URL   |
| `cover`             | `banner_image_url`         | 0    | file → URL   |
| `languages`         | `languages`                | 0    | csv → array  |
| `categories`        | `category`                 | 1    | enum         |
| `serviceDesc`       | `service_description`      | 1    | string       |
| `rate`              | `hourly_rate`              | 1    | number       |
| `availabilityNotes` | `availability_preferences` | 1    | string       |
| `education`         | `education`                | 2    | string       |
| `experience`        | `experience`               | 2    | string       |
| `certs`             | `certifications`           | 2    | files → URLs |
| `govId`             | `government_id_url`        | 3    | file → URL   |
| `license`           | `professional_license_url` | 3    | file → URL   |
| `references`        | `references`               | 3    | string       |
| `bgConsent`         | `background_check_consent` | 3    | boolean      |

### Gig Service → Frontend Components

| Frontend       | Gig Field                                 | Usage                |
| -------------- | ----------------------------------------- | -------------------- |
| Category cards | `name`, `title`, `hourly_rate`, `rating`  | Basic display        |
| Expert profile | `bio`, `service_description`, `education` | Detailed view        |
| Dashboard      | All fields                                | Management interface |

## Status Flow

1. **Draft** - Form being filled
2. **Pending** - Submitted, awaiting admin approval
3. **Active** - Admin approved and live, visible to clients
4. **Inactive** - Temporarily disabled
5. **Rejected** - Admin rejected with feedback

*Note: When an admin approves a gig, it automatically transitions from PENDING to ACTIVE, making it immediately visible to clients.*

## Integration Benefits

✅ **Consistent Data**: Same structure across all components
✅ **Real-time Sync**: Changes propagate immediately  
✅ **Type Safety**: TypeScript interfaces ensure data integrity
✅ **Scalable**: Easy to add new fields or endpoints
✅ **Maintainable**: Clear separation of concerns
