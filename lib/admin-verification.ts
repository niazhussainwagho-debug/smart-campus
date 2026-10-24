import { AdminVerificationDocumentType } from "@/generated/prisma/enums";

export const adminVerificationDocuments = [
  {
    type: AdminVerificationDocumentType.DEGREE,
    field: "degree",
    label: "Official University Degree / Post-Graduate Degree (HEC verified)",
  },
  {
    type: AdminVerificationDocumentType.GAZETTE_NOTIFICATION,
    field: "gazetteNotification",
    label:
      "Government Gazetted Appointment Notification or Official Posting Order",
  },
  {
    type: AdminVerificationDocumentType.AUTHORIZATION_LETTER,
    field: "authorizationLetter",
    label: "Registrar / Vice Chancellor Signed Authorization Letter",
  },
] as const;
