from typing import Optional
from fastapi import APIRouter, HTTPException
from backend.models.schemas import (
    CreateFarmRequest,
    SaveLocationRequest,
    SaveBoundaryRequest,
    SaveProfileRequest,
    SaveCropHistoryRequest,
    SavePrioritiesRequest,
    SuccessEnvelope,
)
from backend.storage import storage

router = APIRouter(prefix="/farms", tags=["farms"])

@router.post("", response_model=SuccessEnvelope)
async def create_farm(req: CreateFarmRequest):
    farm = storage.create_farm(name=req.name, demo=bool(req.demo))
    return SuccessEnvelope(status="ok", simulated=False, data=farm)

@router.get("/{farm_id}", response_model=SuccessEnvelope)
async def get_farm(farm_id: str):
    farm = storage.get_farm(farm_id)
    if not farm:
        # If demo-jenin was requested, initialize it
        if farm_id == "demo-jenin":
            farm = storage.create_farm(demo=True)
        else:
            raise HTTPException(status_code=404, detail="farm_not_found")
    return SuccessEnvelope(status="ok", simulated=False, data=farm)

@router.put("/{farm_id}/location", response_model=SuccessEnvelope)
async def save_location(farm_id: str, req: SaveLocationRequest):
    farm = storage.get_farm(farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="farm_not_found")
    farm.location = req.location
    farm.locationUnknown = req.unknown
    farm.onboardingStep = max(farm.onboardingStep, 2)
    saved = storage.save_farm(farm)
    return SuccessEnvelope(status="ok", simulated=False, data=saved)

@router.put("/{farm_id}/boundary", response_model=SuccessEnvelope)
async def save_boundary(farm_id: str, req: SaveBoundaryRequest):
    farm = storage.get_farm(farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="farm_not_found")
    farm.boundary = req.boundary
    farm.boundaryUnknown = req.unknown
    farm.onboardingStep = max(farm.onboardingStep, 3)
    saved = storage.save_farm(farm)
    return SuccessEnvelope(status="ok", simulated=False, data=saved)

@router.put("/{farm_id}/profile", response_model=SuccessEnvelope)
async def save_profile(farm_id: str, req: SaveProfileRequest):
    farm = storage.get_farm(farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="farm_not_found")
    farm.profile = req
    farm.onboardingStep = max(farm.onboardingStep, 4)
    saved = storage.save_farm(farm)
    return SuccessEnvelope(status="ok", simulated=False, data=saved)

@router.put("/{farm_id}/crop-history", response_model=SuccessEnvelope)
async def save_crop_history(farm_id: str, req: SaveCropHistoryRequest):
    farm = storage.get_farm(farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="farm_not_found")
    farm.cropHistory = req.entries
    farm.historyUnknown = req.unknown
    farm.onboardingStep = max(farm.onboardingStep, 5)
    saved = storage.save_farm(farm)
    return SuccessEnvelope(status="ok", simulated=False, data=saved)

@router.put("/{farm_id}/priorities", response_model=SuccessEnvelope)
async def save_priorities(farm_id: str, req: SavePrioritiesRequest):
    farm = storage.get_farm(farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="farm_not_found")
    farm.priorities = req.weights
    farm.prioritiesUnknown = req.unknown
    farm.unknownPriorities = req.unknownCriteria or []
    farm.onboardingStep = max(farm.onboardingStep, 6)
    saved = storage.save_farm(farm)
    return SuccessEnvelope(status="ok", simulated=False, data=saved)
