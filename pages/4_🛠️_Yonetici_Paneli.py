import streamlit as st
import folium
from folium.plugins import Draw
from streamlit_folium import st_folium
import json

from core import (
    boot_resources, 
    load_safe_areas, 
    SAFE_AREAS_PATH, 
    write_json_file,
    TURKEY_PROVINCES,
    RISK_CITY_DEFAULT_COORDS
)

st.set_page_config(page_title="Toplanma Alanı Yönetimi", layout="wide")
boot_resources()

st.markdown("""
<style>
.admin-panel {
    background: linear-gradient(180deg, #1b0a1d 0%, #29102c 100%);
    color: #f7ebf8;
    border-radius: 12px;
    padding: 1rem 1.2rem;
    margin-bottom: 1rem;
    border-left: 5px solid #d32f2f;
}
</style>
""", unsafe_allow_html=True)

st.markdown(
    '<div class="admin-panel"><h1>🛠️ Toplanma Alanı Yönetimi</h1><p>Şehir bazlı güvenli toplanma alanlarını (nokta, çokgen veya dikdörtgen) belirleyebilir ve afet operasyon sistemine kaydedebilirsiniz.</p></div>',
    unsafe_allow_html=True
)

# Load current areas
if "admin_safe_areas" not in st.session_state:
    st.session_state.admin_safe_areas = load_safe_areas()

areas = st.session_state.admin_safe_areas

def save_current_areas():
    write_json_file(SAFE_AREAS_PATH, st.session_state.admin_safe_areas)
    load_safe_areas.clear() # clear cache
    st.success("Toplanma alanları başarıyla kaydedildi!")

col1, col2 = st.columns([2, 1])

with col1:
    st.markdown("### Harita Üzerinden Alan Belirle")
    st.info("Haritanın sol tarafındaki çizim araçlarını kullanarak bir poligon (çokgen) çizin veya bir nokta bırakın.")
    
    # Select city to center map
    center_city = st.selectbox("Harita Merkezi", TURKEY_PROVINCES, index=TURKEY_PROVINCES.index("Hatay") if "Hatay" in TURKEY_PROVINCES else 0)
    lat, lon = RISK_CITY_DEFAULT_COORDS.get(center_city, (39.0, 35.0))
    
    m = folium.Map(location=[lat, lon], zoom_start=12)
    folium.TileLayer("OpenStreetMap", name="Sokak Haritası").add_to(m)
    folium.TileLayer("CartoDB dark_matter", name="Koyu Harita").add_to(m)
    
    # Draw existing areas
    for area in areas:
        popup_html = f"<b>{area.get('name', 'Bilinmiyor')}</b><br>Kapasite: {area.get('capacity')}<br>Şehir: {area.get('city')}"
        if "geometry" in area:
            geom = area["geometry"]
            if geom["type"] == "Point":
                folium.Marker(
                    location=[geom["coordinates"][1], geom["coordinates"][0]],
                    popup=popup_html,
                    icon=folium.Icon(color="green", icon="info-sign")
                ).add_to(m)
            elif geom["type"] in ["Polygon", "Rectangle"]:
                folium.Polygon(
                    locations=[(c[1], c[0]) for c in geom["coordinates"][0]],
                    color="#4caf50",
                    fill=True,
                    fill_opacity=0.4,
                    popup=popup_html
                ).add_to(m)
        else:
            # Fallback for old data
            folium.Marker(
                location=[area.get("lat"), area.get("lon")],
                popup=popup_html,
                icon=folium.Icon(color="green", icon="info-sign")
            ).add_to(m)
            
    # Add Draw tool
    Draw(
        export=False,
        position="topleft",
        draw_options={
            "polyline": False,
            "polygon": True,
            "circle": False,
            "marker": True,
            "circlemarker": False,
            "rectangle": True,
        },
    ).add_to(m)
    
    folium.LayerControl().add_to(m)
    
    output = st_folium(m, width="100%", height=500, key="admin_map")

