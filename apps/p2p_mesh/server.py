import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Body, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import json
from datetime import datetime
import sys
from contextlib import contextmanager

# Import AI Router
from apps.p2p_mesh.ai_router import analyze_image, analyze_text
import base64

app = FastAPI(title="QuakeMind P2P Mesh Hub")

# CORS setup for local testing if needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup paths
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
PROJECT_ROOT = BASE_DIR.parent.parent
RUNTIME_DIR = PROJECT_ROOT / "runtime"
P2P_RECORDS_PATH = RUNTIME_DIR / "p2p_records.json"
P2P_IMAGES_DIR = RUNTIME_DIR / "p2p_images"
INCIDENTS_PATH = RUNTIME_DIR / "operation_incidents.json"
SAFE_AREAS_PATH = PROJECT_ROOT / "apps" / "operations" / "safe_areas.json"
NLP_ROOT = PROJECT_ROOT / "apps" / "disaster_nlp"
RISK_ROOT = PROJECT_ROOT / "apps" / "earthquake_risk"
RISK_CSV = RISK_ROOT / "data" / "query.csv"

# Create directories if they don't exist
os.makedirs(STATIC_DIR, exist_ok=True)
os.makedirs(RUNTIME_DIR, exist_ok=True)
os.makedirs(P2P_IMAGES_DIR, exist_ok=True)

# Ensure incidents file exists
if not P2P_RECORDS_PATH.exists():
    with open(P2P_RECORDS_PATH, "w", encoding="utf-8") as f:
        json.dump([], f)

if not INCIDENTS_PATH.exists():
    with open(INCIDENTS_PATH, "w", encoding="utf-8") as f:
        json.dump([], f)

_nlp_pipeline = None
_risk_engine = None
_risk_module = None


@contextmanager
def temporary_sys_path(*paths):
    old_sys_path = list(sys.path)
    normalized_paths = [str(path) for path in paths if path]
    for path in reversed(normalized_paths):
        if path in sys.path:
            sys.path.remove(path)
        sys.path.insert(0, path)
    try:
        yield
    finally:
        sys.path[:] = old_sys_path


@contextmanager
def temporary_cwd(path):
    old_cwd = os.getcwd()
    os.chdir(path)
    try:
        yield
    finally:
        os.chdir(old_cwd)


def read_json_list(path: Path):
    try:
        if not path.exists():
            return []
        with open(path, "r", encoding="utf-8") as handle:
            payload = json.load(handle)
        return payload if isinstance(payload, list) else []
    except Exception:
        return []


def write_json_list(path: Path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)


def get_nlp_pipeline():
    global _nlp_pipeline
    if _nlp_pipeline is None:
        with temporary_sys_path(NLP_ROOT), temporary_cwd(NLP_ROOT):
            from src.pipeline import DisasterPipeline
            _nlp_pipeline = DisasterPipeline()
    return _nlp_pipeline


def get_risk_engine():
    global _risk_engine, _risk_module
    if _risk_engine is None or _risk_module is None:
        with temporary_sys_path(RISK_ROOT), temporary_cwd(RISK_ROOT):
            import importlib
            _risk_module = importlib.import_module("risk_engine")
            _risk_engine = _risk_module.EarthquakeRiskEngine(csv_path=str(RISK_CSV.resolve()))
    return _risk_engine, _risk_module


def normalize_text_for_match(text):
    replacements = {
        "ı": "i", "İ": "i", "ğ": "g", "Ğ": "g",
        "ü": "u", "Ü": "u", "ş": "s", "Ş": "s",
        "ö": "o", "Ö": "o", "ç": "c", "Ç": "c",
    }
    normalized = str(text).lower()
    for source, target in replacements.items():
        normalized = normalized.replace(source, target)
    return normalized


def distance_km(lat1, lon1, lat2, lon2):
    from math import radians, sin, cos, asin, sqrt
    earth_radius_km = 6371.0
    lat1_rad, lon1_rad, lat2_rad, lon2_rad = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    a = sin(dlat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlon / 2) ** 2
    return 2 * earth_radius_km * asin(sqrt(a))


