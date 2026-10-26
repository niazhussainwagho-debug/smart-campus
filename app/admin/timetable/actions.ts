"use server";

import { DayOfWeek, UserRole } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import {
  checkTimetableClashes,
  type TimetableSlotForClash,
} from "@/lib/clash";
import { requireApprovedAdmin, requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import type { TimetableActionResult } from "@/lib/timetable-action-result";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function isDayOfWeek(value: string): value is DayOfWeek {
  return Object.values(DayOfWeek).some((day) => day === value);
}

function timeToDate(value: string): Date | null {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    return null;
  }

  return new Date(`1970-01-01T${value}:00.000Z`);
}

function isDuplicateError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function logDatabaseError(action: string, error: unknown): void {
  const detail =
    error instanceof Prisma.PrismaClientKnownRequestError
      ? error.code
      : error instanceof Error
        ? error.name
        : "UnknownError";
  console.error(`${action} failed (${detail}).`);
}

function revalidateTimetables(): void {
  revalidatePath("/admin/timetable");
  revalidatePath("/student/timetable");
  revalidatePath("/teacher/timetable");
}

export async function createCourseAction(
  formData: FormData,
): Promise<TimetableActionResult> {
  await requireApprovedAdmin();

  const code = field(formData, "code").toUpperCase();
  const name = field(formData, "name");
  const teacherId = field(formData, "teacherId");

  if (!code || !name || !teacherId) {
    return { ok: false, message: "All course fields are required." };
  }

  const teacher = await prisma.user.findFirst({
    where: { id: teacherId, role: UserRole.TEACHER },
    select: { id: true },
  });
  if (!teacher) {
    return { ok: false, message: "Selected teacher account is not valid." };
  }

  try {
    await prisma.course.create({
      data: { code, name, teacherId },
    });
  } catch (error) {
    if (isDuplicateError(error)) {
      return { ok: false, message: "This course code is already in use." };
    }
    logDatabaseError("Course creation", error);
    return { ok: false, message: "Failed to save course. Please try again." };
  }

  revalidateTimetables();
  return { ok: true, message: "Course added successfully." };
}

export async function createSectionAction(
  formData: FormData,
): Promise<TimetableActionResult> {
  await requireRole([UserRole.ADMIN, UserRole.TEACHER]);

  const name = field(formData, "name");
  const department = field(formData, "department");
  const program = field(formData, "program");
  const batchPart = field(formData, "batchPart");
  const semester = Number(field(formData, "semester"));

  if (
    !name ||
    !department ||
    !["BSIT", "BSSW", "BSDS"].includes(program) ||
    !["Part-I", "Part-II", "Part-III", "Part-IV"].includes(batchPart) ||
    !Number.isInteger(semester) ||
    semester < 1
  ) {
    return {
      ok: false,
      message: "Section name, department, program, batch, and a valid semester are required.",
    };
  }

  try {
    await prisma.section.create({
      data: { name, department, program, batchPart, semester },
    });
  } catch (error) {
    logDatabaseError("Section creation", error);
    return {
      ok: false,
      message: "Failed to save section. Please try again.",
    };
  }

  revalidateTimetables();
  return { ok: true, message: "Section added successfully." };
}

export async function createRoomAction(
  formData: FormData,
): Promise<TimetableActionResult> {
  await requireRole([UserRole.ADMIN, UserRole.TEACHER]);

  const name = field(formData, "name");
  const capacity = Number(field(formData, "capacity"));

  if (!name || !Number.isInteger(capacity) || capacity < 1) {
    return {
      ok: false,
      message: "Room name and positive capacity are required.",
    };
  }

  try {
    await prisma.room.create({ data: { name, capacity } });
  } catch (error) {
    if (isDuplicateError(error)) {
      return { ok: false, message: "This room name already exists." };
    }
    logDatabaseError("Room creation", error);
    return { ok: false, message: "Failed to save room. Please try again." };
  }

  revalidateTimetables();
  return { ok: true, message: "Room added successfully." };
}

