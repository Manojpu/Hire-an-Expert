import React, { useState, useEffect } from 'react';
import { 
  X, 
  Eye, 
  User,
  MapPin, 
  Clock, 
  Star, 
  DollarSign, 
  Calendar, 
  Award,
  FileText,
  Download,
  AlertCircle,
  CheckCircle,
  Shield,
  Briefcase,
  XCircle,
  PauseCircle,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GigVerificationDetails, Certificate } from '@/types/gigVerification';
import adminGigService from '@/services/adminGigService';

interface ActiveGigReviewModalProps {
  gigId: string;
  isOpen: boolean;
  onClose: () => void;
  onGigUpdate: () => void;
}

const ActiveGigReviewModal: React.FC<ActiveGigReviewModalProps> = ({
  gigId,
  isOpen,
  onClose,
  onGigUpdate
}) => {
  const [gigDetails, setGigDetails] = useState<GigVerificationDetails | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [rejectedCerts, setRejectedCerts] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [showHoldConfirm, setShowHoldConfirm] = useState(false);

  useEffect(() => {
    if (isOpen && gigId) {
      loadGigDetails();
    }
  }, [isOpen, gigId]);

  const loadGigDetails = async () => {
    setLoading(true);
    setError(null);
    setRejectedCerts(new Set());

    try {
      // Load gig details
      const detailsResponse = await adminGigService.getGigVerificationDetails(gigId);
      if (detailsResponse.success && detailsResponse.data) {
        setGigDetails(detailsResponse.data);
      } else {
        setError(detailsResponse.error || 'Failed to load gig details');
        setLoading(false);
        return;
      }

      // Load certificates
      const certsResponse = await adminGigService.getGigCertificates(gigId);
      if (certsResponse.success && certsResponse.data) {
        setCertificates(certsResponse.data);
      } else {
        setError(certsResponse.error || 'Failed to load certificates');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error loading gig details:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCertificateRejection = (certId: string) => {
    setRejectedCerts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(certId)) {
        newSet.delete(certId);
      } else {
        newSet.add(certId);
      }
      return newSet;
    });
  };

  const handlePutOnHold = async () => {
    if (!showHoldConfirm) {
      setShowHoldConfirm(true);
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const response = await adminGigService.putGigOnHold(gigId);

      if (response.success) {
        onGigUpdate();
        onClose();
      } else {
        setError(response.error || 'Failed to put gig on hold');
      }
    } catch (err) {
      setError('Failed to put gig on hold');
      console.error('Error putting gig on hold:', err);
    } finally {
      setProcessing(false);
      setShowHoldConfirm(false);
    }
  };

  const openDocument = (url: string) => {
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-slate-900/25 border border-slate-200/50">
        {/* Header */}
        <div className="p-8 border-b border-slate-300/50 bg-gradient-to-r from-green-50 to-green-100/80 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-green-200 to-green-300 shadow-lg">
              <CheckCircle className="h-6 w-6 text-green-700" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Active Gig Review</h2>
              <p className="text-slate-600 mt-1 font-medium">Review verified documents and manage gig status</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="h-10 w-10 rounded-xl hover:bg-green-200/80 transition-all duration-200"
          >
            <X className="h-5 w-5 text-slate-600" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-slate-100/50">
          {loading ? (
            <div className="p-16 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-300 border-t-green-600 mx-auto mb-6"></div>
              <p className="text-slate-600 text-lg font-medium">Loading gig details...</p>
            </div>
          ) : error ? (
            <div className="p-8">
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-800 font-semibold text-lg mb-2">Error Loading Details</p>
                <p className="text-red-600">{error}</p>
                <Button 
                  onClick={loadGigDetails}
                  className="mt-4 bg-red-500 hover:bg-red-600"
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : gigDetails ? (
            <div className="p-8 space-y-8">
              {/* Gig Overview Section */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-6 w-6 text-green-600" />
                    <h3 className="text-xl font-bold text-slate-800">Gig Overview</h3>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Expert Information */}
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-blue-100">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-500 font-medium mb-1">Expert Name</p>
                          <p className="text-slate-900 font-semibold text-lg">{gigDetails.expert.name}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-purple-100">
                          <Award className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-500 font-medium mb-1">Category</p>
                          <p className="text-slate-900 font-semibold">{gigDetails.category.name}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-amber-100">
                          <Star className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-500 font-medium mb-1">Status</p>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            ACTIVE
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Gig Details */}
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-green-100">
                          <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-500 font-medium mb-1">Hourly Rate</p>
                          <p className="text-slate-900 font-bold text-xl">
                            {gigDetails.gig.hourly_rate.toLocaleString()} {gigDetails.gig.currency}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-indigo-100">
                          <Clock className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-500 font-medium mb-1">Created At</p>
                          <p className="text-slate-900 font-semibold">
                            {new Date(gigDetails.gig.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Service Description */}
                  {gigDetails.gig.service_description && (
                    <div className="pt-4 border-t border-slate-200">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-5 w-5 text-slate-600" />
                        <p className="text-sm text-slate-500 font-medium">Service Description</p>
                      </div>
                      <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg">
                        {gigDetails.gig.service_description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Verified Documents Section */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="h-6 w-6 text-green-600" />
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">Verified Documents</h3>
                        <p className="text-sm text-slate-600 mt-1">Review and manage gig certificates</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Total Documents</p>
                      <p className="text-2xl font-bold text-green-600">{certificates.length}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {certificates.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-300 to-slate-400 inline-block mb-6 shadow-lg">
                        <FileText className="h-16 w-16 text-slate-700 mx-auto" />
                      </div>
                      <p className="text-slate-600 text-lg font-medium">No certificates found for this gig</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {certificates.map((cert, idx) => {
                        const isRejected = rejectedCerts.has(cert.id);
                        return (
                          <div
                            key={cert.id}
                            className={`rounded-2xl p-6 transition-all duration-300 shadow-lg border ${
                              isRejected 
                                ? 'bg-gradient-to-br from-red-100 to-red-200 border-red-300/50 shadow-red-500/20' 
                                : 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-300/50 hover:from-green-100 hover:to-emerald-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              {/* Left side - Document info and thumbnail */}
                              <div className="flex items-start gap-4 flex-1">
                                <div className={`p-3 rounded-xl shadow-lg flex-shrink-0 ${
                                  isRejected 
                                    ? 'bg-gradient-to-br from-red-300 to-red-400' 
                                    : 'bg-gradient-to-br from-green-300 to-emerald-400'
                                }`}>
                                  <Award className={`h-6 w-6 ${
                                    isRejected ? 'text-red-800' : 'text-green-800'
                                  }`} />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="font-bold text-slate-800 text-lg">
                                      Certificate {idx + 1}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      {isRejected ? (
                                        <>
                                          <XCircle className="h-5 w-5 text-red-600" />
                                          <span className="text-sm text-red-600 font-bold">Rejected</span>
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle className="h-5 w-5 text-green-600" />
                                          <span className="text-sm text-green-600 font-bold">Verified</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <p className="text-sm text-slate-600 font-medium mb-4">
                                    Uploaded: {new Date(cert.uploaded_at).toLocaleDateString()}
                                  </p>

                                  {/* Document Preview */}
                                  <div 
                                    className="w-full h-48 bg-slate-200 rounded-lg overflow-hidden cursor-pointer group relative shadow-md"
                                    onClick={() => openDocument(cert.url)}
                                  >
                                    {cert.url ? (
                                      <>
                                        <img 
                                          src={cert.url} 
                                          alt={`Certificate ${idx + 1}`}
                                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <div className="text-center">
                                            <ExternalLink className="h-10 w-10 text-white mx-auto mb-2" />
                                            <p className="text-white font-semibold">Click to view full size</p>
                                          </div>
                                        </div>
                                      </>
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Eye className="h-12 w-12 text-slate-400" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Right side - Action buttons */}
                              <div className="flex flex-col gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openDocument(cert.url)}
                                  className="border-slate-400 hover:bg-slate-300 rounded-xl px-4 py-2 font-semibold whitespace-nowrap"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => toggleCertificateRejection(cert.id)}
                                  className={isRejected 
                                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30 rounded-xl px-4 py-2 font-semibold" 
                                    : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/30 rounded-xl px-4 py-2 font-semibold"
                                  }
                                >
                                  {isRejected ? (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Restore
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reject
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Warning Message */}
                  {rejectedCerts.size > 0 && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-amber-100 to-amber-200 rounded-2xl border border-amber-300/50 shadow-lg">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-amber-500 flex-shrink-0">
                          <AlertTriangle className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-amber-900 font-semibold">
                            <strong>Documents Marked for Rejection</strong>
                          </p>
                          <p className="text-amber-800 text-sm mt-1">
                            {rejectedCerts.size} certificate{rejectedCerts.size > 1 ? 's have' : ' has'} been marked as rejected. 
                            Consider putting this gig on hold for further review and corrective action.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Review Summary */}
                  {certificates.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-slate-300/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-gradient-to-br from-green-100 to-green-200">
                            <Shield className="h-5 w-5 text-green-700" />
                          </div>
                          <div>
                            <p className="text-slate-800 font-bold">Review Summary</p>
                            <p className="text-sm text-slate-600">
                              {rejectedCerts.size > 0 
                                ? `${rejectedCerts.size} of ${certificates.length} documents marked for rejection`
                                : `All ${certificates.length} documents verified successfully`
                              }
                            </p>
                          </div>
                        </div>
                        {rejectedCerts.size > 0 && (
                          <div className="flex items-center gap-2 text-red-600">
                            <XCircle className="h-5 w-5" />
                            <span className="font-bold">Action Required</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-300/50 bg-gradient-to-r from-slate-100 to-slate-200/80">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              {rejectedCerts.size > 0 && (
                <span className="text-red-600 font-medium">
                  ⚠️ {rejectedCerts.size} document{rejectedCerts.size > 1 ? 's' : ''} marked as rejected
                </span>
              )}
            </div>
            {showHoldConfirm ? (
              <div className="flex items-center gap-3 w-full">
                <span className="text-amber-600 font-medium flex-1">
                  ⚠️ Put this gig on hold?
                </span>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowHoldConfirm(false)}
                    disabled={processing}
                    className="px-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePutOnHold}
                    disabled={processing || !gigDetails}
                    className="px-6 bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <PauseCircle className="h-4 w-4 mr-2" />
                        Confirm Hold
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={processing}
                  className="px-6"
                >
                  Close
                </Button>
                <Button
                  onClick={() => setShowHoldConfirm(true)}
                  disabled={processing || !gigDetails}
                  className="px-6 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <PauseCircle className="h-4 w-4 mr-2" />
                  Put on Hold
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveGigReviewModal;
