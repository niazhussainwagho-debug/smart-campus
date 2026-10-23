CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE');

CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "timetableSlotId" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "markedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Attendance_studentId_timetableSlotId_date_key"
ON "Attendance"("studentId", "timetableSlotId", "date");

CREATE INDEX "Attendance_studentId_date_idx"
ON "Attendance"("studentId", "date");

CREATE INDEX "Attendance_timetableSlotId_date_idx"
ON "Attendance"("timetableSlotId", "date");

CREATE INDEX "Attendance_markedBy_date_idx"
ON "Attendance"("markedBy", "date");

ALTER TABLE "Attendance"
ADD CONSTRAINT "Attendance_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Attendance"
ADD CONSTRAINT "Attendance_sectionId_fkey"
FOREIGN KEY ("sectionId") REFERENCES "Section"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Attendance"
ADD CONSTRAINT "Attendance_timetableSlotId_fkey"
FOREIGN KEY ("timetableSlotId") REFERENCES "TimetableSlot"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Attendance"
ADD CONSTRAINT "Attendance_markedBy_fkey"
FOREIGN KEY ("markedBy") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
