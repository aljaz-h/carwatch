-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'PLUGIN_HYBRID', 'LPG', 'CNG', 'OTHER');

-- CreateEnum
CREATE TYPE "TransmissionType" AS ENUM ('MANUAL', 'AUTOMATIC', 'SEMI_AUTOMATIC');

-- CreateEnum
CREATE TYPE "DrivetrainType" AS ENUM ('FWD', 'RWD', 'AWD');

-- CreateEnum
CREATE TYPE "BodyType" AS ENUM ('SEDAN', 'HATCHBACK', 'WAGON', 'SUV', 'COUPE', 'CONVERTIBLE', 'VAN', 'PICKUP', 'OTHER');

-- CreateEnum
CREATE TYPE "SellerType" AS ENUM ('PRIVATE', 'DEALER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SOLD', 'EXPIRED', 'REMOVED');

-- CreateEnum
CREATE TYPE "ProviderStatus" AS ENUM ('HEALTHY', 'DEGRADED', 'DOWN', 'DISABLED');

-- CreateEnum
CREATE TYPE "ScrapeRunStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "DuplicateMatchStatus" AS ENUM ('PENDING', 'LIKELY', 'CONFIRMED', 'UNRELATED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('NEW_MATCH', 'PRICE_DROP', 'PRICE_INCREASE', 'LISTING_RETURNED', 'LISTING_REMOVED', 'SIGNIFICANT_CHANGE', 'GOOD_DEAL');

-- CreateEnum
CREATE TYPE "AlertChannelType" AS ENUM ('DISCORD', 'EMAIL', 'TELEGRAM', 'WEBPUSH', 'NTFY', 'GOTIFY');

-- CreateEnum
CREATE TYPE "NotificationEventStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ipAddress" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "generation" TEXT,
    "variant" TEXT,
    "year" INTEGER,
    "firstRegistration" TIMESTAMP(3),
    "fuelType" "FuelType",
    "transmission" "TransmissionType",
    "engineCapacity" INTEGER,
    "powerKw" INTEGER,
    "powerHp" INTEGER,
    "drivetrain" "DrivetrainType",
    "bodyType" "BodyType",
    "doors" INTEGER,
    "seats" INTEGER,
    "exteriorColor" TEXT,
    "vin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "features" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT,

    CONSTRAINT "features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_features" (
    "vehicleId" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,

    CONSTRAINT "vehicle_features_pkey" PRIMARY KEY ("vehicleId","featureId")
);

