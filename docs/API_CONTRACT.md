# FIELDWISE frontend API contract

This repository is a static, frontend-only client. It contains no backend, API routes, database, server actions, AI calls, or secrets. `src/lib/api/types.ts` is the authoritative TypeScript contract. All component data access goes through hooks and the `api` object in `src/lib/api/client.ts`.

## Mode switch and transport

Default: `VITE_USE_MOCK=true` (also the fallback when missing). Set **exactly** `VITE_USE_MOCK=false` and `VITE_API_BASE_URL=https://your-backend.example/v1` in a local `.env` or your frontend deployment environment, then rebuild. The base URL is optional in mock mode, required in HTTP mode. A missing URL causes a visible retryable error, never an implicit fallback to fake data. Variables prefixed with `VITE_` are public; do not put secrets in them.

The paths below are appended to the base URL. Requests use JSON, `Accept: application/json` and `Accept-Language: ar|en`. The backend must permit the frontend origin using CORS. No authentication scheme is assumed. Add your own credential handling centrally in `http.ts`. Requests time out after 20 seconds. Neither client performs AI inference.

## Response envelopes

Every successful endpoint returns:

```json
{ "status": "ok", "simulated": false, "data": "the typed payload below" }
```

All mock envelopes, farm entities, layers, crop records, indicators, strategies, dataset states, and action tasks carry `"simulated": true`. A response with `simulated: true` triggers the visible banner even when received through the HTTP client. The application also labels simulated scoring, map overlays, illustrative terrain, missing observations, and approximate source resolutions.

When a required input is unavailable, return this **instead of** a recommendation or other fabricated payload:

```json
{
  "status": "insufficient_data",
  "simulated": false,
  "missing_inputs": ["location", "boundary"]
}
```

`missing_inputs` is an ordered list of `location | boundary | profile | soil | water | history | priorities`. The UI displays every entry and links directly to the relevant form. It does not infer additional missing entries. Return this with HTTP 200 or 422; both are handled as a domain result, not a transport failure. Never attach recommendation data to this envelope. Other failures use a non-2xx code and a JSON error body. The UI shows a friendly retry state instead of exposing raw server text.

All API human-readable fields (`label`, `product`, `citation`, evidence, assumptions, data gaps, risks, task text) accept localized plain text. For bundled mocks, they are translation keys resolved through `src/locales/ar.json` and `en.json`. Dates use ISO 8601; month indices are 1–12. Coordinates and GeoJSON follow **longitude, latitude**, WGS84/EPSG:4326. Polygon rings must be closed.

## Endpoints

| Client function     | Method | Path                                        | Request                  | Success `data` type |
| ------------------- | ------ | ------------------------------------------- | ------------------------ | ------------------- |
| `createFarm`        | POST   | `/farms`                                    | `CreateFarmRequest`      | `Farm`              |
| `getFarm`           | GET    | `/farms/:farmId`                            | none                     | `Farm`              |
| `saveLocation`      | PUT    | `/farms/:farmId/location`                   | `SaveLocationRequest`    | `Farm`              |
| `saveBoundary`      | PUT    | `/farms/:farmId/boundary`                   | `SaveBoundaryRequest`    | `Farm`              |
| `saveProfile`       | PUT    | `/farms/:farmId/profile`                    | `SaveProfileRequest`     | `Farm`              |
| `saveCropHistory`   | PUT    | `/farms/:farmId/crop-history`               | `SaveCropHistoryRequest` | `Farm`              |
| `savePriorities`    | PUT    | `/farms/:farmId/priorities`                 | `SavePrioritiesRequest`  | `Farm`              |
| `startAnalysis`     | POST   | `/farms/:farmId/analysis`                   | `StartAnalysisRequest`   | `AnalysisRun`       |
| `getAnalysisStatus` | GET    | `/farms/:farmId/analysis`                   | none                     | `AnalysisRun`       |
| `getIndicators`     | GET    | `/farms/:farmId/indicators`                 | none                     | `Indicator[]`       |
| `getLayer`          | GET    | `/farms/:farmId/layers/:key`                | `key: LayerKey`          | `Layer`             |
| `getScenarios`      | GET    | `/farms/:farmId/scenarios`                  | none                     | `Strategy[]`        |
| `saveScenario`      | PUT    | `/farms/:farmId/scenarios/:kind`            | `SaveScenarioRequest`    | `Strategy[]`        |
| `getComparison`     | GET    | `/farms/:farmId/comparison`                 | none                     | `Comparison`        |
| `getRecommendation` | GET    | `/farms/:farmId/recommendation`             | none                     | `Recommendation`    |
| `getActionPlan`     | GET    | `/farms/:farmId/action-plan?strategy=:kind` | query: `StrategyKind`    | `ActionPlan`        |
| `getMethodology`    | GET    | `/methodology`                              | none                     | `Methodology`       |
| `getCrops`          | GET    | `/crops`                                    | none                     | `Crop[]`            |
| `searchPlaces`      | GET    | `/places?q=:query`                          | query: string            | `Place[]`           |

