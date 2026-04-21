import streamlit as st
from core import *

st.set_page_config(page_title="Uydu Hasar Analizi", layout="wide")
boot_resources()
import cv2
import folium
import numpy as np
from folium.plugins import Draw, SideBySideLayers
from streamlit_folium import st_folium

runtime = load_road_runtime()
fetch_satellite_area = runtime["fetch_satellite_area"]
get_osm_roads_overpass = runtime["get_osm_roads_overpass"]
get_wayback_versions = runtime["get_wayback_versions"]
search_oam_images = runtime["search_oam_images"]
analyze_road_network_graph = runtime["analyze_road_network_graph"]
run_inference = runtime["run_inference"]

st.markdown(
    """
    <style>
    .block-container { padding-top: 1rem; }
    h1 { color: #2E86C1; }
    .stButton>button { width: 100%; border-radius: 5px; height: 3em; font-weight: bold; }
    .stProgress > div > div > div > div { background-color: #2E86C1; }
    </style>
    """,
    unsafe_allow_html=True,
)

if "road_analysis_result" not in st.session_state:
    st.session_state.road_analysis_result = None
if "road_logistic_data" not in st.session_state:
    st.session_state.road_logistic_data = None
if "road_oam_results" not in st.session_state:
    st.session_state.road_oam_results = None
if "road_last_clicked" not in st.session_state:
    st.session_state.road_last_clicked = None

with st.sidebar:
    st.markdown("---")
    st.title("🛰️ RDA Control Panel")
    st.info("Analyze road damage using AI (Segformer).")

    st.header("1. Location & Data")
    selected_city_name = st.selectbox("📍 Jump to City", list(ROAD_CITIES.keys()), key="road_selected_city")
    city_coords = ROAD_CITIES[selected_city_name]

    st.markdown("---")

    wayback_versions = get_wayback_versions()
    opt_google = "Google Maps (Latest / High Res)"
    opt_oam = "OpenAerialMap (Event Specific)"
    wayback_options = []
    wayback_map = {}
    if wayback_versions:
        wayback_versions.sort(key=lambda item: item["date"], reverse=True)
        wayback_map = {f"Esri Wayback ({item['date']})": item for item in wayback_versions}
        wayback_options = list(wayback_map.keys())

    source_options = [opt_google, opt_oam] + wayback_options
    selected_source = st.selectbox("📡 Satellite Source", source_options, key="road_source")

    provider = "Esri Wayback" if "Wayback" in selected_source else "Google Maps"
    selected_wayback = wayback_map.get(selected_source)
    selected_oam_url = None

    if selected_source == opt_oam:
        provider = "OpenAerialMap"
        st.caption("Search for post-disaster imagery (e.g. Feb 2023)")
        c1, c2 = st.columns(2)
        d_start = c1.date_input("Start", datetime.date(2023, 2, 6), key="road_oam_start")
        d_end = c2.date_input("End", datetime.date(2023, 2, 28), key="road_oam_end")

        if st.button("🔎 Search Images", key="road_search_oam"):
            if st.session_state.road_last_clicked:
                lat, lon = st.session_state.road_last_clicked
                bbox = (lon - 0.05, lat - 0.05, lon + 0.05, lat + 0.05)
            else:
                lat, lon = city_coords
                bbox = (lon - 0.05, lat - 0.05, lon + 0.05, lat + 0.05)

            with st.spinner("Searching OAM..."):
                st.session_state.road_oam_results = search_oam_images(bbox, d_start, d_end)

        if st.session_state.road_oam_results:
            res_oam = st.session_state.road_oam_results
            st.success(f"Found {len(res_oam)} images.")
            oam_opts = {f"{item['date']} - {item['provider']}": item for item in res_oam}
            selected_oam = st.selectbox("Select Image", list(oam_opts.keys()), key="road_selected_oam")
            if selected_oam:
                selected_oam_url = oam_opts[selected_oam]["tms_url"]

    st.header("2. Analysis Settings")
    with st.expander("⚙️ Fine-Tuning", expanded=True):
        zoom_level = 18
        st.markdown("#### Detection Parameters")
        damage_booster = st.slider("🔥 Damage Sensitivity Booster", 1.0, 10.0, 3.5, 0.5, key="road_damage_booster")
        threshold = st.slider("📉 Detection Threshold", 0.05, 0.95, 0.40, 0.05, key="road_threshold")
        line_width = 6

        st.markdown("#### Model Path")
        model_path = st.text_input("📁 Pytorch Weights (.pth)", value=str(ROAD_DEFAULT_MODEL), key="road_model_path")
        use_imagenet_norm = st.checkbox("🔬 ImageNet Normalizasyonu", value=True, key="road_imagenet")
        postprocess_label = st.selectbox("🧹 Post-Processing", ["Kapalı (0)", "Hafif (1)", "Güçlü (2)"], index=2, key="road_post")
        postprocess_level = int(postprocess_label.split("(")[1][0])

    analyze_btn = st.button("🚀 Start Analysis", type="primary", key="road_analyze")
    if st.button("🔄 Reset Analysis", key="road_reset"):
        st.session_state.road_analysis_result = None
        st.session_state.road_logistic_data = None
        st.rerun()

