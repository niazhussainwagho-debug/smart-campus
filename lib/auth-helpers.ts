import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/enums";
import { auth } from "@/auth";
import { getDashboardPath } from "@/lib/roles";

export async function requireRole(role: UserRole | UserRole[]) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const allowedRoles = Array.isArray(role) ? role : [role];
  if (!allowedRoles.includes(session.user.role)) {
    redirect(getDashboardPath(session.user.role));
  }

  return session.user;
}
