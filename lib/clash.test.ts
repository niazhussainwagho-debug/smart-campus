import { describe, expect, it } from "vitest";
import { DayOfWeek } from "@/generated/prisma/enums";
import {
  checkTimetableClashes,
  type TimetableSlotForClash,
} from "@/lib/clash";

function slot(
  overrides: Partial<TimetableSlotForClash> = {},
): TimetableSlotForClash {
  return {
    id: "existing-1",
    courseId: "course-1",
    sectionId: "section-1",
    roomId: "room-1",
    teacherId: "teacher-1",
    dayOfWeek: DayOfWeek.MON,
    startTime: "09:00",
    endTime: "10:00",
    ...overrides,
  };
}

function proposed(
  overrides: Partial<TimetableSlotForClash> = {},
): TimetableSlotForClash {
  return slot({
    id: undefined,
    courseId: "course-2",
    sectionId: "section-2",
    roomId: "room-2",
    teacherId: "teacher-2",
    startTime: "09:30",
    endTime: "10:30",
    ...overrides,
  });
}

describe("checkTimetableClashes", () => {
  it("reports no clash when resources are different", () => {
    expect(checkTimetableClashes(proposed(), [slot()]).clashes).toEqual([]);
  });

  it("detects an exact time overlap", () => {
    const result = checkTimetableClashes(
      proposed({ startTime: "09:00", endTime: "10:00", roomId: "room-1" }),
      [slot()],
    );

    expect(result.clashes.map(({ type }) => type)).toContain("ROOM");
  });

  it("detects a partial time overlap", () => {
    const result = checkTimetableClashes(
      proposed({ startTime: "09:30", endTime: "10:30", roomId: "room-1" }),
      [slot()],
    );

    expect(result.clashes.map(({ type }) => type)).toContain("ROOM");
  });

  it("detects one slot fully inside another", () => {
    const result = checkTimetableClashes(
      proposed({ startTime: "09:15", endTime: "09:45", roomId: "room-1" }),
      [slot()],
    );

    expect(result.clashes.map(({ type }) => type)).toContain("ROOM");
  });

  it("does not treat back-to-back classes as a clash", () => {
    const result = checkTimetableClashes(
      proposed({ startTime: "10:00", endTime: "11:00", roomId: "room-1" }),
      [slot()],
    );

    expect(result.clashes).toEqual([]);
  });

  it("does not clash across different days", () => {
    const result = checkTimetableClashes(
      proposed({ dayOfWeek: DayOfWeek.TUE, roomId: "room-1" }),
      [slot()],
    );

    expect(result.clashes).toEqual([]);
  });

  it("reports room clashes separately", () => {
    const result = checkTimetableClashes(
      proposed({ roomId: "room-1" }),
      [slot()],
    );

    expect(result.clashes.map(({ type }) => type)).toEqual(["ROOM"]);
    expect(result.clashes[0]?.message).toContain("ROOM clash");
  });

  it("reports teacher clashes separately", () => {
    const result = checkTimetableClashes(
      proposed({ teacherId: "teacher-1" }),
      [slot()],
    );

    expect(result.clashes.map(({ type }) => type)).toEqual(["TEACHER"]);
    expect(result.clashes[0]?.message).toContain("TEACHER clash");
  });

  it("detects a clash with any assigned co-teacher", () => {
    const result = checkTimetableClashes(
      { ...proposed(), teacherIds: ["teacher-2"] },
      [
        {
          ...slot(),
          teacherId: "teacher-1",
          teacherIds: ["teacher-1", "teacher-2"],
        },
      ],
    );

    expect(result.clashes.map(({ type }) => type)).toEqual(["TEACHER"]);
  });

  it("reports section clashes separately", () => {
    const result = checkTimetableClashes(
      proposed({ sectionId: "section-1" }),
      [slot()],
    );

    expect(result.clashes.map(({ type }) => type)).toEqual(["SECTION"]);
    expect(result.clashes[0]?.message).toContain("SECTION clash");
  });

  it("reports multiple resource clashes at once", () => {
    const result = checkTimetableClashes(
      proposed({
        roomId: "room-1",
        teacherId: "teacher-1",
        sectionId: "section-1",
      }),
      [slot()],
    );

    expect(result.clashes.map(({ type }) => type)).toEqual([
      "ROOM",
      "TEACHER",
      "SECTION",
    ]);
  });

  it("ignores the slot being edited", () => {
    const current = slot();
    const result = checkTimetableClashes(
      proposed({
        id: current.id,
        roomId: current.roomId,
        teacherId: current.teacherId,
        sectionId: current.sectionId,
      }),
      [current],
      current.id,
    );

    expect(result.clashes).toEqual([]);
  });

  it("rejects a start time that is at or after the end time", () => {
    for (const [startTime, endTime] of [
      ["10:00", "10:00"],
      ["10:30", "10:00"],
    ]) {
      const result = checkTimetableClashes(
        proposed({ startTime, endTime }),
        [],
      );
      expect(result.timeError).toBeDefined();
      expect(result.clashes).toEqual([]);
    }
  });
});
