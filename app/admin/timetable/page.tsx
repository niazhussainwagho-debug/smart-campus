import { AdminTimetableManager } from "@/components/admin-timetable-manager";
import { DashboardShell } from "@/components/dashboard-shell";
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

export default async function AdminTimetablePage() {
  const user = await requireRole([UserRole.ADMIN, UserRole.TEACHER]);
  const isAdmin = user.role === UserRole.ADMIN;

  const [courses, sections, rooms, teachers, slots] = await Promise.all([
    prisma.course.findMany({
      include: { teacher: { select: { name: true } } },
      orderBy: { code: "asc" },
    }),
    prisma.section.findMany({
      orderBy: [{ department: "asc" }, { semester: "asc" }, { name: "asc" }],
    }),
    prisma.room.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { role: UserRole.TEACHER },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.timetableSlot.findMany({
      include: {
        course: { select: { id: true, code: true, name: true } },
        section: { select: { id: true, name: true, department: true } },
        room: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
        teachers: { select: { id: true, name: true } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
  ]);

  return (
    <DashboardShell
      badge={isAdmin ? "Admin Operations" : "Faculty Operations"}
      role={user.role}
      subtitle="Manage courses, sections, rooms, and scheduled classes while preventing timetable clashes."
      title={isAdmin ? "Master Academic Timetable" : "Timetable Management"}
      user={user}
    >
      <AdminTimetableManager
        courses={courses.map((course) => ({
          id: course.id,
          code: course.code,
          name: course.name,
          teacherId: course.teacherId,
          teacherName: course.teacher.name,
        }))}
        rooms={rooms.map((room) => ({
          id: room.id,
          name: room.name,
          capacity: room.capacity,
        }))}
        sections={sections.map((section) => ({
          id: section.id,
          name: section.name,
          department: section.department,
          semester: section.semester,
        }))}
        slots={slots.map((slot) => ({
          id: slot.id,
          courseId: slot.courseId,
          sectionId: slot.sectionId,
          roomId: slot.roomId,
          teacherId: slot.teacherId,
          dayOfWeek: slot.dayOfWeek,
          startTime: formatTime(slot.startTime),
          endTime: formatTime(slot.endTime),
          courseLabel: `${slot.course.code} · ${slot.course.name}`,
          sectionLabel: `${slot.section.name} · ${slot.section.department}`,
          roomName: slot.room.name,
          teacherName: [
            ...new Set([
              slot.teacher.name,
              ...slot.teachers.map((teacher) => teacher.name),
            ]),
          ].join(", "),
        }))}
        teachers={teachers}
      />
    </DashboardShell>
  );
}
