import { UserRole } from "@/generated/prisma/enums";
import { DepartmentTimetableViewer } from "@/components/department-timetable-viewer";
import type {
  DepartmentSectionInfo,
  DepartmentTimetableSlot,
} from "@/components/department-timetable-viewer";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

function formatTime(value: Date): string {
  return value.toLocaleTimeString("en-GB", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function StudentTimetablePage() {
  const student = await requireRole(UserRole.STUDENT);

  const [enrollments, sections, rawSlots] = await Promise.all([
    prisma.enrollment.findMany({
      where: { studentId: student.id },
      select: { sectionId: true },
    }),
    prisma.section.findMany({
      orderBy: [{ department: "asc" }, { semester: "asc" }, { name: "asc" }],
    }),
    prisma.timetableSlot.findMany({
      include: {
        course: true,
        room: true,
        section: true,
        teacher: true,
        teachers: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
  ]);

  const userEnrolledSectionIds = enrollments.map((e) => e.sectionId);

  const sectionList: DepartmentSectionInfo[] = sections.map((s) => ({
    id: s.id,
    name: s.name,
    department: s.department,
    semester: s.semester,
  }));

  const slots: DepartmentTimetableSlot[] = rawSlots.map((slot) => ({
    id: slot.id,
    sectionId: slot.sectionId,
    department: slot.section.department,
    semester: slot.section.semester,
    dayOfWeek: slot.dayOfWeek,
    startTime: formatTime(slot.startTime),
    endTime: formatTime(slot.endTime),
    courseCode: slot.course.code,
    courseName: slot.course.name,
    roomName: slot.room.name,
    teacherName: [
      ...new Set([
        slot.teacher.name,
        ...slot.teachers.map((teacher) => teacher.name),
      ]),
    ].join(", "),
    teacherId: slot.teacherId,
    sectionName: slot.section.name,
  }));

  return (
    <DashboardShell
      badge="Student Schedule"
      role={UserRole.STUDENT}
      subtitle="Select any department to explore timetable schedules, or view your enrolled class routine."
      title="Academic Timetable"
      user={student}
    >
      <DepartmentTimetableViewer
        currentUserId={student.id}
        sections={sectionList}
        slots={slots}
        userEnrolledSectionIds={userEnrolledSectionIds}
        userRole={UserRole.STUDENT}
      />
    </DashboardShell>
  );
}
