import { AnnouncementManager } from "@/components/announcements-manager";
import { DashboardShell } from "@/components/dashboard-shell";
import { UserRole } from "@/generated/prisma/enums";
import { findAnnouncementsForViewer } from "@/lib/announcements";
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export default async function AnnouncementsPage() {
  const user = await requireRole([
    UserRole.ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
  ]);
  const [announcements, sections] = await Promise.all([
    findAnnouncementsForViewer(user.role, user.id),
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
      badge="Campus Updates"
      role={user.role}
      subtitle="Important campus notices and circulars, all in one place."
      title="Announcements"
      user={user}
    >
      <AnnouncementManager
        announcements={announcements.map((announcement) => ({
          id: announcement.id,
          title: announcement.title,
          message: announcement.message,
          department: announcement.department,
          semester: announcement.semester,
          createdById: announcement.createdById,
          createdByName: announcement.createdBy.name,
          createdAt: announcement.createdAt.toISOString(),
        }))}
        role={user.role}
        targets={targets}
        userId={user.id}
      />
    </DashboardShell>
  );
}
