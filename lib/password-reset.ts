import { createHash } from "node:crypto";

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function isValidNewPassword(password: string): boolean {
  const byteLength = Buffer.byteLength(password, "utf8");
  return byteLength >= 12 && byteLength <= 72;
}
