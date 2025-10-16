import React from "react";

export const DEFAULT_STEPS = [
  "Expertise & Services",
  "Qualifications",
  "Verification Documents",
  "Review & Submit",
];

interface ProgressStepperProps {
  current: number;
  steps?: string[];
}

const ProgressStepper: React.FC<ProgressStepperProps> = ({
  current,
  steps = DEFAULT_STEPS,
}) => {
  const totalSteps = steps.length;
  const clampedCurrent = totalSteps > 0 ? Math.min(current, totalSteps - 1) : 0;
  const progressPercent =
    totalSteps > 1
      ? Math.max(0, Math.min(100, (clampedCurrent / (totalSteps - 1)) * 100))
      : totalSteps === 1
      ? 100
      : 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        {steps.map((label, index) => {
          const active = index === clampedCurrent;
          const done = index < clampedCurrent;
          return (
            <div key={label} className="flex-1 px-2">
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                    done
                      ? "bg-emerald-500 text-white"
                      : active
                      ? "bg-primary text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {index + 1}
                </div>
                <div className="ml-3 text-sm">
                  <div
                    className={`font-medium ${
                      active ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="h-2 bg-gray-100 rounded overflow-hidden">
        <div
          className="h-2 bg-primary"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressStepper;
