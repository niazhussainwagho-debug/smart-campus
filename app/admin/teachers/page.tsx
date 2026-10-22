import { DashboardShell } from "@/components/dashboard-shell";
import { TeacherRegistrationManager } from "@/components/teacher-registration-manager";
import { UserRole, UserStatus } from "@/generated/prisma/enums";
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export default async function AdminTeachersPage() {
  const admin = await requireRole(UserRole.ADMIN);
  const pendingTeachers = await prisma.user.findMany({
    where: {
      role: UserRole.TEACHER,
      status: UserStatus.PENDING,
      emailVerifiedAt: { not: null },
    },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <DashboardShell
      badge="Admin Operations"
      role={UserRole.ADMIN}
      subtitle="Review teacher registration requests before granting portal access."
      title="Teacher Management"
      user={admin}
    >
      <TeacherRegistrationManager
        teachers={pendingTeachers.map((teacher) => ({
          ...teacher,
          createdAt: teacher.createdAt.toISOString(),
        }))}
      />
    </DashboardShell>
  );
}
