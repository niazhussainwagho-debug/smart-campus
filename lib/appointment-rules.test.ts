import { describe, expect, it } from "vitest";
import { AppointmentStatus, DayOfWeek } from "@/generated/prisma/enums";
import {
  validateAppointmentRequest,
  type AppointmentCandidate,
  type AvailabilityForAppointment,
  type ExistingAppointment,
} from "@/lib/appointment-rules";

const now = new Date("2026-10-03T12:00:00.000Z");

const availability: AvailabilityForAppointment[] = [
  {
    dayOfWeek: DayOfWeek.MON,
    startTime: "09:00",
    endTime: "12:00",
  },
];

function proposed(
  overrides: Partial<AppointmentCandidate> = {},
): AppointmentCandidate {
  return {
    studentId: "student-1",
    teacherId: "teacher-1",
    date: "2026-10-05",
    startTime: "10:00",
    endTime: "11:00",
    ...overrides,
  };
}

function existing(
  overrides: Partial<ExistingAppointment> = {},
): ExistingAppointment {
  return {
    id: "appointment-1",
    studentId: "student-2",
    teacherId: "teacher-1",
    date: "2026-10-05",
    startTime: "10:30",
    endTime: "11:30",
    status: AppointmentStatus.PENDING,
    ...overrides,
  };
}

describe("validateAppointmentRequest", () => {
  it("allows a booking contained in the teacher's free slot", () => {
    expect(
      validateAppointmentRequest(proposed(), availability, [], now).errors,
    ).toEqual([]);
  });

  it("rejects a booking outside the free slot", () => {
    const result = validateAppointmentRequest(
      proposed({ startTime: "08:30", endTime: "09:30" }),
      availability,
      [],
      now,
    );

    expect(result.errors).toContain(
      "Selected time is outside the teacher's available office hours for this day.",
    );
  });

  it("rejects a date whose weekday has no matching free slot", () => {
    const result = validateAppointmentRequest(
      proposed({ date: "2026-10-06" }),
      availability,
      [],
      now,
    );

    expect(result.errors).toContain(
      "Selected time is outside the teacher's available office hours for this day.",
    );
  });

  it("rejects overlap with another active teacher appointment", () => {
    const result = validateAppointmentRequest(
      proposed(),
      availability,
      [existing()],
      now,
    );

    expect(result.errors).toContain(
      "The teacher already has another appointment booked at this time.",
    );
  });

  it("rejects overlap with the student's own active appointment", () => {
    const result = validateAppointmentRequest(
      proposed(),
      availability,
      [existing({ teacherId: "teacher-2", studentId: "student-1" })],
      now,
    );

    expect(result.errors).toContain(
      "You already have another appointment booked at this time.",
    );
  });

  it("allows appointments scheduled back-to-back", () => {
    const result = validateAppointmentRequest(
      proposed({ startTime: "11:30", endTime: "12:00" }),
      availability,
      [existing({ startTime: "10:30", endTime: "11:30" })],
      now,
    );

    expect(result.errors).toEqual([]);
  });

  it("rejects dates in the past", () => {
    const result = validateAppointmentRequest(
      proposed({ date: "2026-10-02" }),
      availability,
      [],
      now,
    );

    expect(result.errors).toContain(
      "Appointments cannot be booked for past dates.",
    );
  });

  it("ignores rejected appointments when checking overlaps", () => {
    const result = validateAppointmentRequest(
      proposed(),
      availability,
      [existing({ status: AppointmentStatus.REJECTED })],
      now,
    );

    expect(result.errors).toEqual([]);
  });

  it("keeps rescheduled appointments reserved", () => {
    const result = validateAppointmentRequest(
      proposed(),
      availability,
      [existing({ status: AppointmentStatus.RESCHEDULED })],
      now,
    );

    expect(result.errors).toContain(
      "The teacher already has another appointment booked at this time.",
    );
  });
});
