import { buildPlaceholderImageUri, colorNameToHex, type PlaceholderShot } from "@carwatch/shared";

export interface SeedPriceEvent {
  daysAgo: number;
  price: number;
}

export interface SeedStatusEvent {
  daysAgo: number;
  status: "ACTIVE" | "INACTIVE" | "SOLD" | "EXPIRED" | "REMOVED";
}

export interface SeedVehicle {
  slug: string;
  manufacturer: string;
  model: string;
  generation?: string;
  variant?: string;
  year: number;
  firstRegistration: string; // ISO
  fuelType: "PETROL" | "DIESEL" | "ELECTRIC" | "HYBRID" | "PLUGIN_HYBRID" | "LPG" | "CNG" | "OTHER";
  transmission: "MANUAL" | "AUTOMATIC" | "SEMI_AUTOMATIC";
  engineCapacity: number;
  powerKw: number;
  powerHp: number;
  drivetrain: "FWD" | "RWD" | "AWD";
  bodyType: "SEDAN" | "HATCHBACK" | "WAGON" | "SUV" | "COUPE" | "CONVERTIBLE" | "VAN" | "PICKUP" | "OTHER";
  doors: number;
  seats: number;
  exteriorColor: string;
  vin?: string;
  features: string[];

  providerKey: string;
  providerListingId: string;
  title: string;
  description: string;
  mileage: number;
  sellerName: string;
  sellerType: "PRIVATE" | "DEALER" | "UNKNOWN";
  sellerPhone?: string;
  locationCity: string;
  locationRegion?: string;
  locationCountry: string;
  priceEvents: SeedPriceEvent[]; // chronological, oldest first
  statusEvents: SeedStatusEvent[];
  firstSeenDaysAgo: number;
  publishedDaysAgo?: number;
}

function images(slug: string, colorName: string, shots: PlaceholderShot[] = ["side", "front", "rear", "interior"]) {
  const colorHex = colorNameToHex(colorName);
  return shots.map((shot) => buildPlaceholderImageUri({ shot, colorHex, seed: slug }));
}

