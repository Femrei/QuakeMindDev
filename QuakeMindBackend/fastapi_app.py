from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import bcrypt
import math
import sys
import os
import site
import importlib
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from contextlib import contextmanager, asynccontextmanager
from typing import Optional
from threading import Lock, Thread
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor, TimeoutError as FutureTimeoutError
import functools
import multiprocessing

# Windows' ProcessPoolExecutor (spawn) re-imports this module's top-level code
# inside every pool worker process, even when the worker's target function
# lives elsewhere. Empirically (verified via a diagnostic print on this
# machine): the initial `python fastapi_app.py` launch is named "MainProcess",
# uvicorn's own reload subprocess (the one that actually serves HTTP -- reload
# uses `multiprocessing` internally too) is named "SpawnProcess-1", and a
# ProcessPoolExecutor worker spawned from *that* process is named
# "SpawnProcess-1:1" (parent-name:index) -- i.e. pool workers are the only
# processes whose name contains ":". Guarding on that (not on "MainProcess",
# which only matches the launcher and would wrongly also skip loading in the
# real reload-managed server process) lets the eager, heavy model loads below
# skip themselves in pool workers without touching the real server process.
_IS_APP_PROCESS = ":" not in multiprocessing.current_process().name

BASE_DIR = Path(__file__).resolve().parent
APPS_DIR = BASE_DIR / "apps"
NLP_ROOT = APPS_DIR / "disaster_nlp"
ROAD_ROOT = APPS_DIR / "road_damage"
RISK_ROOT = APPS_DIR / "earthquake_risk"
CAMERA_ROOT = APPS_DIR / "camera_detection"
MOBILE_TOOL_ROOT = BASE_DIR.parent / "quakemind" / "tool"

if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from utils.postgis_manager import postgis_engine

def add_project_site_packages(project_root):
    for env_name in [".venv", "venv"]:
        env_path = project_root / env_name
        if not env_path.exists():
            continue
        for site_path in env_path.glob("lib/python*/site-packages"):
            site.addsitedir(str(site_path))

for project_root in [NLP_ROOT, ROAD_ROOT, RISK_ROOT, CAMERA_ROOT]:
    add_project_site_packages(project_root)

from apps.road_damage.utils.serialization import (
    compact_segment_coords as _compact_segment_coords,
    serialize_segments as _serialize_segments,
    haversine_m as _haversine_m,
)
from apps.road_damage.utils.imaging import (
    image_array_to_b64 as _image_array_to_b64,
    build_damage_overlay as _build_damage_overlay,
    build_segmentation_overlay as _build_segmentation_overlay,
)
from apps.road_damage.utils.tiling import zoom_for_radius as _zoom_for_radius

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

def clear_module_cache(prefixes):
    for module_name in list(sys.modules.keys()):
        if any(module_name == prefix or module_name.startswith(f"{prefix}.") for prefix in prefixes):
            sys.modules.pop(module_name, None)

# Initialize engines
nlp_pipeline = None
risk_engine = None
road_runtime = None
road_runtime_error = None
road_runtime_load_attempted = False
road_runtime_lock = Lock()

def _get_nlp_pipeline():
    global nlp_pipeline
    if nlp_pipeline is None:
        try:
            clear_module_cache(["src"])
            with temporary_sys_path(NLP_ROOT), temporary_cwd(NLP_ROOT):
                from src.pipeline import DisasterPipeline
                nlp_pipeline = DisasterPipeline()
            print("NLP Pipeline loaded lazily.", flush=True)
        except Exception as e:
            print(f"Failed to load NLP: {e}", flush=True)
    return nlp_pipeline

yolo_catlak = None
yolo_bina = None

if _IS_APP_PROCESS:
    try:
        clear_module_cache(["risk_engine"])
        with temporary_sys_path(RISK_ROOT), temporary_cwd(RISK_ROOT):
            risk_module = importlib.import_module("risk_engine")
            RISK_CSV = RISK_ROOT / "data" / "query.csv"
            risk_engine = risk_module.EarthquakeRiskEngine(csv_path=str(RISK_CSV.resolve()))
        print("Risk Engine loaded.", flush=True)
    except Exception as e:
        print(f"Failed to load Risk Engine: {e}", flush=True)

    try:
        from ultralytics import YOLO
        catlak_path = CAMERA_ROOT / "models" / "catlak.pt"
        bina_path = CAMERA_ROOT / "models" / "bina.pt"
        if catlak_path.exists():
            yolo_catlak = YOLO(str(catlak_path.resolve()))
            print("YOLO Catlak Model loaded.", flush=True)
        if bina_path.exists():
            yolo_bina = YOLO(str(bina_path.resolve()))
            print("YOLO Bina Model loaded.", flush=True)
    except Exception as e:
        print(f"Failed to load YOLO Camera Models: {e}", flush=True)


def _load_road_runtime():
    from apps.road_damage.utils.fetcher import (
        fetch_satellite_area,
        get_osm_roads_overpass,
        get_wayback_versions,
        search_oam_images,
    )
    from apps.road_damage.utils.inference import load_simple_model, run_inference
    from apps.road_damage.utils.network import analyze_road_network_graph, calculate_route
    from apps.road_damage.utils.assembly import (
        bbox_from_center,
        fetch_osm_safety_areas,
        find_nearest_assembly,
        shortest_walk_route,
    )
    from apps.road_damage.utils.local_osm import (
        has_local_roads_dataset,
        has_local_safety_dataset,
        load_local_safety_areas,
        shortest_route_from_local_roads,
    )

    model_path = str(ROAD_ROOT / "models" / "optimized_mitb4_focal_dice30.pth")
    model, device = load_simple_model(model_path)
    if model is None:
        raise RuntimeError("Segformer modeli yuklenemedi.")

    return {
        "fetch_satellite_area": fetch_satellite_area,
        "get_osm_roads_overpass": get_osm_roads_overpass,
        "get_wayback_versions": get_wayback_versions,
        "search_oam_images": search_oam_images,
        "run_inference": run_inference,
        "analyze_road_network_graph": analyze_road_network_graph,
        "calculate_route": calculate_route,
        "bbox_from_center": bbox_from_center,
        "fetch_osm_safety_areas": fetch_osm_safety_areas,
        "find_nearest_assembly": find_nearest_assembly,
        "shortest_walk_route": shortest_walk_route,
        "has_local_roads_dataset": has_local_roads_dataset,
        "has_local_safety_dataset": has_local_safety_dataset,
        "load_local_safety_areas": load_local_safety_areas,
        "shortest_route_from_local_roads": shortest_route_from_local_roads,
        "model": model,
        "device": device,
    }


def _get_road_runtime():
    global road_runtime, road_runtime_error, road_runtime_load_attempted
    if road_runtime is not None:
        return road_runtime
    if road_runtime_load_attempted:
        # Already tried and failed once this process lifetime -- don't retry the
        # (slow, torch/osmnx-importing) load on every single request. A server
        # restart is required to retry, matching the singleton-with-cached-failure
        # pattern used for the other lazily-loaded engines above.
        raise RuntimeError(road_runtime_error or "Road Damage runtime yuklenemedi.")

    with road_runtime_lock:
        if road_runtime is not None:
            return road_runtime
        if road_runtime_load_attempted:
            raise RuntimeError(road_runtime_error or "Road Damage runtime yuklenemedi.")
        road_runtime_load_attempted = True
        try:
            road_runtime = _load_road_runtime()
            road_runtime_error = None
            print("Road Damage runtime loaded.", flush=True)
        except Exception as e:
            road_runtime = None
            road_runtime_error = str(e)
            print(f"Failed to load Road Damage runtime: {e}", flush=True)
            raise
    return road_runtime


if _IS_APP_PROCESS:
    try:
        _get_road_runtime()
    except Exception:
        pass

# In-memory SOS alert store. Intentionally not persisted: alerts reset whenever
# the server restarts, matching the PoC requirement of session-only storage.
sos_alerts: list[dict] = []
sos_lock = Lock()

# In-memory debris/catlak report store -- POST /api/camera/analyze bir tespit
# + konum aldiginda buraya ekler; harita bunu ayri bir "debris" katmani
# olarak gosterir (akis diyagramindaki "goruntu analizi -> haritada isaretle").
debris_reports: "list[dict]" = []
debris_lock = Lock()

# In-memory NLP-cikarimli konum deposu -- POST /api/nlp/analyze serbest
# metinden gercek bir konum (NER + il/ilce sozlugu + Nominatim geocoding)
# cikarabildiginde buraya eklenir; harita bunu SOS pin'inden (afetzedenin
# kendi GPS'i) AYRI bir katman olarak gosterir -- boylece NLP'nin metinden
# konum cikarma yeteneginin kendisi gorunur/dogrulanabilir olur.
nlp_locations: "list[dict]" = []
nlp_locations_lock = Lock()

# In-memory team target-claim store: prevents two teams from being dispatched to
# the same target ("yigilma onleme" in the field-team flow). Keyed by targetId.
team_claims: "dict[str, dict]" = {}
team_claims_lock = Lock()

# In-memory road-damage analysis session store: keeps the routable "safe roads"
# graph around so a later /route call can compute a real path without re-running
# the whole satellite fetch + inference pipeline. Bounded FIFO eviction since
# networkx graphs are memory-heavy and this is PoC/process-only state.
road_damage_sessions: "dict[str, dict]" = {}
road_damage_sessions_order: list = []
road_damage_sessions_lock = Lock()
ROAD_DAMAGE_SESSION_LIMIT = 20


