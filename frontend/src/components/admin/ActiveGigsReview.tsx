import React, { useState } from 'react';
import { CheckCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GigVerificationTableRow } from '@/types/gigVerification';
import ActiveGigReviewModal from './ActiveGigReviewModal';

interface ActiveGigsReviewProps {
  gigs: GigVerificationTableRow[];
  loading: boolean;
  onGigUpdate: () => void;
}

const ActiveGigsReview: React.FC<ActiveGigsReviewProps> = ({ gigs, loading, onGigUpdate }) => {
  const [selectedGigId, setSelectedGigId] = useState<string | null>(null);

  console.log('ActiveGigsReview received gigs:', gigs);
  console.log('ActiveGigsReview gigs count:', gigs.length);

  const handleViewDetails = (gigId: string) => {
    setSelectedGigId(gigId);
  };

  const getStatusBadge = (status: string) => {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading active gigs...</p>
      </div>
    );
  }

  if (gigs.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
        <CheckCircle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-900 mb-2">No Active Gigs</h3>
        <p className="text-slate-600">There are currently no active gigs to review</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-green-50">
          <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Active Gigs Review
          </h3>
          <p className="text-slate-600 text-sm mt-1">Review active gigs and manage verification documents</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-slate-700">Expert Name</th>
                <th className="text-left py-4 px-6 font-semibold text-slate-700">Category</th>
                <th className="text-left py-4 px-6 font-semibold text-slate-700">Hourly Rate</th>
                <th className="text-left py-4 px-6 font-semibold text-slate-700">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {gigs.map((gig) => (
                <tr key={gig.gig_id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {gig.expert_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-slate-900">{gig.expert_name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-700">{gig.category_name}</td>
                  <td className="py-4 px-6">
                    <span className="font-semibold text-slate-900">
                      {gig.hourly_rate.toLocaleString()} {gig.currency}
                    </span>
                  </td>
                  <td className="py-4 px-6">{getStatusBadge(gig.status)}</td>
                  <td className="py-4 px-6">
                    <Button
                      size="sm"
                      onClick={() => handleViewDetails(gig.gig_id)}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Gig Review Modal */}
      {selectedGigId && (
        <ActiveGigReviewModal
          gigId={selectedGigId}
          isOpen={!!selectedGigId}
          onClose={() => setSelectedGigId(null)}
          onGigUpdate={() => {
            onGigUpdate();
            setSelectedGigId(null);
          }}
        />
      )}
    </>
  );
};

export default ActiveGigsReview;
