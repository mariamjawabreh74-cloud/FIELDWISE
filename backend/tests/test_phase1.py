import os
import sys
from pathlib import Path

# Ensure project root is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

import asyncio
import httpx
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_crops_catalog():
    res = client.get("/v1/crops")
    assert res.status_code == 200
    payload = res.json()
    assert payload["status"] == "ok"
    assert payload["simulated"] is False
    assert len(payload["data"]) >= 12
    olive = next(c for c in payload["data"] if c["id"] == "olive")
    assert olive["names"]["ar"] == "زيتون"
    assert olive["family"] == "oleaceae"

def test_methodology():
    res = client.get("/v1/methodology")
    assert res.status_code == 200
    payload = res.json()
    assert payload["status"] == "ok"
    assert payload["simulated"] is False
    assert any(d["dataset"] == "power" for d in payload["data"]["datasets"])

def test_places_search():
    res = client.get("/v1/places?q=jenin")
    assert res.status_code == 200
    payload = res.json()
    assert payload["status"] == "ok"
    assert len(payload["data"]) > 0
    assert payload["data"][0]["location"]["longitude"] == 35.285

def test_farm_lifecycle_and_insufficient_data():
    # 1. Create empty farm
    res = client.post("/v1/farms", json={"name": "حقل الاختبار"})
    assert res.status_code == 200
    farm = res.json()["data"]
    farm_id = farm["id"]
    assert farm["simulated"] is False

    # 2. Indicators without location/boundary should return insufficient_data
    res = client.get(f"/v1/farms/{farm_id}/indicators")
    assert res.status_code == 200
    gap_payload = res.json()
    assert gap_payload["status"] == "insufficient_data"
    assert "location" in gap_payload["missing_inputs"]
    assert "boundary" in gap_payload["missing_inputs"]

    # 3. Save location
    res = client.put(f"/v1/farms/{farm_id}/location", json={
        "location": {"longitude": 35.285, "latitude": 32.4596},
        "unknown": False
    })
    assert res.status_code == 200
    assert res.json()["data"]["location"]["longitude"] == 35.285

    # 4. Save boundary
    res = client.put(f"/v1/farms/{farm_id}/boundary", json={
        "boundary": {
            "type": "Polygon",
            "coordinates": [[[35.283, 32.458], [35.286, 32.458], [35.286, 32.460], [35.283, 32.460], [35.283, 32.458]]]
        },
        "unknown": False
    })
    assert res.status_code == 200

    # 5. Start analysis
    res = client.post(f"/v1/farms/{farm_id}/analysis", json={})
    assert res.status_code == 200
    run_payload = res.json()
    assert run_payload["status"] == "ok"
    assert run_payload["data"]["stage"] == "complete"
    assert run_payload["data"]["progress"] == 100

    # 6. Get indicators - should now succeed and return real NASA POWER data
    res = client.get(f"/v1/farms/{farm_id}/indicators")
    assert res.status_code == 200
    ind_payload = res.json()
    assert ind_payload["status"] == "ok"
    assert ind_payload["simulated"] is False
    assert len(ind_payload["data"]) >= 2
    rain = next(i for i in ind_payload["data"] if i["key"] == "rainfall")
    temp = next(i for i in ind_payload["data"] if i["key"] == "temperature")
    assert rain["value"] is not None and rain["value"] > 0
    assert temp["value"] is not None and temp["value"] > 0
    assert rain["provenance"]["dataset"] == "power"
    assert rain["simulated"] is False

    # 7. Get comparison and recommendation
    res = client.get(f"/v1/farms/{farm_id}/comparison")
    assert res.status_code == 200
    comp_payload = res.json()
    assert comp_payload["status"] == "ok"
    assert len(comp_payload["data"]["strategies"]) == 3

    res = client.get(f"/v1/farms/{farm_id}/recommendation")
    assert res.status_code == 200
    rec_payload = res.json()
    assert rec_payload["status"] == "ok"
    assert rec_payload["data"]["strategy"] in ["water_conservation", "soil_improvement", "existing"]

    # 8. Get layers
    res = client.get(f"/v1/farms/{farm_id}/layers/rainfall")
    assert res.status_code == 200
    layer_payload = res.json()
    assert layer_payload["status"] == "ok"
    assert len(layer_payload["data"]["grid"]) == 32
    assert len(layer_payload["data"]["comparisonGrid"]) == 32

if __name__ == "__main__":
    test_health()
    test_crops_catalog()
    test_methodology()
    test_places_search()
    test_farm_lifecycle_and_insufficient_data()
    print("All Phase 1 tests passed successfully!")
