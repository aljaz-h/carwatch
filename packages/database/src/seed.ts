import { FEATURE_CATALOG, hashPassword } from "@carwatch/shared";
import { prisma } from "./client";
import { SEED_VEHICLES, seedVehicleImages } from "./seed-data";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

const PROVIDERS = [
  {
    key: "avto_net",
    name: "Avto.net",
    baseUrl: "https://www.avto.net",
    scrapeIntervalMinutes: 45,
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

async function seedProviders() {
  const providers = new Map<string, string>();
  for (const p of PROVIDERS) {
    const created = await prisma.provider.upsert({
      where: { key: p.key },
      create: {
        key: p.key,
        name: p.name,
        baseUrl: p.baseUrl,
        scrapeIntervalMinutes: p.scrapeIntervalMinutes,
        status: p.status,
        config: p.config,
        lastSuccessAt: p.status === "DEGRADED" ? daysAgo(2) : daysAgo(0),
        lastErrorAt: p.status === "DEGRADED" ? daysAgo(1) : null,
        lastError: p.status === "DEGRADED" ? "Timeout after 15000ms fetching search results page 3" : null,
      },
      update: {},
    });
    providers.set(p.key, created.id);

    // A handful of historical scrape runs per provider for diagnostics.
    for (let i = 3; i >= 0; i--) {
      const started = daysAgo(i * (p.scrapeIntervalMinutes / 60 / 24) + i);
      const discovered = 40 + Math.floor(Math.random() * 60);
      const isFailedRun = p.status === "DEGRADED" && i === 0;
      await prisma.providerScrapeRun.create({
        data: {
          providerId: created.id,
          startedAt: started,
          finishedAt: isFailedRun ? undefined : new Date(started.getTime() + 45_000 + Math.random() * 30_000),
          status: isFailedRun ? "FAILED" : "SUCCESS",
          listingsDiscovered: isFailedRun ? 0 : discovered,
          listingsNew: isFailedRun ? 0 : Math.floor(discovered * 0.15),
          listingsUpdated: isFailedRun ? 0 : Math.floor(discovered * 0.35),
          listingsUnchanged: isFailedRun ? 0 : Math.floor(discovered * 0.5),
          listingsRemoved: isFailedRun ? 0 : Math.floor(Math.random() * 4),
          errorsCount: isFailedRun ? 1 : 0,
          errorMessage: isFailedRun ? "Timeout after 15000ms fetching search results page 3" : null,
          durationMs: isFailedRun ? 15000 : 45000 + Math.floor(Math.random() * 30000),
        },
      });
    }
  }
  return providers;
}

async function seedFeatures() {
  for (const f of FEATURE_CATALOG) {
    await prisma.feature.upsert({
      where: { key: f.key },
      create: { key: f.key, label: f.label, category: f.category },
      update: { label: f.label, category: f.category },
    });
  }
}

async function seedVehiclesAndListings(providerIds: Map<string, string>) {
  const listingIdBySlug = new Map<string, string>();

  for (const v of SEED_VEHICLES) {
    const providerId = providerIds.get(v.providerKey);
    if (!providerId) throw new Error(`Unknown provider ${v.providerKey}`);

    const currentPrice = v.priceEvents[v.priceEvents.length - 1]!.price;
    const originalPrice = v.priceEvents[0]!.price;
    const lastStatusEvent = v.statusEvents[v.statusEvents.length - 1]!;

    const vehicle = await prisma.vehicle.create({
      data: {
        manufacturer: v.manufacturer,
        model: v.model,
        generation: v.generation,
        variant: v.variant,
        year: v.year,
        firstRegistration: new Date(v.firstRegistration),
        fuelType: v.fuelType,
        transmission: v.transmission,
        engineCapacity: v.engineCapacity,
        powerKw: v.powerKw,
        powerHp: v.powerHp,
        drivetrain: v.drivetrain,
        bodyType: v.bodyType,
        doors: v.doors,
        seats: v.seats,
        exteriorColor: v.exteriorColor,
        vin: v.vin,
        features: {
          create: v.features.map((key) => ({ feature: { connect: { key } } })),
        },
      },
    });

    const listing = await prisma.listing.create({
      data: {
        vehicleId: vehicle.id,
        providerId,
        providerListingId: v.providerListingId,
        title: v.title,
        description: v.description,
        price: currentPrice,
        originalPrice,
        mileage: v.mileage,
        sellerName: v.sellerName,
        sellerType: v.sellerType,
        sellerPhone: v.sellerPhone,
        locationCity: v.locationCity,
        locationRegion: v.locationRegion,
        locationCountry: v.locationCountry,
        url: `https://example-${v.providerKey}.invalid/listing/${v.providerListingId}`,
        images: seedVehicleImages(v),
        firstSeenAt: daysAgo(v.firstSeenDaysAgo),
        lastSeenAt: daysAgo(0),
        publishedAt: v.publishedDaysAgo !== undefined ? daysAgo(v.publishedDaysAgo) : null,
        status: lastStatusEvent.status,
        isAvailable: lastStatusEvent.status === "ACTIVE",
        priceHistory: {
          create: v.priceEvents.map((e) => ({ price: e.price, recordedAt: daysAgo(e.daysAgo) })),
        },
        statusHistory: {
          create: v.statusEvents.map((e) => ({ status: e.status, recordedAt: daysAgo(e.daysAgo) })),
        },
        mileageHistory: {
          create: [{ mileage: v.mileage, recordedAt: daysAgo(v.firstSeenDaysAgo) }],
        },
      },
    });

    listingIdBySlug.set(v.slug, listing.id);
  }

  return listingIdBySlug;
}

async function seedDuplicateMatch(listingIdBySlug: Map<string, string>) {
  const listingAId = listingIdBySlug.get("skoda-octavia-3-combi-tdi");
  const listingBId = listingIdBySlug.get("skoda-octavia-3-combi-tdi-bolha");
  if (!listingAId || !listingBId) return;

  const [a, b] = await Promise.all([
    prisma.listing.findUniqueOrThrow({ where: { id: listingAId } }),
    prisma.listing.findUniqueOrThrow({ where: { id: listingBId } }),
  ]);

  await prisma.duplicateMatch.create({
    data: {
      listingAId,
      listingBId,
      vehicleAId: a.vehicleId,
      vehicleBId: b.vehicleId,
      status: "LIKELY",
      score: 0.86,
      matchedFields: {
        manufacturer: true,
        model: true,
        generation: true,
        year: true,
        engineCapacity: true,
        powerHp: true,
        exteriorColor: true,
        mileage: { a: 98500, b: 98700, deltaKm: 200, withinTolerance: true },
        location: { a: "Maribor", b: "Maribor", match: true },
        vin: { available: false },
        notes: "Same seller first name, matching spec and near-identical mileage across two marketplaces within days of each other.",
      },
    },
  });
}

async function seedUser() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "aljaz.horvat10@gmail.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "carwatch-demo";
  const passwordHash = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email },
    create: { email, passwordHash, name: "Aljaž", role: "ADMIN" },
    update: {},
  });

  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log(`\nSeeded admin user: ${email} / ${password} (change this after first login)\n`);
  }

  return user;
}

