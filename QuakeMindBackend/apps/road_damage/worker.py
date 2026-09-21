"""ProcessPoolExecutor entrypoint for road-damage analysis.

This module must never import fastapi_app.py. On Windows, spawning a pool
worker re-imports whatever module the worker's own top-level code lives in,
so keeping this import graph limited to the road-damage utils (never the
main app, with its eager NLP/risk/YOLO loads) is what keeps a pool worker
process from redundantly reloading unrelated heavy models.

The model itself is loaded once per worker process via `_init_worker`
(the pool's `initializer`), not on every submitted job -- `run_analysis_job`
reuses the worker-local `_worker_model`/`_worker_device` set up there.
"""
import math
import os
import time
import uuid
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError

import cv2
import numpy as np

from apps.road_damage.utils.assembly import bbox_from_center
from apps.road_damage.utils.fetcher import (
    fetch_satellite_area,
    get_osm_roads_overpass,
    get_wayback_versions,
    search_oam_images,
)
from apps.road_damage.utils.imaging import (
    build_damage_overlay,
    build_segmentation_overlay,
    image_array_to_b64,
)
from apps.road_damage.utils.inference import run_inference
from apps.road_damage.utils import model_kunyesi
from apps.road_damage.utils.network import analyze_road_network_graph, edge_closure_probability
from apps.road_damage.utils.serialization import serialize_segments
from apps.road_damage.utils import wayback
from apps.road_damage.utils.tiling import zoom_for_radius

_worker_model = None
_worker_device = None
# Etkin modelin kunyesi (J-36): mimari, agirlik izi, karar ayarlari.
_worker_kunye = None
_progress_queue = None


def _init_worker(kunye: dict, progress_queue=None) -> None:
    """Pool initializer -- runs once per worker process, not per task.

    `kunye` is the active satellite model's card (modeller/uydu/<ad>.json,
    see utils/model_kunyesi.py): the architecture is built from it and the
    weights are loaded only if their SHA-256 matches (J-36).

    `progress_queue` is a plain multiprocessing.Queue handed down through the
    pool's initargs (the only path multiprocessing allows a Queue to cross a
    process boundary). The worker only ever puts on it; a drain thread in the
    main process turns those messages into job-store progress updates.
    """
    global _worker_model, _worker_device, _progress_queue, _worker_kunye
    _progress_queue = progress_queue
    if kunye is None:
        raise RuntimeError("Uydu modeli kunyesi yok (modeller/uydu/, QM_UYDU_MODELI).")
    _worker_kunye = kunye
    _worker_model, _worker_device = model_kunyesi.model_yukle(kunye)


def _warm_up():
    """Trivial task whose only job is to force the pool to actually spawn its
    worker process (and so run `_init_worker`) at server startup rather than
    on the first real user request. Deliberately does not touch worker state.
    """
    return os.getpid()


def _report(analysis_id, percent, message):
    """Best-effort progress ping to the main process. Never raises -- a
    failed progress report must not take down the analysis itself.
    """
    if _progress_queue is None:
        return
    try:
        _progress_queue.put_nowait({
            "analysisId": analysis_id,
            "percent": max(0, min(100, int(percent))),
            "message": message,
        })
    except Exception:
        pass


