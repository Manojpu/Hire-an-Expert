import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  loading?: boolean;
  selected?: boolean;
  onClick?: () => void;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  loading = false,
  selected = false,
  onClick,
  trend,
  className = ''
}) => {
  return (
    <div
      className={`
        bg-white rounded-lg shadow-md p-6 transition-all duration-200 
        ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-105' : ''}
        ${selected ? 'ring-2 ring-green-500 shadow-lg' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            {title}
          </h3>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {loading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
            ) : (
              value
            )}
          </div>
          {trend && !loading && (
            <div className={`text-sm mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </div>
          )}
        </div>
        <div className={`
          p-3 rounded-full 
          ${selected ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}
        `}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;