import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DateFilterProps {
  onDateRangeChange: (range: DateRange) => void;
  onPresetChange: (preset: string) => void;
  selectedPreset: string;
}

const DateFilter: React.FC<DateFilterProps> = ({
  onDateRangeChange,
  onPresetChange,
  selectedPreset
}) => {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined
  });
  const [isOpen, setIsOpen] = useState(false);

  const presets = [
    { label: 'Last 7 days', value: 'week' },
    { label: 'Last 30 days', value: 'month' },
    { label: 'Last 90 days', value: 'quarter' },
    { label: 'Last year', value: 'year' },
    { label: 'All time', value: 'all' },
    { label: 'Custom range', value: 'custom' }
  ];

  const handlePresetSelect = (preset: string) => {
    onPresetChange(preset);
    
    if (preset !== 'custom') {
      const now = new Date();
      let from: Date | undefined;
      
      switch (preset) {
        case 'week':
          from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        case 'all':
          from = undefined;
          break;
      }
      
      const range = { from, to: preset === 'all' ? undefined : now };
      setDateRange(range);
      onDateRangeChange(range);
    }
  };

  const handleCustomDateChange = (range: DateRange) => {
    setDateRange(range);
    onDateRangeChange(range);
  };

  const formatDateRange = () => {
    if (selectedPreset !== 'custom') {
      return presets.find(p => p.value === selectedPreset)?.label || 'Select period';
    }
    
    if (dateRange.from && dateRange.to) {
      return `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`;
    }
    
    return 'Select custom range';
  };

  return (
    <div className="flex items-center space-x-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-48">
            <Calendar className="mr-2 h-4 w-4" />
            {formatDateRange()}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {presets.map((preset) => (
            <DropdownMenuItem
              key={preset.value}
              onClick={() => handlePresetSelect(preset.value)}
              className={selectedPreset === preset.value ? 'bg-green-50 text-green-700' : ''}
            >
              {preset.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {selectedPreset === 'custom' && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline">
              Select dates
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="range"
              selected={{
                from: dateRange.from,
                to: dateRange.to
              }}
              onSelect={(range) => {
                if (range) {
                  handleCustomDateChange({
                    from: range.from,
                    to: range.to
                  });
                }
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default DateFilter;