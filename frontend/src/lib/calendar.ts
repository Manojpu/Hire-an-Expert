import { Booking } from "@/lib/bookings";
import { format, addMinutes } from "date-fns";
import { MOCK_EXPERTS } from "@/data/mockExperts";

function toICSDate(d: Date) {
  // Format as YYYYMMDDTHHmmssZ
  return format(d, "yyyyMMdd'T'HHmmss'Z'");
}

export function getICalHref(booking: Booking) {
  const expert = MOCK_EXPERTS.find((e) => e.id === booking.expertId) || undefined;
  const start = new Date(booking.dateTime);
  const end = addMinutes(start, booking.duration);
  const uid = booking.id;
  const title = `${booking.service} with ${expert ? expert.name : 'Expert'}`;
  const description = booking.description || '';
  const location = booking.type === 'physical' ? (expert ? expert.title : '') : 'Online';

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//consultify-now//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(start)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return 'data:text/calendar;charset=utf8,' + encodeURIComponent(ics);
}

export function getGoogleCalendarUrl(booking: Booking) {
  const expert = MOCK_EXPERTS.find((e) => e.id === booking.expertId) || undefined;
  const start = new Date(booking.dateTime);
  const end = addMinutes(start, booking.duration);
  const title = `${booking.service} with ${expert ? expert.name : 'Expert'}`;
  const details = booking.description || '';
  const location = booking.type === 'physical' ? (expert ? expert.title : '') : 'Online';
  const dates = `${format(start, "yyyyMMdd'T'HHmmss'Z'")}/${format(end, "yyyyMMdd'T'HHmmss'Z'")}`;

  const paramsObj: Record<string, string> = {
    action: 'TEMPLATE',
    text: title,
    dates,
    details,
    location,
    sf: 'true',
    output: 'xml',
  };

  const params = new URLSearchParams(paramsObj);

  return `https://www.google.com/calendar/render?${params.toString()}`;
}
