import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { hashResetToken, isValidNewPassword } from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid reset token or password." },
      { status: 400 },
    );
  }

  const token =
    typeof body === "object" &&
    body !== null &&
    "token" in body &&
    typeof body.token === "string"
      ? body.token
      : "";
  const password =
    typeof body === "object" &&
    body !== null &&
    "password" in body &&
    typeof body.password === "string"
      ? body.password
      : "";

  if (!/^[a-f0-9]{64}$/.test(token) || !isValidNewPassword(password)) {
    return NextResponse.json(
      {
        message:
          "Invalid reset link, or password must be between 12 and 72 characters.",
      },
      { status: 400 },
    );
  }

  const tokenHash = hashResetToken(token);
  const existingToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { expiresAt: true },
  });
  const now = new Date();

  if (!existingToken || existingToken.expiresAt <= now) {
    return NextResponse.json(
      { message: "Reset link has expired or has already been used. Please request a new link." },
      { status: 400 },
    );
  }

  const passwordHash = await hash(password, 12);
  const result = await prisma.$transaction(async (transaction) => {
    const resetToken = await transaction.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, expiresAt: true },
    });

    if (!resetToken || resetToken.expiresAt <= now) {
      return false;
    }

    const consumed = await transaction.passwordResetToken.deleteMany({
      where: {
        id: resetToken.id,
        expiresAt: { gt: now },
      },
    });

    if (consumed.count !== 1) {
      return false;
    }

    await transaction.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });
    await transaction.passwordResetToken.deleteMany({
      where: { userId: resetToken.userId },
    });

    return true;
  });

  if (!result) {
    return NextResponse.json(
      { message: "Reset link has expired or has already been used. Please request a new link." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    message: "Password updated successfully. You can now sign in with your new password.",
  });
}
