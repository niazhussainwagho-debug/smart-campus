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

export default async function TeacherTimetablePage() {
  const teacher = await requireRole(UserRole.TEACHER);

  const [sections, rawSlots] = await Promise.all([
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

  const sectionList: DepartmentSectionInfo[] = sections.map((s) => ({
    id: s.id,
    name: s.name,
    department: s.department,
    semester: s.semester,
  }));

  const slots: DepartmentTimetableSlot[] = rawSlots.map((slot) => {
    const isPrimaryOrCoTeacher =
      slot.teacherId === teacher.id ||
      slot.teachers.some((t) => t.id === teacher.id);

    return {
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
          ...slot.teachers.map((assignedTeacher) => assignedTeacher.name),
        ]),
      ].join(", "),
      teacherId: isPrimaryOrCoTeacher ? teacher.id : slot.teacherId,
      sectionName: slot.section.name,
    };
  });

  return (
    <DashboardShell
      badge="Faculty Schedule"
      role={UserRole.TEACHER}
      subtitle="Select any department to inspect academic schedules or view your assigned lectures."
      title="Faculty Academic Timetable"
      user={teacher}
    >
      <DepartmentTimetableViewer
        currentUserId={teacher.id}
        sections={sectionList}
        slots={slots}
        userRole={UserRole.TEACHER}
      />
    </DashboardShell>
  );
}
