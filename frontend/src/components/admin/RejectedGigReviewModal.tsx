import React, { useState, useEffect } from 'react';
import { X, XCircle, User, Tag, DollarSign, Calendar, FileText, ExternalLink, AlertTriangle, Trash2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import adminGigService from '@/services/adminGigService';
import { GigVerificationDetails, Certificate } from '@/types/gigVerification';

interface RejectedGigReviewModalProps {
  gigId: string;
  isOpen: boolean;
  onClose: () => void;
  onGigUpdate: () => void;
}

const RejectedGigReviewModal: React.FC<RejectedGigReviewModalProps> = ({
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
  const [processing, setProcessing] = useState(false);
  const [showReactivateConfirm, setShowReactivateConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
      // Fetch gig details
      const detailsResponse = await adminGigService.getGigVerificationDetails(gigId);
      if (!detailsResponse.success || !detailsResponse.data) {
        throw new Error(detailsResponse.error || 'Failed to load gig details');
      }
      setGigDetails(detailsResponse.data);

      // Fetch certificates
      const certsResponse = await adminGigService.getGigCertificates(gigId);
      if (certsResponse.success && certsResponse.data) {
        setCertificates(certsResponse.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateGig = async () => {
    if (!showReactivateConfirm) {
      setShowReactivateConfirm(true);
      return;
    }

    setProcessing(true);
    try {
      const response = await adminGigService.reactivateGig(gigId);
      if (response.success) {
        onGigUpdate();
        onClose();
      } else {
        setError(response.error || 'Failed to reactivate gig');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setProcessing(false);
      setShowReactivateConfirm(false);
    }
  };

  const handleDeleteGig = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setProcessing(true);
    try {
      const response = await adminGigService.deleteGig(gigId);
      if (response.success) {
        onGigUpdate();
        onClose();
      } else {
        setError(response.error || 'Failed to delete gig');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setProcessing(false);
      setShowDeleteConfirm(false);
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
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-red-50 to-rose-100 px-8 py-6 border-b border-red-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg">
                  <XCircle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Review Rejected Gig</h2>
                  <p className="text-slate-600 mt-1">Re-verify and reactivate or permanently delete</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              </div>
            )}

            {!loading && gigDetails && (
              <>
                {/* Rejected Notice */}
                <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-300 rounded-xl p-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-red-100">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-red-900 mb-2">This gig was previously rejected</h3>
                      <p className="text-red-700 leading-relaxed">
                        This gig is currently in rejected status. Review all verification documents again. 
                        If everything meets the requirements, you can reactivate it to make it live. 
                        Otherwise, you can permanently delete it from the system.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Gig Overview */}
                <div className="bg-slate-50 rounded-xl p-6 mb-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-red-600" />
                    Gig Overview
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-blue-100">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Expert</p>
                          <p className="font-semibold text-slate-900">{gigDetails.expert.name}</p>
                          <p className="text-sm text-slate-500">{gigDetails.expert.email}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-purple-100">
                          <Tag className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Category</p>
                          <p className="font-semibold text-slate-900">{gigDetails.category.name}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-green-100">
                          <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Hourly Rate</p>
                          <p className="font-semibold text-slate-900">
                            {gigDetails.gig.hourly_rate.toLocaleString()} {gigDetails.gig.currency}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-orange-100">
                          <Calendar className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Created At</p>
                          <p className="font-semibold text-slate-900">
                            {new Date(gigDetails.gig.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Description */}
                {gigDetails.gig.service_description && (
                  <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8">
                    <h3 className="text-lg font-bold text-slate-900 mb-3">Service Description</h3>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {gigDetails.gig.service_description}
                    </p>
                  </div>
                )}

                {/* Verification Documents - Longitudinal Layout */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-red-600" />
                    Verification Documents
                  </h3>
                  <p className="text-slate-600 mb-6">
                    Review all documents again to ensure they meet requirements before reactivating.
                  </p>

                  {certificates.length === 0 ? (
                    <div className="bg-slate-50 rounded-xl p-8 text-center">
                      <FileText className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600">No verification documents uploaded</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {certificates.map((cert) => {
                        const isVerified = isDocumentVerified(cert.id);
                        return (
                          <div
                            key={cert.id}
                            className={`border-2 rounded-xl p-6 transition-all ${
                              isVerified
                                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              {/* Document Icon */}
                              <div className={`p-3 rounded-lg ${isVerified ? 'bg-green-100' : 'bg-slate-100'}`}>
                                <FileText className={`h-6 w-6 ${isVerified ? 'text-green-600' : 'text-slate-600'}`} />
                              </div>

                              {/* Document Info */}
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h4 className="font-semibold text-slate-900 text-lg mb-1">
                                      Certificate Document
                                    </h4>
                                    <p className="text-sm text-slate-500">
                                      Uploaded on {new Date(cert.uploaded_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                  {isVerified && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 border border-green-200">
                                      <CheckCircle className="h-4 w-4" />
                                      Verified
                                    </span>
                                  )}
                                </div>

                                {/* Document Preview */}
                                {cert.url && (
                                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-4">
                                    <div className="relative h-48 bg-slate-100 flex items-center justify-center">
                                      {cert.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                        <img
                                          src={cert.url}
                                          alt="Certificate"
                                          className="max-h-full max-w-full object-contain"
                                        />
                                      ) : (
                                        <div className="text-center">
                                          <FileText className="h-16 w-16 text-slate-400 mx-auto mb-2" />
                                          <p className="text-slate-600 text-sm">Document Preview</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3">
                                  <Button
                                    onClick={() => openDocument(cert.url)}
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-2 hover:bg-slate-50"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    View Full Document
                                  </Button>

                                  {/* Mark as Verified Button */}
                                  <Button
                                    onClick={() => toggleDocumentVerification(cert.id)}
                                    size="sm"
                                    className={`flex items-center gap-2 ${
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
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Review Summary */}
                  {certificates.length > 0 && (
                    <div className={`mt-6 rounded-xl p-4 border-2 ${
                      allDocumentsVerified()
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className={`h-5 w-5 ${allDocumentsVerified() ? 'text-green-600' : 'text-slate-600'}`} />
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
                          <p>Please verify all documents before reactivating this gig.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-6 border-t border-slate-200 flex items-center justify-between gap-4">
            <Button
              onClick={onClose}
              variant="outline"
              size="lg"
              disabled={processing}
              className="px-8"
            >
              Close
            </Button>

            <div className="flex items-center gap-3">
              {/* Delete Confirmation */}
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-red-700">Permanently delete this gig?</span>
                  <Button
                    onClick={() => setShowDeleteConfirm(false)}
                    variant="outline"
                    size="sm"
                    disabled={processing}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteGig}
                    size="sm"
                    disabled={processing}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Confirm Delete
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleDeleteGig}
                  variant="outline"
                  size="lg"
                  disabled={processing}
                  className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 px-6"
                >
                  <Trash2 className="h-5 w-3 mr-2" />
                  Delete
                </Button>
              )}

              {/* Reactivate Confirmation */}
              {showReactivateConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-green-700">Make this gig active?</span>
                  <Button
                    onClick={() => setShowReactivateConfirm(false)}
                    variant="outline"
                    size="sm"
                    disabled={processing}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReactivateGig}
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
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirm Reactivate
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Button
                    onClick={handleReactivateGig}
                    size="lg"
                    disabled={processing || !allDocumentsVerified()}
                    className={`px-8 ${
                      allDocumentsVerified()
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-slate-300 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Reactivate
                  </Button>
                  {!allDocumentsVerified() && (
                    <p className="absolute -bottom-6 left-0 text-xs text-amber-600 whitespace-nowrap">
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

export default RejectedGigReviewModal;
