import { z } from "zod";
import type { FarmProfile } from "./api/types";

const nutrient = z.number().min(0, "profile.nonnegative").nullable();
export const profileSchema = z.object({
  soilType: z.enum(["clay", "sandy", "loam", "unknown"]),
  soilTest: z.object({
    ph: z
      .number()
      .min(0, "profile.phRange")
      .max(14, "profile.phRange")
      .nullable(),
    organicMatter: z
      .number()
      .min(0, "profile.percentRange")
      .max(100, "profile.percentRange")
      .nullable(),
    nitrogen: nutrient,
    phosphorus: nutrient,
    potassium: nutrient,
  }),
  irrigation: z.enum(["drip", "rainfed", "sprinkler", "flood", "unknown"]),
  waterAvailability: z.enum(["reliable", "seasonal", "limited", "unknown"]),
  equipment: z.union([z.array(z.string()), z.literal("unknown")]),
  budget: z.enum(["low", "medium", "high", "unknown"]),
  labor: z.enum(["low", "medium", "high", "unknown"]),
});
export const emptyProfileValues: FarmProfile = {
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
export const farmNameSchema = z.object({
  name: z.string().max(100).optional(),
  unknown: z.boolean(),
});
export const locationSchema = z.object({
  longitude: z.number().min(-180).max(180),
  latitude: z.number().min(-90).max(90),
});
export const cropHistorySchema = z
  .object({
    unknown: z.boolean(),
    entries: z.array(
      z.object({
        id: z.string(),
        cropId: z.string().nullable(),
        season: z.enum(["winter", "spring", "summer", "autumn", "unknown"]),
        plantedMonth: z.number().int().min(1).max(12).nullable(),
        harvestedMonth: z.number().int().min(1).max(12).nullable(),
        fieldFraction: z.number().min(0).max(1).nullable(),
        timing: z.enum(["current", "past", "unknown"]),
      }),
    ),
  })
  .refine((value) => value.unknown || value.entries.length > 0, {
    message: "history.invalidCrop",
    path: ["entries"],
  });
export const prioritiesSchema = z.object({
  weights: z.object({
    water_saving: z.number().min(1).max(5),
    soil_health: z.number().min(1).max(5),
    climate_resilience: z.number().min(1).max(5),
    profit: z.number().min(1).max(5),
    erosion_protection: z.number().min(1).max(5),
    diversity: z.number().min(1).max(5),
  }),
  unknown: z.boolean(),
});
