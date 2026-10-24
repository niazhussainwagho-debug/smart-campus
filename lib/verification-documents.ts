import {
  UserRole,
  VerificationDocumentType,
} from "@/generated/prisma/enums";

export const verificationDocumentsByRole = {
  [UserRole.STUDENT]: [
    {
      type: VerificationDocumentType.STUDENT_ID_CARD,
      field: "studentIdCard",
      label: "Student ID Card",
    },
    {
      type: VerificationDocumentType.COLLEGE_ADMISSION_LETTER,
      field: "admissionLetter",
      label: "College Admission Letter",
    },
    {
      type: VerificationDocumentType.INTERMEDIATE_MARKS_SHEET,
      field: "intermediateMarksSheet",
      label: "Intermediate Marks Sheet",
    },
  ],
  [UserRole.TEACHER]: [
    {
      type: VerificationDocumentType.APPOINTMENT_ORDER,
      field: "appointmentOrder",
      label: "Official Appointment Order",
    },
    {
      type: VerificationDocumentType.FACULTY_JOINING_LETTER,
      field: "facultyJoiningLetter",
      label: "Faculty Joining Letter",
    },
  ],
  [UserRole.ADMIN]: [
    {
      type: VerificationDocumentType.DEGREE,
      field: "degree",
      label: "HEC-Verified Degree",
    },
    {
      type: VerificationDocumentType.GAZETTE_NOTIFICATION,
      field: "gazetteNotification",
      label: "Government Gazetted Notification",
    },
    {
      type: VerificationDocumentType.AUTHORIZATION_LETTER,
      field: "authorizationLetter",
      label: "Registrar / VC Authorization Letter",
    },
  ],
} as const satisfies Record<
  UserRole,
  readonly {
    type: VerificationDocumentType;
    field: string;
    label: string;
  }[]
>;

export const verificationDocumentGroupsByRole = {
  [UserRole.STUDENT]: [
    [
      VerificationDocumentType.STUDENT_ID_CARD,
      VerificationDocumentType.COLLEGE_ADMISSION_LETTER,
      VerificationDocumentType.INTERMEDIATE_MARKS_SHEET,
    ],
  ],
  [UserRole.TEACHER]: [
    [
      VerificationDocumentType.APPOINTMENT_ORDER,
      VerificationDocumentType.FACULTY_JOINING_LETTER,
    ],
  ],
  [UserRole.ADMIN]: [
    [VerificationDocumentType.DEGREE],
    [VerificationDocumentType.GAZETTE_NOTIFICATION],
    [VerificationDocumentType.AUTHORIZATION_LETTER],
  ],
} as const satisfies Record<
  UserRole,
  readonly (readonly VerificationDocumentType[])[]
>;

export function isValidVerificationDocumentSet(
  role: UserRole,
  types: readonly VerificationDocumentType[],
): boolean {
  return verificationDocumentGroupsByRole[role].every((group) =>
    group.some((type) => types.includes(type)),
  );
}

export const verificationDocumentLabels = new Map(
  Object.values(verificationDocumentsByRole)
    .flat()
    .map(({ type, label }) => [type, label]),
);