def get_nearest_safe_areas(coords, limit=3):
    if not coords:
        return []
    lat, lon = coords
    safe_areas = read_json_list(SAFE_AREAS_PATH)
    ranked = []
    for area in safe_areas:
        area_lat = area.get("lat")
        area_lon = area.get("lon")
        if area_lat is None or area_lon is None:
            continue
        ranked.append({**area, "distance_km": distance_km(lat, lon, area_lat, area_lon)})
    return sorted(ranked, key=lambda item: item["distance_km"])[:limit]


def assess_location_quality(raw_text, result):
    coords = result.get("konum")
    location_text = result.get("konum_metin") or ""
    candidates = result.get("konum_adaylari") or []
    combined = normalize_text_for_match(" ".join([raw_text, location_text, " ".join(candidates)]))
    precise_hints = ["mahalle", "mahallesi", "sokak", "cadde", "apartman", "site", "blok", "hastane", "okul", "meydan"]

    if coords:
        if any(hint in combined for hint in precise_hints):
            return {"konum_tipi": "Net konum", "konum_guveni": "Yuksek", "etki_yaricapi_km": 0.25, "harita_merkezi": coords}
        return {"konum_tipi": "Tahmini alan", "konum_guveni": "Orta", "etki_yaricapi_km": 5.0, "harita_merkezi": coords}

    return {"konum_tipi": "Konum yok", "konum_guveni": "Yok", "etki_yaricapi_km": None, "harita_merkezi": None}


def get_urgency_label(level):
    if level >= 5:
        return "Kritik"
    if level == 4:
        return "Yuksek"
    if level == 3:
        return "Orta"
    if level == 2:
        return "Dusuk"
    return "Izleme"


def extract_need_items(raw_text, result):
    need_patterns = {
        "Arama Kurtarma": ["enkaz", "mahsur", "ses geliyor", "coktu", "yikildi", "gocuk"],
        "Saglik": ["yarali", "doktor", "ambulans", "kan", "ilac", "saglik", "hastane"],
        "Barinma": ["cadir", "battaniye", "isinma", "soba", "konteyner", "barinma"],
        "Gida ve Su": ["su", "yemek", "gida", "mama", "bebek mamasi", "ekmek"],
        "Lojistik/Ulasim": ["yol", "kopru", "ulasim", "kapali", "tir", "lojistik", "gecemiyor"],
        "Guvenlik": ["kalabalik", "panik", "guvenlik", "trafik", "tahliye"],
    }
    default_units = {
        "Arama Kurtarma": "AFAD Arama Kurtarma",
        "Saglik": "112 Saglik Ekibi",
        "Barinma": "Belediye Lojistik",
        "Gida ve Su": "Belediye Lojistik",
        "Lojistik/Ulasim": "Emniyet Trafik",
        "Guvenlik": "Emniyet Trafik",
    }
    normalized = normalize_text_for_match(raw_text)
    urgency = int(result.get("aciliyet") or 1)
    needs = []
    for need_name, patterns in need_patterns.items():
        matched = [pattern for pattern in patterns if normalize_text_for_match(pattern) in normalized]
        if matched:
            needs.append({
                "ihtiyac": need_name,
                "kanit": ", ".join(matched[:3]),
                "adet": "Belirsiz",
                "oncelik": get_urgency_label(urgency),
                "atanan_birim": default_units.get(need_name, "Atanmadi"),
                "durum": "Bekliyor",
            })
    return needs


