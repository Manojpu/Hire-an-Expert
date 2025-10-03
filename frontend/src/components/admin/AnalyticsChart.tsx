import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { DailyUserCount } from '@/services/analyticsService';

interface AnalyticsChartProps {
  data: DailyUserCount[];
  title: string;
  color?: string;
  loading?: boolean;
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  data,
  title,
  color = '#22c55e',
  loading = false
}) => {
  if (loading) {
    return (
      <div className="w-full h-80 bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-80 bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No data available for the selected period
        </div>
      </div>
    );
  }

  // Format data for chart
  const chartData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }));

  return (
    <div className="w-full h-80 bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            stroke="#666"
            fontSize={12}
          />
          <YAxis 
            stroke="#666"
            fontSize={12}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="count"
            stroke={color}
            strokeWidth={3}
            dot={{ fill: color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: color }}
            name="Count"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalyticsChart;