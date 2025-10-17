import {
  GigForVerification,
  Certificate,
  VerificationDocument,
  Category,
  ExpertUser,
  GigVerificationDetails,
  GigVerificationTableRow,
  VerificationAction,
  ApiResponse
} from '@/types/gigVerification';

// API Configuration - Updated for your actual setup (v2.0)
const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8000';
const GIG_SERVICE_PATH = '/api/gigs';
const USER_SERVICE_PATH = '/api/user-v2';

// Debug logs
console.log('Admin Gig Service loaded with config:', {
  API_GATEWAY_URL,
  GIG_SERVICE_PATH,
  USER_SERVICE_PATH
});

class AdminGigService {
  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          // Removed authentication for simplicity as requested
          ...options.headers,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Fetch all gigs pending verification
  async getPendingGigs(): Promise<ApiResponse<GigForVerification[]>> {
    const url = `${API_GATEWAY_URL}${GIG_SERVICE_PATH}/admin/pending`;
    console.log('Making request to:', url); // Debug log
    return this.makeRequest<GigForVerification[]>(url);
  }

  // Fetch all active gigs for admin review
  async getActiveGigs(): Promise<ApiResponse<GigForVerification[]>> {
    const url = `${API_GATEWAY_URL}${GIG_SERVICE_PATH}/admin/active`;
    console.log('Fetching active gigs from:', url);
    const result = await this.makeRequest<GigForVerification[]>(url);
    console.log('getActiveGigs raw result:', result);
    return result;
  }

  // Fetch all hold gigs for admin review
  async getHoldGigs(): Promise<ApiResponse<GigForVerification[]>> {
    const url = `${API_GATEWAY_URL}${GIG_SERVICE_PATH}/admin/hold`;
    console.log('Fetching hold gigs from:', url);
    const result = await this.makeRequest<GigForVerification[]>(url);
    console.log('getHoldGigs raw result:', result);
    return result;
  }

  // Fetch gig status counts for dashboard stats
  async getGigStatusCounts(): Promise<ApiResponse<{pending: number, active: number, hold: number, rejected: number}>> {
    const url = `${API_GATEWAY_URL}${GIG_SERVICE_PATH}/admin/analytics/status-counts`;
    console.log('Fetching gig status counts from:', url);
    return this.makeRequest<{pending: number, active: number, hold: number, rejected: number}>(url);
  }

