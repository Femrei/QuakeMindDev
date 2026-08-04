"""QuakeMind PostGIS Spatial Engine Manager

Provides ultra-fast PostGIS R-Tree spatial indexing (ST_DWithin, ST_Distance, pgRouting)
for AFAD safe assembly points, road blockages, and SOS alert persistence, with intelligent
offline fallback to in-memory dataset if PostgreSQL/PostGIS server is offline.

Uses a small threaded connection pool (safe for FastAPI's sync routes, which run on
Starlette's worker thread pool) instead of opening a fresh TCP+auth connection per call,
plus a connect timeout and a server-side per-query statement timeout so a slow/degraded
database can't hang a request thread indefinitely.
"""

import os
import json
import time
from contextlib import contextmanager
from pathlib import Path
from typing import List, Dict, Any, Optional

try:
    import psycopg2
    from psycopg2 import pool as psycopg2_pool
    from psycopg2.extras import RealDictCursor
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False

POSTGIS_URL = os.getenv("POSTGIS_URL", "postgresql://postgres:postgres@localhost:5432/quakemind_db")
POSTGIS_CONNECT_TIMEOUT_S = int(os.getenv("POSTGIS_CONNECT_TIMEOUT_S", "3"))
POSTGIS_STATEMENT_TIMEOUT_MS = int(os.getenv("POSTGIS_STATEMENT_TIMEOUT_MS", "5000"))
POSTGIS_POOL_MIN = int(os.getenv("POSTGIS_POOL_MIN", "1"))
POSTGIS_POOL_MAX = int(os.getenv("POSTGIS_POOL_MAX", "10"))
# While the DB is confirmed down, skip retrying pool creation (and paying the
# full connect timeout) on every single request for this long.
POSTGIS_RETRY_COOLDOWN_S = int(os.getenv("POSTGIS_RETRY_COOLDOWN_S", "10"))


