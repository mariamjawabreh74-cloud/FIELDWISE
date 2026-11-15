import type { Polygon } from "geojson";

export type Confidence = "high" | "medium" | "low";
export type DatasetKey =
  | "power"
  | "imerg"
  | "smap"
  | "modis"
  | "landsat"
  | "srtm"
  | "ecostress";
export type DatasetState =
  | "queued"
  | "running"
  | "ok"
  | "partial"
  | "unavailable"
  | "error";
export type CriterionKey =
  | "water_saving"
  | "soil_health"
  | "climate_resilience"
  | "profit"
  | "erosion_protection"
  | "diversity";
export type StrategyKind =
  | "existing"
  | "water_conservation"
  | "soil_improvement";
export type Season = "winter" | "spring" | "summer" | "autumn" | "unknown";
export type LayerKey =
  | "terrain"
  | "ndvi"
  | "rainfall"
  | "soil_moisture"
  | "slope";
export type MissingInput =
  | "location"
  | "boundary"
  | "profile"
  | "soil"
  | "water"
  | "history"
  | "priorities";
export type Weights = Record<CriterionKey, number>;
export type Coordinates = { longitude: number; latitude: number };

export interface Simulated {
  simulated: boolean;
}
export interface InsufficientData extends Simulated {
  status: "insufficient_data";
  missing_inputs: MissingInput[];
}
export interface Success<T> extends Simulated {
  status: "ok";
  data: T;
}
export type ApiResponse<T> = Success<T> | InsufficientData;

/** Human-readable API fields may be translated text or a key in the bundled translation files. */
export interface Provenance {
  dataset: DatasetKey;
  product: string;
  version?: string;
  periodStart: string;
  periodEnd: string;
  retrievedAt: string;
  citation: string;
  citationUrl?: string;
}
export interface DatasetStatus extends Simulated {
  dataset: DatasetKey;
  status: DatasetState;
  nativeResolutionM?: number;
  farmSmallerThanPixel?: boolean;
  limitations: string[];
  provenance?: Provenance;
}
export interface Indicator extends Simulated {
  key: string;
  label: string;
  value: number | null;
  unit: string;
  confidence: Confidence;
  series?: { date: string; value: number | null }[];
  derivedFrom: DatasetKey[];
  nativeResolutionM: number;
  dataGaps: string[];
  limitations: string[];
  provenance: Provenance;
  primary?: boolean;
}
export interface SoilTest {
  ph: number | null;
  organicMatter: number | null;
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
}
export interface FarmProfile {
  soilType: "clay" | "sandy" | "loam" | "unknown";
  soilTest: SoilTest;
  irrigation: "drip" | "rainfed" | "sprinkler" | "flood" | "unknown";
  waterAvailability: "reliable" | "seasonal" | "limited" | "unknown";
  equipment: string[] | "unknown";
  budget: "low" | "medium" | "high" | "unknown";
  labor: "low" | "medium" | "high" | "unknown";
}
export interface CropHistoryEntry {
  id: string;
  cropId: string | null;
  season: Season;
  plantedMonth: number | null;
  harvestedMonth: number | null;
  fieldFraction: number | null;
  timing: "current" | "past" | "unknown";
}
export interface Farm extends Simulated {
  id: string;
  name: string;
  location: Coordinates | null;
  locationUnknown: boolean;
  boundary: Polygon | null;
  boundaryUnknown: boolean;
  profile: FarmProfile | null;
  cropHistory: CropHistoryEntry[];
  historyUnknown: boolean;
  priorities: Weights | null;
  prioritiesUnknown: boolean;
  unknownPriorities?: CriterionKey[];
  onboardingStep: number;
}
export interface CreateFarmRequest {
  name?: string;
  demo?: boolean;
}
export interface SaveLocationRequest {
  location: Coordinates | null;
  unknown: boolean;
}
export interface SaveBoundaryRequest {
  boundary: Polygon | null;
  unknown: boolean;
}
export type SaveProfileRequest = FarmProfile;
export interface SaveCropHistoryRequest {
  entries: CropHistoryEntry[];
  unknown: boolean;
}
export interface SavePrioritiesRequest {
  weights: Weights;
  unknown: boolean;
  unknownCriteria?: CriterionKey[];
}
export interface StartAnalysisRequest {
  demoMode?: "complete" | "insufficient_data";
}
export interface AnalysisRun extends Simulated {
  id: string;
  farmId: string;
  stage: "queued" | "running" | "complete" | "error";
  progress: number;
  datasets: DatasetStatus[];
}
export interface Layer extends Simulated {
  key: LayerKey;
  label: string;
  grid: number[][];
  comparisonGrid: number[][];
  extent: [number, number, number, number];
  nativeResolutionM: number;
  illustrative: boolean;
  dates: [string, string];
  unit: string;
  boundary: Polygon | null;
  provenance: Provenance;
  limitations: string[];
}
export interface CriterionScore {
  score: number;
  confidence: Confidence | "none";
  evidence: string[];
  assumptions: string[];
  dataGaps: string[];
}
export interface RotationEntry {
  cropId: string;
  season: Season;
  months: [number, number];
}
export interface Strategy extends Simulated {
  kind: StrategyKind;
  rotation: RotationEntry[];
  criteria: Record<CriterionKey, CriterionScore>;
  totalScore: number;
  risks: { type: string; text: string }[];
}
export interface Comparison extends Simulated {
  strategies: Strategy[];
  weights: Weights;
}
export interface Recommendation extends Simulated {
  strategy: StrategyKind;
  summary: string;
  confidence: Confidence;
  dataGaps: string[];
}
export interface ActionTask extends Simulated {
  id: string;
  month: number;
  title: string;
  description: string;
  effort: string;
}
export interface ActionPlan extends Simulated {
  strategy: StrategyKind;
  year: number;
  tasks: ActionTask[];
}
export interface MethodologyDataset extends DatasetStatus {
  documentationUrl: string;
}
export interface Methodology extends Simulated {
  datasets: MethodologyDataset[];
  limitations: string[];
  formulas: {
    id: string;
    title: string;
    description: string;
    backendPlaceholder: boolean;
  }[];
}
export interface Crop extends Simulated {
  id: string;
  names: { ar: string; en: string };
  label: string;
  family: string;
  color: string;
}
export interface Place extends Simulated {
  id: string;
  label: string;
  location: Coordinates;
}
export interface SearchPlacesRequest {
  query: string;
}
export interface SaveScenarioRequest {
  rotation: RotationEntry[];
}

