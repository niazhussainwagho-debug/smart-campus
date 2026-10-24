"use server";

import {
  AdminStatus,
  AdminVerificationDocumentType,
  UserRole,
  UserStatus,
} from "@/generated/prisma/enums";
import { revalidatePath } from "next/cache";
import { requireApprovedAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export type AdminReviewResult = {
  ok: boolean;
  message: string;
};

export async function reviewAdminRequestAction(
  formData: FormData,
): Promise<AdminReviewResult> {
  await requireApprovedAdmin();

  const idValue = formData.get("id");
  const decisionValue = formData.get("decision");
  const id = typeof idValue === "string" ? idValue.trim() : "";
  if (
    !id ||
    id.length > 191 ||
    (decisionValue !== AdminStatus.APPROVED &&
      decisionValue !== AdminStatus.REJECTED)
  ) {
    return {
      ok: false,
      message: "A valid request and decision are required.",
    };
  }

  const candidate = await prisma.user.findFirst({
    where: {
      id,
      role: { in: [UserRole.STUDENT, UserRole.TEACHER] },
      status: UserStatus.APPROVED,
      adminStatus: AdminStatus.PENDING,
    },
    select: {
      adminVerificationDocuments: {
        select: { documentType: true },
      },
    },
  });
  if (!candidate) {
    return {
      ok: false,
      message: "This admin request is no longer pending.",
    };
  }
  if (
    decisionValue === AdminStatus.APPROVED &&
    !Object.values(AdminVerificationDocumentType).every((documentType) =>
      candidate.adminVerificationDocuments.some(
        (document) => document.documentType === documentType,
      ),
    )
  ) {
    return {
      ok: false,
      message: "This request does not have all required documents.",
    };
  }

  const update = await prisma.user.updateMany({
    where: {
      id,
      role: { in: [UserRole.STUDENT, UserRole.TEACHER] },
      status: UserStatus.APPROVED,
      adminStatus: AdminStatus.PENDING,
    },
    data:
      decisionValue === AdminStatus.APPROVED
        ? {
            role: UserRole.ADMIN,
            status: UserStatus.APPROVED,
            adminStatus: AdminStatus.APPROVED,
          }
        : { adminStatus: AdminStatus.REJECTED },
  });
  if (update.count === 0) {
    return {
      ok: false,
      message: "This admin request was already reviewed.",
    };
  }

  revalidatePath("/admin/requests");
  revalidatePath("/admin");
  revalidatePath("/admin/timetable");
  revalidatePath("/admin-request");
  return {
    ok: true,
    message:
      decisionValue === AdminStatus.APPROVED
        ? "Admin request approved."
        : "Admin request rejected.",
  };
}
