from typing import List, Optional
from fastapi import APIRouter, Query
from backend.models.schemas import (
    Crop,
    CropNames,
    Methodology,
    MethodologyDataset,
    MethodologyFormula,
    Place,
    Coordinates,
    Provenance,
    SuccessEnvelope,
)

router = APIRouter(tags=["catalog"])

CROPS_CATALOG = [
    Crop(
        id="olive",
        names=CropNames(ar="زيتون", en="Olive"),
        label="crops.olive",
        family="oleaceae",
        color="#92a96b",
        simulated=False,
    ),
    Crop(
        id="wheat",
        names=CropNames(ar="قمح", en="Wheat"),
        label="crops.wheat",
        family="poaceae",
        color="#c4a86a",
        simulated=False,
    ),
    Crop(
        id="barley",
        names=CropNames(ar="شعير", en="Barley"),
        label="crops.barley",
        family="poaceae",
        color="#b9a071",
        simulated=False,
    ),
    Crop(
        id="chickpea",
        names=CropNames(ar="حمص", en="Chickpea"),
        label="crops.chickpea",
        family="fabaceae",
        color="#91ac83",
        simulated=False,
    ),
    Crop(
        id="lentil",
        names=CropNames(ar="عدس", en="Lentil"),
        label="crops.lentil",
        family="fabaceae",
        color="#c1a17b",
        simulated=False,
    ),
    Crop(
        id="fava",
        names=CropNames(ar="فول", en="Fava Bean"),
        label="crops.fava",
        family="fabaceae",
        color="#83a27e",
        simulated=False,
    ),
    Crop(
        id="tomato",
        names=CropNames(ar="طماطم", en="Tomato"),
        label="crops.tomato",
        family="solanaceae",
        color="#bd7c65",
        simulated=False,
    ),
    Crop(
        id="cucumber",
        names=CropNames(ar="خيار", en="Cucumber"),
        label="crops.cucumber",
        family="cucurbitaceae",
        color="#6e9b79",
        simulated=False,
    ),
    Crop(
        id="okra",
        names=CropNames(ar="بامية", en="Okra"),
        label="crops.okra",
        family="malvaceae",
        color="#83a76d",
        simulated=False,
    ),
    Crop(
        id="grape",
        names=CropNames(ar="عنب", en="Grape"),
        label="crops.grape",
        family="vitaceae",
        color="#9b8da8",
        simulated=False,
    ),
    Crop(
        id="almond",
        names=CropNames(ar="لوز", en="Almond"),
        label="crops.almond",
        family="rosaceae",
        color="#bda48a",
        simulated=False,
    ),
    Crop(
        id="clover",
        names=CropNames(ar="برسيم", en="Clover"),
        label="crops.clover",
        family="fabaceae",
        color="#8fa780",
        simulated=False,
    ),
]

KNOWN_PLACES = [
    Place(id="jenin", label="جنين / Jenin", location=Coordinates(longitude=35.285, latitude=32.4596), simulated=False),
    Place(id="burqin", label="برقين / Burqin", location=Coordinates(longitude=35.258, latitude=32.449), simulated=False),
    Place(id="tubas", label="طوباس / Tubas", location=Coordinates(longitude=35.369, latitude=32.321), simulated=False),
    Place(id="nablus", label="نابلس / Nablus", location=Coordinates(longitude=35.254, latitude=32.222), simulated=False),
    Place(id="tulkarm", label="طولكرم / Tulkarm", location=Coordinates(longitude=35.028, latitude=32.312), simulated=False),
    Place(id="jericho", label="أريحا / Jericho", location=Coordinates(longitude=35.456, latitude=31.861), simulated=False),
    Place(id="hebron", label="الخليل / Hebron", location=Coordinates(longitude=35.099, latitude=31.532), simulated=False),
    Place(id="ramallah", label="رام الله / Ramallah", location=Coordinates(longitude=35.203, latitude=31.903), simulated=False),
]

@router.get("/crops", response_model=SuccessEnvelope)
async def get_crops():
    return SuccessEnvelope(status="ok", simulated=False, data=CROPS_CATALOG)

@router.get("/places", response_model=SuccessEnvelope)
async def search_places(q: str = Query(..., min_length=1)):
    query = q.strip().lower()
    matches = [
        p for p in KNOWN_PLACES
        if query in p.label.lower() or query in p.id.lower()
    ]
    return SuccessEnvelope(status="ok", simulated=False, data=matches)

