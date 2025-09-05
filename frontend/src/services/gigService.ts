import apiClient from "../lib/apiClient";
import { Gig, GigCreate, GigUpdate } from "../types";

const GIGS_ENDPOINT = "/gigs";

/**
 * Service class for interacting with the Gig microservice API
 */
export const gigService = {
  /**
   * Get all gigs with optional pagination
   */
  async getAllGigs(skip = 0, limit = 100): Promise<Gig[]> {
    try {
      const response = await apiClient.get(
        `${GIGS_ENDPOINT}?skip=${skip}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching gigs:", error);
      throw error;
    }
  },

  /**
   * Get a specific gig by ID
   */
  async getGigById(id: string): Promise<Gig> {
    try {
      const response = await apiClient.get(`${GIGS_ENDPOINT}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching gig with id ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new gig
   * Requires authentication as an expert
   */
  async createGig(gigData: GigCreate): Promise<Gig> {
    try {
      const response = await apiClient.post(GIGS_ENDPOINT, gigData);
      return response.data;
    } catch (error) {
      console.error("Error creating gig:", error);
      throw error;
    }
  },

  /**
   * Update an existing gig
   * Requires authentication as the owner expert
   */
  async updateGig(id: string, gigData: GigUpdate): Promise<Gig> {
    try {
      const response = await apiClient.put(`${GIGS_ENDPOINT}/${id}`, gigData);
      return response.data;
    } catch (error) {
      console.error(`Error updating gig with id ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a gig
   * Requires authentication as the owner expert
   */
  async deleteGig(id: string): Promise<void> {
    try {
      await apiClient.delete(`${GIGS_ENDPOINT}/${id}`);
    } catch (error) {
      console.error(`Error deleting gig with id ${id}:`, error);
      throw error;
    }
  },
};