st.title("Satellite Road Damage Assessment")

m = folium.Map(location=city_coords, zoom_start=15)
if provider == "Esri Wayback" and selected_wayback:
    url = f"https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{selected_wayback['id']}/{{z}}/{{y}}/{{x}}"
    folium.TileLayer(tiles=url, attr="Esri", name="Wayback").add_to(m)
elif provider == "Google Maps":
    folium.TileLayer(tiles="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", attr="Google", name="Google Satellite").add_to(m)
elif provider == "OpenAerialMap" and selected_oam_url:
    folium.TileLayer(tiles=selected_oam_url, attr="OAM", name="OAM Layer").add_to(m)

draw = Draw(
    export=False,
    position="topleft",
    draw_options={
        "polyline": False,
        "polygon": True,
        "circle": False,
        "marker": False,
        "circlemarker": False,
        "rectangle": True,
    },
)
draw.add_to(m)
m.add_child(folium.LatLngPopup())
output = st_folium(m, height=450, width="100%", key="road_main_map")

click_lat, click_lon = None, None
draw_bbox = None
if output.get("last_active_drawing"):
    geom = output["last_active_drawing"]["geometry"]
    if geom["type"] in ["Polygon", "Rectangle"]:
        coords = np.array(geom["coordinates"][0])
        lon_min, lat_min = coords.min(axis=0)
        lon_max, lat_max = coords.max(axis=0)
        draw_bbox = (lon_min, lat_min, lon_max, lat_max)
        click_lat = (lat_min + lat_max) / 2
        click_lon = (lon_min + lon_max) / 2
        st.session_state.road_last_clicked = (click_lat, click_lon)
        st.success("📌 Alan seçildi! Analizi başlatabilirsiniz.")
elif output.get("last_clicked"):
    click_lat = output["last_clicked"]["lat"]
    click_lon = output["last_clicked"]["lng"]
    st.session_state.road_last_clicked = (click_lat, click_lon)
    st.caption(f"Selected: {click_lat:.5f}, {click_lon:.5f}")
else:
    st.info("👆 Haritadan bir noktaya tıklayın veya soldaki çizim aracı ile özel bir alan seçin.")

st.markdown("---")

if analyze_btn:
    if st.session_state.road_logistic_data:
        st.session_state.road_logistic_data = None

    if not click_lat and not draw_bbox:
        st.warning("Lütfen önce haritadan bir alan seçin veya bir noktaya tıklayın.")
    else:
        progress_bar = st.progress(0, text="Starting Analysis...")
        status_text = st.empty()
        try:
            status_text.text("1/4 Downloading Satellite Imagery...")
            progress_bar.progress(10)

            wayback_id = selected_wayback["id"] if selected_wayback else None
            provider_code = "google" if provider == "Google Maps" else "custom" if provider == "OpenAerialMap" else "esri"
            custom_url = selected_oam_url if provider == "OpenAerialMap" else None

            img, bounds = fetch_satellite_area(
                lat=click_lat,
                lon=click_lon,
                bbox=draw_bbox,
                zoom_level=zoom_level,
                wayback_id=wayback_id,
                provider=provider_code,
                custom_url=custom_url,
            )

            if img is None:
                st.error("FAILED to download imagery. Try a different zoom level or provider.")
                st.stop()

            progress_bar.progress(30)
            status_text.text("2/4 Fetching Road Network (OSM via Overpass)...")
            w, h = img.size
            road_mask = get_osm_roads_overpass(bounds, w, h, thickness=line_width)
            road_mask_binary = (road_mask > 0).astype(np.uint8)

            status_text.text("3/4 Preprocessing & Model Loading...")
            progress_bar.progress(60)
            resolved_model = Path(model_path)
            if not resolved_model.is_absolute():
                resolved_model = (ROAD_ROOT / resolved_model).resolve()
            model, device = load_road_model(str(resolved_model))
            if model is None:
                st.error("Model yüklenemedi! Dosya yolunu kontrol edin.")
                st.stop()

            status_text.text("4/4 Running AI Inference (Segformer)...")
            progress_bar.progress(80)
            raw_probs, boosted_probs, pred_mask_binary, intersection, img_np = run_inference(
                img,
                road_mask_binary,
                model,
                device,
                damage_booster,
                threshold,
                use_imagenet_norm,
                postprocess_level,
            )

            progress_bar.progress(100)
            status_text.text("Analysis Complete!")
            st.session_state.road_analysis_result = {
                "original_img": img_np,
                "road_mask": road_mask_binary,
                "raw_probs": raw_probs,
                "bounds": bounds,
                "damage_booster": damage_booster,
                "threshold": threshold,
                "zoom_level": zoom_level,
                "intersection": intersection,
            }
            st.rerun()
        except Exception as exc:
            st.error(f"Error during analysis: {exc}")
            st.code(traceback.format_exc())
            progress_bar.empty()

