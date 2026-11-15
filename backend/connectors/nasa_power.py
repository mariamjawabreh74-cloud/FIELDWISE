import calendar
import datetime
from typing import Any, Dict, List, Optional
import httpx

from backend.cache import cache
from backend.connectors.base import BaseConnector
from backend.models.schemas import (
    Confidence,
    DatasetKey,
    DatasetStatus,
    Indicator,
    Provenance,
    SeriesPoint,
)

class NasaPowerConnector(BaseConnector):
    dataset_key: DatasetKey = "power"
    product_name: str = "NASA POWER Agroclimatology (MERRA-2 / GEOS-FP)"
    native_resolution_m: float = 55000.0  # ~0.5° latitude by 0.625° longitude
    citation: str = "NASA Prediction Of Worldwide Energy Resources (POWER) Project"
    citation_url: str = "https://power.larc.nasa.gov/docs/methodology/meteorology/"

    async def fetch_indicators(
        self,
        latitude: float,
        longitude: float,
        year: Optional[int] = None,
    ) -> List[Indicator]:
        """
        Fetch real agroclimatic observations from NASA POWER temporal API.
        Retrieves temperature (T2M), precipitation (PRECTOTCORR), humidity (RH2M),
        and solar radiation (ALLSKY_SFC_SW_DWN).
        """
        target_year = year or 2024
        cache_key = f"nasa_power_monthly_{latitude:.4f}_{longitude:.4f}_{target_year}"
        cached = cache.get(cache_key)

        data = cached
        if not data:
            url = (
                f"https://power.larc.nasa.gov/api/temporal/monthly/point"
                f"?parameters=T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M,ALLSKY_SFC_SW_DWN"
                f"&community=AG&longitude={longitude:.4f}&latitude={latitude:.4f}"
                f"&start={target_year}&end={target_year}&format=JSON"
            )
            async with httpx.AsyncClient(timeout=25.0) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    cache.set(cache_key, data, ttl_seconds=86400 * 30)
                else:
                    raise RuntimeError(f"NASA POWER API returned HTTP {resp.status_code}: {resp.text[:200]}")

        properties = data.get("properties", {})
        parameters = properties.get("parameter", {})
        retrieved_at = datetime.datetime.now(datetime.timezone.utc).isoformat()

        prov = Provenance(
            dataset=self.dataset_key,
            product=self.product_name,
            version="v2.0",
            periodStart=f"{target_year}-01-01",
            periodEnd=f"{target_year}-12-31",
            retrievedAt=retrieved_at,
            citation=self.citation,
            citationUrl=self.citation_url,
        )

        limitations = [
            "datasets.power_limitations.regional",
            "datasets.power_limitations.gridded",
            "datasets.power_limitations.coarse",
        ]

        t2m_dict = parameters.get("T2M", {})
        precip_dict = parameters.get("PRECTOTCORR", {})
        rh2m_dict = parameters.get("RH2M", {})
        solar_dict = parameters.get("ALLSKY_SFC_SW_DWN", {})

        # Monthly time series construction
        temp_series: List[SeriesPoint] = []
        precip_series: List[SeriesPoint] = []
        rh_series: List[SeriesPoint] = []
        solar_series: List[SeriesPoint] = []

        total_annual_precip = 0.0
        valid_precip_months = 0
        annual_temp_sum = 0.0
        valid_temp_months = 0

        for m in range(1, 13):
            month_key = f"{target_year}{m:02d}"
            date_str = f"{target_year}-{m:02d}-15"
            days_in_month = calendar.monthrange(target_year, m)[1]

            # Temperature
            raw_t = t2m_dict.get(month_key)
            if raw_t is not None and raw_t != -999.0:
                val_t = round(float(raw_t), 1)
                temp_series.append(SeriesPoint(date=date_str, value=val_t))
                annual_temp_sum += val_t
                valid_temp_months += 1
            else:
                temp_series.append(SeriesPoint(date=date_str, value=None))

            # Precipitation: raw is mm/day -> monthly total is mm/day * days_in_month
            raw_p = precip_dict.get(month_key)
            if raw_p is not None and raw_p != -999.0:
                val_p = round(float(raw_p) * days_in_month, 1)
                precip_series.append(SeriesPoint(date=date_str, value=val_p))
                total_annual_precip += val_p
                valid_precip_months += 1
            else:
                precip_series.append(SeriesPoint(date=date_str, value=None))

            # Relative Humidity
            raw_rh = rh2m_dict.get(month_key)
            if raw_rh is not None and raw_rh != -999.0:
                rh_series.append(SeriesPoint(date=date_str, value=round(float(raw_rh), 1)))
            else:
                rh_series.append(SeriesPoint(date=date_str, value=None))

            # Solar Radiation
            raw_sol = solar_dict.get(month_key)
            if raw_sol is not None and raw_sol != -999.0:
                solar_series.append(SeriesPoint(date=date_str, value=round(float(raw_sol), 1)))
            else:
                solar_series.append(SeriesPoint(date=date_str, value=None))

        avg_annual_temp = round(annual_temp_sum / valid_temp_months, 1) if valid_temp_months > 0 else None
        avg_annual_precip = round(total_annual_precip, 1) if valid_precip_months > 0 else None

        # Primary Indicators
        indicators = [
            Indicator(
                key="rainfall",
                label="analysis.rainfall",
                value=avg_annual_precip,
                unit="mm/year",
                confidence="medium",
                series=precip_series,
                derivedFrom=["power"],
                nativeResolutionM=self.native_resolution_m,
                dataGaps=["datasets.gaps.local_gauge"] if valid_precip_months < 12 else [],
                limitations=limitations,
                provenance=prov,
                primary=True,
                simulated=False,
            ),
            Indicator(
                key="temperature",
                label="analysis.temperature",
                value=avg_annual_temp,
                unit="°C",
                confidence="medium",
                series=temp_series,
                derivedFrom=["power"],
                nativeResolutionM=self.native_resolution_m,
                dataGaps=[],
                limitations=limitations,
                provenance=prov,
                primary=True,
                simulated=False,
            ),
        ]

        return indicators

    async def check_status(self, latitude: float, longitude: float) -> DatasetStatus:
        retrieved_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
        return DatasetStatus(
            dataset=self.dataset_key,
            status="ok",
            nativeResolutionM=self.native_resolution_m,
            farmSmallerThanPixel=True,
            limitations=[
                "datasets.power_limitations.regional",
                "datasets.power_limitations.gridded",
            ],
            provenance=Provenance(
                dataset=self.dataset_key,
                product=self.product_name,
                version="v2.0",
                periodStart="2024-01-01",
                periodEnd="2024-12-31",
                retrievedAt=retrieved_at,
                citation=self.citation,
                citationUrl=self.citation_url,
            ),
            simulated=False,
        )

nasa_power_connector = NasaPowerConnector()
