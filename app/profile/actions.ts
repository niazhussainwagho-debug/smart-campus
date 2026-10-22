"use server";

import { hash } from "bcryptjs";
import { UserRole } from "@/generated/prisma/enums";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-helpers";
import { isValidNewPassword } from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";

export type ProfileActionResult = {
  ok: boolean;
  message: string;
};

const maximumAvatarBytes = 2 * 1024 * 1024;

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function avatarMimeType(bytes: Uint8Array): string | null {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export async function updateProfileAction(
  formData: FormData,
): Promise<ProfileActionResult> {
  const user = await requireRole([UserRole.STUDENT, UserRole.TEACHER]);
  const name = field(formData, "name");
  const department = field(formData, "department");
  const semesterText = field(formData, "semester");
  const passwordValue = formData.get("password");
  const password = typeof passwordValue === "string" ? passwordValue : "";
  const removeAvatar = field(formData, "removeAvatar") === "true";
  const avatarValue = formData.get("avatar");

  if (!name || name.length > 120) {
    return { ok: false, message: "Enter a name between 1 and 120 characters." };
  }
  if (!department) {
    return { ok: false, message: "Select a department." };
  }
  if (password && !isValidNewPassword(password)) {
    return {
      ok: false,
      message: "Password must be between 12 and 72 bytes.",
    };
  }

  const semester =
    user.role === UserRole.STUDENT && semesterText
      ? Number(semesterText)
      : null;
  if (
    user.role === UserRole.STUDENT &&
    (!semesterText ||
      !Number.isSafeInteger(semester) ||
      semester === null ||
      semester < 1)
  ) {
    return { ok: false, message: "Select a valid semester." };
  }

  const matchingSection = await prisma.section.findFirst({
    where: {
      department,
      ...(semester === null ? {} : { semester }),
    },
    select: { id: true },
  });
  if (!matchingSection) {
    return { ok: false, message: "Choose an available department and semester." };
  }

  let avatarData: string | undefined;
  if (avatarValue instanceof File && avatarValue.size > 0) {
    if (avatarValue.size > maximumAvatarBytes) {
      return { ok: false, message: "Profile images must be 2 MB or smaller." };
    }
    const bytes = new Uint8Array(await avatarValue.arrayBuffer());
    const mimeType = avatarMimeType(bytes);
    if (!mimeType || avatarValue.type !== mimeType) {
      return {
        ok: false,
        message: "Choose a valid PNG, JPEG, or WebP image.",
      };
    }
    avatarData = `data:${mimeType};base64,${Buffer.from(bytes).toString("base64")}`;
  } else if (avatarValue && !(avatarValue instanceof File)) {
    return { ok: false, message: "Choose a valid image file." };
  }

  const passwordHash = password ? await hash(password, 12) : undefined;
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        department,
        semester,
        ...(passwordHash ? { passwordHash } : {}),
        ...(removeAvatar ? { avatarData: null } : {}),
        ...(avatarData ? { avatarData } : {}),
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.name : "UnknownError";
    console.error(`Profile update failed (${detail}).`);
    return {
      ok: false,
      message: "Could not update your profile. Please try again.",
    };
  }

  revalidatePath("/profile");
  return { ok: true, message: "Your profile was updated." };
}
