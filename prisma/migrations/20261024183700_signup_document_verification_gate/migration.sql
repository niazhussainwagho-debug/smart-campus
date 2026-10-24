ALTER TYPE "UserStatus" ADD VALUE 'PENDING_VERIFICATION';

ALTER TYPE "AdminVerificationDocumentType"
RENAME TO "VerificationDocumentType";

ALTER TYPE "VerificationDocumentType" ADD VALUE 'STUDENT_ID_CARD';
ALTER TYPE "VerificationDocumentType" ADD VALUE 'COLLEGE_ADMISSION_LETTER';
ALTER TYPE "VerificationDocumentType" ADD VALUE 'INTERMEDIATE_MARKS_SHEET';
ALTER TYPE "VerificationDocumentType" ADD VALUE 'APPOINTMENT_ORDER';
ALTER TYPE "VerificationDocumentType" ADD VALUE 'FACULTY_JOINING_LETTER';

ALTER TABLE "AdminVerificationDocument"
RENAME TO "UserVerificationDocument";

ALTER TABLE "User"
RENAME COLUMN "adminDocuments" TO "verificationDocuments";

ALTER INDEX "AdminVerificationDocument_pkey"
RENAME TO "UserVerificationDocument_pkey";

ALTER INDEX "AdminVerificationDocument_userId_idx"
RENAME TO "UserVerificationDocument_userId_idx";

ALTER INDEX "AdminVerificationDocument_userId_documentType_key"
RENAME TO "UserVerificationDocument_userId_documentType_key";

ALTER TABLE "UserVerificationDocument"
RENAME CONSTRAINT "AdminVerificationDocument_userId_fkey"
TO "UserVerificationDocument_userId_fkey";