`getFarm`, `saveLocation`, `saveScenario` and `searchPlaces` are small additions to the requested API to keep maps, persisted rotations, and location search behind the same boundary.

## Request definitions

```ts
interface CreateFarmRequest {
  name?: string;
  demo?: boolean;
}
interface SaveLocationRequest {
  location: { longitude: number; latitude: number } | null;
  unknown: boolean;
}
interface SaveBoundaryRequest {
  boundary: GeoJSON.Polygon | null;
  unknown: boolean;
}
interface SaveCropHistoryRequest {
  entries: CropHistoryEntry[];
  unknown: boolean;
}
interface SavePrioritiesRequest {
  weights: Record<CriterionKey, number>;
  unknown: boolean;
  unknownCriteria?: CriterionKey[];
}
interface StartAnalysisRequest {
  demoMode?: "complete" | "insufficient_data";
}
interface SaveScenarioRequest {
  rotation: RotationEntry[];
}
```

`demo` and `demoMode` are mock-only conveniences. Your backend may reject them or implement an explicit sandbox. They are not credentials. `saveProfile` takes the full `FarmProfile` object. All mutation endpoints return the complete updated `Farm`, except `saveScenario` which returns all updated strategies. Unknown answers are legitimate values, not validation errors.

### Farm and profile

`Farm` contains `id`, `name`, nullable `location`, nullable GeoJSON `boundary`, nullable `profile`, `cropHistory[]`, nullable `priorities`, `onboardingStep`, and `simulated`. Unknown flags: `locationUnknown`, `boundaryUnknown`, `historyUnknown`, `prioritiesUnknown`.

`FarmProfile`: `soilType = clay|sandy|loam|unknown`; `soilTest = {ph, organicMatter, nitrogen, phosphorus, potassium}` (all nullable numbers); `irrigation = drip|rainfed|sprinkler|flood|unknown`; `waterAvailability = reliable|seasonal|limited|unknown`; `equipment = string[]|'unknown'`; `budget` and `labor = low|medium|high|unknown`. pH: 0–14; organic matter: 0–100%; nutrients: nonnegative mg/kg.

`CropHistoryEntry`: `id`, nullable `cropId`, `season = winter|spring|summer|autumn|unknown`, nullable `plantedMonth` and `harvestedMonth`, nullable `fieldFraction` (0–1), `timing = current|past|unknown`. Array order is rotation order. Missing months are `null`, never made-up values. Crops return names in both Arabic and English plus a label, family identifier, display color, and simulation flag.

Criteria: `water_saving`, `soil_health`, `climate_resilience`, `profit`, `erosion_protection`, `diversity`. Weights range from 1 to 5. Choosing unknown keeps equal **demo** weights and `prioritiesUnknown=true`; do not interpret those as farmer-provided preferences. Per-criterion unknown choices are sent as `unknownCriteria[]` and returned on `Farm.unknownPriorities[]`. A neutral demo weight for an unknown criterion is not a farmer-provided value.

### Analysis and provenance

