import type { UserRole } from "@/generated/prisma/enums";

const dashboardPaths = {
  STUDENT: "/student",
  TEACHER: "/teacher",
  ADMIN: "/admin",
} satisfies Record<UserRole, string>;

export function getDashboardPath(role: UserRole): string {
  return dashboardPaths[role];
}
