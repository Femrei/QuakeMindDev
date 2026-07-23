import base64
import datetime
import hashlib
import importlib
import io
import json
import math
import os
import re
import site
import sys
import threading
import traceback
from contextlib import contextmanager
from pathlib import Path

import streamlit as st


BASE_DIR = Path(__file__).resolve().parent
APPS_DIR = BASE_DIR / "apps"
NLP_ROOT = APPS_DIR / "disaster_nlp"
ROAD_ROOT = APPS_DIR / "road_damage"
RISK_ROOT = APPS_DIR / "earthquake_risk"
CAMERA_ROOT = APPS_DIR / "camera_detection"
OPERATIONS_ROOT = APPS_DIR / "operations"

NLP_MODEL_DIR = NLP_ROOT / "models" / "2kveri"
RISK_CSV = RISK_ROOT / "data" / "query.csv"
ROAD_DEFAULT_MODEL = ROAD_ROOT / "models" / "optimized_mitb4_focal_dice30.pth"
SAFE_AREAS_PATH = OPERATIONS_ROOT / "safe_areas.json"
INCIDENTS_PATH = BASE_DIR / "runtime" / "operation_incidents.json"

TURKEY_PROVINCES = [
    "Adana", "Adiyaman", "Afyonkarahisar", "Agri", "Amasya", "Ankara", "Antalya",
    "Artvin", "Aydin", "Balikesir", "Bilecik", "Bingol", "Bitlis", "Bolu",
    "Burdur", "Bursa", "Canakkale", "Cankiri", "Corum", "Denizli", "Diyarbakir",
    "Edirne", "Elazig", "Erzincan", "Erzurum", "Eskisehir", "Gaziantep", "Giresun",
    "Gumushane", "Hakkari", "Hatay", "Isparta", "Mersin", "Istanbul", "Izmir",
    "Kars", "Kastamonu", "Kayseri", "Kirklareli", "Kirsehir", "Kocaeli", "Konya",
    "Kutahya", "Malatya", "Manisa", "Kahramanmaras", "Mardin", "Mugla", "Mus",
    "Nevsehir", "Nigde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop",
    "Sivas", "Tekirdag", "Tokat", "Trabzon", "Tunceli", "Sanliurfa", "Usak",
    "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman", "Kirikkale",
    "Batman", "Sirnak", "Bartin", "Ardahan", "Igdir", "Yalova", "Karabuk",
    "Kilis", "Osmaniye", "Duzce",
]

RISK_CITY_DEFAULT_COORDS = {
    "Hatay": (36.20, 36.16),
    "Kahramanmaras": (37.57, 36.93),
    "Gaziantep": (37.06, 37.38),
    "Malatya": (38.35, 38.30),
    "Adiyaman": (37.76, 38.27),
    "Istanbul": (41.0082, 28.9784),
    "Izmir": (38.4237, 27.1428),
    "Ankara": (39.9334, 32.8597),
    "Bursa": (40.1885, 29.0610),
    "Antalya": (36.8969, 30.7133),
}

ROAD_CITIES = {
    "Antakya (Hatay)": [36.20, 36.16],
    "Kahramanmaras": [37.57, 36.93],
    "Gaziantep": [37.06, 37.38],
    "Malatya": [38.35, 38.30],
    "Adiyaman": [37.76, 38.27],
}

