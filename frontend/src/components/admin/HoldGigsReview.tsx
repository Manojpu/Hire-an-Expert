import React, { useState } from 'react';
import { PauseCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GigVerificationTableRow } from '@/types/gigVerification';
import HoldGigReviewModal from './HoldGigReviewModal';

interface HoldGigsReviewProps {
  gigs: GigVerificationTableRow[];
  loading: boolean;
  onGigUpdate: () => void;
}

const HoldGigsReview: React.FC<HoldGigsReviewProps> = ({ gigs, loading, onGigUpdate }) => {
  const [selectedGigId, setSelectedGigId] = useState<string | null>(null);

  console.log('HoldGigsReview received gigs:', gigs);
  console.log('HoldGigsReview gigs count:', gigs.length);

  const handleViewDetails = (gigId: string) => {
    setSelectedGigId(gigId);
  };

  const getStatusBadge = (status: string) => {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border bg-blue-100 text-blue-800 border-blue-200">
        <PauseCircle className="h-3 w-3 mr-1" />
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading gigs on hold...</p>
      </div>
    );
  }

  if (gigs.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
        <PauseCircle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-900 mb-2">No Gigs on Hold</h3>
        <p className="text-slate-600">There are currently no gigs on hold for review</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-blue-50">
          <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <PauseCircle className="h-6 w-6 text-blue-600" />
            Gigs on Hold Review
          </h3>
          <p className="text-slate-600 text-sm mt-1">Review and manage gigs that are on hold</p>
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
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
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
                      className="bg-blue-500 hover:bg-blue-600 text-white"
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

      {/* Hold Gig Review Modal */}
      {selectedGigId && (
        <HoldGigReviewModal
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

export default HoldGigsReview;