with col2:
    st.markdown("### Yeni Alan Bilgileri")
    
    drawn_geom = None
    if output.get("last_active_drawing"):
        drawn_geom = output["last_active_drawing"]["geometry"]
    elif output.get("last_clicked"):
        # If user just clicked, we can treat it as a point
        # But prefer using the Draw marker tool.
        pass
        
    if drawn_geom:
        st.success("✅ Haritadan alan/nokta seçimi algılandı.")
        with st.form("new_area_form"):
            name = st.text_input("Alan Adı", "Örn: Merkez Stadyumu")
            city = st.selectbox("Bağlı Olduğu Şehir", TURKEY_PROVINCES, index=TURKEY_PROVINCES.index(center_city) if center_city in TURKEY_PROVINCES else 0)
            capacity = st.number_input("Tahmini Kapasite (Kişi)", min_value=1, value=1000)
            status = st.selectbox("Mevcut Durum", ["Musait", "Kismi Dolu", "Dolu", "Kapali"])
            
            submit = st.form_submit_button("Sisteme Kaydet", type="primary")
            if submit:
                # Calculate rough lat/lon for backward compatibility
                calc_lat, calc_lon = 0, 0
                if drawn_geom["type"] == "Point":
                    calc_lon, calc_lat = drawn_geom["coordinates"]
                elif drawn_geom["type"] in ["Polygon", "Rectangle"]:
                    coords = drawn_geom["coordinates"][0]
                    calc_lon = sum(c[0] for c in coords) / len(coords)
                    calc_lat = sum(c[1] for c in coords) / len(coords)
                    
                new_area = {
                    "name": name,
                    "city": city,
                    "lat": calc_lat,
                    "lon": calc_lon,
                    "capacity": capacity,
                    "status": status,
                    "geometry": drawn_geom
                }
                st.session_state.admin_safe_areas.append(new_area)
                save_current_areas()
                st.rerun()
    else:
        st.warning("⚠️ Lütfen haritadan (sol üstteki araç çubuğunu kullanarak) bir nokta, dikdörtgen veya çokgen çizin.")

st.markdown("---")
st.markdown("### 📋 Mevcut Toplanma Alanları")

if areas:
    for i, area in enumerate(areas):
        with st.expander(f"{area.get('name')} - {area.get('city')} ({area.get('status')})"):
            with st.form(f"edit_form_{i}"):
                st.write("**Alan Bilgilerini Düzenle**")
                
                current_city = area.get("city", "Hatay")
                city_idx = TURKEY_PROVINCES.index(current_city) if current_city in TURKEY_PROVINCES else 0
                
                new_name = st.text_input("Alan Adı", value=area.get("name", ""))
                new_city = st.selectbox("Bağlı Olduğu Şehir", TURKEY_PROVINCES, index=city_idx)
                new_capacity = st.number_input("Tahmini Kapasite (Kişi)", min_value=1, value=int(area.get("capacity", 1000)))
                
                status_options = ["Musait", "Kismi Dolu", "Dolu", "Kapali"]
                current_status = area.get("status", "Musait")
                status_idx = status_options.index(current_status) if current_status in status_options else 0
                new_status = st.selectbox("Mevcut Durum", status_options, index=status_idx)
                
                save_btn = st.form_submit_button("💾 Değişiklikleri Kaydet", type="secondary")
                if save_btn:
                    area["name"] = new_name
                    area["city"] = new_city
                    area["capacity"] = new_capacity
                    area["status"] = new_status
                    save_current_areas()
                    st.rerun()
                    
            if st.button("🗑️ Bu Alanı Tamamen Sil", key=f"delete_{i}", type="primary"):
                st.session_state.admin_safe_areas.pop(i)
                save_current_areas()
                st.rerun()
else:
    st.info("Sistemde kayıtlı toplanma alanı bulunmuyor.")
