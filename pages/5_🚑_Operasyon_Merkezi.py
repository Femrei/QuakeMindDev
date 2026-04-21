import streamlit as st
from core import *

st.set_page_config(page_title="Acil Operasyon Merkezi", layout="wide")
boot_resources()
import folium
from streamlit_folium import st_folium

ensure_operations_state()
records = st.session_state.incident_records
safe_areas = load_safe_areas()

if "ops_verification_state" not in st.session_state:
    st.session_state.ops_verification_state = {}

st.markdown(
    """
    <style>
    .ops-panel {
        background: linear-gradient(180deg, #17212b 0%, #20303d 100%);
        color: #f5f7f8;
        border-radius: 8px;
        padding: 1rem 1.2rem;
        margin-bottom: 1rem;
        border-left: 5px solid #f25c54;
    }
    .ops-pill {
        display: inline-block;
        padding: 0.25rem 0.55rem;
        border-radius: 6px;
        background: #eef2f5;
        color: #1f2a33;
        font-size: 0.82rem;
        font-weight: 700;
        margin-right: 0.3rem;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

st.markdown(
    '<div class="ops-panel"><h1>Acil Operasyon Merkezi</h1><p>Analiz edilen sosyal medya ihbarlarini siniflandirir, haritada konumlandirir ve ekip yonlendirme kararlarini tek ekranda toplar.</p></div>',
    unsafe_allow_html=True,
)

if not records:
    st.info("Henuz operasyon kuyruğunda vaka yok. Afet Metin Analizi ekraninda bir tweet analiz edince burada listelenecek.")
    demo_cols = st.columns(3)
    demo_cols[0].metric("Bekleyen Vaka", 0)
    demo_cols[1].metric("Kritik/Yuksek", 0)
    demo_cols[2].metric("Konumlu Vaka", 0)
    st.stop()

pending_count = sum(1 for record in records if record.get("durum") in {"Yeni", "Inceleniyor"})
high_count = sum(1 for record in records if int(record.get("aciliyet", 1)) >= 4)
located_count = sum(1 for record in records if record.get("harita_merkezi"))
metric_cols = st.columns(4)
metric_cols[0].metric("Toplam Vaka", len(records))
metric_cols[1].metric("Bekleyen", pending_count)
metric_cols[2].metric("Kritik/Yuksek", high_count)
metric_cols[3].metric("Konumlu Vaka", located_count)

if st.button("Operasyon kayitlarini diske yaz", key="ops_save_records"):
    save_incident_records()
    st.success(f"Kayitlar guncellendi: {INCIDENTS_PATH}")

categories = get_incident_categories(records)
if st.session_state.operations_selected_category not in categories:
    st.session_state.operations_selected_category = "Tum Vakalar"
st.markdown("### Siniflara Gore Vaka Listesi")
button_cols = st.columns(min(4, len(categories)))
for index, category in enumerate(categories):
    count = len(records) if category == "Tum Vakalar" else sum(1 for record in records if record["kategori"] == category)
    if button_cols[index % len(button_cols)].button(f"{category} ({count})", key=f"ops_cat_{category}"):
        st.session_state.operations_selected_category = category

selected_category = st.session_state.operations_selected_category
filtered_records = [
    record for record in records
    if selected_category == "Tum Vakalar" or record["kategori"] == selected_category
]
if not filtered_records:
    st.warning("Bu sinifta vaka bulunmuyor.")
    st.stop()

st.caption(f"Secili sinif: {selected_category}")

map_records = [record for record in filtered_records if record.get("harita_merkezi")]
if map_records:
    center_lat = sum(record["harita_merkezi"][0] for record in map_records) / len(map_records)
    center_lon = sum(record["harita_merkezi"][1] for record in map_records) / len(map_records)
else:
    center_lat, center_lon = 37.2, 37.0

ops_map = folium.Map(location=[center_lat, center_lon], zoom_start=8, tiles="CartoDB positron")
for area in safe_areas:
    popup = (
        f"<b>{area['name']}</b><br>"
        f"Sehir: {area['city']}<br>"
        f"Kapasite: {area['capacity']}<br>"
        f"Durum: {area['status']}"
    )
    folium.Marker(
        [area["lat"], area["lon"]],
        popup=folium.Popup(popup, max_width=260),
        tooltip=f"Guvenli alan: {area['name']}",
        icon=folium.Icon(color="green", icon="ok-sign"),
    ).add_to(ops_map)

for record in map_records:
    lat, lon = record["harita_merkezi"]
    popup = (
        f"<b>{record['id']}</b><br>"
        f"Sinif: {record['kategori']}<br>"
        f"Aciliyet: {record['aciliyet_etiketi']} ({record['aciliyet']})<br>"
        f"Konum: {record.get('konum_tipi', 'Bilinmiyor')}<br>"
        f"Durum: {record['durum']}<br>"
        f"Ekip: {record['atanan_ekip']}"
    )
    if record.get("konum_tipi") == "Net konum":
        folium.Marker(
            [lat, lon],
            popup=folium.Popup(popup, max_width=300),
            tooltip=f"{record['kategori']} / {record['aciliyet_etiketi']}",
            icon=folium.Icon(color=get_urgency_color(int(record["aciliyet"])), icon="warning-sign"),
        ).add_to(ops_map)
    else:
        radius_km = record.get("etki_yaricapi_km") or 5.0
        folium.Circle(
            location=[lat, lon],
            radius=int(radius_km * 1000),
            color="#f57c00",
            weight=3,
            fill=True,
            fill_opacity=0.18,
            popup=folium.Popup(popup, max_width=300),
            tooltip=f"{record['kategori']} / Tahmini alan {radius_km} km",
        ).add_to(ops_map)

    nearest = find_nearest_safe_areas(record.get("harita_merkezi"), limit=1)
    if nearest:
        area = nearest[0]
        folium.PolyLine(
            [(lat, lon), (area["lat"], area["lon"])],
            color="#1976d2",
            weight=3,
            opacity=0.65,
            tooltip=f"Onerilen yonlendirme: {area['name']}",
        ).add_to(ops_map)

logistic_data = st.session_state.get("road_logistic_data")
if logistic_data:
    for _, _, _, line in logistic_data.get("safe_edges", []):
        points = [(lat, lon) for lon, lat in line.coords]
        folium.PolyLine(points, color="#2e7d32", weight=3, opacity=0.55, tooltip="Acik yol").add_to(ops_map)
    for _, _, _, line in logistic_data.get("blocked_edges", []):
        points = [(lat, lon) for lon, lat in line.coords]
        folium.PolyLine(points, color="#c62828", weight=4, opacity=0.8, dash_array="6, 6", tooltip="Kapali yol").add_to(ops_map)

st.markdown("### Operasyon Haritasi")
st_folium(ops_map, height=520, use_container_width=True, key="operations_map", returned_objects=[])

st.markdown("### En Yakin Guvenli Alanlar")
selected_incident_options = [f"{record['id']} - {record['kategori']} - {record['aciliyet_etiketi']}" for record in filtered_records]
selected_incident_label = st.selectbox("Vaka sec", selected_incident_options, key="ops_selected_incident")
selected_incident_id = selected_incident_label.split(" - ")[0]
selected_record = next(record for record in filtered_records if record["id"] == selected_incident_id)
nearest_areas = find_nearest_safe_areas(selected_record.get("harita_merkezi"), limit=3)
if nearest_areas:
    safe_cols = st.columns(len(nearest_areas))
    for col, area in zip(safe_cols, nearest_areas):
        col.metric(area["name"], f"{area['distance_km']:.2f} km")
        col.caption(f"{area['status']} | Kapasite: {area['capacity']}")
else:
    st.warning("Bu vaka icin koordinat bulunmadigi icin en yakin guvenli alan hesaplanamadi.")

st.markdown("### Ihtiyac Listesi ve Gorev Dagitimi")
need_status_options = ["Bekliyor", "Planlandi", "Ekibe Atandi", "Yolda", "Karsilandi"]
unit_options = ["Atanmadi"] + RESPONSE_UNITS
total_needs = sum(len(record.get("ihtiyaclar", [])) for record in filtered_records)
if total_needs == 0:
    st.info("Secili vakalarda ayrıştırılmış ihtiyaç maddesi yok.")
else:
    for record in filtered_records:
        needs = record.get("ihtiyaclar", [])
        if not needs:
            continue
        with st.expander(f"{record['id']} ihtiyaclari ({len(needs)})", expanded=record["id"] == selected_incident_id):
            st.caption(f"Konum: {record.get('konum_tipi', 'Bilinmiyor')} | Aciliyet: {record['aciliyet_etiketi']}")
            for need_index, need in enumerate(needs):
                st.markdown(f"**{need['ihtiyac']}**")
                need_cols = st.columns([1, 1, 1, 1])
                need_cols[0].caption(f"Kanıt: {need.get('kanit', 'Belirsiz')}")
                need_cols[1].caption(f"Adet/Miktar: {need.get('adet', 'Belirsiz')}")

                current_need_unit = need.get("atanan_birim", "Atanmadi")
                current_need_unit_index = unit_options.index(current_need_unit) if current_need_unit in unit_options else 0
                need["atanan_birim"] = need_cols[2].selectbox(
                    "Birim",
                    unit_options,
                    index=current_need_unit_index,
                    key=f"need_unit_{record['id']}_{need_index}",
                )

                current_need_status = need.get("durum", "Bekliyor")
                current_need_status_index = need_status_options.index(current_need_status) if current_need_status in need_status_options else 0
                need["durum"] = need_cols[3].selectbox(
                    "Durum",
                    need_status_options,
                    index=current_need_status_index,
                    key=f"need_status_{record['id']}_{need_index}",
                )

st.markdown("### Ekip Yonetimi ve Yonlendirme")
status_options = ["Yeni", "Inceleniyor", "Ekip Atandi", "Yonlendirildi", "Tamamlandi"]
for index, record in enumerate(filtered_records):
    with st.expander(f"{record['id']} | {record['kategori']} | {record['aciliyet_etiketi']} | {record['durum']}", expanded=index == 0):
        st.markdown(
            f"<span class='ops-pill'>{record['kategori']}</span>"
            f"<span class='ops-pill'>Aciliyet: {record['aciliyet_etiketi']}</span>"
            f"<span class='ops-pill'>Guven: %{float(record.get('guven_skoru', 0)) * 100:.1f}</span>",
            unsafe_allow_html=True,
        )
        st.write(record["tweet"])
        st.caption(
            f"Konum durumu: {record.get('konum_tipi', 'Bilinmiyor')} | "
            f"Konum guveni: {record.get('konum_guveni', 'Bilinmiyor')} | "
            f"Etki yaricapi: {record.get('etki_yaricapi_km') or 'Yok'} km"
        )
        if record.get("konum_metin"):
            st.caption(f"Konum metni: {record['konum_metin']}")

        col_a, col_b, col_c = st.columns([1, 1, 1])
        current_status_index = status_options.index(record["durum"]) if record["durum"] in status_options else 0
        record["durum"] = col_a.selectbox("Durum", status_options, index=current_status_index, key=f"ops_status_{record['id']}")

        current_unit_index = unit_options.index(record["atanan_ekip"]) if record["atanan_ekip"] in unit_options else 0
        record["atanan_ekip"] = col_b.selectbox("Atanacak ekip", unit_options, index=current_unit_index, key=f"ops_unit_{record['id']}")

        route_options = [""] + [area["name"] for area in safe_areas]
        current_route_index = route_options.index(record["yonlendirme"]) if record["yonlendirme"] in route_options else 0
        record["yonlendirme"] = col_c.selectbox("Guvenli alan yonlendirmesi", route_options, index=current_route_index, key=f"ops_route_{record['id']}")

        record["not"] = st.text_area("Operasyon notu", value=record.get("not", ""), key=f"ops_note_{record['id']}", height=80)

save_incident_records()

