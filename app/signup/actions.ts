"use server";

import { hash } from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { UserRole, UserStatus } from "@/generated/prisma/enums";
import {
  createVerificationCode,
  hasTooManyVerificationAttempts,
  isResendCooldownActive,
  isValidVerificationCode,
  isVerificationCodeMatch,
  isVerificationExpired,
} from "@/lib/email-verification";
import { sendCampusEmail } from "@/lib/password-reset-email";
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

async function sendVerificationCode(
  userId: string,
  email: string,
): Promise<void> {
  const verification = createVerificationCode(userId);
  await prisma.emailVerificationCode.upsert({
    where: { userId },
    create: {
      userId,
      codeHash: verification.codeHash,
      expiresAt: verification.expiresAt,
      attempts: 0,
      sentAt: verification.sentAt,
    },
    update: {
      codeHash: verification.codeHash,
      expiresAt: verification.expiresAt,
      attempts: 0,
      sentAt: verification.sentAt,
    },
  });
  try {
    await sendCampusEmail(
      email,
      "Verify your CAMPUS.OS email",
      `Your CAMPUS.OS verification code is ${verification.code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
    );
  } catch (error) {
    await prisma.emailVerificationCode.deleteMany({
      where: { userId, codeHash: verification.codeHash },
    });
    throw error;
  }
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
        emailVerifiedAt: new Date(),
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

  return {
    ok: true,
    message:
      role === UserRole.STUDENT
        ? "Your account has been created. You can now sign in."
        : "Your request has been submitted and is pending admin approval.",
  };
}

export async function verifyRegistrationEmailAction(
  formData: FormData,
): Promise<RegistrationResult> {
  const email = field(formData, "email").toLowerCase();
  const code = field(formData, "code");
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !isValidVerificationCode(code)
  ) {
    return { ok: false, message: "Enter the email and six-digit code." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerifiedAt: true },
  });
  if (!user) {
    return { ok: false, message: "Invalid or expired verification code." };
  }
  if (user.emailVerifiedAt) {
    return { ok: true, message: "Email verified. You can now sign in." };
  }

  const verification = await prisma.emailVerificationCode.findUnique({
    where: { userId: user.id },
  });
  if (
    !verification ||
    isVerificationExpired(verification.expiresAt) ||
    hasTooManyVerificationAttempts(verification.attempts)
  ) {
    if (verification && isVerificationExpired(verification.expiresAt)) {
      await prisma.emailVerificationCode.deleteMany({
        where: { id: verification.id },
      });
    }
    return {
      ok: false,
      message: "Invalid or expired verification code. Request a new code.",
    };
  }

  if (
    !isVerificationCodeMatch(user.id, code, verification.codeHash)
  ) {
    await prisma.emailVerificationCode.updateMany({
      where: {
        id: verification.id,
        attempts: { lt: 5 },
        expiresAt: { gt: new Date() },
      },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, message: "Invalid or expired verification code." };
  }

  const now = new Date();
  const verified = await prisma.$transaction(async (transaction) => {
    const consumed = await transaction.emailVerificationCode.deleteMany({
      where: {
        id: verification.id,
        codeHash: verification.codeHash,
        attempts: { lt: 5 },
        expiresAt: { gt: now },
      },
    });
    if (consumed.count !== 1) return false;

    await transaction.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: now },
    });
    return true;
  });

  return verified
    ? { ok: true, message: "Email verified. You can now sign in." }
    : { ok: false, message: "Invalid or expired verification code." };
}

export async function resendRegistrationCodeAction(
  formData: FormData,
): Promise<RegistrationResult> {
  const email = field(formData, "email").toLowerCase();
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return { ok: false, message: "Enter a valid email address." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, emailVerifiedAt: true },
  });
  if (!user || user.emailVerifiedAt) {
    return {
      ok: true,
      message: "If verification is required, a new code will be sent.",
    };
  }

  const existingCode = await prisma.emailVerificationCode.findUnique({
    where: { userId: user.id },
    select: { sentAt: true },
  });
  if (
    existingCode &&
    isResendCooldownActive(existingCode.sentAt)
  ) {
    return {
      ok: false,
      message: "Please wait 60 seconds before requesting another code.",
    };
  }

  try {
    await sendVerificationCode(user.id, user.email);
  } catch (error) {
    const detail = error instanceof Error ? error.name : "UnknownError";
    console.error(`Verification code resend failed (${detail}).`);
    return {
      ok: false,
      message: "Could not send a verification code. Please try again later.",
    };
  }
  return { ok: true, message: "A new verification code has been sent." };
}
