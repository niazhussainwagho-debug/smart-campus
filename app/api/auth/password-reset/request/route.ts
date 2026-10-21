import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { hashResetToken } from "@/lib/password-reset";
import {
  getPasswordResetUrl,
  isPasswordResetEmailConfigured,
  sendPasswordResetEmail,
} from "@/lib/password-reset-email";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const genericResponse = {
  message:
    "If an account is associated with this email, a password reset link has been sent.",
};

export async function POST(request: Request) {
  if (!isPasswordResetEmailConfigured()) {
    return NextResponse.json(
      { message: "Password reset email service is currently unavailable." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Please provide a valid email address." },
      { status: 400 },
    );
  }

  const email =
    typeof body === "object" &&
    body !== null &&
    "email" in body &&
    typeof body.email === "string"
      ? body.email.trim().toLowerCase()
      : "";

  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return NextResponse.json(
      { message: "Please provide a valid email address." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (!user) {
    return NextResponse.json(genericResponse);
  }

  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id },
  });

  const token = randomBytes(32).toString("hex");
  const resetToken = await prisma.passwordResetToken.create({
    data: {
      tokenHash: hashResetToken(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
    select: { id: true },
  });

  try {
    await sendPasswordResetEmail(user.email, getPasswordResetUrl(token));
  } catch (error) {
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });
    console.error("Password reset email could not be sent.", error);
    return NextResponse.json(
      {
        message:
          "Could not send email. Please check SMTP settings and try again.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json(genericResponse);
}