def create_incident_record(raw_text, result):
    import hashlib
    seed = f"{raw_text}|{result.get('kategori')}|{result.get('konum')}|{datetime.utcnow().isoformat()}"
    incident_id = hashlib.sha1(seed.encode("utf-8")).hexdigest()[:10].upper()
    quality = assess_location_quality(raw_text, result)
    nearest_safe = get_nearest_safe_areas(quality["harita_merkezi"], limit=1)
    return {
        "id": incident_id,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "tweet": raw_text,
        "kategori": result.get("kategori", "Bilinmiyor"),
        "aciliyet": int(result.get("aciliyet") or 1),
        "aciliyet_etiketi": get_urgency_label(int(result.get("aciliyet") or 1)),
        "guven_skoru": result.get("guven_skoru", 0.0),
        "konum": result.get("konum"),
        "konum_metin": result.get("konum_metin"),
        "konum_adaylari": result.get("konum_adaylari") or [],
        "konum_tipi": quality["konum_tipi"],
        "konum_guveni": quality["konum_guveni"],
        "etki_yaricapi_km": quality["etki_yaricapi_km"],
        "harita_merkezi": quality["harita_merkezi"],
        "ihtiyaclar": extract_need_items(raw_text, result),
        "durum": "Yeni",
        "atanan_ekip": "Atanmadi",
        "yonlendirme": nearest_safe[0]["name"] if nearest_safe else "",
        "not": "",
    }


def sync_p2p_record_to_operations(record):
    incidents = read_json_list(INCIDENTS_PATH)
    if any(item.get("id") == record.get("id") for item in incidents):
        return

    operation_record = {
        "id": record.get("id"),
        "created_at": record.get("zaman", datetime.now().isoformat()),
        "tweet": record.get("tweet", ""),
        "kategori": record.get("kategori", "Diger"),
        "aciliyet": record.get("aciliyet", 3),
        "aciliyet_etiketi": record.get("aciliyet_etiketi", "Orta"),
        "guven_skoru": record.get("guven_skoru", 1.0),
        "konum": record.get("harita_merkezi"),
        "konum_metin": None,
        "konum_adaylari": [],
        "konum_tipi": record.get("konum_tipi", "Net konum"),
        "konum_guveni": record.get("konum_guveni", "Yuksek"),
        "etki_yaricapi_km": 0.25 if record.get("harita_merkezi") else None,
        "harita_merkezi": record.get("harita_merkezi"),
        "ihtiyaclar": [],
        "durum": record.get("durum", "Yeni"),
        "atanan_ekip": record.get("atanan_ekip", "Atanmadi"),
        "yonlendirme": record.get("yonlendirme", ""),
        "not": f"P2P kaynak: {record.get('p2p_kaynagi', 'Bilinmeyen Cihaz')}",
        "resim_yolu": record.get("resim_yolu"),
        "p2p_kaynagi": record.get("p2p_kaynagi"),
    }
    incidents.insert(0, operation_record)
    write_json_list(INCIDENTS_PATH, incidents)


def build_mobile_bootstrap():
    incidents = read_json_list(INCIDENTS_PATH)
    p2p_records = read_json_list(P2P_RECORDS_PATH)
    safe_areas = read_json_list(SAFE_AREAS_PATH)

    active_incidents = [item for item in incidents if item.get("durum") != "Tamamlandi"]
    high_priority = [item for item in incidents if int(item.get("aciliyet", 1) or 1) >= 4]
    located_incidents = [item for item in incidents if item.get("harita_merkezi") or item.get("konum")]

    return {
        "generated_at": datetime.now().isoformat(),
        "summary": {
            "incident_count": len(incidents),
            "active_count": len(active_incidents),
            "high_priority_count": len(high_priority),
            "located_count": len(located_incidents),
            "p2p_count": len(p2p_records),
            "safe_area_count": len(safe_areas),
        },
        "incidents": incidents[:100],
        "p2p_records": p2p_records[:100],
        "safe_areas": safe_areas,
    }

