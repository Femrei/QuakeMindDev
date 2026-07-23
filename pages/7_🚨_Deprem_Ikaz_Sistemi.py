import streamlit as st
import urllib.request
import re
import datetime
import streamlit.components.v1 as components
import folium
from streamlit_folium import st_folium
from core import (
    boot_resources,
    distance_km,
    load_safe_areas,
    TURKEY_PROVINCES,
    RISK_CITY_DEFAULT_COORDS,
)

# Sayfa Yapılandırması
st.set_page_config(page_title="Deprem İkaz Sistemi", layout="wide")
boot_resources()

# Özel CSS Tasarımı - Premium Koyu Tema & Glassmorphism
st.markdown(
    """
    <style>
    .warning-header {
        background: linear-gradient(135deg, #1e130c 0%, #960018 100%);
        padding: 24px;
        border-radius: 16px;
        color: white;
        margin-bottom: 25px;
        border: 1px solid rgba(255, 0, 0, 0.2);
        box-shadow: 0 10px 30px rgba(150, 0, 24, 0.3);
    }
    .status-card {
        padding: 20px;
        border-radius: 12px;
        margin-bottom: 20px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
    }
    .status-safe {
        background: rgba(46, 125, 50, 0.15);
        border-left: 6px solid #2e7d32;
    }
    .status-light {
        background: rgba(25, 118, 210, 0.15);
        border-left: 6px solid #1976d2;
    }
    .status-medium {
        background: rgba(239, 108, 0, 0.15);
        border-left: 6px solid #ef6c00;
    }
    .status-severe {
        background: rgba(198, 40, 40, 0.25);
        border-left: 6px solid #c62828;
        animation: pulse-red 2s infinite;
    }
    @keyframes pulse-red {
        0% { box-shadow: 0 0 0 0 rgba(198, 40, 40, 0.4); }
        70% { box-shadow: 0 0 0 15px rgba(198, 40, 40, 0); }
        100% { box-shadow: 0 0 0 0 rgba(198, 40, 40, 0); }
    }
    .p2p-alert-box {
        background: linear-gradient(90deg, #8e2de2 0%, #4a00e0 100%);
        padding: 15px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        margin-top: 15px;
        text-align: center;
        box-shadow: 0 4px 15px rgba(142, 45, 226, 0.4);
    }
    .guide-card {
        background: rgba(30, 41, 59, 0.7);
        padding: 15px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        margin-bottom: 15px;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# Başlık Paneli
st.markdown(
    """
    <div class="warning-header">
        <h1>🚨 Deprem İkaz & Acil Durum Yönetim Sistemi</h1>
        <p>Deprem İkaz Algoritması (Earthquake Warning Algorithm) ile gerçek zamanlı sismik veri analizi, 
        konuma özel alarm seviyeleri ve güvenli tahliye rotalaması.</p>
    </div>
    """,
    unsafe_allow_html=True,
)

# Kandilli Rasathanesi Veri Çekme Fonksiyonu
@st.cache_data(ttl=30, show_spinner=False)
def fetch_kandilli_quakes():
    url = "http://www.koeri.boun.edu.tr/sismoloji/2/sondepremler.txt"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            content = response.read().decode('utf-8', errors='ignore')
        
        lines = content.split('\n')
        quakes = []
        for line in lines:
            line = line.strip()
            if not line or not re.match(r'^\d{4}\.\d{2}\.\d{2}', line):
                continue
            
            # Kandilli txt formatı sabit sütun genişliklerine sahiptir
            date = line[0:10].strip()
            time = line[11:19].strip()
            lat_str = line[21:28].strip()
            lon_str = line[30:38].strip()
            depth_str = line[40:47].strip()
            
            md = line[49:53].strip()
            ml = line[54:58].strip()
            mw = line[59:63].strip()
            
            place = line[71:121].strip()
            place = re.sub(r'\s+', ' ', place)
            
            try:
                lat = float(lat_str)
                lon = float(lon_str)
                depth = float(depth_str)
                
                mags = []
                for m_str in [md, ml, mw]:
                    if m_str and m_str != '-.-':
                        try:
                            mags.append(float(m_str))
                        except ValueError:
                            pass
                mag = max(mags) if mags else 0.0
                
                quakes.append({
                    "Tarih/Saat": f"{date} {time}",
                    "Enlem": lat,
                    "Boylam": lon,
                    "Derinlik (km)": depth,
                    "Büyüklük": mag,
                    "Konum": place
                })
            except Exception:
                continue
        return quakes[:50]
    except Exception as e:
        st.warning(f"Kandilli verisi anlık çekilemedi: {e}. Simülatör modunu kullanabilirsiniz.")
        return []

# Siren Sesi Tetikleyici (Web Audio API)
def trigger_siren_js():
    js_code = """
    <script>
    function playSiren() {
        var context = new (window.AudioContext || window.webkitAudioContext)();
        var now = context.currentTime;
        
        // Siren Sesi İçin 2 Ayrı Osilatör (Kalın ve İnce seslerin modülasyonu)
        var osc1 = context.createOscillator();
        var osc2 = context.createOscillator();
        var gainNode = context.createGain();
        
        osc1.type = 'sawtooth';
        osc2.type = 'sine';
        
        // Frekans modülasyonu (Siren efekti)
        osc1.frequency.setValueAtTime(500, now);
        osc1.frequency.linearRampToValueAtTime(900, now + 0.6);
        osc1.frequency.linearRampToValueAtTime(500, now + 1.2);
        osc1.frequency.linearRampToValueAtTime(900, now + 1.8);
        osc1.frequency.linearRampToValueAtTime(500, now + 2.4);
        
        osc2.frequency.setValueAtTime(510, now);
        osc2.frequency.linearRampToValueAtTime(910, now + 0.6);
        osc2.frequency.linearRampToValueAtTime(510, now + 1.2);
        osc2.frequency.linearRampToValueAtTime(910, now + 1.8);
        osc2.frequency.linearRampToValueAtTime(510, now + 2.4);
        
        gainNode.gain.setValueAtTime(0.4, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 3.0); // 3 saniyede sönümlensin
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(context.destination);
        
        osc1.start(now);
        osc2.start(now);
        
        osc1.stop(now + 3.0);
        osc2.stop(now + 3.0);
    }
    try {
        playSiren();
    } catch(e) {
        console.log("Audio API Error: ", e);
    }
    </script>
    """
    components.html(js_code, height=0, width=0)

# Session State Hazırlıkları
if "bag_items" not in st.session_state:
    st.session_state.bag_items = {
        "Su (Kişi başı en az 1 litre/gün)": True,
        "Yüksek kalorili, vitaminli gıdalar (konserve vb.)": False,
        "İlk yardım çantası ve düzenli ilaçlar": False,
        "Düdük (Enkaz altında ses duyurmak için)": True,
        "Fener ve yedek piller": False,
        "Çok amaçlı çakı / alet çantası": False,
        "Kişisel hijyen malzemeleri": False,
        "Önemli evrak kopyaları (kimlik, tapu, sigorta vb.)": False,
        "Acil durum battaniyesi / koruyucu örtü": False,
        "Yedek giysi ve mevsime uygun kıyafetler": False,
    }

# ----------------- SIDEBAR: KULLANICI KONUMU -----------------
with st.sidebar:
    st.markdown("### 📍 Kullanıcı Mevcut Konumu")
    user_city = st.selectbox("Şehriniz", TURKEY_PROVINCES, index=TURKEY_PROVINCES.index("Hatay") if "Hatay" in TURKEY_PROVINCES else 0)
    
    manual_loc = st.checkbox("Koordinatları Manuel Belirle")
    default_lat, default_lon = RISK_CITY_DEFAULT_COORDS.get(user_city, (37.5, 37.5))
    
    if manual_loc:
        user_lat = st.number_input("Kullanıcı Enlem", value=float(default_lat), format="%.5f")
        user_lon = st.number_input("Kullanıcı Boylam", value=float(default_lon), format="%.5f")
    else:
        user_lat, user_lon = default_lat, default_lon
        st.info(f"Seçilen Şehir: {user_city}\nKoordinat: {user_lat}, {user_lon}")
    
    st.markdown("---")
    st.markdown("### 📡 Veri Akış Modu")
    stream_mode = st.radio("Deprem Veri Kaynağı", ["Gerçek Zamanlı İzleme (Kandilli)", "Deprem Test Simülatörü"])

# ----------------- ANA EKRAN İÇERİĞİ -----------------
col_left, col_right = st.columns([7, 5])

# Deprem Verisinin Belirlenmesi
selected_quake = None

with col_left:
    if stream_mode == "Gerçek Zamanlı İzleme (Kandilli)":
        st.subheader("🔄 Kandilli Son Depremler")
        quakes_data = fetch_kandilli_quakes()
        
        if quakes_data:
            import pandas as pd
            df = pd.DataFrame(quakes_data)
            
            # Son depremi varsayılan seçelim
            st.dataframe(df, use_container_width=True, height=280)
            
            # Deprem seçimi
            quake_options = [
                f"{q['Tarih/Saat']} - {q['Konum']} (M {q['Büyüklük']})" 
                for q in quakes_data
            ]
            selected_quake_label = st.selectbox("Detaylı analiz etmek istediğiniz depremi seçin:", quake_options)
            
            # Seçilen depremi bul
            selected_idx = quake_options.index(selected_quake_label)
            q = quakes_data[selected_idx]
            selected_quake = {
                "lat": q["Enlem"],
                "lon": q["Boylam"],
                "mag": q["Büyüklük"],
                "depth": q["Derinlik (km)"],
                "place": q["Konum"],
                "time": q["Tarih/Saat"]
            }
        else:
            st.info("Son deprem verilerine ulaşılamadı. Lütfen 'Deprem Test Simülatörü' moduna geçin.")
            
    else:
        st.subheader("🛠️ Deprem Test Simülatörü")
        st.caption("Algoritmanın farklı senaryolardaki ikaz seviyelerini test etmek için parametreleri ayarlayabilirsiniz.")
        
        sim_col1, sim_col2 = st.columns(2)
        with sim_col1:
            sim_city = st.selectbox("Deprem Merkez Üssü (Şehir)", TURKEY_PROVINCES, index=TURKEY_PROVINCES.index("Kahramanmaras") if "Kahramanmaras" in TURKEY_PROVINCES else 0)
            sim_lat, sim_lon = RISK_CITY_DEFAULT_COORDS.get(sim_city, (37.5, 37.5))
            
            sim_lat_input = st.number_input("Deprem Enlem", value=float(sim_lat), format="%.5f", key="sim_lat")
            sim_lon_input = st.number_input("Deprem Boylam", value=float(sim_lon), format="%.5f", key="sim_lon")
        
        with sim_col2:
            sim_mag = st.slider("Deprem Büyüklüğü (M)", min_value=1.0, max_value=8.5, value=5.8, step=0.1)
            sim_depth = st.slider("Deprem Derinliği (km)", min_value=1.0, max_value=80.0, value=10.0, step=0.5)
            
        selected_quake = {
            "lat": sim_lat_input,
            "lon": sim_lon_input,
            "mag": sim_mag,
            "depth": sim_depth,
            "place": f"SİMÜLE - {sim_city} Merkezli",
            "time": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        st.success(f"Simülasyon Aktif: {selected_quake['place']} (M {selected_quake['mag']} / Derinlik {selected_quake['depth']} km)")

# ----------------- DEPREM İKAZ ALGORİTMASI (DECISION LOGIC) -----------------
if selected_quake:
    # Kullanıcı konumuna olan mesafeyi hesapla
    dist = distance_km(user_lat, user_lon, selected_quake["lat"], selected_quake["lon"])
    
    st.divider()
    st.subheader("🔔 İkaz Durum Analizi")
    
    # Eşik değerler
    # Eğer deprem kullanıcıdan çok uzaksa (> 250 km) sarsıntı hissi düşüktür.
    is_quake_near = dist <= 250.0
    
    # Uyarı Seviyeleri Mantığı
    if not is_quake_near:
        # Uzak deprem
        st.markdown(
            f"""
            <div class="status-card status-safe">
                <h3>🟢 Güvenli Durum (Deprem Uzakta)</h3>
                <p><b>{selected_quake['place']}</b> konumunda meydana gelen deprem (Büyüklük: {selected_quake['mag']}), 
                mevcut konumunuza <b>{dist:.2f} km</b> uzaklıktadır. Bölgenizde herhangi bir doğrudan tehlike algılanmamıştır.</p>
            </div>
            """,
            unsafe_allow_html=True,
        )
        alarm_level = "safe"
    else:
        # Yakın deprem saptandı
        mag = selected_quake["mag"]
        
        if mag < 4.0:
            # Hafif deprem
            st.markdown(
                f"""
                <div class="status-card status-light">
                    <h3>🔵 Hafif Sarsıntı İkazı (M < 4.0)</h3>
                    <p>Konumunuza <b>{dist:.2f} km</b> uzaklıkta <b>{selected_quake['place']}</b> merkezli <b>M {mag}</b> büyüklüğünde hafif şiddette bir deprem saptandı.</p>
                    <ul>
                        <li>Deprem hafif şiddettedir, panik yapmayın.</li>
                        <li>Binanızın durumunu gözlemleyin ve çevre güvenliğine dikkat edin.</li>
                        <li>Resmi kanallardan gelecek açıklamaları takip edin.</li>
                    </ul>
                </div>
                """,
                unsafe_allow_html=True,
            )
            alarm_level = "light"
            
        elif 4.0 <= mag < 5.5:
            # Orta deprem
            st.markdown(
                f"""
                <div class="status-card status-medium">
                    <h3>🟠 Orta Şiddetli Deprem İkazı (4.0 &le; M &lt; 5.5)</h3>
                    <p>Konumunuza <b>{dist:.2f} km</b> uzaklıkta <b>{selected_quake['place']}</b> merkezli <b>M {mag}</b> büyüklüğünde orta şiddette bir deprem saptandı.</p>
                    <p><b>ACİL EYLEM ÖNERİLERİ:</b></p>
                    <ul>
                        <li><b>Çök-Kapan-Tutun:</b> Güvenli bir eşyanın (sağlam masa vb.) yanına geçerek kendinizi koruyun.</li>
                        <li>Sarsıntı bittiğinde gaz, elektrik ve su vanalarını kapatın.</li>
                        <li>Acil durum çantanızı yanınıza alarak toplanma alanına geçmeye hazırlanın.</li>
                    </ul>
                </div>
                """,
                unsafe_allow_html=True,
            )
            alarm_level = "medium"
            
        else:
            # Şiddetli deprem M >= 5.5
            st.markdown(
                f"""
                <div class="status-card status-severe">
                    <h3>🔴 KRİTİK DEPREM ALARMI! (M &ge; 5.5)</h3>
                    <p>Konumunuza <b>{dist:.2f} km</b> yakınlıkta <b>{selected_quake['place']}</b> merkezli <b>M {mag}</b> büyüklüğünde şiddetli bir deprem saptandı!</p>
                    <p><b>🚨 ACİL TAHİLYE VE GÜVENLİK ALARMI:</b></p>
                    <ul>
                        <li><b>Sarsıntı Sırasında:</b> Hemen en güvenli noktada <b>Çök-Kapan-Tutun</b> pozisyonu alın. Pencere ve merdivenlerden uzak durun.</li>
                        <li><b>Sarsıntı Sonrasında:</b> Binayı hızlı ve sakin bir şekilde tahliye edin. Asansör kullanmayın.</li>
                        <li><b>Tahliye Alanı:</b> En yakın güvenli toplanma alanına yönlenin (Aşağıda rotalanmıştır).</li>
                    </ul>
                </div>
                """,
                unsafe_allow_html=True,
            )
            alarm_level = "severe"
            
            # Siren sesini çal (Streamlit bileşeni olarak yüklenir)
            trigger_siren_js()
            
            # P2P Yönlendirme Kutusu
            st.markdown(
                """
                <div class="p2p-alert-box">
                    📡 Şebeke Kesintisi Riski: Çevrimdışı P2P Mesh İletişim Moduna Geçin!<br>
                    Telefon şebekeleri çökebilir. Yakındaki cihazlarla P2P üzerinden haberleşmek için sol menüden "P2P Mesh Ağı" sayfasına geçiş yapın.
                </div>
                """,
                unsafe_allow_html=True,
            )

# Right Column: Maps, Navigation & Checklist
with col_right:
    # ----------------- MAPS & TACTICAL NAVIGATION -----------------
    st.subheader("🗺️ Canlı Konum ve Tahliye Haritası")
    
    if selected_quake:
        # En yakın güvenli alanları bul
        # Enlem/Boylam çiftini bulup core.py fonksiyonuna verelim
        user_coords = (user_lat, user_lon)
        nearest_safe_areas = []
        
        try:
            from core import find_nearest_safe_areas
            nearest_safe_areas = find_nearest_safe_areas(user_coords, limit=3)
        except Exception as e:
            st.error(f"Toplanma alanları hesaplanamadı: {e}")
            
        # Folium Haritası
        m = folium.Map(location=[user_lat, user_lon], zoom_start=11, tiles="CartoDB dark_matter")
        
        # Kullanıcı Konumu (Mavi Ev)
        folium.Marker(
            location=[user_lat, user_lon],
            popup="Mevcut Konumunuz",
            tooltip="Konumunuz",
            icon=folium.Icon(color="blue", icon="home", prefix="fa")
        ).add_to(m)
        
        # Deprem Merkez Üssü (Kırmızı Halka ve Marker)
        folium.Marker(
            location=[selected_quake["lat"], selected_quake["lon"]],
            popup=f"Deprem Merkez Üssü<br>Büyüklük: {selected_quake['mag']}<br>Uzaklık: {dist:.1f} km",
            tooltip="DEPREM MERKEZ ÜSSÜ",
            icon=folium.Icon(color="red", icon="warning", prefix="fa")
        ).add_to(m)
        
        # Deprem Etki Dairesi
        folium.Circle(
            location=[selected_quake["lat"], selected_quake["lon"]],
            radius=int(max(5.0, selected_quake["mag"] * 15.0) * 1000), # Büyüklüğe göre yarıçap
            color="red",
            weight=1.5,
            fill=True,
            fill_opacity=0.1,
            tooltip="Deprem Etki Bölgesi"
        ).add_to(m)
        
        # Deprem merkez üssünden kullanıcıya bağlantı çizgisi
        folium.PolyLine(
            locations=[[user_lat, user_lon], [selected_quake["lat"], selected_quake["lon"]]],
            color="red",
            weight=2,
            opacity=0.5,
            dash_array="5, 10",
            tooltip=f"Deprem Uzaklığı: {dist:.1f} km"
        ).add_to(m)
        
        # Güvenli Toplanma Alanları
        for i, area in enumerate(nearest_safe_areas):
            area_coords = [area["lat"], area["lon"]]
            color = "green" if i == 0 else "lightgreen"
            
            popup_text = f"""
                <b>{area['name']}</b><br>
                Uzaklık: {area['distance_km']:.2f} km<br>
                Kapasite: {area['capacity']}<br>
                Durum: {area['status']}
            """
            
            folium.Marker(
                location=area_coords,
                popup=folium.Popup(popup_text, max_width=250),
                tooltip=f"Toplanma Alanı: {area['name']}",
                icon=folium.Icon(color=color, icon="shield", prefix="fa")
            ).add_to(m)
            
            # En yakın alana tahliye rotası çiz
            if i == 0:
                folium.PolyLine(
                    locations=[[user_lat, user_lon], area_coords],
                    color="#00e676",
                    weight=4,
                    opacity=0.85,
                    tooltip=f"Önerilen En Yakın Rota: {area['name']} ({area['distance_km']:.2f} km)"
                ).add_to(m)
        
        st_folium(m, height=350, use_container_width=True, key="warning_map", returned_objects=[])
        
        # En yakın toplanma alanları listesi
        if nearest_safe_areas:
            st.markdown("### 🦺 Önerilen En Yakın Toplanma Alanları")
            for idx, area in enumerate(nearest_safe_areas):
                icon = "🥇" if idx == 0 else "🥈" if idx == 1 else "🥉"
                st.markdown(
                    f"""
                    <div class="guide-card">
                        <b>{icon} {area['name']}</b> ({area['distance_km']:.2f} km)<br>
                        <small>Durum: {area['status']} | Kapasite: {area['capacity']} kişi</small>
                    </div>
                    """,
                    unsafe_allow_html=True
                )
                
    st.divider()
    
    # ----------------- EMERGENCY CHECKLIST -----------------
    st.subheader("🎒 Hazırlık: Acil Durum Çantası")
    st.caption("Deprem öncesinde acil durum çantanızın hazır olduğundan emin olun.")
    
    # Çanta Kontrol Listesi
    completed_items = 0
    total_items = len(st.session_state.bag_items)
    
    for item, val in st.session_state.bag_items.items():
        new_val = st.checkbox(item, value=val, key=f"bag_{item.replace(' ', '_')}")
        st.session_state.bag_items[item] = new_val
        if new_val:
            completed_items += 1
            
    progress_ratio = completed_items / total_items
    st.progress(progress_ratio)
    st.markdown(f"**Hazırlık Oranı:** %{int(progress_ratio * 100)} ({completed_items} / {total_items} malzeme tamam)")
    
    if progress_ratio == 1.0:
        st.success("Tebrikler! Acil durum çantanız tamamen hazır. 🎉")
    elif progress_ratio >= 0.5:
        st.info("Çantanızın temel ihtiyaçları tamamlanmış görünüyor, eksikleri en kısa sürede tamamlayın.")
    else:
        st.warning("Acil durum çantanızda çok fazla eksik var. Lütfen malzemeleri hazırlayın.")

# ----------------- EĞİTİCİ BİLGİLER / REHBER -----------------
st.divider()
st.subheader("📖 Deprem Anında Davranış Kuralları (Eğitim Modülü)")

tab_bina_ici, tab_disari, tab_p2p_info = st.tabs([
    "🏢 Bina İçindeyken", 
    "🌳 Bina Dışındayken", 
    "📡 Haberleşme & P2P Rehberi"
])

with tab_bina_ici:
    st.markdown("""
    *   **Panik Yapmayın:** Sakin kalmaya çalışın ve gereksiz yere koşmayın.
    *   **Çök-Kapan-Tutun:** Güvenli bir masa veya sıranın yanına çömelin, başınızı koruyun ve sarsıntı bitene kadar tutunun.
    *   **Tehlikeli Alanlardan Uzak Durun:** Balkonlar, merdivenler, asansörler ve pencereler deprem anında en büyük risk kaynaklarıdır.
    *   **Mutfaktan Kaçının:** Mutfak tezgahları, ocaklar ve devrilebilecek mutfak dolapları tehlikelidir.
    """)

with tab_disari:
    st.markdown("""
    *   **Açık Alanlara Geçin:** Binalardan, elektrik direklerinden, reklam panolarından ve üst geçitlerden olabildiğince uzak durun.
    *   **Toplanma Alanı:** Önceden belirlenmiş ve haritada gösterilen en yakın afet toplanma alanına ilerleyin.
    *   **Araç İçindeyseniz:** Aracı güvenli bir açıklığa çekin, motoru durdurun ve sarsıntı geçene kadar araç içinde bekleyin. Köprü altlarında beklemeyin.
    """)

with tab_p2p_info:
    st.markdown("""
    *   **Haberleşme Kanalları:** Deprem sonrasında hücresel şebekeler (GSM) aşırı yoğunluktan çöker. Bu durumda internet gerektirmeyen çözümlere yönelin.
    *   **P2P Mesh Ağı:** QuakeMind, Bluetooth ve Wi-Fi Direct protokollerini kullanarak lokal bir haberleşme ağı (Mesh Network) kurabilir.
    *   **Enkaz Altı Sinyal Modu:** Eğer enkaz altında kaldıysanız, P2P ağımıza dahil olan kurtarma ekiplerinin sizi bulması için Bluetooth sinyal cihazını veya düdüğü aktif edin.
    """)
