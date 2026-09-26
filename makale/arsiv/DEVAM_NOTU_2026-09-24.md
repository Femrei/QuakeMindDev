# QuakeMind Makalesi — Oturum Devam Notu (2026-09-24)

Bu dosya, bu makinede (iş yeri) yapılan uzun bir Claude Code oturumunun tam özetidir.
Amaç: eve/başka bir bilgisayara geçtiğinde Claude'a bu dosyayı gösterip ("DEVAM_NOTU
dosyasını oku, oradan devam et" de yeter) kaldığımız yerden devam edebilmek. Ayrıntılı
madde takibi için hâlâ `DURUM.md` tek kaynak; bu dosya yalnızca **bu oturumda ne
yapıldığını ve ortamın nasıl kurulacağını** anlatır.

---

## 1. Bu oturumda büyük resim ne oldu

1. Kullanıcı iki Kaggle veri seti verdi: Furkan'ın eğittiği 10 mimarilik model
   koşumunun ham çıktıları (`furkanemrence/quakemind-rapor-paketi`) ve model
   ağırlıkları (`furkanemrence/quakemind-modeller`). Bunlar indirildi, incelendi.
2. Bu veriyle makaledeki eksiklerle karşılaştırma yapıldı, **kapatılabilecek her şey
   docx'e işlendi**: Tablo 6/12/13, Şekil 7/8 tamamen yeniden üretildi; dış sınamalar
   (HOTOSM/QQB/MEDBFS) ve TE23D karşılaştırması yeni paragraflarla eklendi;
   UPerNet/ConvNeXt-S/QQB/HOTOSM için 4 yeni kaynakça girdisi ([65]-[68]) eklendi.
3. Ardından **"GPU/Furkan olmadan birlikte ne yapabiliriz"** planı çıkarıldı (plan
   dosyası: `~/.claude/plans/staged-stirring-rocket.md`, kalıcı değil — bu makineye
   özel). Üç paralel kod taraması yapıldı, bulgular ve uygulamalar:
   - Wilcoxon istatistiksel anlamlılık testi yazıldı ve koşuldu (rota + risk skoru).
   - V₀ karo kalite eşiği (`tile_quality_score`) koda eklendi.
   - `requirements.txt` düzeltmesi, DURUM.md'deki birkaç yanlış kayıt düzeltildi.
   - Lisans e-postası taslakları hazırlandı.
   - B-6 kullanıcı kararları (30/31/32/33) netleştirildi.
4. **Faz 3'e geçildi:** Bölüm C'nin 4 uygulama ekran görüntüsü için backend+frontend
   yerelde ayağa kaldırıldı. Bu makineye **Node.js, Python 3.12, Playwright+Chromium
   kuruldu** (aşağıda ayrıntı — yeni makinede bunlar YOK, yeniden kurulması gerekir).
   Risk Skoru ve NLP ekranlarının gerçek ekran görüntüleri alındı ve
   `makale/sekiller_hazir/` klasörüne kaydedildi. **Henüz docx'e gömülmedi.**

---

## 2. Şu an tam olarak nerede kaldık

### Docx (`makale/QuakeMind_Makale_Taslak_..._LOCAL_2026-09-21.docx`)
Kaggle verisiyle kapatılabilecek her şey işlendi (bkz. `DURUM.md` Bölüm A2/A3).
Eski hâli `makale/arsiv/..._YEDEK_2026-09-24_kaggle-oncesi.docx` içinde duruyor.

### Faz 3 — uygulama ekran görüntüleri (BÖLÜM C, Şekil 21-24)
| # | Ekran | Durum | Dosya |
|---|---|---|---|
| 1 | Çatlak/Hasar Tespit (Şekil 21) | ❌ **Yapılmadı** — gerçek bir çatlak/bina hasarı fotoğrafı gerekiyor, kullanıcı henüz vermedi | — |
| 2 | Risk Skoru (Şekil 22) | ✅ **Çekildi**, docx'e henüz gömülmedi | `makale/sekiller_hazir/2_risk_skoru.png` |
| 3 | NLP + Harita (Şekil 23) | ✅ **Çekildi**, docx'e henüz gömülmedi | `makale/sekiller_hazir/3_nlp_harita.png` |
| 4 | Isı Haritası + Güvenli Güzergah (Şekil 24) | ❌ **Yapılmadı** — güzergah kısmı PostGIS'siz de çalışır (denenmedi), tam ısı haritası noktaları için yerel PostgreSQL+PostGIS kurulumu gerekir | — |

**Kozmetik not:** Ekran görüntülerinde harita zemin katmanı "API KEY REQUIRED"
filigranı gösteriyor (Carto tile sağlayıcısı ücretsiz API anahtarı istiyor). Veri
gerçek ve doğru, yalnız zemin haritası placeholder. İstenirse `folium`/Leaflet tile
URL'si ücretsiz bir sağlayıcıyla (ör. OpenStreetMap standart tile) değiştirilebilir —
`QuakeMindBackend` içinde CartoDB tile URL'si kullanılan yerleri arayın.