def save_p2p_to_db(payload, ai_result=None, nlp_result=None):
    try:
        # Load existing records
        records = read_json_list(P2P_RECORDS_PATH)
            
        # Extract UUID from payload (or fallback)
        incident_id = payload.get("uuid") or payload.get("id") or f"P2P-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Deduplication Check
        if any(item.get("id") == incident_id for item in records):
            print(f"Mükerrer P2P kaydı engellendi: {incident_id}")
            return
            
        image_path = None
        
        # Save image if present
        if payload.get("image"):
            base64_str = payload["image"]
            if "," in base64_str:
                base64_str = base64_str.split(",")[1]
            img_data = base64.b64decode(base64_str)
            # Ensure filename is safe for Windows filesystems by replacing any potential colons or invalid chars
            safe_filename = incident_id.replace(":", "_")
            image_filename = f"{safe_filename}.jpg"
            image_full_path = P2P_IMAGES_DIR / image_filename
            with open(image_full_path, "wb") as f:
                f.write(img_data)
            # Store relative path for UI
            image_path = str(image_full_path)
            
        # Determine category and urgency
        category = "Diğer"
        urgency_label = "Orta"
        urgency_score = 3
        confidence = 1.0
        
        if payload.get("type") == "enkaz_bildirimi":
            category = "Enkaz ve Yikim"
            urgency_label = "Kritik"
            urgency_score = 5
            if ai_result:
                confidence = float(ai_result.get("confidence", 1.0))
        elif payload.get("type") == "yol_durumu":
            category = "Kapali Yol"
            urgency_score = 4
        elif payload.get("type") == "acil_ihtiyac":
            if nlp_result:
                category = nlp_result.get("category", "Genel Ihtiyac")
                if "Acil" in category or "Kurtarma" in category:
                    urgency_label = "Kritik"
                    urgency_score = 5
                    
        # Construct the record
        text_content = payload.get("text", "")
        if not text_content and ai_result:
            text_content = f"Görsel AI Analizi: {ai_result.get('label')}"
            
        record = {
            "id": incident_id,
            "kategori": category,
            "aciliyet_etiketi": urgency_label,
            "aciliyet": urgency_score,
            "konum_tipi": "Net konum",
            "durum": "Yeni",
            "atanan_ekip": "Atanmadi",
            "yonlendirme": "",
            "harita_merkezi": [payload.get("lat"), payload.get("lon")] if payload.get("lat") else None,
            "tweet": f"P2P Saha İhbarı: {text_content}",
            "konum_guveni": "Yuksek",
            "guven_skoru": confidence,
            "resim_yolu": image_path,
            "p2p_kaynagi": payload.get("sender_id", "Bilinmeyen Cihaz"),
            "zaman": payload.get("server_time")
        }
        
        records.insert(0, record)
        
        # Save back to file
        write_json_list(P2P_RECORDS_PATH, records)
        sync_p2p_record_to_operations(record)
            
        print(f"Saved incident {incident_id} to database.")
    except Exception as e:
        print(f"Failed to save P2P record to database: {e}")

# Mount static files for the PWA frontend
app.mount("/app", StaticFiles(directory=STATIC_DIR, html=True), name="static")


@app.get("/api/mobile/health")
async def mobile_health():
    return {"ok": True, "generated_at": datetime.now().isoformat()}


@app.get("/api/mobile/bootstrap")
async def mobile_bootstrap():
    return build_mobile_bootstrap()


