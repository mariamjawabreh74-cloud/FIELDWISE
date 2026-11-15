import type {
  DatasetKey,
  DatasetStatus,
  Indicator,
  Provenance,
} from "../lib/api/types";

export const documentationLinks: Record<DatasetKey, string> = {
  power: "https://power.larc.nasa.gov/docs/methodology/meteorology/",
  imerg: "https://gpm.nasa.gov/data/imerg",
  smap: "https://smap.jpl.nasa.gov/data/",
  modis: "https://modis.gsfc.nasa.gov/data/dataprod/mod13.php",
  landsat: "https://www.usgs.gov/landsat-missions/landsat-satellite-missions",
  srtm: "https://www.earthdata.nasa.gov/data/instruments/srtm",
  ecostress: "https://ecostress.jpl.nasa.gov/data",
};
export const resolutions: Record<DatasetKey, number> = {
  power: 55000,
  imerg: 10000,
  smap: 9000,
  modis: 250,
  landsat: 30,
  srtm: 30,
  ecostress: 70,
};
export function provenance(dataset: DatasetKey): Provenance {
  return {
    dataset,
    product: `mock.products.${dataset}`,
    periodStart: "2026-01-01",
    periodEnd: "2026-10-31",
    retrievedAt: "2026-11-14T00:00:00Z",
    citation: `datasets.${dataset}`,
    citationUrl: documentationLinks[dataset],
  };
}
export const datasets: DatasetStatus[] = (
  [
    "smap",
    "imerg",
    "power",
    "modis",
    "landsat",
    "srtm",
    "ecostress",
  ] as DatasetKey[]
).map((dataset) => ({
  dataset,
  simulated: true,
  status:
    dataset === "ecostress"
      ? "unavailable"
      : dataset === "landsat"
        ? "partial"
        : "ok",
  nativeResolutionM: resolutions[dataset],
  farmSmallerThanPixel: resolutions[dataset] >= 250,
  limitations: [
    ...(resolutions[dataset] >= 250 ? ["mock.limitations.regional"] : []),
    ...(dataset === "landsat" ? ["mock.limitations.clouds"] : []),
    ...(dataset === "smap" ? ["mock.limitations.surface"] : []),
    ...(dataset === "ecostress" ? ["mock.limitations.unavailable"] : []),
    ...(dataset === "srtm" ? ["mock.limitations.terrain"] : []),
    "mock.limitations.simulated",
  ],
  provenance: provenance(dataset),
}));
const timeSeries = (values: (number | null)[]) =>
  values.map((value, index) => ({
    date: `2026-${String(index + 1).padStart(2, "0")}-15`,
    value,
  }));
function indicator(
  key: string,
  dataset: DatasetKey,
  value: number | null,
  values: (number | null)[],
  unit: string,
  primary = true,
): Indicator {
  return {
    key,
    label:
      key === "terrain"
        ? "explore.terrain"
        : key === "evapotranspiration"
          ? "mock.products.ecostress"
          : `analysis.${key}`,
    value,
    unit,
    primary,
    confidence:
      dataset === "landsat" || dataset === "ecostress" ? "low" : "medium",
    series: timeSeries(values),
    derivedFrom: [dataset],
    nativeResolutionM: resolutions[dataset],
    dataGaps:
      dataset === "landsat"
        ? ["mock.gaps.clouds"]
        : dataset === "ecostress"
          ? ["mock.limitations.unavailable"]
          : ["mock.gaps.fieldObservation"],
    limitations: datasets.find((item) => item.dataset === dataset)!.limitations,
    provenance: provenance(dataset),
    simulated: true,
  };
}
export const indicators: Indicator[] = [
  indicator(
    "rainfall",
    "imerg",
    42.8,
    [112, 96, 78, 34, 9, 2, 0, 0, 8, 42.8],
    "mock.rainfallUnit",
  ),
  indicator(
    "temperature",
    "power",
    22.4,
    [11.4, 12.8, 15.5, 19.2, 23.6, 26.1, 28.7, 29.1, 26.6, 22.4],
    "mock.temperatureUnit",
  ),
  indicator(
    "soil_moisture",
    "smap",
    24,
    [34, 36, 33, 29, 24, 19, 16, 15, 18, 24],
    "mock.moistureUnit",
  ),
  indicator(
    "ndvi",
    "modis",
    0.61,
    [0.48, 0.55, 0.68, 0.72, 0.65, 0.52, 0.43, 0.39, 0.48, 0.61],
    "mock.ndviUnit",
  ),
  indicator(
    "ndvi",
    "landsat",
    0.58,
    [0.47, 0.53, null, 0.7, 0.64, null, 0.42, 0.38, 0.45, 0.58],
    "mock.ndviUnit",
    false,
  ),
  indicator(
    "terrain",
    "srtm",
    321,
    [321, 321, 321, 321, 321, 321, 321, 321, 321, 321],
    "api.elevationUnit",
    false,
  ),
  indicator(
    "evapotranspiration",
    "ecostress",
    null,
    [null, null, null, null, null, null, null, null, null, null],
    "api.evapotranspirationUnit",
    false,
  ),
];
