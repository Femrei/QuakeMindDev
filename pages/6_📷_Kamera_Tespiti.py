import streamlit as st
from core import *
import subprocess
import sys

st.set_page_config(page_title="Kamera Tespiti", layout="wide")
boot_resources()
st.markdown(
    """
    <style>
    .camera-panel {
        background: linear-gradient(180deg, #101c17 0%, #183126 100%);
        color: #f3f7f4;
        border-radius: 16px;
        padding: 1rem 1.2rem;
        margin-bottom: 1rem;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

st.markdown(
    '<div class="camera-panel"><h1>Kamera Tespiti</h1><p>Bu uygulama canli kamera akisinda catlak ve bina durumu modellerini ayri pencerelerde calistirir. Deprem risk akisindan bagimsizdir ve apps/camera_detection altina ayrildi.</p></div>',
    unsafe_allow_html=True,
)

if "camera_feature_status" not in st.session_state:
    st.session_state.camera_feature_status = "Hazır"

with st.sidebar:
    st.markdown("---")
    st.markdown("### Kamera Tespiti")
    detection_mode = st.radio(
        "Tespit Modu Seçin",
        ["Çatlak Tespiti", "Bina Durumu", "Her İkisi"],
        index=2,
        key="camera_mode_selection"
    )
    
    # Mode mapping
    mode_map = {
        "Çatlak Tespiti": "crack",
        "Bina Durumu": "building",
        "Her İkisi": "both"
    }
    selected_mode = mode_map[detection_mode]

    launch_camera = st.button("📷 Kamera Tespitini Baslat", type="primary", key="camera_feature_launch")

with temporary_sys_path(CAMERA_ROOT):
    from app import get_camera_model_paths

model_paths = get_camera_model_paths()

info_cols = st.columns(2)
info_cols[0].metric("Crack model", model_paths["crack_detection"].name)
info_cols[1].metric("Building model", model_paths["building_detection"].name)

st.write("Kullanilan model dosyalari:")
st.write(f"- `{model_paths['crack_detection']}`")
st.write(f"- `{model_paths['building_detection']}`")
st.caption("Uygulama OpenCV pencereleri acarak calisir. Cikmak icin kamera penceresinde `q` tusuna basin.")

if launch_camera:
    try:
        # Ayrı bir işlem olarak başlatıyoruz (Subprocess)
        script_path = CAMERA_ROOT / "camera_manager.py"
        python_exe = sys.executable  # Mevcut venv'deki python
        
        subprocess.Popen(
            [python_exe, str(script_path), "--mode", selected_mode],
            cwd=str(CAMERA_ROOT),
            creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == "win32" else 0
        )
        st.session_state.camera_feature_status = f"{detection_mode} baslatildi"
        st.success(f"{detection_mode} baslatildi. Lutfen yeni acilan pencereleri kontrol edin.")
    except Exception as exc:
        st.error(f"Kamera baslatilamadı: {exc}")


status_cols = st.columns(2)
status_cols[0].caption(f"Durum: {st.session_state.camera_feature_status}")