DEFAULT_SAFE_AREAS = [
    {"name": "Antakya Stadyum Toplanma Alani", "city": "Hatay", "lat": 36.2104, "lon": 36.1572, "capacity": 8500, "status": "Musait"},
    {"name": "Hatay Fuar Alani", "city": "Hatay", "lat": 36.2321, "lon": 36.1728, "capacity": 6200, "status": "Musait"},
    {"name": "Kahramanmaras Stadyum Alani", "city": "Kahramanmaras", "lat": 37.5895, "lon": 36.9263, "capacity": 9000, "status": "Musait"},
    {"name": "Gaziantep Demokrasi Meydani", "city": "Gaziantep", "lat": 37.0662, "lon": 37.3833, "capacity": 5400, "status": "Musait"},
    {"name": "Malatya Millet Bahcesi", "city": "Malatya", "lat": 38.3558, "lon": 38.3194, "capacity": 7000, "status": "Kismi Dolu"},
    {"name": "Adiyaman Valilik Toplanma Alani", "city": "Adiyaman", "lat": 37.7645, "lon": 38.2786, "capacity": 4800, "status": "Musait"},
]

RESPONSE_UNITS = [
    "AFAD Arama Kurtarma",
    "112 Saglik Ekibi",
    "Belediye Lojistik",
    "Emniyet Trafik",
    "Gonullu Destek Ekibi",
]

NEED_PATTERNS = {
    "Arama Kurtarma": ["enkaz", "mahsur", "ses geliyor", "coktu", "yikildi", "gocuk"],
    "Saglik": ["yarali", "doktor", "ambulans", "kan", "ilac", "saglik", "hastane"],
    "Barinma": ["cadir", "battaniye", "isinma", "soba", "konteyner", "barinma"],
    "Gida ve Su": ["su", "yemek", "gida", "mama", "bebek mamasi", "ekmek"],
    "Lojistik/Ulasim": ["yol", "kopru", "ulasim", "kapali", "tir", "lojistik", "gecemiyor"],
    "Guvenlik": ["kalabalik", "panik", "guvenlik", "trafik", "tahliye"],
}

NEED_DEFAULT_UNITS = {
    "Arama Kurtarma": "AFAD Arama Kurtarma",
    "Saglik": "112 Saglik Ekibi",
    "Barinma": "Belediye Lojistik",
    "Gida ve Su": "Belediye Lojistik",
    "Lojistik/Ulasim": "Emniyet Trafik",
    "Guvenlik": "Emniyet Trafik",
}

NLP_SAMPLE_TEXTS = [
    "Hatay antakya cebrail mahallesi yıkıldı, enkaz altında kalanlar var lütfen yardım edin ses geliyor!",
    "Gaziantep nurdağı yolu kapalı tırlar geçemiyor, toprak kayması var.",
    "Kahramanmaraş merkezde 50 çadır ve bol miktarda bebek maması ihtiyacı çok acil.",
    "İskenderun liman çevresinde ağır hasarlı binalar var, ekipler ulaşmakta zorlanıyor.",
    "Malatya battalgazide apartman çöktü, içeride yaşlı bir çift mahsur kaldı.",
    "Adıyaman merkezde acil kan, su ve battaniye ihtiyacı var.",
    "Diyarbakır yolu üzerinde köprü girişinde çatlak var, araç geçişi riskli.",
    "Şanlıurfa akçakale tarafında lojistik araçlar kapalı yol nedeniyle ilerleyemiyor.",
]


def add_project_site_packages(project_root):
    for env_name in [".venv", "venv"]:
        env_path = project_root / env_name
        if not env_path.exists():
            continue
        for site_path in env_path.glob("lib/python*/site-packages"):
            site.addsitedir(str(site_path))


for project_root in [NLP_ROOT, ROAD_ROOT, RISK_ROOT, CAMERA_ROOT]:
    add_project_site_packages(project_root)


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


def distance_km(lat1, lon1, lat2, lon2):
    earth_radius_km = 6371.0
    lat1_rad, lon1_rad, lat2_rad, lon2_rad = map(
        math.radians, [lat1, lon1, lat2, lon2]
    )
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
    )
    return 2 * earth_radius_km * math.asin(math.sqrt(a))


