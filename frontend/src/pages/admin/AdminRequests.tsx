import React, { useState, useEffect } from 'react';
import { FileText, Users, UserCheck, Clock, Search, Filter, ChevronRight, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GigVerificationTableRow } from '@/types/gigVerification';
import adminGigService from '@/services/adminGigService';
import GigVerificationModal from '@/components/admin/GigVerificationModal';

const AdminRequests = () => {
  const [gigs, setGigs] = useState<GigVerificationTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGigId, setSelectedGigId] = useState<string | null>(null);

  useEffect(() => {
    loadGigVerificationData();
  }, []);

  const loadGigVerificationData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await adminGigService.getGigVerificationTable();
      if (response.success && response.data) {
        setGigs(response.data);
      } else {
        setError(response.error || 'Failed to load gig verification data');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error loading gig verification data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredGigs = gigs.filter(gig =>
    gig.expert_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gig.category_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleViewDetails = (gigId: string) => {
    setSelectedGigId(gigId);
  };

  const pendingCount = gigs.filter(g => g.status === 'PENDING').length;
  const approvedCount = gigs.filter(g => g.status === 'APPROVED').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Request Management
              </h1>
              <p className="text-slate-600 mt-1">Review and manage user and expert requests</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Pending Verifications</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{loading ? '...' : pendingCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-yellow-100">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Approved Gigs</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{loading ? '...' : approvedCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-100">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Gigs</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{loading ? '...' : gigs.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Processing Rate</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {loading ? '...' : gigs.length > 0 ? Math.round((approvedCount / gigs.length) * 100) : 0}%
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-100">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-slate-200">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by expert name or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={loadGigVerificationData}
                disabled={loading}
              >
                <Filter className="h-4 w-4" />
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <p className="text-red-800 font-medium">Error loading gig verification data</p>
            </div>
            <p className="text-red-600 mt-2">{error}</p>
            <Button 
              onClick={loadGigVerificationData}
              className="mt-4 bg-red-500 hover:bg-red-600"
              size="sm"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Gig Verification Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-xl font-semibold text-slate-900">Gig Verification Queue</h3>
            <p className="text-slate-600 text-sm mt-1">Review and verify expert gig applications</p>
          </div>
          
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading gig verification data...</p>
            </div>
          ) : filteredGigs.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 text-lg font-medium">No gigs found</p>
              <p className="text-slate-500 mt-1">
                {searchTerm ? 'Try adjusting your search criteria' : 'All gigs have been processed'}
              </p>
            </div>
          ) : (
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
                  {filteredGigs.map((gig) => (
                    <tr key={gig.gig_id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-100">
                            <UserCheck className="h-4 w-4 text-blue-600" />
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
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(gig.status)}`}>
                          {gig.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300"
                          onClick={() => handleViewDetails(gig.gig_id)}
                        >
                          <Eye className="h-4 w-4" />
                          Review Details
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Gig Verification Modal */}
        {selectedGigId && (
          <GigVerificationModal
            gigId={selectedGigId}
            isOpen={!!selectedGigId}
            onClose={() => setSelectedGigId(null)}
            onVerificationComplete={() => {
              loadGigVerificationData(); // Refresh the table
              setSelectedGigId(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AdminRequests;