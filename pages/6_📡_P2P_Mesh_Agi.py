import streamlit as st
import json
import os
from pathlib import Path
import folium
from streamlit_folium import st_folium
from datetime import datetime

# Page Config
st.set_page_config(page_title="P2P Mesh Yönetim Paneli", layout="wide")

# Constants & Paths
BASE_DIR = Path(__file__).resolve().parent.parent
P2P_RECORDS_PATH = BASE_DIR / "runtime" / "p2p_records.json"

# Style
st.markdown("""
    <style>
    .p2p-header {
        background: linear-gradient(90deg, #1e3c72 0%, #2a5298 100%);
        padding: 20px;
        border-radius: 10px;
        color: white;
        margin-bottom: 25px;
    }
    .stCard {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 8px;
        border-left: 5px solid #2a5298;
        margin-bottom: 10px;
    }
    .badge-enkaz { background-color: #ff4b4b; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; }
    .badge-yol { background-color: #ffa500; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; }
    .badge-nlp { background-color: #6c5ce7; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; }
    </style>
""", unsafe_allow_html=True)

st.markdown('<div class="p2p-header"><h1>📡 P2P Mesh Sahadan Bildirim Ağı</h1><p>İnternetsiz yerel ağ üzerinden gelen anlık saha verileri ve AI/NLP analiz sonuçları.</p></div>', unsafe_allow_html=True)

with st.expander("Mobil PWA erisimi", expanded=True):
    st.write("Telefon arayuzu `https://<yerel-ip>:8000/app` adresinden acilir.")
    st.write("Yeni PWA ana ekrana eklenebilir; ozet, vakalar, harita ve saha bildirim akisini mobilde toplar.")

# Load Data
def load_p2p_data():
    if os.path.exists(P2P_RECORDS_PATH):
        try:
            with open(P2P_RECORDS_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            return []
    return []

records = load_p2p_data()

if not records:
    st.info("Henüz P2P ağından gelen bir bildirim bulunmuyor.")
    if st.button("🔄 Verileri Yenile"):
        st.rerun()
    st.stop()

# Layout: Map and Stats
col_map, col_stats = st.columns([2, 1])

with col_stats:
    st.subheader("📊 Ağ İstatistikleri")
    total = len(records)
    enkaz = sum(1 for r in records if r['kategori'] == "Enkaz ve Yikim")
    yol = sum(1 for r in records if r['kategori'] == "Kapali Yol")
    nlp = sum(1 for r in records if r['kategori'] not in ["Enkaz ve Yikim", "Kapali Yol"])
    
    st.metric("Toplam Bildirim", total)
    c1, c2, c3 = st.columns(3)
    c1.metric("Enkaz", enkaz)
    c2.metric("Kapalı Yol", yol)
    c3.metric("Acil Çağrı", nlp)
    
    if st.button("🗑️ Kayıtları Temizle", type="secondary"):
        if os.path.exists(P2P_RECORDS_PATH):
            with open(P2P_RECORDS_PATH, "w", encoding="utf-8") as f:
                json.dump([], f)
            st.success("Tüm P2P kayıtları temizlendi.")
            st.rerun()

with col_map:
    st.subheader("📍 Saha Haritası")
    # Determine map center
    valid_coords = [r['harita_merkezi'] for r in records if r.get('harita_merkezi')]
    if valid_coords:
        center_lat = sum(c[0] for c in valid_coords) / len(valid_coords)
        center_lon = sum(c[1] for c in valid_coords) / len(valid_coords)
    else:
        center_lat, center_lon = 37.5, 37.5
        
    m = folium.Map(location=[center_lat, center_lon], zoom_start=13)
    
    for r in records:
        if not r.get('harita_merkezi'): continue
        
        color = 'red' if r['kategori'] == "Enkaz ve Yikim" else 'orange' if r['kategori'] == "Kapali Yol" else 'purple'
        icon = 'warning' if r['kategori'] == "Enkaz ve Yikim" else 'road' if r['kategori'] == "Kapali Yol" else 'comment'
        
        popup_html = f"""
            <b>ID:</b> {r['id']}<br>
            <b>Kategori:</b> {r['kategori']}<br>
            <b>Kaynak:</b> {r.get('p2p_kaynagi', 'Bilinmiyor')}<br>
            <b>Zaman:</b> {r.get('zaman', 'Bilinmiyor')}
        """
        
        folium.Marker(
            location=r['harita_merkezi'],
            popup=folium.Popup(popup_html, max_width=300),
            icon=folium.Icon(color=color, icon=icon, prefix='fa')
        ).add_to(m)
        
    st_folium(m, height=400, use_container_width=True)

# Categorized Views
st.divider()
st.subheader("📑 Bildirim Detayları")

tab1, tab2, tab3 = st.tabs(["🏗️ Enkaz Bildirimleri", "🚧 Yol Durumu", "🆘 Acil Çağrılar (NLP)"])

with tab1:
    enkaz_list = [r for r in records if r['kategori'] == "Enkaz ve Yikim"]
    if not enkaz_list:
        st.write("Enkaz bildirimi bulunmuyor.")
    for r in enkaz_list:
        with st.expander(f"{r['id']} - {r.get('zaman', '')}"):
            c1, c2 = st.columns([1, 1])
            with c1:
                if r.get("resim_yolu") and os.path.exists(r["resim_yolu"]):
                    st.image(r["resim_yolu"], caption="Saha Fotoğrafı", use_container_width=True)
            with c2:
                st.write(f"**Kaynak:** {r.get('p2p_kaynagi')}")
                st.write(f"**Konum:** {r.get('harita_merkezi')}")
                st.write(f"**AI Analiz Skoru:** %{float(r.get('guven_skoru', 0))*100:.1f}")
                st.info(f"Açıklama: {r.get('tweet', '').replace('P2P Saha İhbarı: ', '')}")

with tab2:
    yol_list = [r for r in records if r['kategori'] == "Kapali Yol"]
    if not yol_list:
        st.write("Yol durumu bildirimi bulunmuyor.")
    for r in yol_list:
        with st.expander(f"{r['id']} - {r.get('zaman', '')}"):
            c1, c2 = st.columns([1, 1])
            with c1:
                if r.get("resim_yolu") and os.path.exists(r["resim_yolu"]):
                    st.image(r["resim_yolu"], caption="Yol Fotoğrafı", use_container_width=True)
            with c2:
                st.write(f"**Kaynak:** {r.get('p2p_kaynagi')}")
                st.write(f"**Konum:** {r.get('harita_merkezi')}")
                st.error("DURUM: YOL KAPALI / HASARLI")

with tab3:
    nlp_list = [r for r in records if r['kategori'] not in ["Enkaz ve Yikim", "Kapali Yol"]]
    if not nlp_list:
        st.write("Acil çağrı bulunmuyor.")
    for r in nlp_list:
        with st.expander(f"{r['id']} - {r['kategori']} - {r.get('zaman', '')}"):
            st.write(f"**Mesaj:** {r.get('tweet', '').replace('P2P Saha İhbarı: ', '')}")
            st.write(f"**Konum:** {r.get('harita_merkezi')}")
            st.write(f"**Kaynak:** {r.get('p2p_kaynagi')}")
            st.success(f"NLP ANALİZİ: {r['kategori']}")

if st.button("🔄 Listeyi Güncelle"):
    st.rerun()
