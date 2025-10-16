import React, { useState } from 'react';
import { XCircle, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RejectedGigReviewModal from './RejectedGigReviewModal';

interface RejectedGig {
  gig_id: string;
  expert_name: string;
  category_name: string;
  hourly_rate: number;
  currency: string;
  status: string;
}

interface RejectedGigsReviewProps {
  gigs: RejectedGig[];
  loading: boolean;
  onGigUpdate: () => void;
}

const RejectedGigsReview: React.FC<RejectedGigsReviewProps> = ({ gigs, loading, onGigUpdate }) => {
  const [selectedGigId, setSelectedGigId] = useState<string | null>(null);

  console.log('RejectedGigsReview rendering with gigs:', gigs);

  const handleReviewClick = (gigId: string) => {
    console.log('Opening review modal for rejected gig:', gigId);
    setSelectedGigId(gigId);
  };

  const handleModalClose = () => {
    console.log('Closing rejected gig review modal');
    setSelectedGigId(null);
  };

  const handleGigUpdate = () => {
    console.log('Rejected gig updated, refreshing data');
    onGigUpdate();
    setSelectedGigId(null);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
        <p className="text-slate-600 mt-4">Loading rejected gigs...</p>
      </div>
    );
  }

  if (gigs.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">No Rejected Gigs</h2>
        <p className="text-slate-600">There are currently no rejected gigs to review.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-red-50 to-rose-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-rose-600">
              <XCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Rejected Gigs Review</h3>
              <p className="text-sm text-slate-600">Re-verify and reactivate or permanently delete rejected gigs</p>
            </div>
          </div>
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
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center text-white font-bold">
                        {gig.expert_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-900">{gig.expert_name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-slate-700">{gig.category_name}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-medium text-slate-900">
                      {gig.hourly_rate.toLocaleString()} {gig.currency}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700 border border-red-200">
                      <XCircle className="h-4 w-4" />
                      Rejected
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <Button
                      size="sm"
                      onClick={() => handleReviewClick(gig.gig_id)}
                      className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                    >
                      <UserCheck className="h-4 w-4" />
                      Review
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedGigId && (
        <RejectedGigReviewModal
          gigId={selectedGigId}
          isOpen={!!selectedGigId}
          onClose={handleModalClose}
          onGigUpdate={handleGigUpdate}
        />
      )}
    </>
  );
};

export default RejectedGigsReview;
