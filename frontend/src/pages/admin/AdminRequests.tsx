import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FileText, Users, UserCheck, Clock, Search, Filter, ChevronRight, Eye, CheckCircle, PauseCircle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GigVerificationTableRow } from '@/types/gigVerification';
import adminGigService from '@/services/adminGigService';
import GigVerificationModal from '@/components/admin/GigVerificationModal';
import ActiveGigsReview from '@/components/admin/ActiveGigsReview';
import HoldGigsReview from '@/components/admin/HoldGigsReview';
import RejectedGigsReview from '@/components/admin/RejectedGigsReview';

// Configuration
const CACHE_DURATION = 10000; // 10 seconds cache

const HoldGigsView = () => (
  <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
    <PauseCircle className="h-16 w-16 text-blue-500 mx-auto mb-4" />
    <h2 className="text-2xl font-bold text-slate-900 mb-2">Gigs on Hold</h2>
    <p className="text-slate-600">Showing all gigs temporarily on hold</p>
    <div className="mt-6 text-sm text-slate-500">
      Component for displaying gigs on hold
    </div>
  </div>
);

const RejectedGigsView = () => (
  <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
    <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
    <h2 className="text-2xl font-bold text-slate-900 mb-2">Rejected Gigs</h2>
    <p className="text-slate-600">Showing all rejected gig applications</p>
    <div className="mt-6 text-sm text-slate-500">
      Component for displaying rejected gigs
    </div>
  </div>
);

type StatusType = 'pending' | 'active' | 'hold' | 'rejected';

// Cache for data
interface DataCache {
  data: any;
  timestamp: number;
}

