import { createHash, randomBytes } from "node:crypto";

/** Generates an opaque session token. The raw token is set as the cookie; only its hash is stored server-side. */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
