import { useAuth } from "@/context/auth/AuthContext";
import { AvailabilityRule, DateOverride } from "@/types/availability";

// TODO: Replace with your actual user service URL
const USER_SERVICE_URL =
  import.meta.env.VITE_USER_SERVICE_URL || "http://localhost:8001";

interface CreateAvailabilitySchedules {
  availabilityRules: AvailabilityRule[];
  dateOverrides?: DateOverride[];
}

/**
 * Service functions for interacting with the user service API
 */
export const userServiceAPI = {
  /**
   * Set availability rules for the current user
   * @param rules - Availability rules to set
   * @param token - User authentication token
   * @returns Promise with the saved availability rules
   */
  async setAvailabilityRules(
    availabilityRules: AvailabilityRule[],
    dateOverrides: DateOverride[] = [],
    token: string
  ): Promise<AvailabilityRule[]> {
    const response = await fetch(
      `${USER_SERVICE_URL}/users/me/availability-rules`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          availabilityRules,
          dateOverrides,
        } as CreateAvailabilitySchedules),
      }
    );

    if (!response.ok) {
      let errorText = await response.text();
      console.error(
        "Failed to set availability rules:",
        response.status,
        errorText
      );

      // Try to parse the error as JSON
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.detail) {
          errorText = errorJson.detail;
        }
      } catch (e) {
        // If it's not valid JSON, use the text as is
      }

      throw new Error(errorText);
    }

    return response.json();
  },

  /**
   * Upload a verification document to the user service
   * @param file - The file to upload
   * @param documentType - Type of document being uploaded
   * @param token - User authentication token
   * @returns Promise with the uploaded document details
   */
  async uploadVerificationDocument(
    file: File,
    documentType: string,
    token: string
  ) {
    const formData = new FormData();
    formData.append("file", file);

    // Map to backend enum
    let backendDocType = "OTHER";
    if (documentType === "government_id") backendDocType = "ID_PROOF";
    if (documentType === "professional_license")
      backendDocType = "PROFESSIONAL_LICENSE";
    formData.append("document_type", backendDocType);

    const response = await fetch(`${USER_SERVICE_URL}/users/documents`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Document upload failed:", response.status, errorText);
      throw new Error(`Failed to upload document: ${errorText}`);
    }
    return response.json();
  },
};
