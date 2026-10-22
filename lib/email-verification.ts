import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

const verificationLifetimeMs = 10 * 60 * 1000;
const resendCooldownMs = 60 * 1000;
const maximumAttempts = 5;

function verificationSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET must be configured.");
  return secret;
}

export function createVerificationCode(userId: string): {
  code: string;
  codeHash: string;
  expiresAt: Date;
  sentAt: Date;
} {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const sentAt = new Date();
  return {
    code,
    codeHash: hashVerificationCode(userId, code),
    expiresAt: new Date(sentAt.getTime() + verificationLifetimeMs),
    sentAt,
  };
}

export function hashVerificationCode(userId: string, code: string): string {
  return createHmac("sha256", verificationSecret())
    .update(`campus-email-verification:${userId}:${code}`)
    .digest("hex");
}

export function isVerificationCodeMatch(
  userId: string,
  code: string,
  expectedHash: string,
): boolean {
  const candidate = Buffer.from(hashVerificationCode(userId, code), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return (
    candidate.length === expected.length &&
    timingSafeEqual(candidate, expected)
  );
}

export function isValidVerificationCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

export function isVerificationExpired(expiresAt: Date, now = new Date()): boolean {
  return expiresAt <= now;
}

export function hasTooManyVerificationAttempts(attempts: number): boolean {
  return attempts >= maximumAttempts;
}

export function isResendCooldownActive(sentAt: Date, now = new Date()): boolean {
  return now.getTime() - sentAt.getTime() < resendCooldownMs;
}
