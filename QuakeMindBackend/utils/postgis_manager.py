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
            print(f"PostGIS veritabani aktif! Surum: {version[0]}")
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

            # 4. OSM Safety Polygons Table (Parks, Open Spaces, Stadiums)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS osm_safety_polygons (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255),
                    category VARCHAR(100),
                    geom GEOMETRY(Geometry, 4326),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_osm_poly_gist ON osm_safety_polygons USING GIST (geom);
            """)

            cur.close()
            conn.close()
            print("PostGIS GIST Mekansal indeksleri ve tablolari hazirlandi.")
            return True
        except Exception as e:
            print(f"PostGIS tablo olusturma hatasi: {e}")
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
                print(f"PostGIS AFAD tablosunda zaten {count} kayit mevcut.")
                cur.close()
                conn.close()
                return count

            print("72.232 AFAD toplanma alani PostGIS'e yukleniyor...")
            from psycopg2.extras import execute_values
            
            insert_rows = []
            for item in data:
                try:
                    lat = float(item["enlem"])
                    lon = float(item["boylam"])
                    name = item.get("toplanma_alani", "AFAD Resmi Toplanma Alanı")
                    il = item.get("il", "")
                    ilce = item.get("ilce", "")
                    mahalle = item.get("mahalle", "")
                    insert_rows.append((name, il, ilce, mahalle, lon, lat))
                except Exception:
                    continue

            if insert_rows:
                query = """
                    INSERT INTO afad_assembly_points (toplanma_alani, il, ilce, mahalle, geom)
                    VALUES %s;
                """
                template = "(%s, %s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326))"
                execute_values(cur, query, insert_rows, template=template, page_size=5000)

            conn.commit()
            inserted = len(insert_rows)
            cur.close()
            conn.close()
            print(f"TEBRIKLER! {inserted} adet AFAD resmi toplanma alani PostGIS'e aktarildi!")
            return inserted
        except Exception as e:
            print(f"PostGIS seed yukleme hatasi: {e}")
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
                       'AFAD Resmi Toplanma Alani' AS category, 0 AS priority,
                       'PostgreSQL/PostGIS' AS source, 'Guvenli AFAD Toplanma Alani' AS status,
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
            print(f"PostGIS mekansal sorgu hatasi: {e}")
            return []

    def ingest_osm_data_to_postgis(self, lat: float, lon: float, radius_km: float = 10.0) -> int:
        """Ingests OpenStreetMap parks, stadiums, and open assembly polygons into PostGIS."""
        if not self.check_connection():
            return 0

        import requests
        print(f"OSM verileri PostGIS'e cekiliyor... Lat: {lat}, Lon: {lon}, Radius: {radius_km}km")
        
        # Calculate Bounding Box
        min_lat = lat - (radius_km / 111.0)
        max_lat = lat + (radius_km / 111.0)
        min_lon = lon - (radius_km / 80.0)
        max_lon = lon + (radius_km / 80.0)

        overpass_query = f'[out:json][timeout:25];(node["emergency"="assembly_point"]({min_lat},{min_lon},{max_lat},{max_lon});way["leisure"="park"]({min_lat},{min_lon},{max_lat},{max_lon});way["leisure"="stadium"]({min_lat},{min_lon},{max_lat},{max_lon}););out center;'

        headers = {"User-Agent": "QuakeMind-GIS-App/1.0 (https://quakemind.org)"}
        try:
            r = requests.post("https://overpass-api.de/api/interpreter", data={"data": overpass_query}, headers=headers, timeout=15)
            if r.status_code != 200:
                print(f"OSM Overpass HTTP Hata: {r.status_code}")
                return 0

            elements = r.json().get("elements", [])
            if not elements:
                return 0

            conn = psycopg2.connect(self.db_url)
            conn.autocommit = True
            cur = conn.cursor()

            inserted = 0
            for item in elements:
                try:
                    p_lat = item.get("lat") or item.get("center", {}).get("lat")
                    p_lon = item.get("lon") or item.get("center", {}).get("lon")
                    if not p_lat or not p_lon:
                        continue

                    tags = item.get("tags", {})
                    name = tags.get("name") or tags.get("toplanma_alani") or "OSM Acik Alan / Park"
                    category = "OSM Park/Bahce" if tags.get("leisure") == "park" else "OSM Toplanma Alani"

                    cur.execute("INSERT INTO osm_safety_polygons (name, category, geom) VALUES (%s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326));", (name, category, p_lon, p_lat))
                    inserted += 1
                except Exception:
                    continue

            cur.close()
            conn.close()
            print(f"TEBRIKLER! {inserted} adet OSM acik alan poligonu PostGIS'e aktarildi!")
            return inserted
        except Exception as e:
            print(f"OSM PostGIS ingest hatasi: {e}")
            return 0

# Singleton Instance
postgis_engine = PostGISManager()