const AdminRequests = () => {
  const [gigs, setGigs] = useState<GigVerificationTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGigId, setSelectedGigId] = useState<string | null>(null);
  
  // State for selected status tab (default is 'pending')
  const [selectedStatus, setSelectedStatus] = useState<StatusType>('pending');
  
  // State for status counts
  const [statusCounts, setStatusCounts] = useState({
    pending: 0,
    active: 0,
    hold: 0,
    rejected: 0
  });

  // State for active gigs
  const [activeGigs, setActiveGigs] = useState<any[]>([]);
  const [loadingActive, setLoadingActive] = useState(false);

  // State for hold gigs
  const [holdGigs, setHoldGigs] = useState<any[]>([]);
  const [loadingHold, setLoadingHold] = useState(false);

  // State for rejected gigs
  const [rejectedGigs, setRejectedGigs] = useState<any[]>([]);
  const [loadingRejected, setLoadingRejected] = useState(false);

  // Last refresh time for display
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  // Refs for caching
  const cacheRef = useRef<Map<string, DataCache>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Optimized cache check
  const getCachedData = useCallback((key: string): any | null => {
    const cached = cacheRef.current.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`✅ Cache hit for: ${key}`);
      return cached.data;
    }
    console.log(`❌ Cache miss for: ${key}`);
    return null;
  }, []);

  const setCachedData = useCallback((key: string, data: any) => {
    cacheRef.current.set(key, { data, timestamp: Date.now() });
  }, []);

  // Clear cache for specific status
  const clearCache = useCallback((status?: string) => {
    if (status) {
      cacheRef.current.delete(status);
      cacheRef.current.delete('counts');
    } else {
      cacheRef.current.clear();
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadGigVerificationData();
    loadStatusCounts();
    
    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Load data when tab changes
  useEffect(() => {
    loadDataForStatus(selectedStatus);
  }, [selectedStatus]);

  // Optimized function to load data for specific status
  const loadDataForStatus = useCallback(async (status: StatusType) => {
    switch (status) {
      case 'pending':
        await loadGigVerificationData();
        break;
      case 'active':
        await loadActiveGigs();
        break;
      case 'hold':
        await loadHoldGigs();
        break;
      case 'rejected':
        await loadRejectedGigs();
        break;
    }
    await loadStatusCounts();
  }, []);

  // Refresh current view
  const refreshCurrentView = useCallback(async () => {
    clearCache(selectedStatus);
    await loadDataForStatus(selectedStatus);
    setLastRefresh(new Date());
  }, [selectedStatus, loadDataForStatus, clearCache]);

  // Optimized status counts loader with caching
  const loadStatusCounts = async () => {
    try {
      // Check cache first
      const cached = getCachedData('counts');
      if (cached) {
        setStatusCounts(cached);
        return;
      }

      const response = await adminGigService.getGigStatusCounts();
      if (response.success && response.data) {
        setStatusCounts(response.data);
        setCachedData('counts', response.data);
      } else {
        console.error('Failed to load status counts:', response.error);
      }
    } catch (err) {
      console.error('Error loading status counts:', err);
    }
  };

  const loadGigVerificationData = async () => {
    // Check cache first
    const cached = getCachedData('pending');
    if (cached && !loading) {
      setGigs(cached);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await adminGigService.getGigVerificationTable();
      if (response.success && response.data) {
        setGigs(response.data);
        setCachedData('pending', response.data);
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

  const loadActiveGigs = async () => {
    // Check cache first
    const cached = getCachedData('active');
    if (cached && !loadingActive) {
      setActiveGigs(cached);
      return;
    }

    setLoadingActive(true);
    console.log('Loading active gigs...');
    try {
      const response = await adminGigService.getActiveGigTable();
      console.log('Active gigs response in AdminRequests:', response);
      if (response.success && response.data) {
        console.log('Setting active gigs, count:', response.data.length);
        setActiveGigs(response.data);
        setCachedData('active', response.data);
      } else {
        console.error('Failed to load active gigs:', response.error);
        setActiveGigs([]);
      }
    } catch (err) {
      console.error('Error loading active gigs:', err);
      setActiveGigs([]);
    } finally {
      setLoadingActive(false);
    }
  };

  const loadHoldGigs = async () => {
    // Check cache first
    const cached = getCachedData('hold');
    if (cached && !loadingHold) {
      setHoldGigs(cached);
      return;
    }

    setLoadingHold(true);
    console.log('Loading hold gigs...');
    try {
      const response = await adminGigService.getHoldGigTable();
      console.log('Hold gigs response in AdminRequests:', response);
      if (response.success && response.data) {
        console.log('Setting hold gigs, count:', response.data.length);
        setHoldGigs(response.data);
        setCachedData('hold', response.data);
      } else {
        console.error('Failed to load hold gigs:', response.error);
        setHoldGigs([]);
      }
    } catch (err) {
      console.error('Error loading hold gigs:', err);
      setHoldGigs([]);
    } finally {
      setLoadingHold(false);
    }
  };

  const loadRejectedGigs = async () => {
    // Check cache first
    const cached = getCachedData('rejected');
    if (cached && !loadingRejected) {
      setRejectedGigs(cached);
      return;
    }

    setLoadingRejected(true);
    console.log('Loading rejected gigs...');
    try {
      const response = await adminGigService.getRejectedGigTable();
      console.log('Rejected gigs response in AdminRequests:', response);
      if (response.success && response.data) {
        console.log('Setting rejected gigs, count:', response.data.length);
        setRejectedGigs(response.data);
        setCachedData('rejected', response.data);
      } else {
        console.error('Failed to load rejected gigs:', response.error);
        setRejectedGigs([]);
      }
    } catch (err) {
      console.error('Error loading rejected gigs:', err);
      setRejectedGigs([]);
    } finally {
      setLoadingRejected(false);
    }
  };

  const handleActiveGigUpdate = async () => {
    // Clear cache and refresh active gigs and status counts after an update
    clearCache('active');
    clearCache('counts');
    await loadActiveGigs();
    await loadStatusCounts();
    setLastRefresh(new Date());
  };

  const handleHoldGigUpdate = async () => {
    // Clear cache and refresh hold gigs and status counts after an update
    clearCache('hold');
    clearCache('counts');
    await loadHoldGigs();
    await loadStatusCounts();
    setLastRefresh(new Date());
  };

  const handleRejectedGigUpdate = async () => {
    // Clear cache and refresh rejected gigs and status counts after an update
    clearCache('rejected');
    clearCache('counts');
    await loadRejectedGigs();
    await loadStatusCounts();
    setLastRefresh(new Date());
  };

  const handlePendingGigUpdate = async () => {
    // Clear cache and refresh pending gigs and status counts after verification
    clearCache('pending');
    clearCache('counts');
    await loadGigVerificationData();
    await loadStatusCounts();
    setLastRefresh(new Date());
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

        {/* Stats Cards - Now clickable tabs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Pending Box */}
          <div 
            onClick={() => setSelectedStatus('pending')}
            className={`rounded-2xl shadow-lg p-6 border-2 cursor-pointer transition-all duration-200 hover:shadow-xl transform hover:scale-105 ${
              selectedStatus === 'pending' 
                ? 'bg-yellow-50 border-yellow-400 ring-2 ring-yellow-300' 
                : 'bg-white border-slate-200 hover:border-yellow-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${selectedStatus === 'pending' ? 'text-yellow-700' : 'text-slate-600'}`}>
                  Pending
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{loading ? '...' : statusCounts.pending}</p>
              </div>
              <div className={`p-3 rounded-xl ${selectedStatus === 'pending' ? 'bg-yellow-200' : 'bg-yellow-100'}`}>
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Active Box */}
          <div 
            onClick={() => setSelectedStatus('active')}
            className={`rounded-2xl shadow-lg p-6 border-2 cursor-pointer transition-all duration-200 hover:shadow-xl transform hover:scale-105 ${
              selectedStatus === 'active' 
                ? 'bg-green-50 border-green-400 ring-2 ring-green-300' 
                : 'bg-white border-slate-200 hover:border-green-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${selectedStatus === 'active' ? 'text-green-700' : 'text-slate-600'}`}>
                  Active
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{loading ? '...' : statusCounts.active}</p>
              </div>
              <div className={`p-3 rounded-xl ${selectedStatus === 'active' ? 'bg-green-200' : 'bg-green-100'}`}>
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Hold Box */}
          <div 
            onClick={() => setSelectedStatus('hold')}
            className={`rounded-2xl shadow-lg p-6 border-2 cursor-pointer transition-all duration-200 hover:shadow-xl transform hover:scale-105 ${
              selectedStatus === 'hold' 
                ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-300' 
                : 'bg-white border-slate-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${selectedStatus === 'hold' ? 'text-blue-700' : 'text-slate-600'}`}>
                  Hold
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{loading ? '...' : statusCounts.hold}</p>
              </div>
              <div className={`p-3 rounded-xl ${selectedStatus === 'hold' ? 'bg-blue-200' : 'bg-blue-100'}`}>
                <PauseCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Rejected Box */}
          <div 
            onClick={() => setSelectedStatus('rejected')}
            className={`rounded-2xl shadow-lg p-6 border-2 cursor-pointer transition-all duration-200 hover:shadow-xl transform hover:scale-105 ${
              selectedStatus === 'rejected' 
                ? 'bg-red-50 border-red-400 ring-2 ring-red-300' 
                : 'bg-white border-slate-200 hover:border-red-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${selectedStatus === 'rejected' ? 'text-red-700' : 'text-slate-600'}`}>
                  Rejected
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {loading ? '...' : statusCounts.rejected}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${selectedStatus === 'rejected' ? 'bg-red-200' : 'bg-red-100'}`}>
                <XCircle className="h-6 w-6 text-red-600" />
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
            <div className="flex gap-3 items-center">
              {/* Last Refresh Time */}
              <div className="text-xs text-slate-500 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                Last: {lastRefresh.toLocaleTimeString()}
              </div>

              {/* Manual Refresh Button */}
              <Button 
                variant="outline" 
                className="flex items-center gap-2 hover:bg-blue-50"
                onClick={refreshCurrentView}
                disabled={loading || loadingActive || loadingHold || loadingRejected}
              >
                <RefreshCw className={`h-4 w-4 ${(loading || loadingActive || loadingHold || loadingRejected) ? 'animate-spin' : ''}`} />
                Refresh
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

        {/* Conditional Rendering based on Selected Status */}
        {selectedStatus === 'pending' && (
          /* Original Gig Verification Table for Pending */
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">Pending Gig Verification Queue</h3>
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
                <p className="text-slate-600 text-lg font-medium">No pending gigs found</p>
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
        )}
        
        {selectedStatus === 'active' && (
          <ActiveGigsReview 
            gigs={activeGigs}
            loading={loadingActive}
            onGigUpdate={handleActiveGigUpdate}
          />
        )}
        {selectedStatus === 'hold' && (
          <HoldGigsReview 
            gigs={holdGigs}
            loading={loadingHold}
            onGigUpdate={handleHoldGigUpdate}
          />
        )}
        {selectedStatus === 'rejected' && (
          <RejectedGigsReview 
            gigs={rejectedGigs}
            loading={loadingRejected}
            onGigUpdate={handleRejectedGigUpdate}
          />
        )}

        {/* Gig Verification Modal */}
        {selectedGigId && (
          <GigVerificationModal
            gigId={selectedGigId}
            isOpen={!!selectedGigId}
            onClose={() => setSelectedGigId(null)}
            onVerificationComplete={() => {
              handlePendingGigUpdate(); // Use the new handler with cache clearing
              setSelectedGigId(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AdminRequests;