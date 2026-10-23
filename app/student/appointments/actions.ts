"use server";

import {
  AppointmentStatus,
  NotificationType,
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
import { createUserNotification } from "@/lib/notifications";

export type StudentAppointmentActionResult = {
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

export async function requestAppointmentAction(
  formData: FormData,
): Promise<StudentAppointmentActionResult> {
  const student = await requireRole(UserRole.STUDENT);
  const teacherId = field(formData, "teacherId");
  const dateText = field(formData, "date");
  const startTimeText = field(formData, "startTime");
  const endTimeText = field(formData, "endTime");
  const note = field(formData, "note");
  const dateKey = appointmentDateKey(dateText);
  const weekday = dateKey ? appointmentWeekday(dateKey) : null;
  const startTime = parseTime(startTimeText);
  const endTime = parseTime(endTimeText);

  if (!teacherId || !dateKey || !weekday || !startTime || !endTime) {
    return {
      ok: false,
      message: "Please choose a professor, valid date, and valid start and end times.",
    };
  }

  if (note.length > 1000) {
    return {
      ok: false,
      message: "Note is too long; maximum 1000 characters allowed.",
    };
  }

  const teacher = await prisma.user.findFirst({
    where: { id: teacherId, role: UserRole.TEACHER },
    select: { id: true },
  });
  if (!teacher) {
    return { ok: false, message: "Selected professor was not found." };
  }

  const date = new Date(`${dateKey}T00:00:00.000Z`);
  const [availabilitySlots, existingAppointments, timetableSlots] =
    await Promise.all([
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
          OR: [{ teacherId }, { studentId: student.id }],
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

  const validation = validateAppointmentRequest(
    {
      studentId: student.id,
      teacherId,
      date,
      startTime,
      endTime,
    },
    availabilitySlots,
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
    await prisma.appointment.create({
      data: {
        studentId: student.id,
        teacherId,
        date,
        startTime,
        endTime,
        status: AppointmentStatus.PENDING,
        note: note || null,
      },
    });
  } catch (error) {
    logDatabaseError("Appointment request", error);
    return {
      ok: false,
      message: "Failed to send appointment request. Please try again.",
    };
  }

  await createUserNotification({
    userId: teacher.id,
    title: "New appointment request",
    message: `${student.name} requested an appointment on ${dateKey} at ${startTimeText}.`,
    type: NotificationType.APPOINTMENT,
    link: "/teacher/appointments",
  });

  revalidatePath("/student/appointments");
  revalidatePath("/teacher/appointments");
  return {
    ok: true,
    message: "Appointment request sent to the professor successfully.",
    timetableWarning,
  };
}

export async function cancelAppointmentAction(
  formData: FormData,
): Promise<StudentAppointmentActionResult> {
  const student = await requireRole(UserRole.STUDENT);
  const id = field(formData, "id");

  if (!id) {
    return { ok: false, message: "Appointment ID not provided." };
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id,
      studentId: student.id,
      status: AppointmentStatus.PENDING,
    },
    select: { teacherId: true },
  });
  if (!appointment) {
    return {
      ok: false,
      message: "You can only cancel your own pending appointment requests.",
    };
  }

  const result = await prisma.appointment.updateMany({
    where: {
      id,
      studentId: student.id,
      status: AppointmentStatus.PENDING,
    },
    data: { status: AppointmentStatus.REJECTED },
  });

  if (result.count === 0) {
    return {
      ok: false,
      message: "You can only cancel your own pending appointment requests.",
    };
  }

  await createUserNotification({
    userId: appointment.teacherId,
    title: "Appointment request cancelled",
    message: `${student.name} cancelled a pending appointment request.`,
    type: NotificationType.APPOINTMENT,
    link: "/teacher/appointments",
  });

  revalidatePath("/student/appointments");
  revalidatePath("/teacher/appointments");
  return { ok: true, message: "Pending appointment request cancelled." };
}
