import { GigsList } from "../components/GigsList";

/**
 * Page component for browsing all available gigs
 */
export function GigsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Browse Available Services</h1>
      <p className="text-gray-600 mb-8">
        Find and book expert services in various categories.
      </p>
      <GigsList />
    </div>
  );
}

export default GigsPage;
