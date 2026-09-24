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

const MIN_SCRAPE_INTERVAL_MINUTES = 5;
const MAX_SCRAPE_INTERVAL_MINUTES = 24 * 60;

export async function toggleProviderAction(providerId: string, isEnabled: boolean) {
  await requireUser();
  await prisma.provider.update({ where: { id: providerId }, data: { isEnabled } });
  revalidatePath("/settings");
}

export async function updateProviderIntervalAction(providerId: string, scrapeIntervalMinutes: number): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!Number.isFinite(scrapeIntervalMinutes) || scrapeIntervalMinutes < MIN_SCRAPE_INTERVAL_MINUTES) {
    return { ok: false, error: `Scrape interval must be at least ${MIN_SCRAPE_INTERVAL_MINUTES} minutes — scraping any faster risks getting blocked.` };
  }
  if (scrapeIntervalMinutes > MAX_SCRAPE_INTERVAL_MINUTES) {
    return { ok: false, error: "Scrape interval can't be more than 24 hours." };
  }
  await prisma.provider.update({ where: { id: providerId }, data: { scrapeIntervalMinutes: Math.round(scrapeIntervalMinutes) } });
  revalidatePath("/settings");
  return { ok: true };
}

export interface ProviderRateLimitInput {
  minDelayMs: number;
  jitterMs: number;
  concurrency: number;
  maxRetries: number;
  timeoutMs: number;
}

function validateRateLimit(input: ProviderRateLimitInput): string | null {
  if (!Number.isFinite(input.minDelayMs) || input.minDelayMs < 200 || input.minDelayMs > 60_000) {
    return "Delay between requests must be between 200ms and 60,000ms.";
  }
  if (!Number.isFinite(input.jitterMs) || input.jitterMs < 0 || input.jitterMs > 60_000) {
    return "Jitter must be between 0ms and 60,000ms.";
  }
  if (!Number.isInteger(input.concurrency) || input.concurrency < 1 || input.concurrency > 10) {
    return "Concurrency must be between 1 and 10.";
  }
  if (!Number.isInteger(input.maxRetries) || input.maxRetries < 0 || input.maxRetries > 10) {
    return "Retry count must be between 0 and 10.";
  }
  if (!Number.isFinite(input.timeoutMs) || input.timeoutMs < 2000 || input.timeoutMs > 120_000) {
    return "Request timeout must be between 2,000ms and 120,000ms.";
  }
  return null;
}

export async function updateProviderRateLimitAction(providerId: string, input: ProviderRateLimitInput): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  const validationError = validateRateLimit(input);
  if (validationError) return { ok: false, error: validationError };

  const provider = await prisma.provider.findUniqueOrThrow({ where: { id: providerId } });
  const existingConfig = (provider.config as Record<string, unknown>) ?? {};
  await prisma.provider.update({
    where: { id: providerId },
    data: { config: { ...existingConfig, rateLimit: input } as never },
  });
  revalidatePath("/settings");
  return { ok: true };
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
