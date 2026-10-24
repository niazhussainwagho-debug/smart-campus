"use server";

import { randomUUID } from "node:crypto";
import { AdminStatus, UserRole, UserStatus } from "@/generated/prisma/enums";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export type AdminRequestResult = {
  ok: boolean;
  message: string;
};

const documentFields = [
  { field: "appointmentLetter", label: "Appointment Letter" },
  { field: "cnic", label: "CNIC" },
  { field: "idCard", label: "ID Card" },
] as const;
const maximumDocumentSize = 2 * 1024 * 1024;

function detectDocumentMimeType(bytes: Uint8Array): string | null {
  if (
    bytes.length >= 5 &&
    String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-"
  ) {
    return "application/pdf";
  }
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  return null;
}

function safeFilename(value: string, mimeType: string): string {
  const extension =
    mimeType === "application/pdf"
      ? ".pdf"
      : mimeType === "image/jpeg"
        ? ".jpg"
        : ".png";
  const filename = value
    .replace(/[^\w.-]/g, "_")
    .replace(/^\.+/, "")
    .slice(0, 100);
  return `${filename || "document"}${filename.toLowerCase().endsWith(extension) ? "" : extension}`;
}

export async function submitAdminRequestAction(
  formData: FormData,
): Promise<AdminRequestResult> {
  const user = await requireRole([UserRole.STUDENT, UserRole.TEACHER]);
  const uploadedDocuments: {
    id: string;
    filename: string;
    mimeType: string;
    content: Uint8Array<ArrayBuffer>;
  }[] = [];

  for (const documentField of documentFields) {
    const file = formData.get(documentField.field);
    if (!(file instanceof File) || file.size === 0) {
      return {
        ok: false,
        message: `Upload your ${documentField.label}.`,
      };
    }
    if (file.size > maximumDocumentSize) {
      return {
        ok: false,
        message: `Each document must be 2 MB or smaller. ${documentField.label} is too large.`,
      };
    }

    const content = new Uint8Array(await file.arrayBuffer());
    const mimeType = detectDocumentMimeType(content);
    if (!mimeType) {
      return {
        ok: false,
        message: `${documentField.label} must be a PDF, JPEG, or PNG file.`,
      };
    }

    uploadedDocuments.push({
      id: randomUUID(),
      filename: safeFilename(file.name, mimeType),
      mimeType,
      content,
    });
  }

  const documentUrls = uploadedDocuments.map(
    ({ id }) => `/api/admin-documents/${id}`,
  );
  try {
    const submitted = await prisma.$transaction(async (transaction) => {
      const update = await transaction.user.updateMany({
        where: {
          id: user.id,
          role: { in: [UserRole.STUDENT, UserRole.TEACHER] },
          status: UserStatus.APPROVED,
          adminStatus: { in: [AdminStatus.NONE, AdminStatus.REJECTED] },
        },
        data: {
          adminStatus: AdminStatus.PENDING,
          adminDocuments: documentUrls,
        },
      });
      if (update.count === 0) return false;

      await transaction.adminVerificationDocument.deleteMany({
        where: { userId: user.id },
      });
      await transaction.adminVerificationDocument.createMany({
        data: uploadedDocuments.map((document) => ({
          ...document,
          userId: user.id,
        })),
      });
      return true;
    });

    if (!submitted) {
      return {
        ok: false,
        message:
          "Your account cannot submit another request while one is pending or after admin approval.",
      };
    }
  } catch (error) {
    const detail = error instanceof Error ? error.name : "UnknownError";
    console.error(`Admin verification submission failed (${detail}).`);
    return {
      ok: false,
      message: "Could not submit your documents. Please try again.",
    };
  }

  revalidatePath("/admin-request");
  revalidatePath("/admin/requests");
  return {
    ok: true,
    message: "Your documents were submitted. Your request is pending review.",
  };
}
