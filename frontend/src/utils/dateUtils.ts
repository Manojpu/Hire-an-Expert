/**
 * Time zone utility functions for the application
 */

/**
 * Convert a date string or Date object to Sri Lanka time (Asia/Colombo)
 *
 * @param date Date string or Date object to convert
 * @param options Intl.DateTimeFormatOptions for formatting
 * @returns Formatted date string in Sri Lanka time
 */
export function toSriLankaTime(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  }
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  return dateObj.toLocaleString("en-US", {
    timeZone: "Asia/Colombo",
    ...options,
  });
}

/**
 * Get the time difference between local time and Sri Lanka time in hours
 * (Useful for displaying to users)
 */
export function getSriLankaTimeDifference(): number {
  // Sri Lanka is UTC+5:30
  const sriLankaOffset = 5.5; // 5 hours and 30 minutes

  // Get local time offset in hours
  const localOffset = -new Date().getTimezoneOffset() / 60;

  // Return the difference
  return sriLankaOffset - localOffset;
}

/**
 * Format a date for calendar integration
 * Uses RFC3339 format required by many calendar systems
 */
export function formatForCalendar(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toISOString();
}
