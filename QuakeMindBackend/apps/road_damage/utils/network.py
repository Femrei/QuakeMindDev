import hashlib
import math
import os
import pickle
from pathlib import Path

import networkx as nx
import osmnx as ox
from shapely.geometry import LineString

# Overpass (canli) tamamen erisilemez oldugu donemler icin yerel yedek: bir
# kez indirilmis Turkiye OSM PBF'i (D: -- boyutu ~611MB, C: diskinde yer
# yoktu) uzerinden pyrosm ile SADECE istenen kucuk bbox'i cikarip
# osmnx-uyumlu bir networkx grafi olusturuyoruz. Bu, Overpass'a hic
# bagimli degil -- tek seferlik pyrosm cikarimi ~230sn surebiliyor (PBF'in
# tamami taraniyor), bu yuzden onceden (benchmark/warm_local_graph_cache.py)
# bilinen konumlar icin pickle'lanip cache'leniyor; canli cagrida sadece
# cache'ten hizli yukleme yapiliyor (build DEGIL) -- worker.py'nin 45sn'lik
# dis timeout'unu asmamak icin.
LOCAL_PBF_PATH = os.environ.get("QUAKEMIND_LOCAL_OSM_PBF", "D:/quakemind_osm_data/turkey-latest.osm.pbf")
LOCAL_GRAPH_CACHE_DIR = Path(__file__).resolve().parents[1] / "data" / "osm_graph_cache"


def _local_graph_cache_path(bounds) -> Path:
    key = hashlib.sha1(",".join(f"{v:.5f}" for v in bounds).encode()).hexdigest()[:16]
    return LOCAL_GRAPH_CACHE_DIR / f"{key}.pkl"


def load_local_graph_from_cache(bounds):
    """Sadece onceden pre-warm edilmis (bkz. warm_local_graph_cache.py)
    pickle dosyasini okur -- hicbir zaman canli PBF taramasi baslatmaz."""
    path = _local_graph_cache_path(bounds)
    if not path.exists():
        return None
    try:
        with open(path, "rb") as f:
            return pickle.load(f)
    except Exception:
        return None


def build_local_graph_from_pbf(bounds, cache: bool = True):
    """PBF'ten canli cikarim yapar (~230sn surebilir) -- SADECE onceden
    calistirilan pre-warm script'i icin, canli istek yolunda DEGIL."""
    from pyrosm import OSM

    west, south, east, north = bounds
    osm = OSM(LOCAL_PBF_PATH, bounding_box=[west, south, east, north])
    nodes, edges = osm.get_network(network_type="driving", nodes=True)
    if nodes is None or edges is None or nodes.empty or edges.empty:
        raise RuntimeError("Yerel PBF'te bu bbox icin yol verisi bulunamadi.")
    G = osm.to_graph(nodes, edges, graph_type="networkx")
    if cache:
        LOCAL_GRAPH_CACHE_DIR.mkdir(parents=True, exist_ok=True)
        with open(_local_graph_cache_path(bounds), "wb") as f:
            pickle.dump(G, f)
    return G

# Without an explicit cap, osmnx falls back to its own default Overpass
# timeout/retry policy, which can wait far longer than the mobile client's
# fixed 300s HTTP timeout for /api/road_damage/analyze -- the backend
# eventually finishes and logs success, but the request already timed out
# on the phone. Cache responses so repeated analyses of the same area don't
# re-hit Overpass at all.
ox.settings.use_cache = True
ox.settings.requests_timeout = 30

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000 # radius of earth in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def calculate_route(G, start_lat, start_lon, end_lat, end_lon):
    start_node = ox.distance.nearest_nodes(G, X=start_lon, Y=start_lat)
    end_node = ox.distance.nearest_nodes(G, X=end_lon, Y=end_lat)
    
    def astar_heuristic(u, v):
        u_node = G.nodes[u]
        v_node = G.nodes[v]
        return haversine(u_node['y'], u_node['x'], v_node['y'], v_node['x'])
        
    try:
        path_dijkstra = nx.shortest_path(G, start_node, end_node, weight='length')
    except nx.NetworkXNoPath:
        path_dijkstra = None
        
    try:
        path_astar = nx.astar_path(G, start_node, end_node, heuristic=astar_heuristic, weight='length')
    except nx.NetworkXNoPath:
        path_astar = None
        
    def get_route_line(path):
        if not path:
            return None
        route_coords = []
        for i in range(len(path) - 1):
            u = path[i]
            v = path[i+1]
            edge_data = min(G[u][v].values(), key=lambda d: d.get('length', float('inf')))
            if 'geometry' in edge_data:
                coords = [(lat, lon) for lon, lat in edge_data['geometry'].coords]
                # pyrosm/osmnx grafiklerinde bir kenarin geometry LineString'i
                # HER ZAMAN (u,v) yonunde saklanmis olmayabilir -- bazi
                # kenarlarda OSM way'in orijinal cizim yonu (v,u) ise,
                # geometry TERS kaydedilir. Bunu varsaymadan duz eklemek,
                # ardisik kenarlar arasinda GERCEKTE OLMAYAN buyuk bir
                # "sicrama" yaratiyordu (bir kenarin sonundan, bir sonraki
                # kenarin YANLIS ucuna atlama) -- bu da rotanin gercek
                # (safe_G uzerindeki en kisa) mesafeden onemli olcude daha
                # uzun gorunmesine yol aciyordu. Duzeltme: geometrinin
                # baslangic noktasi v'ye u'dan daha yakinsa, listeyi ters
                # cevirerek ekle.
                u_node, v_node = G.nodes[u], G.nodes[v]
                start_to_u = haversine(coords[0][0], coords[0][1], u_node['y'], u_node['x'])
                start_to_v = haversine(coords[0][0], coords[0][1], v_node['y'], v_node['x'])
                if start_to_v < start_to_u:
                    coords = coords[::-1]
                route_coords.extend(coords)
            else:
                route_coords.extend([(G.nodes[u]['y'], G.nodes[u]['x']), (G.nodes[v]['y'], G.nodes[v]['x'])])
        return route_coords
        
    return get_route_line(path_dijkstra), get_route_line(path_astar)

