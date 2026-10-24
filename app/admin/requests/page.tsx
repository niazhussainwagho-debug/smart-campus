import { AdminRequestReview } from "@/components/admin-request-review";
import { DashboardShell } from "@/components/dashboard-shell";
import { AdminStatus, UserRole, UserStatus } from "@/generated/prisma/enums";
import { requireApprovedAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export default async function AdminRequestsPage() {
  const admin = await requireApprovedAdmin();
  const requests = await prisma.user.findMany({
    where: {
      adminStatus: AdminStatus.PENDING,
      status: UserStatus.APPROVED,
      role: { in: [UserRole.STUDENT, UserRole.TEACHER] },
    },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      role: true,
      createdAt: true,
      adminDocuments: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <DashboardShell
      badge="Admin Operations"
      role={UserRole.ADMIN}
      subtitle="Review identity and appointment documents before granting Admin access."
      title="Admin Verification Requests"
      user={admin}
    >
      <AdminRequestReview
        requests={requests.map((request) => ({
          id: request.id,
          name: request.name,
          email: request.email,
          department: request.department,
          role:
            request.role === UserRole.TEACHER ? UserRole.TEACHER : UserRole.STUDENT,
          createdAt: request.createdAt.toISOString(),
          documents: request.adminDocuments,
        }))}
      />
    </DashboardShell>
  );
}
