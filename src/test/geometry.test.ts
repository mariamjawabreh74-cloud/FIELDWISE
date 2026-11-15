import { describe, expect, it } from "vitest";
import type { Polygon } from "geojson";
import { parseBoundaryCoordinates, validateBoundary } from "../lib/geometry";

const shape = (ring: number[][]): Polygon => ({
  type: "Polygon",
  coordinates: [ring],
});
describe("polygon area and validation", () => {
  it("calculates hectares and dunam from geodesic square meters", () => {
    const result = validateBoundary(
      shape([
        [0, 0],
        [0.001, 0],
        [0.001, 0.001],
        [0, 0.001],
        [0, 0],
      ]),
    );
    expect(result.valid).toBe(true);
    expect(result.areaM2).toBeCloseTo(12364, -1);
    expect(result.hectares).toBeCloseTo(result.areaM2 / 10000);
    expect(result.dunam).toBeCloseTo(result.areaM2 / 1000);
  });
  it("rejects an unclosed ring without silently closing it", () => {
    expect(
      validateBoundary(
        shape([
          [0, 0],
          [0.01, 0],
          [0.01, 0.01],
          [0, 0.01],
        ]),
      ).errors,
    ).toContain("not_closed");
  });
  it("rejects self-intersections", () => {
    expect(
      validateBoundary(
        shape([
          [0, 0],
          [0.01, 0.01],
          [0, 0.01],
          [0.01, 0],
          [0, 0],
        ]),
      ).errors,
    ).toContain("self_intersection");
  });
  it("rejects areas smaller than 100 square meters", () => {
    expect(
      validateBoundary(
        shape([
          [0, 0],
          [0.00001, 0],
          [0.00001, 0.00001],
          [0, 0.00001],
          [0, 0],
        ]),
      ).errors,
    ).toContain("too_small");
  });
  it("handles missing and invalid coordinates safely", () => {
    expect(validateBoundary(null).errors).toEqual(["missing"]);
    expect(
      validateBoundary(
        shape([
          [200, 0],
          [0.01, 0],
          [0, 0.01],
          [200, 0],
        ]),
      ).errors,
    ).toContain("invalid_coordinates");
    expect(
      validateBoundary(parseBoundaryCoordinates("not a coordinate")).valid,
    ).toBe(false);
  });
});
