import React, { useState, useEffect } from 'react';
import { 
  X, 
  Eye, 
  User,
  Clock, 
  DollarSign, 
  Award,
  FileText,
  AlertCircle,
  CheckCircle,
  Shield,
  Briefcase,
  XCircle,
  PauseCircle,
  ExternalLink,
  AlertTriangle,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GigVerificationDetails, Certificate } from '@/types/gigVerification';
import adminGigService from '@/services/adminGigService';

interface HoldGigReviewModalProps {
  gigId: string;
  isOpen: boolean;
  onClose: () => void;
  onGigUpdate: () => void;
}

const HoldGigReviewModal: React.FC<HoldGigReviewModalProps> = ({
  gigId,
  isOpen,
  onClose,
  onGigUpdate
}) => {
  const [gigDetails, setGigDetails] = useState<GigVerificationDetails | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [verifiedDocuments, setVerifiedDocuments] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showActivateConfirm, setShowActivateConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  useEffect(() => {
    if (isOpen && gigId) {
      loadGigDetails();
    }
  }, [isOpen, gigId]);

  const loadGigDetails = async () => {
    setLoading(true);
    setError(null);
    setVerifiedDocuments(new Set()); // Reset verified documents

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

  const handleActivateGig = async () => {
    if (!showActivateConfirm) {
      setShowActivateConfirm(true);
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const response = await adminGigService.activateGig(gigId);

      if (response.success) {
        onGigUpdate();
        onClose();
      } else {
        setError(response.error || 'Failed to activate gig');
      }
    } catch (err) {
      setError('Failed to activate gig');
      console.error('Error activating gig:', err);
    } finally {
      setProcessing(false);
      setShowActivateConfirm(false);
    }
  };

  const handleRejectGig = async () => {
    if (!showRejectConfirm) {
      setShowRejectConfirm(true);
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const response = await adminGigService.rejectGig(gigId);

      if (response.success) {
        onGigUpdate();
        onClose();
      } else {
        setError(response.error || 'Failed to reject gig');
      }
    } catch (err) {
      setError('Failed to reject gig');
      console.error('Error rejecting gig:', err);
    } finally {
      setProcessing(false);
      setShowRejectConfirm(false);
    }
  };

  const toggleDocumentVerification = (certId: string) => {
    setVerifiedDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(certId)) {
        newSet.delete(certId);
      } else {
        newSet.add(certId);
      }
      return newSet;
    });
  };

  const isDocumentVerified = (certId: string) => {
    return verifiedDocuments.has(certId);
  };

  const allDocumentsVerified = () => {
    return certificates.length > 0 && certificates.every(cert => verifiedDocuments.has(cert.id));
  };

  const openDocument = (url: string) => {
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-slate-900/25 border border-slate-200/50">
        {/* Header */}
        <div className="p-8 border-b border-slate-300/50 bg-gradient-to-r from-blue-50 to-blue-100/80 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-200 to-blue-300 shadow-lg">
              <PauseCircle className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Hold Gig Review</h2>
              <p className="text-slate-600 mt-1 font-medium">Review and manage gig on hold</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="h-10 w-10 rounded-xl hover:bg-blue-200/80 transition-all duration-200"
          >
            <X className="h-5 w-5 text-slate-600" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-slate-100/50">
          {loading ? (
            <div className="p-16 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-300 border-t-blue-600 mx-auto mb-6"></div>
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
              {/* Hold Notice */}
              <div className="bg-gradient-to-r from-amber-100 to-amber-200 rounded-2xl border border-amber-300/50 shadow-lg p-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-500 flex-shrink-0">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-amber-900 font-bold text-lg">Gig on Hold</p>
                    <p className="text-amber-800 text-sm mt-1">
                      This gig has been placed on hold for review. You can activate it to make it live or reject it permanently.
                    </p>
                  </div>
                </div>
              </div>

              {/* Gig Overview Section */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-6 w-6 text-blue-600" />
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
                          <PauseCircle className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-500 font-medium mb-1">Status</p>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                            <PauseCircle className="h-3 w-3 mr-1" />
                            ON HOLD
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
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="h-6 w-6 text-blue-600" />
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">Verification Documents</h3>
                        <p className="text-sm text-slate-600 mt-1">Review gig certificates</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Total Documents</p>
                      <p className="text-2xl font-bold text-blue-600">{certificates.length}</p>
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
                        const isVerified = isDocumentVerified(cert.id);
                        return (
                          <div
                            key={cert.id}
                            className={`rounded-2xl p-6 transition-all duration-300 shadow-lg border ${
                              isVerified
                                ? 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-300/50'
                                : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300/50 hover:from-blue-100 hover:to-blue-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              {/* Left side - Document info and thumbnail */}
                              <div className="flex items-start gap-4 flex-1">
                                <div className={`p-3 rounded-xl shadow-lg flex-shrink-0 ${
                                  isVerified
                                    ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                                    : 'bg-gradient-to-br from-blue-300 to-blue-400'
                                }`}>
                                  <Award className={`h-6 w-6 ${isVerified ? 'text-green-900' : 'text-blue-800'}`} />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="font-bold text-slate-800 text-lg">
                                      Certificate {idx + 1}
                                    </p>
                                    {isVerified && (
                                      <div className="flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <span className="text-sm text-green-600 font-bold">Verified</span>
                                      </div>
                                    )}
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

                                  {/* Verification Button */}
                                  <div className="mt-4">
                                    <Button
                                      onClick={() => toggleDocumentVerification(cert.id)}
                                      size="sm"
                                      className={`flex items-center gap-2 w-full ${
                                        isVerified
                                          ? 'bg-green-600 hover:bg-green-700'
                                          : 'bg-blue-600 hover:bg-blue-700'
                                      }`}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                      {isVerified ? 'Verified' : 'Mark as Verified'}
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {/* Right side - View button */}
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
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Verification Progress Summary */}
                  {certificates.length > 0 && (
                    <div className={`mt-6 rounded-xl p-4 border-2 ${
                      allDocumentsVerified()
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className={`h-5 w-5 ${allDocumentsVerified() ? 'text-green-600' : 'text-slate-600'}`} />
                          <span className={`font-medium ${allDocumentsVerified() ? 'text-green-900' : 'text-slate-900'}`}>
                            Verification Progress
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className={allDocumentsVerified() ? 'text-green-700 font-semibold' : 'text-slate-700'}>
                            {verifiedDocuments.size} / {certificates.length} Documents Verified
                          </span>
                          {allDocumentsVerified() && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 border border-green-200 font-medium">
                              <CheckCircle className="h-4 w-4" />
                              All Verified
                            </span>
                          )}
                        </div>
                      </div>
                      {!allDocumentsVerified() && (
                        <div className="mt-3 flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <p>Please verify all documents before activating this gig.</p>
                        </div>
                      )}
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
              <span className="font-medium">Review this gig and take action</span>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={processing}
                className="px-6"
              >
                Close
              </Button>
              
              {/* Reject Confirmation */}
              {showRejectConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-red-700">Reject this gig?</span>
                  <Button
                    onClick={() => setShowRejectConfirm(false)}
                    variant="outline"
                    size="sm"
                    disabled={processing}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRejectGig}
                    size="sm"
                    disabled={processing}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Confirm Reject
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleRejectGig}
                  disabled={processing || !gigDetails}
                  className="px-6 bg-red-500 hover:bg-red-600 text-white"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              )}

              {/* Activate Confirmation */}
              {showActivateConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-green-700">Activate this gig?</span>
                  <Button
                    onClick={() => setShowActivateConfirm(false)}
                    variant="outline"
                    size="sm"
                    disabled={processing}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleActivateGig}
                    size="sm"
                    disabled={processing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Activating...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Confirm Activate
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Button
                    onClick={handleActivateGig}
                    disabled={processing || !gigDetails || !allDocumentsVerified()}
                    className={`px-6 ${
                      allDocumentsVerified()
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Activate
                  </Button>
                  {!allDocumentsVerified() && (
                    <p className="absolute -bottom-6 right-0 text-xs text-amber-600 whitespace-nowrap">
                      Verify all documents first
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HoldGigReviewModal;
