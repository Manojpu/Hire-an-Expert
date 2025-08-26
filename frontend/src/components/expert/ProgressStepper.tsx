import React from 'react';

const steps = [
  'Basic Information',
  'Expertise & Services',
  'Qualifications',
  'Verification Documents',
  'Review & Submit'
];

const ProgressStepper: React.FC<{ current: number }> = ({ current }) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        {steps.map((s, i) => {
          const active = i === current;
          const done = i < current;
          return (
            <div key={s} className="flex-1 px-2">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${done ? 'bg-emerald-500 text-white' : active ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {i + 1}
                </div>
                <div className="ml-3 text-sm">
                  <div className={`font-medium ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{s}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="h-2 bg-gray-100 rounded overflow-hidden">
        <div className="h-2 bg-primary" style={{ width: `${(current / (steps.length - 1)) * 100}%` }} />
      </div>
    </div>
  );
};

export default ProgressStepper;
