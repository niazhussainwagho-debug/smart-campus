import { DashboardShell } from "@/components/dashboard-shell";
import {
  TeacherAttendanceManager,
  type TeacherAttendanceClass,
} from "@/components/teacher-attendance-manager";
import { UserRole } from "@/generated/prisma/enums";
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

function formatTime(value: Date): string {
  return value.toLocaleTimeString("en-GB", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function TeacherAttendancePage() {
  const teacher = await requireRole(UserRole.TEACHER);
  const timetableSlots = await prisma.timetableSlot.findMany({
    where: {
      OR: [
        { teacherId: teacher.id },
        { teachers: { some: { id: teacher.id } } },
      ],
    },
    include: {
      course: { select: { code: true, name: true } },
      section: { select: { name: true, department: true, semester: true } },
    },
    orderBy: [
      { section: { department: "asc" } },
      { section: { semester: "asc" } },
      { section: { name: "asc" } },
      { dayOfWeek: "asc" },
      { startTime: "asc" },
    ],
  });

  const classes: TeacherAttendanceClass[] = timetableSlots.map((slot) => ({
    id: slot.id,
    courseCode: slot.course.code,
    courseName: slot.course.name,
    department: slot.section.department,
    semester: slot.section.semester,
    sectionName: slot.section.name,
    dayOfWeek: slot.dayOfWeek,
    startTime: formatTime(slot.startTime),
    endTime: formatTime(slot.endTime),
  }));

  return (
    <DashboardShell
      badge="Faculty Portal"
      role={UserRole.TEACHER}
      subtitle="Take and review attendance for classes assigned to you."
      title="Student Attendance"
      user={teacher}
    >
      <TeacherAttendanceManager classes={classes} />
    </DashboardShell>
  );
}
