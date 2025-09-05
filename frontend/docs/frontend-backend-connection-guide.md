# Connecting Frontend to Backend Microservices

This guide explains the step-by-step process of connecting the React frontend to the backend microservices, using the Gig Service as an example.

## Architecture Overview

```
Frontend (React/TypeScript) <-> API Gateway <-> Microservices (Gig Service, Auth Service, etc.)
```

The connection flow is:

1. Frontend sends HTTP requests to the API Gateway
2. API Gateway routes requests to the appropriate microservice
3. Microservice processes the request and returns data
4. API Gateway forwards the response back to the frontend

## Prerequisites

1. Backend microservices running (Gig Service, etc.)
2. API Gateway service running
3. Frontend development environment set up

## Step 1: Create API Client

The API client is responsible for handling HTTP requests to the backend. It includes:

- Base URL configuration
- Authentication header handling
- Error handling

```tsx
// src/lib/apiClient.ts
import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_GATEWAY_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add authentication headers to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
```

## Step 2: Define TypeScript Interfaces

Create TypeScript interfaces that match the backend data models:

```tsx
// src/types/index.ts
export interface Gig {
  id: string;
  title: string;
  description: string;
  price: number;
  expert_id: number;
  created_at: string;
}

export interface GigCreate {
  title: string;
  description: string;
  price: number;
}

export interface GigUpdate {
  title?: string;
  description?: string;
  price?: number;
}
```

## Step 3: Create a Service Layer

The service layer contains methods that interact with the API:

```tsx
// src/services/gigService.ts
import apiClient from "../lib/apiClient";
import { Gig, GigCreate, GigUpdate } from "../types";

const GIGS_ENDPOINT = "/gigs";

export const gigService = {
  async getAllGigs(skip = 0, limit = 100): Promise<Gig[]> {
    const response = await apiClient.get(
      `${GIGS_ENDPOINT}?skip=${skip}&limit=${limit}`
    );
    return response.data;
  },

  async getGigById(id: string): Promise<Gig> {
    const response = await apiClient.get(`${GIGS_ENDPOINT}/${id}`);
    return response.data;
  },

  // More methods...
};
```

## Step 4: Create React Hooks

Create custom React hooks that use the service layer and manage state:

```tsx
// src/hooks/useGigs.ts
import { useState } from "react";
import { gigService } from "../services/gigService";
import { Gig, GigCreate, GigUpdate } from "../types";

export function useGigs() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadGigs = async () => {
    setLoading(true);
    try {
      const data = await gigService.getAllGigs();
      setGigs(data);
      setError(null);
    } catch (err) {
      setError("Failed to load gigs");
    } finally {
      setLoading(false);
    }
  };

  // More methods...

  return {
    gigs,
    loading,
    error,
    loadGigs,
    // Other methods...
  };
}
```

## Step 5: Create UI Components

Create React components that use the hooks to display and manage data:

```tsx
// src/components/GigsList.tsx
import { useEffect } from "react";
import { useGigs } from "../hooks/useGigs";

export function GigsList() {
  const { gigs, loading, error, loadGigs } = useGigs();

  useEffect(() => {
    loadGigs();
  }, []);

  // Render UI based on state...
}
```

## Step 6: Add Routes

Add routes to your application to navigate between pages:

```tsx
// src/routes/AppRoutes.tsx
import { Routes, Route } from "react-router-dom";
import GigsPage from "../pages/GigsPage";
import GigDetails from "../pages/GigDetails";

const AppRoutes = () => (
  <Routes>
    {/* Other routes */}
    <Route path="gigs" element={<GigsPage />} />
    <Route path="gigs/:id" element={<GigDetails />} />
  </Routes>
);
```

## Step 7: Set Environment Variables

Configure environment variables for different environments:

```
# .env.development
VITE_API_GATEWAY_URL=http://localhost:8000

# .env.production
VITE_API_GATEWAY_URL=https://api.hire-an-expert.com
```

## Troubleshooting

Common issues and solutions:

1. **CORS errors**: Ensure the API Gateway has CORS configured correctly
2. **Authentication errors**: Verify the token is stored and sent correctly
3. **Type errors**: Make sure TypeScript interfaces match the actual API response

## Next Steps

After connecting the Gig Service, you can follow the same pattern to connect other microservices:

1. Define TypeScript interfaces
2. Create service layer methods
3. Create React hooks
4. Build UI components

## Testing the Connection

To test if the connection works correctly:

1. Start the API Gateway and Gig Service
2. Run the frontend application
3. Navigate to the gigs page
4. Check the browser console for any errors
5. Verify data is displayed correctly
