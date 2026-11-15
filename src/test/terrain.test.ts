import { describe, expect, it } from "vitest";
import {
  buildBoundaryFill,
  buildTerrainGeometry,
  drapeBoundary,
  normalizedCoordinate,
  sampleGrid,
  validGrid,
  validLayer,
} from "../lib/terrain";
import { makeLayer } from "../mocks/terrain";

describe("above-ground terrain", () => {
  it("rejects empty, ragged, and non-finite height grids", () => {
    expect(validGrid([])).toBe(false);
    expect(validGrid([[1, 2], [3]])).toBe(false);
    expect(
      validGrid([
        [1, NaN],
        [3, 4],
      ]),
    ).toBe(false);
    expect(
      validGrid([
        [1, 2],
        [3, 4],
      ]),
    ).toBe(true);
  });
  it("interpolates the returned grid without inventing deeper soil layers", () => {
    expect(
      sampleGrid(
        [
          [1, 2],
          [3, 4],
        ],
        0.5,
        0.5,
      ),
    ).toBe(2.5);
    expect(
      sampleGrid(
        [
          [1, 2],
          [3, 4],
        ],
        -1,
        0,
      ),
    ).toBe(1);
  });
  it("builds one surface and drapes the farm polygon above it", () => {
    const terrain = makeLayer("terrain");
    expect(validLayer(terrain)).toBe(true);
    const geometry = buildTerrainGeometry(terrain, makeLayer("ndvi"), 1.5, 50);
    expect(geometry.getAttribute("position").count).toBe(32 * 32);
    expect(geometry.index?.count).toBe(31 * 31 * 6);
    const boundary = drapeBoundary(terrain, 1.5);
    expect(boundary.length).toBeGreaterThan(4);
    expect(boundary[0]).toEqual(boundary[boundary.length - 1]);
    expect(
      buildBoundaryFill(terrain, 1.5)?.getAttribute("position").count,
    ).toBeGreaterThan(3);
    geometry.dispose();
  });
  it("maps longitude and latitude using the layer extent", () => {
    const terrain = makeLayer("terrain");
    const [west, south, east, north] = terrain.extent;
    expect(
      normalizedCoordinate(terrain, (west + east) / 2, (south + north) / 2)[0],
    ).toBeCloseTo(0.5);
    expect(normalizedCoordinate(terrain, west, north)).toEqual([0, 0]);
  });
});
