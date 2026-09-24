"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { destroySessionByToken, SESSION_COOKIE } from "@/lib/auth";

export async function logoutAction() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await destroySessionByToken(token);
    store.delete(SESSION_COOKIE);
  }
  redirect("/login");
}
