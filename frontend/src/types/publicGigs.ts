// GigStatus enum matching the Python enum
import {Category} from "@/types/category.ts";

export enum GigStatus {
    DRAFT = "draft",
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
    ACTIVE = "active",
    INACTIVE = "inactive"
}

// Gig interface matching the Python Gig model
export interface Gig {
    id: string;
    expert_id: string;
    category: Category;
    service_description: string | null;
    hourly_rate: number;
    currency: string;
    availability_preferences: string | null;
    expertise_areas: string[];
    experience_years: number | null;
    work_experience: string | null;
    status: GigStatus;
    response_time: string;
    created_at: string;
    updated_at: string | null;
    approved_at: string | null;
}

// GigListResponse interface matching the Python GigListResponse model
export interface GigListResponse {
    gigs: Gig[];
    total: number;
    page: number;
    size: number;
    pages: number;
}

// GigFilters interface matching the Python GigFilters model
export interface GigFilters {
    category_id?: string;
    min_rate?: number;
    max_rate?: number;
    min_experience_years?: number;
    search_query?: string;
    page?: number;
    size?: number;
    sort?: string;
}