def _store_road_damage_session(analysis_id, data):
    with road_damage_sessions_lock:
        road_damage_sessions[analysis_id] = data
        road_damage_sessions_order.append(analysis_id)
        while len(road_damage_sessions_order) > ROAD_DAMAGE_SESSION_LIMIT:
            oldest = road_damage_sessions_order.pop(0)
            road_damage_sessions.pop(oldest, None)


# In-memory road-damage *job* store (separate from road_damage_sessions
# above, which only holds the routable graph for /route). Tracks the
# lifecycle of an /analyze call now that it runs on a background
# ProcessPoolExecutor worker instead of inline in the request handler:
# queued -> done (result attached) or error (message attached). Bounded
# FIFO eviction, same pattern as the session store.
road_damage_jobs: "dict[str, dict]" = {}
road_damage_jobs_order: list = []
road_damage_jobs_lock = Lock()
ROAD_DAMAGE_JOB_LIMIT = 20
# Soft cap on concurrently *queued* jobs -- pool.submit() itself never
# blocks (unlike the old semaphore-gated thread-pool route), so this is
# just cheap backpressure against a client hammering /analyze.
ROAD_DAMAGE_MAX_QUEUED_JOBS = 5

road_damage_pool: "ProcessPoolExecutor | None" = None
# Worker -> main-process progress channel. A plain multiprocessing.Queue
# (not a Manager dict) on purpose: a Manager would spin up its own server
# process, and on Windows spawn that process re-imports this module and
# would redundantly reload every heavy model -- exactly what _IS_APP_PROCESS
# exists to prevent. A Queue needs no extra process, and handing it to the
# pool via initargs is the one path multiprocessing allows a Queue to cross
# a process boundary.
road_damage_progress_queue = None
road_damage_progress_thread = None


def _store_road_damage_job(analysis_id, data):
    with road_damage_jobs_lock:
        road_damage_jobs[analysis_id] = data
        road_damage_jobs_order.append(analysis_id)
        while len(road_damage_jobs_order) > ROAD_DAMAGE_JOB_LIMIT:
            oldest = road_damage_jobs_order.pop(0)
            road_damage_jobs.pop(oldest, None)


def _count_queued_road_damage_jobs():
    with road_damage_jobs_lock:
        return sum(1 for job in road_damage_jobs.values() if job.get("status") == "queued")


def _on_road_damage_job_done(analysis_id, future):
    """Runs in the main process (on the pool's management thread) once a
    submitted job finishes. Must only touch road_damage_jobs under its lock,
    matching the thread-safety pattern already used for sos_lock /
    road_damage_sessions_lock elsewhere in this file.
    """
    with road_damage_jobs_lock:
        job = road_damage_jobs.get(analysis_id)
        if job is None:
            return  # evicted from the bounded FIFO while still in flight
        exc = future.exception()
        if exc is not None:
            job["status"] = "error"
            job["error"] = str(exc)
        else:
            result = future.result()
            safe_graph = result.pop("safeGraph", None)
            if safe_graph is not None:
                _store_road_damage_session(analysis_id, {"safe_G": safe_graph, "bounds": result.get("bounds")})
            job["status"] = "done"
            job["result"] = result
            job["progress"] = 100
            job["progressMessage"] = "Analiz tamamlandi."
        job["finishedAt"] = time.time()


def _drain_road_damage_progress(queue):
    """Main-process daemon thread: turns worker progress pings into job-store
    updates. Exits on the None sentinel pushed at shutdown.
    """
    while True:
        try:
            item = queue.get()
        except (EOFError, OSError):
            return
        if item is None:
            return
        try:
            analysis_id = item.get("analysisId")
            with road_damage_jobs_lock:
                job = road_damage_jobs.get(analysis_id)
                # Only advance a still-running job -- a late ping must never
                # drag a finished job's progress back below 100.
                if job is not None and job.get("status") == "queued":
                    job["progress"] = item.get("percent")
                    job["progressMessage"] = item.get("message")
        except Exception:
            pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    global road_damage_pool, road_damage_progress_queue, road_damage_progress_thread
    from apps.road_damage import worker as road_damage_worker

    model_path = str(ROAD_ROOT / "models" / "optimized_mitb4_focal_dice30.pth")
    pool_size = int(os.environ.get("QUAKEMIND_ROAD_POOL_SIZE", "1"))
    road_damage_progress_queue = multiprocessing.Queue()
    road_damage_progress_thread = Thread(
        target=_drain_road_damage_progress,
        args=(road_damage_progress_queue,),
        daemon=True,
    )
    road_damage_progress_thread.start()

    road_damage_pool = ProcessPoolExecutor(
        max_workers=pool_size,
        initializer=road_damage_worker._init_worker,
        initargs=(model_path, road_damage_progress_queue),
    )
    # Pay the one-time "cold worker spawn" cost (Windows process creation +
    # module import, measured ~10-15s on this machine) now, during startup,
    # instead of during the first real user's analysis request.
    warm_up = road_damage_pool.submit(road_damage_worker._warm_up)
    try:
        warm_up.result(timeout=120)
        print(f"Road Damage pool warmed up ({pool_size} worker(s)).", flush=True)
    except Exception as e:
        print(f"Road Damage pool warm-up failed (will still lazy-init on first job): {e}", flush=True)

    yield

    road_damage_pool.shutdown(wait=False, cancel_futures=True)
    try:
        road_damage_progress_queue.put_nowait(None)
    except Exception:
        pass


