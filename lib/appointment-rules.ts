import type { AppointmentStatus, DayOfWeek } from "@/generated/prisma/enums";
import {
  timeRangeIsWithin,
  timeRangesOverlap,
} from "@/lib/clash";

export type AppointmentCandidate = {
  id?: string;
  studentId: string;
  teacherId: string;
  date: Date | string;
  startTime: Date | string;
  endTime: Date | string;
};

export type AvailabilityForAppointment = {
  dayOfWeek: DayOfWeek;
  startTime: Date | string;
  endTime: Date | string;
};

export type ExistingAppointment = AppointmentCandidate & {
  status: AppointmentStatus;
};

export type AppointmentValidationResult = {
  errors: string[];
};

const dayByUtcWeekday: DayOfWeek[] = [
  "SUN",
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
];

export function appointmentDateKey(value: Date | string): string | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
    ? value
    : null;
}

export function appointmentWeekday(date: Date | string): DayOfWeek | null {
  const key = appointmentDateKey(date);
  if (!key) {
    return null;
  }

  return dayByUtcWeekday[new Date(`${key}T00:00:00.000Z`).getUTCDay()]!;
}

/**
 * Validates one appointment against weekly availability and date-specific
 * active bookings. The optional `now` makes past-date checks deterministic
 * in tests. All time ranges use the same half-open overlap rule as timetable
 * clash detection, so a booking may start exactly when another one ends.
 * Pass `now` explicitly so the validation remains deterministic and pure.
 */
export function validateAppointmentRequest(
  proposed: AppointmentCandidate,
  availabilitySlots: readonly AvailabilityForAppointment[],
  existingAppointments: readonly ExistingAppointment[],
  now: Date,
): AppointmentValidationResult {
  const errors: string[] = [];
  const date = appointmentDateKey(proposed.date);
  const today = appointmentDateKey(now);

  if (!date) {
    return { errors: ["Please select a valid date."] };
  }

  if (today && date < today) {
    errors.push("Appointments cannot be booked for past dates.");
  }

  if (
    !timeRangeIsWithin(
      proposed.startTime,
      proposed.endTime,
      "00:00",
      "23:59:59.999",
    )
  ) {
    errors.push("End time must be after start time.");
  }

  const weekday = appointmentWeekday(date)!;
  const matchingAvailability = availabilitySlots.filter(
    (slot) => slot.dayOfWeek === weekday,
  );
  const insideAvailability = matchingAvailability.some((slot) =>
    timeRangeIsWithin(
      proposed.startTime,
      proposed.endTime,
      slot.startTime,
      slot.endTime,
    ),
  );

  if (!insideAvailability) {
    errors.push(
      "Selected time is outside the teacher's available office hours for this day.",
    );
  }

  for (const appointment of existingAppointments) {
    if (
      appointment.id === proposed.id ||
      appointment.status === "REJECTED" ||
      appointmentDateKey(appointment.date) !== date
    ) {
      continue;
    }

    const overlaps = timeRangesOverlap(
      proposed.startTime,
      proposed.endTime,
      appointment.startTime,
      appointment.endTime,
    );

    if (!overlaps) {
      continue;
    }

    if (appointment.teacherId === proposed.teacherId) {
      errors.push(
        "The teacher already has another appointment booked at this time.",
      );
    }

    if (appointment.studentId === proposed.studentId) {
      errors.push(
        "You already have another appointment booked at this time.",
      );
    }
  }

  return { errors: [...new Set(errors)] };
}

export function hasTimetableWarning(
  proposed: Pick<AppointmentCandidate, "startTime" | "endTime">,
  timetableSlots: readonly Pick<AppointmentCandidate, "startTime" | "endTime">[],
): boolean {
  return timetableSlots.some((slot) =>
    timeRangesOverlap(
      proposed.startTime,
      proposed.endTime,
      slot.startTime,
      slot.endTime,
    ),
  );
}
