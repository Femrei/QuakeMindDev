"""PostGIS Initializer & AFAD Dataset Ingestion Script

Run this script after starting your PostgreSQL/PostGIS server to automatically:
1. Enable PostGIS spatial extensions.
2. Create GIST spatial indexed tables.
3. Ingest all 72,232 official AFAD assembly points.
"""

import sys
from pathlib import Path

# Add parent dir to sys.path
BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from utils.postgis_manager import postgis_engine

def main():
    print("🐘 QuakeMind PostGIS Mekânsal Veritabanı Kurulumu Başlatılıyor...")
    
    if not postgis_engine.check_connection():
        print("❌ PostgreSQL/PostGIS veritabanına bağlanılamadı!")
        print("💡 İpucu: Docker Desktop uygulamasını başlatın veya PostgreSQL servisinin 5432 portunda açık olduğundan emin olun.")
        print(f"🔗 Bağlantı URL: {postgis_engine.db_url}")
        sys.exit(1)

    print("1. Mekânsal Tablolar & GIST İndeksleri Oluşturuluyor...")
    success = postgis_engine.init_spatial_tables()
    if not success:
        print("❌ PostGIS tablo kurulumu başarısız!")
        sys.exit(1)

    print("2. 72.232 Adet AFAD Resmi Toplanma Alanı PostGIS'e Aktarılıyor...")
    afad_json = BACKEND_DIR / "apps" / "road_damage" / "data" / "tum_turkiye_toplanma_alanlari.json"
    inserted = postgis_engine.seed_afad_dataset_to_postgis(afad_json)
    
    print(f"🎉 PostGIS Kurulumu Tamamlandı! Toplam {inserted} nokta mekanik indekslendi.")

if __name__ == "__main__":
    main()
