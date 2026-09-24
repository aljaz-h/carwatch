import type { BodyType, DrivetrainType, FuelType, SellerType, TransmissionType } from "./enums";

/** Specification of the physical car, independent of any single advertisement. */
export interface NormalizedVehicle {
  manufacturer: string;
  model: string;
  generation?: string;
  variant?: string;
  year?: number;
  firstRegistration?: string; // ISO date
  fuelType?: FuelType;
  transmission?: TransmissionType;
  engineCapacity?: number; // cc
  powerKw?: number;
  powerHp?: number;
  drivetrain?: DrivetrainType;
  bodyType?: BodyType;
  doors?: number;
  seats?: number;
  exteriorColor?: string;
  vin?: string;
  features: string[]; // feature keys, e.g. "led_headlights"
}

/** A single advertisement for a NormalizedVehicle on a given marketplace. */
export interface NormalizedListing {
  providerListingId: string;
  title: string;
  description?: string;
  price: number;
  originalPrice?: number;
  currency: string;
  mileage?: number;
  sellerName?: string;
  sellerType: SellerType;
  sellerPhone?: string;
  locationCity?: string;
  locationRegion?: string;
  locationCountry?: string;
  latitude?: number;
  longitude?: number;
  url: string;
  images: string[];
  publishedAt?: string; // ISO date
  status: "ACTIVE" | "INACTIVE" | "SOLD" | "EXPIRED" | "REMOVED";
  rawMetadata?: Record<string, unknown>;
  vehicle: NormalizedVehicle;
}

export interface FeatureDefinition {
  key: string;
  label: string;
  category: "comfort" | "safety" | "technology" | "exterior" | "other";
}

export const FEATURE_CATALOG: FeatureDefinition[] = [
  { key: "led_headlights", label: "LED headlights", category: "exterior" },
  { key: "xenon_headlights", label: "Xenon headlights", category: "exterior" },
  { key: "heated_seats", label: "Heated seats", category: "comfort" },
  { key: "ventilated_seats", label: "Ventilated seats", category: "comfort" },
  { key: "heated_steering_wheel", label: "Heated steering wheel", category: "comfort" },
  { key: "adaptive_cruise_control", label: "Adaptive cruise control", category: "safety" },
  { key: "lane_assist", label: "Lane keep assist", category: "safety" },
  { key: "blind_spot_monitor", label: "Blind spot monitor", category: "safety" },
  { key: "parking_sensors_front", label: "Front parking sensors", category: "safety" },
  { key: "parking_sensors_rear", label: "Rear parking sensors", category: "safety" },
  { key: "reverse_camera", label: "Reverse camera", category: "safety" },
  { key: "navigation", label: "Built-in navigation", category: "technology" },
  { key: "apple_carplay", label: "Apple CarPlay", category: "technology" },
  { key: "android_auto", label: "Android Auto", category: "technology" },
  { key: "panoramic_roof", label: "Panoramic roof", category: "exterior" },
  { key: "leather_seats", label: "Leather seats", category: "comfort" },
  { key: "keyless_entry", label: "Keyless entry", category: "comfort" },
  { key: "alloy_wheels", label: "Alloy wheels", category: "exterior" },
  { key: "tow_bar", label: "Tow bar", category: "other" },
  { key: "sunroof", label: "Sunroof", category: "exterior" },
];
