"use server";

import { AttendanceStatus, UserRole } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export type AttendanceStudentRow = {
  id: string;
  name: string;
  email: string;
  rollNo: string | null;
  status: AttendanceStatus | null;
};

export type AttendanceRosterResult =
  | { ok: true; students: AttendanceStudentRow[] }
  | { ok: false; message: string };

export type AttendanceActionResult = {
  ok: boolean;
  message: string;
};

function parseDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
    ? date
    : null;
}

function isAttendanceStatus(value: unknown): value is AttendanceStatus {
  return Object.values(AttendanceStatus).some((status) => status === value);
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

async function findTeacherSlot(slotId: string, teacherId: string) {
  return prisma.timetableSlot.findFirst({
    where: {
      id: slotId,
      OR: [
        { teacherId },
        { teachers: { some: { id: teacherId } } },
      ],
    },
    select: { id: true, sectionId: true, course: { select: { code: true } } },
  });
}

export async function loadAttendanceRosterAction(
  slotId: string,
  dateValue: string,
): Promise<AttendanceRosterResult> {
  const teacher = await requireRole(UserRole.TEACHER);
  const date = parseDate(dateValue);
  if (!slotId || !date) {
    return { ok: false, message: "Choose a valid class and attendance date." };
  }

  const slot = await findTeacherSlot(slotId, teacher.id);
  if (!slot) {
    return { ok: false, message: "Class not found or you are not assigned to teach it." };
  }

  try {
    const [enrollments, attendance] = await Promise.all([
      prisma.enrollment.findMany({
        where: {
          sectionId: slot.sectionId,
          student: { role: UserRole.STUDENT },
        },
        select: {
          student: {
            select: { id: true, name: true, email: true, rollNo: true },
          },
        },
        orderBy: { student: { name: "asc" } },
      }),
      prisma.attendance.findMany({
        where: { timetableSlotId: slot.id, date },
        select: { studentId: true, status: true },
      }),
    ]);
    const statuses = new Map(
      attendance.map((record) => [record.studentId, record.status]),
    );

    return {
      ok: true,
      students: enrollments.map(({ student }) => ({
        ...student,
        status: statuses.get(student.id) ?? null,
      })),
    };
  } catch (error) {
    logDatabaseError("Attendance roster load", error);
    return {
      ok: false,
      message: "Could not load the class roster. Please try again.",
    };
  }
}

export async function saveAttendanceAction(
  formData: FormData,
): Promise<AttendanceActionResult> {
  const teacher = await requireRole(UserRole.TEACHER);
  const slotId = formData.get("slotId");
  const dateValue = formData.get("date");
  const recordsValue = formData.get("records");

  if (
    typeof slotId !== "string" ||
    typeof dateValue !== "string" ||
    typeof recordsValue !== "string"
  ) {
    return { ok: false, message: "Attendance submission is incomplete." };
  }
  const date = parseDate(dateValue);
  if (!date) {
    return { ok: false, message: "Choose a valid attendance date." };
  }

  let requested: unknown;
  try {
    requested = JSON.parse(recordsValue);
  } catch {
    return { ok: false, message: "Attendance records are invalid." };
  }
  if (
    !Array.isArray(requested) ||
    requested.length === 0 ||
    requested.length > 500
  ) {
    return { ok: false, message: "No students are available to mark for this class." };
  }
  const recordMap = new Map<string, AttendanceStatus>();
  for (const item of requested) {
    if (
      typeof item !== "object" ||
      item === null ||
      !("studentId" in item) ||
      !("status" in item) ||
      typeof item.studentId !== "string" ||
      !isAttendanceStatus(item.status) ||
      recordMap.has(item.studentId)
    ) {
      return { ok: false, message: "Attendance records contain invalid entries." };
    }
    recordMap.set(item.studentId, item.status);
  }

  const slot = await findTeacherSlot(slotId, teacher.id);
  if (!slot) {
    return { ok: false, message: "Class not found or you are not assigned to teach it." };
  }

  try {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        sectionId: slot.sectionId,
        student: { role: UserRole.STUDENT },
      },
      select: { studentId: true },
    });
    const enrolledIds = new Set(enrollments.map(({ studentId }) => studentId));
    if (
      enrollments.length === 0 ||
      recordMap.size !== enrolledIds.size ||
      [...recordMap.keys()].some((studentId) => !enrolledIds.has(studentId))
    ) {
      return {
        ok: false,
        message: "The class roster changed. Reload it before saving attendance.",
      };
    }

    await prisma.$transaction(
      [...recordMap].map(([studentId, status]) =>
        prisma.attendance.upsert({
          where: {
            studentId_timetableSlotId_date: {
              studentId,
              timetableSlotId: slot.id,
              date,
            },
          },
          create: {
            studentId,
            sectionId: slot.sectionId,
            timetableSlotId: slot.id,
            courseCode: slot.course.code,
            date,
            status,
            markedBy: teacher.id,
          },
          update: { status, markedBy: teacher.id },
        }),
      ),
    );
  } catch (error) {
    logDatabaseError("Attendance save", error);
    return {
      ok: false,
      message: "Could not save attendance. Please try again.",
    };
  }

  revalidatePath("/teacher/attendance");
  revalidatePath("/student/attendance");
  return { ok: true, message: "Attendance saved successfully." };
}
