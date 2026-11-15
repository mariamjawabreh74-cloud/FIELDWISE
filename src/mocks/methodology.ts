import type { Methodology } from "../lib/api/types";
import { datasets, documentationLinks } from "./environment";

export const methodology: Methodology = {
  simulated: true,
  datasets: datasets.map((dataset) => ({
    ...dataset,
    documentationUrl: documentationLinks[dataset.dataset],
  })),
  limitations: [
    "mock.limitations.simulated",
    "mock.limitations.regional",
    "mock.limitations.scale",
    "mock.limitations.surface",
    "mock.limitations.noSoilTest",
    "mock.limitations.notForecast",
    "mock.limitations.clouds",
    "mock.limitations.terrain",
  ],
  formulas: ["weighted", "area", "terrain", "future"].map((id) => ({
    id,
    title: `mock.method.${id}Title`,
    description: `mock.method.${id}Body`,
    backendPlaceholder: id === "future",
  })),
};
