import { describe, expect, it } from "vitest";
import {
  UserRole,
  VerificationDocumentType,
} from "@/generated/prisma/enums";
import {
  isValidVerificationDocumentSet,
  verificationDocumentsByRole,
} from "@/lib/verification-documents";

describe("verification documents", () => {
  it("accepts any one of the student admission documents", () => {
    expect(verificationDocumentsByRole[UserRole.STUDENT].map(({ type }) => type))
      .toEqual([
        VerificationDocumentType.STUDENT_ID_CARD,
        VerificationDocumentType.COLLEGE_ADMISSION_LETTER,
        VerificationDocumentType.INTERMEDIATE_MARKS_SHEET,
      ]);
    expect(
      isValidVerificationDocumentSet(UserRole.STUDENT, [
        VerificationDocumentType.STUDENT_ID_CARD,
      ]),
    ).toBe(true);
    expect(isValidVerificationDocumentSet(UserRole.STUDENT, [])).toBe(false);
  });

  it("accepts either official document for teacher verification", () => {
    expect(
      isValidVerificationDocumentSet(UserRole.TEACHER, [
        VerificationDocumentType.APPOINTMENT_ORDER,
      ]),
    ).toBe(true);
  });

  it("requires all three official documents for Admin verification", () => {
    expect(
      isValidVerificationDocumentSet(UserRole.ADMIN, [
        VerificationDocumentType.DEGREE,
        VerificationDocumentType.GAZETTE_NOTIFICATION,
        VerificationDocumentType.AUTHORIZATION_LETTER,
      ]),
    ).toBe(true);
    expect(
      isValidVerificationDocumentSet(UserRole.ADMIN, [
        VerificationDocumentType.DEGREE,
        VerificationDocumentType.GAZETTE_NOTIFICATION,
      ]),
    ).toBe(false);
  });
});
