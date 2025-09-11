import { ExpertApplicationForm, ExpertGig, EXPERT_CATEGORIES } from '@/types/expert';
import { Expert } from '@/data/mockExperts';

// Convert application form to Expert format for display
export function convertApplicationToExpert(
  form: Partial<ExpertApplicationForm>, 
  userId: string = 'temp_user'
): Partial<Expert> {
  // Generate slug from name
  const generateSlug = (name: string) => 
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return {
    id: `expert_${Date.now()}`, // Temporary ID
    userId,
    name: form.name || '',
    title: form.title || '',
    slug: form.name ? generateSlug(form.name) : '',
    category: EXPERT_CATEGORIES[form.categories as keyof typeof EXPERT_CATEGORIES] || form.categories || '',
    subcategories: [], // Could be derived from serviceDesc or additional fields
    profileImage: form.photo ? URL.createObjectURL(form.photo) : '/assets/placeholder.svg',
    bannerImage: form.cover ? URL.createObjectURL(form.cover) : '/assets/hero-technology.jpg',
    bio: form.bio || '',
    pricing: {
      hourlyRate: form.rate || 0,
      currency: 'LKR'
    },
    rating: 0, // New expert starts with 0
    totalReviews: 0,
    totalConsultations: 0,
    responseTime: '< 24 hours', // Default for new experts
    languages: form.languages ? form.languages.split(',').map(lang => lang.trim()) : ['English']
  };
}

// Sync expert data across all components
export function syncExpertData(expertData: Partial<Expert>) {
  // This would integrate with your state management (Redux, Zustand, etc.)
  // For now, we'll just log the synced data
  console.log('Syncing expert data across components:', expertData);
  
  // Update Category page data
  // Update Expert profile page data  
  // Update Dashboard data
  
  return expertData;
}

// Validate application form before submission
export function validateExpertApplication(form: Partial<ExpertApplicationForm>): string[] {
  const errors: string[] = [];
  
  // Step 0: Basic Information
  if (!form.name?.trim()) errors.push('Name is required');
  if (!form.title?.trim()) errors.push('Professional headline is required');
  if (!form.bio?.trim()) errors.push('Bio is required');
  
  // Step 1: Expertise & Services
  if (!form.categories) errors.push('Category selection is required');
  if (!form.rate || form.rate <= 0) errors.push('Valid hourly rate is required');
  
  // Step 2: Qualifications
  if (!form.education?.trim()) errors.push('Education background is required');
  if (!form.experience?.trim()) errors.push('Work experience is required');
  
  // Step 3: Verification
  if (!form.bgConsent) errors.push('Background check consent is required');
  
  // Step 4: Review
  if (!form.tos) errors.push('Terms of service acceptance is required');
  
  return errors;
}
