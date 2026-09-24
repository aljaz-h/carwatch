import "server-only";
import { prisma, type User } from "@carwatch/database";
import { generateSessionToken, hashSessionToken, verifyPassword } from "@carwatch/shared";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "cw_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function verifyCredentials(email: string, password: string): Promise<User | null> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) return null;
  const valid = await verifyPassword(password, user.passwordHash);
  return valid ? user : null;
}

export async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken();
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  return token;
}

export async function destroySessionByToken(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
}

/** True once at least one account exists. Drives the first-run setup redirect. */
export async function hasAnyUser(): Promise<boolean> {
  const count = await prisma.user.count();
  return count > 0;
}

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}