@app.post("/api/mobile/nlp/analyze")
async def mobile_nlp_analyze(payload: dict = Body(...)):
    text = (payload.get("text") or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text is required.")

    pipeline = get_nlp_pipeline()
    result = pipeline.process_tweet(text)
    if not result:
        return {"ok": True, "accepted": False, "message": "Girdi afet yonetim cercevesine uymadi."}

    record = create_incident_record(text, result)
    incidents = read_json_list(INCIDENTS_PATH)
    incidents.insert(0, record)
    write_json_list(INCIDENTS_PATH, incidents)
    return {"ok": True, "accepted": True, "analysis": result, "incident": record}


@app.post("/api/mobile/risk/analyze")
async def mobile_risk_analyze(payload: dict = Body(...)):
    city = payload.get("city") or "Hatay"
    manual_coords = payload.get("manual_coords")
    if manual_coords and isinstance(manual_coords, list) and len(manual_coords) == 2:
        manual_coords = (float(manual_coords[0]), float(manual_coords[1]))
    else:
        manual_coords = None

    engine, risk_module = get_risk_engine()
    result = engine.predict_city_risk(city, manual_coords=manual_coords)
    coords = manual_coords if manual_coords else (engine.last_lat, engine.last_lon)
    full_df = engine.df_full.copy()
    dists = risk_module.haversine(coords[0], coords[1], full_df["latitude"].values, full_df["longitude"].values)
    nearby = full_df[dists <= 150.0].copy()
    summary = {
        "city": city,
        "result": result,
        "coords": coords,
        "nearby_count": int(len(nearby)),
        "max_mag": float(nearby["mag"].max()) if not nearby.empty else 0.0,
        "avg_depth": float(nearby["depth"].mean()) if not nearby.empty else 0.0,
    }
    return {"ok": True, "summary": summary}


@app.post("/api/mobile/camera/analyze")
async def mobile_camera_analyze(payload: dict = Body(...)):
    image = payload.get("image")
    if not image:
        raise HTTPException(status_code=400, detail="Image is required.")
    ai_result = analyze_image(image)
    return {"ok": True, "analysis": ai_result}


@app.get("/api/mobile/safe-areas")
async def mobile_safe_areas():
    return {"ok": True, "items": read_json_list(SAFE_AREAS_PATH)}


@app.post("/api/mobile/safe-areas")
async def mobile_create_safe_area(payload: dict = Body(...)):
    required = ["name", "city", "lat", "lon", "capacity", "status"]
    if any(key not in payload for key in required):
        raise HTTPException(status_code=400, detail="Missing safe area fields.")
    areas = read_json_list(SAFE_AREAS_PATH)
    areas.append(payload)
    write_json_list(SAFE_AREAS_PATH, areas)
    return {"ok": True, "items": areas}


@app.patch("/api/mobile/incidents/{incident_id}")
async def mobile_update_incident(incident_id: str, payload: dict = Body(...)):
    incidents = read_json_list(INCIDENTS_PATH)
    updated = None
    for item in incidents:
        if item.get("id") == incident_id:
            item.update(payload)
            updated = item
            break
    if updated is None:
        raise HTTPException(status_code=404, detail="Incident not found.")
    write_json_list(INCIDENTS_PATH, incidents)
    return {"ok": True, "incident": updated}

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"New client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        print(f"Client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                print(f"Error broadcasting to client: {e}")

manager = ConnectionManager()

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket)
    try:
        while True:
            # Receive text (JSON) from client
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            # Add server timestamp
            payload["server_time"] = datetime.now().isoformat()
            
            print(f"Received from {client_id}: {payload.get('type')}")
            
            ai_res = None
            nlp_res = None
            
            # AI Analysis for Enkaz
            if payload.get("type") in ["enkaz_bildirimi", "yol_durumu"] and payload.get("image"):
                print("Görüntü alındı, AI analizine gönderilecek...")
                ai_res = analyze_image(payload["image"])
                payload["ai_result"] = ai_res
                
            # NLP Analysis for Text
            if payload.get("type") == "acil_ihtiyac" and payload.get("text"):
                print("Metin alındı, NLP analizine gönderilecek...")
                nlp_res = analyze_text(payload["text"])
                payload["nlp_result"] = nlp_res
                
            # Save to main operations database
            save_p2p_to_db(payload, ai_result=ai_res, nlp_result=nlp_res)
            
            # Broadcast the message to all connected devices in the mesh
            await manager.broadcast(json.dumps(payload))
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast(json.dumps({
            "type": "system",
            "message": f"Client {client_id} left the mesh."
        }))
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    print("QuakeMind P2P Mesh Server is running.")
    print("Connect to http://0.0.0.0:8000/app")
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
