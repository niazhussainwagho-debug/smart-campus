import { DashboardShell } from "@/components/dashboard-shell";
import { TeacherAppointmentManager } from "@/components/teacher-appointment-manager";
import type { TeacherAppointmentRow } from "@/components/teacher-appointment-manager";
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

function formatDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export default async function TeacherAppointmentsPage() {
  const teacher = await requireRole(UserRole.TEACHER);
  const appointments = await prisma.appointment.findMany({
    where: { teacherId: teacher.id },
    include: { student: { select: { name: true, email: true } } },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
  const rows: TeacherAppointmentRow[] = appointments.map((appointment) => ({
    id: appointment.id,
    studentName: appointment.student.name,
    studentEmail: appointment.student.email,
    date: formatDate(appointment.date),
    startTime: formatTime(appointment.startTime),
    endTime: formatTime(appointment.endTime),
    status: appointment.status,
    note: appointment.note,
  }));

  return (
    <DashboardShell
      badge="Consultation Hub"
      role={UserRole.TEACHER}
      subtitle="Review incoming student appointment requests, confirm consultations, or propose alternative times."
      title="Student Consultations"
      user={teacher}
    >
      <TeacherAppointmentManager appointments={rows} />
    </DashboardShell>
  );
}
