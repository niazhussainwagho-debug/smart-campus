ALTER TABLE "Section"
ADD COLUMN "program" TEXT NOT NULL DEFAULT '',
ADD COLUMN "batchPart" TEXT NOT NULL DEFAULT '';

ALTER TABLE "TimetableSlot"
ADD COLUMN "slotNumber" INTEGER NOT NULL DEFAULT 1;

UPDATE "Section"
SET
  "program" = CASE "department"
    WHEN 'Software Engineering' THEN 'BSSW'
    WHEN 'Information Technology' THEN 'BSIT'
    WHEN 'Data Science' THEN 'BSDS'
    ELSE "department"
  END,
  "batchPart" = CASE "name"
    WHEN 'P-I' THEN 'Part-I'
    WHEN 'Part-I' THEN 'Part-I'
    WHEN 'P-II' THEN 'Part-II'
    WHEN 'Part-II' THEN 'Part-II'
    WHEN 'P-III' THEN 'Part-III'
    WHEN 'Part-III' THEN 'Part-III'
    WHEN 'P-IV' THEN 'Part-IV'
    WHEN 'Part-IV' THEN 'Part-IV'
    ELSE ''
  END;

UPDATE "TimetableSlot"
SET "slotNumber" = CASE to_char("startTime", 'HH24:MI')
  WHEN '08:30' THEN 1
  WHEN '09:15' THEN 2
  WHEN '10:00' THEN 3
  WHEN '10:45' THEN 4
  WHEN '11:30' THEN 5
  WHEN '12:15' THEN 6
  WHEN '13:00' THEN 7
  ELSE 1
END;

CREATE INDEX "Section_program_batchPart_idx" ON "Section"("program", "batchPart");
CREATE INDEX "TimetableSlot_sectionId_dayOfWeek_slotNumber_idx"
ON "TimetableSlot"("sectionId", "dayOfWeek", "slotNumber");
