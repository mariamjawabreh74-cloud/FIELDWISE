import json
import uuid
from pathlib import Path
from typing import Dict, List, Optional
from backend.config import CACHE_DIR
from backend.models.schemas import (
    Farm,
    CropHistoryEntry,
    Coordinates,
    FarmProfile,
    SoilTest,
    Strategy,
    AnalysisRun,
    MissingInput,
)

STORAGE_FILE = CACHE_DIR / "farms_db.json"

class FarmStorage:
    def __init__(self):
        self.farms: Dict[str, Farm] = {}
        self.scenarios: Dict[str, List[Strategy]] = {}
        self.runs: Dict[str, AnalysisRun] = {}
        self._load()

    def _load(self):
        if not STORAGE_FILE.exists():
            return
        try:
            with open(STORAGE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            for farm_id, raw in data.get("farms", {}).items():
                self.farms[farm_id] = Farm.model_validate(raw)
            for farm_id, raw_scenarios in data.get("scenarios", {}).items():
                self.scenarios[farm_id] = [Strategy.model_validate(s) for s in raw_scenarios]
        except Exception:
            pass

    def _save(self):
        try:
            data = {
                "farms": {fid: f.model_dump() for fid, f in self.farms.items()},
                "scenarios": {
                    fid: [s.model_dump() for s in slist]
                    for fid, slist in self.scenarios.items()
                },
            }
            temp = STORAGE_FILE.with_suffix(".tmp")
            with open(temp, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            temp.replace(STORAGE_FILE)
        except Exception:
            pass

    def get_farm(self, farm_id: str) -> Optional[Farm]:
        return self.farms.get(farm_id)

    def create_farm(self, name: Optional[str] = None, demo: bool = False) -> Farm:
        if demo:
            farm_id = "demo-jenin"
            farm = Farm(
                id=farm_id,
                name="mock.farmName",
                location=Coordinates(longitude=35.285, latitude=32.4596),
                locationUnknown=False,
                boundary={
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [35.2838, 32.4589],
                            [35.2857, 32.4586],
                            [35.2862, 32.4601],
                            [35.2843, 32.4605],
                            [35.2838, 32.4589],
                        ]
                    ],
                },
                boundaryUnknown=False,
                profile=FarmProfile(
                    soilType="loam",
                    soilTest=SoilTest(ph=7.2, organicMatter=2.4, nitrogen=18.0, phosphorus=14.0, potassium=160.0),
                    irrigation="drip",
                    waterAvailability="seasonal",
                    equipment=["handTools", "pump"],
                    budget="low",
                    labor="medium",
                ),
                cropHistory=[
                    CropHistoryEntry(
                        id="history-1",
                        cropId="wheat",
                        season="winter",
                        plantedMonth=11,
                        harvestedMonth=5,
                        fieldFraction=0.6,
                        timing="past",
                    ),
                    CropHistoryEntry(
                        id="history-2",
                        cropId="tomato",
                        season="summer",
                        plantedMonth=4,
                        harvestedMonth=8,
                        fieldFraction=0.4,
                        timing="current",
                    ),
                ],
                historyUnknown=False,
                priorities={
                    "water_saving": 5.0,
                    "soil_health": 4.0,
                    "climate_resilience": 3.0,
                    "profit": 3.0,
                    "erosion_protection": 3.0,
                    "diversity": 2.0,
                },
                prioritiesUnknown=False,
                onboardingStep=0,
                simulated=False,
            )
        else:
            farm_id = f"farm-{uuid.uuid4()}"
            farm = Farm(
                id=farm_id,
                name=name.strip() if name and name.strip() else "مزرعتي الجديدة",
                location=None,
                locationUnknown=False,
                boundary=None,
                boundaryUnknown=False,
                profile=None,
                cropHistory=[],
                historyUnknown=False,
                priorities=None,
                prioritiesUnknown=False,
                onboardingStep=0,
                simulated=False,
            )
        self.farms[farm_id] = farm
        self._save()
        return farm

    def save_farm(self, farm: Farm) -> Farm:
        self.farms[farm.id] = farm
        self._save()
        return farm

    def check_missing_inputs(self, farm_id: str) -> List[MissingInput]:
        farm = self.get_farm(farm_id)
        if not farm:
            return ["location", "boundary"]
        missing: List[MissingInput] = []
        if not farm.location or (farm.location.longitude == 0 and farm.location.latitude == 0):
            missing.append("location")
        if not farm.boundary:
            missing.append("boundary")
        return missing

    def get_scenarios(self, farm_id: str) -> Optional[List[Strategy]]:
        return self.scenarios.get(farm_id)

    def save_scenarios(self, farm_id: str, scenarios: List[Strategy]) -> List[Strategy]:
        self.scenarios[farm_id] = scenarios
        self._save()
        return scenarios

storage = FarmStorage()
