import React, { useState, useEffect } from 'react';
import { 
  X, 
  Eye, 
  Check, 
  User, 
  UserCheck,
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
  ShieldCheck,
  Briefcase,
  GraduationCap,
  Verified,
  Settings,
  Target,
  Sparkles
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
  const [userVerifiedAsExpert, setUserVerifiedAsExpert] = useState(false);
  const [currentStep, setCurrentStep] = useState<'user_verification' | 'gig_verification'>('user_verification');

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
        
        // Determine initial step based on user role
        if (response.data.expert.role === 'client') {
          setCurrentStep('user_verification');
          // For client users, show only verification documents initially
          if (response.data.verificationDocuments) {
            setDocuments(response.data.verificationDocuments.map(doc => ({ ...doc, verified: false })));
          }
        } else {
          setCurrentStep('gig_verification');
          setUserVerifiedAsExpert(true); // Expert users are already verified
          // For expert users, show gig certificates
          setDocuments(response.data.certificates.map(cert => ({ ...cert, verified: false })));
        }
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

  const handleVerifyUserAsExpert = async () => {
    if (!gigDetails) return;
    
    const allIdentityDocsVerified = documents.length > 0 && documents.every(doc => doc.verified);
    
    if (!allIdentityDocsVerified) {
      alert('Please verify all identity documents before promoting user to expert');
      return;
    }

    setProcessing(true);
    try {
      const response = await adminGigService.verifyUserAsExpert(gigDetails.expert.id);
      
      if (response.success) {
        setUserVerifiedAsExpert(true);
        // Update the expert role in the gigDetails
        setGigDetails(prev => prev ? {
          ...prev,
          expert: { ...prev.expert, role: 'expert' }
        } : null);
        
        // Move to gig verification step and load gig certificates
        setCurrentStep('gig_verification');
        setDocuments(gigDetails.certificates.map(cert => ({ ...cert, verified: false })));
        
        alert('User has been successfully verified as an expert! Now you can verify their gig.');
      } else {
        setError(response.error || 'Failed to verify user as expert');
      }
    } catch (err) {
      setError('Failed to verify user as expert');
      console.error('Error verifying user:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleApprove = async () => {
    // Only allow approval in gig verification step
    if (currentStep !== 'gig_verification') {
      alert('Please complete user verification first');
      return;
    }

    if (!allDocumentsVerified) {
      alert('Please verify all gig documents before approving');
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-slate-900/25 border border-slate-200/50">
        {/* Header */}
        <div className="p-8 border-b border-slate-300/50 bg-gradient-to-r from-slate-100 to-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 shadow-lg">
              <Shield className="h-6 w-6 text-slate-700" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Expert Verification</h2>
              <p className="text-slate-600 mt-1 font-medium">Professional review and verification system</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="h-10 w-10 rounded-xl hover:bg-slate-200/80 transition-all duration-200"
          >
            <X className="h-5 w-5 text-slate-600" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-slate-100/50">
          {loading ? (
            <div className="p-16 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-300 border-t-slate-600 mx-auto mb-6"></div>
              <p className="text-slate-600 text-lg font-medium">Loading verification details...</p>
            </div>
          ) : error ? (
            <div className="p-16 text-center">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-red-100 to-red-200 inline-block mb-6">
                <AlertCircle className="h-16 w-16 text-red-600 mx-auto" />
              </div>
              <p className="text-red-700 font-semibold text-lg mb-4">{error}</p>
              <Button 
                onClick={loadGigDetails} 
                className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-6 py-3 rounded-xl shadow-lg"
              >
                <Settings className="h-4 w-4 mr-2" />
                Retry Loading
              </Button>
            </div>
          ) : gigDetails ? (
            <div className="p-8 space-y-8">
              {/* Expert Information */}
              <div className="bg-gradient-to-br from-slate-200/80 to-slate-300/60 rounded-3xl p-8 shadow-xl shadow-slate-900/10 border border-slate-300/50">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-300 to-slate-400 shadow-lg">
                    <User className="h-6 w-6 text-slate-700" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Expert Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500 font-medium tracking-wide uppercase">Expert Name</p>
                    <p className="text-lg font-bold text-slate-800">{gigDetails.expert.name}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500 font-medium tracking-wide uppercase">Email</p>
                    <p className="text-lg font-bold text-slate-800">{gigDetails.expert.email}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500 font-medium tracking-wide uppercase">Current Role</p>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${
                        gigDetails.expert.role === 'expert' 
                          ? 'bg-gradient-to-br from-emerald-100 to-emerald-200' 
                          : 'bg-gradient-to-br from-blue-100 to-blue-200'
                      }`}>
                        {gigDetails.expert.role === 'expert' ? (
                          <ShieldCheck className="h-5 w-5 text-emerald-700" />
                        ) : (
                          <Target className="h-5 w-5 text-blue-700" />
                        )}
                      </div>
                      <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold shadow-lg ${
                        gigDetails.expert.role === 'expert' 
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-emerald-500/30' 
                          : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/30'
                      }`}>
                        {gigDetails.expert.role === 'expert' ? 'Verified Expert' : 'Applicant → Expert'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500 font-medium tracking-wide uppercase">Category</p>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200">
                        <Briefcase className="h-5 w-5 text-purple-700" />
                      </div>
                      <p className="text-lg font-bold text-slate-800">{gigDetails.category.name}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Client Verification Section - Only show for client users */}
              {gigDetails.expert.role === 'client' && currentStep === 'user_verification' && (
                <div className="bg-gradient-to-br from-slate-200/80 to-slate-300/60 rounded-3xl p-8 shadow-xl shadow-slate-900/10 border border-slate-300/50">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-300 to-blue-400 shadow-lg">
                        <UserCheck className="h-6 w-6 text-blue-800" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Identity Verification</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200">
                        <span className="text-sm font-bold text-blue-800 px-3 py-1">Step 1 of 2</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-100 to-blue-200 rounded-2xl border border-blue-300/50 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-500">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-blue-900 font-semibold">
                          <strong>Action Required:</strong> This user is applying to become an expert.
                        </p>
                        <p className="text-blue-800 text-sm mt-1">
                          Please verify their identity documents before proceeding to gig verification.
                        </p>
                      </div>
                    </div>
                  </div>

                  {documents.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-300 to-slate-400 inline-block mb-6 shadow-lg">
                        <FileText className="h-16 w-16 text-slate-700 mx-auto" />
                      </div>
                      <p className="text-slate-600 text-lg font-medium">No identity documents uploaded</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {documents.map((document) => (
                        <div
                          key={document.id}
                          className={`rounded-2xl p-6 transition-all duration-300 shadow-lg border ${
                            document.verified 
                              ? 'bg-gradient-to-br from-emerald-100 to-emerald-200 border-emerald-300/50 shadow-emerald-500/20' 
                              : 'bg-gradient-to-br from-slate-100 to-slate-200 border-slate-300/50 hover:from-slate-200 hover:to-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-xl shadow-lg ${
                                document.verified 
                                  ? 'bg-gradient-to-br from-emerald-300 to-emerald-400' 
                                  : 'bg-gradient-to-br from-slate-300 to-slate-400'
                              }`}>
                                <FileText className={`h-5 w-5 ${
                                  document.verified ? 'text-emerald-800' : 'text-slate-700'
                                }`} />
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-lg">
                                  {'document_type' in document ? document.document_type.replace(/_/g, ' ').toUpperCase() : 'IDENTITY DOCUMENT'}
                                </p>
                                <p className="text-sm text-slate-600 font-medium">
                                  Uploaded: {new Date(document.uploaded_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => viewDocument('url' in document ? document.url : document.document_url)}
                                className="border-slate-400 hover:bg-slate-300 rounded-xl px-4 py-2 font-semibold"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => toggleDocumentVerification(document.id)}
                                className={document.verified 
                                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30 rounded-xl px-4 py-2 font-semibold" 
                                  : "bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white shadow-lg shadow-slate-500/30 rounded-xl px-4 py-2 font-semibold"
                                }
                              >
                                {document.verified ? (
                                  <Verified className="h-4 w-4 mr-2" />
                                ) : (
                                  <Check className="h-4 w-4 mr-2" />
                                )}
                                {document.verified ? 'Verified' : 'Verify'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {documents.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-slate-300/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200">
                            <Target className="h-5 w-5 text-blue-700" />
                          </div>
                          <div>
                            <p className="text-slate-800 font-bold">Progress</p>
                            <p className="text-sm text-slate-600">
                              {documents.filter(d => d.verified).length} of {documents.length} documents verified
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={handleVerifyUserAsExpert}
                          disabled={processing || !documents.every(doc => doc.verified)}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-xl shadow-blue-500/30 rounded-xl px-6 py-3 font-bold transition-all duration-300"
                        >
                          <UserCheck className="h-5 w-5 mr-2" />
                          {processing ? 'Promoting...' : 'Promote to Expert'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Success Status for Client Verification */}
              {gigDetails.expert.role === 'expert' || userVerifiedAsExpert ? (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-900">Expert Status Confirmed</h3>
                      <p className="text-green-700 text-sm">This user has expert privileges and can create gigs.</p>
                    </div>
                  </div>
                </div>
              ) : null}

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
                      gigDetails.gig.status === 'PENDING' ? 'bg-green-100 text-green-800' :
                      gigDetails.gig.status === 'APPROVED' || gigDetails.gig.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
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

              {/* Gig Certificate Verification - Only show when in gig verification step */}
              {currentStep === 'gig_verification' && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                      <Award className="h-5 w-5 text-purple-600" />
                      Gig Certificate Verification
                    </h3>
                    <span className="text-sm px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-medium">
                      {gigDetails.expert.role === 'expert' ? 'Step 1 of 1' : 'Step 2 of 2'}
                    </span>
                  </div>
                  
                  <div className="mb-4 p-3 bg-purple-100 rounded-lg">
                    <p className="text-purple-800 text-sm">
                      <strong>{gigDetails.expert.role === 'expert' ? 'Review Required:' : 'Final Step:'}</strong> {gigDetails.expert.role === 'expert' ? 'This user is already an expert. Review and verify the certificates and documents related to this gig before approval.' : 'Review and verify the certificates and documents related to this gig before approval.'}
                    </p>
                  </div>

                  {documents.length === 0 ? (
                    <div className="text-center py-8">
                      <Award className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                      <p className="text-slate-600">No gig certificates uploaded</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {documents.map((document) => (
                        <div
                          key={document.id}
                          className={`border rounded-lg p-4 transition-all duration-200 ${
                            document.verified 
                              ? 'border-green-200 bg-green-50' 
                              : 'border-purple-200 bg-white hover:border-purple-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                document.verified ? 'bg-green-100' : 'bg-purple-100'
                              }`}>
                                <Award className={`h-4 w-4 ${
                                  document.verified ? 'text-green-600' : 'text-purple-600'
                                }`} />
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">
                                  Gig Certificate Document
                                </p>
                                <p className="text-xs text-slate-600">
                                  Uploaded: {new Date(document.uploaded_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => viewDocument('url' in document ? document.url : document.document_url)}
                                className="text-xs"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant={document.verified ? "default" : "outline"}
                                onClick={() => toggleDocumentVerification(document.id)}
                                className={document.verified ? "bg-green-600 hover:bg-green-700" : ""}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                {document.verified ? 'Verified' : 'Verify'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {documents.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-purple-200">
                      <div className="text-sm text-slate-600">
                        Progress: {documents.filter(d => d.verified).length} of {documents.length} certificates verified
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step Indicator */}
              {gigDetails.expert.role === 'client' && (
                <div className="flex items-center justify-center space-x-8 py-6">
                  <div className={`flex items-center space-x-2 ${
                    currentStep === 'user_verification' 
                      ? 'text-blue-600' 
                      : userVerifiedAsExpert 
                        ? 'text-green-600' 
                        : 'text-slate-400'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      currentStep === 'user_verification' 
                        ? 'bg-blue-100 border-2 border-blue-600' 
                        : userVerifiedAsExpert 
                          ? 'bg-green-100 border-2 border-green-600' 
                          : 'bg-slate-100 border-2 border-slate-400'
                    }`}>
                      {userVerifiedAsExpert ? <CheckCircle className="h-5 w-5" /> : '1'}
                    </div>
                    <span className="font-medium">User Verification</span>
                  </div>
                  
                  <div className={`w-16 h-1 rounded-full ${
                    userVerifiedAsExpert ? 'bg-green-600' : 'bg-slate-200'
                  }`}></div>
                  
                  <div className={`flex items-center space-x-2 ${
                    currentStep === 'gig_verification' 
                      ? 'text-blue-600' 
                      : userVerifiedAsExpert 
                        ? 'text-slate-600' 
                        : 'text-slate-400'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      currentStep === 'gig_verification' 
                        ? 'bg-blue-100 border-2 border-blue-600' 
                        : userVerifiedAsExpert 
                          ? 'bg-slate-100 border-2 border-slate-600' 
                          : 'bg-slate-100 border-2 border-slate-400'
                    }`}>
                      2
                    </div>
                    <span className="font-medium">Gig Verification</span>
                  </div>
                </div>
              )}
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
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Verify all documents to enable approval</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onClose} disabled={processing}>
                Cancel
              </Button>
              {currentStep === 'gig_verification' && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleReject}
                    disabled={processing}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    {processing ? 'Processing...' : 'Reject Gig'}
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={!allDocumentsVerified || processing}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {processing ? 'Processing...' : 'Approve Gig'}
                  </Button>
                </>
              )}
              {currentStep === 'user_verification' && (
                <div className="text-sm text-slate-600">
                  Complete user verification to proceed with gig approval
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GigVerificationModal;