export const SEED_VEHICLES: SeedVehicle[] = [
  {
    slug: "vw-golf-mk7-tdi",
    manufacturer: "Volkswagen",
    model: "Golf",
    generation: "Mk7 (facelift)",
    variant: "Comfortline",
    year: 2017,
    firstRegistration: "2017-05-14",
    fuelType: "DIESEL",
    transmission: "MANUAL",
    engineCapacity: 1598,
    powerKw: 85,
    powerHp: 115,
    drivetrain: "FWD",
    bodyType: "HATCHBACK",
    doors: 5,
    seats: 5,
    exteriorColor: "Reflex Silver",
    vin: "WVWZZZAUZHW123456",
    features: ["led_headlights", "alloy_wheels", "parking_sensors_rear", "apple_carplay", "android_auto", "keyless_entry"],

    providerKey: "avto_net",
    providerListingId: "avn-3381204",
    title: "Volkswagen Golf 1.6 TDI Comfortline",
    description:
      "Redno servisiran pri pooblaščenem serviserju, vsa servisna knjižica. Nov tehnični pregled, registriran do 04/2026. Zimske in letne pnevmatike na platiščih.",
    mileage: 121000,
    sellerName: "AC Motors d.o.o.",
    sellerType: "DEALER",
    sellerPhone: "+386 41 234 567",
    locationCity: "Ljubljana",
    locationRegion: "Osrednjeslovenska",
    locationCountry: "Slovenia",
    priceEvents: [
      { daysAgo: 72, price: 12900 },
      { daysAgo: 30, price: 12500 },
      { daysAgo: 5, price: 11900 },
    ],
    statusEvents: [{ daysAgo: 72, status: "ACTIVE" }],
    firstSeenDaysAgo: 72,
    publishedDaysAgo: 72,
  },
  {
    slug: "skoda-octavia-3-combi-tdi",
    manufacturer: "Škoda",
    model: "Octavia",
    generation: "III",
    variant: "Style Combi",
    year: 2018,
    firstRegistration: "2018-03-02",
    fuelType: "DIESEL",
    transmission: "AUTOMATIC",
    engineCapacity: 1968,
    powerKw: 110,
    powerHp: 150,
    drivetrain: "FWD",
    bodyType: "WAGON",
    doors: 5,
    seats: 5,
    exteriorColor: "Moonlight Blue",
    vin: "TMBJJ7NE3J0123456",
    features: [
      "led_headlights",
      "adaptive_cruise_control",
      "heated_seats",
      "navigation",
      "parking_sensors_front",
      "parking_sensors_rear",
      "reverse_camera",
      "panoramic_roof",
    ],

    providerKey: "avto_net",
    providerListingId: "avn-3402911",
    title: "Škoda Octavia Combi 2.0 TDI DSG Style",
    description:
      "Lastnik od prve registracije, nekajenska. Polna oprema Style, DSG menjalnik, panoramska streha, adaptivni tempomat. Vsa dokumentacija urejena.",
    mileage: 98500,
    sellerName: "Marko P.",
    sellerType: "PRIVATE",
    sellerPhone: "+386 31 555 210",
    locationCity: "Maribor",
    locationRegion: "Podravska",
    locationCountry: "Slovenia",
    priceEvents: [
      { daysAgo: 45, price: 16900 },
      { daysAgo: 18, price: 16400 },
      { daysAgo: 3, price: 15800 },
    ],
    statusEvents: [{ daysAgo: 45, status: "ACTIVE" }],
    firstSeenDaysAgo: 45,
    publishedDaysAgo: 45,
  },
  {
    // Same physical car as above, also listed on Bolha -> demonstrates duplicate detection.
    slug: "skoda-octavia-3-combi-tdi-bolha",
    manufacturer: "Škoda",
    model: "Octavia",
    generation: "III",
    variant: "Style Combi",
    year: 2018,
    firstRegistration: "2018-03-02",
    fuelType: "DIESEL",
    transmission: "AUTOMATIC",
    engineCapacity: 1968,
    powerKw: 110,
    powerHp: 150,
    drivetrain: "FWD",
    bodyType: "WAGON",
    doors: 5,
    seats: 5,
    exteriorColor: "Moonlight Blue",
    features: ["led_headlights", "adaptive_cruise_control", "heated_seats", "navigation", "panoramic_roof"],

    providerKey: "bolha",
    providerListingId: "bolha-88221190",
    title: "Škoda Octavia Combi 2.0TDI Style DSG - top ohranjena",
    description: "Prodam Octavio Combi Style, DSG, panorama streha, adaptive cruise. Vse po dogovoru, ogled dobrodošel.",
    mileage: 98700,
    sellerName: "Marko",
    sellerType: "PRIVATE",
    locationCity: "Maribor",
    locationCountry: "Slovenia",
    priceEvents: [
      { daysAgo: 40, price: 16900 },
      { daysAgo: 3, price: 16200 },
    ],
    statusEvents: [{ daysAgo: 40, status: "ACTIVE" }],
    firstSeenDaysAgo: 40,
    publishedDaysAgo: 40,
  },
  {
    slug: "seat-leon-fr-tsi",
    manufacturer: "Seat",
    model: "Leon",
    generation: "III (facelift)",
    variant: "FR",
    year: 2019,
    firstRegistration: "2019-07-20",
    fuelType: "PETROL",
    transmission: "MANUAL",
    engineCapacity: 1498,
    powerKw: 110,
    powerHp: 150,
    drivetrain: "FWD",
    bodyType: "HATCHBACK",
    doors: 5,
    seats: 5,
    exteriorColor: "Nardo Grey",
    features: ["led_headlights", "alloy_wheels", "apple_carplay", "heated_seats", "reverse_camera", "keyless_entry"],

    providerKey: "doberavto",
    providerListingId: "da-551203",
    title: "Seat Leon FR 1.5 TSI 150 KM",
    description: "FR paket, sport vzmetenje, alu platišča 18\". Prvi lastnik, redni servisi pri pooblaščenem servisu.",
    mileage: 64200,
    sellerName: "Celje Avto Center",
    sellerType: "DEALER",
    sellerPhone: "+386 51 778 903",
    locationCity: "Celje",
    locationRegion: "Savinjska",
    locationCountry: "Slovenia",
    priceEvents: [{ daysAgo: 12, price: 15490 }],
    statusEvents: [{ daysAgo: 12, status: "ACTIVE" }],
    firstSeenDaysAgo: 12,
    publishedDaysAgo: 12,
  },
  {
    slug: "bmw-320d-touring",
    manufacturer: "BMW",
    model: "3 Series",
    generation: "F31",
    variant: "320d Touring",
    year: 2016,
    firstRegistration: "2016-02-11",
    fuelType: "DIESEL",
    transmission: "AUTOMATIC",
    engineCapacity: 1995,
    powerKw: 140,
    powerHp: 190,
    drivetrain: "RWD",
    bodyType: "WAGON",
    doors: 5,
    seats: 5,
    exteriorColor: "Titanium Grey",
    vin: "WBA8H91060K123456",
    features: [
      "led_headlights",
      "adaptive_cruise_control",
      "lane_assist",
      "leather_seats",
      "navigation",
      "heated_seats",
      "parking_sensors_front",
      "parking_sensors_rear",
      "blind_spot_monitor",
    ],

    providerKey: "mobile_de",
    providerListingId: "md-291884471",
    title: "BMW 320d Touring xLine Automatik LED Navi",
    description:
      "Scheckheftgepflegt, 2. Hand. Automatikgetriebe, LED-Scheinwerfer, Navigationssystem Professional, beheizte Sitze. Unfallfrei laut Vorbesitzer.",
    mileage: 142000,
    sellerName: "Auto Meier GmbH",
    sellerType: "DEALER",
    sellerPhone: "+49 89 123 4567",
    locationCity: "Munich",
    locationRegion: "Bavaria",
    locationCountry: "Germany",
    priceEvents: [
      { daysAgo: 60, price: 17900 },
      { daysAgo: 20, price: 17400 },
    ],
    statusEvents: [
      { daysAgo: 60, status: "ACTIVE" },
      { daysAgo: 14, status: "INACTIVE" },
      { daysAgo: 9, status: "ACTIVE" },
    ],
    firstSeenDaysAgo: 60,
    publishedDaysAgo: 60,
  },
  {
    slug: "audi-a4-avant-tdi-quattro",
    manufacturer: "Audi",
    model: "A4",
    generation: "B9",
    variant: "Avant 2.0 TDI quattro S line",
    year: 2017,
    firstRegistration: "2017-09-05",
    fuelType: "DIESEL",
    transmission: "AUTOMATIC",
    engineCapacity: 1968,
    powerKw: 140,
    powerHp: 190,
    drivetrain: "AWD",
    bodyType: "WAGON",
    doors: 5,
    seats: 5,
    exteriorColor: "Glacier White",
    features: [
      "led_headlights",
      "adaptive_cruise_control",
      "navigation",
      "leather_seats",
      "heated_seats",
      "panoramic_roof",
      "parking_sensors_front",
      "parking_sensors_rear",
      "reverse_camera",
      "android_auto",
      "apple_carplay",
    ],

    providerKey: "mobile_de",
    providerListingId: "md-304519802",
    title: "Audi A4 Avant 2.0 TDI quattro S line S tronic",
    description:
      "S line Ausstattung, quattro Allrad, S tronic. Standheizung, Panorama-Glasdach, virtuelles Cockpit. Vollausstattung, gepflegt.",
    mileage: 108300,
    sellerName: "Premium Cars Munich",
    sellerType: "DEALER",
    sellerPhone: "+49 89 987 6543",
    locationCity: "Munich",
    locationRegion: "Bavaria",
    locationCountry: "Germany",
    priceEvents: [
      { daysAgo: 25, price: 23900 },
      { daysAgo: 8, price: 22900 },
    ],
    statusEvents: [{ daysAgo: 25, status: "ACTIVE" }],
    firstSeenDaysAgo: 25,
    publishedDaysAgo: 25,
  },
  {
    slug: "toyota-corolla-hybrid",
    manufacturer: "Toyota",
    model: "Corolla",
    generation: "XII (E210)",
    variant: "1.8 Hybrid Active",
    year: 2020,
    firstRegistration: "2020-06-18",
    fuelType: "HYBRID",
    transmission: "AUTOMATIC",
    engineCapacity: 1798,
    powerKw: 90,
    powerHp: 122,
    drivetrain: "FWD",
    bodyType: "HATCHBACK",
    doors: 5,
    seats: 5,
    exteriorColor: "Celestial Silver",
    features: ["led_headlights", "reverse_camera", "parking_sensors_rear", "apple_carplay", "android_auto", "lane_assist"],

    providerKey: "avto_net",
    providerListingId: "avn-3455102",
    title: "Toyota Corolla 1.8 Hybrid Active",
    description: "Hibridni pogon, nizka poraba (4.2l/100km). Eno lastniško vozilo, garancija na hibridni sistem do 2030.",
    mileage: 52800,
    sellerName: "Ana K.",
    sellerType: "PRIVATE",
    locationCity: "Ljubljana",
    locationRegion: "Osrednjeslovenska",
    locationCountry: "Slovenia",
    priceEvents: [{ daysAgo: 8, price: 18490 }],
    statusEvents: [{ daysAgo: 8, status: "ACTIVE" }],
    firstSeenDaysAgo: 8,
    publishedDaysAgo: 8,
  },
  {
    slug: "mazda3-skyactiv",
    manufacturer: "Mazda",
    model: "3",
    generation: "IV (BP)",
    variant: "SkyActiv-G 2.0 Homura",
    year: 2019,
    firstRegistration: "2019-11-03",
    fuelType: "PETROL",
    transmission: "MANUAL",
    engineCapacity: 1998,
    powerKw: 121,
    powerHp: 165,
    drivetrain: "FWD",
    bodyType: "HATCHBACK",
    doors: 5,
    seats: 5,
    exteriorColor: "Deep Black",
    features: ["led_headlights", "heated_seats", "navigation", "reverse_camera", "alloy_wheels", "keyless_entry", "sunroof"],

    providerKey: "bolha",
    providerListingId: "bolha-90114482",
    title: "Mazda 3 Skyactiv-G 2.0 Homura - odlično ohranjena",
    description: "Homura oprema, bose zvočniki, head-up display, grelci sedežev. Nezgodna, redno servisirana.",
    mileage: 71400,
    sellerName: "Jure",
    sellerType: "PRIVATE",
    sellerPhone: "+386 40 112 233",
    locationCity: "Kranj",
    locationRegion: "Gorenjska",
    locationCountry: "Slovenia",
    priceEvents: [{ daysAgo: 16, price: 16900 }],
    statusEvents: [{ daysAgo: 16, status: "ACTIVE" }],
    firstSeenDaysAgo: 16,
    publishedDaysAgo: 16,
  },
];

export function seedVehicleImages(v: SeedVehicle) {
  return images(v.slug, v.exteriorColor);
}
