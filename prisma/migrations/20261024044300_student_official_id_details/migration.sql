ALTER TABLE "User"
ADD COLUMN "rollNo" TEXT,
ADD COLUMN "fatherName" TEXT,
ADD COLUMN "surname" TEXT,
ADD COLUMN "category" TEXT;

CREATE UNIQUE INDEX "User_rollNo_key" ON "User"("rollNo");
