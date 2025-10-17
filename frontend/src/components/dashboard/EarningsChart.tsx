import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

interface ChartData {
  date: string;
  revenue: number;
}

interface EarningsChartProps {
  data?: ChartData[];
  period?: 'week' | 'month' | 'year';
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: {
      displayDate: string;
      revenue: number;
    };
  }>;
}

const EarningsChart: React.FC<EarningsChartProps> = ({ data = [], period = 'month' }) => {
  // Format the data for the chart
  const formattedData = data.map(item => ({
    ...item,
    displayDate: formatDate(item.date, period),
    revenueDisplay: `Rs. ${item.revenue.toLocaleString()}`
  }));

  // Custom tooltip with proper typing
  const CustomTooltip: React.FC<TooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900">
            {payload[0].payload.displayDate}
          </p>
          <p className="text-sm text-primary font-semibold mt-1">
            Revenue: Rs. {payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  // If no data, show empty state
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm font-medium">No revenue data available</p>
          <p className="text-gray-400 text-xs mt-1">Data will appear once you have completed bookings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={formattedData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="displayDate" 
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `Rs. ${value.toLocaleString()}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="revenue" 
            stroke="#ec4899" 
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRevenue)"
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Helper function to format dates based on period
function formatDate(dateString: string, period: 'week' | 'month' | 'year'): string {
  try {
    const date = parseISO(dateString);
    
    switch (period) {
      case 'week':
        return format(date, 'EEE, MMM d'); // "Mon, Jan 1"
      case 'month':
        return format(date, 'MMM d'); // "Jan 1"
      case 'year':
        return format(date, 'MMM yyyy'); // "Jan 2024"
      default:
        return format(date, 'MMM d');
    }
  } catch (error) {
    return dateString;
  }
}

export default EarningsChart;
