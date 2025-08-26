import React, { useState } from 'react';
import EarningsChart from '@/components/dashboard/EarningsChart';
import StatsCard from '@/components/dashboard/StatsCard';
import { mockExpertData } from '@/data/mockExpertData';

const EarningsAnalytics: React.FC = () => {
  const [range, setRange] = useState('30d');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Earnings & Analytics</h1>
        <div className="flex gap-2">
          <select value={range} onChange={(e) => setRange(e.target.value)} className="border rounded px-2 py-1">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button className="btn-outline">Export Report</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Total Earnings" value={`Rs. ${mockExpertData.earnings.total.toLocaleString()}`} change="+18.2%" changeType="positive" />
        <StatsCard title="This Month" value={`Rs. ${mockExpertData.earnings.month.toLocaleString()}`} change="+23.1%" changeType="positive" />
        <StatsCard title="Avg per Hour" value={`Rs. 2,850`} change="+5.7%" changeType="positive" />
        <StatsCard title="Total Hours" value={`156.5`} change="+12.3%" changeType="positive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EarningsChart data={mockExpertData.earnings.chartData} />
        <div className="bg-white border border-border rounded-lg p-4 shadow-sm">Other analytics placeholder</div>
      </div>

    </div>
  );
};

export default EarningsAnalytics;
