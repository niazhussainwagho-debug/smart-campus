import { RoleDashboard } from "@/components/role-dashboard";
import { UserRole } from "@/generated/prisma/enums";

export default function TeacherPage() {
  return <RoleDashboard role={UserRole.TEACHER} />;
}
