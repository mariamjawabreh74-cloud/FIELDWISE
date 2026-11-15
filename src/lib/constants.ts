import type { CriterionKey, Weights } from "./api/types";

/** UI configuration only. No farm measurements or API fixture data live here. */
export const CRITERIA: CriterionKey[] = [
  "water_saving",
  "soil_health",
  "climate_resilience",
  "profit",
  "erosion_protection",
  "diversity",
];
export const BALANCED_WEIGHTS: Weights = {
  water_saving: 3,
  soil_health: 3,
  climate_resilience: 3,
  profit: 3,
  erosion_protection: 3,
  diversity: 3,
};
export const WIZARD_STEPS = [
  { path: "/start", label: "onboarding.intro" },
  { path: "/farm/location", label: "onboarding.location" },
  { path: "/farm/boundary", label: "onboarding.boundary" },
  { path: "/farm/profile", label: "onboarding.profile" },
  { path: "/farm/history", label: "onboarding.history" },
  { path: "/farm/priorities", label: "onboarding.priorities" },
];
export const MISSING_INPUT_ROUTES = {
  location: "/farm/location",
  boundary: "/farm/boundary",
  profile: "/farm/profile",
  soil: "/farm/profile",
  water: "/farm/profile",
  history: "/farm/history",
  priorities: "/farm/priorities",
};
