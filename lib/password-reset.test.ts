import { describe, expect, it } from "vitest";
import { hashResetToken, isValidNewPassword } from "@/lib/password-reset";

describe("password reset helpers", () => {
  it("hashes reset tokens as stable SHA-256 digests", () => {
    const digest = hashResetToken("example-reset-token");

    expect(digest).toHaveLength(64);
    expect(digest).toBe(hashResetToken("example-reset-token"));
    expect(digest).not.toBe("example-reset-token");
  });

  it("accepts passwords from 12 through 72 UTF-8 bytes", () => {
    expect(isValidNewPassword("123456789012")).toBe(true);
    expect(isValidNewPassword("a".repeat(72))).toBe(true);
    expect(isValidNewPassword("a".repeat(11))).toBe(false);
    expect(isValidNewPassword("a".repeat(73))).toBe(false);
    expect(isValidNewPassword("é".repeat(37))).toBe(false);
  });
});
