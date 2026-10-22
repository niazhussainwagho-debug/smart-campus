import { DashboardShell } from "@/components/dashboard-shell";
import { ProfileManager } from "@/components/profile-manager";
import { UserRole } from "@/generated/prisma/enums";
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const user = await requireRole([UserRole.STUDENT, UserRole.TEACHER]);
  const [profile, sections] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: {
        name: true,
        email: true,
        role: true,
        department: true,
        semester: true,
        avatarData: true,
      },
    }),
    prisma.section.findMany({
      select: { department: true, semester: true },
      orderBy: [{ department: "asc" }, { semester: "asc" }],
    }),
  ]);
  const targets = [
    ...new Map(
      sections.map((section) => [
        `${section.department}:${section.semester}`,
        section,
      ]),
    ).values(),
  ];

  return (
    <DashboardShell
      badge="Account Settings"
      role={profile.role}
      subtitle="Update your personal details and profile picture."
      title="My Profile"
      user={{ ...user, name: profile.name }}
    >
      <ProfileManager
        targets={targets}
        profile={{
          name: profile.name,
          email: profile.email,
          role: profile.role,
          department: profile.department ?? "",
          semester: profile.semester,
          avatarData: profile.avatarData,
        }}
      />
    </DashboardShell>
  );
}
