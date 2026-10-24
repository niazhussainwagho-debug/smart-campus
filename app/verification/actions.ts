"use server";

import { auth } from "@/auth";
import { UserStatus } from "@/generated/prisma/enums";
import { revalidatePath } from "next/cache";
import { parseVerificationDocumentFiles } from "@/lib/verification-document-upload";
import {
  verificationDocumentGroupsByRole,
} from "@/lib/verification-documents";
import { prisma } from "@/lib/prisma";

export type VerificationUploadResult = {
  ok: boolean;
  message: string;
};

export async function submitMissingVerificationDocumentsAction(
  formData: FormData,
): Promise<VerificationUploadResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, message: "Sign in to upload verification documents." };
  }

  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      status: true,
      verificationDocuments: true,
      verificationDocumentFiles: {
        select: { documentType: true },
      },
    },
  });
  if (!account || account.status !== UserStatus.PENDING_VERIFICATION) {
    return {
      ok: false,
      message: "This account is not awaiting document verification.",
    };
  }

  const existingTypes = account.verificationDocumentFiles.map(
    ({ documentType }) => documentType,
  );
  const missingTypes = verificationDocumentGroupsByRole[account.role]
    .filter((group) => !group.some((type) => existingTypes.includes(type)))
    .flat();
  const parsedDocuments = await parseVerificationDocumentFiles(
    formData,
    account.role,
    missingTypes,
    existingTypes,
  );
  if (!parsedDocuments.ok) {
    return { ok: false, message: parsedDocuments.message };
  }

  const documentUrls = parsedDocuments.documents.map(
    ({ id }) => `/api/admin-documents/${id}`,
  );
  try {
    const submitted = await prisma.$transaction(async (transaction) => {
      const update = await transaction.user.updateMany({
        where: {
          id: account.id,
          status: UserStatus.PENDING_VERIFICATION,
          verificationDocuments: { equals: account.verificationDocuments },
        },
        data: {
          verificationDocuments: { push: documentUrls },
        },
      });
      if (update.count === 0) return false;

      await transaction.userVerificationDocument.createMany({
        data: parsedDocuments.documents.map((document) => ({
          ...document,
          userId: account.id,
        })),
      });
      return true;
    });

    if (!submitted) {
      return {
        ok: false,
        message:
          "Your documents were updated in another request. Refresh and check your verification status.",
      };
    }
  } catch (error) {
    const detail = error instanceof Error ? error.name : "UnknownError";
    console.error(`Verification document upload failed (${detail}).`);
    return {
      ok: false,
      message: "Could not save your documents. Please try again.",
    };
  }

  revalidatePath("/verification");
  revalidatePath("/admin/requests");
  return {
    ok: true,
    message:
      "Your missing documents were submitted. Your account is awaiting administrator review.",
  };
}
