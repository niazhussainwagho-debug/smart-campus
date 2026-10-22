import { afterEach, describe, expect, it } from "vitest";
import {
  createVerificationCode,
  hasTooManyVerificationAttempts,
  isResendCooldownActive,
  isValidVerificationCode,
  isVerificationCodeMatch,
  isVerificationExpired,
} from "@/lib/email-verification";

const originalAuthSecret = process.env.AUTH_SECRET;

afterEach(() => {
  if (originalAuthSecret === undefined) {
    delete process.env.AUTH_SECRET;
  } else {
    process.env.AUTH_SECRET = originalAuthSecret;
  }
});

describe("email verification codes", () => {
  it("creates a six digit code and matches it only for its user", () => {
    process.env.AUTH_SECRET = "test-secret-for-otp";
    const verification = createVerificationCode("user-1");

    expect(isValidVerificationCode(verification.code)).toBe(true);
    expect(
      isVerificationCodeMatch(
        "user-1",
        verification.code,
        verification.codeHash,
      ),
    ).toBe(true);
    expect(
      isVerificationCodeMatch(
        "user-2",
        verification.code,
        verification.codeHash,
      ),
    ).toBe(false);
    expect(verification.expiresAt.getTime() - verification.sentAt.getTime()).toBe(
      10 * 60 * 1000,
    );
  });

  it("validates code format, expiry, attempt caps, and resend cooldown", () => {
    const now = new Date("2026-10-23T00:00:00.000Z");

    expect(isValidVerificationCode("123456")).toBe(true);
    expect(isValidVerificationCode("12a456")).toBe(false);
    expect(isVerificationExpired(new Date(now.getTime() - 1), now)).toBe(true);
    expect(isVerificationExpired(new Date(now.getTime() + 1), now)).toBe(false);
    expect(hasTooManyVerificationAttempts(5)).toBe(true);
    expect(hasTooManyVerificationAttempts(4)).toBe(false);
    expect(
      isResendCooldownActive(new Date(now.getTime() - 30_000), now),
    ).toBe(true);
    expect(
      isResendCooldownActive(new Date(now.getTime() - 60_000), now),
    ).toBe(false);
  });
});
