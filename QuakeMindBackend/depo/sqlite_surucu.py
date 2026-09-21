"""SQLite surucusu -- yerel gelistirme ve tek makinede calisan kurulum icin.

Tablolar MIMARI.md 3'teki mekansal depoyla ayni isleri gorur; mekansal indeks
yerine basit sinir kutusu suzmesi ve haversine mesafesi kullanilir. Sehir
olceginde (on binlerce kayit) bu yeterlidir; il olcegine cikildiginda PostGIS
surucusu devreye girecek, arayuz ayni kalacak.

Es zamanlilik: SQLite tek yazar kabul eder. WAL kipi acik, `check_same_thread`
kapali ve butun yazmalar tek kilit altinda; FastAPI'nin is parcaciklari boylece
guvenle paylasir.
"""

from __future__ import annotations

import json
import math
import sqlite3
import time
import uuid
from threading import Lock
from typing import Any, Iterable, Optional

SEMA = """
CREATE TABLE IF NOT EXISTS kullanicilar (
    id            TEXT PRIMARY KEY,
    eposta        TEXT NOT NULL UNIQUE,
    ad_soyad      TEXT NOT NULL,
    sifre_ozeti   TEXT NOT NULL,
    rol           TEXT NOT NULL,
    birim         TEXT,
    sehir         TEXT,
    olusturuldu   REAL NOT NULL,
    son_giris     REAL
);

CREATE TABLE IF NOT EXISTS oturumlar (
    jeton_ozeti   TEXT PRIMARY KEY,
    kullanici_id  TEXT NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
    olusturuldu   REAL NOT NULL,
    biter         REAL NOT NULL,
    iptal         INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS ix_oturum_kullanici ON oturumlar(kullanici_id);

-- Ortak cikti sozlesmesi (CLAUDE.md kural 2):
-- (konum, hasar/aciliyet skoru, guven, zaman damgasi, kaynak tipi)
CREATE TABLE IF NOT EXISTS hasar_noktalari (
    id          TEXT PRIMARY KEY,
    lon         REAL NOT NULL,
    lat         REAL NOT NULL,
    skor        REAL NOT NULL,
    guven       REAL NOT NULL,
    zaman       REAL NOT NULL,
    kaynak      TEXT NOT NULL,
    etiket      TEXT,
    bolge       TEXT,
    ek          TEXT
);
CREATE INDEX IF NOT EXISTS ix_hasar_zaman ON hasar_noktalari(zaman);
CREATE INDEX IF NOT EXISTS ix_hasar_kaynak ON hasar_noktalari(kaynak);
CREATE INDEX IF NOT EXISTS ix_hasar_konum ON hasar_noktalari(lon, lat);

CREATE TABLE IF NOT EXISTS sos_cagrilari (
    id            TEXT PRIMARY KEY,
    lon           REAL NOT NULL,
    lat           REAL NOT NULL,
    oncelik       TEXT NOT NULL,
    durum         TEXT NOT NULL DEFAULT 'bekliyor',
    zaman         REAL NOT NULL,
    mahalle       TEXT,
    metin         TEXT,
    kullanici_id  TEXT,
    ekip_id       TEXT,
    atama_zamani  REAL,
    kapanma_zamani REAL,
    kanal         TEXT,
    ek            TEXT
);
CREATE INDEX IF NOT EXISTS ix_sos_zaman ON sos_cagrilari(zaman);
CREATE INDEX IF NOT EXISTS ix_sos_durum ON sos_cagrilari(durum);
CREATE INDEX IF NOT EXISTS ix_sos_kullanici ON sos_cagrilari(kullanici_id);

CREATE TABLE IF NOT EXISTS ekipler (
    id           TEXT PRIMARY KEY,
    ad           TEXT NOT NULL,
    lon          REAL,
    lat          REAL,
    durum        TEXT NOT NULL DEFAULT 'musait',
    gorev_id     TEXT,
    guncellendi  REAL NOT NULL,
    ek           TEXT
);

CREATE TABLE IF NOT EXISTS yol_kapanmalari (
    id          TEXT PRIMARY KEY,
    lon         REAL NOT NULL,
    lat         REAL NOT NULL,
    derece      INTEGER NOT NULL,
    zaman       REAL NOT NULL,
    kaynak      TEXT NOT NULL,
    analiz_id   TEXT,
    ek          TEXT
);
CREATE INDEX IF NOT EXISTS ix_kapanma_zaman ON yol_kapanmalari(zaman);
"""


