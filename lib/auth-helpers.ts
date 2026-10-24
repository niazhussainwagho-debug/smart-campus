import { redirect } from "next/navigation";
import {
  AdminStatus,
  UserRole,
  UserStatus,
} from "@/generated/prisma/enums";
import { auth } from "@/auth";
import { getDashboardPath } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

export async function requireRole(role: UserRole | UserRole[]) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const allowedRoles = Array.isArray(role) ? role : [role];
  if (!allowedRoles.includes(session.user.role)) {
    redirect(getDashboardPath(session.user.role));
  }

  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { status: true },
  });
  if (account?.status === UserStatus.PENDING_VERIFICATION) {
    redirect("/verification");
  }
  if (!account || account.status !== UserStatus.APPROVED) {
    redirect("/login");
  }

  return session.user;
}

export async function requireApprovedAdmin() {
  const user = await requireRole(UserRole.ADMIN);
  const approvedAdmin = await prisma.user.findFirst({
    where: {
      id: user.id,
      role: UserRole.ADMIN,
      status: UserStatus.APPROVED,
      adminStatus: AdminStatus.APPROVED,
    },
    select: { id: true },
  });

  if (!approvedAdmin) {
    throw new Error("Approved administrator access is required.");
  }

  return user;
}
