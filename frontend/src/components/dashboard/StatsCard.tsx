import React from 'react';

const StatsCard: React.FC<{ title: string; value: React.ReactNode; change?: string; changeType?: 'positive'|'negative'|'neutral'; icon?: React.ReactNode }> = ({ title, value, change, changeType='neutral', icon }) => {
  return (
    <div className="bg-white border border-border rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{title}</div>
          <div className="text-2xl font-semibold mt-1">{value}</div>
        </div>
        {icon && <div className="text-primary">{icon}</div>}
      </div>
      {change && (
        <div className={`mt-2 text-sm ${changeType==='positive' ? 'text-emerald-600' : changeType==='negative' ? 'text-red-600' : 'text-muted-foreground'}`}>{change}</div>
      )}
    </div>
  );
};

export default StatsCard;
