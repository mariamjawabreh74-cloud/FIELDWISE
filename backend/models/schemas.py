from typing import Any, Dict, List, Literal, Optional, Tuple, Union
from pydantic import BaseModel, Field

Confidence = Literal["high", "medium", "low"]
DatasetKey = Literal["power", "imerg", "smap", "modis", "landsat", "srtm", "ecostress"]
DatasetState = Literal["queued", "running", "ok", "partial", "unavailable", "error"]
CriterionKey = Literal[
    "water_saving",
    "soil_health",
    "climate_resilience",
    "profit",
    "erosion_protection",
    "diversity",
]
StrategyKind = Literal["existing", "water_conservation", "soil_improvement"]
Season = Literal["winter", "spring", "summer", "autumn", "unknown"]
LayerKey = Literal["terrain", "ndvi", "rainfall", "soil_moisture", "slope"]
MissingInput = Literal["location", "boundary", "profile", "soil", "water", "history", "priorities"]

class Coordinates(BaseModel):
    longitude: float
    latitude: float

class Provenance(BaseModel):
    dataset: DatasetKey
    product: str
    version: Optional[str] = None
    periodStart: str
    periodEnd: str
    retrievedAt: str
    citation: str
    citationUrl: Optional[str] = None

class DatasetStatus(BaseModel):
    dataset: DatasetKey
    status: DatasetState
    nativeResolutionM: Optional[float] = None
    farmSmallerThanPixel: Optional[bool] = None
    limitations: List[str] = Field(default_factory=list)
    provenance: Optional[Provenance] = None
    simulated: bool = False

class SeriesPoint(BaseModel):
    date: str
    value: Optional[float] = None

class Indicator(BaseModel):
    key: str
    label: str
    value: Optional[float] = None
    unit: str
    confidence: Confidence
    series: Optional[List[SeriesPoint]] = None
    derivedFrom: List[DatasetKey]
    nativeResolutionM: float
    dataGaps: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)
    provenance: Provenance
    primary: Optional[bool] = True
    simulated: bool = False

class SoilTest(BaseModel):
    ph: Optional[float] = None
    organicMatter: Optional[float] = None
    nitrogen: Optional[float] = None
    phosphorus: Optional[float] = None
    potassium: Optional[float] = None

class FarmProfile(BaseModel):
    soilType: Literal["clay", "sandy", "loam", "unknown"] = "unknown"
    soilTest: SoilTest = Field(default_factory=SoilTest)
    irrigation: Literal["drip", "rainfed", "sprinkler", "flood", "unknown"] = "unknown"
    waterAvailability: Literal["reliable", "seasonal", "limited", "unknown"] = "unknown"
    equipment: Union[List[str], Literal["unknown"]] = "unknown"
    budget: Literal["low", "medium", "high", "unknown"] = "unknown"
    labor: Literal["low", "medium", "high", "unknown"] = "unknown"

class CropHistoryEntry(BaseModel):
    id: str
    cropId: Optional[str] = None
    season: Season = "unknown"
    plantedMonth: Optional[int] = None
    harvestedMonth: Optional[int] = None
    fieldFraction: Optional[float] = None
    timing: Literal["current", "past", "unknown"] = "unknown"

class Farm(BaseModel):
    id: str
    name: str
    location: Optional[Coordinates] = None
    locationUnknown: bool = False
    boundary: Optional[Dict[str, Any]] = None
    boundaryUnknown: bool = False
    profile: Optional[FarmProfile] = None
    cropHistory: List[CropHistoryEntry] = Field(default_factory=list)
    historyUnknown: bool = False
    priorities: Optional[Dict[str, float]] = None
    prioritiesUnknown: bool = False
    unknownPriorities: Optional[List[str]] = None
    onboardingStep: int = 0
    simulated: bool = False

class CreateFarmRequest(BaseModel):
    name: Optional[str] = None
    demo: Optional[bool] = None

class SaveLocationRequest(BaseModel):
    location: Optional[Coordinates] = None
    unknown: bool = False

class SaveBoundaryRequest(BaseModel):
    boundary: Optional[Dict[str, Any]] = None
    unknown: bool = False

SaveProfileRequest = FarmProfile

class SaveCropHistoryRequest(BaseModel):
    entries: List[CropHistoryEntry]
    unknown: bool = False

class SavePrioritiesRequest(BaseModel):
    weights: Dict[str, float]
    unknown: bool = False
    unknownCriteria: Optional[List[str]] = None

class StartAnalysisRequest(BaseModel):
    demoMode: Optional[Literal["complete", "insufficient_data"]] = None

class AnalysisRun(BaseModel):
    id: str
    farmId: str
    stage: Literal["queued", "running", "complete", "error"]
    progress: int
    datasets: List[DatasetStatus]
    simulated: bool = False

class Layer(BaseModel):
    key: LayerKey
    label: str
    grid: List[List[float]]
    comparisonGrid: List[List[float]]
    extent: List[float]  # [west, south, east, north]
    nativeResolutionM: float
    illustrative: bool
    dates: List[str]  # [dateA, dateB]
    unit: str
    boundary: Optional[Dict[str, Any]] = None
    provenance: Provenance
    limitations: List[str] = Field(default_factory=list)
    simulated: bool = False

class CriterionScore(BaseModel):
    score: float
    confidence: Union[Confidence, Literal["none"]]
    evidence: List[str] = Field(default_factory=list)
    assumptions: List[str] = Field(default_factory=list)
    dataGaps: List[str] = Field(default_factory=list)

class RotationEntry(BaseModel):
    cropId: str
    season: Season
    months: List[int]  # [start, end]

class Strategy(BaseModel):
    kind: StrategyKind
    rotation: List[RotationEntry]
    criteria: Dict[str, CriterionScore]
    totalScore: float
    risks: List[Dict[str, str]] = Field(default_factory=list)
    simulated: bool = False

class Comparison(BaseModel):
    strategies: List[Strategy]
    weights: Dict[str, float]
    simulated: bool = False

class Recommendation(BaseModel):
    strategy: StrategyKind
    summary: str
    confidence: Confidence
    dataGaps: List[str] = Field(default_factory=list)
    simulated: bool = False

class ActionTask(BaseModel):
    id: str
    month: int
    title: str
    description: str
    effort: str
    simulated: bool = False

class ActionPlan(BaseModel):
    strategy: StrategyKind
    year: int
    tasks: List[ActionTask]
    simulated: bool = False

class MethodologyDataset(DatasetStatus):
    documentationUrl: str

class MethodologyFormula(BaseModel):
    id: str
    title: str
    description: str
    backendPlaceholder: bool

class Methodology(BaseModel):
    datasets: List[MethodologyDataset]
    limitations: List[str]
    formulas: List[MethodologyFormula]
    simulated: bool = False

class CropNames(BaseModel):
    ar: str
    en: str

class Crop(BaseModel):
    id: str
    names: CropNames
    label: str
    family: str
    color: str
    simulated: bool = False

class Place(BaseModel):
    id: str
    label: str
    location: Coordinates
    simulated: bool = False

class SaveScenarioRequest(BaseModel):
    rotation: List[RotationEntry]

# Envelope models
class SuccessEnvelope(BaseModel):
    status: Literal["ok"] = "ok"
    simulated: bool = False
    data: Any

class InsufficientDataEnvelope(BaseModel):
    status: Literal["insufficient_data"] = "insufficient_data"
    simulated: bool = False
    missing_inputs: List[MissingInput]
