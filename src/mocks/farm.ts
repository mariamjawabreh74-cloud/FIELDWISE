import type {
  Farm,
  FarmProfile,
  InsufficientData,
  Place,
} from "../lib/api/types";

export const emptyProfile: FarmProfile = {
  soilType: "unknown",
  soilTest: {
    ph: null,
    organicMatter: null,
    nitrogen: null,
    phosphorus: null,
    potassium: null,
  },
  irrigation: "unknown",
  waterAvailability: "unknown",
  equipment: "unknown",
  budget: "unknown",
  labor: "unknown",
};

export const demoFarm: Farm = {
  simulated: true,
  id: "demo-jenin",
  name: "mock.farmName",
  location: { longitude: 35.285, latitude: 32.4596 },
  locationUnknown: false,
  boundary: {
    type: "Polygon",
    coordinates: [
      [
        [35.2838, 32.4589],
        [35.2857, 32.4586],
        [35.2862, 32.4601],
        [35.2843, 32.4605],
        [35.2838, 32.4589],
      ],
    ],
  },
  boundaryUnknown: false,
  profile: {
    ...emptyProfile,
    soilType: "loam",
    irrigation: "drip",
    waterAvailability: "seasonal",
    equipment: ["handTools", "pump"],
    budget: "low",
    labor: "medium",
  },
  cropHistory: [
    {
      id: "history-1",
      cropId: "wheat",
      season: "winter",
      plantedMonth: 11,
      harvestedMonth: 5,
      fieldFraction: 0.6,
      timing: "past",
    },
    {
      id: "history-2",
      cropId: "tomato",
      season: "summer",
      plantedMonth: 4,
      harvestedMonth: 8,
      fieldFraction: 0.4,
      timing: "current",
    },
  ],
  historyUnknown: false,
  priorities: {
    water_saving: 5,
    soil_health: 4,
    climate_resilience: 3,
    profit: 3,
    erosion_protection: 3,
    diversity: 2,
  },
  prioritiesUnknown: false,
  onboardingStep: 0,
};

export const insufficientExample: InsufficientData = {
  status: "insufficient_data",
  missing_inputs: ["location", "boundary"],
  simulated: true,
};
export const incompleteFarm: Farm = {
  ...demoFarm,
  id: "demo-insufficient",
  location: null,
  boundary: null,
  locationUnknown: true,
  boundaryUnknown: true,
};
export const demoPlaces: Place[] = [
  {
    id: "jenin",
    label: "mock.farmPlace",
    location: { longitude: 35.285, latitude: 32.4596 },
    simulated: true,
  },
  {
    id: "burqin",
    label: "mock.nearbyPlace",
    location: { longitude: 35.2591, latitude: 32.4568 },
    simulated: true,
  },
];
