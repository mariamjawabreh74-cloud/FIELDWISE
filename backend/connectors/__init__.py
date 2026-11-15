from backend.connectors.nasa_power import nasa_power_connector
from backend.connectors.nasa_gpm import nasa_gpm_connector
from backend.connectors.landsat import landsat_connector
from backend.connectors.smap import smap_connector
from backend.connectors.srtm import srtm_connector

ALL_CONNECTORS = [
    nasa_power_connector,
    nasa_gpm_connector,
    landsat_connector,
    smap_connector,
    srtm_connector,
]
