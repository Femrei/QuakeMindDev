"""
Bolge tanimlari ve sahne (senaryo) kurulumu.

ONEMLI DUZUM: orijinal makalenin 8 ilcesinin tam merkez koordinatlari ve
18 afetzede / 18 ekip / 11 karargah konumlari bu repoda bulunamadi (bkz.
denetim bulgulari). Burada TAMAMEN YENI, seffaf ve tekrarlanabilir bir
sahne kuruluyor: bolge merkezleri OSM/Nominatim'den yer adiyla geocode
edilmis, afetzede/ekip/karargah konumlari o bolgenin gercek yol
grafindeki dugumler arasindan rastgele (sabit tohumla) orneklenmistir.
Bu, makalenin ORIJINAL sahnesinin yeniden uretimi degil, ayni algoritmayi
(Algoritma 1/2, R0-R3) gercek veriyle calistiran YENI bir kosumdur.
"""
from dataclasses import dataclass

import numpy as np
import osmnx as ox

ox.settings.use_cache = True
ox.settings.log_console = False

DISTRICTS = {
    # aoi=None -> EMSR648 kapsami disinda (makale P1441: EMSR648 karsilastirmasi
    # yalniz H-Z1, H-Z3, K-Z1, K-Z2'de yapilabiliyor); bu 4 bolge de synthetic
    # kapanmayla, tumu 8 bolge synthetic ile kosulur.
    "H-Z1": {"query": "Antakya, Hatay, Turkiye", "aoi": "AOI11", "il": "Hatay"},
    "H-Z2": {"query": "Iskenderun, Hatay, Turkiye", "aoi": None, "il": "Hatay"},
    "H-Z3": {"query": "Kirikhan, Hatay, Turkiye", "aoi": "AOI11", "il": "Hatay"},
    "H-Z4": {"query": "Samandag, Hatay, Turkiye", "aoi": None, "il": "Hatay"},
    "H-Z5": {"query": "Belen, Hatay, Turkiye", "aoi": None, "il": "Hatay"},
    "K-Z1": {"query": "Onikisubat, Kahramanmaras, Turkiye", "aoi": "AOI04", "il": "Kahramanmaras"},
    "K-Z2": {"query": "Elbistan, Kahramanmaras, Turkiye", "aoi": "AOI04", "il": "Kahramanmaras"},
    "K-Z3": {"query": "Pazarcik, Kahramanmaras, Turkiye", "aoi": None, "il": "Kahramanmaras"},
}

RADIUS_M = 3000.0
NETWORK_TYPE = "walk"


@dataclass
class DistrictGraph:
    code: str
    center: tuple
    G: object


def load_district(code):
    cfg = DISTRICTS[code]
    center = ox.geocode(cfg["query"])
    G = ox.graph_from_point(center, dist=RADIUS_M, network_type=NETWORK_TYPE, simplify=True)
    return DistrictGraph(code=code, center=center, G=G)


def sample_od_pairs(G, n, seed):
    """n tane (afetzede_dugumu, en_yakin_karargah_dugumu) cifti yerine, bu
    kucuk dogrulama kosumunda basitce n adet (baslangic, hedef) dugum cifti
    orneklenir - baslangic 'karargah/ekip', hedef 'afetzede' konumunu temsil
    eder. Ayni guclu baglantili bilesenden secilir (aksi halde temel
    Dijkstra bile hicbir kapanma olmadan basarisiz olur)."""
    import networkx as nx
    largest_scc = max(nx.strongly_connected_components(G), key=len)
    nodes = list(largest_scc)
    rng = np.random.default_rng(seed)
    pairs = []
    attempts = 0
    while len(pairs) < n and attempts < n * 50:
        attempts += 1
        s, t = rng.choice(nodes, size=2, replace=False)
        s, t = int(s), int(t)
        if nx.has_path(G, s, t):
            pairs.append((s, t))
    return pairs
