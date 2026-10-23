import { type NotificationType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export type UserNotificationInput = {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link: string;
};

export async function createUserNotification(
  input: UserNotificationInput,
): Promise<void> {
  await createUserNotifications([input]);
}

export async function createUserNotifications(
  inputs: UserNotificationInput[],
): Promise<void> {
  if (!inputs.length) return;
  try {
    await prisma.notification.createMany({ data: inputs });
  } catch (error) {
    const detail = error instanceof Error ? error.name : "UnknownError";
    console.error(`Notification creation failed (${detail}).`);
  }
}