def _satir(row: Optional[sqlite3.Row]) -> Optional[dict]:
    return dict(row) if row is not None else None


def _satirlar(rows: Iterable[sqlite3.Row]) -> list[dict]:
    return [dict(r) for r in rows]


class SqliteDepo:
    def __init__(self, yol: str):
        self.yol = yol
        self._kilit = Lock()
        self._baglanti = sqlite3.connect(yol, check_same_thread=False)
        self._baglanti.row_factory = sqlite3.Row
        self._baglanti.execute("PRAGMA journal_mode=WAL")
        self._baglanti.execute("PRAGMA synchronous=NORMAL")
        self._baglanti.execute("PRAGMA foreign_keys=ON")
        with self._kilit:
            self._baglanti.executescript(SEMA)
            self._baglanti.commit()

    # ---- genel yardimcilar ------------------------------------------------

    def _yaz(self, sql: str, parametreler: tuple = ()) -> None:
        with self._kilit:
            self._baglanti.execute(sql, parametreler)
            self._baglanti.commit()

    def _oku(self, sql: str, parametreler: tuple = ()) -> list[dict]:
        with self._kilit:
            return _satirlar(self._baglanti.execute(sql, parametreler).fetchall())

    def _tek(self, sql: str, parametreler: tuple = ()) -> Optional[dict]:
        with self._kilit:
            return _satir(self._baglanti.execute(sql, parametreler).fetchone())

    def kapat(self) -> None:
        with self._kilit:
            self._baglanti.close()

    # ---- kullanicilar -----------------------------------------------------

    def kullanici_olustur(
        self,
        eposta: str,
        ad_soyad: str,
        sifre_ozeti: str,
        rol: str,
        birim: str | None = None,
        sehir: str | None = None,
    ) -> dict:
        kayit = {
            "id": f"kul-{uuid.uuid4().hex[:10]}",
            "eposta": eposta.strip().lower(),
            "ad_soyad": ad_soyad.strip(),
            "sifre_ozeti": sifre_ozeti,
            "rol": rol,
            "birim": birim,
            "sehir": sehir,
            "olusturuldu": time.time(),
            "son_giris": None,
        }
        self._yaz(
            """INSERT INTO kullanicilar
               (id, eposta, ad_soyad, sifre_ozeti, rol, birim, sehir, olusturuldu, son_giris)
               VALUES (?,?,?,?,?,?,?,?,?)""",
            tuple(kayit.values()),
        )
        return kayit

    def kullanici_eposta(self, eposta: str) -> Optional[dict]:
        return self._tek(
            "SELECT * FROM kullanicilar WHERE eposta = ?", (eposta.strip().lower(),)
        )

    def kullanici_id(self, kullanici_id: str) -> Optional[dict]:
        return self._tek("SELECT * FROM kullanicilar WHERE id = ?", (kullanici_id,))

    def giris_isle(self, kullanici_id: str) -> None:
        self._yaz(
            "UPDATE kullanicilar SET son_giris = ? WHERE id = ?", (time.time(), kullanici_id)
        )

    def rol_ata(self, kullanici_id: str, rol: str) -> None:
        """Rol YALNIZCA buradan degisir; istemci gonderdigi rolle rol alamaz."""
        self._yaz("UPDATE kullanicilar SET rol = ? WHERE id = ?", (rol, kullanici_id))

    def kullanici_sayisi(self) -> int:
        satir = self._tek("SELECT COUNT(*) AS n FROM kullanicilar")
        return int(satir["n"]) if satir else 0

    # ---- oturumlar (yenileme jetonlari) -----------------------------------

    def oturum_ac(self, kullanici_id: str, jeton_ozeti: str, omur_sn: float) -> None:
        simdi = time.time()
        self._yaz(
            """INSERT OR REPLACE INTO oturumlar
               (jeton_ozeti, kullanici_id, olusturuldu, biter, iptal)
               VALUES (?,?,?,?,0)""",
            (jeton_ozeti, kullanici_id, simdi, simdi + omur_sn),
        )

    def oturum_bul(self, jeton_ozeti: str) -> Optional[dict]:
        kayit = self._tek(
            "SELECT * FROM oturumlar WHERE jeton_ozeti = ? AND iptal = 0", (jeton_ozeti,)
        )
        if kayit and kayit["biter"] < time.time():
            return None
        return kayit

    def oturum_iptal(self, jeton_ozeti: str) -> None:
        self._yaz("UPDATE oturumlar SET iptal = 1 WHERE jeton_ozeti = ?", (jeton_ozeti,))

    def oturumlari_iptal(self, kullanici_id: str) -> None:
        self._yaz("UPDATE oturumlar SET iptal = 1 WHERE kullanici_id = ?", (kullanici_id,))

    # ---- hasar noktalari (ortak sozlesme) ---------------------------------

    def hasar_ekle(
        self,
        lon: float,
        lat: float,
        skor: float,
        guven: float,
        kaynak: str,
        zaman: float | None = None,
        etiket: str | None = None,
        bolge: str | None = None,
        ek: dict | None = None,
    ) -> dict:
        kayit = {
            "id": f"hsr-{uuid.uuid4().hex[:10]}",
            "lon": float(lon),
            "lat": float(lat),
            "skor": float(skor),
            "guven": float(guven),
            "zaman": float(zaman if zaman is not None else time.time()),
            "kaynak": kaynak,
            "etiket": etiket,
            "bolge": bolge,
            "ek": json.dumps(ek, ensure_ascii=False) if ek else None,
        }
        self._yaz(
            """INSERT INTO hasar_noktalari
               (id, lon, lat, skor, guven, zaman, kaynak, etiket, bolge, ek)
               VALUES (?,?,?,?,?,?,?,?,?,?)""",
            tuple(kayit.values()),
        )
        return kayit

    def hasar_listele(
        self,
        baslangic: float | None = None,
        bitis: float | None = None,
        kutu: tuple[float, float, float, float] | None = None,
        kaynak: str | None = None,
        sinir: int = 20000,
    ) -> list[dict]:
        kosullar, parametreler = self._zaman_kutu_kosullari(baslangic, bitis, kutu)
        if kaynak:
            kosullar.append("kaynak = ?")
            parametreler.append(kaynak)
        nerede = f"WHERE {' AND '.join(kosullar)}" if kosullar else ""
        return self._oku(
            f"SELECT * FROM hasar_noktalari {nerede} ORDER BY zaman DESC LIMIT ?",
            (*parametreler, sinir),
        )

    # ---- SOS cagrilari ----------------------------------------------------

    def sos_ekle(
        self,
        lon: float,
        lat: float,
        oncelik: str,
        metin: str | None = None,
        mahalle: str | None = None,
        kullanici_id: str | None = None,
        kanal: str | None = None,
        zaman: float | None = None,
        ek: dict | None = None,
    ) -> dict:
        """`ek`: yapilandirilmis ek bilgi (kisi sayisi, ihtiyaclar, konumun
        kaynagi) -- tablodaki `ek` sutununa JSON olarak yazilir."""
        kayit = {
            "id": f"sos-{uuid.uuid4().hex[:8]}",
            "lon": float(lon),
            "lat": float(lat),
            "oncelik": oncelik,
            "durum": "bekliyor",
            "zaman": float(zaman if zaman is not None else time.time()),
            "mahalle": mahalle,
            "metin": metin,
            "kullanici_id": kullanici_id,
            "ekip_id": None,
            "atama_zamani": None,
            "kapanma_zamani": None,
            "kanal": kanal,
            "ek": json.dumps(ek, ensure_ascii=False) if ek else None,
        }
        self._yaz(
            """INSERT INTO sos_cagrilari
               (id, lon, lat, oncelik, durum, zaman, mahalle, metin, kullanici_id,
                ekip_id, atama_zamani, kapanma_zamani, kanal, ek)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            tuple(kayit.values()),
        )
        return kayit

    def sos_listele(
        self,
        baslangic: float | None = None,
        bitis: float | None = None,
        kutu: tuple[float, float, float, float] | None = None,
        durum: str | None = None,
        kullanici_id: str | None = None,
        sinir: int = 5000,
    ) -> list[dict]:
        kosullar, parametreler = self._zaman_kutu_kosullari(baslangic, bitis, kutu)
        if durum:
            kosullar.append("durum = ?")
            parametreler.append(durum)
        if kullanici_id:
            # Afetzede yalniz kendi cagrisini gorur (MIMARI 9).
            kosullar.append("kullanici_id = ?")
            parametreler.append(kullanici_id)
        nerede = f"WHERE {' AND '.join(kosullar)}" if kosullar else ""
        return self._oku(
            f"SELECT * FROM sos_cagrilari {nerede} ORDER BY zaman DESC LIMIT ?",
            (*parametreler, sinir),
        )

    def sos_bul(self, sos_id: str) -> Optional[dict]:
        return self._tek("SELECT * FROM sos_cagrilari WHERE id = ?", (sos_id,))

    def sos_ata(self, sos_id: str, ekip_id: str) -> bool:
        """Mukerrer sevki engeller: yalnizca hala bekleyen cagri atanabilir."""
        with self._kilit:
            imlec = self._baglanti.execute(
                """UPDATE sos_cagrilari
                   SET ekip_id = ?, durum = 'atandi', atama_zamani = ?
                   WHERE id = ? AND durum = 'bekliyor'""",
                (ekip_id, time.time(), sos_id),
            )
            self._baglanti.commit()
            return imlec.rowcount > 0

    def sos_kapat(self, sos_id: str) -> bool:
        with self._kilit:
            imlec = self._baglanti.execute(
                """UPDATE sos_cagrilari
                   SET durum = 'kapandi', kapanma_zamani = ?
                   WHERE id = ? AND durum != 'kapandi'""",
                (time.time(), sos_id),
            )
            self._baglanti.commit()
            return imlec.rowcount > 0

    def sos_sayilari(
        self, baslangic: float | None = None, bitis: float | None = None
    ) -> dict[str, int]:
        kosullar, parametreler = self._zaman_kutu_kosullari(baslangic, bitis, None)
        nerede = f"WHERE {' AND '.join(kosullar)}" if kosullar else ""
        satirlar = self._oku(
            f"SELECT durum, COUNT(*) AS n FROM sos_cagrilari {nerede} GROUP BY durum",
            tuple(parametreler),
        )
        return {s["durum"]: int(s["n"]) for s in satirlar}

    # ---- ekipler ----------------------------------------------------------

    def ekip_kaydet(
        self,
        ekip_id: str,
        ad: str,
        lon: float | None = None,
        lat: float | None = None,
        durum: str = "musait",
        ek: dict | None = None,
    ) -> dict:
        kayit = {
            "id": ekip_id,
            "ad": ad,
            "lon": lon,
            "lat": lat,
            "durum": durum,
            "gorev_id": None,
            "guncellendi": time.time(),
            "ek": json.dumps(ek, ensure_ascii=False) if ek else None,
        }
        self._yaz(
            """INSERT INTO ekipler (id, ad, lon, lat, durum, gorev_id, guncellendi, ek)
               VALUES (?,?,?,?,?,?,?,?)
               ON CONFLICT(id) DO UPDATE SET
                 ad = excluded.ad, lon = excluded.lon, lat = excluded.lat,
                 durum = excluded.durum, guncellendi = excluded.guncellendi""",
            tuple(kayit.values()),
        )
        return kayit

    def ekip_konum(self, ekip_id: str, lon: float, lat: float) -> None:
        self._yaz(
            "UPDATE ekipler SET lon = ?, lat = ?, guncellendi = ? WHERE id = ?",
            (lon, lat, time.time(), ekip_id),
        )

    def ekip_listele(self) -> list[dict]:
        return self._oku("SELECT * FROM ekipler ORDER BY ad")

    def ekip_bul(self, ekip_id: str) -> Optional[dict]:
        return self._tek("SELECT * FROM ekipler WHERE id = ?", (ekip_id,))

    def en_yakin_ekip(self, lon: float, lat: float, yalniz_musait: bool = True) -> Optional[dict]:
        ekipler = [e for e in self.ekip_listele() if e["lon"] is not None]
        if yalniz_musait:
            ekipler = [e for e in ekipler if e["durum"] == "musait"] or ekipler
        if not ekipler:
            return None
        return min(ekipler, key=lambda e: mesafe_m(lon, lat, e["lon"], e["lat"]))

    # ---- yol kapanmalari --------------------------------------------------

    def kapanma_ekle(
        self,
        lon: float,
        lat: float,
        derece: int,
        kaynak: str,
        analiz_id: str | None = None,
        zaman: float | None = None,
    ) -> dict:
        kayit = {
            "id": f"kap-{uuid.uuid4().hex[:10]}",
            "lon": float(lon),
            "lat": float(lat),
            "derece": int(derece),
            "zaman": float(zaman if zaman is not None else time.time()),
            "kaynak": kaynak,
            "analiz_id": analiz_id,
            "ek": None,
        }
        self._yaz(
            """INSERT INTO yol_kapanmalari (id, lon, lat, derece, zaman, kaynak, analiz_id, ek)
               VALUES (?,?,?,?,?,?,?,?)""",
            tuple(kayit.values()),
        )
        return kayit

    def kapanma_listele(
        self,
        baslangic: float | None = None,
        bitis: float | None = None,
        kutu: tuple[float, float, float, float] | None = None,
        sinir: int = 20000,
    ) -> list[dict]:
        kosullar, parametreler = self._zaman_kutu_kosullari(baslangic, bitis, kutu)
        nerede = f"WHERE {' AND '.join(kosullar)}" if kosullar else ""
        return self._oku(
            f"SELECT * FROM yol_kapanmalari {nerede} ORDER BY zaman DESC LIMIT ?",
            (*parametreler, sinir),
        )

    # ---- ortak suzme ------------------------------------------------------

    @staticmethod
    def _zaman_kutu_kosullari(
        baslangic: float | None,
        bitis: float | None,
        kutu: tuple[float, float, float, float] | None,
    ) -> tuple[list[str], list[Any]]:
        kosullar: list[str] = []
        parametreler: list[Any] = []
        if baslangic is not None:
            kosullar.append("zaman >= ?")
            parametreler.append(float(baslangic))
        if bitis is not None:
            kosullar.append("zaman <= ?")
            parametreler.append(float(bitis))
        if kutu is not None:
            bati, guney, dogu, kuzey = kutu
            kosullar.append("lon BETWEEN ? AND ? AND lat BETWEEN ? AND ?")
            parametreler.extend([bati, dogu, guney, kuzey])
        return kosullar, parametreler


def mesafe_m(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    """Iki nokta arasi haversine mesafesi (metre)."""
    r = 6371000.0
    f1, f2 = math.radians(lat1), math.radians(lat2)
    dl = math.radians(lat2 - lat1)
    dg = math.radians(lon2 - lon1)
    a = math.sin(dl / 2) ** 2 + math.cos(f1) * math.cos(f2) * math.sin(dg / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))
