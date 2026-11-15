from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from backend.models.schemas import DatasetKey, DatasetStatus, Indicator, Provenance

class BaseConnector(ABC):
    dataset_key: DatasetKey
    product_name: str
    native_resolution_m: float
    citation: str
    citation_url: str

    @abstractmethod
    async def fetch_indicators(
        self,
        latitude: float,
        longitude: float,
        start_date: str,
        end_date: str,
    ) -> List[Indicator]:
        """Fetch and return verified agricultural climate indicators."""
        pass

    @abstractmethod
    async def check_status(
        self,
        latitude: float,
        longitude: float,
    ) -> DatasetStatus:
        """Check availability, coverage, and return status metadata."""
        pass
