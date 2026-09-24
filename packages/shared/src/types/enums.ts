// String-literal unions mirroring the Prisma enums (packages/database/prisma/schema.prisma).
// Kept independent of @prisma/client so packages like @carwatch/providers can use these
// types without depending on the database package or a generated Prisma client.

export const FUEL_TYPES = [
  "PETROL",
  "DIESEL",
  "ELECTRIC",
  "HYBRID",
  "PLUGIN_HYBRID",
  "LPG",
  "CNG",
  "OTHER",
] as const;
export type FuelType = (typeof FUEL_TYPES)[number];

export const TRANSMISSION_TYPES = ["MANUAL", "AUTOMATIC", "SEMI_AUTOMATIC"] as const;
export type TransmissionType = (typeof TRANSMISSION_TYPES)[number];

export const DRIVETRAIN_TYPES = ["FWD", "RWD", "AWD"] as const;
export type DrivetrainType = (typeof DRIVETRAIN_TYPES)[number];

export const BODY_TYPES = [
  "SEDAN",
  "HATCHBACK",
  "WAGON",
  "SUV",
  "COUPE",
  "CONVERTIBLE",
  "VAN",
  "PICKUP",
  "OTHER",
] as const;
export type BodyType = (typeof BODY_TYPES)[number];

export const SELLER_TYPES = ["PRIVATE", "DEALER", "UNKNOWN"] as const;
export type SellerType = (typeof SELLER_TYPES)[number];

export const LISTING_STATUSES = ["ACTIVE", "INACTIVE", "SOLD", "EXPIRED", "REMOVED"] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const PROVIDER_STATUSES = ["HEALTHY", "DEGRADED", "DOWN", "DISABLED"] as const;
export type ProviderStatusValue = (typeof PROVIDER_STATUSES)[number];

export const ALERT_TYPES = [
  "NEW_MATCH",
  "PRICE_DROP",
  "PRICE_INCREASE",
  "LISTING_RETURNED",
  "LISTING_REMOVED",
  "SIGNIFICANT_CHANGE",
  "GOOD_DEAL",
] as const;
export type AlertType = (typeof ALERT_TYPES)[number];

export const ALERT_CHANNEL_TYPES = ["DISCORD", "EMAIL", "TELEGRAM", "WEBPUSH", "NTFY", "GOTIFY"] as const;
export type AlertChannelType = (typeof ALERT_CHANNEL_TYPES)[number];
