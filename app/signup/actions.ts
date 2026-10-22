"use server";

import { hash } from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { UserRole, UserStatus } from "@/generated/prisma/enums";
import { isValidNewPassword } from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";

export type RegistrationResult = {
  ok: boolean;
  message: string;
};

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function rawField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function isDuplicateEmail(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function registerAccountAction(
  formData: FormData,
): Promise<RegistrationResult> {
  const roleText = field(formData, "role");
  if (roleText !== UserRole.STUDENT && roleText !== UserRole.TEACHER) {
    return { ok: false, message: "Choose Student or Teacher registration." };
  }

  const role = roleText;
  const name = field(formData, "name");
  const email = field(formData, "email").toLowerCase();
  const password = rawField(formData, "password");
  const department = field(formData, "department");
  const semesterText = field(formData, "semester");

  if (!name || name.length > 120) {
    return { ok: false, message: "Enter a name between 1 and 120 characters." };
  }
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return { ok: false, message: "Enter a valid email address." };
  }
  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
  if (existingUser) {
    return {
      ok: false,
      message: "An account with this email address already exists.",
    };
  }
  if (!isValidNewPassword(password)) {
    return {
      ok: false,
      message: "Password must be between 12 and 72 bytes.",
    };
  }
  if (!department) {
    return { ok: false, message: "Select a department." };
  }

  const semester =
    role === UserRole.STUDENT && semesterText
      ? Number(semesterText)
      : null;
  if (
    role === UserRole.STUDENT &&
    (!semesterText ||
      !Number.isSafeInteger(semester) ||
      semester === null ||
      semester < 1)
  ) {
    return { ok: false, message: "Select a valid semester." };
  }

  const validDepartment = await prisma.section.findFirst({
    where: {
      department,
      ...(semester === null ? {} : { semester }),
    },
    select: { id: true },
  });
  if (!validDepartment) {
    return {
      ok: false,
      message:
        role === UserRole.STUDENT
          ? "The selected department and semester are not available."
          : "The selected department is not available.",
    };
  }

  const passwordHash = await hash(password, 12);
  try {
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        department,
        semester,
        status:
          role === UserRole.STUDENT
            ? UserStatus.APPROVED
            : UserStatus.PENDING,
      },
    });
  } catch (error) {
    if (isDuplicateEmail(error)) {
      return {
        ok: false,
        message: "An account with this email address already exists.",
      };
    }
    const detail =
      error instanceof Prisma.PrismaClientKnownRequestError
        ? error.code
        : error instanceof Error
          ? error.name
          : "UnknownError";
    console.error(`Account registration failed (${detail}).`);
    return {
      ok: false,
      message: "Registration failed. Please try again.",
    };
  }

  return role === UserRole.STUDENT
    ? {
        ok: true,
        message: "Your student account is ready. You can now sign in.",
      }
    : {
        ok: true,
        message:
          "Your teacher registration was submitted. You can sign in after admin approval.",
      };
}
