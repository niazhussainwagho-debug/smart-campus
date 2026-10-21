import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/enums";
import { auth } from "@/auth";
import { getDashboardPath } from "@/lib/roles";

export async function requireRole(role: UserRole) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== role) {
    redirect(getDashboardPath(session.user.role));
  }

  return session.user;
}
