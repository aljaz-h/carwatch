export interface DemoTemplate {
  id: string;
  manufacturer: string;
  model: string;
  generation?: string;
  variant?: string;
  year: number;
  fuelType: "PETROL" | "DIESEL" | "ELECTRIC" | "HYBRID";
  transmission: "MANUAL" | "AUTOMATIC";
  engineCapacity: number;
  powerKw: number;
  powerHp: number;
  drivetrain: "FWD" | "RWD" | "AWD";
  bodyType: "HATCHBACK" | "SEDAN" | "WAGON" | "SUV";
  color: string;
  basePrice: number;
  baseMileage: number;
  city: string;
  country: string;
  features: string[];
}

export const DEMO_TEMPLATES: DemoTemplate[] = [
  {
    id: "demo-1001",
    manufacturer: "Renault",
    model: "Clio",
    generation: "V",
    variant: "Intens TCe 100",
    year: 2021,
    fuelType: "PETROL",
    transmission: "MANUAL",
    engineCapacity: 999,
    powerKw: 74,
    powerHp: 100,
    drivetrain: "FWD",
    bodyType: "HATCHBACK",
    color: "Deep Black",
    basePrice: 13900,
    baseMileage: 38000,
    city: "Koper",
    country: "Slovenia",
    features: ["led_headlights", "apple_carplay", "reverse_camera"],
  },
  {
    id: "demo-1002",
    manufacturer: "Hyundai",
    model: "i30",
    generation: "III",
    variant: "1.5 T-GDI N Line",
    year: 2022,
    fuelType: "PETROL",
    transmission: "MANUAL",
    engineCapacity: 1482,
    powerKw: 118,
    powerHp: 160,
    drivetrain: "FWD",
    bodyType: "HATCHBACK",
    color: "Titanium Grey",
    basePrice: 19900,
    baseMileage: 21000,
    city: "Graz",
    country: "Austria",
    features: ["led_headlights", "adaptive_cruise_control", "heated_seats", "navigation"],
  },
  {
    id: "demo-1003",
    manufacturer: "Ford",
    model: "Focus",
    generation: "IV",
    variant: "1.0 EcoBoost ST-Line",
    year: 2020,
    fuelType: "PETROL",
    transmission: "MANUAL",
    engineCapacity: 999,
    powerKw: 92,
    powerHp: 125,
    drivetrain: "FWD",
    bodyType: "HATCHBACK",
    color: "Glacier White",
    basePrice: 14500,
    baseMileage: 61000,
    city: "Zagreb",
    country: "Croatia",
    features: ["led_headlights", "alloy_wheels", "reverse_camera"],
  },
  {
    id: "demo-1004",
    manufacturer: "Volvo",
    model: "V60",
    generation: "II",
    variant: "D3 Momentum",
    year: 2019,
    fuelType: "DIESEL",
    transmission: "AUTOMATIC",
    engineCapacity: 1969,
    powerKw: 110,
    powerHp: 150,
    drivetrain: "FWD",
    bodyType: "WAGON",
    color: "Celestial Silver",
    basePrice: 20900,
    baseMileage: 88000,
    city: "Villach",
    country: "Austria",
    features: ["led_headlights", "adaptive_cruise_control", "leather_seats", "navigation", "parking_sensors_front"],
  },
  {
    id: "demo-1005",
    manufacturer: "Škoda",
    model: "Fabia",
    generation: "IV",
    variant: "1.0 TSI Style",
    year: 2021,
    fuelType: "PETROL",
    transmission: "MANUAL",
    engineCapacity: 999,
    powerKw: 81,
    powerHp: 110,
    drivetrain: "FWD",
    bodyType: "HATCHBACK",
    color: "Moonlight Blue",
    basePrice: 12900,
    baseMileage: 29500,
    city: "Novo Mesto",
    country: "Slovenia",
    features: ["led_headlights", "apple_carplay", "android_auto"],
  },
];
