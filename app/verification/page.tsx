import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LogoutButton } from "@/components/logout-button";
import { VerificationDocumentUploadForm } from "@/components/verification-document-upload-form";
import { UserStatus } from "@/generated/prisma/enums";
import { getDashboardPath } from "@/lib/roles";
import {
  isValidVerificationDocumentSet,
  verificationDocumentGroupsByRole,
} from "@/lib/verification-documents";
import { prisma } from "@/lib/prisma";

export default async function VerificationPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.status === UserStatus.APPROVED) {
    redirect(getDashboardPath(session.user.role));
  }
  if (session.user.status !== UserStatus.PENDING_VERIFICATION) {
    redirect("/login");
  }
  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      verificationDocumentFiles: {
        select: { documentType: true },
      },
    },
  });
  if (!account) redirect("/login");
  const presentTypes = account.verificationDocumentFiles.map(
    ({ documentType }) => documentType,
  );
  const missingTypes = isValidVerificationDocumentSet(
    account.role,
    presentTypes,
  )
    ? []
    : verificationDocumentGroupsByRole[account.role]
        .filter((group) => !group.some((type) => presentTypes.includes(type)))
        .flat();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <section
        aria-live="polite"
        className="w-full max-w-2xl rounded-2xl border border-amber-500/30 bg-card p-6 shadow-lg sm:p-8"
        role="status"
      >
        <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
          Account verification
        </p>
        <h1 className="mt-2 text-2xl font-bold">Verification pending</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {missingTypes.length > 0
            ? "Upload the missing official documents below. Dashboard access will be enabled after an administrator reviews and approves your account."
            : "Your documents were submitted. Dashboard access will be enabled after an administrator reviews and approves your account. You do not need to upload documents again."}
        </p>
        <VerificationDocumentUploadForm
          missingTypes={missingTypes}
          role={account.role}
        />
        <div className="mt-6">
          <LogoutButton />
        </div>
      </section>
    </main>
  );
}
