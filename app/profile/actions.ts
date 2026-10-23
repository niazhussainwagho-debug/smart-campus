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
  image?: string | null;
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

const validBloodGroups = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

function isValidPhoneNumber(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return (
    value.length <= 32 &&
    /^[+()\d\s.-]+$/.test(value) &&
    digits.length >= 7 &&
    digits.length <= 15
  );
}

function isValidProfileUrl(value: string): boolean {
  if (!value) return true;
  if (value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function updateProfileAction(
  formData: FormData,
): Promise<ProfileActionResult> {
  const user = await requireRole([UserRole.STUDENT, UserRole.TEACHER]);
  const name = field(formData, "name");
  const department = field(formData, "department");
  const semesterText = field(formData, "semester");
  const rollNo = field(formData, "rollNo");
  const fatherName = field(formData, "fatherName");
  const surname = field(formData, "surname");
  const category = field(formData, "category");
  const phone = field(formData, "phone");
  const bloodGroup = field(formData, "bloodGroup");
  const emergencyContact = field(formData, "emergencyContact");
  const linkedinUrl = field(formData, "linkedinUrl");
  const githubUrl = field(formData, "githubUrl");
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
  if (
    user.role === UserRole.STUDENT &&
    (rollNo.length > 64 ||
      fatherName.length > 120 ||
      surname.length > 120 ||
      category.length > 40)
  ) {
    return {
      ok: false,
      message: "Official student details exceed the allowed length.",
    };
  }
  if (user.role === UserRole.STUDENT && rollNo) {
    const existingRollNo = await prisma.user.findFirst({
      where: { rollNo, id: { not: user.id } },
      select: { id: true },
    });
    if (existingRollNo) {
      return { ok: false, message: "That roll number is already in use." };
    }
  }
  if (phone && !isValidPhoneNumber(phone)) {
    return { ok: false, message: "Enter a valid phone number." };
  }
  if (emergencyContact && !isValidPhoneNumber(emergencyContact)) {
    return { ok: false, message: "Enter a valid emergency contact number." };
  }
  if (bloodGroup && !validBloodGroups.includes(bloodGroup)) {
    return { ok: false, message: "Select a valid blood group." };
  }
  if (!isValidProfileUrl(linkedinUrl) || !isValidProfileUrl(githubUrl)) {
    return {
      ok: false,
      message: "Social profile links must be valid HTTP or HTTPS URLs.",
    };
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

  let image: string | undefined;
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
    image = `data:${mimeType};base64,${Buffer.from(bytes).toString("base64")}`;
  } else if (avatarValue && !(avatarValue instanceof File)) {
    return { ok: false, message: "Choose a valid image file." };
  }

  const passwordHash = password ? await hash(password, 12) : undefined;
  let updatedImage: string | null;
  try {
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        department,
        semester,
        ...(user.role === UserRole.STUDENT
          ? {
              rollNo: rollNo || null,
              fatherName: fatherName || null,
              surname: surname || null,
              category: category || null,
            }
          : {}),
        phone: phone || null,
        bloodGroup: bloodGroup || null,
        emergencyContact: emergencyContact || null,
        linkedinUrl: linkedinUrl || null,
        githubUrl: githubUrl || null,
        ...(passwordHash ? { passwordHash } : {}),
        ...(removeAvatar ? { image: null } : {}),
        ...(image ? { image } : {}),
      },
      select: { image: true },
    });
    updatedImage = updatedUser.image;
  } catch (error) {
    const detail = error instanceof Error ? error.name : "UnknownError";
    console.error(`Profile update failed (${detail}).`);
    return {
      ok: false,
      message: "Could not update your profile. Please try again.",
    };
  }

  revalidatePath("/profile");
  return {
    ok: true,
    message: "Your profile was updated.",
    image: updatedImage,
  };
}
