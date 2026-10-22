"use server";

import { UserRole, UserStatus } from "@/generated/prisma/enums";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export type TeacherApprovalResult = {
  ok: boolean;
  message: string;
};

export async function updateTeacherRegistrationAction(
  formData: FormData,
): Promise<TeacherApprovalResult> {
  await requireRole(UserRole.ADMIN);

  const idValue = formData.get("id");
  const statusValue = formData.get("status");
  const id = typeof idValue === "string" ? idValue.trim() : "";
  if (
    !id ||
    (statusValue !== UserStatus.APPROVED && statusValue !== UserStatus.REJECTED)
  ) {
    return { ok: false, message: "A valid teacher and decision are required." };
  }

  try {
    const update = await prisma.user.updateMany({
      where: {
        id,
        role: UserRole.TEACHER,
        status: UserStatus.PENDING,
      },
      data: { status: statusValue },
    });
    if (!update.count) {
      return {
        ok: false,
        message: "This teacher request is no longer pending.",
      };
    }
  } catch (error) {
    const detail =
      error instanceof Error ? error.name : "UnknownError";
    console.error(`Teacher registration decision failed (${detail}).`);
    return {
      ok: false,
      message: "Could not update this request. Please try again.",
    };
  }

  revalidatePath("/admin/teachers");
  revalidatePath("/admin/timetable");
  return {
    ok: true,
    message:
      statusValue === UserStatus.APPROVED
        ? "Teacher registration approved."
        : "Teacher registration rejected.",
  };
}