# osmnx varsayılan olarak TEK bir sabit Overpass sunucusuna (overpass-api.de)
# bağlanır ve yedek sunucusu yoktur -- bu sunucu yoğun/erişilemez olduğunda
# (gözlemlenen: connect timeout=30, ~100sn'de exception) tüm lojistik analizi
# sessizce boş dönüyordu. get_osm_roads_overpass (fetcher.py) zaten aynı sorun
# için çoklu-ayna (mirror) fallback kullanıyor -- aynı deseni burada da
# uyguluyoruz.
_OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api",
    "https://overpass.kumi.systems/api",
    "https://lz4.overpass-api.de/api",
    "https://overpass.private.coffee/api",
]


def fetch_osm_road_graph(bounds, network_type='drive'):
    """Gercek OSM yol grafigini ceker: once yerel pre-warm cache (ms
    mertebesinde), yoksa cok-ayna Overpass fallback. `analyze_road_network_graph`
    (SegFormer hasar kesisimi) ve `simulate_random_closures` (rastgele
    kapanma simulasyonu, worker.py'de fastapi_app.py) ikisi de bu tek
    fonksiyonu paylasir -- graf edinme mantigi tek bir yerde.

    Bunu Overpass denemesinden ONCE cache'e bakarak yapiyoruz cunku canli
    Overpass, DNS cozumlemesi seviyesinde donabiliyor -- requests_timeout
    SADECE soket connect/read fazini kapsiyor, DNS asamasini kapsamiyor, bu
    yuzden 4 ayna x 10sn = 40sn hedeflesek de gercekte 300sn+ surebiliyor
    (bkz. oturum notlari)."""
    G = load_local_graph_from_cache(bounds)
    if G is not None:
        print(f"OSMnx: yerel PBF cache'inden yuklendi ({G.number_of_nodes()} dugum), Overpass'a hic gidilmedi.")
        return G, None

    last_error = None
    original_timeout = ox.settings.requests_timeout
    ox.settings.requests_timeout = 10
    try:
        for endpoint in _OVERPASS_ENDPOINTS:
            try:
                ox.settings.overpass_endpoint = endpoint
                # 'drive' varsayılanı araç lojistiği için; yaya tahliye rotası 'walk' geçer
                G = ox.graph_from_bbox(bbox=bounds, network_type=network_type, simplify=True)
                return G, None
            except Exception as e:
                last_error = e
                continue
    finally:
        ox.settings.requests_timeout = original_timeout

    return None, last_error