### Sıradaki adımlar (öncelik sırasıyla)
1. Kullanıcıdan gerçek bir çatlak/bina hasarı fotoğrafı al → Şekil 21'i çek.
2. Isı haritası + güvenli güzergah ekranını dene (PostGIS'siz, yalnız `/safe_route`).
   Kod: `QuakeMindBackend/capture_app_screenshots.py` içine üçüncü bir blok eklenecek.
3. 2-4 arası hazır/çekilecek görselleri docx'e Şekil 21-24 olarak Türkçe alt yazıyla
   göm (Bölüm C'deki hedef konumlar: 3.2, 4.11, 3.6/4.10, Sistem tanıtımı/4.5).
4. `DURUM.md` Bölüm C'yi ve B-2/B-anaylsis kalan maddelerini güncelle.
5. Faz 4 (isteğe bağlı, düşük öncelik): kayıp `_j22_calibration.py`'yi yeniden yaz.

---

## 3. Yeni makinede ortamı yeniden kurma (hiçbiri kalıcı değil, hepsi bu makineye özel)

Bu makinede şunlar kuruldu ama **git'e girmiyor, yeni makinede yok**:

```powershell
# 1) Node.js LTS (quakemind-web / Next.js için)
winget install OpenJS.NodeJS.LTS

# 2) Python 3.12 (backend bağımlılıkları — torch/catboost/osmnx/geopandas —
#    sistemdeki Python 3.14'te cykhash/pyrosm derleme hatası veriyor, MSVC gerektiriyor)
winget install Python.Python.3.12

# 3) Backend venv (pyrosm'u DIŞARIDA bırak — yalnız çevrimdışı bir OSM indirme
#    scriptinde kullanılıyor, canlı API'de hiç yok, cykhash derleme hatası veriyor)
cd QuakeMindBackend
<python3.12> -m venv venv
./venv/Scripts/python.exe -m pip install -r requirements.txt nltk psycopg2-binary --no-deps-for-pyrosm
# (requirements.txt'te pyrosm satırını atlayarak kur, ya da grep -v ile filtrele)
./venv/Scripts/python.exe -c "import nltk; nltk.download('stopwords')"

# 4) Backend'i başlat (ilk çalıştırmada BERTurk/SegFormer HuggingFace'ten
#    indiriliyor — ~1.5-2 GB, birkaç dakika sürebilir, internet gerekir)
./venv/Scripts/python.exe fastapi_app.py
# Health check: curl http://127.0.0.1:8000/  -> {"status":"ok",...}

# 5) Frontend
cd ../quakemind-web
npm install
npm run dev
# http://localhost:3000/login -> "Demo Hesaplarla Hızlı Giriş" -> "Afet Saha Ekibi"

# 6) Playwright (ekran görüntüsü otomasyonu için, ayrı venv önerilir)
cd ..
<python3.12> -m venv .playwright_venv
./.playwright_venv/Scripts/python.exe -m pip install playwright
./.playwright_venv/Scripts/python.exe -m playwright install chromium
./.playwright_venv/Scripts/python.exe QuakeMindBackend/capture_app_screenshots.py
```

**Önemli:** İlk backend çalıştırmasında NLP modeli (BERTurk sınıflandırma + NER)
"lazy" yükleniyor ve HuggingFace'ten indiriliyor — ilk NLP isteği ~2-3 dakika
sürebilir (sonraki istekler önbellekten hızlı olur, ama her istekte modelin
yeniden "loaded lazily" yazdığını gördük — muhtemelen singleton değil, performans
sorunu olabilir, henüz araştırılmadı). Risk skoru isteği hızlıdır (CatBoost startup'ta
zaten eğitiliyor).

**PATH notu (Windows/Git Bash):** winget ile kurulan Node.js, aynı terminal
oturumunda PATH'e otomatik yansımayabilir; yeni bir terminal açmak ya da
`export PATH="/c/Program Files/nodejs:$PATH"` yeterli.

---

## 4. Bu oturumda eklenen/değişen dosyalar (kalıcı, git'te)

- `makale/QuakeMind_Makale_Taslak_..._LOCAL_2026-09-21.docx` — ana taslak, büyük
  güncelleme.
- `makale/arsiv/..._YEDEK_2026-09-24_kaggle-oncesi.docx` — Kaggle-öncesi yedek.
- `makale/DURUM.md` — tek kaynak durum dosyası, bu oturumda çok güncellendi.
- `makale/EGITIM_SONRASI_GUNCELLENECEKLER.md` — uygulandı işareti eklendi.
- `makale/lisans_epostalari_taslak.md` — TE23D/TUE-CD lisans e-posta taslakları.
- `makale/sekiller_hazir/2_risk_skoru.png`, `3_nlp_harita.png` — çekilen ekran
  görüntüleri (docx'e henüz gömülmedi).
- `QuakeMindBackend/apps/road_damage/utils/inference.py` — `tile_quality_score()`
  eklendi (V₀).
- `QuakeMindBackend/capture_app_screenshots.py` — Playwright ekran görüntüsü
  otomasyon script'i (yeniden çalıştırılabilir).
- `QuakeMindBackend/requirements.txt`, `apps/earthquake_risk/requirements.txt` —
  scipy/xgboost/lightgbm eklendi.
- `model_benchmarks/06_rota/real_run/wilcoxon_test.py` + `results/wilcoxon_test_results.json`
- `model_benchmarks/05_risk_skoru/local_run/wilcoxon_test.py` + `results/wilcoxon_test_results.json`
- `.gitignore` — `.playwright_venv/`, `**/apps/models/` eklendi.

## 5. Kaggle indirilen ham veri (bu makinenin scratchpad'inde, GİT'TE DEĞİL)

`furkanemrence/quakemind-rapor-paketi` zip'i ve açılmış hâli yalnız bu oturumun
geçici klasöründe duruyor, yeni makinede yok. Gerekirse aynı Kaggle linkinden
tekrar indirilebilir (herkese açık, kimlik doğrulama gerektirmiyor — bkz. bu
konuşmanın başındaki indirme adımları). Docx'e işlenecek her şey zaten işlendi;
yeniden indirmek yalnız ham koşu kayıtlarına (`kosu_kayitlari/`) tekrar bakmak
gerekirse lazım olur.
