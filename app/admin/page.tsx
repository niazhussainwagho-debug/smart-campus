import { RoleDashboard } from "@/components/role-dashboard";
import { UserRole } from "@/generated/prisma/enums";

export default function AdminPage() {
  return <RoleDashboard role={UserRole.ADMIN} />;
}