  // Fetch gig verification table data
  async getGigVerificationTable(): Promise<ApiResponse<GigVerificationTableRow[]>> {
    try {
      const gigsResponse = await this.getPendingGigs();
      if (!gigsResponse.success || !gigsResponse.data) {
        return { success: false, error: gigsResponse.error };
      }

      const tableData: GigVerificationTableRow[] = [];
      
      for (const gig of gigsResponse.data) {
        // Fetch expert details
        const expertResponse = await this.getExpertDetails(gig.expert_id);
        if (!expertResponse.success) continue;

        // Use category data that's already included in the gig object
        const categoryName = gig.category?.name || 'Unknown Category';

        tableData.push({
          gig_id: gig.id,
          expert_id: gig.expert_id,
          expert_name: expertResponse.data!.name,
          category_name: categoryName,
          hourly_rate: gig.hourly_rate,
          currency: gig.currency,
          status: gig.status
        });
      }

      return { success: true, data: tableData };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch verification table data'
      };
    }
  }

  // Fetch detailed gig information for verification
  async getGigVerificationDetails(gigId: string): Promise<ApiResponse<GigVerificationDetails>> {
    try {
      // Fetch gig details
      const gigResponse = await this.makeRequest<GigForVerification>(
        `${API_GATEWAY_URL}${GIG_SERVICE_PATH}/admin/${gigId}`
      );
      if (!gigResponse.success || !gigResponse.data) {
        return { success: false, error: gigResponse.error };
      }

      const gig = gigResponse.data;

      // Fetch expert details
      const expertResponse = await this.getExpertDetails(gig.expert_id);
      if (!expertResponse.success || !expertResponse.data) {
        return { success: false, error: expertResponse.error };
      }

      // Category details are already included in the gig object
      const category = {
        id: gig.category?.id || '',
        name: gig.category?.name || 'Unknown Category',
        description: gig.category?.description || ''
      };

      // Fetch certificates
      const certificatesResponse = await this.getGigCertificates(gig.id);
      if (!certificatesResponse.success) {
        return { success: false, error: certificatesResponse.error };
      }

      // Check if user needs to be promoted from client to expert
      let verificationDocuments: VerificationDocument[] | undefined;
      if (expertResponse.data.role === 'client') {
        const verificationDocsResponse = await this.getUserVerificationDocuments(gig.expert_id);
        if (verificationDocsResponse.success) {
          verificationDocuments = verificationDocsResponse.data;
        }
      }

      return {
        success: true,
        data: {
          gig,
          expert: expertResponse.data,
          category: category,
          certificates: certificatesResponse.data || [],
          verificationDocuments
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch gig verification details'
      };
    }
  }

  // Fetch expert details from user service
  async getExpertDetails(expertId: string): Promise<ApiResponse<ExpertUser>> {
    return this.makeRequest<ExpertUser>(
      `${API_GATEWAY_URL}${USER_SERVICE_PATH}/admin/users/${expertId}`
    );
  }

  // Fetch category details from gig service
  async getCategoryDetails(categoryId: number): Promise<ApiResponse<Category>> {
    return this.makeRequest<Category>(
      `${API_GATEWAY_URL}${GIG_SERVICE_PATH}/admin/categories/${categoryId}`
    );
  }

  // Fetch certificates for a specific gig
  async getGigCertificates(gigId: string): Promise<ApiResponse<Certificate[]>> {
    return this.makeRequest<Certificate[]>(
      `${API_GATEWAY_URL}${GIG_SERVICE_PATH}/admin/${gigId}/certificates`
    );
  }

  // Fetch user verification documents
  async getUserVerificationDocuments(userId: string): Promise<ApiResponse<VerificationDocument[]>> {
    return this.makeRequest<VerificationDocument[]>(
      `${API_GATEWAY_URL}${USER_SERVICE_PATH}/admin/users/${userId}/verification-documents`
    );
  }

  // Approve or reject a gig
  async processGigVerification(action: VerificationAction): Promise<ApiResponse<void>> {
    if (action.action === 'APPROVE') {
      // First update gig status
      const updateResponse = await this.makeRequest<void>(
        `${API_GATEWAY_URL}${GIG_SERVICE_PATH}/admin/${action.gig_id}/approve`,
        {
          method: 'POST',
          body: JSON.stringify({
            verified_documents: action.verified_documents
          })
        }
      );

      if (!updateResponse.success) {
        return updateResponse;
      }

      // If user needs to be promoted to expert, do that
      const gigDetailsResponse = await this.getGigVerificationDetails(action.gig_id);
      if (gigDetailsResponse.success && gigDetailsResponse.data?.expert.role === 'client') {
        await this.verifyUserAsExpert(gigDetailsResponse.data.expert.id);
      }

      return updateResponse;
    } else {
      // Reject the gig
      return this.makeRequest<void>(
        `${API_GATEWAY_URL}${GIG_SERVICE_PATH}/admin/${action.gig_id}/reject`,
        {
          method: 'POST',
          body: JSON.stringify({
            reason: 'Documents not verified'
          })
        }
      );
    }
  }

  // Promote user to expert role
  async promoteUserToExpert(userId: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(
      `${API_GATEWAY_URL}${USER_SERVICE_PATH}/admin/users/${userId}/promote-to-expert`,
      {
        method: 'POST'
      }
    );
  }

  // Put a gig on hold
  async putGigOnHold(gigId: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(
      `${API_GATEWAY_URL}${GIG_SERVICE_PATH}/admin/${gigId}/hold`,
      {
        method: 'POST'
      }
    );
  }

  // Activate a gig (change from HOLD to ACTIVE)
  async activateGig(gigId: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(
      `${API_GATEWAY_URL}${GIG_SERVICE_PATH}/admin/${gigId}/activate`,
      {
        method: 'PUT'
      }
    );
  }

  // Reject a gig (change to REJECTED)
  async rejectGig(gigId: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(
      `${API_GATEWAY_URL}${GIG_SERVICE_PATH}/admin/${gigId}/reject`,
      {
        method: 'PUT'
      }
    );
  }

  // Get rejected gigs
  async getRejectedGigs(): Promise<ApiResponse<GigForVerification[]>> {
    console.log('Fetching rejected gigs from API...');
    return this.makeRequest<GigForVerification[]>(
      `${API_GATEWAY_URL}${GIG_SERVICE_PATH}/admin/rejected`
    );
  }

  // Reactivate a rejected gig (change from REJECTED to ACTIVE)
  async reactivateGig(gigId: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(
      `${API_GATEWAY_URL}${GIG_SERVICE_PATH}/admin/${gigId}/reactivate`,
      {
        method: 'PUT'
      }
    );
  }

  // Delete a rejected gig permanently
  async deleteGig(gigId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return this.makeRequest<{ success: boolean; message: string }>(
      `${API_GATEWAY_URL}${GIG_SERVICE_PATH}/admin/${gigId}/delete`,
      {
        method: 'DELETE'
      }
    );
  }

  // Fetch active gig table data (similar to getGigVerificationTable but for active gigs)
  async getActiveGigTable(): Promise<ApiResponse<GigVerificationTableRow[]>> {
    try {
      console.log('Fetching active gigs...');
      const gigsResponse = await this.getActiveGigs();
      console.log('Active gigs response:', gigsResponse);
      
      if (!gigsResponse.success || !gigsResponse.data) {
        return { success: false, error: gigsResponse.error };
      }

      console.log('Number of active gigs:', gigsResponse.data.length);
      const tableData: GigVerificationTableRow[] = [];
      
      // Fetch all expert details in parallel
      const expertPromises = gigsResponse.data.map(gig => 
        this.getExpertDetails(gig.expert_id)
      );
      
      const expertResponses = await Promise.all(expertPromises);
      console.log('Expert responses received:', expertResponses.length);
      
      for (let i = 0; i < gigsResponse.data.length; i++) {
        const gig = gigsResponse.data[i];
        const expertResponse = expertResponses[i];
        
        if (!expertResponse.success) {
          console.warn(`Failed to fetch expert details for gig ${gig.id}:`, expertResponse.error);
          // Still add the gig with a fallback name
          tableData.push({
            gig_id: gig.id,
            expert_name: 'Unknown Expert',
            category_name: gig.category?.name || 'Unknown Category',
            hourly_rate: gig.hourly_rate,
            currency: gig.currency,
            status: gig.status
          });
          continue;
        }

        // Use category data that's already included in the gig object
        const categoryName = gig.category?.name || 'Unknown Category';

        tableData.push({
          gig_id: gig.id,
          expert_name: expertResponse.data!.name,
          category_name: categoryName,
          hourly_rate: gig.hourly_rate,
          currency: gig.currency,
          status: gig.status
        });
      }

      console.log('Final table data:', tableData);
      return { success: true, data: tableData };
    } catch (error) {
      console.error('Error in getActiveGigTable:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch active gig table data'
      };
    }
  }

  // Fetch hold gig table data (similar to getActiveGigTable but for hold gigs)
  async getHoldGigTable(): Promise<ApiResponse<GigVerificationTableRow[]>> {
    try {
      console.log('Fetching hold gigs...');
      const gigsResponse = await this.getHoldGigs();
      console.log('Hold gigs response:', gigsResponse);
      
      if (!gigsResponse.success || !gigsResponse.data) {
        return { success: false, error: gigsResponse.error };
      }

      console.log('Number of hold gigs:', gigsResponse.data.length);
      const tableData: GigVerificationTableRow[] = [];
      
      // Fetch all expert details in parallel
      const expertPromises = gigsResponse.data.map(gig => 
        this.getExpertDetails(gig.expert_id)
      );
      
      const expertResponses = await Promise.all(expertPromises);
      console.log('Expert responses received:', expertResponses.length);
      
      for (let i = 0; i < gigsResponse.data.length; i++) {
        const gig = gigsResponse.data[i];
        const expertResponse = expertResponses[i];
        
        if (!expertResponse.success) {
          console.warn(`Failed to fetch expert details for gig ${gig.id}:`, expertResponse.error);
          // Still add the gig with a fallback name
          tableData.push({
            gig_id: gig.id,
            expert_name: 'Unknown Expert',
            category_name: gig.category?.name || 'Unknown Category',
            hourly_rate: gig.hourly_rate,
            currency: gig.currency,
            status: gig.status
          });
          continue;
        }

        // Use category data that's already included in the gig object
        const categoryName = gig.category?.name || 'Unknown Category';

        tableData.push({
          gig_id: gig.id,
          expert_name: expertResponse.data!.name,
          category_name: categoryName,
          hourly_rate: gig.hourly_rate,
          currency: gig.currency,
          status: gig.status
        });
      }

      console.log('Final hold gig table data:', tableData);
      return { success: true, data: tableData };
    } catch (error) {
      console.error('Error in getHoldGigTable:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch hold gig table data'
      };
    }
  }

  // Fetch rejected gig table data
  async getRejectedGigTable(): Promise<ApiResponse<GigVerificationTableRow[]>> {
    try {
      console.log('Fetching rejected gigs...');
      const gigsResponse = await this.getRejectedGigs();
      console.log('Rejected gigs response:', gigsResponse);
      
      if (!gigsResponse.success || !gigsResponse.data) {
        return {
          success: false,
          error: gigsResponse.error || 'Failed to fetch rejected gigs'
        };
      }

      const gigs = gigsResponse.data;
      console.log('Processing rejected gigs, count:', gigs.length);

      // Fetch expert details in parallel for all gigs
      const expertPromises = gigs.map(gig => 
        this.getExpertDetails(gig.expert_id)
      );
      const expertResponses = await Promise.all(expertPromises);
      console.log('Expert responses received:', expertResponses.length);

      const tableData: GigVerificationTableRow[] = [];

      for (let i = 0; i < gigs.length; i++) {
        const gig = gigsResponse.data[i];
        const expertResponse = expertResponses[i];
        
        if (!expertResponse.success) {
          console.warn(`Failed to fetch expert details for gig ${gig.id}:`, expertResponse.error);
          // Still add the gig with a fallback name
          tableData.push({
            gig_id: gig.id,
            expert_name: 'Unknown Expert',
            category_name: gig.category?.name || 'Unknown Category',
            hourly_rate: gig.hourly_rate,
            currency: gig.currency,
            status: gig.status
          });
          continue;
        }

        // Use category data that's already included in the gig object
        const categoryName = gig.category?.name || 'Unknown Category';

        tableData.push({
          gig_id: gig.id,
          expert_name: expertResponse.data!.name,
          category_name: categoryName,
          hourly_rate: gig.hourly_rate,
          currency: gig.currency,
          status: gig.status
        });
      }

      console.log('Final rejected gig table data:', tableData);
      return { success: true, data: tableData };
    } catch (error) {
      console.error('Error in getRejectedGigTable:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch rejected gig table data'
      };
    }
  }

  // Update document verification status (client-side helper)
  markDocumentAsVerified(documents: (Certificate | VerificationDocument)[], documentId: string): (Certificate | VerificationDocument)[] {
    return documents.map(doc => 
      doc.id === documentId ? { ...doc, verified: true } : doc
    );
  }

  // Check if all documents are verified (client-side helper)
  areAllDocumentsVerified(documents: (Certificate | VerificationDocument)[]): boolean {
    return documents.length > 0 && documents.every(doc => doc.verified === true);
  }

  // Verify user as expert (CLIENT → EXPERT workflow)
  async verifyUserAsExpert(userId: string): Promise<ApiResponse<ExpertUser>> {
    const url = `${API_GATEWAY_URL}${USER_SERVICE_PATH}/admin/users/${userId}/verify-as-expert`;
    return this.makeRequest<ExpertUser>(url, {
      method: 'PATCH'
    });
  }
}

export const adminGigService = new AdminGigService();
export default adminGigService;