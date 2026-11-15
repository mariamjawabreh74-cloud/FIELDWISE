import type { Layer, LayerKey } from "../lib/api/types";
import type { Polygon } from "geojson";
import { demoFarm } from "./farm";
import { provenance, resolutions } from "./environment";

/** Synthetic surface, not surveyed elevation. Never represents underground soil layers. */
const SIZE = 32;
const grid = Array.from({ length: SIZE }, (_, row) =>
  Array.from({ length: SIZE }, (_, col) => {
    const x = col / (SIZE - 1),
      y = row / (SIZE - 1);
    return (
      Math.round(
        (300 +
          32 * Math.sin(x * 3.4 + 0.4) * Math.cos(y * 2.5) +
          15 * Math.sin(y * 6 + x * 1.3) +
          8 * x) *
          10,
      ) / 10
    );
  }),
);
export function makeLayer(
  key: LayerKey,
  boundary: Polygon | null = demoFarm.boundary,
): Layer {
  const source =
    key === "ndvi"
      ? "modis"
      : key === "rainfall"
        ? "imerg"
        : key === "soil_moisture"
          ? "smap"
          : "srtm";
  const layerGrid =
    key === "terrain"
      ? grid
      : grid.map((row, y) =>
          row.map((height, x) => {
            const signal = (Math.sin(x * 0.21) + Math.cos(y * 0.17) + 2) / 4;
            if (key === "ndvi") return 0.28 + signal * 0.48;
            if (key === "rainfall") return 25 + signal * 35;
            if (key === "soil_moisture") return 14 + signal * 22;
            return Math.abs(Math.sin(height * 0.07)) * 15;
          }),
        );
  const ring = boundary?.coordinates[0];
  let extent: Layer["extent"] = [35.281, 32.457, 35.289, 32.463];
  if (ring?.length) {
    const west = Math.min(...ring.map((point) => point[0])),
      east = Math.max(...ring.map((point) => point[0]));
    const south = Math.min(...ring.map((point) => point[1])),
      north = Math.max(...ring.map((point) => point[1]));
    const paddingX = Math.max(0.001, (east - west) * 0.75),
      paddingY = Math.max(0.001, (north - south) * 0.75);
    extent = [
      west - paddingX,
      south - paddingY,
      east + paddingX,
      north + paddingY,
    ];
  }
  return {
    simulated: true,
    key,
    label: `explore.${key}`,
    grid: layerGrid,
    comparisonGrid: layerGrid.map((row, y) =>
      row.map((value, x) =>
        key === "terrain"
          ? value
          : value * (0.7 + 0.2 * Math.sin((x + y) * 0.1)),
      ),
    ),
    extent,
    nativeResolutionM: resolutions[source],
    illustrative: true,
    dates: ["2026-03-15", "2026-10-15"],
    unit:
      key === "terrain"
        ? "api.elevationUnit"
        : key === "rainfall"
          ? "mock.rainfallUnit"
          : key === "soil_moisture"
            ? "mock.moistureUnit"
            : key === "slope"
              ? "api.slopeUnit"
              : "mock.ndviUnit",
    boundary,
    provenance: provenance(source),
    limitations: [
      "mock.limitations.terrain",
      "mock.limitations.scale",
      "mock.limitations.simulated",
    ],
  };
}
