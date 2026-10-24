import { AdminRequestForm } from "@/components/admin-request-form";
import { DashboardShell } from "@/components/dashboard-shell";
import { AdminStatus, UserRole } from "@/generated/prisma/enums";
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const statusCopy: Record<AdminStatus, { title: string; description: string }> = {
  NONE: {
    title: "No request submitted",
    description:
      "Submit the required HEC-verified degree, government appointment or posting notification, and signed university authorization letter to request Admin verification.",
  },
  PENDING: {
    title: "Request pending review",
    description:
      "Your documents have been submitted and are awaiting review by an Admin.",
  },
  APPROVED: {
    title: "Admin verification approved",
    description:
      "Your account has Admin access. Sign out and sign back in to refresh your access.",
  },
  REJECTED: {
    title: "Request not approved",
    description:
      "Your previous request was rejected. You can submit current official documents again for another review.",
  },
};

export default async function AdminRequestPage() {
  const user = await requireRole([UserRole.STUDENT, UserRole.TEACHER]);
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { adminStatus: true },
  });
  const status = profile?.adminStatus ?? AdminStatus.NONE;
  const copy = statusCopy[status];

  return (
    <DashboardShell
      badge="Admin Verification"
      role={user.role}
      subtitle="Request Admin access by submitting official identity and appointment documents."
      title="Admin Access Request"
      user={user}
    >
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-lg sm:p-7">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Application status
          </p>
          <h2 className="mt-2 text-xl font-bold text-foreground">
            {copy.title}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {copy.description}
          </p>
        </section>
        {status === AdminStatus.NONE || status === AdminStatus.REJECTED ? (
          <AdminRequestForm />
        ) : null}
      </div>
    </DashboardShell>
  );
}