-- CreateTable
CREATE TABLE "providers" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "scrapeIntervalMinutes" INTEGER NOT NULL DEFAULT 60,
    "config" JSONB NOT NULL DEFAULT '{}',
    "status" "ProviderStatus" NOT NULL DEFAULT 'HEALTHY',
    "lastSuccessAt" TIMESTAMP(3),
    "lastErrorAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_scrape_runs" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" "ScrapeRunStatus" NOT NULL DEFAULT 'RUNNING',
    "listingsDiscovered" INTEGER NOT NULL DEFAULT 0,
    "listingsNew" INTEGER NOT NULL DEFAULT 0,
    "listingsUpdated" INTEGER NOT NULL DEFAULT 0,
    "listingsUnchanged" INTEGER NOT NULL DEFAULT 0,
    "listingsRemoved" INTEGER NOT NULL DEFAULT 0,
    "errorsCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "durationMs" INTEGER,

    CONSTRAINT "provider_scrape_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "providerListingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "originalPrice" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "mileage" INTEGER,
    "sellerName" TEXT,
    "sellerType" "SellerType" NOT NULL DEFAULT 'UNKNOWN',
    "sellerPhone" TEXT,
    "locationCity" TEXT,
    "locationRegion" TEXT,
    "locationCountry" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "url" TEXT NOT NULL,
    "images" TEXT[],
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "rawMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_history" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_history" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "status" "ListingStatus" NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mileage_history" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "mileage" INTEGER NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mileage_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_change_logs" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_change_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duplicate_matches" (
    "id" TEXT NOT NULL,
    "listingAId" TEXT NOT NULL,
    "listingBId" TEXT NOT NULL,
    "vehicleAId" TEXT NOT NULL,
    "vehicleBId" TEXT NOT NULL,
    "status" "DuplicateMatchStatus" NOT NULL DEFAULT 'PENDING',
    "score" DOUBLE PRECISION NOT NULL,
    "matchedFields" JSONB NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "duplicate_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_searches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "required" JSONB NOT NULL DEFAULT '{}',
    "preferred" JSONB NOT NULL DEFAULT '{}',
    "excluded" JSONB NOT NULL DEFAULT '{}',
    "notifyNewMatch" BOOLEAN NOT NULL DEFAULT true,
    "minMatchScore" INTEGER NOT NULL DEFAULT 70,
    "maxPrice" INTEGER,
    "notifyPriceDrop" BOOLEAN NOT NULL DEFAULT true,
    "minPriceDropAmount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_search_matches" (
    "id" TEXT NOT NULL,
    "savedSearchId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "scoreBreakdown" JSONB NOT NULL,
    "firstMatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastEvaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_search_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watchlist_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watchlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_channels" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AlertChannelType" NOT NULL,
    "label" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "savedSearchId" TEXT,
    "listingId" TEXT,
    "dedupeKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "NotificationEventStatus" NOT NULL DEFAULT 'PENDING',
    "channelResults" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "alert_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "vehicles_manufacturer_model_idx" ON "vehicles"("manufacturer", "model");

-- CreateIndex
CREATE INDEX "vehicles_year_idx" ON "vehicles"("year");

-- CreateIndex
CREATE INDEX "vehicles_fuelType_idx" ON "vehicles"("fuelType");

-- CreateIndex
CREATE INDEX "vehicles_transmission_idx" ON "vehicles"("transmission");

-- CreateIndex
CREATE INDEX "vehicles_bodyType_idx" ON "vehicles"("bodyType");

-- CreateIndex
CREATE INDEX "vehicles_vin_idx" ON "vehicles"("vin");

-- CreateIndex
CREATE UNIQUE INDEX "features_key_key" ON "features"("key");

-- CreateIndex
CREATE INDEX "vehicle_features_featureId_idx" ON "vehicle_features"("featureId");

-- CreateIndex
CREATE UNIQUE INDEX "providers_key_key" ON "providers"("key");

-- CreateIndex
CREATE INDEX "provider_scrape_runs_providerId_startedAt_idx" ON "provider_scrape_runs"("providerId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "listings_vehicleId_key" ON "listings"("vehicleId");

-- CreateIndex
CREATE INDEX "listings_price_idx" ON "listings"("price");

-- CreateIndex
CREATE INDEX "listings_mileage_idx" ON "listings"("mileage");

-- CreateIndex
CREATE INDEX "listings_status_idx" ON "listings"("status");

-- CreateIndex
CREATE INDEX "listings_firstSeenAt_idx" ON "listings"("firstSeenAt");

-- CreateIndex
CREATE INDEX "listings_lastSeenAt_idx" ON "listings"("lastSeenAt");

-- CreateIndex
CREATE INDEX "listings_providerId_idx" ON "listings"("providerId");

-- CreateIndex
CREATE INDEX "listings_isAvailable_idx" ON "listings"("isAvailable");

-- CreateIndex
CREATE UNIQUE INDEX "listings_providerId_providerListingId_key" ON "listings"("providerId", "providerListingId");

-- CreateIndex
CREATE INDEX "price_history_listingId_recordedAt_idx" ON "price_history"("listingId", "recordedAt");

-- CreateIndex
CREATE INDEX "status_history_listingId_recordedAt_idx" ON "status_history"("listingId", "recordedAt");

-- CreateIndex
CREATE INDEX "mileage_history_listingId_recordedAt_idx" ON "mileage_history"("listingId", "recordedAt");

-- CreateIndex
CREATE INDEX "listing_change_logs_listingId_recordedAt_idx" ON "listing_change_logs"("listingId", "recordedAt");

-- CreateIndex
CREATE INDEX "duplicate_matches_status_idx" ON "duplicate_matches"("status");

-- CreateIndex
CREATE UNIQUE INDEX "duplicate_matches_listingAId_listingBId_key" ON "duplicate_matches"("listingAId", "listingBId");

-- CreateIndex
CREATE INDEX "saved_searches_userId_idx" ON "saved_searches"("userId");

-- CreateIndex
CREATE INDEX "saved_search_matches_listingId_idx" ON "saved_search_matches"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "saved_search_matches_savedSearchId_listingId_key" ON "saved_search_matches"("savedSearchId", "listingId");

-- CreateIndex
CREATE INDEX "watchlist_items_userId_idx" ON "watchlist_items"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "watchlist_items_userId_listingId_key" ON "watchlist_items"("userId", "listingId");

-- CreateIndex
CREATE INDEX "notification_channels_userId_idx" ON "notification_channels"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "alert_events_dedupeKey_key" ON "alert_events"("dedupeKey");

-- CreateIndex
CREATE INDEX "alert_events_userId_createdAt_idx" ON "alert_events"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "alert_events_type_idx" ON "alert_events"("type");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_features" ADD CONSTRAINT "vehicle_features_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_features" ADD CONSTRAINT "vehicle_features_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_scrape_runs" ADD CONSTRAINT "provider_scrape_runs_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mileage_history" ADD CONSTRAINT "mileage_history_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_change_logs" ADD CONSTRAINT "listing_change_logs_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duplicate_matches" ADD CONSTRAINT "duplicate_matches_listingAId_fkey" FOREIGN KEY ("listingAId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duplicate_matches" ADD CONSTRAINT "duplicate_matches_listingBId_fkey" FOREIGN KEY ("listingBId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duplicate_matches" ADD CONSTRAINT "duplicate_matches_vehicleAId_fkey" FOREIGN KEY ("vehicleAId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duplicate_matches" ADD CONSTRAINT "duplicate_matches_vehicleBId_fkey" FOREIGN KEY ("vehicleBId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duplicate_matches" ADD CONSTRAINT "duplicate_matches_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_search_matches" ADD CONSTRAINT "saved_search_matches_savedSearchId_fkey" FOREIGN KEY ("savedSearchId") REFERENCES "saved_searches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_search_matches" ADD CONSTRAINT "saved_search_matches_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_channels" ADD CONSTRAINT "notification_channels_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_savedSearchId_fkey" FOREIGN KEY ("savedSearchId") REFERENCES "saved_searches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