def iter_geometry_lat_lon(geometry):
    if not geometry:
        return

    geometry_type = geometry.get("type")
    coordinates = geometry.get("coordinates", [])

    if geometry_type == "Point":
        if len(coordinates) >= 2:
            yield coordinates[1], coordinates[0]
        return

    if geometry_type == "LineString" or geometry_type == "MultiPoint":
        for coord in coordinates:
            if len(coord) >= 2:
                yield coord[1], coord[0]
        return

    if geometry_type == "MultiLineString" or geometry_type == "Polygon":
        for segment in coordinates:
            for coord in segment:
                if len(coord) >= 2:
                    yield coord[1], coord[0]
        return

    if geometry_type == "MultiPolygon":
        for polygon in coordinates:
            for ring in polygon:
                for coord in ring:
                    if len(coord) >= 2:
                        yield coord[1], coord[0]


def geometry_is_near_point(geometry, center_lat, center_lon, radius_km):
    coords = list(iter_geometry_lat_lon(geometry))
    if not coords:
        return False

    lat_margin = radius_km / 111.0
    lon_margin = radius_km / max(20.0, 111.0 * math.cos(math.radians(center_lat)))
    min_lat, max_lat = center_lat - lat_margin, center_lat + lat_margin
    min_lon, max_lon = center_lon - lon_margin, center_lon + lon_margin

    candidate_points = [
        (lat, lon)
        for lat, lon in coords
        if min_lat <= lat <= max_lat and min_lon <= lon <= max_lon
    ]
    if not candidate_points:
        return False

    stride = max(1, len(candidate_points) // 60)
    for lat, lon in candidate_points[::stride]:
        if distance_km(center_lat, center_lon, lat, lon) <= radius_km:
            return True
    return False


@st.cache_data(show_spinner=False)
def load_geojson_file(path_str):
    with open(path_str, "r", encoding="utf-8") as handle:
        return json.load(handle)


@st.cache_data(show_spinner=False)
def get_filtered_fault_geojson(path_str, center_lat, center_lon, radius_km=180.0):
    geojson_data = load_geojson_file(path_str)
    filtered_features = []

    for feature in geojson_data.get("features", []):
        if geometry_is_near_point(
            feature.get("geometry"),
            center_lat=center_lat,
            center_lon=center_lon,
            radius_km=radius_km,
        ):
            filtered_features.append(feature)

    return {
        "type": "FeatureCollection",
        "features": filtered_features,
    }


def loading_screen_css():
    st.markdown(
        """
        <style>
        .stApp {
            background: linear-gradient(180deg, #08101a 0%, #0d1724 100%);
        }
        .boot-wrap {
            max-width: 760px;
            margin: 8rem auto 2rem auto;
            padding: 2rem 2.2rem;
            border-radius: 24px;
            background: rgba(9, 18, 29, 0.94);
            border: 1px solid rgba(108, 229, 255, 0.14);
            box-shadow: 0 24px 70px rgba(2, 6, 23, 0.45);
            text-align: center;
        }
        .boot-title {
            color: #f4fbff;
            font-size: 2.1rem;
            font-weight: 800;
            margin-bottom: 0.4rem;
        }
        .boot-copy {
            color: #aebfd1;
            line-height: 1.6;
            margin-bottom: 1rem;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


def render_boot_screen():
    loading_screen_css()
    st.markdown(
        """
        <div class="boot-wrap">
            <div class="boot-title">QuakeMind yukleniyor</div>
            <div class="boot-copy">
                Tum modeller, yardimci kutuphaneler ve veri motorlari ilk acilista hazirlaniyor.
                Islem tamamlaninca ana arayuz otomatik olarak acilacak.
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


@st.cache_resource
def load_nlp_pipeline():
    clear_module_cache(["src"])
    with temporary_sys_path(NLP_ROOT), temporary_cwd(NLP_ROOT):
        from src.pipeline import DisasterPipeline

        return DisasterPipeline()


@st.cache_resource
def load_road_runtime():
    clear_module_cache(["utils"])
    with temporary_sys_path(ROAD_ROOT), temporary_cwd(ROAD_ROOT):
        from utils.fetcher import fetch_satellite_area, get_osm_roads_overpass, get_wayback_versions, search_oam_images
        from utils.inference import load_simple_model, run_inference
        from utils.network import analyze_road_network_graph

        return {
            "fetch_satellite_area": fetch_satellite_area,
            "get_osm_roads_overpass": get_osm_roads_overpass,
            "get_wayback_versions": get_wayback_versions,
            "search_oam_images": search_oam_images,
            "load_simple_model": load_simple_model,
            "run_inference": run_inference,
            "analyze_road_network_graph": analyze_road_network_graph,
        }


@st.cache_resource
def load_road_model(model_path):
    runtime = load_road_runtime()
    with temporary_cwd(ROAD_ROOT):
        model, device = runtime["load_simple_model"](model_path)
    return model, device


@st.cache_resource
def load_risk_bundle():
    clear_module_cache(["risk_engine"])
    with temporary_sys_path(RISK_ROOT), temporary_cwd(RISK_ROOT):
        risk_module = importlib.import_module("risk_engine")
        engine = risk_module.EarthquakeRiskEngine(csv_path=str(RISK_CSV.resolve()))
        return engine, risk_module


def boot_resources():
    if st.session_state.get("boot_complete"):
        return

    render_boot_screen()
    progress = st.progress(0)
    status = st.empty()
    errors = {}
    steps = [
        ("Disaster NLP modeli yukleniyor", load_nlp_pipeline),
        ("RoadDamage kutuphaneleri hazirlaniyor", load_road_runtime),
        ("RoadDamage modeli yukleniyor", lambda: load_road_model(str(ROAD_DEFAULT_MODEL.resolve()))),
        ("Deprem risk motoru yukleniyor", load_risk_bundle),
    ]

    total = len(steps)
    for index, (label, action) in enumerate(steps, start=1):
        status.info(label)
        try:
            action()
        except Exception:
            errors[label] = traceback.format_exc()
        progress.progress(index / total)

    st.session_state.boot_complete = True
    st.session_state.boot_errors = errors
    st.rerun()


def show_boot_errors():
    errors = st.session_state.get("boot_errors", {})
    if not errors:
        return
    with st.expander("Yukleme sirasinda yakalanan hatalar", expanded=False):
        for label, trace in errors.items():
            st.error(label)
            st.code(trace)


def get_b64_image(image_arr):
    from PIL import Image

    img = Image.fromarray(image_arr)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode()


def read_json_file(path, fallback):
    try:
        if not path.exists():
            return fallback
        with open(path, "r", encoding="utf-8") as handle:
            return json.load(handle)
    except Exception:
        return fallback


def write_json_file(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)


@st.cache_data(show_spinner=False)
def load_safe_areas():
    areas = read_json_file(SAFE_AREAS_PATH, DEFAULT_SAFE_AREAS)
    return areas if isinstance(areas, list) and areas else DEFAULT_SAFE_AREAS


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


def get_urgency_color(level):
    if level >= 5:
        return "darkred"
    if level == 4:
        return "red"
    if level == 3:
        return "orange"
    if level == 2:
        return "blue"
    return "green"


def save_incident_records():
    records = st.session_state.get("incident_records", [])
    write_json_file(INCIDENTS_PATH, records)


def ensure_operations_state():
    if "incident_records" not in st.session_state:
        stored_records = read_json_file(INCIDENTS_PATH, [])
        st.session_state.incident_records = stored_records if isinstance(stored_records, list) else []
    if "operations_selected_category" not in st.session_state:
        st.session_state.operations_selected_category = "Tum Vakalar"
    for record in st.session_state.incident_records:
        if "harita_merkezi" not in record:
            quality = assess_location_quality(record.get("tweet", ""), record)
            record["konum_tipi"] = quality["konum_tipi"]
            record["konum_guveni"] = quality["konum_guveni"]
            record["etki_yaricapi_km"] = quality["etki_yaricapi_km"]
            record["harita_merkezi"] = quality["harita_merkezi"]
        if "ihtiyaclar" not in record:
            record["ihtiyaclar"] = extract_need_items(record.get("tweet", ""), record)


def normalize_text_for_match(text):
    replacements = {
        "ı": "i",
        "İ": "i",
        "ğ": "g",
        "Ğ": "g",
        "ü": "u",
        "Ü": "u",
        "ş": "s",
        "Ş": "s",
        "ö": "o",
        "Ö": "o",
        "ç": "c",
        "Ç": "c",
    }
    normalized = str(text).lower()
    for source, target in replacements.items():
        normalized = normalized.replace(source, target)
    return normalized


def infer_city_context(text):
    normalized = normalize_text_for_match(text)
    for city, coords in RISK_CITY_DEFAULT_COORDS.items():
        if normalize_text_for_match(city) in normalized:
            return city, coords
    for label, coords in ROAD_CITIES.items():
        city_name = label.split("(")[0].strip()
        if normalize_text_for_match(city_name) in normalized or normalize_text_for_match(label) in normalized:
            return label, tuple(coords)
    return None, None


def assess_location_quality(raw_text, result):
    coords = result.get("konum")
    location_text = result.get("konum_metin") or ""
    candidates = result.get("konum_adaylari") or []
    combined_text = normalize_text_for_match(" ".join([raw_text, location_text, " ".join(candidates)]))
    precise_hints = [
        "mahalle", "mahallesi", "sokak", "cadde", "caddesi", "bulvar", "apartman",
        "apt", "site", "blok", "no", "hastane", "okul", "universite", "meydan",
    ]

    if coords:
        if any(hint in combined_text for hint in precise_hints):
            return {
                "konum_tipi": "Net konum",
                "konum_guveni": "Yuksek",
                "etki_yaricapi_km": 0.25,
                "harita_merkezi": coords,
            }
        return {
            "konum_tipi": "Tahmini alan",
            "konum_guveni": "Orta",
            "etki_yaricapi_km": 5.0,
            "harita_merkezi": coords,
        }

    city_name, city_coords = infer_city_context(raw_text)
    if city_coords:
        return {
            "konum_tipi": f"Konum tahmini (İl/İlçe: {city_name})",
            "konum_guveni": "Düşük (Merkez Odaklı)",
            "etki_yaricapi_km": 2.0,
            "harita_merkezi": city_coords,
        }

    return {
        "konum_tipi": "Konum yok",
        "konum_guveni": "Yok",
        "etki_yaricapi_km": None,
        "harita_merkezi": None,
    }


def extract_need_items(raw_text, result):
    normalized = normalize_text_for_match(raw_text)
    category = result.get("kategori", "")
    urgency = int(result.get("aciliyet") or 1)
    needs = []

    for need_name, patterns in NEED_PATTERNS.items():
        matched_terms = [pattern for pattern in patterns if normalize_text_for_match(pattern) in normalized]
        if matched_terms:
            needs.append({
                "ihtiyac": need_name,
                "kanit": ", ".join(matched_terms[:3]),
                "adet": extract_quantity_hint(normalized, matched_terms[0]),
                "oncelik": get_urgency_label(urgency),
                "atanan_birim": NEED_DEFAULT_UNITS.get(need_name, "Atanmadi"),
                "durum": "Bekliyor",
            })

    if not needs and category and category != "Bilinmiyor":
        fallback_need = "Genel Destek"
        if "Enkaz" in category:
            fallback_need = "Arama Kurtarma"
        elif "Yard" in category:
            fallback_need = "Gida ve Su"
        elif "Lojistik" in category or "Yol" in category:
            fallback_need = "Lojistik/Ulasim"
        needs.append({
            "ihtiyac": fallback_need,
            "kanit": category,
            "adet": "Belirsiz",
            "oncelik": get_urgency_label(urgency),
            "atanan_birim": NEED_DEFAULT_UNITS.get(fallback_need, "Atanmadi"),
            "durum": "Bekliyor",
        })

    return needs


def extract_quantity_hint(normalized_text, matched_term):
    pattern = rf"(\d+)\s+\w*\s*{re.escape(normalize_text_for_match(matched_term))}"
    match = re.search(pattern, normalized_text)
    if match:
        return match.group(1)
    if any(word in normalized_text for word in ["cok acil", "acil", "fazla", "bol miktar"]):
        return "Acil/Belirsiz"
    return "Belirsiz"


def make_incident_record(raw_text, result):
    seed = f"{raw_text}|{result.get('kategori')}|{result.get('konum')}|{datetime.datetime.utcnow().isoformat()}"
    incident_id = hashlib.sha1(seed.encode("utf-8")).hexdigest()[:10].upper()
    urgency = int(result.get("aciliyet") or 1)
    coords = result.get("konum")
    location_quality = assess_location_quality(raw_text, result)
    city_name, _ = infer_city_context(raw_text)
    nearest_safe = find_nearest_safe_areas(location_quality["harita_merkezi"], limit=1, city_filter=city_name)
    return {
        "id": incident_id,
        "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
        "tweet": raw_text,
        "kategori": result.get("kategori", "Bilinmiyor"),
        "aciliyet": urgency,
        "aciliyet_etiketi": get_urgency_label(urgency),
        "guven_skoru": result.get("guven_skoru", 0.0),
        "konum": coords,
        "konum_metin": result.get("konum_metin"),
        "konum_adaylari": result.get("konum_adaylari") or [],
        "konum_tipi": location_quality["konum_tipi"],
        "konum_guveni": location_quality["konum_guveni"],
        "etki_yaricapi_km": location_quality["etki_yaricapi_km"],
        "harita_merkezi": location_quality["harita_merkezi"],
        "sehir_baglami": city_name,
        "ihtiyaclar": extract_need_items(raw_text, result),
        "durum": "Yeni",
        "atanan_ekip": RESPONSE_UNITS[0] if urgency >= 5 else "Atanmadi",
        "yonlendirme": nearest_safe[0]["name"] if nearest_safe else "",
        "not": "",
    }


def add_incident_record(raw_text, result):
    ensure_operations_state()
    record = make_incident_record(raw_text, result)
    st.session_state.incident_records.insert(0, record)
    save_incident_records()
    return record


def find_nearest_safe_areas(coords, limit=3, city_filter=None):
    if not coords:
        return []

    lat, lon = coords
    ranked = []
    for area in load_safe_areas():
        if city_filter and area.get("city"):
            if normalize_text_for_match(area["city"]) not in normalize_text_for_match(city_filter) and normalize_text_for_match(city_filter) not in normalize_text_for_match(area["city"]):
                continue

        area_lat = area.get("lat")
        area_lon = area.get("lon")
        
        if "geometry" in area:
            geom = area["geometry"]
            if geom["type"] == "Point":
                area_lon, area_lat = geom["coordinates"]
            elif geom["type"] in ["Polygon", "Rectangle", "LineString"]:
                coords_list = geom["coordinates"][0] if geom["type"] in ["Polygon", "Rectangle"] else geom["coordinates"]
                if len(coords_list) > 0:
                    area_lon = sum(c[0] for c in coords_list) / len(coords_list)
                    area_lat = sum(c[1] for c in coords_list) / len(coords_list)

        if area_lat is None or area_lon is None:
            continue

        distance = distance_km(lat, lon, area_lat, area_lon)
        ranked.append({**area, "distance_km": distance})
    return sorted(ranked, key=lambda item: item["distance_km"])[:limit]


def get_incident_categories(records):
    categories = sorted({record["kategori"] for record in records})
    return ["Tum Vakalar"] + categories