class PostGISManager:
    def __init__(self, db_url: str = POSTGIS_URL):
        self.db_url = db_url
        self.connected = False
        self._pool: "Optional[psycopg2_pool.ThreadedConnectionPool]" = None
        self._last_pool_failure_at: float = 0.0

    def _get_pool(self):
        """Lazily creates the connection pool. Failures aren't cached forever --
        a later call retries once the database comes back up -- but are cooled
        down for POSTGIS_RETRY_COOLDOWN_S so a sustained outage doesn't make
        every single request pay the full connect timeout."""
        if not PSYCOPG2_AVAILABLE:
            return None
        if self._pool is not None:
            return self._pool
        if self._last_pool_failure_at and (time.monotonic() - self._last_pool_failure_at) < POSTGIS_RETRY_COOLDOWN_S:
            return None
        try:
            self._pool = psycopg2_pool.ThreadedConnectionPool(
                POSTGIS_POOL_MIN,
                POSTGIS_POOL_MAX,
                dsn=self.db_url,
                connect_timeout=POSTGIS_CONNECT_TIMEOUT_S,
                options=f"-c statement_timeout={POSTGIS_STATEMENT_TIMEOUT_MS}",
            )
            return self._pool
        except Exception as e:
            print(f"PostGIS baglanti havuzu olusturulamadi: {e}")
            self._pool = None
            self._last_pool_failure_at = time.monotonic()
            return None

    @contextmanager
    def _connection(self):
        """Borrows a pooled connection and always returns it, even on error --
        never a bare psycopg2.connect()/close() pair. Every borrowed connection
        starts in autocommit mode so nothing is left mid-transaction when it
        goes back to the pool."""
        pool = self._get_pool()
        if pool is None:
            raise RuntimeError("PostGIS baglanti havuzu kullanilamiyor.")
        conn = pool.getconn()
        try:
            conn.autocommit = True
            yield conn
        except Exception:
            try:
                conn.rollback()
            except Exception:
                pass
            raise
        finally:
            pool.putconn(conn)

    def check_connection(self) -> bool:
        if not PSYCOPG2_AVAILABLE:
            self.connected = False
            return False
        try:
            with self._connection() as conn:
                cur = conn.cursor()
                cur.execute("SELECT PostGIS_Version();")
                version = cur.fetchone()
                cur.close()
            self.connected = True
            print(f"PostGIS veritabani aktif! Surum: {version[0]}")
            return True
        except Exception:
            self.connected = False
            return False

    def init_spatial_tables(self) -> bool:
        """PostGIS eklentisini ve varsayılan mekanik tabloları oluşturur."""
        if not PSYCOPG2_AVAILABLE:
            return False
        try:
            with self._connection() as conn:
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

                # 5. Users Authentication Table
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        id VARCHAR(64) PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        email VARCHAR(255) UNIQUE NOT NULL,
                        password_hash VARCHAR(255) NOT NULL,
                        role VARCHAR(50) NOT NULL DEFAULT 'survivor',
                        city VARCHAR(100) DEFAULT 'Hatay',
                        unit VARCHAR(150) DEFAULT 'Sivil',
                        token VARCHAR(128) UNIQUE NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                    CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
                    CREATE INDEX IF NOT EXISTS idx_users_token ON users (token);
                """)

                cur.close()
            print("PostGIS GIST Mekansal indeksleri, kullanıcılar tablosu ve veritabanı hazırlandı.")
            return True
        except Exception as e:
            print(f"PostGIS tablo olusturma hatasi: {e}")
            return False

    def seed_afad_dataset_to_postgis(self, json_path: Path) -> int:
        """72.232 adet AFAD resmi toplanma alanını PostGIS veritabanına aktarır."""
        if not json_path.exists():
            return 0

        try:
            with open(json_path, encoding="utf-8") as f:
                data = json.load(f)

            with self._connection() as conn:
                cur = conn.cursor()

                # Check existing count
                cur.execute("SELECT COUNT(*) FROM afad_assembly_points;")
                count = cur.fetchone()[0]
                if count >= 50000:
                    print(f"PostGIS AFAD tablosunda zaten {count} kayit mevcut.")
                    cur.close()
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

                inserted = len(insert_rows)
                cur.close()
            print(f"TEBRIKLER! {inserted} adet AFAD resmi toplanma alani PostGIS'e aktarildi!")
            return inserted
        except Exception as e:
            print(f"PostGIS seed yukleme hatasi: {e}")
            return 0

    def query_nearby_postgis(self, lat: float, lon: float, radius_m: float = 10000.0) -> List[Dict[str, Any]]:
        """PostGIS ST_DWithin ve ST_Distance GIST spatial sorgusu çalıştırır."""
        try:
            with self._connection() as conn:
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
            self.connected = True
            return [dict(r) for r in results]
        except Exception as e:
            self.connected = False
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

            inserted = 0
            with self._connection() as conn:
                cur = conn.cursor()
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
            print(f"TEBRIKLER! {inserted} adet OSM acik alan poligonu PostGIS'e aktarildi!")
            return inserted
        except Exception as e:
            print(f"OSM PostGIS ingest hatasi: {e}")
            return 0

    def save_road_blockage(self, blockage_id: str, reason: str, severity: str,
                            start_lat: float, start_lon: float, end_lat: float, end_lon: float) -> bool:
        """Persists a reported road blockage as a PostGIS LineString."""
        try:
            wkt = f"LINESTRING({start_lon} {start_lat}, {end_lon} {end_lat})"
            with self._connection() as conn:
                cur = conn.cursor()
                cur.execute("""
                    INSERT INTO road_blockages (id, title, severity, geom)
                    VALUES (%s, %s, %s, ST_SetSRID(ST_GeomFromText(%s), 4326));
                """, (blockage_id, reason, severity, wkt))
                cur.close()
            return True
        except Exception as e:
            print(f"PostGIS blockage insert error: {e}")
            return False

    def save_user_db(self, user: Dict[str, Any]) -> bool:
        """Kullanıcı kaydını PostgreSQL/PostGIS veritabanına kalıcı kaydeder."""
        try:
            with self._connection() as conn:
                cur = conn.cursor()
                cur.execute("""
                    INSERT INTO users (id, name, email, password_hash, role, city, unit, token)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (email) DO UPDATE SET
                        name = EXCLUDED.name,
                        password_hash = EXCLUDED.password_hash,
                        role = EXCLUDED.role,
                        city = EXCLUDED.city,
                        unit = EXCLUDED.unit,
                        token = EXCLUDED.token;
                """, (
                    user["id"],
                    user["name"],
                    user["email"],
                    user.get("password", "password123"),
                    user["role"],
                    user.get("city", "Hatay"),
                    user.get("unit", "Sivil"),
                    user["token"]
                ))
                cur.close()
            return True
        except Exception as e:
            print(f"PostgreSQL user save error: {e}")
            return False

    def get_user_by_email_db(self, email: str) -> Optional[Dict[str, Any]]:
        """E-posta ile PostgreSQL'den kullanıcı kaydını getirir."""
        try:
            with self._connection() as conn:
                cur = conn.cursor(cursor_factory=RealDictCursor)
                cur.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(%s);", (email.strip(),))
                row = cur.fetchone()
                cur.close()
            return dict(row) if row else None
        except Exception as e:
            print(f"PostgreSQL user query error: {e}")
            return None

    def get_user_by_token_db(self, token: str) -> Optional[Dict[str, Any]]:
        """Token ile PostgreSQL'den kullanıcı kaydını getirir."""
        try:
            with self._connection() as conn:
                cur = conn.cursor(cursor_factory=RealDictCursor)
                cur.execute("SELECT * FROM users WHERE token = %s;", (token.strip(),))
                row = cur.fetchone()
                cur.close()
            return dict(row) if row else None
        except Exception as e:
            print(f"PostgreSQL user query error: {e}")
            return None


# Singleton Instance
postgis_engine = PostGISManager()
