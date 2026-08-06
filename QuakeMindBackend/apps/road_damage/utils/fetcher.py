import math
import os
import requests
import numpy as np
import cv2
from PIL import Image
import datetime
import logging
import time
from concurrent.futures import ThreadPoolExecutor, wait as futures_wait

from .local_osm import draw_local_road_mask, has_local_roads_dataset

try:
    import streamlit as st
    from streamlit.runtime.scriptrunner import get_script_run_ctx
    _has_st = True
except ImportError:
    _has_st = False
    get_script_run_ctx = None

_logger = logging.getLogger(__name__)
_roads_cache = {}


def _warn(msg):
    if _has_st and get_script_run_ctx is not None and get_script_run_ctx() is not None:
        try:
            st.warning(msg)
        except Exception:
            pass
    _logger.warning(msg)


def _error(msg):
    if _has_st and get_script_run_ctx is not None and get_script_run_ctx() is not None:
        try:
            st.error(msg)
        except Exception:
            pass
    _logger.error(msg)

def num2deg(xtile, ytile, zoom):
    """Google/OSM Tile to Lat/Lon conversion."""
    n = 2.0 ** zoom
    lon_deg = xtile / n * 360.0 - 180.0
    lat_rad = math.atan(math.sinh(math.pi * (1 - 2 * ytile / n)))
    lat_deg = math.degrees(lat_rad)
    return (lat_deg, lon_deg)

def fetch_satellite_area(lat, lon, bbox=None, zoom_level=18, wayback_id=None, provider='google', custom_url=None):
    """Downloads tiles covering a bounding box or a single coordinate."""
    def _try_fetch(z):
        n = 2.0 ** z
        if not bbox:
            xt = int((lon + 180.0) / 360.0 * n)
            yt = int((1.0 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2.0 * n)
            lat_n, lon_w = num2deg(xt - 5, yt - 5, z)
            lat_s, lon_e = num2deg(xt + 6, yt + 6, z)
            b = (lon_w, lat_s, lon_e, lat_n)
        else:
            b = bbox
            
        lon_min, lat_min, lon_max, lat_max = b
        xtile_min = int((lon_min + 180.0) / 360.0 * n)
        xtile_max = int((lon_max + 180.0) / 360.0 * n)
        ytile_max = int((1.0 - math.asinh(math.tan(math.radians(lat_min))) / math.pi) / 2.0 * n)
        ytile_min = int((1.0 - math.asinh(math.tan(math.radians(lat_max))) / math.pi) / 2.0 * n)
        
        # Backstop cap on total downloaded tiles. The caller now picks `z`
        # (via `_zoom_for_radius` in fastapi_app.py) so a requested bbox
        # normally resolves to a small, bounded tile grid regardless of the
        # analysis radius -- this cap only guards against edge cases (e.g. an
        # explicit bbox from the caller). Keep it modest: CPU Segformer
        # inference runs over overlapping 512px patches, so pixel count (not
        # just download time) drives request latency -- an 8x8 grid (2048px)
        # already costs ~2x a 6x6 grid's inference time.
        if (xtile_max - xtile_min + 1) * (ytile_max - ytile_min + 1) > 64:
            xt_c = (xtile_min + xtile_max) // 2
            yt_c = (ytile_min + ytile_max) // 2
            xtile_min = max(xtile_min, xt_c - 3); xtile_max = min(xtile_max, xt_c + 4)
            ytile_min = max(ytile_min, yt_c - 3); ytile_max = min(ytile_max, yt_c + 4)

        nx_tiles = xtile_max - xtile_min + 1
        ny_tiles = ytile_max - ytile_min + 1
        stitched_img = Image.new('RGB', (nx_tiles * 256, ny_tiles * 256))
        headers = {'User-Agent': 'Mozilla/5.0'}

        if provider == 'esri' and wayback_id:
            url_for = lambda x, y: f"https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{wayback_id}/{z}/{y}/{x}"
        elif provider == 'google':
            url_for = lambda x, y: f"https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
        elif provider == 'custom' and custom_url:
            url_for = lambda x, y: custom_url.replace('{x}', str(x)).replace('{y}', str(y)).replace('{z}', str(z))
        else:
            return None, None

        def _fetch_tile(coords):
            x, y = coords
            from io import BytesIO
            try:
                r = requests.get(url_for(x, y), headers=headers, timeout=8)
                if r.status_code == 200:
                    tile_img = Image.open(BytesIO(r.content)).convert('RGB')
                    return (x - xtile_min) * 256, (y - ytile_min) * 256, tile_img
            except Exception:
                pass
            return None

        tile_coords = [
            (x, y)
            for x in range(xtile_min, xtile_max + 1)
            for y in range(ytile_min, ytile_max + 1)
        ]

        any_success = False
        # Tile fetches are I/O-bound (network round trips), so run them
        # concurrently instead of one-at-a-time -- otherwise a 12x12 (144)
        # tile grid at ~8s worst-case each can take minutes and blow past
        # the mobile client's request timeout.
        #
        # requests' `timeout=` only bounds the socket connect/read phase --
        # DNS resolution (socket.getaddrinfo) happens before that and can
        # hang indefinitely on a flaky/hotspot network. executor.map()
        # blocks on each future in submission order, so a single hung DNS
        # lookup would previously freeze this whole call (and the request
        # thread + semaphore slot holding it) forever. Bound the wait
        # explicitly and abandon whatever hasn't finished instead of
        # joining on it.
        executor = ThreadPoolExecutor(max_workers=16)
        try:
            futures = [executor.submit(_fetch_tile, coords) for coords in tile_coords]
            done, _pending = futures_wait(futures, timeout=60)
            for future in done:
                result = future.result()
                if result is not None:
                    px, py, tile_img = result
                    stitched_img.paste(tile_img, (px, py))
                    any_success = True
        finally:
            executor.shutdown(wait=False, cancel_futures=True)

        if not any_success:
            return None, None

        real_lat_n, real_lon_w = num2deg(xtile_min, ytile_min, z)
        real_lat_s, real_lon_e = num2deg(xtile_max + 1, ytile_max + 1, z)
        return stitched_img, (real_lon_w, real_lat_s, real_lon_e, real_lat_n)

    # Try requested zoom level first, fallback to lower zooms if 404
    for z in [zoom_level, zoom_level - 1, zoom_level - 2]:
        img, final_bounds = _try_fetch(z)
        if img is not None:
            return img, final_bounds
            
    return None, None


def get_osm_roads_overpass(bounds, w, h, thickness=4):
    """Gets OSM roads from local dataset first, then Overpass as fallback."""
    west, south, east, north = bounds

    cache_key = (
        round(float(west), 5),
        round(float(south), 5),
        round(float(east), 5),
        round(float(north), 5),
        int(w),
        int(h),
        int(thickness),
    )

    if cache_key in _roads_cache:
        return _roads_cache[cache_key].copy()

    if has_local_roads_dataset():
        local_mask = draw_local_road_mask(bounds, w, h, thickness=thickness)
        if local_mask is not None and np.any(local_mask):
            if len(_roads_cache) >= 24:
                _roads_cache.pop(next(iter(_roads_cache)))
            _roads_cache[cache_key] = local_mask.copy()
            return local_mask

    if os.environ.get("QUAKEMIND_OFFLINE_ONLY") == "1":
        _warn("Offline mode is enabled and no local roads were found for this area.")
        return np.zeros((h, w), dtype=np.uint8)

    servers = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass-api.de/api/interpreter?data=",
        "https://overpass.kumi.systems/api/interpreter",
        "https://lz4.overpass-api.de/api/interpreter",
        "https://overpass.private.coffee/api/interpreter",
    ]

    query = f'''
    [out:json][timeout:30];
    way["highway"]({south},{west},{north},{east});
    out geom;
    '''

    road_img = np.zeros((h, w), dtype=np.uint8)
    data = None

    session = requests.Session()
    headers = {"User-Agent": "QuakeMindRoadDamage/1.0"}

    # Bounded to ~1 attempt/server, short timeout: this runs inside a sync FastAPI
    # route handler, which occupies one of the (limited) thread-pool workers for
    # the entire call. The previous 5 servers x 2 attempts x 35s could block a
    # worker for up to ~350s, risking exhausting the pool under a few concurrent
    # requests and freezing the whole API for unrelated fast endpoints.
    for url in servers:
        try:
            if url.endswith("?data="):
                resp = session.get(url + requests.utils.quote(query), headers=headers, timeout=12)
            else:
                resp = session.post(url, data=query, headers=headers, timeout=12)
            if resp.status_code == 200:
                data = resp.json()
                break  # Success
        except Exception:
            pass
        time.sleep(0.35)

    if not data:
        _warn("All Overpass servers failed. Roads could not be fetched.")
        return road_img

    try:
        for element in data.get('elements', []):
            if 'geometry' in element:
                pts = []
                for pt in element['geometry']:
                    px = int((pt['lon'] - west) / (east - west) * w)
                    py = int((north - pt['lat']) / (north - south) * h)
                    pts.append([px, py])
                if len(pts) >= 2:
                    pts = np.array(pts, np.int32).reshape((-1, 1, 2))
                    cv2.polylines(road_img, [pts], False, 1, thickness=thickness)
    except Exception as e:
        _warn(f"OSM parse error: {e}")

    # Keep a small in-memory cache to survive transient Overpass outages.
    if len(_roads_cache) >= 24:
        _roads_cache.pop(next(iter(_roads_cache)))
    _roads_cache[cache_key] = road_img.copy()

    return road_img

