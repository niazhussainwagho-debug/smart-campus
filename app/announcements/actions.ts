"use server";

import { UserRole } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-helpers";
import {
  findAnnouncementsForViewer,
  type AnnouncementFilters,
} from "@/lib/announcements";
import { prisma } from "@/lib/prisma";

export type AnnouncementActionResult = {
  ok: boolean;
  message: string;
};

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
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

export async function fetchAnnouncementsAction(
  filters: AnnouncementFilters = {},
) {
  const user = await requireRole([
    UserRole.ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
  ]);
  return findAnnouncementsForViewer(user.role, user.id, filters);
}

export async function createAnnouncementAction(
  formData: FormData,
): Promise<AnnouncementActionResult> {
  const user = await requireRole([UserRole.ADMIN, UserRole.TEACHER]);
  const title = field(formData, "title");
  const message = field(formData, "message");
  const department = field(formData, "department");
  const semesterText = field(formData, "semester");
  const semester = semesterText ? Number(semesterText) : null;

  if (!title || !message) {
    return { ok: false, message: "Title and message are required." };
  }
  if (title.length > 160 || message.length > 5000) {
    return {
      ok: false,
      message: "Title must be at most 160 characters and message at most 5000.",
    };
  }
  if (
    (semesterText &&
      (!Number.isSafeInteger(semester) || semester === null || semester < 1)) ||
    (!department && semesterText)
  ) {
    return {
      ok: false,
      message: "Choose a department before selecting a target semester.",
    };
  }

  if (department) {
    const validTarget = await prisma.section.findFirst({
      where: {
        department,
        ...(semester === null ? {} : { semester }),
      },
      select: { id: true },
    });
    if (!validTarget) {
      return {
        ok: false,
        message: "The selected department and semester do not exist.",
      };
    }
  }

  try {
    await prisma.announcement.create({
      data: {
        title,
        message,
        department: department || null,
        semester,
        createdById: user.id,
      },
    });
  } catch (error) {
    logDatabaseError("Announcement creation", error);
    return {
      ok: false,
      message: "Failed to publish announcement. Please try again.",
    };
  }

  revalidatePath("/announcements");
  return { ok: true, message: "Announcement published." };
}

export async function deleteAnnouncementAction(
  formData: FormData,
): Promise<AnnouncementActionResult> {
  const user = await requireRole([
    UserRole.ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
  ]);
  const id = field(formData, "id");
  if (!id) {
    return { ok: false, message: "Announcement ID is required." };
  }

  const where =
    user.role === UserRole.ADMIN
      ? { id }
      : { id, createdById: user.id };

  try {
    const deleted = await prisma.announcement.deleteMany({ where });
    if (!deleted.count) {
      return {
        ok: false,
        message: "You may only delete announcements you created.",
      };
    }
  } catch (error) {
    logDatabaseError("Announcement deletion", error);
    return {
      ok: false,
      message: "Failed to delete announcement. Please try again.",
    };
  }

  revalidatePath("/announcements");
  return { ok: true, message: "Announcement deleted." };
}