def simulate_random_closures(bounds, closure_ratio=0.15, network_type='drive', seed=None):
    """`analyze_road_network_graph`'in SegFormer/hasar-maskesi olmayan
    versiyonu: gercek bir OSM yol grafigi ceker, kenarlarin rastgele
    closure_ratio kadarini 'kapali' isaretler. Senkron ve hizli (worker
    pool gerektirmez) -- canli CV modeli calistirmadan, gercek senaryo
    kurgusu icin (bkz. oturum notlari: kullanicinin onayladigi basitlestirme).

    Kapatma miktari, kapatma SONRASI grafin en buyuk GUCLU-BAGLI (strongly
    connected) bileseninin dugumlerin en az %92'sini kapsamasini saglayacak
    sekilde otomatik ayarlanir (istenen closure_ratio'dan baslayip, yetersiz
    kalirsa yarilanarak birkac kez yeniden dener). Deneysel olarak
    dogrulandi: tamamen rastgele secim (kisitlamasiz), dar/tek-yonlu sokak
    agirlikli gercek sehir topolojilerinde %18 gibi dusuk bir oranda bile
    grafi 287 parcaya bolup rota motorunu (Dijkstra/A*) HICBIR ZAMAN
    calistiramaz hale getiriyordu (18004 dugumlu Kahramanmaras grafinda
    dogrulandi) -- salt undirected spanning-tree korumasi da yetersiz kaldi
    (yonlu/tek-yonlu sokaklarda undirected baglantiligi korumak, yonlu
    erisilebilirligi garanti etmiyor). Bu yaklasim, rota motorunun HER ZAMAN
    (buyuk olasilikla) bir yol bulabilmesini saglar -- sadece HANGI yolun
    kapali oldugu rastgele kalir (kullanicinin istedigi basitlestirme budur,
    'rota bulunamiyor' hatasi degil)."""
    import random as _random

    G, error = fetch_osm_road_graph(bounds, network_type=network_type)
    if G is None:
        return None, None, None, None, error

    rng = _random.Random(seed)
    # G.edges(keys=True)'in dondurdugu SIRA, networkx'in ic adjacency dict'i
    # uzerinden gelir -- dugum ID'leri hashlenirken Python'un SURECE-OZGU
    # PYTHONHASHSEED'i devreye girebiliyor, yani AYNI seed ile rng.sample
    # cagrilsa bile FARKLI bir surecte (orn. bu API endpoint'i vs bagimsiz
    # bir dogrulama script'i) TAMAMEN FARKLI kenarlar secilebiliyordu --
    # deneysel olarak dogrulandi (ayni parametrelerle iki ayri surec, ayni
    # kapanma SAYISI ama FARKLI kenar KUMESI, bu da rota motorunun ayni
    # (bounds, seed) icin surece bagli farkli sonuclar vermesine yol
    # aciyordu). Ornekleme oncesi sabit bir siraya (u,v,key) gore sort
    # etmek, "ayni seed = ayni kapanma" garantisini surecler arasi da
    # gecerli kilar.
    all_edges = sorted(G.edges(keys=True))
    total_nodes = G.number_of_nodes()

    closed_keys: set = set()
    candidate_ratio = closure_ratio
    for _attempt in range(6):
        n_closed = max(1, int(len(all_edges) * candidate_ratio)) if all_edges else 0
        n_closed = min(n_closed, len(all_edges))
        trial_closed = set(rng.sample(all_edges, n_closed)) if n_closed else set()

        trial_G = G.copy()
        trial_G.remove_edges_from([(u, v, k) for (u, v, k) in trial_closed])
        largest_scc_size = len(max(nx.strongly_connected_components(trial_G), key=len)) if trial_G.number_of_nodes() else 0

        if not trial_closed or largest_scc_size >= total_nodes * 0.92:
            closed_keys = trial_closed
            break
        candidate_ratio /= 2

    blocked_edges = []
    safe_edges = []
    for u, v, key in all_edges:
        data = G[u][v][key]
        line = data.get('geometry')
        if line is None:
            u_node, v_node = G.nodes[u], G.nodes[v]
            line = LineString([(u_node['x'], u_node['y']), (v_node['x'], v_node['y'])])
        target = blocked_edges if (u, v, key) in closed_keys else safe_edges
        target.append((u, v, key, line))

    safe_G = G.copy()
    safe_G.remove_edges_from([(u, v, k) for (u, v, k, _) in blocked_edges])

    return G, safe_G, safe_edges, blocked_edges, None


MAX_NAIVE_ITERATIONS = 60


