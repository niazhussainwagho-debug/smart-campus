import { UserRole } from "@/generated/prisma/enums";
import { DashboardShell } from "@/components/dashboard-shell";
import { ProgramTimetable } from "@/components/program-timetable";
import { requireRole } from "@/lib/auth-helpers";
import {
  isTimetableBatchPart,
  isTimetableProgram,
  timetableBatchParts,
  timetablePrograms,
} from "@/lib/timetable-options";
import { prisma } from "@/lib/prisma";

export async function StudentProgramTimetablePage() {
  const student = await requireRole(UserRole.STUDENT);
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: student.id },
    select: {
      section: {
        select: {
          program: true,
          batchPart: true,
        },
      },
    },
    orderBy: [{ section: { program: "asc" } }, { section: { batchPart: "asc" } }],
  });
  const detectedSection = enrollments
    .map(({ section }) => section)
    .find(
      (section) =>
        isTimetableProgram(section.program) &&
        isTimetableBatchPart(section.batchPart),
    );
  const initialProgram = detectedSection
    ? isTimetableProgram(detectedSection.program)
      ? detectedSection.program
      : timetablePrograms[0].value
    : timetablePrograms[0].value;
  const initialBatchPart = detectedSection
    ? isTimetableBatchPart(detectedSection.batchPart)
      ? detectedSection.batchPart
      : timetableBatchParts[0]
    : timetableBatchParts[0];

  return (
    <DashboardShell
      badge="Student Schedule"
      role={UserRole.STUDENT}
      subtitle="Choose a program and part to view its complete weekly class schedule."
      title="Academic Timetable"
      user={student}
    >
      <ProgramTimetable
        autoDetected={Boolean(detectedSection)}
        initialBatchPart={initialBatchPart}
        initialProgram={initialProgram}
      />
    </DashboardShell>
  );
}
