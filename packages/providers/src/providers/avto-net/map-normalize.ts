import type { BodyType, DrivetrainType, FuelType, NormalizedListing, SellerType, TransmissionType } from "@carwatch/shared";
import type { RawListingPayload } from "../../types";
import type { AvtoNetRawDetail } from "./parse-detail";
import { parseMonthYear, parsePower, parseSloveneDate, parseSloveneNumber } from "./parse-utils";

const FUEL_MAP: Record<string, FuelType> = {
  dizel: "DIESEL",
  bencin: "PETROL",
  elektrika: "ELECTRIC",
  hibrid: "HYBRID",
  "plug-in hibrid": "PLUGIN_HYBRID",
  "plin (lpg)": "LPG",
  "plin (cng)": "CNG",
};

const TRANSMISSION_MAP: Record<string, TransmissionType> = {
  "ročni": "MANUAL",
  "avtomatski": "AUTOMATIC",
  "polavtomatski": "SEMI_AUTOMATIC",
};

const DRIVETRAIN_MAP: Record<string, DrivetrainType> = {
  prednji: "FWD",
  zadnji: "RWD",
  "4x4": "AWD",
  "vsi štirje": "AWD",
};

const BODY_TYPE_MAP: Record<string, BodyType> = {
  hatchback: "HATCHBACK",
  limuzina: "SEDAN",
  karavan: "WAGON",
  kombi: "VAN",
  terensko: "SUV",
  suv: "SUV",
  kupe: "COUPE",
  cabrio: "CONVERTIBLE",
  "pick-up": "PICKUP",
};

/** Best-effort mapping of free-text Avto.net equipment lines to CarWatch's feature catalog keys. */
const EQUIPMENT_KEYWORDS: Array<[RegExp, string]> = [
  [/led/i, "led_headlights"],
  [/ksenon|xenon/i, "xenon_headlights"],
  [/gretj?e?\s*sede/i, "heated_seats"],
  [/hlaje.*sede/i, "ventilated_seats"],
  [/gretj?e?\s*volan/i, "heated_steering_wheel"],
  [/adaptiv.*tempomat/i, "adaptive_cruise_control"],
  [/lane|smerni asistent/i, "lane_assist"],
  [/mrtvi kot/i, "blind_spot_monitor"],
  [/parkirni senzorji.*spred/i, "parking_sensors_front"],
  [/parkirni senzorji.*zad/i, "parking_sensors_rear"],
  [/kamera/i, "reverse_camera"],
  [/navigaci/i, "navigation"],
  [/carplay/i, "apple_carplay"],
  [/android auto/i, "android_auto"],
  [/panoramsk/i, "panoramic_roof"],
  [/usnj/i, "leather_seats"],
  [/brez ključa|keyless/i, "keyless_entry"],
  [/aluminijast/i, "alloy_wheels"],
  [/vlečn/i, "tow_bar"],
  [/strešn.*okn|sunroof/i, "sunroof"],
];

function mapEquipmentToFeatures(equipment: string[]): string[] {
  const features = new Set<string>();
  for (const line of equipment) {
    for (const [pattern, key] of EQUIPMENT_KEYWORDS) {
      if (pattern.test(line)) features.add(key);
    }
  }
  return [...features];
}

function mapSellerType(contactType: string | undefined): SellerType {
  if (!contactType) return "UNKNOWN";
  const normalized = contactType.trim().toLowerCase();
  if (normalized.includes("prodajalec") || normalized.includes("dealer")) return "DEALER";
  if (normalized.includes("zasebnik") || normalized.includes("private")) return "PRIVATE";
  return "UNKNOWN";
}

export function normalizeAvtoNetListing(raw: RawListingPayload<AvtoNetRawDetail>): NormalizedListing {
  const { data } = raw;
  const specs = data.specs;

  const power = parsePower(specs["Moč"]);
  const [locationCity, locationRegion] = (data.contact.location ?? "").split(",").map((s) => s.trim());

  return {
    providerListingId: raw.providerListingId,
    title: data.title,
    description: data.description,
    price: data.price ?? 0,
    originalPrice: data.priceOld,
    currency: "EUR",
    mileage: parseSloveneNumber(specs["Prevoženih"]),
    sellerName: data.contact.name,
    sellerType: mapSellerType(data.contact.type),
    sellerPhone: data.contact.phone,
    locationCity: locationCity || undefined,
    locationRegion: locationRegion || undefined,
    locationCountry: "Slovenia",
    url: raw.url,
    images: data.images,
    publishedAt: parseSloveneDate(data.publishedText),
    status: "ACTIVE",
    rawMetadata: { specs, equipment: data.equipment, sourcePublishedText: data.publishedText },
    vehicle: {
      manufacturer: specs["Znamka"] ?? "Unknown",
      model: specs["Model"] ?? "Unknown",
      generation: specs["Modelska oznaka"],
      variant: specs["Tip"],
      firstRegistration: parseMonthYear(specs["1. registracija"]),
      year: parseMonthYear(specs["1. registracija"]) ? Number(parseMonthYear(specs["1. registracija"])!.slice(0, 4)) : undefined,
      fuelType: FUEL_MAP[specs["Gorivo"]?.toLowerCase() ?? ""],
      transmission: TRANSMISSION_MAP[specs["Menjalnik"]?.toLowerCase() ?? ""],
      engineCapacity: parseSloveneNumber(specs["Motor"]),
      powerKw: power.kw,
      powerHp: power.hp,
      drivetrain: DRIVETRAIN_MAP[specs["Pogon"]?.toLowerCase() ?? ""],
      bodyType: BODY_TYPE_MAP[specs["Karoserija"]?.toLowerCase() ?? ""],
      doors: parseSloveneNumber(specs["Št. vrat"]),
      seats: parseSloveneNumber(specs["Št. sedežev"]),
      exteriorColor: specs["Barva"],
      vin: specs["Št. šasije (VIN)"],
      features: mapEquipmentToFeatures(data.equipment),
    },
  };
}