def simulate_naive_agent(G, real_closed_edges: set, start_lat, start_lon, end_lat, end_lon):
    """Naive ajan: kapaliligi bilmiyor, en kisa yolu dener; bilinmeyen bir
    kapali kenara varinca onu 'ogrenir' ve o kavsaktan itibaren yeniden
    hesaplar. Toplam yuruncen mesafeyi (metre) ve 'ogrenilen' kapali kenar
    sayisini doner; yol bulunamazsa None doner.

    (Aslinda benchmark/naive_baseline.py'de tanimliydi -- BURAYA tasindi
    cunku naive-ajan karsilastirmasinin backend'in KENDI SURECINDE, session'da
    saklanan GERCEK G/real_closed_edges ile calismasi gerekiyordu: ayri bir
    Python surecinde (orn. bir benchmark script'i) simulate_random_closures'i
    AYNI seed/bounds/ratio ile TEKRAR cagirmak, TEORIDE deterministik olmasi
    beklenirken PRATIKTE surecler arasi FARKLI bir kapanma kumesi
    uretebiliyordu (nx.strongly_connected_components'in ic sira/hash
    davranisina bagli oldugu dusunuluyor) -- bu da naive-ajan karsilastirmasini
    GECERSIZ kilan (bazen naive'in bizim motordan 'daha kisa' cikmasi gibi
    imkansiz olmasi gereken sonuclar) bir sinif hataya yol aciyordu.)"""
    start_node = ox.distance.nearest_nodes(G, X=start_lon, Y=start_lat)
    end_node = ox.distance.nearest_nodes(G, X=end_lon, Y=end_lat)

    known_closed: set = set()
    current = start_node
    total_length = 0.0
    discoveries = 0

    for _ in range(MAX_NAIVE_ITERATIONS):
        G_view = G.copy()
        if known_closed:
            G_view.remove_edges_from([(u, v, k) for (u, v, k) in known_closed if G_view.has_edge(u, v, k)])
        try:
            path = nx.shortest_path(G_view, current, end_node, weight="length")
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return None

        blocked_here = False
        for i in range(len(path) - 1):
            u, v = path[i], path[i + 1]
            # DIKKAT: key, path'in FIILEN hesaplandigi G_view uzerinden
            # secilmeli, TAM graf G'den DEGIL. (u,v) arasinda birden fazla
            # paralel kenar varsa, G uzerinden 'en kisa' key secmek bazen
            # HENUZ BILINMEYEN (ama gercekte kapali) bir paralel kenari
            # secebiliyordu -- path aslinda G_view'deki (acik) baska bir
            # paralel kenari kullanmisken, mesafeye YANLISLIKLA o kapali
            # kenarin (genelde daha kisa oldugu icin secilen) uzunlugunu
            # ekliyor, hem de onu "kesfedilmis" sayip erken duruyordu. Bu,
            # naive ajanin bazen GERCEK motorumuzdan daha kisa/gecerli
            # gorunen ama ASLINDA path'in hic kullanmadigi bir kenara
            # dayanan yanlis bir mesafe bulmasina yol aciyordu.
            key = min(G_view[u][v], key=lambda k: G_view[u][v][k].get("length", float("inf")))
            if (u, v, key) in real_closed_edges:
                known_closed.add((u, v, key))
                known_closed.add((v, u, key))
                current = u
                blocked_here = True
                discoveries += 1
                break
            total_length += G[u][v][key].get("length", 0.0)
            current = v

        if not blocked_here:
            return {"distanceMeters": round(total_length, 1), "discoveries": discoveries}

    return None  # cok fazla kesif dongusu -- pratikte yol bulunamadi kabul edilir


def analyze_road_network_graph(bounds, w, h, blockage_mask, network_type='drive'):
    """Fetches OSM graph, evaluates blockages, and returns safe/blocked lists."""
    west, south, east, north = bounds
    G, last_error = fetch_osm_road_graph(bounds, network_type=network_type)

    if G is None:
        print("OSMnx error (yerel cache yok, tum Overpass aynalari denendi):", last_error)
        return None, None, None, None

    blocked_edges = []
    safe_edges = []
    edges_to_remove = []
    
    for u, v, key, data in G.edges(keys=True, data=True):
        if 'geometry' in data:
            line = data['geometry']
        else:
            u_node = G.nodes[u]
            v_node = G.nodes[v]
            line = LineString([(u_node['x'], u_node['y']), (v_node['x'], v_node['y'])])
            
        length = line.length
        # Örnekleme sıklığını ~5 metreye düşürüyoruz (eskiden ~2 metreydi)
        num_samples = max(int(length / 0.00005), 3)
        
        current_type = None
        current_segment = []
        has_blocked_part = False
        
        for i in range(num_samples):
            pt = line.interpolate(float(i) / (num_samples - 1), normalized=True)
            px = int((pt.x - west) / (east - west) * w)
            py = int((north - pt.y) / (north - south) * h)
            
            is_blocked = False
            if 0 <= px < w and 0 <= py < h:
                if blockage_mask[py, px] > 0:
                    is_blocked = True
                    has_blocked_part = True
                    
            if current_type is None:
                current_type = is_blocked
                current_segment.append((pt.x, pt.y))
            elif current_type == is_blocked:
                current_segment.append((pt.x, pt.y))
            else:
                current_segment.append((pt.x, pt.y)) # connect lines
                if len(current_segment) > 1:
                    if current_type:
                        blocked_edges.append((u, v, key, LineString(current_segment)))
                    else:
                        safe_edges.append((u, v, key, LineString(current_segment)))
                
                current_type = is_blocked
                current_segment = [(pt.x, pt.y)]

        if len(current_segment) > 1:
            if current_type:
                blocked_edges.append((u, v, key, LineString(current_segment)))
            else:
                safe_edges.append((u, v, key, LineString(current_segment)))
                
        if has_blocked_part:
            edges_to_remove.append((u, v, key))

    safe_G = G.copy()
    safe_G.remove_edges_from(edges_to_remove)
                
    return G, safe_G, safe_edges, blocked_edges
