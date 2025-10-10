import React, { useState, useEffect } from 'react';
import { 
  X, 
  Eye, 
  Check, 
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
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GigVerificationDetails, Certificate, VerificationDocument } from '@/types/gigVerification';
import adminGigService from '@/services/adminGigService';

interface GigVerificationModalProps {
  gigId: string;
  isOpen: boolean;
  onClose: () => void;
  onVerificationComplete: () => void;
}

type DocumentWithVerification = (Certificate | VerificationDocument) & {
  verified?: boolean;
};

const GigVerificationModal: React.FC<GigVerificationModalProps> = ({
  gigId,
  isOpen,
  onClose,
  onVerificationComplete
}) => {
  const [gigDetails, setGigDetails] = useState<GigVerificationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentWithVerification[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isOpen && gigId) {
      loadGigDetails();
    }
  }, [isOpen, gigId]);

  const loadGigDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminGigService.getGigVerificationDetails(gigId);
      if (response.success && response.data) {
        setGigDetails(response.data);
        
        // Combine certificates and verification documents
        const allDocuments: DocumentWithVerification[] = [
          ...response.data.certificates.map(cert => ({ ...cert, verified: false }))
        ];

        // If user is applying to become expert, add verification documents at the beginning
        if (response.data.verificationDocuments) {
          allDocuments.unshift(
            ...response.data.verificationDocuments.map(doc => ({ ...doc, verified: false }))
          );
        }

        setDocuments(allDocuments);
      } else {
        setError(response.error || 'Failed to load gig verification details');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error loading gig details:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDocumentVerification = (documentId: string) => {
    setDocuments(prevDocs => 
      prevDocs.map(doc => 
        doc.id === documentId ? { ...doc, verified: !doc.verified } : doc
      )
    );
  };

  const viewDocument = (documentUrl: string) => {
    window.open(documentUrl, '_blank');
  };

  const downloadDocument = (documentUrl: string, documentName: string) => {
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = `${documentName}_${Date.now()}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const allDocumentsVerified = documents.length > 0 && documents.every(doc => doc.verified);

  const handleApprove = async () => {
    if (!allDocumentsVerified) {
      alert('Please verify all documents before approving');
      return;
    }

    setProcessing(true);
    try {
      const response = await adminGigService.processGigVerification({
        gig_id: gigId,
        action: 'APPROVE',
        verified_documents: documents.map(doc => doc.id)
      });

      if (response.success) {
        onVerificationComplete();
        onClose();
      } else {
        setError(response.error || 'Failed to approve gig');
      }
    } catch (err) {
      setError('Failed to approve gig');
      console.error('Error approving gig:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    const confirmReject = window.confirm('Are you sure you want to reject this gig? This action cannot be undone.');
    if (!confirmReject) return;

    setProcessing(true);
    try {
      const response = await adminGigService.processGigVerification({
        gig_id: gigId,
        action: 'REJECT',
        verified_documents: []
      });

      if (response.success) {
        onVerificationComplete();
        onClose();
      } else {
        setError(response.error || 'Failed to reject gig');
      }
    } catch (err) {
      setError('Failed to reject gig');
      console.error('Error rejecting gig:', err);
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Gig Verification</h2>
            <p className="text-slate-600 mt-1">Review and verify expert gig application</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading gig details...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 font-medium">{error}</p>
              <Button onClick={loadGigDetails} className="mt-4">Try Again</Button>
            </div>
          ) : gigDetails ? (
            <div className="p-6 space-y-8">
              {/* Expert Information */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Expert Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-slate-600">Expert Name</p>
                    <p className="font-semibold text-slate-900">{gigDetails.expert.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Email</p>
                    <p className="font-semibold text-slate-900">{gigDetails.expert.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Current Role</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      gigDetails.expert.role === 'expert' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {gigDetails.expert.role === 'expert' ? 'Existing Expert' : 'User → Expert Application'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Category</p>
                    <p className="font-semibold text-slate-900">{gigDetails.category.name}</p>
                  </div>
                </div>
              </div>

              {/* Gig Details */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Gig Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-slate-600">Hourly Rate</p>
                    <p className="font-semibold text-slate-900 flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {gigDetails.gig.hourly_rate.toLocaleString()} {gigDetails.gig.currency}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Experience</p>
                    <p className="font-semibold text-slate-900">{gigDetails.gig.experience_years} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Response Time</p>
                    <p className="font-semibold text-slate-900 flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {gigDetails.gig.response_time}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Availability</p>
                    <p className="font-semibold text-slate-900 flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {gigDetails.gig.availability_preferences}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Created</p>
                    <p className="font-semibold text-slate-900 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(gigDetails.gig.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Status</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      gigDetails.gig.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      gigDetails.gig.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {gigDetails.gig.status}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-slate-600">Service Description</p>
                  <p className="text-slate-900 mt-1">{gigDetails.gig.service_description}</p>
                </div>
              </div>

              {/* Documents Section */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document Verification
                  <span className="text-sm font-normal text-slate-600">
                    ({documents.filter(d => d.verified).length}/{documents.length} verified)
                  </span>
                </h3>
                
                {gigDetails.expert.role === 'user' && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertCircle className="h-5 w-5" />
                      <p className="font-medium">User Role Upgrade Required</p>
                    </div>
                    <p className="text-yellow-700 mt-1 text-sm">
                      This user is applying to become an expert. Verify their identity documents first, then gig-specific certificates.
                    </p>
                  </div>
                )}

                {documents.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">No documents uploaded for this gig</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {documents.map((document, index) => (
                      <div
                        key={document.id}
                        className={`border rounded-xl p-4 transition-all duration-200 ${
                          document.verified 
                            ? 'border-green-200 bg-green-50' 
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${
                              document.verified ? 'bg-green-100' : 'bg-slate-100'
                            }`}>
                              <FileText className={`h-5 w-5 ${
                                document.verified ? 'text-green-600' : 'text-slate-600'
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">
                                {'document_type' in document ? document.document_type.replace(/_/g, ' ') : 'Certificate Document'}
                                {gigDetails.expert.role === 'user' && index < (gigDetails.verificationDocuments?.length || 0) && (
                                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                    Identity Document
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-slate-600">
                                Uploaded: {new Date(document.uploaded_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewDocument('url' in document ? document.url : document.document_url)}
                              className="flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadDocument(
                                'url' in document ? document.url : document.document_url, 
                                'document_type' in document ? document.document_type : 'certificate'
                              )}
                              className="flex items-center gap-2"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => toggleDocumentVerification(document.id)}
                              className={`flex items-center gap-2 ${
                                document.verified
                                  ? 'bg-green-500 hover:bg-green-600 text-white'
                                  : 'bg-slate-500 hover:bg-slate-600 text-white'
                              }`}
                            >
                              <Check className="h-4 w-4" />
                              {document.verified ? 'Verified' : 'Mark as Verified'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {allDocumentsVerified ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">All documents verified</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Verify all documents to enable approval</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onClose} disabled={processing}>
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleReject}
                disabled={processing}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                {processing ? 'Processing...' : 'Reject'}
              </Button>
              <Button
                onClick={handleApprove}
                disabled={!allDocumentsVerified || processing}
                className="bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing...' : 'Approve Gig'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GigVerificationModal;