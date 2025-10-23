/**
 * User Service API for connecting with user-service-v2
 * Handles expert profile data, verification documents, and availability
 */

// User Service URL
const API_GATEWAY_URL = (
  import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8000"
).replace(/\/$/, "");

const USER_SERVICE_URL = `${API_GATEWAY_URL}/api/user-v2`;

// TypeScript interfaces based on backend models
export interface ExpertData {
  id: string;
  firebase_uid: string;
  name: string;
  email: string;
  phone?: string;
  role: "client" | "expert" | "admin";
  bio?: string;
  profile_image_url?: string;
  location?: string;
  created_at: string;
  updated_at: string;
  is_expert: boolean;
  expert_id?: string;
  expert_profiles?: ExpertProfile[];
  verification_documents?: VerificationDocument[];
}

export interface ExpertProfile {
  id: string;
  user_id: string;
  specialization: string;
  description?: string;
  created_at: string;
  is_verified: boolean;
}

export interface VerificationDocument {
  id: string;
  user_id: string;
  document_type: "ID_PROOF" | "PROFESSIONAL_LICENSE" | "OTHER";
  document_url: string;
  uploaded_at: string;
}

export interface AvailabilityRule {
  id?: string;
  user_id?: string;
  day_of_week: number; // 0=Monday, 1=Tuesday, ..., 6=Sunday
  start_time_utc: string; // "HH:MM" format
  end_time_utc: string; // "HH:MM" format
}

export interface DateOverride {
  id?: string;
  user_id?: string;
  unavailable_date: string; // ISO date string
}

export interface UserPreference {
  id: string;
  user_id: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
  uploaded_at: string;
}

type AvailabilityRuleInput = Omit<AvailabilityRule, "user_id">;
type DateOverrideInput = Omit<DateOverride, "user_id">;

// Helper to get Firebase ID token
async function getIdToken(): Promise<string> {
  try {
    const { auth } = await import("@/firebase/firebase");
    const { getIdToken: firebaseGetIdToken } = await import("firebase/auth");

    if (auth.currentUser) {
      return await firebaseGetIdToken(auth.currentUser);
    }

    console.warn("No authenticated user found, using dev token");
    return "dev-mock-token";
  } catch (error) {
    console.error("Failed to get ID token:", error);
    return "dev-mock-token";
  }
}

