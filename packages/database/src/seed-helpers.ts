/**
 * Idempotent seed helpers shared by both `seed.ts` (full local-dev seed,
 * `pnpm db:seed`) and `seed-essential.ts` (reference data only, runs
 * automatically on every deploy). Kept in their own module — with no
 * top-level execution — so importing them never has side effects; `seed.ts`
 * has a top-level `main().catch(...)` that must only run when *it* is
 * executed directly, not whenever something imports a helper from it.
 */
import { FEATURE_CATALOG } from "@carwatch/shared";
import { prisma } from "./client";

export function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

const AVTONET_ENABLED = process.env.AVTONET_ENABLED !== "false";
const AVTONET_INTERVAL_MINUTES = Number.parseInt(process.env.AVTONET_INTERVAL_MINUTES ?? "45", 10);

const PROVIDERS = [
  {
    key: "avto_net",
    name: "Avto.net",
    baseUrl: "https://www.avto.net",
    isEnabled: AVTONET_ENABLED,
    scrapeIntervalMinutes: Number.isFinite(AVTONET_INTERVAL_MINUTES) && AVTONET_INTERVAL_MINUTES >= 5 ? AVTONET_INTERVAL_MINUTES : 45,
    status: "HEALTHY" as const,
    config: { rateLimit: { minDelayMs: 1200, jitterMs: 1500, concurrency: 2 } },
  },
  {
    key: "doberavto",
    name: "DoberAvto",
    baseUrl: "https://www.doberavto.si",
    scrapeIntervalMinutes: 60,
    status: "HEALTHY" as const,
    config: { rateLimit: { minDelayMs: 1500, jitterMs: 1500, concurrency: 2 } },
  },
  {
    key: "bolha",
    name: "Bolha",
    baseUrl: "https://www.bolha.com",
    scrapeIntervalMinutes: 60,
    status: "HEALTHY" as const,
    config: { rateLimit: { minDelayMs: 1500, jitterMs: 2000, concurrency: 2 } },
  },
  {
    key: "mobile_de",
    name: "mobile.de",
    baseUrl: "https://www.mobile.de",
    scrapeIntervalMinutes: 90,
    status: "DEGRADED" as const,
    config: { rateLimit: { minDelayMs: 2000, jitterMs: 2000, concurrency: 1 } },
  },
  {
    key: "demo",
    name: "Demo Marketplace",
    baseUrl: undefined,
    scrapeIntervalMinutes: 30,
    status: "HEALTHY" as const,
    config: { rateLimit: { minDelayMs: 50, jitterMs: 50, concurrency: 4 }, note: "In-memory, network-free provider for local development." },
  },
];

/**
 * Creates/updates the built-in Provider rows. Idempotent and safe to run on
 * every deploy — it never touches run history or listings, and only sets
 * isEnabled/scrapeIntervalMinutes when a provider row doesn't exist yet, so
 * it never clobbers settings an admin later changed from the UI.
 */
export async function seedProviders() {
  const providers = new Map<string, string>();
  for (const p of PROVIDERS) {
    const created = await prisma.provider.upsert({
      where: { key: p.key },
      create: {
        key: p.key,
        name: p.name,
        baseUrl: p.baseUrl,
        isEnabled: "isEnabled" in p ? p.isEnabled : true,
        scrapeIntervalMinutes: p.scrapeIntervalMinutes,
        status: p.status,
        config: p.config,
      },
      update: {},
    });
    providers.set(p.key, created.id);
  }
  return providers;
}

export async function seedFeatures() {
  for (const f of FEATURE_CATALOG) {
    await prisma.feature.upsert({
      where: { key: f.key },
      create: { key: f.key, label: f.label, category: f.category },
      update: { label: f.label, category: f.category },
    });
  }
}

export async function seedAppSettings() {
  await prisma.appSetting.upsert({
    where: { key: "general" },
    create: {
      key: "general",
      value: {
        siteName: "CarWatch",
        defaultCurrency: "EUR",
        timezone: "Europe/Ljubljana",
      },
    },
    update: {},
  });
}
