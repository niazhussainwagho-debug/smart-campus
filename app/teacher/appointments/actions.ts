"use server";

import {
  AppointmentStatus,
  UserRole,
} from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-helpers";
import {
  appointmentDateKey,
  appointmentWeekday,
  hasTimetableWarning,
  validateAppointmentRequest,
} from "@/lib/appointment-rules";
import { prisma } from "@/lib/prisma";

export type TeacherAppointmentActionResult = {
  ok: boolean;
  message: string;
  timetableWarning?: boolean;
};

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function parseTime(value: string): Date | null {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    return null;
  }
  return new Date(`1970-01-01T${value}:00.000Z`);
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

async function loadValidationData(
  teacherId: string,
  studentId: string,
  date: Date,
  weekday: NonNullable<ReturnType<typeof appointmentWeekday>>,
) {
  return Promise.all([
    prisma.availabilitySlot.findMany({
      where: { teacherId, dayOfWeek: weekday },
    }),
    prisma.appointment.findMany({
      where: {
        date,
        status: {
          in: [
            AppointmentStatus.PENDING,
            AppointmentStatus.APPROVED,
            AppointmentStatus.RESCHEDULED,
          ],
        },
        OR: [{ teacherId }, { studentId }],
      },
    }),
    prisma.timetableSlot.findMany({
      where: {
        dayOfWeek: weekday,
        OR: [
          { teacherId },
          { teachers: { some: { id: teacherId } } },
        ],
      },
      select: { startTime: true, endTime: true },
    }),
  ]);
}

export async function approveAppointmentAction(
  formData: FormData,
): Promise<TeacherAppointmentActionResult> {
  const teacher = await requireRole(UserRole.TEACHER);
  const id = field(formData, "id");

  if (!id) {
    return { ok: false, message: "Appointment ID was not provided." };
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id,
      teacherId: teacher.id,
      status: AppointmentStatus.PENDING,
    },
  });
  if (!appointment) {
    return {
      ok: false,
      message: "Pending request not found or you are not authorized.",
    };
  }

  const dateKey = appointmentDateKey(appointment.date);
  const weekday = dateKey ? appointmentWeekday(dateKey) : null;
  if (!dateKey || !weekday) {
    return { ok: false, message: "Invalid appointment request date." };
  }

  const date = new Date(`${dateKey}T00:00:00.000Z`);
  const [availability, existingAppointments] = await Promise.all([
    prisma.availabilitySlot.findMany({
      where: { teacherId: teacher.id, dayOfWeek: weekday },
    }),
    prisma.appointment.findMany({
      where: {
        date,
        status: {
          in: [
            AppointmentStatus.PENDING,
            AppointmentStatus.APPROVED,
            AppointmentStatus.RESCHEDULED,
          ],
        },
        OR: [{ teacherId: teacher.id }, { studentId: appointment.studentId }],
      },
    }),
  ]);
  const validation = validateAppointmentRequest(
    {
      id: appointment.id,
      studentId: appointment.studentId,
      teacherId: teacher.id,
      date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
    },
    availability,
    existingAppointments,
    new Date(),
  );

  if (validation.errors.length > 0) {
    return {
      ok: false,
      message: `Cannot approve: ${validation.errors.join(" ")}`,
    };
  }

  try {
    const result = await prisma.appointment.updateMany({
      where: {
        id: appointment.id,
        teacherId: teacher.id,
        status: AppointmentStatus.PENDING,
      },
      data: { status: AppointmentStatus.APPROVED },
    });
    if (result.count === 0) {
      return {
        ok: false,
        message: "The appointment was already updated by another session. Please refresh.",
      };
    }
  } catch (error) {
    logDatabaseError("Appointment approval", error);
    return {
      ok: false,
      message: "Failed to approve appointment. Please try again.",
    };
  }

  revalidatePath("/teacher/appointments");
  revalidatePath("/student/appointments");
  return { ok: true, message: "Appointment approved successfully." };
}

export async function rejectAppointmentAction(
  formData: FormData,
): Promise<TeacherAppointmentActionResult> {
  const teacher = await requireRole(UserRole.TEACHER);
  const id = field(formData, "id");

  if (!id) {
    return { ok: false, message: "Appointment ID was not provided." };
  }

  const result = await prisma.appointment.updateMany({
    where: {
      id,
      teacherId: teacher.id,
      status: AppointmentStatus.PENDING,
    },
    data: { status: AppointmentStatus.REJECTED },
  });

  if (result.count === 0) {
    return {
      ok: false,
      message: "Pending request not found or you are not authorized.",
    };
  }

  revalidatePath("/teacher/appointments");
  revalidatePath("/student/appointments");
  return { ok: true, message: "Appointment request rejected." };
}

export async function rescheduleAppointmentAction(
  formData: FormData,
): Promise<TeacherAppointmentActionResult> {
  const teacher = await requireRole(UserRole.TEACHER);
  const id = field(formData, "id");
  const dateText = field(formData, "date");
  const startTimeText = field(formData, "startTime");
  const endTimeText = field(formData, "endTime");
  const dateKey = appointmentDateKey(dateText);
  const weekday = dateKey ? appointmentWeekday(dateKey) : null;
  const startTime = parseTime(startTimeText);
  const endTime = parseTime(endTimeText);

  if (!id || !dateKey || !weekday || !startTime || !endTime) {
    return {
      ok: false,
      message: "Appointment ID, valid date, and valid start/end times are required.",
    };
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id,
      teacherId: teacher.id,
      status: {
        in: [
          AppointmentStatus.PENDING,
          AppointmentStatus.APPROVED,
          AppointmentStatus.RESCHEDULED,
        ],
      },
    },
  });
  if (!appointment) {
    return {
      ok: false,
      message: "Appointment not found or you are not authorized.",
    };
  }

  const date = new Date(`${dateKey}T00:00:00.000Z`);
  const [availability, existingAppointments, timetableSlots] =
    await loadValidationData(
      teacher.id,
      appointment.studentId,
      date,
      weekday,
    );
  const proposed = {
    id: appointment.id,
    studentId: appointment.studentId,
    teacherId: teacher.id,
    date,
    startTime,
    endTime,
  };
  const validation = validateAppointmentRequest(
    proposed,
    availability,
    existingAppointments,
    new Date(),
  );
  if (validation.errors.length > 0) {
    return { ok: false, message: validation.errors.join(" ") };
  }

  const timetableWarning = hasTimetableWarning(
    { startTime, endTime },
    timetableSlots,
  );

  try {
    const result = await prisma.appointment.updateMany({
      where: {
        id: appointment.id,
        teacherId: teacher.id,
        status: {
          in: [
            AppointmentStatus.PENDING,
            AppointmentStatus.APPROVED,
            AppointmentStatus.RESCHEDULED,
          ],
        },
      },
      data: {
        date,
        startTime,
        endTime,
        status: AppointmentStatus.RESCHEDULED,
      },
    });
    if (result.count === 0) {
      return {
        ok: false,
        message: "The appointment was already updated by another session. Please refresh.",
      };
    }
  } catch (error) {
    logDatabaseError("Appointment rescheduling", error);
    return {
      ok: false,
      message: "Failed to reschedule appointment. Please try again.",
    };
  }

  revalidatePath("/teacher/appointments");
  revalidatePath("/student/appointments");
  return {
    ok: true,
    message: "New appointment time saved successfully.",
    timetableWarning,
  };
}
