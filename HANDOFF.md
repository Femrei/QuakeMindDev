# 🛸 QuakeMind Proje Devir ve Bağlam Dokümanı (HANDOFF.md)

Bu doküman, **QuakeMind** projesinin mevcut mimarisini, yapılan tüm geliştirmeleri, teknik kararları, gelecek planlarını ve sohbetler arası bağlamı (context) kaybetmemek için hazırlanmış **ana rehberdir**.

---

## 📌 1. Proje Özeti ve Bağlamı (Context)

- **Proje Adı:** QuakeMind - Afet İkaz, Karar Destek & Yapay Zeka Platformu
- **Amaç:** Deprem ve afet anlarında internetli veya internetsiz (Hotspot / P2P Mesh) ortamlarda çalışan; uydudan yol hasarı tespit eden, sosyal medya mesajlarından adres ve aciliyet çıkaran, deprem risk skorlarını hesaplayan ve acil SOS sinyallerini ekiplere ileten bütünleşik afet ekosistemi.
- **Aktif Git Depoları:**
  - **Ana Depo (Upstream):** `https://github.com/UtBird/QuakeMind.git`
  - **Geliştirici Deposu (Origin):** `https://github.com/Femrei/QuakeMindDev.git`

---

## 🟢 2. Tamamlanan ve Çalışan Sistemler (Phase 1)

### 🖥️ A. Modern Next.js 15 Web Platformu (`quakemind-web/`)
- **Teknoloji:** Next.js 14/15 (App Router, TypeScript), Tailwind CSS, React-Leaflet (60 FPS GPU Harita), Shadcn UI bileşen dili, Framer Motion animasyonları, Recharts grafik kütüphanesi.
- **Erişim Adresi:** `http://localhost:3000`
- **Çift Portallı (Dual-Portal) UI/UX Mimarisi:**
  1. 🔴 **Vatandaş & Afetzede Portalı (`/survivor`):**
     - Tek tıkla GPS destekli **Dev SOS Sinyali Gönderme**.
     - Konuma en yakın güvenli sığınağı bulma ve **yeşil navigasyon rotası çizimi**.
     - Acil malzeme talebi oluşturma (Su, Gıda, Çadır, İlaç).
     - Gece uyumlu, yüksek kontrastlı (WCAG AAA) ve 0.1 saniye karar süreli sade tasarım.
  2. 🔵 **Arama-Kurtarma & Ekip Komuta Portalı (`/command`):**
     - **War Room Dashboard (`/command`):** 60 FPS canlı harita, 4 metrik kartı, canlı ihbar akışı.
     - **SOS Sevk Yönetimi (`/command/sos`):** İhbarları harita üzerinde görme ve durum güncelleme (*Açık $\rightarrow$ Yolda $\rightarrow$ Kurtarıldı*).
     - **Uydu Yol Hasarı & Lojistik Analiz (`/command/road-damage`):** Segformer AI parametre paneli, **Açık Yollar (Yeşil), Kapalı Yollar (Kırmızı) ve Güvenli Konvoy Rotası (Mavi)** haritası.
     - **Deprem Risk & Fay Hattı (`/command/risk`):** CatBoost 81 il risk skorları, turuncu fay hatları ve büyüklük bazlı renkli deprem iğneleri.
     - **Afet Metin NLP (`/command/nlp`):** BERTurk P-5 aciliyet seviye göstergesi, adres çıkarma (NER) ve geocoding.
     - **Kamera Tespiti (`/command/camera`):** Canlı kamera tuvalinde bina çatlak ve yapısal bütünlük izleme.
  3. 🌟 **Onboarding Akışı (`/onboarding`):** 3 adımlı rol seçimi, bölge seçimi ve sunucu test simülasyonu.
  4. 🔐 **Firebase Auth Hazır Giriş Sayfası (`/login`):** Rol bazlı kimlik doğrulama arayüzü.

### ⚙️ B. FastAPI Yapay Zeka Backend (`QuakeMindBackend/fastapi_app.py`)
- **Erişim Adresi:** `http://127.0.0.1:8000` (Swagger UI: `http://127.0.0.1:8000/docs`)
- **CORS Middleware:** Next.js (`http://localhost:3000`) erişimi için etkinleştirildi (`allow_origins=["*"]`).
- **Yapay Zeka Modelleri & Otomatik İndirme (HuggingFace Auto-Download):**
  - **Uydu Yol Hasarı:** Segformer MIT-B4 (`Utbird/dispath_optimized_mitb4_focal_dice30`)
  - **Afet NLP:** BERTurk (`Utbird/EqTwitterTr`) & NER (`yhaslan/turkish-earthquake-tweets-ner`)
  - **Deprem Riski:** CatBoost & `query.csv`
  - *Not:* Ağır model ağırlıkları (>100MB) `.gitignore` listesindedir; yerelde yoksa kod HuggingFace Hub'dan otomatik indirir!

---

## 🚀 3. Gelecek Planlar ve Yol Haritası (Phase 2)

### 🔥 A. Firebase Entegrasyonu (Auth & Bildirimler)
1. **Firebase Authentication:** E-posta/Şifre, Google Sign-In ve afet durumları için **SMS ile Telefon Numarası Doğrulaması**.
2. **Firebase Cloud Messaging (FCM - Push Notifications):**
   - Yeni bir Kritik SOS düştüğünde veya M>4.5 deprem olduğunda sahadaki tüm ekibin telefonlarına ve web paneline **sesli/animasyonlu canlı bildirim** düşürme.
3. **Firestore / Realtime Database:** Web Komuta Merkezi ile Flutter Mobil uygulaması arasında canlı SOS konumlarını ve durum güncellemelerini anlık senkronize etme.

### 🐘 B. PostGIS & Mekânsal Veritabanı Katmanı
1. PostgreSQL 16 + PostGIS 3 + `pgRouting` sunucu kurulumu.
2. Vektörel yol ağlarında `pgr_dijkstra` ile milisaniyelik çevrimdışı (offline) rota hesabı.
3. En yakın SOS kayıtları için `<->` KNN ve `ST_DWithin` sorguları.
4. **Hibrit Fallback:** PostGIS kapalıysa sistemin otomatik varsayılan `NetworkX` modunda çalışmaya devam etmesi.

---

## 💡 4. Önemli Teknik İpuçları & Komutlar

- **Web Sunucusunu Başlatma:**
  ```bash
  cd quakemind-web
  npm run dev
  ```
- **Backend Sunucusunu Başlatma:**
  ```bash
  cd QuakeMindBackend
  ..\venv\Scripts\python.exe fastapi_app.py
  ```
- **Git Push Komutu:**
  ```bash
  git add .
  git commit -m "feat: your commit message"
  git push upstream main
  ```
