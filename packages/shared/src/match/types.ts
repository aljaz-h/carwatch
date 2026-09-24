/** Subset of a Listing + Vehicle used for deterministic saved-search matching. */
export interface MatchableListing {
  listingId: string;
  price: number;
  mileage?: number;
  manufacturer: string;
  model: string;
  generation?: string;
  variant?: string;
  year?: number;
  powerHp?: number;
  engineCapacity?: number;
  fuelType?: string;
  transmission?: string;
  drivetrain?: string;
  bodyType?: string;
  features: string[];
  locationCountry?: string;
  locationRegion?: string;
  providerKey?: string;
  sellerType?: string;
  damaged?: boolean;
  nonRunning?: boolean;
  partsCarOnly?: boolean;
}

export interface MatchCheck {
  key: string;
  label: string;
  passed: boolean;
}

export interface MatchResult {
  isMatch: boolean;
  disqualified: boolean;
  score: number; // 0-100
  requiredChecks: MatchCheck[];
  preferredChecks: MatchCheck[];
  excludedChecks: MatchCheck[];
}
