import { StudentAppointmentBooking } from "@/components/student-appointment-booking";
import type {
  AppointmentAvailabilityRow,
  StudentAppointmentRow,
} from "@/components/student-appointment-booking";
import { UserRole, UserStatus } from "@/generated/prisma/enums";
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

import { DashboardShell } from "@/components/dashboard-shell";

export default async function StudentAppointmentsPage() {
  const student = await requireRole(UserRole.STUDENT);
  const [teachers, availability, appointments] = await Promise.all([
    prisma.user.findMany({
      where: { role: UserRole.TEACHER, status: UserStatus.APPROVED },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.availabilitySlot.findMany({
      where: {
        teacher: { role: UserRole.TEACHER, status: UserStatus.APPROVED },
      },
      include: { teacher: { select: { name: true } } },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
    prisma.appointment.findMany({
      where: { studentId: student.id },
      include: { teacher: { select: { name: true } } },
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
    }),
  ]);

  const availabilityRows: AppointmentAvailabilityRow[] = availability.map(
    (slot) => ({
      id: slot.id,
      teacherId: slot.teacherId,
      teacherName: slot.teacher.name,
      dayOfWeek: slot.dayOfWeek,
      startTime: formatTime(slot.startTime),
      endTime: formatTime(slot.endTime),
    }),
  );
  const appointmentRows: StudentAppointmentRow[] = appointments.map(
    (appointment) => ({
      id: appointment.id,
      teacherName: appointment.teacher.name,
      date: formatDate(appointment.date),
      startTime: formatTime(appointment.startTime),
      endTime: formatTime(appointment.endTime),
      status: appointment.status,
      note: appointment.note,
    }),
  );

  return (
    <DashboardShell
      badge="Faculty Appointments"
      role={UserRole.STUDENT}
      subtitle="Book one-on-one consultation sessions during professors' posted office hours."
      title="Faculty Appointments"
      user={student}
    >
      <StudentAppointmentBooking
        appointments={appointmentRows}
        availability={availabilityRows}
        teachers={teachers.map((teacher) => ({
          id: teacher.id,
          name: teacher.name,
        }))}
      />
    </DashboardShell>
  );
}
