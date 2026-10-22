import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CampusStatusTracker } from "@/components/campus-status-tracker";
import { DashboardShell } from "@/components/dashboard-shell";
import { UserRole } from "@/generated/prisma/enums";
import type { CampusStatusSlot } from "@/lib/campus-status";
import { getDashboardPath } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

function formatTime(value: Date): string {
  return value.toLocaleTimeString("en-GB", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function CampusStatusPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.STUDENT) {
    redirect(getDashboardPath(session.user.role));
  }

  const [teachers, rooms, timetableSlots] = await Promise.all([
    prisma.user.findMany({
      where: { role: UserRole.TEACHER },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.room.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.timetableSlot.findMany({
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        roomId: true,
        room: { select: { name: true } },
        course: { select: { code: true, name: true } },
        section: { select: { name: true, department: true } },
        teacherId: true,
        teacher: { select: { name: true } },
        teachers: { select: { id: true, name: true } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
  ]);

  const slots: CampusStatusSlot[] = timetableSlots.map((slot) => {
    const assignedTeachers = [
      { id: slot.teacherId, name: slot.teacher.name },
      ...slot.teachers,
    ];
    const uniqueTeachers = [
      ...new Map(assignedTeachers.map((teacher) => [teacher.id, teacher])).values(),
    ];

    return {
      id: slot.id,
      dayOfWeek: slot.dayOfWeek,
      startTime: formatTime(slot.startTime),
      endTime: formatTime(slot.endTime),
      roomId: slot.roomId,
      roomName: slot.room.name,
      courseCode: slot.course.code,
      courseName: slot.course.name,
      sectionName: slot.section.name,
      department: slot.section.department,
      teacherIds: uniqueTeachers.map((teacher) => teacher.id),
      teacherNames: uniqueTeachers.map((teacher) => teacher.name),
    };
  });

  return (
    <DashboardShell
      badge="Campus Operations"
      role={session.user.role}
      subtitle="See which teachers are in class and which rooms are currently in use."
      title="Live Campus Status"
      user={session.user}
    >
      <CampusStatusTracker
        rooms={rooms}
        slots={slots}
        teachers={teachers}
      />
    </DashboardShell>
  );
}