/** Both clients implement this interface. Components access it only through hooks. */
export interface Api {
  readonly isMock: boolean;
  createFarm(request: CreateFarmRequest): Promise<ApiResponse<Farm>>;
  getFarm(farmId: string): Promise<ApiResponse<Farm>>;
  saveLocation(
    farmId: string,
    request: SaveLocationRequest,
  ): Promise<ApiResponse<Farm>>;
  saveBoundary(
    farmId: string,
    request: SaveBoundaryRequest,
  ): Promise<ApiResponse<Farm>>;
  saveProfile(
    farmId: string,
    request: SaveProfileRequest,
  ): Promise<ApiResponse<Farm>>;
  saveCropHistory(
    farmId: string,
    request: SaveCropHistoryRequest,
  ): Promise<ApiResponse<Farm>>;
  savePriorities(
    farmId: string,
    request: SavePrioritiesRequest,
  ): Promise<ApiResponse<Farm>>;
  startAnalysis(
    farmId: string,
    request?: StartAnalysisRequest,
  ): Promise<ApiResponse<AnalysisRun>>;
  getAnalysisStatus(farmId: string): Promise<ApiResponse<AnalysisRun>>;
  getIndicators(farmId: string): Promise<ApiResponse<Indicator[]>>;
  getLayer(farmId: string, key: LayerKey): Promise<ApiResponse<Layer>>;
  getScenarios(farmId: string): Promise<ApiResponse<Strategy[]>>;
  saveScenario(
    farmId: string,
    kind: StrategyKind,
    request: SaveScenarioRequest,
  ): Promise<ApiResponse<Strategy[]>>;
  getComparison(farmId: string): Promise<ApiResponse<Comparison>>;
  getRecommendation(farmId: string): Promise<ApiResponse<Recommendation>>;
  getActionPlan(
    farmId: string,
    strategy: StrategyKind,
  ): Promise<ApiResponse<ActionPlan>>;
  getMethodology(): Promise<ApiResponse<Methodology>>;
  getCrops(): Promise<ApiResponse<Crop[]>>;
  searchPlaces(request: SearchPlacesRequest): Promise<ApiResponse<Place[]>>;
}
