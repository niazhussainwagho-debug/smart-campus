CREATE TABLE "_TimetableSlotTeachers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX "_TimetableSlotTeachers_AB_unique" ON "_TimetableSlotTeachers"("A", "B");
CREATE INDEX "_TimetableSlotTeachers_B_index" ON "_TimetableSlotTeachers"("B");

ALTER TABLE "_TimetableSlotTeachers"
ADD CONSTRAINT "_TimetableSlotTeachers_A_fkey"
FOREIGN KEY ("A") REFERENCES "TimetableSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_TimetableSlotTeachers"
ADD CONSTRAINT "_TimetableSlotTeachers_B_fkey"
FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
