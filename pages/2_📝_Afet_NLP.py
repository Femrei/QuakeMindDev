import streamlit as st
from core import *

st.set_page_config(page_title="Afet NLP", layout="wide")
boot_resources()
ensure_operations_state()
st.title("🚨 P-5: Afet Metin & Multimodal Veri Füzyonu GUI")
st.markdown(
    """
    Bu arayüz, sosyal medyadan elde edilen kentsel afet verisinin uçtan uca analizini simüle etmektedir.
    1. **Zeyrek** ile metni sadeleştirir.
    2. **BERTurk Sınıflandırma** ile P-5 kategorilerini belirler ve güven skoru ölçer.
    3. **BERTurk NER** ile metinden adres bilgisini çeker.
    4. **GeoPy** ile çekilen adresi harita koordinatlarına dönüştürür.
    5. Veriyi **Düşük Bant Genişliğine (JSON)** optimize eder.
    """
)
st.caption("Uygulama ilk açılışta model yüklediği için 20-60 saniye bekletebilir.")

if "nlp_selected_sample" not in st.session_state:
    st.session_state.nlp_selected_sample = "Lütfen kendi metnini kullan..."
if "nlp_user_input" not in st.session_state:
    st.session_state.nlp_user_input = ""
if "nlp_analysis_result" not in st.session_state:
    st.session_state.nlp_analysis_result = None
if "nlp_analysis_error" not in st.session_state:
    st.session_state.nlp_analysis_error = None

def handle_sample_change():
    selected = st.session_state.nlp_selected_sample
    if selected == "Lütfen kendi metnini kullan...":
        return
    st.session_state.nlp_user_input = selected

pipeline = None
pipeline_error = None
try:
    pipeline = load_nlp_pipeline()
except Exception as exc:
    pipeline_error = exc

if pipeline_error:
    st.error("Pipeline baslatilamadi. Hata detayi asagida.")
    st.exception(pipeline_error)
    st.stop()

st.subheader("Simülasyon Verisi Gönder")
sample_options = ["Lütfen kendi metnini kullan..."] + NLP_SAMPLE_TEXTS

st.selectbox(
    "Örnek Test Verisi Seçin",
    sample_options,
    key="nlp_selected_sample",
    on_change=handle_sample_change,
)

st.text_area(
    "Veya Sosyal medya (X) metni girin:",
    key="nlp_user_input",
    height=180,
)

if st.button("Uçtan Uca Analizi Çalıştır", type="primary", key="nlp_run_btn"):
    if not st.session_state.nlp_user_input.strip():
        st.session_state.nlp_analysis_result = None
        st.session_state.nlp_analysis_error = "Lütfen analiz edilecek bir metin girin."
    else:
        with st.spinner("Metin işleniyor, konum çıkartılıyor..."):
            try:
                result = pipeline.process_tweet(st.session_state.nlp_user_input)
                st.session_state.nlp_analysis_result = result
                st.session_state.nlp_analysis_error = None if result else "Bu girdi, afet yönetim çerçevesine uymadığı için (Alakasız) reddedildi."
                if result:
                    added_record = add_incident_record(st.session_state.nlp_user_input, result)
                    st.session_state.nlp_last_incident_id = added_record["id"]
            except Exception as exc:
                st.session_state.nlp_analysis_result = None
                st.session_state.nlp_analysis_error = str(exc)

if st.session_state.nlp_analysis_error:
    st.warning(st.session_state.nlp_analysis_error)

result = st.session_state.nlp_analysis_result
if result:
    import folium
    from streamlit_folium import st_folium

    col1, col2 = st.columns([1, 1])
    with col1:
        st.success("✅ Veri İşleme Başarılı!")
        st.metric("Tespit Edilen Kategori", result["kategori"])
        st.metric("Model Güven Skoru", f"%{result['guven_skoru'] * 100:.1f}")

        aciliyet = result["aciliyet"]
        st.metric("P-5 Aciliyet Seviyesi (1-5)", aciliyet)
        if aciliyet >= 4:
            st.error("⚠️ KRİTİK ACİLİYET DURUMU. Önceliklendirme Gereklidir.")
        elif aciliyet == 3:
            st.warning("🚧 Rota Bildirimi. Lojistik ve Ulaşım Algoritmaları Tetiklenmelidir.")

    with col2:
        st.markdown("### 📡 Düşük Bant Genişliği İletim Formatı (P-5 JSON V1)")
        st.code(json.dumps(result, ensure_ascii=False, indent=4), language="json")

    st.markdown("### 🌍 Varlık Çıkarımı (NER) ve Uzamsal Haritalama")
    coords = result.get("konum")
    location_text = result.get("konum_metin")
    location_quality = assess_location_quality(st.session_state.nlp_user_input, result)
    map_center = location_quality["harita_merkezi"]
    if map_center:
        if location_text:
            st.caption(f"Geocoding sorgusu için kullanılan konum metni: `{location_text}`")
        st.info(
            f"Konum durumu: {location_quality['konum_tipi']} | "
            f"Güven: {location_quality['konum_guveni']} | "
            f"Merkez: {map_center[0]}, {map_center[1]}"
        )
        zoom_level = 15 if location_quality["konum_tipi"] == "Net konum" else 11
        m = folium.Map(location=map_center, zoom_start=zoom_level)
        if location_quality["konum_tipi"] == "Net konum":
            folium.Marker(map_center, popup=result["kategori"], tooltip="Tespit Edilen Net Konum").add_to(m)
        else:
            radius_m = int((location_quality["etki_yaricapi_km"] or 5) * 1000)
            folium.Circle(
                location=map_center,
                radius=radius_m,
                color="#f57c00",
                fill=True,
                fill_opacity=0.18,
                popup=f"{result['kategori']} - Tahmini etki alani",
                tooltip=f"Tahmini alan ({location_quality['etki_yaricapi_km']} km)",
            ).add_to(m)
        st_folium(m, height=400, use_container_width=True, key="nlp_map")
    else:
        st.info("Bu metin içerisinde açık bir konum bilgisine rastlanmadı. Operasyon panelinde konum yok olarak işaretlenecek.")

    location_candidates = result.get("konum_adaylari") or []
    if location_candidates:
        st.caption("Çıkarılan konum adayları: " + " | ".join(location_candidates))
    if st.session_state.get("nlp_last_incident_id"):
        st.success(f"Operasyon kuyruğuna eklendi: {st.session_state.nlp_last_incident_id}")

with st.sidebar:
    st.markdown("---")
    st.markdown("### Mimari Bileşenler")
    st.caption("- Zemberek NLP Modülü (Zeyrek)")
    st.caption("- Sınıflandırma Modeli: Hugging Face / DISASTER_MODEL_NAME")
    st.caption("- HuggingFace: yhaslan/turkish-earthquake-tweets-ner")
    st.caption("- GeoPy & Folium (Harita)")

