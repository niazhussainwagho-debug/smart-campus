"use server";

import { NotificationType, UserRole } from "@/generated/prisma/enums";
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const notificationRoles = [
  UserRole.ADMIN,
  UserRole.TEACHER,
  UserRole.STUDENT,
];

export type DashboardNotification = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link: string | null;
  createdAt: string;
};

export async function getNotificationsAction(): Promise<{
  notifications: DashboardNotification[];
  unreadCount: number;
}> {
  const user = await requireRole(notificationRoles);
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        isRead: true,
        link: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({
      where: { userId: user.id, isRead: false },
    }),
  ]);

  return {
    notifications: notifications.map((notification) => ({
      ...notification,
      createdAt: notification.createdAt.toISOString(),
    })),
    unreadCount,
  };
}

export async function markNotificationReadAction(id: string): Promise<void> {
  const user = await requireRole(notificationRoles);
  await prisma.notification.updateMany({
    where: { id, userId: user.id, isRead: false },
    data: { isRead: true },
  });
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const user = await requireRole(notificationRoles);
  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });
}
