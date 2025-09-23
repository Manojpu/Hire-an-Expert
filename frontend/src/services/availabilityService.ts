import { AvailabilityRule, DateOverride } from "@/types/availability";

// User service API endpoint for availability rules
const USER_SERVICE_URL =
  import.meta.env.VITE_USER_SERVICE_URL || "http://localhost:8001";

export interface AvailabilityData {
  availabilityRules: AvailabilityRule[];
  dateOverrides?: DateOverride[];
}

export async function submitAvailabilityRules(
  data: AvailabilityData,
  token: string
) {
  try {
    const response = await fetch(
      `${USER_SERVICE_URL}/users/me/availability-rules`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to submit availability rules: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error submitting availability rules:", error);
    throw error;
  }
}

export async function getAvailabilityRules(
  userId: string,
  token: string
): Promise<AvailabilityData> {
  try {
    const endpoint =
      userId === "me"
        ? `${USER_SERVICE_URL}/users/me/availability-rules`
        : `${USER_SERVICE_URL}/users/${userId}/availability-rules`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get availability rules: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting availability rules:", error);
    throw error;
  }
}
