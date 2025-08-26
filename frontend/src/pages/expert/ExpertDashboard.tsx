import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Overview from './Overview';
import BookingsManagement from './BookingsManagement';
import EarningsAnalytics from './EarningsAnalytics';
import ProfileManagement from './ProfileManagement';

const ExpertDashboardPage: React.FC = () => {
  return (
    <DashboardLayout>
      <Suspense fallback={<div>Loading dashboard...</div>}>
        <Routes>
          <Route index element={<Overview />} />
          <Route path="bookings" element={<BookingsManagement />} />
          <Route path="analytics" element={<EarningsAnalytics />} />
          <Route path="profile" element={<ProfileManagement />} />
        </Routes>
      </Suspense>
    </DashboardLayout>
  );
};

export default ExpertDashboardPage;