app = FastAPI(title="QuakeMind API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class NLPRequest(BaseModel):
    text: str


class SOSAlertRequest(BaseModel):
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    message: Optional[str] = None
    userId: Optional[str] = None
    # Akis diyagramindaki "pil durumu" ve "haberlesme durumu" (mesh/BLE
    # fallback) alanlari -- gercek bir donanim sensoru/BLE yiginimiz olmadigi
    # icin (bkz. AKIS_DIYAGRAM_KOD_ESLESTIRME_RAPORU.md) temsili/rastgele
    # deger olarak orkestratorden (benchmark/rich_simulation.py) veya mobil
    # istemciden gelir -- ama gercek SOS pipeline'indan gecer ve saklanir,
    # kurgusal bir katman degil.
    batteryPercent: Optional[int] = None
    commsStatus: Optional[str] = None  # "online" | "mesh" | "offline"


class TeamClaimRequest(BaseModel):
    teamId: str
    targetId: str
    targetType: str  # "sos" | "report" | "evacuation"
    lat: float
    lon: float


class TeamRouteAttachRequest(BaseModel):
    routeCoords: list
    distanceMeters: float
    assumedSpeedKmh: float = 15.0

class RiskRequest(BaseModel):
    city: str
    manualLatitude: float | None = None
    manualLongitude: float | None = None
    refreshData: bool = False

class RoadDamageRequest(BaseModel):
    city: str
    latitude: float
    longitude: float
    source: str = "google"
    damageBooster: float = 3.5
    threshold: float = 0.40
    useImagenetNorm: bool = True
    postProcessLevel: int = 2
    bboxWest: Optional[float] = None
    bboxSouth: Optional[float] = None
    bboxEast: Optional[float] = None
    bboxNorth: Optional[float] = None
    oamPreferredTitle: Optional[str] = None
    waybackId: Optional[str] = None
    oamTileUrl: Optional[str] = None
    networkType: Optional[str] = None
    # Half-width of the analysis area in km when no explicit bbox is given.
    # Previously the backend fell back to a tiny ~2-tile patch (a few hundred
    # meters) whenever the caller (mobile app) sent no bbox at all -- this
    # makes sure a real, requested-size area is always analyzed instead.
    radiusKm: float = 2.5


class SimulateClosuresRequest(BaseModel):
    latitude: float
    longitude: float
    radiusKm: float = 1.0
    closureRatio: float = 0.15
    seed: Optional[int] = None


class RoadDamageRouteRequest(BaseModel):
    analysisId: str
    startLat: float
    startLon: float
    endLat: float
    endLon: float


@app.get("/")
def health_check():
    return {"status": "ok", "message": "QuakeMind API is running!"}

@app.post("/api/nlp/analyze")
def analyze_nlp(req: NLPRequest):
    pipeline = _get_nlp_pipeline()
    if not pipeline:
        raise HTTPException(status_code=503, detail="NLP model is not loaded.")

    try:
        with temporary_sys_path(NLP_ROOT), temporary_cwd(NLP_ROOT):
            result = pipeline.process_tweet(req.text)
        if not result:
            return {"status": "ignored", "reason": "Not related to disaster"}

        konum = result.get("konum")
        if konum and len(konum) == 2:
            entry = {
                "id": str(uuid.uuid4()),
                "latitude": konum[0],
                "longitude": konum[1],
                "konumMetin": result.get("konum_metin"),
                "kategori": result.get("kategori"),
                "aciliyet": result.get("aciliyet"),
                "sourceText": req.text,
                "receivedAt": datetime.now(timezone.utc).isoformat(),
            }
            with nlp_locations_lock:
                nlp_locations.append(entry)
            result["nlpLocationId"] = entry["id"]

            # Best-effort: a geocoded tweet is a location-tagged "bildirim" just
            # like a camera detection or an SOS alert -- feeds the same
            # damage_points table so /heatmap can count report density per
            # source (Twitter/NLP, camera, SOS) instead of only satellite data.
            try:
                postgis_engine.insert_damage_point(
                    "twitter", konum[0], konum[1],
                    severity=result.get("guven_skoru") or 0.5,
                    label=result.get("kategori") or "Twitter/NLP Bildirimi",
                )
            except Exception as e:
                print(f"damage_points insert (twitter) hatasi: {e}")

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/nlp/locations")
def list_nlp_locations():
    with nlp_locations_lock:
        locations = list(nlp_locations)
    return {"locations": locations, "totalLocations": len(locations)}

@app.post("/api/risk/predict")
def predict_risk(req: RiskRequest):
    if not risk_engine:
        raise HTTPException(status_code=503, detail="Risk model is not loaded.")
    
    try:
        manual_coords = None
        if req.manualLatitude is not None and req.manualLongitude is not None:
            manual_coords = (req.manualLatitude, req.manualLongitude)
        
        with temporary_sys_path(RISK_ROOT, MOBILE_TOOL_ROOT), temporary_cwd(RISK_ROOT):
            if req.refreshData:
                from data_manager import fetch_and_update_data
                fetch_and_update_data()
            
            risk_engine.predict_city_risk(req.city, manual_coords=manual_coords)

            # Since the frontend parser currently expects fields matching risk_bridge logic:
            from risk_bridge import build_payload
            payload = build_payload(
                city=req.city,
                manual_coords=manual_coords,
                refresh_data=req.refreshData,
            )
            return payload

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Turkey-wide fault line overlay: independent of the selected city (unlike the
# per-prediction `faultLines`, which risk_bridge filters to ~180km of one city).
# Sourced from the real GEM active-faults dataset (not the 6-segment approximation
# in risk_engine.FAULT_LINES) and cached in memory since the source file is ~10MB.
_turkey_fault_lines_cache = None
_turkey_fault_lines_lock = Lock()
TURKEY_BBOX = (25.0, 34.0, 45.5, 43.0)  # west, south, east, north


def _iter_geometry_lines(geometry):
    geom_type = geometry.get("type")
    coords = geometry.get("coordinates", [])
    if geom_type == "LineString":
        line = [(c[0], c[1]) for c in coords if len(c) >= 2]
        if len(line) >= 2:
            yield line
    elif geom_type == "MultiLineString":
        for segment in coords:
            line = [(c[0], c[1]) for c in segment if len(c) >= 2]
            if len(line) >= 2:
                yield line


def _load_turkey_fault_lines():
    import json

    west, south, east, north = TURKEY_BBOX
    path = RISK_ROOT / "data" / "fault_maps" / "fay_haritası" / "gem_active_faults_harmonized.geojson"
    if not path.exists():
        return []

    with open(path, "r", encoding="utf-8") as handle:
        geojson_data = json.load(handle)

    lines = []
    for feature in geojson_data.get("features", []):
        geometry = feature.get("geometry") or {}
        name = (feature.get("properties") or {}).get("name") or "Fay Hatti"
        for line in _iter_geometry_lines(geometry):
            if not any(west <= lon <= east and south <= lat <= north for lon, lat in line):
                continue
            lines.append({
                "name": name,
                "points": [{"latitude": lat, "longitude": lon} for lon, lat in line],
            })
    return lines


def _get_turkey_fault_lines():
    global _turkey_fault_lines_cache
    if _turkey_fault_lines_cache is not None:
        return _turkey_fault_lines_cache
    with _turkey_fault_lines_lock:
        if _turkey_fault_lines_cache is None:
            _turkey_fault_lines_cache = _load_turkey_fault_lines()
    return _turkey_fault_lines_cache


@app.get("/api/risk/fault_lines")
def risk_fault_lines():
    lines = _get_turkey_fault_lines()
    return {"faultLines": lines, "count": len(lines)}


@app.get("/api/risk/all_quakes")
def risk_all_quakes(
    minMagnitude: float = 0.0,
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    limit: int = 500,
    sortBy: str = "time",
):
    """Rasathane view: the full national catalog (query.csv, ~20k events back to
    1933), independent of any selected city — unlike /predict's 150km-around-one-city
    slice. Filterable/sortable/paginated so a browser never has to render 20k markers
    at once."""
    if not risk_engine:
        raise HTTPException(status_code=503, detail="Risk model is not loaded.")

    try:
        import pandas as pd

        with temporary_sys_path(RISK_ROOT), temporary_cwd(RISK_ROOT):
            risk_engine._prepare_frames()
            df = risk_engine.df_full.copy()

        df = df[df["mag"] >= minMagnitude]
        if startDate:
            start_ts = pd.Timestamp(startDate)
            if start_ts.tzinfo is None:
                start_ts = start_ts.tz_localize("UTC")
            df = df[df["time"] >= start_ts]
        if endDate:
            end_ts = pd.Timestamp(endDate)
            if end_ts.tzinfo is None:
                end_ts = end_ts.tz_localize("UTC")
            df = df[df["time"] <= end_ts]

        total_matched = int(len(df))

        if sortBy == "magnitude":
            df = df.sort_values(["mag", "time"], ascending=[False, False])
        else:
            df = df.sort_values("time", ascending=False)

        capped_limit = max(1, min(int(limit), 2000))
        df = df.head(capped_limit)

        quakes = [
            {
                "time": str(row["time"]),
                "place": row.get("place") or "Bilinmeyen konum",
                "magnitude": float(row["mag"]),
                "depth": float(row["depth"]) if pd.notna(row.get("depth")) else None,
                "latitude": float(row["latitude"]),
                "longitude": float(row["longitude"]),
                "status": row.get("status") or "reviewed",
            }
            for _, row in df.iterrows()
        ]

        full_range = risk_engine.df_full["time"]
        return {
            "quakes": quakes,
            "totalMatched": total_matched,
            "returned": len(quakes),
            "datasetStart": str(full_range.min()),
            "datasetEnd": str(full_range.max()),
            "datasetTotal": int(len(risk_engine.df_full)),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/risk/refresh_live_data")
def risk_refresh_live_data():
    """Pulls fresh Kandilli (+ USGS gap-fill) data into query.csv and invalidates
    the risk engine's in-memory frames/model so the next request re-reads it."""
    if not risk_engine:
        raise HTTPException(status_code=503, detail="Risk model is not loaded.")

    try:
        with temporary_sys_path(RISK_ROOT, MOBILE_TOOL_ROOT), temporary_cwd(RISK_ROOT):
            from data_manager import fetch_and_update_data
            message = fetch_and_update_data()

        risk_engine.df_full = None
        risk_engine.df_main = None
        risk_engine.model = None

        return {"message": message}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/road_damage/wayback_versions")
def road_damage_wayback_versions():
    try:
        runtime = _get_road_runtime()
    except Exception:
        raise HTTPException(
            status_code=503,
            detail=f"Road Damage runtime yuklenemedi: {road_runtime_error or 'bilinmeyen hata'}",
        )
    get_wayback_versions = runtime["get_wayback_versions"]
    versions = get_wayback_versions()
    versions.sort(key=lambda v: v.get("date", ""), reverse=True)
    return {"versions": versions}


@app.get("/api/road_damage/oam_search")
def road_damage_oam_search(
    latitude: float,
    longitude: float,
    dateStart: Optional[str] = None,
    dateEnd: Optional[str] = None,
    radiusKm: float = 5.0,
    bboxWest: Optional[float] = None,
    bboxSouth: Optional[float] = None,
    bboxEast: Optional[float] = None,
    bboxNorth: Optional[float] = None,
):
    try:
        runtime = _get_road_runtime()
    except Exception:
        raise HTTPException(
            status_code=503,
            detail=f"Road Damage runtime yuklenemedi: {road_runtime_error or 'bilinmeyen hata'}",
        )
    search_oam_images = runtime["search_oam_images"]

    if bboxWest is not None and bboxSouth is not None and bboxEast is not None and bboxNorth is not None:
        bbox = (bboxWest, bboxSouth, bboxEast, bboxNorth)
    else:
        bbox = runtime["bbox_from_center"](latitude, longitude, max(0.5, radiusKm))

    images = search_oam_images(bbox, date_start=dateStart, date_end=dateEnd, limit=25)
    return {"images": images}


@app.post("/api/road_damage/analyze", status_code=202)
def analyze_road_damage(req: RoadDamageRequest):
    """Kicks off a road-damage analysis on the dedicated ProcessPoolExecutor
    and returns immediately with a job id -- the actual Segformer inference
    (CPU-bound, can take minutes) used to run inline here and freeze every
    other endpoint on this single-process server for its whole duration.
    Poll GET /api/road_damage/status/{analysisId} for the result.
    """
    if road_damage_pool is None:
        raise HTTPException(status_code=503, detail="Road Damage worker havuzu henuz hazir degil.")
    if _count_queued_road_damage_jobs() >= ROAD_DAMAGE_MAX_QUEUED_JOBS:
        raise HTTPException(
            status_code=503,
            detail="Sistem su anda cok sayida hasar analizi istegini isliyor. Lutfen birkac saniye sonra tekrar deneyin.",
        )

    from apps.road_damage import worker as road_damage_worker

    analysis_id = str(uuid.uuid4())
    req_dict = req.model_dump()
    req_dict["_analysisId"] = analysis_id
    _store_road_damage_job(analysis_id, {
        "status": "queued",
        "createdAt": time.time(),
        "progress": 0,
        "progressMessage": "Sirada bekliyor...",
    })

    future = road_damage_pool.submit(road_damage_worker.run_analysis_job, req_dict)
    future.add_done_callback(functools.partial(_on_road_damage_job_done, analysis_id))

    return {"analysisId": analysis_id, "status": "queued"}


@app.get("/api/road_damage/status/{analysis_id}")
def get_road_damage_status(analysis_id: str):
    with road_damage_jobs_lock:
        job = road_damage_jobs.get(analysis_id)
        if job is None:
            raise HTTPException(status_code=404, detail="Bilinmeyen ya da suresi dolmus analysisId.")
        status = job["status"]
        if status == "error":
            return {"analysisId": analysis_id, "status": "error", "error": job.get("error")}
        if status == "done":
            return {"analysisId": analysis_id, "status": "done", "progress": 100, **job["result"]}
        return {
            "analysisId": analysis_id,
            "status": status,
            "progress": job.get("progress", 0),
            "progressMessage": job.get("progressMessage"),
        }


@app.post("/api/road_damage/route")
def road_damage_route(req: RoadDamageRouteRequest):
    with road_damage_sessions_lock:
        session = road_damage_sessions.get(req.analysisId)
    if session is None:
        raise HTTPException(status_code=422, detail="Analiz oturumu bulunamadi veya suresi doldu. Once analizi tekrar calistirin.")

    try:
        runtime = _get_road_runtime()
    except Exception:
        raise HTTPException(
            status_code=503,
            detail=f"Road Damage runtime yuklenemedi: {road_runtime_error or 'bilinmeyen hata'}",
        )

    calculate_route = runtime["calculate_route"]
    safe_G = session["safe_G"]

    try:
        dijkstra_coords, _astar_coords, _dijkstra_cost, _astar_cost = calculate_route(
            safe_G, req.startLat, req.startLon, req.endLat, req.endLon,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rota hesaplanamadi: {e}")

    if not dijkstra_coords:
        raise HTTPException(status_code=422, detail="Bu iki nokta arasinda guvenli bir baglanti bulunamadi. Yol tamamen kapali olabilir.")

    distance_m = 0.0
    for (lat1, lon1), (lat2, lon2) in zip(dijkstra_coords[:-1], dijkstra_coords[1:]):
        distance_m += _haversine_m(lat1, lon1, lat2, lon2)

    return {
        "routeCoords": [[float(lat), float(lon)] for lat, lon in dijkstra_coords],
        "distanceMeters": round(distance_m, 1),
    }


@app.post("/api/road_damage/simulate_closures")
def simulate_road_closures(req: SimulateClosuresRequest):
    """Gercek senaryo kurgusu icin: CANLI SegFormer/uydu goruntusu
    calistirmadan, gercek bir OSM yol grafigi uzerinde rastgele yol
    kapanmalari atar. `/analyze`'in basarili sonuc seklinin BIREBIR ayni
    doner (analysisId + safe/blockedRoadSegments + bounds) -- boylece
    /route, /recent ve frontend hicbir fark gozetmeden kullanir. Senkron
    calisir (worker pool YOK) cunku SegFormer inference yok, sadece graf
    edinme var (fetch_osm_road_graph zaten cache-first, hizli)."""
    from apps.road_damage.utils.assembly import bbox_from_center
    from apps.road_damage.utils.network import simulate_random_closures

    bbox = bbox_from_center(req.latitude, req.longitude, req.radiusKm)
    # network_type='walk' (varsayilan 'drive' yerine): CARTO taban haritasi
    # yaya sokaklarini/ara yollari da ciziyor, 'drive' grafigi bunlari hic
    # icermedigi icin haritada "bos" (renksiz) kalan bir suru yol goruluyordu.
    # 'walk' arac + yaya gecebilen TUM yollari kapsadigi icin (arama-kurtarma
    # ekipleri zaten hem araclarla hem yaya ilerliyor), haritadaki neredeyse
    # her sokak acik/kapali olarak renklendirilir.
    G, safe_G, safe_edges, blocked_edges, error = simulate_random_closures(
        bbox, closure_ratio=req.closureRatio, seed=req.seed, network_type='walk',
    )
    if G is None:
        raise HTTPException(status_code=503, detail=f"Yol grafigi alinamadi: {error}")

    analysis_id = str(uuid.uuid4())
    bounds_dict = {"west": bbox[0], "south": bbox[1], "east": bbox[2], "north": bbox[3]}
    result = {
        "bounds": bounds_dict,
        "safeRoadSegments": _serialize_segments(safe_edges),
        "blockedRoadSegments": _serialize_segments(blocked_edges),
        "simulated": True,
    }

    # G (kapatmasiz TAM graf) + kapali kenar (u,v,key) kumesi de saklanir --
    # /naive_compare bu ikisini KENDI SURECIMIZDE (baska bir Python surecinde
    # simulate_random_closures'i AYNI parametrelerle TEKRAR cagirmak yerine)
    # kullanarak "biz olmasaydik" karsilastirmasini calistirir. Surecler
    # arasi rastgele-ornekleme tutarsizligi (bkz. network.py'deki
    # simulate_naive_agent docstring'i) boylece tamamen ortadan kalkar.
    closed_edge_keys = {(u, v, k) for u, v, k, _line in blocked_edges}
    _store_road_damage_session(analysis_id, {
        "safe_G": safe_G, "G": G, "closedEdgeKeys": closed_edge_keys, "bounds": bounds_dict,
    })
    _store_road_damage_job(analysis_id, {
        "status": "done", "result": result, "progress": 100,
        "progressMessage": "Simulasyon tamamlandi.",
        "createdAt": time.time(), "finishedAt": time.time(),
    })
    return {"analysisId": analysis_id, "status": "done", **result}


class NaiveCompareRequest(BaseModel):
    analysisId: str
    startLat: float
    startLon: float
    endLat: float
    endLon: float


@app.post("/api/road_damage/naive_compare")
def naive_compare(req: NaiveCompareRequest):
    """'Biz tespit edip soylemeseydik ne kadar kaybederdiniz' karsilastirmasi
    -- SADECE simulate_closures ile olusturulmus (yani gercek bir G + kapali
    kenar kumesi tasiyan) session'lar icin calisir. Naif ajan simulasyonu
    BILEREK bu SURECTE (baska bir Python sureci -- benchmark script'i --
    DEGIL) calistirilir: /route'un fiilen kullandigi G/kapanma kumesiyle
    BIREBIR ayni nesneleri kullanir, boylece 'ayni kapanmayi biliyor/bilmiyor
    olma' matematiksel garantisi (naive >= bizim motor) hicbir surec-arasi
    farkla bozulmaz."""
    with road_damage_sessions_lock:
        session = road_damage_sessions.get(req.analysisId)
    if session is None or "G" not in session or "closedEdgeKeys" not in session:
        raise HTTPException(
            status_code=422,
            detail="Bu analiz oturumu naif-ajan karsilastirmasi icin gerekli veriyi tasimiyor "
                   "(sadece /simulate_closures ile olusturulan oturumlar desteklenir).",
        )

    from apps.road_damage.utils.network import simulate_naive_agent

    G = session["G"]
    real_closed_edges = set()
    for u, v, k in session["closedEdgeKeys"]:
        real_closed_edges.add((u, v, k))
        real_closed_edges.add((v, u, k))

    result = simulate_naive_agent(G, real_closed_edges, req.startLat, req.startLon, req.endLat, req.endLon)
    if result is None:
        return {"reachable": False, "distanceMeters": None, "discoveries": None}
    return {"reachable": True, "distanceMeters": result["distanceMeters"], "discoveries": result["discoveries"]}


class SafeRouteRequest(BaseModel):
    startLat: float
    startLon: float
    destLat: float
    destLon: float
    radiusKm: float = 3.0


@app.post("/api/road_damage/safe_route")
def road_damage_safe_route(req: SafeRouteRequest):
    """PostGIS-tabanlı, session'sız risk-ağırlıklı rota (rapor 2.4.4): kapalı
    yol maskeleri + damage_points + road_blockages tek bir ceza-katsayılı
    grafta birleştirilir. /api/road_damage/analyze'nin önceden çağrılmış
    olmasını gerektirmez -- mevcut /route (session'a bağlı) ve
    /calculate_custom_route (OSRM/düz-çizgi) endpoint'lerinin üçüncü,
    risk-farkında alternatifidir.
    """
    import json as _json

    import osmnx as ox

    from apps.road_damage.utils.assembly import bbox_from_center
    from apps.road_damage.utils.network import apply_risk_penalties, calculate_route

    center_lat = (req.startLat + req.destLat) / 2.0
    center_lon = (req.startLon + req.destLon) / 2.0
    bbox = bbox_from_center(center_lat, center_lon, req.radiusKm)
    west, south, east, north = bbox

    try:
        G = ox.graph_from_bbox(bbox=bbox, network_type="walk", simplify=True)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Yol agi indirilemedi: {e}")

    damage_points = []
    blockages = []
    if postgis_engine.check_connection():
        damage_points = postgis_engine.query_damage_points_in_bbox(bbox)
        for row in postgis_engine.query_blockages_in_bbox(bbox):
            try:
                geometry = _json.loads(row["geojson"])
                coords = geometry.get("coordinates") or []
                if geometry.get("type") == "LineString" and coords:
                    blockages.append([[lat, lon] for lon, lat in coords])
            except Exception:
                continue
    else:
        # PostGIS offline: fall back to the in-memory blockage registry
        # (same offline-fallback pattern as /assembly and /heatmap).
        for blk in LIVE_ROAD_BLOCKAGES:
            coords = blk.get("coords") or []
            if any(west <= lon <= east and south <= lat <= north for lat, lon in coords):
                blockages.append(coords)

    apply_risk_penalties(G, damage_points, blockages, blockage_hard_radius_m=25.0)

    try:
        dijkstra_coords, astar_coords, dijkstra_cost, astar_cost = calculate_route(
            G, req.startLat, req.startLon, req.destLat, req.destLon, weight="risk_cost",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rota hesaplanamadi: {e}")

    candidates = []
    if dijkstra_coords and dijkstra_cost is not None:
        candidates.append(("dijkstra", dijkstra_coords, dijkstra_cost))
    if astar_coords and astar_cost is not None:
        candidates.append(("astar", astar_coords, astar_cost))
    if not candidates:
        raise HTTPException(status_code=422, detail="Bu iki nokta arasinda guvenli bir baglanti bulunamadi. Yol tamamen kapali olabilir.")

    algorithm, route_coords, risk_score = min(candidates, key=lambda c: c[2])

    distance_m = 0.0
    for (lat1, lon1), (lat2, lon2) in zip(route_coords[:-1], route_coords[1:]):
        distance_m += _haversine_m(lat1, lon1, lat2, lon2)

    return {
        "routeCoords": [[float(lat), float(lon)] for lat, lon in route_coords],
        "distanceMeters": round(distance_m, 1),
        "algorithm": algorithm,
        "riskScore": round(risk_score, 1),
        "damagePointsConsidered": len(damage_points),
        "blockagesConsidered": len(blockages),
    }


def _fetch_osrm_street_route(u_lat: float, u_lon: float, d_lat: float, d_lon: float):
    import requests
    url = f"http://router.project-osrm.org/route/v1/foot/{u_lon},{u_lat};{d_lon},{d_lat}?overview=full&geometries=geojson"
    r = requests.get(url, timeout=6)
    if r.status_code == 200:
        data = r.json()
        if data.get("routes"):
            route = data["routes"][0]
            coords = [[float(lat), float(lon)] for lon, lat in route["geometry"]["coordinates"]]
            return coords, float(route["distance"]), None
    return None, None, "OSRM routing service unavailable"

@app.get("/api/postgis/status")
def postgis_status():
    from utils.postgis_manager import postgis_engine
    is_connected = postgis_engine.check_connection()
    return {
        "postgisConnected": is_connected,
        "dbUrl": postgis_engine.db_url.split("@")[-1] if is_connected else "Offline",
        "hybridFallbackActive": True,
        "message": "PostgreSQL/PostGIS eklentisi aktif. GIST R-Tree mekânsal indeksleme kullanılıyor." if is_connected else "PostgreSQL/PostGIS çevrimdışı. Sistem otomatik çevrimdışı AFAD veri seti fallback modunda çalışıyor."
    }

@app.get("/api/road_damage/heatmap")
def road_damage_heatmap(latitude: float, longitude: float, radiusKm: float = 10.0):
    """Rapor 2.4.3'teki Gaussian kernel yoğunluk ısı haritası: bir konumdan
    kaç "bildirim" geldiğini gösterir -- Twitter/NLP (geocoded tweet), kamera
    (çatlak/yıkım tespiti), SOS alarmı ve uydu/Segformer'ın tespit ettiği
    tekil hasar noktaları (damage_points, hepsi). Bilinçli olarak
    road_blockages (kapalı yol çizgileri) KULLANILMAZ -- o veri rota
    motorunun (safe_route) ceza katsayısı için ayrı bir katman, buradaki ısı
    haritası salt "bir yerden ne kadar bildirim geldi" sorusuna cevap verir.
    leaflet.heat uyumlu [lat, lon, intensity] listesi döner.
    """
    from apps.road_damage.utils.assembly import bbox_from_center
    from apps.road_damage.utils.heatmap import build_gaussian_heatmap

    bbox = bbox_from_center(latitude, longitude, radiusKm)
    west, south, east, north = bbox

    points: list[tuple[float, float, float]] = []
    by_source: dict[str, int] = {}
    is_postgis = postgis_engine.check_connection()

    if is_postgis:
        damage_rows = postgis_engine.query_damage_points_in_bbox(bbox)
        for row in damage_rows:
            weight = row.get("severity") or 0.5
            points.append((row["lat"], row["lon"], max(0.1, float(weight))))
            source_type = row.get("source_type") or "unknown"
            by_source[source_type] = by_source.get(source_type, 0) + 1

    heat_points = build_gaussian_heatmap(points, bbox, grid_size=100, bandwidth_km=0.5)

    return {
        "points": heat_points,
        "bounds": {"west": west, "south": south, "east": east, "north": north},
        "generatedFrom": {
            "totalReports": len(points),
            "bySource": by_source,
            "source": "postgis" if is_postgis else "offline_fallback",
        },
    }


@app.get("/api/road_damage/assembly")
def road_damage_assembly(
    latitude: float,
    longitude: float,
    radiusKm: float = 10.0,
    includeCandidates: bool = True,
    dataSource: str = "auto",
    allowOnlineFallback: bool = True,
):
    import json
    import math
    from utils.postgis_manager import postgis_engine

    records = []

    # 1. Try querying PostGIS first if connected
    if postgis_engine.check_connection():
        records = postgis_engine.query_nearby_postgis(latitude, longitude, radiusKm * 1000.0)

    # 2. Fallback to local AFAD JSON dataset (72,232 points across Turkey)
    afad_json_path = ROAD_ROOT / "data" / "tum_turkiye_toplanma_alanlari.json"
    if not records and afad_json_path.exists():
        try:
            with open(afad_json_path, encoding="utf-8") as f:
                afad_data = json.load(f)

            for item in afad_data:
                try:
                    e_lat = float(item["enlem"])
                    e_lon = float(item["boylam"])
                    if abs(e_lat - latitude) <= (radiusKm / 111.0) and abs(e_lon - longitude) <= (radiusKm / 80.0):
                        dist_m = _haversine_m(latitude, longitude, e_lat, e_lon)
                        if dist_m <= (radiusKm * 1000.0):
                            records.append({
                                "toplanma_alani": item.get("toplanma_alani", "AFAD Resmi Toplanma Alanı"),
                                "name": item.get("toplanma_alani", "AFAD Resmi Toplanma Alanı"),
                                "il": item.get("il", ""),
                                "ilce": item.get("ilce", ""),
                                "mahalle": item.get("mahalle", ""),
                                "lat": e_lat,
                                "lon": e_lon,
                                "display_lat": e_lat,
                                "display_lon": e_lon,
                                "category": "AFAD Resmi Toplanma Alanı",
                                "priority": 0,
                                "source": "AFAD Resmi Veri Seti (Offline Fallback)",
                                "capacity": "Resmi Toplanma Alanı",
                                "status": "🟢 Güvenli AFAD Toplanma Alanı",
                                "dist_m": round(dist_m, 1)
                            })
                except Exception:
                    continue
        except Exception as e:
            print(f"Error reading AFAD JSON dataset: {e}")

    records.sort(key=lambda r: r.get("dist_m", 999999))
    records = records[:50]  # Return top 50 closest AFAD safe zones

    nearest = records[0] if records else None
    nearest_air_m = nearest["dist_m"] if nearest else None

    # Calculate real street-following route to nearest safe zone
    route_coords = None
    route_length_m = None
    route_error = None

    if nearest:
        try:
            route_coords, route_length_m, route_error = _fetch_osrm_street_route(
                latitude, longitude, nearest["lat"], nearest["lon"]
            )
        except Exception as e:
            route_error = str(e)

    is_postgis = postgis_engine.check_connection()
    return {
        "records": records,
        "activeDataSource": "PostgreSQL 16 + PostGIS 3.4 (71.420 Nokta GIST Mekansal Indeksli)" if is_postgis else "Tum Turkiye AFAD Veri Seti (Cevrimdisi Fallback)",
        "osmError": None,
        "nearest": nearest,
        "nearestAirM": nearest_air_m,
        "routeCoords": route_coords,
        "routeLengthM": round(route_length_m, 1) if route_length_m else nearest_air_m,
        "routeError": route_error,
    }


class CustomRouteRequest(BaseModel):
    startLat: float
    startLon: float
    destLat: float
    destLon: float
    allowOnlineFallback: bool = True

@app.post("/api/road_damage/calculate_custom_route")
def calculate_custom_route(req: CustomRouteRequest):
    # 1. Fetch real OSRM street route following actual road geometry
    route_coords, route_length_m, route_error = None, None, None

    try:
        route_coords, route_length_m, route_error = _fetch_osrm_street_route(
            req.startLat, req.startLon, req.destLat, req.destLon
        )
    except Exception as e:
        route_error = str(e)

    # 2. If OSRM offline, fallback to OSMnx or multi-node interpolation
    if not route_coords:
        try:
            from apps.road_damage.utils.assembly import shortest_walk_route
            route_coords, route_length_m, route_error = shortest_walk_route(
                req.startLat, req.startLon, req.destLat, req.destLon
            )
        except Exception as e:
            print(f"OSMnx fallback error: {e}")

    if not route_coords:
        route_coords = [
            [req.startLat, req.startLon],
            [req.startLat + (req.destLat - req.startLat) * 0.33, req.startLon + (req.destLon - req.startLon) * 0.33],
            [req.startLat + (req.destLat - req.startLat) * 0.66, req.startLon + (req.destLon - req.startLon) * 0.66],
            [req.destLat, req.destLon]
        ]
        route_length_m = _haversine_m(req.startLat, req.startLon, req.destLat, req.destLon)

    est_minutes = round((route_length_m or 0) / 80.0) if route_length_m else 5

    return {
        "start": [req.startLat, req.startLon],
        "destination": [req.destLat, req.destLon],
        "routeCoords": [[float(lat), float(lon)] for lat, lon in route_coords],
        "routeLengthM": round(route_length_m, 1) if route_length_m else 0,
        "estWalkMinutes": max(1, est_minutes),
        "routeError": route_error
    }

class RoadBlockageRequest(BaseModel):
    startLat: float
    startLon: float
    endLat: float
    endLon: float
    reason: str = "Uydu / İHA Tespitli Kapalı Yol"
    severity: str = "Ağır Hasarlı"

# Global in-memory road blockage registry
LIVE_ROAD_BLOCKAGES = [
    {
        "id": "blk-1",
        "coords": [[36.2050, 36.1640], [36.2040, 36.1670], [36.2020, 36.1690]],
        "reason": "Segformer AI Yapay Zeka - Bina Yıkıntısı ve Enkaz Tespiti",
        "severity": "🔴 Geçiş İmkânsız (Kapanmış)",
        "created_at": "2026-08-03T10:00:00Z"
    },
    {
        "id": "blk-2",
        "coords": [[36.2100, 36.1700], [36.2090, 36.1740]],
        "reason": "Uydu / İHA Fotoğraf Analizi - Ağır Yol Çatlağı",
        "severity": "⚠️ Tehlikeli Yol Segmenti",
        "created_at": "2026-08-03T10:15:00Z"
    }
]

@app.post("/api/road_damage/report_blockage")
def report_road_blockage(req: RoadBlockageRequest):
    import uuid
    from utils.postgis_manager import postgis_engine

    blockage_id = f"blk-{uuid.uuid4().hex[:6]}"
    coords = [[req.startLat, req.startLon], [req.endLat, req.endLon]]
    
    new_blk = {
        "id": blockage_id,
        "coords": coords,
        "reason": req.reason,
        "severity": req.severity,
        "created_at": "2026-08-03T13:35:00Z"
    }
    LIVE_ROAD_BLOCKAGES.append(new_blk)

    # Persist in PostGIS if connected
    if postgis_engine.check_connection():
        try:
            import psycopg2
            conn = psycopg2.connect(postgis_engine.db_url)
            conn.autocommit = True
            cur = conn.cursor()
            wkt = f"LINESTRING({req.startLon} {req.startLat}, {req.endLon} {req.endLat})"
            cur.execute("""
                INSERT INTO road_blockages (id, title, severity, geom)
                VALUES (%s, %s, %s, ST_SetSRID(ST_GeomFromText(%s), 4326));
            """, (blockage_id, req.reason, req.severity, wkt))
            cur.close()
            conn.close()
        except Exception as e:
            print(f"PostGIS blockage insert error: {e}")

    return {
        "status": "success",
        "message": "Uydu / İHA Yol Kapalılığı Veritabanına Anında Kaydedildi! Rotalar Yeniden Hesaplandı.",
        "blockage": new_blk,
        "totalBlockages": len(LIVE_ROAD_BLOCKAGES)
    }

_DAMAGE_SOURCE_LABELS = {
    "crack": "YOLO Çatlak Tespiti",
    "destruction": "YOLO Bina Yıkıntı Tespiti",
    "road_damage": "Segformer AI Uydu Analizi",
    "sos": "Saha İhbarı / SOS",
}


def _damage_point_severity_label(source_type: str, severity: Optional[float]) -> str:
    if source_type == "sos":
        return "🆘 SOS Alarmı"
    pct = round((severity or 0.0) * 100)
    if (severity or 0.0) >= 0.6:
        return f"🔴 Ağır Hasar (%{pct} Risk)"
    if (severity or 0.0) >= 0.3:
        return f"⚠️ Orta Hasar (%{pct} Risk)"
    return f"🟡 Hafif Hasar (%{pct} Risk)"


@app.get("/api/road_damage/nearest_debris")
def get_nearest_debris_for_teams(latitude: float, longitude: float, limit: int = 5):
    """Arama Kurtarma Ekipleri için GPS Konumuna En Yakın Enkaz & Ağır Hasarlı
    Noktaları Listeler -- damage_points (kamera/YOLO/Segformer/SOS tespitleri)
    ve road_blockages'tan gerçek PostGIS mekânsal sorgusuyla üretilir."""
    import json as _json

    radius_m = 5000.0
    results = []
    is_postgis = postgis_engine.check_connection()

    if is_postgis:
        for row in postgis_engine.query_damage_points_nearby(latitude, longitude, radius_m):
            source_type = row.get("source_type") or ""
            results.append({
                "id": f"dmg-{row['id']}",
                "name": row.get("label") or _DAMAGE_SOURCE_LABELS.get(source_type, "Hasar Noktası"),
                "lat": row["lat"],
                "lon": row["lon"],
                "severity": _damage_point_severity_label(source_type, row.get("severity")),
                "source": _DAMAGE_SOURCE_LABELS.get(source_type, "PostGIS Mekânsal Analiz"),
                "dist_m": round(row.get("dist_m", 0.0), 1),
            })

        from apps.road_damage.utils.assembly import bbox_from_center
        bbox = bbox_from_center(latitude, longitude, radius_m / 1000.0)
        for blk in postgis_engine.query_blockages_in_bbox(bbox):
            try:
                geometry = _json.loads(blk["geojson"])
                coords = geometry.get("coordinates") or []
                if not coords:
                    continue
                mid_lon, mid_lat = coords[len(coords) // 2][:2]
                dist_m = _haversine_m(latitude, longitude, mid_lat, mid_lon)
                if dist_m <= radius_m:
                    results.append({
                        "id": f"blk-{blk['id']}",
                        "name": blk.get("title") or "Yol Kapanması",
                        "lat": mid_lat,
                        "lon": mid_lon,
                        "severity": blk.get("severity") or "🔴 Tamamen Kapalı Yol",
                        "source": "PostGIS Mekânsal Analiz",
                        "dist_m": round(dist_m, 1),
                    })
            except Exception:
                continue

    for r in results:
        r["est_dispatch_minutes"] = max(1, round(r["dist_m"] / 80.0))
    results.sort(key=lambda r: r["dist_m"])
    top = results[:limit]

    return {
        "teamLocation": [latitude, longitude],
        "nearestDebrisCount": len(top),
        "debrisSites": top,
        "source": "postgis" if is_postgis else "offline_fallback",
    }


@app.post("/api/sos/alert")
def create_sos_alert(req: SOSAlertRequest):
    if not (-90.0 <= req.latitude <= 90.0) or not (-180.0 <= req.longitude <= 180.0):
        raise HTTPException(status_code=422, detail="Gecersiz koordinat.")

    alert = {
        "id": str(uuid.uuid4()),
        "latitude": req.latitude,
        "longitude": req.longitude,
        "accuracy": req.accuracy,
        "message": req.message,
        "userId": req.userId,
        "batteryPercent": req.batteryPercent,
        "commsStatus": req.commsStatus,
        "receivedAt": datetime.now(timezone.utc).isoformat(),
    }

    with sos_lock:
        sos_alerts.append(alert)
        total = len(sos_alerts)

    try:
        postgis_engine.insert_damage_point(
            "sos", req.latitude, req.longitude,
            severity=1.0, label=req.message or "SOS Alarmi",
        )
    except Exception as e:
        print(f"damage_points insert (sos) hatasi: {e}")

    return {**alert, "totalAlerts": total}


@app.get("/api/sos/alerts")
def list_sos_alerts():
    with sos_lock:
        alerts = list(sos_alerts)
    return {"alerts": alerts, "totalAlerts": len(alerts)}


class SOSStatusUpdateRequest(BaseModel):
    status: str  # "OPEN" | "EN_ROUTE" | "RESOLVED"


@app.post("/api/sos/alert/{alert_id}/status")
def update_sos_status(alert_id: str, req: SOSStatusUpdateRequest):
    with sos_lock:
        for alert in sos_alerts:
            if alert["id"] == alert_id:
                alert["status"] = req.status
                alert["statusUpdatedAt"] = datetime.now(timezone.utc).isoformat()
                return alert
    raise HTTPException(status_code=404, detail="Bilinmeyen SOS uyarisi.")


@app.get("/api/camera/reports")
def list_debris_reports():
    with debris_lock:
        reports = list(debris_reports)
    return {"reports": reports, "totalReports": len(reports)}


@app.post("/api/team/claim")
def claim_team_target(req: TeamClaimRequest):
    with team_claims_lock:
        existing = team_claims.get(req.targetId)
        if existing is not None and existing["status"] == "active" and existing["teamId"] != req.teamId:
            raise HTTPException(
                status_code=409,
                detail=f"Bu hedefe zaten {existing['teamId']} ekibi mudahale ediyor.",
            )
        claim = {
            "targetId": req.targetId,
            "teamId": req.teamId,
            "targetType": req.targetType,
            "lat": req.lat,
            "lon": req.lon,
            "status": "active",
            "claimedAt": datetime.now(timezone.utc).isoformat(),
        }
        team_claims[req.targetId] = claim
    return claim


@app.get("/api/team/claims")
def list_team_claims():
    with team_claims_lock:
        claims = list(team_claims.values())
    return {"claims": claims, "totalClaims": len(claims)}


@app.post("/api/team/claim/{target_id}/route")
def attach_team_route(target_id: str, req: TeamRouteAttachRequest):
    """Bir claim'e gercek GNN rotasini ekler -- canli simulasyonda frontend
    bu rota + startedAt zaman damgasini kullanarak ekip pozisyonunu istemci
    tarafinda zaman-bazli interpolasyonla hesaplar (ayrica bir 'pozisyon
    guncelle' donguisune gerek kalmadan)."""
    with team_claims_lock:
        claim = team_claims.get(target_id)
        if claim is None:
            raise HTTPException(status_code=404, detail="Bu hedef icin aktif bir claim bulunamadi.")
        claim["routeCoords"] = req.routeCoords
        claim["distanceMeters"] = req.distanceMeters
        claim["assumedSpeedKmh"] = req.assumedSpeedKmh
        claim["startedAt"] = datetime.now(timezone.utc).isoformat()
    return claim


@app.get("/api/road_damage/recent")
def recent_road_damage_analyses(minutes: float = 60.0):
    """Canli simulasyon icin: son N dakikada tamamlanmis analizleri listeler
    -- frontend'in hangi analysisId'lerin haritada 'canli' gosterilecegini
    ayrica bir mekanizma icat etmeden bilmesini saglar."""
    cutoff = time.time() - minutes * 60
    results = []
    with road_damage_jobs_lock:
        for analysis_id, job in road_damage_jobs.items():
            if job.get("status") != "done" or job.get("createdAt", 0) < cutoff:
                continue
            result = job.get("result", {})
            results.append({
                "analysisId": analysis_id,
                "createdAt": job.get("createdAt"),
                "bounds": result.get("bounds"),
                "blockedRoadSegments": result.get("blockedRoadSegments", []),
                "safeRoadSegments": result.get("safeRoadSegments", []),
            })
    results.sort(key=lambda r: r["createdAt"], reverse=True)
    return {"analyses": results}


@app.post("/api/team/claim/{target_id}/release")
def release_team_claim(target_id: str):
    with team_claims_lock:
        claim = team_claims.get(target_id)
        if claim is None:
            raise HTTPException(status_code=404, detail="Bu hedef icin aktif bir claim bulunamadi.")
        claim["status"] = "completed"
        claim["releasedAt"] = datetime.now(timezone.utc).isoformat()
    return claim


class CameraAnalysisRequest(BaseModel):
    modelType: str = "hybrid"  # "catlak", "bina", "hybrid"
    imageBase64: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

@app.post("/api/camera/analyze")
def analyze_camera_frame(req: CameraAnalysisRequest):
    import base64
    import cv2
    import numpy as np

    model_type = req.modelType.lower()
    active_models = []
    detections = []
    annotated_b64 = None
    has_critical = False

    # Decode Base64 image if provided
    img = None
    if req.imageBase64:
        try:
            b64_data = req.imageBase64
            if "," in b64_data:
                b64_data = b64_data.split(",")[1]
            img_bytes = base64.b64decode(b64_data)
            nparr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        except Exception as e:
            print(f"Error decoding camera frame image: {e}")

    # 1. Run yolo_catlak if requested or hybrid
    if model_type in ["catlak", "crack", "hybrid"] and yolo_catlak and img is not None:
        active_models.append("catlak.pt (Çatlak Tespiti)")
        results = yolo_catlak(img, verbose=False)
        for r in results:
            for box in r.boxes:
                coords = box.xyxy[0].cpu().numpy().tolist()
                conf = float(box.conf[0].cpu().numpy())
                cls_id = int(box.cls[0].cpu().numpy())
                cls_name = yolo_catlak.names.get(cls_id, "crack")
                if conf >= 0.20:
                    severity = "CRITICAL" if conf > 0.45 else "SAFE"
                    if severity == "CRITICAL":
                        has_critical = True
                    detections.append({
                        "label": f"Duvar/Kolon Çatlağı ({cls_name})",
                        "confidence": round(conf * 100, 1),
                        "model": "catlak.pt",
                        "box": [round(c, 1) for c in coords],
                        "severity": severity
                    })

    # 2. Run yolo_bina if requested or hybrid
    if model_type in ["bina", "building", "hybrid"] and yolo_bina and img is not None:
        active_models.append("bina.pt (Bina Yapısal Hasar)")
        results = yolo_bina(img, verbose=False)
        for r in results:
            for box in r.boxes:
                coords = box.xyxy[0].cpu().numpy().tolist()
                conf = float(box.conf[0].cpu().numpy())
                cls_id = int(box.cls[0].cpu().numpy())
                cls_name = yolo_bina.names.get(cls_id, f"damage_{cls_id}")
                if conf >= 0.20:
                    severity = "CRITICAL" if ("VeryHeavy" in cls_name or "Moderate" in cls_name) else "SAFE"
                    if severity == "CRITICAL":
                        has_critical = True
                    label_tr = "Bina Ağır Hasarlı" if "VeryHeavy" in cls_name else ("Bina Orta Hasarlı" if "Moderate" in cls_name else "Bina Hasarsız / Güvenli")
                    detections.append({
                        "label": f"{label_tr} ({cls_name})",
                        "confidence": round(conf * 100, 1),
                        "model": "bina.pt",
                        "box": [round(c, 1) for c in coords],
                        "severity": severity
                    })

    # Draw bounding boxes on image if available
    if img is not None and detections:
        for d in detections:
            x1, y1, x2, y2 = [int(v) for v in d["box"]]
            color = (0, 0, 255) if d["severity"] == "CRITICAL" else (0, 255, 0)
            cv2.rectangle(img, (x1, y1), (x2, y2), color, 3)
            cv2.putText(img, f"{d['label']} %{d['confidence']}", (x1, max(y1 - 10, 20)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        _, buffer = cv2.imencode(".jpg", img)
        annotated_b64 = "data:image/jpeg;base64," + base64.b64encode(buffer).decode("utf-8")

    # Remove fake mock simulation — always return honest YOLO model output
    if detections:
        if has_critical:
            status = "CRITICAL_EVACUATE"
            advice = "⚠️ TAŞIYICI ELEMANDA DERİN YAPISAL ÇATLAK VEYA AĞIR HASAR TESPİT EDİLDİ! BİNAYI DERHAL BOŞALTIN VE EKİPLERE BİLDİRİN!"
        else:
            status = "SAFE_SURFACE"
            advice = "🟡 YÜZEYSEL ÇATLAK VEYA HASARSIZ YAPISAL DURUM TESPİT EDİLDİ. Taşıyıcı kolon/kirişlerde kritik tehlike görülmüyor."
    else:
        status = "NO_DETECTION"
        advice = "🟢 GÖRÜNTÜDE HERHANGİ BİR ÇATLAK VEYA BİNA HASARI SAPTANMADI. Modeller kamera karesinde riskli bir alan tespit etmedi."

    # Best-effort: persist detections as damage_points if the caller sent a
    # location, so the heatmap/route engine can eventually see them too.
    if req.latitude is not None and req.longitude is not None and detections:
        try:
            catlak_dets = [d for d in detections if d["model"] == "catlak.pt"]
            bina_dets = [d for d in detections if d["model"] == "bina.pt"]
            if catlak_dets:
                top = max(catlak_dets, key=lambda d: d["confidence"])
                postgis_engine.insert_damage_point(
                    "crack", req.latitude, req.longitude,
                    severity=top["confidence"] / 100.0, label=top["label"],
                )
            if bina_dets:
                top = max(bina_dets, key=lambda d: d["confidence"])
                postgis_engine.insert_damage_point(
                    "destruction", req.latitude, req.longitude,
                    severity=top["confidence"] / 100.0, label=top["label"],
                )
        except Exception as e:
            print(f"damage_points insert (camera) hatasi: {e}")

    result = {
        "status": status,
        "modelType": req.modelType,
        "activeModels": active_models or (["catlak.pt (Çatlak Tespiti)"] if model_type=="catlak" else (["bina.pt (Bina Hasar)"] if model_type=="bina" else ["catlak.pt", "bina.pt"])),
        "detections": detections,
        "annotatedImage": annotated_b64,
        "advice": advice,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    # Tespit varsa VE konum bilgisi geldiyse (telefon GPS'i), harita
    # uzerinde gorunur bir "enkaz/catlak" isareti olarak da sakla --
    # akis diyagramindaki "goruntu analizi -> haritada isaretle" adiminin
    # gercek karsiligi.
    if detections and req.latitude is not None and req.longitude is not None:
        report = {
            "id": str(uuid.uuid4()),
            "latitude": req.latitude,
            "longitude": req.longitude,
            "status": status,
            "severity": "CRITICAL" if has_critical else "SAFE",
            "detectionCount": len(detections),
            "topLabel": detections[0]["label"] if detections else None,
            "receivedAt": datetime.now(timezone.utc).isoformat(),
        }
        with debris_lock:
            debris_reports.append(report)
        result["debrisReportId"] = report["id"]

    return result

# AUTHENTICATION & AUTHORIZATION MODELS & ENDPOINTS
class UserRegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "survivor"  # "survivor" | "responder"
    city: Optional[str] = "Hatay"
    unit: Optional[str] = "Sivil Afetzede"

class UserLoginRequest(BaseModel):
    email: str
    password: str
    role: Optional[str] = None

def _hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(plain: str, stored: str) -> bool:
    if not stored:
        return False
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), stored.encode("utf-8"))
    except ValueError:
        # Legacy/pre-hash accounts had the raw password stored directly.
        # Accept a one-time plaintext match so existing accounts aren't locked out.
        return plain == stored


def _demo_user(id_suffix, name, email, role, unit, city="Hatay"):
    return {
        "id": f"usr-{id_suffix}",
        "name": name,
        "email": email,
        "password": _hash_password("password123"),
        "role": role,
        "city": city,
        "unit": unit,
        "token": f"token-{id_suffix}",
    }

# Demo accounts for development/testing -- multiple per role so team-chat and
# multi-user flows can be tried without needing real registrations. TODO:
# remove or gate behind an env flag before production.
USER_DATABASE = {
    u["email"]: u
    for u in [
        _demo_user("responder-101", "Afet Saha Ekibi", "saha@quakemind.gov.tr", "responder", "Arama Kurtarma Lideri"),
        _demo_user("responder-103", "Zeynep Arslan", "saha2@quakemind.gov.tr", "responder", "AKUT Arama Kurtarma Operatörü"),
        _demo_user("responder-104", "Mehmet Demir", "saha3@quakemind.gov.tr", "responder", "İHA & Uydu Operatörü"),
        _demo_user("responder-105", "Elif Kaya", "saha4@quakemind.gov.tr", "responder", "UMKE Sağlık Ekibi Lideri"),
        _demo_user("responder-106", "Burak Öztürk", "saha5@quakemind.gov.tr", "responder", "İtfaiye Arama Kurtarma"),
        _demo_user("survivor-102", "Afetzede Vatandaş", "afetzede@quakemind.gov.tr", "survivor", "Sivil"),
        _demo_user("survivor-103", "Ali Yıldız", "afetzede2@quakemind.gov.tr", "survivor", "Sivil"),
        _demo_user("survivor-104", "Ayşe Şahin", "afetzede3@quakemind.gov.tr", "survivor", "Sivil"),
    ]
}

@app.post("/api/auth/register")
def auth_register(req: UserRegisterRequest):
    email = req.email.lower().strip()

    # Check PostgreSQL database first
    existing = postgis_engine.get_user_by_email_db(email)
    if existing or email in USER_DATABASE:
        raise HTTPException(status_code=400, detail="Bu e-posta adresi zaten kayitli.")

    user_id = f"usr-{uuid.uuid4().hex[:6]}"
    token = f"token-{uuid.uuid4().hex[:12]}"
    new_user = {
        "id": user_id,
        "name": req.name,
        "email": email,
        "password": _hash_password(req.password),
        "role": req.role,
        "city": req.city or "Hatay",
        "unit": req.unit or ("Arama Kurtarma Saha Ekibi" if req.role == "responder" else "Sivil Afetzede"),
        "token": token
    }
    USER_DATABASE[email] = new_user

    # Save permanently to PostgreSQL / PostGIS Database
    saved_to_db = postgis_engine.save_user_db(new_user)
    db_status_text = "PostgreSQL DB'ye Kaydedildi" if saved_to_db else "Hafızaya Kaydedildi"

    user_profile = dict(new_user)
    user_profile.pop("password", None)
    return {
        "status": "success",
        "message": f"Hesabiniz basariyla olusturuldu ({req.role.upper()} yetkisi ile - {db_status_text}).",
        "token": token,
        "user": user_profile,
        "savedToPostgres": saved_to_db
    }

@app.post("/api/auth/login")
def auth_login(req: UserLoginRequest):
    email = req.email.lower().strip()

    # Check PostgreSQL database first
    db_user = postgis_engine.get_user_by_email_db(email)
    user = db_user or USER_DATABASE.get(email)

    if not user:
        # Auto-register demo account for smooth instant testing
        user_id = f"usr-{uuid.uuid4().hex[:6]}"
        token = f"token-{uuid.uuid4().hex[:12]}"
        user_role = req.role or "responder"
        user = {
            "id": user_id,
            "name": email.split("@")[0].capitalize(),
            "email": email,
            "password": _hash_password(req.password),
            "role": user_role,
            "city": "Hatay",
            "unit": "Arama Kurtarma Operatörü" if user_role == "responder" else "Sivil Afetzede",
            "token": token
        }
        USER_DATABASE[email] = user
        postgis_engine.save_user_db(user)
    else:
        stored_hash = user.get("password_hash") or user.get("password") or ""
        if not _verify_password(req.password, stored_hash):
            raise HTTPException(status_code=401, detail="E-posta veya sifre hatali.")

    user_profile = dict(user)
    user_profile.pop("password", None)
    user_profile.pop("password_hash", None)
    return {
        "status": "success",
        "message": "Giris basarili.",
        "token": user["token"],
        "user": user_profile
    }

@app.get("/api/auth/me")
def auth_me(token: Optional[str] = None):
    if token:
        db_user = postgis_engine.get_user_by_token_db(token)
        if db_user:
            user_profile = dict(db_user)
            user_profile.pop("password_hash", None)
            return {"status": "success", "user": user_profile}

    for email, u in USER_DATABASE.items():
        if u.get("token") == token or token == "demo-token":
            user_profile = dict(u)
            user_profile.pop("password", None)
            return {
                "status": "success",
                "user": user_profile
            }
    return {
        "status": "guest",
        "user": {
            "id": "usr-guest",
            "name": "Afet Saha Ekibi",
            "email": "saha@quakemind.gov.tr",
            "role": "responder",
            "city": "Hatay",
            "unit": "Arama Kurtarma Lideri"
        }
    }

def _authenticated_user(token: Optional[str]) -> Optional[dict]:
    """Resolves a token to its user record (PostgreSQL first, then the in-memory
    demo USER_DATABASE), or None if the token doesn't match any known user."""
    if not token:
        return None
    db_user = postgis_engine.get_user_by_token_db(token)
    if db_user:
        return dict(db_user)
    for u in USER_DATABASE.values():
        if u.get("token") == token:
            return dict(u)
    return None


def _require_role(token: Optional[str], allowed_roles: set[str]) -> dict:
    """Raises 401/403 unless token resolves to a user with one of allowed_roles."""
    user = _authenticated_user(token)
    if user is None:
        raise HTTPException(status_code=401, detail="Gecerli bir kimlik dogrulama tokeni gerekli.")
    if user.get("role") not in allowed_roles:
        raise HTTPException(status_code=403, detail="Bu islem icin yetkiniz yok.")
    return user


# EMERGENCY FCM PUSH NOTIFICATION DISPATCHER
class EmergencyNotificationRequest(BaseModel):
    title: str
    body: str
    severity: str = "critical"  # "critical" | "warning" | "info"
    location: Optional[str] = "Hatay"
    magnitude: Optional[float] = 6.8
    token: Optional[str] = None

active_emergency_alerts = []

@app.post("/api/notifications/send_emergency")
def send_emergency_notification(req: EmergencyNotificationRequest):
    _require_role(req.token, {"responder", "admin"})
    alert = {
        "id": f"alert-{uuid.uuid4().hex[:6]}",
        "title": req.title,
        "body": req.body,
        "severity": req.severity,
        "location": req.location,
        "magnitude": req.magnitude,
        "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S")
    }
    active_emergency_alerts.insert(0, alert)
    return {
        "status": "broadcasted",
        "message": "Acil durum push bildirimi tum cihazlara ve frontend'e yayinlandi.",
        "activeAlert": alert
    }

@app.get("/api/notifications/active")
def get_active_emergency_notifications():
    return {
        "activeAlert": active_emergency_alerts[0] if active_emergency_alerts else None,
        "totalAlerts": len(active_emergency_alerts)
    }


# TEAM CHAT (internal messaging between logged-in responder/admin accounts)
class ChatMessageRequest(BaseModel):
    token: Optional[str] = None
    text: str

team_chat_messages: list[dict] = []
_TEAM_CHAT_LIMIT = 200

@app.post("/api/chat/send")
def send_team_chat_message(req: ChatMessageRequest):
    user = _require_role(req.token, {"responder", "admin"})
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Mesaj boş olamaz.")
    message = {
        "id": f"msg-{uuid.uuid4().hex[:10]}",
        "senderId": user.get("id"),
        "senderName": user.get("name") or user.get("email") or "Ekip Üyesi",
        "senderUnit": user.get("unit"),
        "text": text[:2000],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    team_chat_messages.append(message)
    if len(team_chat_messages) > _TEAM_CHAT_LIMIT:
        del team_chat_messages[: len(team_chat_messages) - _TEAM_CHAT_LIMIT]
    return {"status": "sent", "message": message}

@app.get("/api/chat/messages")
def get_team_chat_messages(token: Optional[str] = None, limit: int = 50):
    _require_role(token, {"responder", "admin"})
    capped_limit = max(1, min(limit, _TEAM_CHAT_LIMIT))
    return {"messages": team_chat_messages[-capped_limit:]}

@app.get("/api/status")
def server_status():
    return {
        "status": "ok",
        "modules": {
            "nlp": _get_nlp_pipeline() is not None,
            "risk": risk_engine is not None,
            "road_damage": road_runtime is not None,
            "camera": True,
            "auth": True,
            "fcm_notifications": True,
        },
    }


if __name__ == "__main__":
    import socket
    import uvicorn

    host = "0.0.0.0"
    port = 8000

    def _get_local_ip() -> str:
        """Returns the LAN IP that other devices on the same network can reach."""
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            # No packet is sent; this is a common way to learn the outbound interface IP.
            sock.connect(("8.8.8.8", 80))
            return sock.getsockname()[0]
        except Exception:
            return "127.0.0.1"
        finally:
            sock.close()

    local_ip = _get_local_ip()
    workers = int(os.environ.get("QUAKEMIND_WORKERS", "1"))
    print("\n" + "=" * 60)
    print("FastAPI sunucusu baslatiliyor...")
    print(f"Bu cihazdan: http://127.0.0.1:{port}")
    print(f"Diger cihazlardan (ayni ag): http://{local_ip}:{port}")
    if workers > 1:
        print(f"Worker sayisi: {workers} (her worker modelleri kendi hafizasina ayrica yukler)")
    print("=" * 60 + "\n")

    if workers > 1:
        # Multiple worker processes so one heavy CPU-bound request (e.g. road
        # damage Segformer inference) can't starve every other request in the
        # process via the GIL -- reload isn't compatible with workers>1.
        uvicorn.run("fastapi_app:app", host=host, port=port, workers=workers)
    else:
        # QUAKEMIND_RELOAD=0: --reload kapatma kacisi. Windows'ta bazi venv
        # kurulumlarinda uvicorn'un reloader'i sys.executable'i sistem
        # Python'a cozumleyip worker'i YANLIS interpreter'da baslatabiliyor
        # (bkz. oturum notlari) -- kod degisikligi sonrasi guvenilir sekilde
        # yeniden yuklenmedigi gozlemlendiginde bu bayrakla kapatilabilir.
        reload_enabled = os.environ.get("QUAKEMIND_RELOAD", "1") != "0"
        uvicorn.run("fastapi_app:app", host=host, port=port, reload=reload_enabled)
