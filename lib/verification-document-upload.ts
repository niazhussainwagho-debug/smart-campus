import { randomUUID } from "node:crypto";
import {
  UserRole,
  type VerificationDocumentType,
} from "@/generated/prisma/enums";
import {
  isValidVerificationDocumentSet,
  verificationDocumentGroupsByRole,
  verificationDocumentLabels,
  verificationDocumentsByRole,
} from "@/lib/verification-documents";

export type UploadedVerificationDocument = {
  id: string;
  documentType: VerificationDocumentType;
  filename: string;
  mimeType: string;
  content: Uint8Array<ArrayBuffer>;
};

export type VerificationDocumentParseResult =
  | { ok: true; documents: UploadedVerificationDocument[] }
  | { ok: false; message: string };

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
  const hasMatchingExtension =
    (mimeType === "application/pdf" && /\.pdf$/i.test(filename)) ||
    (mimeType === "image/jpeg" && /\.jpe?g$/i.test(filename)) ||
    (mimeType === "image/png" && /\.png$/i.test(filename));
  return `${filename || "document"}${hasMatchingExtension ? "" : extension}`;
}

export async function parseVerificationDocumentFiles(
  formData: FormData,
  role: UserRole,
  requiredTypes: readonly VerificationDocumentType[] =
    verificationDocumentsByRole[role].map(({ type }) => type),
  existingTypes: readonly VerificationDocumentType[] = [],
): Promise<VerificationDocumentParseResult> {
  const documents: UploadedVerificationDocument[] = [];
  const requestedDocuments = verificationDocumentsByRole[role].filter(
    ({ type }) => requiredTypes.includes(type),
  );

  for (const documentType of requestedDocuments) {
    const file = formData.get(documentType.field);
    if (!(file instanceof File) || file.size === 0) {
      continue;
    }
    if (file.size > maximumDocumentSize) {
      return {
        ok: false,
        message: `Each document must be 2 MB or smaller. ${documentType.label} is too large.`,
      };
    }

    const content = new Uint8Array(await file.arrayBuffer());
    const mimeType = detectDocumentMimeType(content);
    if (!mimeType) {
      return {
        ok: false,
        message: `${documentType.label} must be a PDF, JPEG, or PNG file.`,
      };
    }

    documents.push({
      id: randomUUID(),
      documentType: documentType.type,
      filename: safeFilename(file.name, mimeType),
      mimeType,
      content,
    });
  }

  const submittedTypes = [
    ...existingTypes,
    ...documents.map(({ documentType }) => documentType),
  ];
  if (!isValidVerificationDocumentSet(role, submittedTypes)) {
    const missingGroups = verificationDocumentGroupsByRole[role].filter(
      (group) => !group.some((type) => submittedTypes.includes(type)),
    );
    const missingLabels = missingGroups
      .filter((group) => !group.some((type) => submittedTypes.includes(type)))
      .map((group) =>
        group
          .map((type) => verificationDocumentLabels.get(type))
          .filter((label) => label !== undefined)
          .join(" or "),
      );
    return {
      ok: false,
      message: `Submit a document for each requirement: ${missingLabels.join("; ")}.`,
    };
  }

  if (documents.length === 0) {
    return {
      ok: false,
      message: "There are no missing verification documents to upload.",
    };
  }

  return { ok: true, documents };
}