export const userServiceAPI = {
  /**
   * Get current user profile with expert data
   */
  async getCurrentUserProfile(): Promise<ExpertData> {
    try {
      console.log("🔄 Fetching current user profile from user service...");

      const token = await getIdToken();
      const { auth } = await import("@/firebase/firebase");

      if (!auth.currentUser) {
        throw new Error("No authenticated user");
      }

      const firebaseUid = auth.currentUser.uid;
      console.log("🔍 Using Firebase UID:", firebaseUid);

      // Use Firebase UID endpoint since there's no /users/me endpoint
      const response = await fetch(
        `${USER_SERVICE_URL}/users/firebase/${firebaseUid}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "❌ Failed to fetch user profile:",
          response.status,
          errorText
        );
        throw new Error(`Failed to fetch user profile: ${response.status}`);
      }

      const userData = await response.json();
      console.log("✅ Successfully fetched user profile:", userData);
      return userData;
    } catch (error) {
      console.error("❌ Error fetching user profile:", error);
      throw error;
    }
  },

  /**
   * Get user by Firebase UID (for viewing other experts' profiles)
   */
  async getUserByFirebaseUid(firebaseUid: string): Promise<ExpertData> {
    try {
      console.log("🔄 Fetching user by Firebase UID:", firebaseUid);

      const response = await fetch(
        `${USER_SERVICE_URL}/users/firebase/${firebaseUid}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "❌ Failed to fetch user by Firebase UID:",
          response.status,
          errorText
        );
        throw new Error(`Failed to fetch user: ${response.status}`);
      }

      const userData = await response.json();
      console.log("✅ Successfully fetched user by Firebase UID:", userData);
      return userData;
    } catch (error) {
      console.error("❌ Error fetching user by Firebase UID:", error);
      throw error;
    }
  },

  /**
   * Get user by ID (for admin view)
   */
  async getUserById(userId: string): Promise<ExpertData> {
    try {
      console.log("🔄 Fetching user by ID from user service:", userId);

      const token = await getIdToken();
      const response = await fetch(`${USER_SERVICE_URL}/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "❌ Failed to fetch user by ID:",
          response.status,
          errorText
        );
        throw new Error(`Failed to fetch user: ${response.status}`);
      }

      const userData = await response.json();
      console.log("✅ Successfully fetched user by ID:", userData);
      return userData;
    } catch (error) {
      console.error("❌ Error fetching user by ID:", error);
      throw error;
    }
  },

  /**
   * Update user profile
   */
  async updateUserProfile(updates: Partial<ExpertData>): Promise<ExpertData> {
    try {
      console.log("🔄 Updating user profile:", updates);

      const token = await getIdToken();
      const response = await fetch(`${USER_SERVICE_URL}/users/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "❌ Failed to update user profile:",
          response.status,
          errorText
        );
        throw new Error(`Failed to update profile: ${response.status}`);
      }

      const updatedUser = await response.json();
      console.log("✅ Successfully updated user profile:", updatedUser);
      return updatedUser;
    } catch (error) {
      console.error("❌ Error updating user profile:", error);
      throw error;
    }
  },

  /**
   * Get verification documents for user
   */
  async getVerificationDocuments(): Promise<VerificationDocument[]> {
    try {
      console.log("🔄 Fetching verification documents...");

      const token = await getIdToken();
      const response = await fetch(
        `${USER_SERVICE_URL}/verification-documents`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error(
          "❌ Failed to fetch verification documents:",
          response.status
        );
        return []; // Return empty array if not found
      }

      const documents = await response.json();
      console.log("✅ Successfully fetched verification documents:", documents);
      return documents;
    } catch (error) {
      console.error("❌ Error fetching verification documents:", error);
      return [];
    }
  },

  /**
   * Get availability rules for user
   */
  async getAvailabilityRules(): Promise<AvailabilityRule[]> {
    try {
      console.log("🔄 Fetching availability rules...");

      const token = await getIdToken();
      const response = await fetch(
        `${USER_SERVICE_URL}/users/me/availability/rules`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error(
          "❌ Failed to fetch availability rules:",
          response.status
        );
        return [];
      }

      const rules = await response.json();
      console.log("✅ Successfully fetched availability rules:", rules);
      return rules;
    } catch (error) {
      console.error("❌ Error fetching availability rules:", error);
      return [];
    }
  },

  /**
   * Get date overrides (unavailable dates) for user
   */
  async getDateOverrides(): Promise<DateOverride[]> {
    try {
      console.log("🔄 Fetching date overrides...");

      const token = await getIdToken();
      const response = await fetch(
        `${USER_SERVICE_URL}/users/me/availability/overrides`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error("❌ Failed to fetch date overrides:", response.status);
        return [];
      }

      const overrides = await response.json();
      console.log("✅ Successfully fetched date overrides:", overrides);
      return overrides;
    } catch (error) {
      console.error("❌ Error fetching date overrides:", error);
      return [];
    }
  },

  /**
   * Set availability rules and date overrides for user
   */
  async setAvailabilityRules(
    availabilityRules: AvailabilityRuleInput[],
    dateOverrides: DateOverrideInput[] = [],
    token?: string
  ): Promise<AvailabilityRule[]> {
    try {
      console.log("🔄 Setting availability rules...", availabilityRules);
      console.log("🔄 Setting date overrides...", dateOverrides);

      const idToken = token ?? (await getIdToken());
      const response = await fetch(
        `${USER_SERVICE_URL}/users/me/availability-rules`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            availabilityRules,
            dateOverrides,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error(
          "❌ Failed to set availability rules:",
          response.status,
          errorData
        );
        throw new Error(
          `Failed to set availability rules: ${response.status} ${errorData}`
        );
      }

      const savedRules = await response.json();
      console.log("✅ Successfully set availability rules:", savedRules);
      return savedRules;
    } catch (error) {
      console.error("❌ Error setting availability rules:", error);
      throw error;
    }
  },

  /**
   * Get user preferences
   */
  async getUserPreferences(): Promise<UserPreference[]> {
    try {
      console.log("🔄 Fetching user preferences...");

      const token = await getIdToken();
      const response = await fetch(`${USER_SERVICE_URL}/users/me/preferences`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("❌ Failed to fetch user preferences:", response.status);
        return [];
      }

      const preferences = await response.json();
      console.log("✅ Successfully fetched user preferences:", preferences);
      return preferences;
    } catch (error) {
      console.error("❌ Error fetching user preferences:", error);
      return [];
    }
  },
};
