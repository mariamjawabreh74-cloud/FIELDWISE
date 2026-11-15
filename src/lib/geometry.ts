import { area, kinks, polygon } from "@turf/turf";
import type { Polygon } from "geojson";

export type BoundaryError =
  | "missing"
  | "too_small"
  | "not_closed"
  | "self_intersection"
  | "invalid_coordinates";
export interface BoundaryValidation {
  valid: boolean;
  errors: BoundaryError[];
  areaM2: number;
  hectares: number;
  dunam: number;
}
export function validateBoundary(
  geometry: Polygon | null,
  minimumAreaM2 = 100,
): BoundaryValidation {
  const result: BoundaryValidation = {
    valid: false,
    errors: [],
    areaM2: 0,
    hectares: 0,
    dunam: 0,
  };
  if (!geometry?.coordinates.length) return { ...result, errors: ["missing"] };
  const rings = geometry.coordinates;
  if (
    rings.some(
      (ring) =>
        ring.length < 4 ||
        ring.some(
          (point) =>
            point.length < 2 ||
            !Number.isFinite(point[0]) ||
            !Number.isFinite(point[1]) ||
            Math.abs(point[0]) > 180 ||
            Math.abs(point[1]) > 90,
        ),
    )
  )
    return { ...result, errors: ["invalid_coordinates"] };
  if (
    rings.some(
      (ring) =>
        ring[0][0] !== ring[ring.length - 1][0] ||
        ring[0][1] !== ring[ring.length - 1][1],
    )
  )
    return { ...result, errors: ["not_closed"] };
  if (
    rings.some(
      (ring) =>
        new Set(ring.slice(0, -1).map((point) => point.join(","))).size < 3,
    )
  )
    return { ...result, errors: ["invalid_coordinates"] };
  try {
    const feature = polygon(rings);
    if (kinks(feature).features.length) result.errors.push("self_intersection");
    result.areaM2 = area(feature);
    result.hectares = result.areaM2 / 10000;
    result.dunam = result.areaM2 / 1000;
    if (result.areaM2 < minimumAreaM2) result.errors.push("too_small");
    result.valid = result.errors.length === 0;
    return result;
  } catch {
    return { ...result, errors: ["invalid_coordinates"] };
  }
}
export function parseBoundaryCoordinates(text: string): Polygon | null {
  const lines = text.trim().split(/\n+/).filter(Boolean);
  if (!lines.length) return null;
  return {
    type: "Polygon",
    coordinates: [lines.map((line) => line.split(/[ ,;]+/).map(Number))],
  };
}
export function formatBoundaryCoordinates(boundary: Polygon | null): string {
  return (
    boundary?.coordinates[0]
      ?.map((point) => `${point[0]}, ${point[1]}`)
      .join("\n") ?? ""
  );
}
