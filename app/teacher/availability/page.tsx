import { AvailabilityManager } from "@/components/availability-manager";
import type { AvailabilityRow } from "@/components/availability-manager";
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

export default async function TeacherAvailabilityPage() {
  const teacher = await requireRole(UserRole.TEACHER);
  const availability = await prisma.availabilitySlot.findMany({
    where: { teacherId: teacher.id },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
  const slots: AvailabilityRow[] = availability.map((slot) => ({
    id: slot.id,
    dayOfWeek: slot.dayOfWeek,
    startTime: formatTime(slot.startTime),
    endTime: formatTime(slot.endTime),
  }));

  return (
    <DashboardShell
      badge="Faculty Scheduling"
      role={UserRole.TEACHER}
      subtitle="Configure your recurring weekly consultation slots so students can schedule appointments during approved office hours."
      title="Office Hours & Availability"
      user={teacher}
    >
      <AvailabilityManager slots={slots} />
    </DashboardShell>
  );
}