def run_analysis_job(req: dict) -> dict:
    """Reimplements the former `_analyze_road_damage_impl` body, running
    inside a dedicated pool worker process instead of the main API process.

    `req` is a plain dict (the pydantic RoadDamageRequest's fields, via
    `.model_dump()`) plus an injected `_analysisId` key set by the caller
    before submission, so the id assigned when the job was queued matches
    the one embedded in this result.

    Returns the same JSON-able shape the old synchronous endpoint returned,
    plus three extra keys the caller must pop before this reaches any HTTP
    client -- they're only there so the main process can repopulate its
    `road_damage_sessions` store for `/api/road_damage/route`:
      roadGraph       the full networkx graph (closed edges included), or None
      closedEdgeKeys  edges the closure rule removed; /route hides them with
                      a view, which gives the same A* routes as the old
                      edge-removed copy (J-34: 1650/1650 identical)
      closureProb     {edge: p} for edges with p > 0, for the soft-cost flag
    """
    if _worker_model is None:
        raise RuntimeError("Road Damage worker henuz hazir degil (model yuklenmedi).")

    model = _worker_model
    device = _worker_device

    analysis_id = req.get("_analysisId") or str(uuid.uuid4())
    city = req["city"]
    latitude = req["latitude"]
    longitude = req["longitude"]
    radius_km = req.get("radiusKm", 2.5)
    # Karar ayarlari istekte yoksa modelin kunyesinden gelir (J-36): model
    # hangi esikle olculduyse urunde de o esikle kosar. Bugunku modelin
    # kunyesi eski varsayilanlari (3,5 / 0,40 / 2) tasir, davranis degismez.
    kunye = _worker_kunye
    karar = kunye["karar"]
    damage_booster = req.get("damageBooster")
    if damage_booster is None:
        damage_booster = karar["guclendirme"]
    threshold = req.get("threshold")
    if threshold is None:
        threshold = karar["esik"]
    use_imagenet_norm = req.get("useImagenetNorm")
    if use_imagenet_norm is None:
        use_imagenet_norm = kunye["girdi"]["normalizasyon"] == "imagenet"
    post_process_level = req.get("postProcessLevel")
    if post_process_level is None:
        post_process_level = karar["sonIsleme"]
    network_type = req.get("networkType") or "drive"
    # r_h -- sert kapatma yaricapi (bkz. network.analyze_road_network_graph).
    # Varsayilan 0 = uygulamanin her zamanki kurali (hasar yol maskesinin
    # ustunde). Yaricap kurali yalnizca acikca istenirse (bkz. J-26).
    blockage_radius_m = float(req.get("blockageRadiusM", 0.0))

    started_at = time.perf_counter()
    t0 = started_at

    _report(analysis_id, 2, "Analiz hazirlaniyor...")

    bbox = None
    if all(
        req.get(k) is not None
        for k in ("bboxWest", "bboxSouth", "bboxEast", "bboxNorth")
    ):
        bbox = (req["bboxWest"], req["bboxSouth"], req["bboxEast"], req["bboxNorth"])
    else:
        # No explicit bbox (the common case for the mobile app): derive a
        # real-world-sized area from radiusKm instead of letting
        # fetch_satellite_area silently fall back to a tiny tile patch.
        bbox = bbox_from_center(latitude, longitude, max(0.5, radius_km))

    source_text = (req.get("source") or "").lower()
    prov_code = "google"
    wayback_id = None
    custom_url = None
    source_note = "Google uydu katmani kullanildi."
    satellite_tile_url = "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
    satellite_attribution = "Google"
    source_label = "Google Maps (Latest / High Res)"

    if "esri" in source_text or "wayback" in source_text:
        if req.get("waybackId"):
            prov_code = "esri"
            wayback_id = req["waybackId"]
            source_note = f"Esri Wayback secildi (id={wayback_id})."
            satellite_tile_url = f"https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{wayback_id}/{{z}}/{{y}}/{{x}}"
            satellite_attribution = "Esri"
            source_label = "Esri Wayback (Historical)"
        else:
            versions = get_wayback_versions()
            if versions:
                prov_code = "esri"
                wayback_id = versions[0].get("id")
                source_note = f"Esri Wayback secildi (id={wayback_id})."
                satellite_tile_url = f"https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{wayback_id}/{{z}}/{{y}}/{{x}}"
                satellite_attribution = "Esri"
                source_label = "Esri Wayback (Historical)"
            else:
                source_note = "Esri Wayback surumu bulunamadi, Google'a geri donuldu."
    elif "oam" in source_text or "openaerial" in source_text:
        if req.get("oamTileUrl"):
            prov_code = "custom"
            custom_url = req["oamTileUrl"]
            source_note = "OpenAerialMap (secilen goruntu) kullanildi."
            satellite_tile_url = req["oamTileUrl"]
            satellite_attribution = "OpenAerialMap"
            source_label = "OpenAerialMap (Event Specific)"
        else:
            oam_bbox = bbox if bbox is not None else (
                longitude - 0.03,
                latitude - 0.03,
                longitude + 0.03,
                latitude + 0.03,
            )
            oam_images = search_oam_images(oam_bbox, limit=25)
            if oam_images:
                preferred_title = (req.get("oamPreferredTitle") or "").strip().lower()
                selected_oam = None

                def _bbox_center(item):
                    raw_bbox = item.get("bbox")
                    if not isinstance(raw_bbox, (list, tuple)) or len(raw_bbox) < 4:
                        return None
                    try:
                        west = float(raw_bbox[0])
                        south = float(raw_bbox[1])
                        east = float(raw_bbox[2])
                        north = float(raw_bbox[3])
                        return ((south + north) / 2.0, (west + east) / 2.0)
                    except Exception:
                        return None

                def _pick_closest(items):
                    if not items:
                        return None
                    with_center = []
                    for item in items:
                        center = _bbox_center(item)
                        if center is None:
                            continue
                        dlat = center[0] - latitude
                        dlon = center[1] - longitude
                        with_center.append((dlat * dlat + dlon * dlon, item))
                    if with_center:
                        with_center.sort(key=lambda x: x[0])
                        return with_center[0][1]
                    return items[0]

                if preferred_title:
                    preferred_matches = [
                        item
                        for item in oam_images
                        if preferred_title in (item.get("title", "").lower())
                    ]
                    selected_oam = _pick_closest(preferred_matches)

                # Known stable Antakya sample used in Streamlit UI.
                if selected_oam is None:
                    known_matches = [
                        item
                        for item in oam_images
                        if "2023-02-09" in item.get("title", "")
                        and "help.ngo" in item.get("title", "").lower()
                    ]
                    selected_oam = _pick_closest(known_matches)

                if selected_oam is None:
                    selected_oam = _pick_closest(oam_images)

                tms_url = (selected_oam.get("tms_url") or "").strip()
                oam_result_bbox = selected_oam.get("bbox")
                if (
                    isinstance(oam_result_bbox, (list, tuple))
                    and len(oam_result_bbox) >= 4
                ):
                    try:
                        bbox = (
                            float(oam_result_bbox[0]),
                            float(oam_result_bbox[1]),
                            float(oam_result_bbox[2]),
                            float(oam_result_bbox[3]),
                        )
                    except Exception:
                        pass

                if "{x}" in tms_url and "{y}" in tms_url:
                    prov_code = "custom"
                    custom_url = tms_url
                    source_note = f"OpenAerialMap secildi: {selected_oam.get('title', 'isimsiz goruntu')}"
                    satellite_tile_url = tms_url
                    satellite_attribution = "OpenAerialMap"
                    source_label = "OpenAerialMap (Event Specific)"
                else:
                    source_note = "OpenAerialMap tms URL formati uyumsuz, Google'a geri donuldu."
            else:
                source_note = "OpenAerialMap kaydi bulunamadi, Google'a geri donuldu."

    _report(analysis_id, 5, "Uydu goruntusu indiriliyor...")
    img, bounds = fetch_satellite_area(
        lat=latitude,
        lon=longitude,
        bbox=bbox,
        zoom_level=zoom_for_radius(radius_km),
        wayback_id=wayback_id,
        provider=prov_code,
        custom_url=custom_url,
    )
    satellite_fetch_ms = (time.perf_counter() - t0) * 1000.0
    t1 = time.perf_counter()

    if img is None:
        raise ValueError("Uydu goruntusu indirilemedi. Farkli bir kaynak veya konum deneyin.")

    _report(analysis_id, 20, "OSM yol agi cikariliyor...")
    w, h = img.size

    # Kunye: goruntu gercekte hangi yakinlastirmada ve ne zaman cekildi (J-35).
    # fetch_satellite_area istenen yakinlastirmada karo bulamazsa bir-iki alt
    # yakinlastirmaya iner; kullanilan yakinlastirma goruntu genisliginden geri
    # hesaplanir. Wayback surum tarihi cekim tarihi degildir: cekimler istenen
    # surumun metadata katmanindan okunur.
    requested_zoom = zoom_for_radius(radius_km)
    used_zoom = int(round(math.log2(360.0 * (w / 256.0) / (bounds[2] - bounds[0]))))
    imagery_notes = []
    if used_zoom != requested_zoom:
        imagery_notes.append(f"Istenen z{requested_zoom}'de karo yok, z{used_zoom} kullanildi")
    imagery_captures = []
    if prov_code == "esri" and wayback_id:
        try:
            imagery_captures = wayback.alan_cekimleri(str(wayback_id), bounds, used_zoom)
        except Exception as e:
            imagery_notes.append(f"Goruntu cekim tarihi okunamadi: {e}")
    imagery_event_timing = (
        wayback.olay_iliskisi([c["cekimTarihi"] for c in imagery_captures])
        if imagery_captures else "unknown"
    )
    # Modelin egitim cozunurluguyle kiyas (J-20): kaba goruntude tespit guvenilmez.
    used_gsd_m = 156543.03392 * math.cos(math.radians((bounds[1] + bounds[3]) / 2.0)) / 2 ** used_zoom
    model_summary = {
        **model_kunyesi.ozet(kunye),
        "kullanilanGsdM": round(used_gsd_m, 3),
        "gsdUyarisi": model_kunyesi.gsd_uyarisi(kunye, used_gsd_m),
    }
    imagery_notes.append(
        f"Model: {kunye['ad']} ({kunye['agirlik']['sha256'][:12]}), esik {threshold}, "
        f"guclendirme {damage_booster}, son isleme {post_process_level}"
    )
    if model_summary["gsdUyarisi"]:
        gsd = kunye["girdi"]["egitimGsdM"]
        imagery_notes.append(
            f"Uyari: goruntu {used_gsd_m:.2f} m/piksel, model {gsd[0]}-{gsd[1]} m/piksel ile egitildi (J-20)"
        )
    if imagery_captures:
        tarihler = ", ".join(sorted({c["cekimTarihi"] or "?" for c in imagery_captures}))
        iliski = {"pre": "deprem oncesi", "post": "deprem sonrasi", "mixed": "karisik",
                  "unknown": "bilinmiyor"}[imagery_event_timing]
        imagery_notes.append(f"Goruntu cekim tarihi: {tarihler} ({iliski})")
    line_width = 6
    road_mask = get_osm_roads_overpass(bounds, w, h, thickness=line_width)
    road_mask_binary = (road_mask > 0).astype(np.uint8)
    overpass_ms = (time.perf_counter() - t1) * 1000.0
    t2 = time.perf_counter()

    # Inference dominates the runtime (measured: ~267s of a ~296s job), so it
    # gets the widest slice of the progress bar and is the only stage able to
    # report sub-stage progress -- patch by patch.
    _report(analysis_id, 25, "Segformer AI modeli calisiyor...")
    _last_inference_pct = [25]

    def _on_inference_patch(done, total):
        pct = 25 + int(65 * done / max(1, total))
        if pct > _last_inference_pct[0]:
            _last_inference_pct[0] = pct
            _report(analysis_id, pct, f"Segformer AI modeli calisiyor ({done}/{total} parca)")

    raw_probs, boosted_probs, pred_mask_binary, intersection, img_np = run_inference(
        img, road_mask_binary, model, device,
        damage_booster, threshold,
        use_imagenet_norm, post_process_level,
        progress_callback=_on_inference_patch,
    )
    inference_ms = (time.perf_counter() - t2) * 1000.0
    t3 = time.perf_counter()

    total_pixels = pred_mask_binary.size
    damage_pixels = int(np.sum(pred_mask_binary))
    damage_rate = damage_pixels / total_pixels if total_pixels > 0 else 0

    road_pixels = int(np.sum(road_mask_binary))
    blocked_pixels = int(np.sum(intersection))
    open_road_pixels = road_pixels - blocked_pixels

    blocked_road_pct = blocked_pixels / road_pixels if road_pixels > 0 else 0
    open_road_pct = 1.0 - blocked_road_pct

    # Best-effort: persist damage blob centroids as damage_points so the
    # heatmap and risk-weighted route engine have real, queryable data --
    # never lets a PostGIS hiccup fail the whole analysis.
    try:
        from utils.postgis_manager import postgis_engine

        west, south, east, north = bounds
        num_labels, cc_labels, stats, centroids = cv2.connectedComponentsWithStats(
            pred_mask_binary, connectivity=8,
        )
        # Label 0 is background; keep only blobs above noise-floor area,
        # largest first, capped so a very noisy mask can't flood the DB.
        blob_ids = [
            lbl for lbl in range(1, num_labels)
            if stats[lbl, cv2.CC_STAT_AREA] >= 20
        ]
        blob_ids.sort(key=lambda lbl: stats[lbl, cv2.CC_STAT_AREA], reverse=True)
        for lbl in blob_ids[:300]:
            cx, cy = centroids[lbl]
            lon = west + (cx / w) * (east - west)
            lat = north - (cy / h) * (north - south)
            component_mask = cc_labels == lbl
            severity = float(boosted_probs[component_mask].mean()) if component_mask.any() else float(threshold)
            postgis_engine.insert_damage_point(
                "road_damage", lat, lon, severity=severity,
                label="Segformer Yol Hasari Tespiti",
            )
    except Exception as e:
        print(f"damage_points insert (road_damage) hatasi: {e}")

    log_lines = [
        "1/4 Uydu goruntusu indirildi",
        source_note,
        *imagery_notes,
        f"2/4 OSM yol agi cikarildi ({road_pixels} piksel)",
        "3/4 Segformer modeli ile inference tamamlandi",
        f"4/4 Analiz tamamlandi - hasar orani: %{damage_rate * 100:.1f}",
    ]

    _report(analysis_id, 90, "Lojistik / rota analizi yapiliyor...")
    safe_count = 0
    blocked_count = 0
    safe_segments = []
    blocked_segments = []
    road_graph = None
    closed_edge_keys = None
    closure_prob = None
    try:
        # analyze_road_network_graph makes its own osmnx/Overpass fetch,
        # separate from (and slower than) the raster road mask above --
        # bound it and skip logistics on timeout rather than risk the
        # whole job. Now that the whole analysis already runs in its own
        # disposable worker process, an abandoned logistics thread here is
        # harmless (unlike when this ran inline in the main API process).
        logistics_executor = ThreadPoolExecutor(max_workers=1)
        try:
            # Yaricap kurali acikken TUM hasar maskesi (pred_mask_binary)
            # gonderilir: yandaki binadan sokaga dokulen moloz da yolu
            # kapatir. `intersection` (yalniz yol rasterinin USTUNDEKI hasar)
            # buna izin vermiyordu -- olculdu: %1,26 hasarli goruntude
            # kapali yol SIFIR. Yaricap 0 ise eski davranis aynen korunur.
            closure_mask = pred_mask_binary if blockage_radius_m > 0 else intersection
            future = logistics_executor.submit(
                analyze_road_network_graph,
                bounds, w, h, closure_mask, network_type, blockage_radius_m,
            )
            G, safe_G, safe_edges, blocked_edges = future.result(timeout=45)
        finally:
            logistics_executor.shutdown(wait=False, cancel_futures=True)
        if G is not None:
            safe_count = len(safe_edges) if safe_edges else 0
            blocked_count = len(blocked_edges) if blocked_edges else 0
            safe_segments = serialize_segments(safe_edges)
            blocked_segments = serialize_segments(blocked_edges)
            log_lines.append(f"Lojistik: {safe_count} acik, {blocked_count} kapali sokak")
            road_graph = G
            closed_edge_keys = set(G.edges(keys=True)) - set(safe_G.edges(keys=True))
            # Yumusak maliyet bayragi (J-34) icin kenar basina kapanma
            # olasiligi. Deneydeki tanimla ayni: GENISLETILMEMIS model maskesi
            # (pred_mask_binary), yaricap kuralindan bagimsiz. Sert kurali ve
            # bu sonucun hicbir alanini degistirmez; hesaplanamazsa yalniz
            # yumusak rota bu analizde kullanilamaz.
            try:
                t_p = time.perf_counter()
                probs, _unobserved = edge_closure_probability(G, bounds, pred_mask_binary)
                closure_prob = {e: p for e, p in probs.items() if p > 0}
                log_lines.append(
                    f"Kapanma olasiligi: {len(closure_prob)} kenarda p > 0 "
                    f"({time.perf_counter() - t_p:.1f} sn)"
                )
            except Exception:
                log_lines.append("Kapanma olasiligi hesaplanamadi -- yumusak maliyetli rota bu analizde yok")
    except FutureTimeoutError:
        log_lines.append("Lojistik analiz opsiyonel - OSMnx zaman asimina ugradi")
    except Exception:
        log_lines.append("Lojistik analiz opsiyonel - OSMnx mevcut degil veya hata olustu")
    logistics_ms = (time.perf_counter() - t3) * 1000.0
    total_ms = (time.perf_counter() - started_at) * 1000.0
    log_lines.append(
        f"Sureler (sn): uydu={satellite_fetch_ms / 1000:.1f}, yol={overpass_ms / 1000:.1f}, AI={inference_ms / 1000:.1f}, lojistik={logistics_ms / 1000:.1f}, toplam={total_ms / 1000:.1f}"
    )

    recommended = "Analiz basarili."
    if blocked_road_pct > 0.5:
        recommended = "Kritik: Yollarin buyuk kismi kapali. Alternatif rotalar planlanmali."
    elif blocked_road_pct > 0.2:
        recommended = "Dikkat: Bazi yollar kapali. Ekipler icin alternatif guzergah onerilir."
    elif damage_rate > 0.3:
        recommended = "Yuksek hasar orani. Bolgeye dikkatli erisim saglanmali."
    else:
        recommended = "Bolge genel olarak erisilebilir durumda."

    _report(analysis_id, 97, "Sonuc gorselleri hazirlaniyor...")
    try:
        damage_overlay = build_damage_overlay(img_np, road_mask_binary, pred_mask_binary, intersection)
        segmentation_overlay = build_segmentation_overlay(img_np, pred_mask_binary)
        diagnostic_images = {
            "imageOriginalB64": image_array_to_b64(img_np),
            "imageDamageOverlayB64": image_array_to_b64(damage_overlay),
            "imageDamageMaskB64": image_array_to_b64(pred_mask_binary * 255),
            "imageRoadMaskB64": image_array_to_b64(road_mask_binary * 255),
            "imageIntersectionB64": image_array_to_b64(intersection * 255),
            "imageSegmentationOverlayB64": image_array_to_b64(segmentation_overlay),
        }
    except Exception:
        diagnostic_images = {}

    return {
        "city": city,
        "analysisId": analysis_id,
        # Hangi goruntuden cikti: sonucun kunyesi sonucun icinde tasinir,
        # istemcinin ne gonderdigine degil kosumun kendisine dayanir.
        "imagerySource": prov_code,
        "imageryLabel": source_label,
        "imageryNote": source_note,
        "waybackId": wayback_id,
        # Cekim tarihi ve fiilen kullanilan yakinlastirma (J-35). Wayback disi
        # kaynaklarda cekim listesi bos ve iliski "unknown".
        "imageryZoom": used_zoom,
        "imageryRequestedZoom": requested_zoom,
        "imageryCaptures": imagery_captures,
        "imageryEventTiming": imagery_event_timing,
        "damageRate": round(damage_rate, 4),
        "openRoads": safe_count,
        "blockedRoads": blocked_count,
        # Kapanma kurali ciktiya yazilir: ayni goruntu farkli r_h ile
        # cok farkli sayida kapanma uretir, sonuc bu olmadan yorumlanamaz.
        "blockageRadiusM": blockage_radius_m,
        "closureRule": "radius" if blockage_radius_m > 0 else "on_road_pixel",
        "openRoadPct": round(open_road_pct, 4),
        "blockedRoadPct": round(blocked_road_pct, 4),
        "logLines": log_lines,
        "recommendedAction": recommended,
        "bounds": {
            "west": bounds[0],
            "south": bounds[1],
            "east": bounds[2],
            "north": bounds[3],
        },
        "imageWidth": w,
        "imageHeight": h,
        "damageBooster": damage_booster,
        "threshold": threshold,
        "postProcessLevel": post_process_level,
        # Sonucu hangi agirlik, hangi ayarla uretti (J-36, kural 1).
        "model": model_summary,
        "safeRoadSegments": safe_segments,
        "blockedRoadSegments": blocked_segments,
        "satelliteSource": source_label,
        "satelliteTileUrl": satellite_tile_url,
        "satelliteAttribution": satellite_attribution,
        **diagnostic_images,
        "timingsMs": {
            "satellite": round(satellite_fetch_ms, 1),
            "roads": round(overpass_ms, 1),
            "inference": round(inference_ms, 1),
            "logistics": round(logistics_ms, 1),
            "total": round(total_ms, 1),
        },
        # Popped by the main process's done-callback before this reaches any
        # HTTP client -- repopulates `road_damage_sessions` for /route.
        "roadGraph": road_graph,
        "closedEdgeKeys": closed_edge_keys,
        "closureProb": closure_prob,
    }
