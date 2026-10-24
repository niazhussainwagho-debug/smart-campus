import { AdminRequestReview } from "@/components/admin-request-review";
import { DashboardShell } from "@/components/dashboard-shell";
import { UserRole, UserStatus } from "@/generated/prisma/enums";
import { requireApprovedAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export default async function AdminRequestsPage() {
  const admin = await requireApprovedAdmin();
  const requests = await prisma.user.findMany({
    where: {
      status: UserStatus.PENDING_VERIFICATION,
    },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      role: true,
      createdAt: true,
      verificationDocumentFiles: {
        select: { id: true, documentType: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <DashboardShell
      badge="Admin Operations"
      role={UserRole.ADMIN}
      subtitle="Review student, faculty, and Admin verification documents submitted during account registration."
      title="Account Verification Requests"
      user={admin}
    >
      <AdminRequestReview
        requests={requests.map((request) => ({
          id: request.id,
          name: request.name,
          email: request.email,
          department: request.department,
          role: request.role,
          createdAt: request.createdAt.toISOString(),
          documents: request.verificationDocumentFiles.map((document) => ({
            url: `/api/admin-documents/${document.id}`,
            type: document.documentType,
          })),
        }))}
      />
    </DashboardShell>
  );
}
