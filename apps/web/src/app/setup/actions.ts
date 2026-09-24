"use server";

import { hashPassword } from "@carwatch/shared";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, hasAnyUser, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/db";

export interface SetupState {
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function setupAction(_prevState: SetupState, formData: FormData): Promise<SetupState> {
  // Re-checked here (not just on page load) so a second browser tab, or a
  // request replayed after setup already completed elsewhere, can't create a
  // second administrator through this route.
  if (await hasAnyUser()) {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!email || !EMAIL_RE.test(email)) {
    return { error: "Enter a valid email address." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, name: name || null, role: "ADMIN" },
  });

  const token = await createSession(user.id);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/dashboard");
}