`AnalysisRun` contains `id`, `farmId`, `stage = queued|running|complete|error`, progress 0–100, `datasets: DatasetStatus[]`, and `simulated`. The frontend polls while queued/running. Individual states are `queued|running|ok|partial|unavailable|error`; **partial is intentionally added** to distinguish incomplete observations from a failed request. Mock Landsat is partial; mock ECOSTRESS is unavailable. Missing indicator values and time-series samples are `null`, never zero. This is the intentional nullable extension to the original `Indicator` type.

Every indicator carries `confidence`, `derivedFrom`, `nativeResolutionM`, `dataGaps`, `limitations`, `provenance`, and `simulated`. Provenance includes dataset, product, optional version, periodStart, periodEnd, retrievedAt, citation, optional citationUrl. The mock retrievedAt is itself simulated, not a claim of an actual retrieval. Dataset source resolution is not field-level accuracy.

### Layers

`Layer`: `key`, `label`, `grid: number[][]`, `comparisonGrid: number[][]`, extent `[west,south,east,north]`, `nativeResolutionM`, `illustrative`, `dates: [dateA,dateB]`, `unit`, nullable GeoJSON `boundary`, provenance, `limitations[]`, simulated. Valid keys are `terrain`, `ndvi`, `rainfall`, `soil_moisture`, and `slope`. Grids are rectangular, row 0 is north, column 0 is west. Terrain heights are meters above a common datum; no subsurface geometry is supported. Other layer grids must have the same dimensions and extent as the terrain grid. Both dates have explicit grids. The frontend does not invent finer accuracy when rendering a smooth mesh. Layer limitations are supplied by the API rather than embedded in the viewer.

### Strategies, evidence, recommendation, and action plan

`Strategy.kind = existing|water_conservation|soil_improvement`. Each strategy contains `rotation: {cropId,season,months:[start,end]}[]`, criterion scores, `totalScore`, risks, and simulated. A criterion score has a 0–100 score, `confidence = high|medium|low|none`, evidence[], assumptions[], dataGaps[]. A missing score must have `confidence='none'`; it is excluded from the weighted demo total, not assigned zero. UI evidence drawers also show strategy risks. The frontend pure scoring function is demonstration-only. The backend is responsible for validated agronomic scores, uncertainty, assumptions, and recommendations. Reordering a mock rotation does not generate fresh agronomic evidence.

`Comparison`: strategies[], weights, simulated. For `simulated: false`, the client displays the backend `totalScore` and disables demo reweighting instead of applying an unvalidated frontend model to real data. `Recommendation`: strategy, localized summary, confidence, dataGaps[], simulated. Recommendation is separately loaded and is never displayed for an insufficient-data response. For authoritative live reweighting, add a comparison mutation centrally to `Api` and `http.ts` and connect it in the comparison hook.

`ActionPlan`: strategy, year, tasks[], simulated. `ActionTask`: id, month (1–12), title, description, effort, simulated. Checklist completion is local UI state, not a backend mutation. The chosen strategy and checks are stored per farm. Printing includes every month, not just the currently filtered month.

`Methodology`: datasets[] (dataset status + documentationUrl), limitations[], formulas[] (`id`, `title`, `description`, `backendPlaceholder`), simulated. Formula integration notes explicitly mark where backend-calibrated definitions belong.

## Local state, maps, and persistence

Draft farm inputs, language, chosen strategy, and action checks are local browser state. Mock and HTTP drafts use separate storage keys. Mock API persistence is isolated inside `mock.ts`; components never import fixtures. Default mock latency is 240–560 ms. A demo run advances through queued/running/final states over approximately 4.5 seconds. Reloading a completed demo is supported; incomplete farm input never produces a recommendation.

MapLibre downloads public CARTO/OpenStreetMap basemap tiles without keys. These are external **display assets**, not farm-analysis API calls. Geolocation is optional and uses the browser permission API. Demo place search only recognizes Jenin/Burqin (Arabic or English). The real `/places` endpoint can implement your preferred geocoder. All application `fetch` calls live in `http.ts`.
