import React from 'react';

const EarningsChart: React.FC<{ data?: Array<{ date: string; revenue: number }> }> = ({ data = [] }) => {
  // Simple placeholder sparkline-like SVG chart to avoid extra deps
  const max = Math.max(1, ...data.map(d => d.revenue));
  const points = data.map((d, i) => {
    const x = (i / Math.max(1, data.length - 1)) * 100;
    const y = 100 - (d.revenue / max) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="bg-white border border-border rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">Revenue Trends</div>
      </div>
      <div className="h-40">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <polyline fill="none" stroke="#ec4899" strokeWidth={0.8} points={points} />
        </svg>
      </div>
    </div>
  );
};

export default EarningsChart;
