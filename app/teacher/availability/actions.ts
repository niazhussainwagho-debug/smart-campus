"use server";

import { DayOfWeek, UserRole } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-helpers";
import { timeRangesOverlap } from "@/lib/clash";
import { prisma } from "@/lib/prisma";

export type AvailabilityActionResult = {
  ok: boolean;
  message: string;
};

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function isDayOfWeek(value: string): value is DayOfWeek {
  return Object.values(DayOfWeek).some((day) => day === value);
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

export async function addAvailabilityAction(
  formData: FormData,
): Promise<AvailabilityActionResult> {
  const teacher = await requireRole(UserRole.TEACHER);
  const dayOfWeek = field(formData, "dayOfWeek");
  const startTimeText = field(formData, "startTime");
  const endTimeText = field(formData, "endTime");
  const startTime = parseTime(startTimeText);
  const endTime = parseTime(endTimeText);

  if (!isDayOfWeek(dayOfWeek) || !startTime || !endTime) {
    return {
      ok: false,
      message: "Please provide a valid day, start time, and end time.",
    };
  }

  if (startTime >= endTime) {
    return {
      ok: false,
      message: "Start time must be earlier than end time.",
    };
  }

  const existingSlots = await prisma.availabilitySlot.findMany({
    where: { teacherId: teacher.id, dayOfWeek },
  });

  if (
    existingSlots.some((slot) =>
      timeRangesOverlap(startTime, endTime, slot.startTime, slot.endTime),
    )
  ) {
    return {
      ok: false,
      message: "This slot overlaps with an existing free slot on the same day.",
    };
  }

  try {
    await prisma.availabilitySlot.create({
      data: {
        teacherId: teacher.id,
        dayOfWeek,
        startTime,
        endTime,
      },
    });
  } catch (error) {
    logDatabaseError("Availability creation", error);
    return {
      ok: false,
      message: "Failed to save slot. Please try again.",
    };
  }

  revalidatePath("/teacher/availability");
  revalidatePath("/student/appointments");
  return { ok: true, message: "Availability slot added successfully." };
}

export async function deleteAvailabilityAction(
  formData: FormData,
): Promise<AvailabilityActionResult> {
  const teacher = await requireRole(UserRole.TEACHER);
  const id = field(formData, "id");

  if (!id) {
    return { ok: false, message: "Slot ID not provided for deletion." };
  }

  try {
    const result = await prisma.availabilitySlot.deleteMany({
      where: { id, teacherId: teacher.id },
    });

    if (result.count === 0) {
      return {
        ok: false,
        message: "Slot not found or you do not have permission to delete it.",
      };
    }
  } catch (error) {
    logDatabaseError("Availability deletion", error);
    return {
      ok: false,
      message: "Failed to delete slot. Please try again.",
    };
  }

  revalidatePath("/teacher/availability");
  revalidatePath("/student/appointments");
  return { ok: true, message: "Availability slot deleted successfully." };
}
