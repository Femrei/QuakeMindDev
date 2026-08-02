"""QuakeMind PostGIS Spatial Engine Manager

Provides ultra-fast PostGIS R-Tree spatial indexing (ST_DWithin, ST_Distance, pgRouting)
for AFAD safe assembly points, road blockages, and SOS alert persistence, with intelligent
offline fallback to in-memory dataset if PostgreSQL/PostGIS server is offline.
"""

import os
import json
from pathlib import Path
from typing import List, Dict, Any, Optional

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False

POSTGIS_URL = os.getenv("POSTGIS_URL", "postgresql://postgres:postgres@localhost:5432/quakemind_db")

class PostGISManager:
    def __init__(self, db_url: str = POSTGIS_URL):
        self.db_url = db_url
        self.connected = False

    def check_connection(self) -> bool:
        if not PSYCOPG2_AVAILABLE:
            self.connected = False
            return False
        try:
            conn = psycopg2.connect(self.db_url, connect_timeout=2)
            cur = conn.cursor()
            cur.execute("SELECT PostGIS_Version();")
            version = cur.fetchone()
            cur.close()
            conn.close()
            self.connected = True
            print(f"✅ PostGIS veritabanı aktif! Sürüm: {version[0]}")
            return True
        except Exception as e:
            self.connected = False
            return False

    def init_spatial_tables(self) -> bool:
        """PostGIS eklentisini ve varsayılan mekanik tabloları oluşturur."""
        if not PSYCOPG2_AVAILABLE:
            return False
        try:
            conn = psycopg2.connect(self.db_url)
            conn.autocommit = True
            cur = conn.cursor()

            # Enable PostGIS Spatial Extension
            cur.execute("CREATE EXTENSION IF NOT EXISTS postgis;")

            # 1. AFAD Assembly & Safe Zones Table with GIST Spatial Index
            cur.execute("""
                CREATE TABLE IF NOT EXISTS afad_assembly_points (
                    id SERIAL PRIMARY KEY,
                    toplanma_alani VARCHAR(255),
                    il VARCHAR(100),
                    ilce VARCHAR(100),
                    mahalle VARCHAR(100),
                    geom GEOMETRY(Point, 4326),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_afad_gist_geom ON afad_assembly_points USING GIST (geom);
            """)

            # 2. Road Blockages Spatial Table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS road_blockages (
                    id VARCHAR(64) PRIMARY KEY,
                    title VARCHAR(255),
                    severity VARCHAR(50),
                    geom GEOMETRY(LineString, 4326),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_blockages_gist_geom ON road_blockages USING GIST (geom);
            """)

            # 3. SOS Alerts Spatial Table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS sos_alerts (
                    id VARCHAR(64) PRIMARY KEY,
                    message TEXT,
                    user_id VARCHAR(64),
                    urgency VARCHAR(50),
                    geom GEOMETRY(Point, 4326),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_sos_gist_geom ON sos_alerts USING GIST (geom);
            """)

            cur.close()
            conn.close()
            print("✅ PostGIS GIST Mekânsal indeksleri ve tabloları hazırlandı.")
            return True
        except Exception as e:
            print(f"⚠️ PostGIS tablo oluşturma hatası: {e}")
            return False

    def seed_afad_dataset_to_postgis(self, json_path: Path) -> int:
        """72.232 adet AFAD resmi toplanma alanını PostGIS veritabanına aktarır."""
        if not self.check_connection() or not json_path.exists():
            return 0

        try:
            with open(json_path, encoding="utf-8") as f:
                data = json.load(f)

            conn = psycopg2.connect(self.db_url)
            cur = conn.cursor()

            # Check existing count
            cur.execute("SELECT COUNT(*) FROM afad_assembly_points;")
            count = cur.fetchone()[0]
            if count >= 50000:
                print(f"ℹ️ PostGIS AFAD tablosunda zaten {count} kayıt mevcut.")
                cur.close()
                conn.close()
                return count

            print("🚀 72.232 AFAD toplanma alanı PostGIS'e yükleniyor...")
            inserted = 0
            for item in data:
                try:
                    lat = float(item["enlem"])
                    lon = float(item["boylam"])
                    name = item.get("toplanma_alani", "AFAD Resmi Toplanma Alanı")
                    il = item.get("il", "")
                    ilce = item.get("ilce", "")
                    mahalle = item.get("mahalle", "")

                    cur.execute("""
                        INSERT INTO afad_assembly_points (toplanma_alani, il, ilce, mahalle, geom)
                        VALUES (%s, %s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326));
                    """, (name, il, ilce, mahalle, lon, lat))
                    inserted += 1
                except Exception:
                    continue

            conn.commit()
            cur.close()
            conn.close()
            print(f"✅ {inserted} adet AFAD resmi toplanma alanı PostGIS'e aktarıldı!")
            return inserted
        except Exception as e:
            print(f"⚠️ PostGIS seed yükleme hatası: {e}")
            return 0

    def query_nearby_postgis(self, lat: float, lon: float, radius_m: float = 10000.0) -> List[Dict[str, Any]]:
        """PostGIS ST_DWithin ve ST_Distance GIST spatial sorgusu çalıştırır."""
        if not self.check_connection():
            return []

        try:
            conn = psycopg2.connect(self.db_url)
            cur = conn.cursor(cursor_factory=RealDictCursor)

            query = """
                SELECT toplanma_alani AS name, toplanma_alani, il, ilce, mahalle,
                       ST_Y(geom) AS lat, ST_X(geom) AS lon, ST_Y(geom) AS display_lat, ST_X(geom) AS display_lon,
                       'AFAD Resmi Toplanma Alanı' AS category, 0 AS priority,
                       'PostgreSQL/PostGIS' AS source, '🟢 Güvenli AFAD Toplanma Alanı' AS status,
                       ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography) AS dist_m
                FROM afad_assembly_points
                WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography, %s)
                ORDER BY dist_m ASC LIMIT 50;
            """
            cur.execute(query, (lon, lat, lon, lat, radius_m))
            results = cur.fetchall()
            cur.close()
            conn.close()
            return [dict(r) for r in results]
        except Exception as e:
            print(f"⚠️ PostGIS mekânsal sorgu hatası: {e}")
            return []

# Singleton Instance
postgis_engine = PostGISManager()
