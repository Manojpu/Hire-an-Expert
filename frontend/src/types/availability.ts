import { UUID } from "crypto";

export interface AvailabilityRule {
  id?: string;
  day_of_week: number; // 0=Monday, 1=Tuesday, ..., 6=Sunday
  start_time_utc: string; // Format: "HH:MM"
  end_time_utc: string; // Format: "HH:MM"
}

export interface DateOverride {
  id?: string;
  unavailable_date: string; // ISO date string
}

// Helper functions for working with availability
export const dayOfWeekNames = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const formatTimeSlot = (rule: AvailabilityRule): string => {
  return `${dayOfWeekNames[rule.day_of_week]}: ${rule.start_time_utc} - ${
    rule.end_time_utc
  }`;
};

// Convert local time to UTC for storage
export const localToUtcTime = (time: string): string => {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(
    date.getUTCMinutes()
  ).padStart(2, "0")}`;
};

// Convert UTC time to local for display
export const utcToLocalTime = (time: string): string => {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setUTCHours(hours, minutes, 0, 0);
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
};
