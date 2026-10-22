import type { DayOfWeek } from "@/generated/prisma/enums";

export type CampusStatusSlot = {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  roomId: string;
  roomName: string;
  courseCode: string;
  courseName: string;
  sectionName: string;
  department: string;
  teacherIds: string[];
  teacherNames: string[];
};

export type CampusStatusResource = {
  id: string;
  name: string;
};

export type CampusResourceStatus<T extends CampusStatusResource> = T & {
  departments: string[];
  activeSlots: CampusStatusSlot[];
};

function toMinutes(time: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function getCampusStatus(
  teachers: CampusStatusResource[],
  rooms: CampusStatusResource[],
  slots: CampusStatusSlot[],
  day: DayOfWeek,
  currentMinutes: number,
): {
  teachers: CampusResourceStatus<CampusStatusResource>[];
  rooms: CampusResourceStatus<CampusStatusResource>[];
} {
  const activeSlots = slots.filter((slot) => {
    if (slot.dayOfWeek !== day) return false;
    const start = toMinutes(slot.startTime);
    const end = toMinutes(slot.endTime);
    return start !== null && end !== null && start <= currentMinutes && currentMinutes < end;
  });

  return {
    teachers: teachers.map((teacher) => {
      const assignedSlots = slots.filter((slot) => slot.teacherIds.includes(teacher.id));
      return {
        ...teacher,
        departments: [...new Set(assignedSlots.map((slot) => slot.department))].sort(),
        activeSlots: activeSlots.filter((slot) => slot.teacherIds.includes(teacher.id)),
      };
    }),
    rooms: rooms.map((room) => {
      const assignedSlots = slots.filter((slot) => slot.roomId === room.id);
      return {
        ...room,
        departments: [...new Set(assignedSlots.map((slot) => slot.department))].sort(),
        activeSlots: activeSlots.filter((slot) => slot.roomId === room.id),
      };
    }),
  };
}
