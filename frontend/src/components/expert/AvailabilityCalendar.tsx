import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AvailabilityRule,
  dayOfWeekNames,
  formatTimeSlot,
} from "@/types/availability";
import { X } from "lucide-react";
import { userServiceAPI } from "@/services/userService";
import { useAuth } from "@/context/auth/AuthContext";

interface AvailabilityCalendarProps {
  value: AvailabilityRule[];
  onChange: (rules: AvailabilityRule[]) => void;
  submitImmediately?: boolean; // Flag to control immediate submission to the API
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  value,
  onChange,
  submitImmediately = false, // Default to false for backward compatibility
}) => {
  const { user } = useAuth();
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("17:00");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Function to submit availability rules to the API
  const submitRulesToAPI = async (rules: AvailabilityRule[]) => {
    if (!user || !submitImmediately) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const token = await user.getIdToken();
      await userServiceAPI.setAvailabilityRules(rules, [], token);
      console.log("Availability rules saved successfully");
    } catch (error) {
      console.error("Failed to save availability rules:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to save availability rules"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTimeSlot = async () => {
    const newRule: AvailabilityRule = {
      day_of_week: selectedDay,
      start_time_utc: startTime,
      end_time_utc: endTime,
    };

    const updatedRules = [...value, newRule];
    onChange(updatedRules);

    if (submitImmediately) {
      await submitRulesToAPI(updatedRules);
    }
  };

  const removeTimeSlot = async (index: number) => {
    const updatedRules = [...value];
    updatedRules.splice(index, 1);
    onChange(updatedRules);

    if (submitImmediately) {
      await submitRulesToAPI(updatedRules);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Weekly Availability</CardTitle>
        <CardDescription>
          Set your recurring weekly availability for clients to book
          appointments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 mb-6">
          <div className="flex flex-col space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Day</label>
                <select
                  className="w-full h-10 px-3 py-2 rounded-md border border-input"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(Number(e.target.value))}
                >
                  {dayOfWeekNames.map((day, index) => (
                    <option key={index} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Start Time
                </label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  End Time
                </label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={addTimeSlot}
              type="button"
              className="mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Add Time Slot"}
            </Button>
          </div>

          {/* Show error message if API submission fails */}
          {error && <div className="mt-2 text-red-500 text-sm">{error}</div>}

          {/* Display selected time slots */}
          <div className="mt-4">
            <h3 className="font-medium mb-2">Your Weekly Schedule:</h3>
            {value.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No time slots added yet
              </p>
            ) : (
              <div className="space-y-2">
                {value.map((rule, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded-md"
                  >
                    <span>
                      {dayOfWeekNames[rule.day_of_week]}: {rule.start_time_utc}{" "}
                      - {rule.end_time_utc}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTimeSlot(index)}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AvailabilityCalendar;
