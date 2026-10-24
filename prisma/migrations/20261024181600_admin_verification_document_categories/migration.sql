CREATE TYPE "AdminVerificationDocumentType" AS ENUM (
    'DEGREE',
    'GAZETTE_NOTIFICATION',
    'AUTHORIZATION_LETTER'
);

DELETE FROM "AdminVerificationDocument";

UPDATE "User"
SET "adminDocuments" = ARRAY[]::TEXT[],
    "adminStatus" = CASE
        WHEN "adminStatus" = 'PENDING' THEN 'REJECTED'::"AdminStatus"
        ELSE "adminStatus"
    END
WHERE cardinality("adminDocuments") > 0
   OR "adminStatus" = 'PENDING';

ALTER TABLE "AdminVerificationDocument"
ADD COLUMN "documentType" "AdminVerificationDocumentType" NOT NULL;

CREATE UNIQUE INDEX "AdminVerificationDocument_userId_documentType_key"
ON "AdminVerificationDocument"("userId", "documentType");
