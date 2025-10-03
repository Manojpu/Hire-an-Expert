import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { auth } from "@/firebase/firebase";
import { signOut } from "firebase/auth";
import { Users, UserCheck, Calendar, DollarSign, Settings, LogOut, TrendingUp } from "lucide-react";
import StatCard from "@/components/admin/StatCard";
import AnalyticsChart from "@/components/admin/AnalyticsChart";
import DateFilter, { DateRange } from "@/components/admin/DateFilter";
import { analyticsService, AnalyticsFilters, DailyUserCount } from "@/services/analyticsService";
import { Button } from "@/components/ui/button";

type AnalyticsType = 'users' | 'experts' | 'gigs' | 'bookings';

const Admin = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalExperts: 0,
    totalGigs: 89, // Mock data for now
    totalBookings: 234, // Mock data for now
    loading: true
  });

  const [selectedAnalytics, setSelectedAnalytics] = useState<AnalyticsType>('users');
  const [chartData, setChartData] = useState<DailyUserCount[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [selectedPreset, setSelectedPreset] = useState('month');

  useEffect(() => {
    // Verify user is admin
    if (!loading && user && user.role !== 'admin') {
      navigate('/');
      return;
    }

    // Load admin statistics
    if (user && user.role === 'admin') {
      loadAdminStats();
      loadAnalyticsData('users'); // Default to users
    }
  }, [user, loading, navigate]);

  const loadAdminStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));
      const totalStats = await analyticsService.getTotalStats();
      
      setStats({
        totalUsers: totalStats.totalUsers,
        totalExperts: totalStats.totalExperts,
        totalGigs: 89, // These would come from other services
        totalBookings: 234,
        loading: false
      });
    } catch (error) {
      console.error('Error loading admin stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const loadAnalyticsData = async (type: AnalyticsType) => {
    if (type === 'gigs' || type === 'bookings') {
      // Mock data for now since these services aren't implemented yet
      setChartData([]);
      return;
    }

    try {
      setChartLoading(true);
      
      const filters: AnalyticsFilters = {};
      
      if (dateRange.from) {
        filters.startDate = dateRange.from.toISOString().split('T')[0];
      }
      if (dateRange.to) {
        filters.endDate = dateRange.to.toISOString().split('T')[0];
      }

      let response;
      if (type === 'users') {
        response = await analyticsService.getUserAnalytics({ ...filters, userType: 'all' });
      } else if (type === 'experts') {
        response = await analyticsService.getExpertAnalytics(filters);
      }

      if (response) {
        setChartData(response.data);
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
      setChartData([]);
    } finally {
      setChartLoading(false);
    }
  };

  const handleAnalyticsChange = (type: AnalyticsType) => {
    setSelectedAnalytics(type);
    loadAnalyticsData(type);
  };

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    loadAnalyticsData(selectedAnalytics);
  };

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    loadAnalyticsData(selectedAnalytics);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getChartTitle = () => {
    switch (selectedAnalytics) {
      case 'users': return 'Total Users Over Time';
      case 'experts': return 'Total Experts Over Time';
      case 'gigs': return 'Total Gigs Over Time';
      case 'bookings': return 'Total Bookings Over Time';
      default: return 'Analytics';
    }
  };

  const getChartColor = () => {
    switch (selectedAnalytics) {
      case 'users': return '#3b82f6'; // Blue
      case 'experts': return '#22c55e'; // Green
      case 'gigs': return '#f59e0b'; // Orange  
      case 'bookings': return '#8b5cf6'; // Purple
      default: return '#22c55e';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <TrendingUp className="mr-3 h-8 w-8 text-green-600" />
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Welcome back, {user.name || user.email}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={Users}
            loading={stats.loading}
            selected={selectedAnalytics === 'users'}
            onClick={() => handleAnalyticsChange('users')}
          />
          
          <StatCard
            title="Total Experts"
            value={stats.totalExperts}
            icon={UserCheck}
            loading={stats.loading}
            selected={selectedAnalytics === 'experts'}
            onClick={() => handleAnalyticsChange('experts')}
          />
          
          <StatCard
            title="Active Gigs"
            value={stats.totalGigs}
            icon={Calendar}
            loading={stats.loading}
            selected={selectedAnalytics === 'gigs'}
            onClick={() => handleAnalyticsChange('gigs')}
          />
          
          <StatCard
            title="Total Bookings"
            value={stats.totalBookings}
            icon={DollarSign}
            loading={stats.loading}
            selected={selectedAnalytics === 'bookings'}
            onClick={() => handleAnalyticsChange('bookings')}
          />
        </div>

        {/* Analytics Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 md:mb-0">
              Analytics Dashboard
            </h2>
            <DateFilter
              onDateRangeChange={handleDateRangeChange}
              onPresetChange={handlePresetChange}
              selectedPreset={selectedPreset}
            />
          </div>
          
          <AnalyticsChart
            data={chartData}
            title={getChartTitle()}
            color={getChartColor()}
            loading={chartLoading}
          />
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
            </div>
            <p className="text-gray-600 mb-4">Manage users, experts, and roles</p>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              Manage Users
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <Calendar className="h-8 w-8 text-green-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Gig Management</h3>
            </div>
            <p className="text-gray-600 mb-4">Review and manage expert gigs</p>
            <Button className="w-full bg-green-600 hover:bg-green-700">
              Manage Gigs
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Reports & Analytics</h3>
            </div>
            <p className="text-gray-600 mb-4">View platform analytics and reports</p>
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              View Reports
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <DollarSign className="h-8 w-8 text-orange-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Booking Management</h3>
            </div>
            <p className="text-gray-600 mb-4">Manage bookings and consultations</p>
            <Button className="w-full bg-orange-600 hover:bg-orange-700">
              Manage Bookings
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <Settings className="h-8 w-8 text-gray-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">System Settings</h3>
            </div>
            <p className="text-gray-600 mb-4">Configure platform settings</p>
            <Button className="w-full bg-gray-600 hover:bg-gray-700">
              System Settings
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <UserCheck className="h-8 w-8 text-indigo-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Support & Messages</h3>
            </div>
            <p className="text-gray-600 mb-4">Handle support requests and messages</p>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
              Support Center
            </Button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-900">New expert registration: John Doe</span>
                </div>
                <span className="text-xs text-gray-500">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-sm text-gray-900">Gig approved: Web Development Consultation</span>
                </div>
                <span className="text-xs text-gray-500">4 hours ago</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-sm text-gray-900">Booking completed: UI/UX Design Review</span>
                </div>
                <span className="text-xs text-gray-500">6 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
