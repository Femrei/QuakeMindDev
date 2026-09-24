"""Bolum C ekran goruntulerini yerel backend+frontend'den ceker.

On kosul: backend http://127.0.0.1:8000, frontend http://localhost:3000 calisiyor
olmali (bkz. makale/DEVAM_NOTU_2026-09-24.md kurulum adimlari). Playwright ayri bir
venv'de kurulu olmali:
    <python3.12> -m venv .playwright_venv
    ./.playwright_venv/Scripts/python.exe -m pip install playwright
    ./.playwright_venv/Scripts/python.exe -m playwright install chromium

Calistirma (repo kokunden):
    ./.playwright_venv/Scripts/python.exe QuakeMindBackend/capture_app_screenshots.py

Ciktilar makale/sekiller_hazir/ altina yazilir (2_risk_skoru.png, 3_nlp_harita.png).
Catlak tespiti (1_catlak_tespit.png) icin gercek bir foto gerektigi ve isi
haritasi+guzergah (4_isi_haritasi_guzergah.png) icin PostGIS kurulumu gerekebilecegi
icin bu ikisi burada henuz otomatiklestirilmedi -- DEVAM_NOTU'ndaki sirada yapilacak
adim olarak isaretlendi.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path(__file__).resolve().parent.parent / "makale" / "sekiller_hazir"
OUT.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1600, "height": 1000})
    page.goto("http://localhost:3000/login", wait_until="load", timeout=60000)
    page.click("text=Demo Hesaplarla Hızlı Giriş (Test Amaçlı)")
    page.wait_for_timeout(500)
    page.click("text=Afet Saha Ekibi")
    page.wait_for_url("**/command**", timeout=15000)
    page.wait_for_timeout(1500)
    print("Logged in, current url:", page.url)

    # --- Risk skoru (Sekil 22) ---
    page.goto("http://localhost:3000/command/risk", wait_until="load", timeout=60000)
    page.wait_for_timeout(1000)
    page.click("text=Deprem Riskini Hesapla")
    page.wait_for_selector("text=/100", timeout=60000)
    page.wait_for_timeout(1500)
    page.screenshot(path=str(OUT / "2_risk_skoru.png"), full_page=True)
    print("risk screenshot saved ->", OUT / "2_risk_skoru.png")

    # --- NLP (Sekil 23) ---
    page.goto("http://localhost:3000/command/nlp", wait_until="load", timeout=60000)
    page.wait_for_timeout(1000)
    page.click("text=NLP İhbar Analizini Çalıştır")
    page.wait_for_selector("text=Yapay Zeka Analiz Çıktısı", timeout=60000)
    page.wait_for_timeout(1500)
    page.screenshot(path=str(OUT / "3_nlp_harita.png"), full_page=True)
    print("nlp screenshot saved ->", OUT / "3_nlp_harita.png")

    # TODO: 1_catlak_tespit.png -- gercek bir fotograf verildikten sonra
    #   /command/camera sayfasinda dosya yukleme input'unu bulup set_input_files()
    #   ile yukle, tespit sonucunu bekle, screenshot al.
    # TODO: 4_isi_haritasi_guzergah.png -- /command/road-damage sayfasinda
    #   safe_route akisini dene (PostGIS'siz de calisir, internet/OSMnx gerekir).

    browser.close()