async function seedSavedSearchAndAlerts(userId: string, listingIdBySlug: Map<string, string>) {
  const savedSearch = await prisma.savedSearch.create({
    data: {
      userId,
      name: "Golf / Octavia / Leon",
      required: {
        models: ["Golf", "Octavia", "Leon"],
        priceMax: 17000,
        priceMin: 9000,
        yearMin: 2016,
        mileageMax: 150000,
        powerHpMin: 110,
      },
      preferred: {
        features: ["led_headlights", "heated_seats", "adaptive_cruise_control"],
      },
      excluded: {
        damaged: true,
        nonRunning: true,
        partsCarOnly: true,
      },
      notifyNewMatch: true,
      minMatchScore: 75,
      notifyPriceDrop: true,
      minPriceDropAmount: 300,
    },
  });

  const golfId = listingIdBySlug.get("vw-golf-mk7-tdi");
  const octaviaId = listingIdBySlug.get("skoda-octavia-3-combi-tdi");
  const leonId = listingIdBySlug.get("seat-leon-fr-tsi");

  if (golfId) {
    await prisma.savedSearchMatch.create({
      data: {
        savedSearchId: savedSearch.id,
        listingId: golfId,
        score: 87,
        scoreBreakdown: {
          requiredChecks: [
            { key: "model", label: "Golf", passed: true },
            { key: "price", label: "€11,900 (≤ €17,000)", passed: true },
            { key: "year", label: "2017", passed: true },
            { key: "mileage", label: "121,000 km", passed: true },
            { key: "power", label: "115 hp", passed: true },
          ],
          preferredChecks: [
            { key: "feature:led_headlights", label: "LED headlights", passed: true },
            { key: "feature:heated_seats", label: "Heated seats", passed: false },
            { key: "feature:adaptive_cruise_control", label: "Adaptive cruise control", passed: false },
          ],
        },
      },
    });
  }

  if (octaviaId) {
    await prisma.savedSearchMatch.create({
      data: {
        savedSearchId: savedSearch.id,
        listingId: octaviaId,
        score: 100,
        scoreBreakdown: {
          requiredChecks: [
            { key: "model", label: "Octavia", passed: true },
            { key: "price", label: "€15,800 (≤ €17,000)", passed: true },
            { key: "year", label: "2018", passed: true },
            { key: "mileage", label: "98,500 km", passed: true },
            { key: "power", label: "150 hp", passed: true },
          ],
          preferredChecks: [
            { key: "feature:led_headlights", label: "LED headlights", passed: true },
            { key: "feature:heated_seats", label: "Heated seats", passed: true },
            { key: "feature:adaptive_cruise_control", label: "Adaptive cruise control", passed: true },
          ],
        },
      },
    });
  }

  if (leonId) {
    await prisma.savedSearchMatch.create({
      data: {
        savedSearchId: savedSearch.id,
        listingId: leonId,
        score: 93,
        scoreBreakdown: {
          requiredChecks: [
            { key: "model", label: "Leon", passed: true },
            { key: "price", label: "€15,490 (≤ €17,000)", passed: true },
            { key: "year", label: "2019", passed: true },
            { key: "mileage", label: "64,200 km", passed: true },
            { key: "power", label: "150 hp", passed: true },
          ],
          preferredChecks: [
            { key: "feature:led_headlights", label: "LED headlights", passed: true },
            { key: "feature:heated_seats", label: "Heated seats", passed: true },
            { key: "feature:adaptive_cruise_control", label: "Adaptive cruise control", passed: false },
          ],
        },
      },
    });
  }

  // Watchlist: user is tracking the BMW.
  const bmwId = listingIdBySlug.get("bmw-320d-touring");
  if (bmwId) {
    await prisma.watchlistItem.create({
      data: { userId, listingId: bmwId, note: "Ask seller for accident history report before viewing." },
    });
  }

  // Notification channels.
  await prisma.notificationChannel.create({
    data: {
      userId,
      type: "DISCORD",
      label: "Car alerts channel",
      config: { webhookUrl: "https://discord.com/api/webhooks/000000000000000000/replace-me" },
      isEnabled: false,
    },
  });
  const emailChannel = await prisma.notificationChannel.create({
    data: {
      userId,
      type: "EMAIL",
      label: "Personal email",
      config: { to: "aljaz.horvat10@gmail.com" },
      isEnabled: true,
    },
  });

  // A few alert events demonstrating each type, already delivered.
  if (octaviaId) {
    await prisma.alertEvent.create({
      data: {
        userId,
        type: "NEW_MATCH",
        savedSearchId: savedSearch.id,
        listingId: octaviaId,
        dedupeKey: `seed-new-match-${octaviaId}`,
        payload: { score: 100, title: "Škoda Octavia Combi 2.0 TDI DSG Style", price: 15800 },
        status: "SENT",
        channelResults: { email: { channelId: emailChannel.id, status: "SENT" } },
        createdAt: daysAgo(45),
        deliveredAt: daysAgo(45),
      },
    });
    await prisma.alertEvent.create({
      data: {
        userId,
        type: "PRICE_DROP",
        savedSearchId: savedSearch.id,
        listingId: octaviaId,
        dedupeKey: `seed-price-drop-${octaviaId}-15800`,
        payload: { oldPrice: 16400, newPrice: 15800, delta: -600 },
        status: "SENT",
        channelResults: { email: { channelId: emailChannel.id, status: "SENT" } },
        createdAt: daysAgo(3),
        deliveredAt: daysAgo(3),
      },
    });
  }
  const bmwListingId = listingIdBySlug.get("bmw-320d-touring");
  if (bmwListingId) {
    await prisma.alertEvent.create({
      data: {
        userId,
        type: "LISTING_RETURNED",
        listingId: bmwListingId,
        dedupeKey: `seed-returned-${bmwListingId}-9`,
        payload: { title: "BMW 320d Touring xLine Automatik", inactiveDays: 5 },
        status: "SENT",
        channelResults: { email: { channelId: emailChannel.id, status: "SENT" } },
        createdAt: daysAgo(9),
        deliveredAt: daysAgo(9),
      },
    });
  }
}

async function seedAppSettings() {
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

async function main() {
  console.log("Seeding CarWatch database...");

  await seedFeatures();
  const providerIds = await seedProviders();
  const listingIdBySlug = await seedVehiclesAndListings(providerIds);
  await seedDuplicateMatch(listingIdBySlug);
  const user = await seedUser();
  await seedSavedSearchAndAlerts(user.id, listingIdBySlug);
  await seedAppSettings();

  console.log(`Seeded ${listingIdBySlug.size} listings across ${providerIds.size} providers.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