def get_wayback_versions():
    """Fetch available Esri Wayback versions."""
    try:
        url = "https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer?f=json"
        data = requests.get(url, timeout=5).json()
        versions = []
        for item in data.get('Selection', []):
            name = item['Name']
            if "Wayback" in name:
                date_str = name.split("Wayback ")[-1].replace(")", "")
                versions.append({
                    "date": date_str, "id": item['M'], "label": f"{date_str}"
                })
        return versions
    except Exception:
        return []

def search_oam_images(bbox, date_start=None, date_end=None, limit=50):
    url = "https://api.openaerialmap.org/meta"
    params = {
        "bbox": f"{bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]}",
        "limit": limit,
        "order_by": "acquisition_end",
        "sort": "desc"
    }
    
    if date_start and date_end:
        if isinstance(date_start, str): params["acquisition_from"] = date_start
        else: params["acquisition_from"] = date_start.strftime("%Y-%m-%d")
        if isinstance(date_end, str): params["acquisition_to"] = date_end
        else: params["acquisition_to"] = date_end.strftime("%Y-%m-%d")

    try:
        resp = requests.get(url, params=params, timeout=10)
        data = resp.json()
        results = []
        if 'results' in data:
            for item in data['results']:
                tms_url = item.get('tms') or item.get('properties', {}).get('tms')
                if not tms_url:
                    tms_url = item.get('wmts') or item.get('properties', {}).get('wmts')
                
                if tms_url:
                    results.append({
                        "id": item.get('_id') or item.get('uuid'),
                        "title": item.get('title', 'Unknown Image'),
                        "provider": item.get('provider', 'Unknown'),
                        "date": item.get('acquisition_end', item.get('acquisition_start', 'Unknown Date')),
                        "tms_url": tms_url,
                        "bbox": item.get('bbox')
                    })
        return results
    except Exception as e:
        _error(f"OAM Search failed: {e}")
        return []
