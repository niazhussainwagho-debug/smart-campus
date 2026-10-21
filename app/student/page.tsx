import { RoleDashboard } from "@/components/role-dashboard";
import { UserRole } from "@/generated/prisma/enums";

export default function StudentPage() {
  return <RoleDashboard role={UserRole.STUDENT} />;
}