@router.get("/methodology", response_model=SuccessEnvelope)
async def get_methodology():
    datasets: List[MethodologyDataset] = [
        MethodologyDataset(
            dataset="power",
            status="ok",
            nativeResolutionM=55000.0,
            farmSmallerThanPixel=True,
            limitations=[
                "datasets.power_limitations.regional",
                "datasets.power_limitations.gridded",
            ],
            provenance=Provenance(
                dataset="power",
                product="NASA POWER Agroclimatology (MERRA-2 / GEOS-FP)",
                version="v2.0",
                periodStart="2024-01-01",
                periodEnd="2024-12-31",
                retrievedAt="2026-11-15T00:00:00Z",
                citation="NASA Prediction Of Worldwide Energy Resources",
                citationUrl="https://power.larc.nasa.gov/docs/methodology/meteorology/",
            ),
            simulated=False,
            documentationUrl="https://power.larc.nasa.gov/docs/methodology/meteorology/",
        ),
        MethodologyDataset(
            dataset="imerg",
            status="ok",
            nativeResolutionM=10000.0,
            farmSmallerThanPixel=True,
            limitations=[
                "datasets.imerg_limitations.coarse",
                "datasets.imerg_limitations.microwave_infrared",
            ],
            provenance=Provenance(
                dataset="imerg",
                product="GPM IMERG Final Precipitation L3",
                version="V07B",
                periodStart="2024-01-01",
                periodEnd="2024-12-31",
                retrievedAt="2026-11-15T00:00:00Z",
                citation="NASA Global Precipitation Measurement Mission",
                citationUrl="https://gpm.nasa.gov/data/imerg",
            ),
            simulated=False,
            documentationUrl="https://gpm.nasa.gov/data/imerg",
        ),
        MethodologyDataset(
            dataset="landsat",
            status="ok",
            nativeResolutionM=30.0,
            farmSmallerThanPixel=False,
            limitations=[
                "datasets.landsat_limitations.cloud_cover",
                "datasets.landsat_limitations.revisit_16days",
            ],
            provenance=Provenance(
                dataset="landsat",
                product="Landsat 8/9 Collection 2 Level-2 Surface Reflectance",
                version="Collection 2",
                periodStart="2024-01-01",
                periodEnd="2024-12-31",
                retrievedAt="2026-11-15T00:00:00Z",
                citation="USGS Landsat Collection 2",
                citationUrl="https://www.usgs.gov/landsat-missions/landsat-collection-2",
            ),
            simulated=False,
            documentationUrl="https://www.usgs.gov/landsat-missions/landsat-collection-2",
        ),
        MethodologyDataset(
            dataset="smap",
            status="ok",
            nativeResolutionM=9000.0,
            farmSmallerThanPixel=True,
            limitations=[
                "datasets.smap_limitations.coarse_pixel",
                "datasets.smap_limitations.top_5cm_only",
            ],
            provenance=Provenance(
                dataset="smap",
                product="SMAP L3 Radiometer Global Daily 9 km Soil Moisture",
                version="V008",
                periodStart="2024-01-01",
                periodEnd="2024-12-31",
                retrievedAt="2026-11-15T00:00:00Z",
                citation="NASA SMAP Mission",
                citationUrl="https://smap.jpl.nasa.gov/data/",
            ),
            simulated=False,
            documentationUrl="https://smap.jpl.nasa.gov/data/",
        ),
        MethodologyDataset(
            dataset="srtm",
            status="ok",
            nativeResolutionM=30.0,
            farmSmallerThanPixel=False,
            limitations=[
                "datasets.srtm_limitations.canopy_penetration",
                "datasets.srtm_limitations.surface_height",
            ],
            provenance=Provenance(
                dataset="srtm",
                product="NASA SRTM Global 1 arc-second V003 (30m)",
                version="V003",
                periodStart="2000-02-11",
                periodEnd="2000-02-22",
                retrievedAt="2026-11-15T00:00:00Z",
                citation="NASA Shuttle Radar Topography Mission",
                citationUrl="https://www.earthdata.nasa.gov/data/instruments/srtm",
            ),
            simulated=False,
            documentationUrl="https://www.earthdata.nasa.gov/data/instruments/srtm",
        ),
    ]

    methodology = Methodology(
        datasets=datasets,
        limitations=[
            "methodology.limitations.regional_coarse",
            "methodology.limitations.soil_test_needed",
            "methodology.limitations.decision_support_only",
        ],
        formulas=[
            MethodologyFormula(
                id="water_balance",
                title="methodology.formulas.waterBalanceTitle",
                description="methodology.formulas.waterBalanceDesc",
                backendPlaceholder=False,
            ),
            MethodologyFormula(
                id="ndvi_calculation",
                title="methodology.formulas.ndviTitle",
                description="methodology.formulas.ndviDesc",
                backendPlaceholder=False,
            ),
            MethodologyFormula(
                id="soil_health",
                title="methodology.formulas.soilHealthTitle",
                description="methodology.formulas.soilHealthDesc",
                backendPlaceholder=False,
            ),
        ],
        simulated=False,
    )

    return SuccessEnvelope(status="ok", simulated=False, data=methodology)
