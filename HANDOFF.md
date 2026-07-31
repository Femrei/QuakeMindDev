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
  1. 🔴 **Vatandaş & Afetzede Portalı (`/survivor`):** Tek tıkla GPS destekli **Dev SOS Sinyali Gönderme**, en yakın güvenli sığınak bulma, acil malzeme talebi.
  2. 🔵 **Arama-Kurtarma & Ekip Komuta Portalı (`/command`):** War Room Dashboard, SOS Sevk & Ekip atama, Segformer uydu yol analizi, CatBoost deprem riski & fay hatları, BERTurk NLP ihbar madenciliği, Canlı kamera tespiti.
  3. 🌟 **Onboarding Akışı (`/onboarding`):** 3 adımlı karşılama simülasyonu.
  4. 🔐 **Auth Ekranları (`/login`, `/register`):** Rol bazlı giriş ve kayıt ol arayüzleri.

### ⚙️ B. FastAPI Yapay Zeka Backend (`QuakeMindBackend/fastapi_app.py`)
- **Erişim Adresi:** `http://127.0.0.1:8000` (Swagger UI: `http://127.0.0.1:8000/docs`)
- **CORS Middleware:** Next.js (`http://localhost:3000`) erişimi için etkinleştirildi.

---

## 🚀 3. Gelecek Planlar ve Not Alınan Geliştirmeler (Phase 2 Roadmap)

### 🔐 1. Kullanıcı Kayıt & Kimlik Doğrulama (Auth System)
- **FastAPI Endpoints:**
  - `POST /api/auth/register`: Kullanıcı Kaydı (Ad Soyad, E-posta, Şifre, Rol [`survivor` / `responder`], Şehir, Telefon Numarası).
  - `POST /api/auth/login`: Kullanıcı Girişi & JWT Token üretimi.
  - `GET /api/auth/me`: Aktif kullanıcı profili.
- **Next.js Frontend:** `/register` ve `/login` sayfalarının JWT & Firebase Auth altyapısına bağlanması.

### 🔥 2. Firebase Entegrasyonu (Auth & Push Bildirimleri)
- Firebase Auth (SMS OTP ile Telefon Numarası Doğrulaması).
- Firebase Cloud Messaging (FCM): Yeni Kritik SOS ve M>4.5 deprem anlarında mobil ve web tarayıcılarına canlı sesli push bildirim gönderimi.

### 🐘 3. PostGIS & Mekânsal Veritabanı Katmanı
- PostgreSQL 16 + PostGIS 3 + `pgRouting` entegrasyonu (`pgr_dijkstra` ile çevrimdışı rota hesabı).
- En yakın SOS kayıtları için `<->` KNN ve `ST_DWithin` sorguları.

### ⚡ 4. Backend Performans & Hız Optimizasyonları
- API önbellekleme (`lru_cache`), async paralel çıkarım ve JSON serialization hızlandırmaları.

---

## 💡 4. Çalıştırma Komutları

- **Web Sunucusu:** `cd quakemind-web && npm run dev` (Port 3000)
- **Backend Sunucusu:** `cd QuakeMindBackend && ..\venv\Scripts\python.exe fastapi_app.py` (Port 8000)
