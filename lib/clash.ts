import type { DayOfWeek } from "@/generated/prisma/enums";

export type ClashType = "ROOM" | "TEACHER" | "SECTION";

export type TimetableSlotForClash = {
  id?: string;
  courseId: string;
  sectionId: string;
  roomId: string;
  teacherId: string;
  teacherIds?: readonly string[];
  dayOfWeek: DayOfWeek;
  startTime: Date | string;
  endTime: Date | string;
};

export type TimetableClash = {
  type: ClashType;
  slotId?: string;
  message: string;
};

export type ClashCheckResult = {
  timeError?: string;
  clashes: TimetableClash[];
};

function timeToMilliseconds(time: Date | string): number | null {
  if (time instanceof Date) {
    if (Number.isNaN(time.getTime())) {
      return null;
    }

    return (
      ((time.getUTCHours() * 60 + time.getUTCMinutes()) * 60 +
        time.getUTCSeconds()) *
        1000 +
      time.getUTCMilliseconds()
    );
  }

  const match = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(time);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] ?? 0);
  const milliseconds = Number((match[4] ?? "").padEnd(3, "0"));

  if (hours > 23 || minutes > 59 || seconds > 59) {
    return null;
  }

  return ((hours * 60 + minutes) * 60 + seconds) * 1000 + milliseconds;
}

export function timeRangesOverlap(
  firstStart: Date | string,
  firstEnd: Date | string,
  secondStart: Date | string,
  secondEnd: Date | string,
): boolean {
  const firstStartMs = timeToMilliseconds(firstStart);
  const firstEndMs = timeToMilliseconds(firstEnd);
  const secondStartMs = timeToMilliseconds(secondStart);
  const secondEndMs = timeToMilliseconds(secondEnd);

  return (
    firstStartMs !== null &&
    firstEndMs !== null &&
    secondStartMs !== null &&
    secondEndMs !== null &&
    firstStartMs < secondEndMs &&
    firstEndMs > secondStartMs
  );
}

export function timeRangeIsWithin(
  innerStart: Date | string,
  innerEnd: Date | string,
  outerStart: Date | string,
  outerEnd: Date | string,
): boolean {
  const innerStartMs = timeToMilliseconds(innerStart);
  const innerEndMs = timeToMilliseconds(innerEnd);
  const outerStartMs = timeToMilliseconds(outerStart);
  const outerEndMs = timeToMilliseconds(outerEnd);

  return (
    innerStartMs !== null &&
    innerEndMs !== null &&
    outerStartMs !== null &&
    outerEndMs !== null &&
    innerStartMs < innerEndMs &&
    outerStartMs <= innerStartMs &&
    innerEndMs <= outerEndMs
  );
}

/**
 * Checks half-open time ranges, so a class ending at 10:00 does not clash
 * with another one starting at 10:00. Timetable times are compared as UTC
 * clock values because PostgreSQL `time` fields have no date or timezone.
 */
export function checkTimetableClashes(
  proposed: TimetableSlotForClash,
  existingSlots: readonly TimetableSlotForClash[],
  editingSlotId?: string,
): ClashCheckResult {
  const newStart = timeToMilliseconds(proposed.startTime);
  const newEnd = timeToMilliseconds(proposed.endTime);

  if (newStart === null || newEnd === null || newStart >= newEnd) {
    return {
      timeError: "Start time must be a valid time before end time.",
      clashes: [],
    };
  }

  const clashes: TimetableClash[] = [];

  for (const existing of existingSlots) {
    if (
      existing.dayOfWeek !== proposed.dayOfWeek ||
      existing.id === editingSlotId
    ) {
      continue;
    }

    if (
      !timeRangesOverlap(
        proposed.startTime,
        proposed.endTime,
        existing.startTime,
        existing.endTime,
      )
    ) {
      continue;
    }

    const conflictTypes: readonly [ClashType, boolean][] = [
      ["ROOM", proposed.roomId === existing.roomId],
      [
        "TEACHER",
        (proposed.teacherIds ?? [proposed.teacherId]).some((teacherId) =>
          (existing.teacherIds ?? [existing.teacherId]).includes(teacherId),
        ),
      ],
      ["SECTION", proposed.sectionId === existing.sectionId],
    ];

    for (const [type, isConflict] of conflictTypes) {
      if (isConflict) {
        clashes.push({
          type,
          slotId: existing.id,
          message: `${type} clash with another timetable slot.`,
        });
      }
    }
  }

  return { clashes };
}
