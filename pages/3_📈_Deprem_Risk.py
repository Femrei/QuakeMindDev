import streamlit as st
from core import *

st.set_page_config(page_title="Deprem Risk Paneli", layout="wide")
boot_resources()
import pandas as pd
st.markdown(
    """
    <style>
    .risk-panel {
        background: linear-gradient(180deg, #0b1c2c 0%, #12283f 100%);
        color: #f2f5f7;
        border-radius: 16px;
        padding: 1rem 1.2rem;
        margin-bottom: 1rem;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

st.markdown('<div class="risk-panel"><h1>Deprem Risk Paneli</h1><p>Şehir bazlı kısa ve uzun vadeli deprem risklerini hesaplar ve fay hatlarıyla birlikte haritalar.</p></div>', unsafe_allow_html=True)

if "risk_result" not in st.session_state:
    st.session_state.risk_result = None
if "risk_coords" not in st.session_state:
    st.session_state.risk_coords = None
if "risk_city_quakes" not in st.session_state:
    st.session_state.risk_city_quakes = None
if "risk_status" not in st.session_state:
    st.session_state.risk_status = "Hazır"

with st.sidebar:
    st.markdown("---")
    st.markdown("### Deprem Paneli")
    selected_city = st.selectbox("Şehir", TURKEY_PROVINCES, key="risk_selected_city")
    use_manual = st.checkbox("Manuel koordinat kullan", value=False, key="risk_use_manual")
    lat_default, lon_default = RISK_CITY_DEFAULT_COORDS.get(selected_city, (39.0, 35.0))
    if use_manual:
        manual_lat = st.number_input("Enlem", value=float(lat_default), format="%.6f", key="risk_manual_lat")
        manual_lon = st.number_input("Boylam", value=float(lon_default), format="%.6f", key="risk_manual_lon")
        manual_coords = (manual_lat, manual_lon)
    else:
        manual_coords = None

    refresh_data = st.button("🔄 Veriyi Güncelle", key="risk_refresh_data")
    run_risk = st.button("🌍 Deprem Riskini Hesapla", type="primary", key="risk_run_btn")

engine = None
risk_module = None
risk_error = None
try:
    engine, risk_module = load_risk_bundle()
except Exception as exc:
    risk_error = exc

if risk_error:
    st.error("Risk motoru baslatilamadi.")
    st.exception(risk_error)
    st.stop()

if refresh_data:
    try:
        with temporary_sys_path(RISK_ROOT), temporary_cwd(RISK_ROOT):
            from data_manager import fetch_and_update_data
            message = fetch_and_update_data()
        st.session_state.risk_status = message
        st.success(message)
        load_risk_bundle.clear()
        engine, risk_module = load_risk_bundle()
    except Exception as exc:
        st.error(f"Veri guncellenemedi: {exc}")

if run_risk:
    with st.spinner(f"{selected_city} için risk hesaplanıyor..."):
        try:
            result = engine.predict_city_risk(selected_city, manual_coords=manual_coords)
            st.session_state.risk_result = result
            if manual_coords:
                st.session_state.risk_coords = manual_coords
            else:
                st.session_state.risk_coords = (engine.last_lat, engine.last_lon)
            full_df = engine.df_full.copy()
            dists = risk_module.haversine(
                st.session_state.risk_coords[0],
                st.session_state.risk_coords[1],
                full_df["latitude"].values,
                full_df["longitude"].values,
            )
            st.session_state.risk_city_quakes = full_df[dists <= 150.0].copy()
            st.session_state.risk_status = f"{selected_city} icin risk hesabi tamamlandi"
        except Exception as exc:
            st.session_state.risk_result = None
            st.error(str(exc))

st.caption(f"Durum: {st.session_state.risk_status}")

if st.session_state.risk_result:
    st.subheader("Analiz Sonuçları")
    st.code(st.session_state.risk_result)
    lat, lon = st.session_state.risk_coords
    import folium
    from streamlit_folium import st_folium
    from folium.plugins import HeatMap, MarkerCluster

    st.subheader("Harita")
    map_tabs = st.tabs(["Genel Harita", "Isi Haritasi", "Teknik Katmanlar"])

    city_quakes = st.session_state.risk_city_quakes
    geojson_paths = [
        RISK_ROOT / "data" / "fault_maps" / "fay_haritası" / "gem_active_faults.geojson",
        RISK_ROOT / "data" / "fault_maps" / "fay_haritası" / "gem_active_faults_harmonized.geojson",
    ]
    filtered_fault_layers = []
    for path in geojson_paths:
        if path.exists():
            filtered_fault_layers.append(
                (
                    path,
                    get_filtered_fault_geojson(
                        str(path),
                        round(lat, 4),
                        round(lon, 4),
                        radius_km=180.0,
                    ),
                )
            )

    risk_map = folium.Map(location=[lat, lon], zoom_start=8, tiles=None, prefer_canvas=True)
    folium.TileLayer("CartoDB dark_matter", name="Koyu Mod").add_to(risk_map)
    folium.TileLayer("OpenStreetMap", name="Aydinlik Mod").add_to(risk_map)
    folium.Marker([lat, lon], tooltip=selected_city, popup=selected_city, icon=folium.Icon(color="red", icon="info-sign")).add_to(risk_map)
    for line in getattr(risk_module, "FAULT_LINES", []):
        if any(distance_km(lat, lon, point_lat, point_lon) <= 180.0 for point_lat, point_lon in line):
            folium.PolyLine(line, color="#ff5722", weight=2, opacity=0.6, tooltip="Ana Fay Hatti").add_to(risk_map)

    if city_quakes is not None and not city_quakes.empty:
        heat_source = city_quakes
        if len(heat_source) > 600:
            step = max(1, len(heat_source) // 600)
            heat_source = heat_source.iloc[::step].copy()
        heat_data = heat_source[["latitude", "longitude", "mag"]].values.tolist()
        HeatMap(
            heat_data,
            name="Deprem Yogunlugu",
            radius=15,
            max_zoom=10,
            min_opacity=0.4,
            gradient={0.4: "blue", 0.65: "lime", 1: "red"},
        ).add_to(risk_map)

        cluster = MarkerCluster(name="Bolgesel Depremler").add_to(risk_map)
        significant_quakes = city_quakes[city_quakes["mag"] >= 3.0]
        if len(significant_quakes) > 250:
            significant_quakes = significant_quakes.sort_values(
                ["mag", "time"], ascending=[False, False]
            ).head(250)
        for _, row in significant_quakes.iterrows():
            mag = row["mag"]
            color = "green"
            if mag >= 4.0:
                color = "orange"
            if mag >= 5.0:
                color = "red"
            if mag >= 6.0:
                color = "darkred"
            popup_html = (
                f"<b>Tarih:</b> {row['time']}<br>"
                f"<b>Buyukluk:</b> <span style='color:{color}; font-weight:bold;'>{mag}</span><br>"
                f"<b>Derinlik:</b> {row['depth']} km"
            )
            folium.CircleMarker(
                location=[row["latitude"], row["longitude"]],
                radius=5,
                color=color,
                fill=True,
                fill_color=color,
                fill_opacity=0.7,
                popup=folium.Popup(popup_html, max_width=250),
            ).add_to(cluster)

    total_fault_features = 0
    for path, geo_data in filtered_fault_layers:
        if geo_data.get("features"):
            total_fault_features += len(geo_data["features"])
            name = path.stem.replace("_", " ").title()
            folium.GeoJson(
                geo_data,
                name=f"Detayli Faylar: {name}",
                zoom_on_click=False,
                style_function=lambda _: {"color": "#ff9800", "weight": 1.5, "opacity": 0.5},
            ).add_to(risk_map)

    folium.LayerControl(collapsed=False).add_to(risk_map)

    with map_tabs[0]:
        st.caption("Harita etkileşimleri artık sayfayı yeniden yüklemez; yakın çevredeki fay segmentleri filtrelenerek gösterilir.")
        st_folium(
            risk_map,
            width=None,
            height=520,
            key="risk_map_full",
            use_container_width=True,
            returned_objects=[],
        )

    with map_tabs[1]:
        if city_quakes is not None and not city_quakes.empty:
            info_cols = st.columns(3)
            info_cols[0].metric("150 km icindeki deprem", len(city_quakes))
            info_cols[1].metric("Maksimum buyukluk", f"{city_quakes['mag'].max():.2f}")
            info_cols[2].metric("Ortalama derinlik", f"{city_quakes['depth'].mean():.1f} km")
            st.caption(f"Isi katmani {len(heat_data)} deprem kaydinin optimize edilmis orneklemi ile cizildi.")
            st_folium(
                risk_map,
                width=None,
                height=520,
                key="risk_heat_map",
                use_container_width=True,
                returned_objects=[],
            )
        else:
            st.info("Bu bolge icin gosterilecek deprem kaydi bulunamadi.")

    with map_tabs[2]:
        st.write("GeoJSON fay katmanlari:")
        for path, geo_data in filtered_fault_layers:
            st.write(f"- {path} -> {len(geo_data.get('features', []))} yakin segment")
        st.write(f"Toplam gosterilen detayli fay segmenti: {total_fault_features}")
        if city_quakes is not None and not city_quakes.empty:
            st.dataframe(city_quakes.sort_values("mag", ascending=False).head(20), use_container_width=True)
        else:
            st.info("Bolgesel deprem tablosu hazir degil.")

    st.markdown("---")
    st.caption("Canli kamera algilama modulu artik apps/camera_detection altinda bagimsiz bir uygulama olarak yer aliyor.")

