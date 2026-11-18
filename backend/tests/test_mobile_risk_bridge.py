"""Flutter klasoru kaldirildiginda Android risk endpointi calismali."""

import importlib
import math
import sys
import types
from pathlib import Path

import numpy as np
import pandas as pd
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import cekirdek as ck  # noqa: E402
import depo  # noqa: E402
from depo.sqlite_surucu import SqliteDepo  # noqa: E402
from uclar import oturum, risk  # noqa: E402


@pytest.fixture
def client(tmp_path, monkeypatch):
    database = SqliteDepo(str(tmp_path / "risk-test.sqlite3"))
    monkeypatch.setattr(depo, "_depo", database)
    api = FastAPI()
    api.include_router(oturum.yonlendirici)
    api.include_router(risk.yonlendirici)
    with TestClient(api) as test_client:
        yield test_client
    database.kapat()


def test_bridge_yalniz_backend_veri_kokunu_kullanir():
    bridge = importlib.import_module("risk_bridge")
    assert bridge.BACKEND_ROOT == BASE_DIR
    assert bridge.RISK_ROOT == BASE_DIR / "apps" / "earthquake_risk"
    assert "mobile/tool" not in str(bridge.__file__).replace("\\", "/").lower()


MODEL = BASE_DIR / "apps" / "earthquake_risk" / "models" / "risk_catboost.cbm"


@pytest.mark.skipif(not MODEL.exists(), reason="risk modeli bu makinede egitilmemis")
def test_manual_coordinates_risk_endpoint_returns_real_contract_shape(client):
    """Android'in `{city:'Türkiye',manualLatitude,...}` istegi geocoding istemez.

    Birlesmede (PR #7 + J-173) yeniden yazildi: eski test risk motorunun
    icini (predict_city_risk, last_lat) taklit ediyordu; API artik
    risk_hizmeti ile is parcacigi guvenli hesapliyor. Burada Android'in
    BackendRiskAssessmentService'te OKUDUGU alanlar gercek modelle sinanir:
    riskScore, factors (ad -> sayi), lastUpdate."""
    guest = client.post("/api/oturum/misafir")
    assert guest.status_code == 201, guest.text
    resp = client.post("/api/risk/predict", headers={
        "Authorization": f"Bearer {guest.json()['erisimJetonu']}",
    }, json={
        "city": "Türkiye", "manualLatitude": 40.99, "manualLongitude": 29.02,
    })
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert 0.0 <= data["riskScore"] <= 100.0
    assert data["factors"] and all(isinstance(v, (int, float)) and math.isfinite(v) for v in data["factors"].values())
    assert data["lastUpdate"]
    assert data["coordinates"] == {"lat": 40.99, "lon": 29.02}
    assert data["source"] == "backend_exact"
    assert data["usedManualCoordinates"] is True


def test_risk_predict_requires_session(client):
    response = client.post("/api/risk/predict", json={
        "city": "Test", "manualLatitude": 40.99, "manualLongitude": 29.02,
    })
    assert response.status_code == 401
