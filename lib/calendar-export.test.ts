import { describe, expect, it } from "vitest";
import { DayOfWeek } from "@/generated/prisma/enums";
import {
  createGoogleCalendarUrl,
  createIcsCalendar,
  type CalendarScheduleSlot,
} from "@/lib/calendar-export";

const slot: CalendarScheduleSlot = {
  id: "slot-1",
  dayOfWeek: DayOfWeek.MON,
  startTime: "09:00",
  endTime: "10:30",
  courseCode: "CS101",
  courseName: "Data Structures",
  roomName: "Room 201",
  teacherName: "Ayesha Khan",
  department: "Computer Science",
  sectionName: "BSCS-3A",
  semester: 3,
};

describe("calendar export", () => {
  it("creates a weekly recurring ICS event with schedule details", () => {
    const calendar = createIcsCalendar(
      [slot],
      new Date(2026, 0, 5, 8, 0, 0),
    );

    expect(calendar).toContain("BEGIN:VCALENDAR");
    expect(calendar).toContain("DTSTART:20260105T090000");
    expect(calendar).toContain("DTEND:20260105T103000");
    expect(calendar).toContain("RRULE:FREQ=WEEKLY;BYDAY=MO");
    expect(calendar).toContain("SUMMARY:CS101 - Data Structures");
    expect(calendar).toContain("LOCATION:Room 201");
    expect(calendar).toContain("Instructor: Ayesha Khan");
    expect(calendar).toContain("Section: BSCS-3A");
  });

  it("moves the next event to the following week when today's class has passed", () => {
    const calendar = createIcsCalendar(
      [slot],
      new Date(2026, 0, 5, 9, 0, 0),
    );

    expect(calendar).toContain("DTSTART:20260112T090000");
  });

  it("creates an individual recurring Google Calendar link", () => {
    const url = new URL(
      createGoogleCalendarUrl(slot, new Date(2026, 0, 5, 8, 0, 0)),
    );

    expect(url.origin).toBe("https://calendar.google.com");
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
    expect(url.searchParams.get("text")).toBe("CS101 - Data Structures");
    expect(url.searchParams.get("location")).toBe("Room 201");
    expect(url.searchParams.get("recur")).toBe("RRULE:FREQ=WEEKLY;BYDAY=MO");
    expect(url.searchParams.get("dates")).toBe(
      "20260105T090000/20260105T103000",
    );
  });

  it("rejects malformed schedule times rather than exporting invalid events", () => {
    expect(() =>
      createIcsCalendar([{ ...slot, startTime: "9am" }]),
    ).toThrow("Invalid timetable time: 9am");
  });
});
