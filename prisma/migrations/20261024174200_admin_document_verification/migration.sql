CREATE TYPE "AdminStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE "User"
ADD COLUMN "adminStatus" "AdminStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN "adminDocuments" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "User"
SET "adminStatus" = 'APPROVED'
WHERE "role" = 'ADMIN';

CREATE INDEX "User_adminStatus_idx" ON "User"("adminStatus");

CREATE TABLE "AdminVerificationDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "content" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminVerificationDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminVerificationDocument_userId_idx"
ON "AdminVerificationDocument"("userId");

ALTER TABLE "AdminVerificationDocument"
ADD CONSTRAINT "AdminVerificationDocument_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
