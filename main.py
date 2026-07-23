import streamlit as st
from core import boot_resources, show_boot_errors

st.set_page_config(page_title="QuakeMind", page_icon="🌍", layout="wide", initial_sidebar_state="expanded")

boot_resources()
show_boot_errors()

st.title("🌍 QuakeMind Unified Console")
st.markdown("""
QuakeMind, afet öncesi ve sonrasındaki operasyonları yapay zeka ile hızlandıran entegre bir platformdur.

Sol taraftaki menüden kullanmak istediğiniz modülü seçebilirsiniz:

- **🛰️ Uydu Hasar Analizi:** Segformer modeli ile uydu görüntülerinden hasarlı yolları tespit eder.
- **📝 Afet NLP:** BERTurk tabanlı modellerle sosyal medya ihbarlarını analiz eder ve sınıflandırır.
- **📈 Deprem Risk Paneli:** CatBoost ile bölgesel ve anlık deprem riskini ölçer.
- **🚑 Acil Operasyon Merkezi:** Afet ihbarlarını ve ekipleri harita üzerinde canlı yönetir.
- **🛠️ Yönetici Paneli:** Toplanma alanlarını (Safe Areas) harita üzerinde interaktif olarak belirler.
- **📷 Kamera Tespiti:** Canlı kamera akışından çatlak ve bina hasarlarını tespit eder.
- **🚨 Deprem İkaz Sistemi:** Deprem İkaz Algoritması ile sismik veri analizi, konum tabanlı alarm seviyeleri ve sesli siren uyarısı ile en yakın toplanma alanlarına rotalama sağlar.
""")

st.info("👆 Lütfen sol menüden bir modül seçin.")
