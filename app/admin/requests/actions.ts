"use server";

import {
  AdminStatus,
  UserRole,
  UserStatus,
} from "@/generated/prisma/enums";
import { revalidatePath } from "next/cache";
import { requireApprovedAdmin } from "@/lib/auth-helpers";
import { isValidVerificationDocumentSet } from "@/lib/verification-documents";
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
      status: UserStatus.PENDING_VERIFICATION,
    },
    select: {
      role: true,
      verificationDocumentFiles: {
        select: { documentType: true },
      },
    },
  });
  if (!candidate) {
    return {
      ok: false,
      message: "This account is no longer pending verification.",
    };
  }
  const documentTypes = candidate.verificationDocumentFiles.map(
    ({ documentType }) => documentType,
  );
  if (!isValidVerificationDocumentSet(candidate.role, documentTypes)) {
    return {
      ok: false,
      message: "This request is missing required verification documents.",
    };
  }

  const update = await prisma.user.updateMany({
    where: {
      id,
      status: UserStatus.PENDING_VERIFICATION,
      role: candidate.role,
    },
    data:
      decisionValue === AdminStatus.APPROVED
        ? {
            status: UserStatus.APPROVED,
            ...(candidate.role === UserRole.ADMIN
              ? { adminStatus: AdminStatus.APPROVED }
              : {}),
          }
        : {
            status: UserStatus.REJECTED,
            ...(candidate.role === UserRole.ADMIN
              ? { adminStatus: AdminStatus.REJECTED }
              : {}),
          },
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
  revalidatePath("/verification");
  return {
    ok: true,
    message:
      decisionValue === AdminStatus.APPROVED
        ? "Account verification approved."
        : "Account verification rejected.",
  };
}
