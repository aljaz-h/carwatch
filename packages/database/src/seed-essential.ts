/**
 * Runs automatically as part of every deployment (see the `migrate` service
 * in docker-compose.yml): `prisma migrate deploy && seed:essential`.
 *
 * Unlike `seed.ts` (local-dev only, `pnpm db:seed`), this never creates a
 * user account or demo listings — CarWatch's first-run setup wizard
 * (`/setup`) is what creates the first administrator, and real listings come
 * from the worker actually scraping. This script only ensures the built-in
 * Provider rows, the equipment/feature catalog, and default app settings
 * exist. It's idempotent (upserts only) and safe to run on every upgrade.
 */
import { prisma } from "./client";
import { seedAppSettings, seedFeatures, seedProviders } from "./seed-helpers";

async function main() {
  console.log("Seeding essential CarWatch reference data...");
  await seedFeatures();
  const providers = await seedProviders();
  await seedAppSettings();
  console.log(`Ensured ${providers.size} providers and the feature catalog exist.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
