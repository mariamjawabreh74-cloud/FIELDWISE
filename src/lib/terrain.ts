import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  ShapeUtils,
  Vector2,
} from "three";
import type { Layer } from "./api/types";

export function validGrid(grid: unknown): grid is number[][] {
  return (
    Array.isArray(grid) &&
    grid.length >= 2 &&
    Array.isArray(grid[0]) &&
    grid[0].length >= 2 &&
    grid.every(
      (row) =>
        Array.isArray(row) &&
        row.length === grid[0].length &&
        row.every(Number.isFinite),
    )
  );
}
export function validLayer(layer: Layer): boolean {
  return (
    validGrid(layer.grid) &&
    validGrid(layer.comparisonGrid) &&
    Array.isArray(layer.extent) &&
    layer.extent.length === 4 &&
    layer.extent.every(Number.isFinite) &&
    layer.extent[2] > layer.extent[0] &&
    layer.extent[3] > layer.extent[1] &&
    layer.key in palettes
  );
}
export function sampleGrid(grid: number[][], u: number, v: number): number {
  const x = Math.max(0, Math.min(1, u)) * (grid[0].length - 1);
  const y = Math.max(0, Math.min(1, v)) * (grid.length - 1);
  const x0 = Math.floor(x),
    y0 = Math.floor(y),
    x1 = Math.min(x0 + 1, grid[0].length - 1),
    y1 = Math.min(y0 + 1, grid.length - 1);
  const top = grid[y0][x0] * (1 - (x - x0)) + grid[y0][x1] * (x - x0);
  const bottom = grid[y1][x0] * (1 - (x - x0)) + grid[y1][x1] * (x - x0);
  return top * (1 - (y - y0)) + bottom * (y - y0);
}
export function terrainMetrics(terrain: Layer) {
  const [west, south, east, north] = terrain.extent;
  const widthM =
    (east - west) * 111320 * Math.cos((((north + south) / 2) * Math.PI) / 180);
  const depthM = (north - south) * 111320;
  const scale = 13 / Math.max(widthM, depthM);
  const values = terrain.grid.flat();
  return {
    width: widthM * scale,
    depth: depthM * scale,
    scale,
    minimum: Math.min(...values),
    maximum: Math.max(...values),
  };
}
export function worldPoint(
  terrain: Layer,
  u: number,
  v: number,
  exaggeration: number,
  offset = 0,
): [number, number, number] {
  const metrics = terrainMetrics(terrain);
  return [
    (u - 0.5) * metrics.width,
    (sampleGrid(terrain.grid, u, v) - metrics.minimum) *
      metrics.scale *
      exaggeration +
      offset,
    (v - 0.5) * metrics.depth,
  ];
}
export function normalizedCoordinate(
  terrain: Layer,
  longitude: number,
  latitude: number,
): [number, number] {
  const [west, south, east, north] = terrain.extent;
  return [
    (longitude - west) / (east - west),
    (north - latitude) / (north - south),
  ];
}
const palettes = {
  terrain: ["#c8bb91", "#6b8653"],
  ndvi: ["#cbb989", "#4e7b4c"],
  rainfall: ["#d3e0ce", "#648f9b"],
  soil_moisture: ["#c7c59f", "#648b7c"],
  slope: ["#c9d2a7", "#aa8765"],
};

/** A single above-ground surface. No extruded volume or subsurface strata is generated. */
export function buildTerrainGeometry(
  terrain: Layer,
  overlay: Layer,
  exaggeration: number,
  comparison: number,
): BufferGeometry {
  const rows = terrain.grid.length,
    columns = terrain.grid[0].length;
  const positions: number[] = [],
    colors: number[] = [],
    indices: number[] = [];
  const values = [...overlay.grid.flat(), ...overlay.comparisonGrid.flat()];
  const low = Math.min(...values),
    high = Math.max(...values);
  const colorLow = new Color(palettes[overlay.key][0]),
    colorHigh = new Color(palettes[overlay.key][1]);
  const metrics = terrainMetrics(terrain);
  for (let row = 0; row < rows; row++)
    for (let column = 0; column < columns; column++) {
      const u = column / (columns - 1),
        v = row / (rows - 1);
      positions.push(
        (u - 0.5) * metrics.width,
        (terrain.grid[row][column] - metrics.minimum) *
          metrics.scale *
          exaggeration,
        (v - 0.5) * metrics.depth,
      );
      const source =
        u < comparison / 100 ? overlay.grid : overlay.comparisonGrid;
      const value = sampleGrid(source, u, v);
      const shade = Math.max(
        0,
        Math.min(1, (value - low) / Math.max(0.001, high - low)),
      );
      const color = colorLow.clone().lerp(colorHigh, shade);
      colors.push(color.r, color.g, color.b);
      if (row < rows - 1 && column < columns - 1) {
        const a = row * columns + column,
          b = a + 1,
          c = a + columns,
          d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
export function drapeBoundary(
  terrain: Layer,
  exaggeration: number,
): [number, number, number][] {
  const ring = terrain.boundary?.coordinates[0];
  if (!ring?.length) return [];
  const points: [number, number, number][] = [];
  for (let index = 0; index < ring.length - 1; index++) {
    const a = normalizedCoordinate(terrain, ring[index][0], ring[index][1]);
    const b = normalizedCoordinate(
      terrain,
      ring[index + 1][0],
      ring[index + 1][1],
    );
    for (let step = 0; step < 16; step++)
      points.push(
        worldPoint(
          terrain,
          a[0] + ((b[0] - a[0]) * step) / 16,
          a[1] + ((b[1] - a[1]) * step) / 16,
          exaggeration,
          0.045,
        ),
      );
  }
  if (points.length) points.push(points[0]);
  return points;
}
export function buildBoundaryFill(
  terrain: Layer,
  exaggeration: number,
): BufferGeometry | null {
  const ring = terrain.boundary?.coordinates[0]?.slice(0, -1);
  if (!ring || ring.length < 3) return null;
  const normalized = ring.map((point) =>
    normalizedCoordinate(terrain, point[0], point[1]),
  );
  const triangles = ShapeUtils.triangulateShape(
    normalized.map((point) => new Vector2(point[0], point[1])),
    [],
  );
  const positions: number[] = [];
  for (const triangle of triangles) {
    const [a, b, c] = triangle.map((index) => normalized[index]);
    const divisions = 12;
    const point = (i: number, j: number) =>
      worldPoint(
        terrain,
        a[0] +
          ((b[0] - a[0]) * i) / divisions +
          ((c[0] - a[0]) * j) / divisions,
        a[1] +
          ((b[1] - a[1]) * i) / divisions +
          ((c[1] - a[1]) * j) / divisions,
        exaggeration,
        0.025,
      );
    for (let i = 0; i < divisions; i++)
      for (let j = 0; j < divisions - i; j++) {
        positions.push(...point(i, j), ...point(i + 1, j), ...point(i, j + 1));
        if (i + j < divisions - 1)
          positions.push(
            ...point(i + 1, j),
            ...point(i + 1, j + 1),
            ...point(i, j + 1),
          );
      }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}