if st.session_state.road_analysis_result:
    res = st.session_state.road_analysis_result
    current_probs = np.clip(res["raw_probs"] * res["damage_booster"], 0, 1)
    current_pred_mask = (current_probs > res["threshold"]).astype(np.uint8)
    current_intersection = cv2.bitwise_and(current_pred_mask, res["road_mask"])

    st.subheader("📝 Analysis Report")
    vis_img = res["original_img"].copy()

    yellow_overlay = np.zeros_like(vis_img)
    yellow_overlay[:] = [255, 255, 0]
    red_overlay = np.zeros_like(vis_img)
    red_overlay[:] = [255, 0, 0]
    cyan_overlay = np.zeros_like(vis_img)
    cyan_overlay[:] = [0, 255, 255]

    cyan_idx = (res["road_mask"] == 1) & (current_intersection == 0)
    blended_cyan = cv2.addWeighted(vis_img, 0.3, cyan_overlay, 0.7, 0)
    vis_img[cyan_idx] = blended_cyan[cyan_idx]

    mask_idx = (current_pred_mask == 1) & (current_intersection == 0)
    blended_yellow = cv2.addWeighted(vis_img, 0.5, yellow_overlay, 0.5, 0)
    vis_img[mask_idx] = blended_yellow[mask_idx]

    kernel = np.ones((9, 9), np.uint8)
    thick_intersection = cv2.dilate(current_intersection, kernel, iterations=2)
    intersection_idx = thick_intersection == 1
    blended_red = cv2.addWeighted(vis_img, 0.1, red_overlay, 0.9, 0)
    vis_img[intersection_idx] = blended_red[intersection_idx]

    st.markdown("### 🔍 Harita Üzerinde Kıyaslama (Öncesi / Sonrası)")
    center_lat = (res["bounds"][1] + res["bounds"][3]) / 2.0
    center_lon = (res["bounds"][0] + res["bounds"][2]) / 2.0
    cmp_map = folium.Map(location=[center_lat, center_lon], zoom_start=res["zoom_level"])
    bounds_folium = [[res["bounds"][1], res["bounds"][0]], [res["bounds"][3], res["bounds"][2]]]

    left_layer = folium.raster_layers.ImageOverlay(
        name="Hasarsız Uydu",
        image=get_b64_image(res["original_img"]),
        bounds=bounds_folium,
        opacity=1,
        interactive=True,
        cross_origin=False,
        zindex=1,
    )
    right_layer = folium.raster_layers.ImageOverlay(
        name="Yapay Zeka Hasar Haritası",
        image=get_b64_image(vis_img),
        bounds=bounds_folium,
        opacity=1,
        interactive=True,
        cross_origin=False,
        zindex=1,
    )
    left_layer.add_to(cmp_map)
    right_layer.add_to(cmp_map)
    SideBySideLayers(layer_left=left_layer, layer_right=right_layer).add_to(cmp_map)
    st_folium(cmp_map, width="100%", height=500, key="road_swipe_map")

    st.markdown(
        """
        <div style="background-color: #0E1117; padding: 15px; border-radius: 8px; border: 1px solid #333; display: flex; justify-content: space-around; margin-top: 10px;">
            <span style="color: #00FFFF; font-weight: bold; font-size: 1.1em;">■ Açık Yol (OSM)</span>
            <span style="color: #FFFF00; font-weight: bold; font-size: 1.1em;">■ Tespit Edilen Yıkıntı / Enkaz</span>
            <span style="color: #FF0000; font-weight: bold; font-size: 1.1em;">■ Yol Üzerindeki Yıkıntı (Kapalı Yol)</span>
        </div>
        """,
        unsafe_allow_html=True,
    )

    st.markdown("### 🧩 Diagnostik")
    c1, c2, c3, c4 = st.columns(4)
    c1.image((current_pred_mask * 255).astype(np.uint8), caption="Model Yıkıntı Tahmini", use_container_width=True)
    c2.image((res["road_mask"] * 255).astype(np.uint8), caption="OSM Yol Maskesi", use_container_width=True)
    c3.image((current_intersection * 255).astype(np.uint8), caption="Yol & Yıkıntı Kesişimi", use_container_width=True)
    seg_overlay = res["original_img"].copy()
    damage_color = np.zeros_like(seg_overlay)
    damage_color[:] = [255, 50, 50]
    damage_idx = current_pred_mask == 1
    blended = cv2.addWeighted(seg_overlay, 0.4, damage_color, 0.6, 0)
    seg_overlay[damage_idx] = blended[damage_idx]
    c4.image(seg_overlay, caption="Uydu + Segmentasyon", use_container_width=True)

    st.markdown("---")
    st.markdown("### 🚑 Lojistik ve Rota Analizi")
    st.info("Bu modül, tespit edilen enkazları mevcut yol ağının üzerine bindirerek hangi sokakların kapalı olduğunu hesaplar.")

    if st.button("🗺️ Lojistik Ağı Hesapla", key="road_logistics_btn"):
        with st.spinner("Graph matrisi çıkarılıyor ve kapanan yollar siliniyor..."):
            w, h = res["original_img"].shape[1], res["original_img"].shape[0]
            G, safe_edges, blocked_edges = analyze_road_network_graph(res["bounds"], w, h, current_intersection)
            if G is None:
                st.error("Bu bölge için OSM yol ağı bulunamadı.")
            else:
                st.session_state.road_logistic_data = {
                    "safe_edges": safe_edges,
                    "blocked_edges": blocked_edges,
                    "bounds": res["bounds"],
                    "total": len(safe_edges) + len(blocked_edges),
                    "blocked_count": len(blocked_edges),
                }

    if st.session_state.road_logistic_data:
        data = st.session_state.road_logistic_data
        st.success(f"Yol Ağı Analizi Tamamlandı! Toplam {data['total']} sokak incelendi. {data['blocked_count']} tanesi ulaşıma kapalı.")
        center_lat = (data["bounds"][1] + data["bounds"][3]) / 2.0
        center_lon = (data["bounds"][0] + data["bounds"][2]) / 2.0
        route_map = folium.Map(location=[center_lat, center_lon], zoom_start=16, tiles="CartoDB dark_matter")
        for _, _, _, line in data["safe_edges"]:
            points = [(lat, lon) for lon, lat in line.coords]
            folium.PolyLine(points, color="#00FF00", weight=4, opacity=0.8, tooltip="Erişime Açık Yol").add_to(route_map)
        for _, _, _, line in data["blocked_edges"]:
            points = [(lat, lon) for lon, lat in line.coords]
            folium.PolyLine(points, color="#FF0000", weight=4, opacity=0.8, dash_array="5, 5", tooltip="ENKAZ NEDENİYLE KAPALI").add_to(route_map)
        st_folium(route_map, width="100%", height=500, key="road_logistic_map_viz")

        st.markdown("### 🏥 Bölgedeki En Yakın Güvenli Alanlar")
        center_coords = (center_lat, center_lon)
        nearest_to_area = find_nearest_safe_areas(center_coords, limit=3)
        if nearest_to_area:
            cols = st.columns(len(nearest_to_area))
            for col, area in zip(cols, nearest_to_area):
                col.metric(area["name"], f"{area['distance_km']:.2f} km")
                col.caption(f"{area['city']} - {area['status']}")
            
            st.markdown("---")
            st.markdown("### 📢 Afetzede Bilgilendirme Mesajı (Taslak)")
            best_area = nearest_to_area[0]
            msg = f"DİKKAT: Bölgenizde yapılan uydu analizine göre {data['blocked_count']} sokak enkaz nedeniyle kapalıdır. " \
                  f"Size en yakın güvenli alan: {best_area['name']} ({best_area['distance_km']:.1f} km). " \
                  f"Lütfen haritada yeşil işaretli yolları takip ederek güvenli alana yönleniniz."
            st.info(msg)
            if st.button("📲 Mesajı Sahaya Gönder (SMS/Bildirim)", use_container_width=True, type="primary"):
                st.success("Bilgilendirme mesajı bölgedeki tüm cihazlara iletildi.")

