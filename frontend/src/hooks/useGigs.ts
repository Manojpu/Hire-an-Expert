import { useState, useEffect } from "react";
import { gigService } from "../services/gigService";
import { Gig, GigCreate, GigUpdate } from "../types";

/**
 * Custom React hook for working with gigs
 */
export function useGigs() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentGig, setCurrentGig] = useState<Gig | null>(null);

  // Load all gigs
  const loadGigs = async (skip = 0, limit = 100) => {
    setLoading(true);
    setError(null);
    try {
      const data = await gigService.getAllGigs(skip, limit);
      setGigs(data);
    } catch (err) {
      setError("Failed to load gigs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load a single gig by ID
  const loadGig = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await gigService.getGigById(id);
      setCurrentGig(data);
    } catch (err) {
      setError(`Failed to load gig with id ${id}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Create a new gig
  const createGig = async (gigData: GigCreate) => {
    setLoading(true);
    setError(null);
    try {
      const newGig = await gigService.createGig(gigData);
      setGigs((prev) => [...prev, newGig]);
      return newGig;
    } catch (err) {
      setError("Failed to create gig");
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing gig
  const updateGig = async (id: string, gigData: GigUpdate) => {
    setLoading(true);
    setError(null);
    try {
      const updatedGig = await gigService.updateGig(id, gigData);
      setGigs((prev) => prev.map((gig) => (gig.id === id ? updatedGig : gig)));
      if (currentGig && currentGig.id === id) {
        setCurrentGig(updatedGig);
      }
      return updatedGig;
    } catch (err) {
      setError(`Failed to update gig with id ${id}`);
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete a gig
  const deleteGig = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await gigService.deleteGig(id);
      setGigs((prev) => prev.filter((gig) => gig.id !== id));
      if (currentGig && currentGig.id === id) {
        setCurrentGig(null);
      }
    } catch (err) {
      setError(`Failed to delete gig with id ${id}`);
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    gigs,
    loading,
    error,
    currentGig,
    loadGigs,
    loadGig,
    createGig,
    updateGig,
    deleteGig,
  };
}
