import { describe, expect, it } from "vitest";
import { DayOfWeek } from "@/generated/prisma/enums";
import {
  getCampusStatus,
  type CampusStatusSlot,
} from "@/lib/campus-status";

const teachers = [
  { id: "teacher-1", name: "Ayesha Khan" },
  { id: "teacher-2", name: "Bilal Ahmed" },
];
const rooms = [
  { id: "room-1", name: "Room 201" },
  { id: "room-2", name: "Lab 2" },
];
const slots: CampusStatusSlot[] = [
  {
    id: "slot-1",
    dayOfWeek: DayOfWeek.MON,
    startTime: "09:00",
    endTime: "10:00",
    roomId: "room-1",
    roomName: "Room 201",
    courseCode: "CS101",
    courseName: "Data Structures",
    sectionName: "BSCS-3A",
    department: "Computer Science",
    teacherIds: ["teacher-1", "teacher-2"],
    teacherNames: ["Ayesha Khan", "Bilal Ahmed"],
  },
  {
    id: "slot-2",
    dayOfWeek: DayOfWeek.TUE,
    startTime: "09:00",
    endTime: "10:00",
    roomId: "room-2",
    roomName: "Lab 2",
    courseCode: "IT201",
    courseName: "Web Technologies",
    sectionName: "BSIT-3A",
    department: "Information Technology",
    teacherIds: ["teacher-1"],
    teacherNames: ["Ayesha Khan"],
  },
];

describe("getCampusStatus", () => {
  it("marks the primary teacher, co-teacher, and room busy during the slot", () => {
    const result = getCampusStatus(teachers, rooms, slots, DayOfWeek.MON, 570);

    expect(result.teachers[0]?.activeSlots.map((slot) => slot.courseName)).toEqual([
      "Data Structures",
    ]);
    expect(result.teachers[1]?.activeSlots.map((slot) => slot.courseName)).toEqual([
      "Data Structures",
    ]);
    expect(result.rooms[0]?.activeSlots.map((slot) => slot.roomName)).toEqual([
      "Room 201",
    ]);
    expect(result.rooms[1]?.activeSlots).toEqual([]);
  });

  it("treats slot start as busy and slot end as free", () => {
    const atStart = getCampusStatus(teachers, rooms, slots, DayOfWeek.MON, 540);
    const atEnd = getCampusStatus(teachers, rooms, slots, DayOfWeek.MON, 600);

    expect(atStart.teachers[0]?.activeSlots).toHaveLength(1);
    expect(atEnd.teachers[0]?.activeSlots).toHaveLength(0);
    expect(atEnd.rooms[0]?.activeSlots).toHaveLength(0);
  });

  it("does not mark a resource busy on another day or for malformed times", () => {
    const malformed = { ...slots[0]!, id: "bad-time", startTime: "9am" };
    const result = getCampusStatus(
      teachers,
      rooms,
      [...slots, malformed],
      DayOfWeek.WED,
      570,
    );

    expect(result.teachers.every((teacher) => teacher.activeSlots.length === 0)).toBe(
      true,
    );
    expect(result.rooms.every((room) => room.activeSlots.length === 0)).toBe(true);
  });

  it("includes scheduled departments for teacher and room filtering", () => {
    const result = getCampusStatus(teachers, rooms, slots, DayOfWeek.MON, 600);

    expect(result.teachers[0]?.departments).toEqual([
      "Computer Science",
      "Information Technology",
    ]);
    expect(result.rooms[1]?.departments).toEqual(["Information Technology"]);
  });
});
