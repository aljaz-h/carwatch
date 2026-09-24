"use server";

import { buildChannel, createMailerFromEnv } from "@carwatch/notifications";
import { hashPassword, verifyPassword } from "@carwatch/shared";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function toggleProviderAction(providerId: string, isEnabled: boolean) {
  await requireUser();
  await prisma.provider.update({ where: { id: providerId }, data: { isEnabled } });
  revalidatePath("/settings");
}

export async function updateProviderIntervalAction(providerId: string, scrapeIntervalMinutes: number) {
  await requireUser();
  await prisma.provider.update({ where: { id: providerId }, data: { scrapeIntervalMinutes } });
  revalidatePath("/settings");
}

export async function createNotificationChannelAction(input: { type: "DISCORD" | "EMAIL"; label: string; config: Record<string, string> }) {
  const user = await requireUser();
  await prisma.notificationChannel.create({
    data: { userId: user.id, type: input.type, label: input.label, config: input.config as never, isEnabled: true },
  });
  revalidatePath("/settings");
}

export async function updateNotificationChannelAction(id: string, input: { isEnabled?: boolean; label?: string; config?: Record<string, string> }) {
  const user = await requireUser();
  await prisma.notificationChannel.updateMany({ where: { id, userId: user.id }, data: input as never });
  revalidatePath("/settings");
}

export async function deleteNotificationChannelAction(id: string) {
  const user = await requireUser();
  await prisma.notificationChannel.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/settings");
}

export async function testNotificationChannelAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  const channel = await prisma.notificationChannel.findFirst({ where: { id, userId: user.id } });
  if (!channel) return { ok: false, error: "Channel not found" };

  const mailer = createMailerFromEnv();
  if (channel.type === "EMAIL" && !mailer) {
    return { ok: false, error: "SMTP is not configured on the server (set SMTP_HOST etc.)" };
  }

  try {
    const instance = buildChannel(channel, { mailer: mailer! });
    const result = await instance.send({
      type: "NEW_MATCH",
      title: "CarWatch test notification",
      body: "If you can see this, this notification channel is working correctly.",
    });
    return result;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function updateAccountAction(input: { name: string }) {
  const user = await requireUser();
  await prisma.user.update({ where: { id: user.id }, data: { name: input.name } });
  revalidatePath("/settings");
}

export async function changePasswordAction(input: { currentPassword: string; newPassword: string }): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  const fullUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });

  const valid = await verifyPassword(input.currentPassword, fullUser.passwordHash);
  if (!valid) return { ok: false, error: "Current password is incorrect" };
  if (input.newPassword.length < 8) return { ok: false, error: "New password must be at least 8 characters" };

  const passwordHash = await hashPassword(input.newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  return { ok: true };
}

export async function updateGeneralSettingsAction(value: Record<string, unknown>) {
  await requireUser();
  await prisma.appSetting.upsert({
    where: { key: "general" },
    create: { key: "general", value: value as never },
    update: { value: value as never },
  });
  revalidatePath("/settings");
}
