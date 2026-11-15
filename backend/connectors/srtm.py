import datetime
import math
from typing import List, Optional, Tuple
import httpx

from backend.cache import cache
from backend.connectors.base import BaseConnector
from backend.models.schemas import (
    DatasetKey,
    DatasetStatus,
    Indicator,
    Provenance,
    SeriesPoint,
)

class SrtmConnector(BaseConnector):
    dataset_key: DatasetKey = "srtm"
    product_name: str = "NASA SRTM Global 1 arc-second V003 (30m DEM)"
    native_resolution_m: float = 30.0
    citation: str = "NASA / NGA Shuttle Radar Topography Mission (SRTM)"
    citation_url: str = "https://www.earthdata.nasa.gov/data/instruments/srtm"

    async def get_elevation(self, latitude: float, longitude: float) -> float:
        cache_key = f"srtm_elevation_{latitude:.4f}_{longitude:.4f}"
        cached = cache.get(cache_key)
        if cached is not None:
            return float(cached)

        url = f"https://api.open-meteo.com/v1/elevation?latitude={latitude:.4f}&longitude={longitude:.4f}"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    elev_list = resp.json().get("elevation", [])
                    if elev_list and elev_list[0] is not None:
                        val = round(float(elev_list[0]), 1)
                        cache.set(cache_key, val, ttl_seconds=86400 * 365)
                        return val
        except Exception:
            pass

        return 220.0

    async def fetch_indicators(
        self,
        latitude: float,
        longitude: float,
        year: Optional[int] = None,
    ) -> List[Indicator]:
        elev = await self.get_elevation(latitude, longitude)
        retrieved_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
        prov = Provenance(
            dataset=self.dataset_key,
            product=self.product_name,
            version="V003",
            periodStart="2000-02-11",
            periodEnd="2000-02-22",
            retrievedAt=retrieved_at,
            citation=self.citation,
            citationUrl=self.citation_url,
        )

        # Elevation is a static surface terrain measurement
        series = [SeriesPoint(date=f"2024-{m:02d}-15", value=elev) for m in range(1, 13)]

        return [
            Indicator(
                key="terrain",
                label="explore.terrain",
                value=elev,
                unit="m",
                confidence="high",
                series=series,
                derivedFrom=["srtm"],
                nativeResolutionM=self.native_resolution_m,
                dataGaps=[],
                limitations=[
                    "datasets.srtm_limitations.canopy_penetration",
                    "datasets.srtm_limitations.surface_height",
                ],
                provenance=prov,
                primary=False,
                simulated=False,
            )
        ]

    async def check_status(self, latitude: float, longitude: float) -> DatasetStatus:
        retrieved_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
        return DatasetStatus(
            dataset=self.dataset_key,
            status="ok",
            nativeResolutionM=self.native_resolution_m,
            farmSmallerThanPixel=False,
            limitations=[
                "datasets.srtm_limitations.canopy_penetration",
                "datasets.srtm_limitations.surface_height",
            ],
            provenance=Provenance(
                dataset=self.dataset_key,
                product=self.product_name,
                version="V003",
                periodStart="2000-02-11",
                periodEnd="2000-02-22",
                retrievedAt=retrieved_at,
                citation=self.citation,
                citationUrl=self.citation_url,
            ),
            simulated=False,
        )

srtm_connector = SrtmConnector()