export async function saveTimetableSlotAction(
  formData: FormData,
): Promise<TimetableActionResult> {
  await requireRole([UserRole.ADMIN, UserRole.TEACHER]);

  const id = field(formData, "id") || undefined;
  const courseId = field(formData, "courseId");
  const sectionId = field(formData, "sectionId");
  const roomId = field(formData, "roomId");
  const teacherId = field(formData, "teacherId");
  const dayOfWeek = field(formData, "dayOfWeek");
  const slotNumber = Number(field(formData, "slotNumber"));
  const startTimeText = field(formData, "startTime");
  const endTimeText = field(formData, "endTime");
  const startTime = timeToDate(startTimeText);
  const endTime = timeToDate(endTimeText);

  if (
    !courseId ||
    !sectionId ||
    !roomId ||
    !teacherId ||
    !isDayOfWeek(dayOfWeek) ||
    !Number.isInteger(slotNumber) ||
    slotNumber < 1 ||
    slotNumber > 7 ||
    !startTime ||
    !endTime
  ) {
    return {
      ok: false,
      message: "Course, section, room, teacher, day, period, and valid times are required.",
    };
  }

  const [course, section, room, teacher, editingSlot] = await Promise.all([
    prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, teacherId: true },
    }),
    prisma.section.findUnique({ where: { id: sectionId }, select: { id: true } }),
    prisma.room.findUnique({ where: { id: roomId }, select: { id: true } }),
    prisma.user.findFirst({
      where: { id: teacherId, role: UserRole.TEACHER },
      select: { id: true },
    }),
    id
      ? prisma.timetableSlot.findUnique({
          where: { id },
          select: {
            id: true,
            teacherId: true,
            teachers: { select: { id: true } },
          },
        })
      : null,
  ]);

  if (!course || !section || !room || !teacher || (id && !editingSlot)) {
    return {
      ok: false,
      message: "Selected course, section, room, or teacher no longer exists.",
    };
  }

  if (course.teacherId !== teacherId) {
    return {
      ok: false,
      message: "Please select the assigned teacher who teaches this course.",
    };
  }

  const teacherIds = [
    ...new Set([
      ...(editingSlot?.teachers
        .map((assignedTeacher) => assignedTeacher.id)
        .filter((assignedTeacherId) => assignedTeacherId !== editingSlot.teacherId) ??
        []),
      teacherId,
    ]),
  ];
  const proposed: TimetableSlotForClash = {
    id,
    courseId,
    sectionId,
    roomId,
    teacherId,
    teacherIds,
    dayOfWeek,
    startTime,
    endTime,
  };
  const existingSlots = await prisma.timetableSlot.findMany({
    where: { dayOfWeek },
    include: { teachers: { select: { id: true } } },
  });
  const slotsWithTeacherAssignments = existingSlots.map((slot) => ({
    ...slot,
    teacherIds: [
      ...new Set([slot.teacherId, ...slot.teachers.map(({ id }) => id)]),
    ],
  }));
  const clashResult = checkTimetableClashes(
    proposed,
    slotsWithTeacherAssignments,
    id,
  );

  if (clashResult.timeError) {
    return {
      ok: false,
      message: "Start time must be earlier than end time.",
    };
  }

  if (clashResult.clashes.length > 0) {
    return {
      ok: false,
      message: "Cannot save class; there is a timetable conflict:",
      clashes: clashResult.clashes,
    };
  }

  try {
    if (id) {
      await prisma.timetableSlot.update({
        where: { id },
        data: {
          courseId,
          sectionId,
          roomId,
          teacherId,
          dayOfWeek,
          slotNumber,
          startTime,
          endTime,
          teachers: { set: teacherIds.map((id) => ({ id })) },
        },
      });
    } else {
      await prisma.timetableSlot.create({
        data: {
          courseId,
          sectionId,
          roomId,
          teacherId,
          dayOfWeek,
          slotNumber,
          startTime,
          endTime,
          teachers: { connect: teacherIds.map((id) => ({ id })) },
        },
      });
    }
  } catch (error) {
    logDatabaseError("Timetable slot save", error);
    return {
      ok: false,
      message: "Failed to save timetable class. Please try again.",
    };
  }

  revalidateTimetables();
  return {
    ok: true,
    message: id ? "Timetable class updated successfully." : "Timetable class added successfully.",
  };
}

export async function deleteTimetableSlotAction(
  formData: FormData,
): Promise<TimetableActionResult> {
  await requireRole([UserRole.ADMIN, UserRole.TEACHER]);

  const id = field(formData, "id");
  if (!id) {
    return { ok: false, message: "Class ID not provided for deletion." };
  }

  try {
    await prisma.timetableSlot.delete({ where: { id } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return { ok: false, message: "This timetable class has already been deleted." };
    }
    logDatabaseError("Timetable slot delete", error);
    return {
      ok: false,
      message: "Failed to delete timetable class. Please try again.",
    };
  }

  revalidateTimetables();
  return { ok: true, message: "Timetable class deleted successfully." };
}
