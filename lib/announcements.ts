import { UserRole } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type AnnouncementFilters = {
  department?: string;
  semester?: number;
};

export async function findAnnouncementsForViewer(
  role: UserRole,
  studentId: string,
  filters: AnnouncementFilters = {},
) {
  const where: Prisma.AnnouncementWhereInput = {};
  const requestedFilters: Prisma.AnnouncementWhereInput[] = [];

  if (filters.department) {
    requestedFilters.push({ department: filters.department });
  }
  if (filters.semester !== undefined) {
    requestedFilters.push({ semester: filters.semester });
  }

  if (role === UserRole.STUDENT) {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      select: { section: { select: { department: true, semester: true } } },
    });
    const audiences: Prisma.AnnouncementWhereInput[] = [
      { department: null, semester: null },
      ...[
        ...new Set(enrollments.map(({ section }) => section.semester)),
      ].map((semester) => ({ department: null, semester })),
      ...enrollments.map(({ section }) => ({
        department: section.department,
        OR: [{ semester: null }, { semester: section.semester }],
      })),
    ];
    requestedFilters.push({ OR: audiences });
  }

  if (requestedFilters.length) {
    where.AND = requestedFilters;
  }

  return prisma.announcement.findMany({
    where,
    include: { createdBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}
