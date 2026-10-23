import type { DayOfWeek } from "@/generated/prisma/enums";

export type CalendarScheduleSlot = {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  courseCode: string;
  courseName: string;
  roomName: string;
  teacherName: string;
  sectionName?: string;
  department?: string;
  semester?: number;
};

const dayIndexes: Record<DayOfWeek, number> = {
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
  SUN: 0,
};

const calendarDayCodes: Record<DayOfWeek, string> = {
  MON: "MO",
  TUE: "TU",
  WED: "WE",
  THU: "TH",
  FRI: "FR",
  SAT: "SA",
  SUN: "SU",
};

function parseTime(value: string): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) {
    throw new Error(`Invalid timetable time: ${value}`);
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

function getNextOccurrence(
  slot: CalendarScheduleSlot,
  now: Date,
): { start: Date; end: Date } {
  const startMinutes = parseTime(slot.startTime);
  let endMinutes = parseTime(slot.endTime);
  if (endMinutes === startMinutes) {
    throw new Error(`Class "${slot.courseCode}" has a zero-length duration.`);
  }
  if (endMinutes < startMinutes) endMinutes += 24 * 60;

  const start = new Date(now);
  const daysUntil = (dayIndexes[slot.dayOfWeek] - start.getDay() + 7) % 7;
  start.setDate(start.getDate() + daysUntil);
  start.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
  if (start <= now) start.setDate(start.getDate() + 7);

  const end = new Date(start);
  end.setMinutes(end.getMinutes() + endMinutes - startMinutes);
  return { start, end };
}

function formatLocalDateTime(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function getEventSummary(slot: CalendarScheduleSlot): string {
  return `${slot.courseCode} - ${slot.courseName}`;
}

function getEventDescription(slot: CalendarScheduleSlot): string {
  return [
    `Instructor: ${slot.teacherName}`,
    slot.sectionName ? `Section: ${slot.sectionName}` : "",
    slot.department ? `Department: ${slot.department}` : "",
    slot.semester ? `Semester: ${slot.semester}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function createIcsCalendar(
  slots: CalendarScheduleSlot[],
  now = new Date(),
): string {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const events = slots.map((slot) => {
    const { start, end } = getNextOccurrence(slot, now);
    return [
      "BEGIN:VEVENT",
      `UID:${encodeURIComponent(slot.id)}@smart-campus.local`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${formatLocalDateTime(start)}`,
      `DTEND:${formatLocalDateTime(end)}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${calendarDayCodes[slot.dayOfWeek]}`,
      `SUMMARY:${escapeIcsText(getEventSummary(slot))}`,
      `DESCRIPTION:${escapeIcsText(getEventDescription(slot))}`,
      `LOCATION:${escapeIcsText(slot.roomName)}`,
      "END:VEVENT",
    ].join("\r\n");
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Smart Campus//Schedule Export//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function createGoogleCalendarUrl(
  slot: CalendarScheduleSlot,
  now = new Date(),
): string {
  const { start, end } = getNextOccurrence(slot, now);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: getEventSummary(slot),
    dates: `${formatLocalDateTime(start)}/${formatLocalDateTime(end)}`,
    details: getEventDescription(slot),
    location: slot.roomName,
    recur: `RRULE:FREQ=WEEKLY;BYDAY=${calendarDayCodes[slot.dayOfWeek]}`,
    ctz: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
