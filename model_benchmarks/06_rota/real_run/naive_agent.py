"""
Algoritma 1 (makale Bolum 3.8, P567-586) - kapanma-bilgisiz naif ajan (R0),
ve makalenin tanimladigi referans varyasyonlari R1 (gorus mesafeli),
R3 (kusursuz bilgi). R2 (bilgi paylasan filo) orkestrasyon seviyesinde
(scenario.py / run_scenario.py) uygulanir çünkü birden fazla ajanin ortak
bir K_shared kümesini paylaşmasını gerektirir.

Bu kod, makalede tarif edilen sozde kodun BIREBIR, yeni bir uygulamasidir.
Orijinal (kaybolan) simulatorle ayni sayilari uretmesi beklenmez; amac,
makalenin kendi tanimladigi algoritmanin GERCEK, calistirilabilir bir
karsiligini kurup gercek OSM/EMSR648 verisiyle koşmaktir.
"""
from dataclasses import dataclass, field

import networkx as nx


@dataclass
class RunResult:
    reachable: bool
    distance_m: float = 0.0
    k_discoveries: int = 0
    path_nodes: list = field(default_factory=list)
    time_min: float = float("nan")


def _shortest_parallel_edge(G, u, v):
    """G[u][v] icindeki (birden fazla paralel kenar olabilir) en kisa
    (length) kenarin key'ini ve verisini dondurur."""
    data_by_key = G[u][v]
    best_key = min(data_by_key, key=lambda k: data_by_key[k].get("length", float("inf")))
    return best_key, data_by_key[best_key]


def _reverse_keys(G, u, v):
    """(v -> u) yonundeki tum kenar key'lerini dondurur (varsa)."""
    if G.has_edge(v, u):
        return list(G[v][u].keys())
    return []


def naive_agent_run(G, closed_set, s, t, *, v_ort_kmh=15.0, t_u_min=20.0, i_max=60,
                     known_closed=None):
    """Algoritma 1'in birebir uygulamasi.

    G: networkx MultiDiGraph (osmnx), kenarlarda 'length' (m) alani var.
    closed_set: gercekte kapali (u, v, k) uclulerinin kumesi B (ajana gizli).
    known_closed: R2 (bilgi paylasan filo) icin - bastan bilinen (baska
        ekiplerden telsizle ogrenilmis) kapali kenarlar kumesi. Verilirse
        YERINDE (in-place) guncellenir: bu ajanin yeni kesfettigi kenarlar
        da bu kumeye eklenir, boylece cagiran taraf bir sonraki ekibe
        aktarabilir. Bu kumedeki kenarlar icin ceza uygulanmaz (k sayilmaz).
    Donen: RunResult.
    """
    K = set(known_closed) if known_closed is not None else set()
    c = s
    L = 0.0
    k = 0

    for _ in range(i_max):
        G_a = nx.restricted_view(G, [], K) if K else G

        try:
            path = nx.shortest_path(G_a, c, t, weight="length")
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return RunResult(reachable=False, distance_m=L, k_discoveries=k)

        obstacle = False
        for u, v in zip(path[:-1], path[1:]):
            key, data = _shortest_parallel_edge(G_a, u, v)
            if (u, v, key) in closed_set:
                K.add((u, v, key))
                for rk in _reverse_keys(G, v, u):
                    K.add((v, u, rk))
                if known_closed is not None:
                    known_closed.add((u, v, key))
                    for rk in _reverse_keys(G, v, u):
                        known_closed.add((v, u, rk))
                c = u
                k += 1
                obstacle = True
                break
            L += data.get("length", 0.0)
            c = v

        if not obstacle:
            v_ort_m_per_min = v_ort_kmh * 1000.0 / 60.0
            time_min = L / v_ort_m_per_min + k * t_u_min
            return RunResult(reachable=True, distance_m=L, k_discoveries=k,
                              path_nodes=path, time_min=time_min)

    return RunResult(reachable=False, distance_m=L, k_discoveries=k)


def fleet_r2_run(G, closed_set, od_pairs, *, v_ort_kmh=15.0, t_u_min=20.0, i_max=60):
    """R2 - bilgi paylasan filo (makale P565): bolgedeki ekipler ayni anda
    yola cikar; bir ekibin kesfettigi kapanma o anda telsizle tum ekiplere
    yayilir. Telsizle ogrenilen kapanma cezasiz yeniden planlamaya yol
    acar (known_closed'a onceden eklenmis oldugu icin o ekip icin hic
    'kesif' sayilmaz); kendi kesfettigini yine kendisi oder (R0'daki gibi).

    od_pairs sirayla islenir (aralarinda ortak bir K_shared paylasilir);
    bu, "ayni karargahtan birlikte cikan ekiplerde kapanmayi onde giden
    kesfeder, arkadakiler cezasiz yon degistirir" davranisini da kapsar.
    """
    shared_known = set()
    results = []
    for (s, t) in od_pairs:
        r = naive_agent_run(G, closed_set, s, t, v_ort_kmh=v_ort_kmh,
                             t_u_min=t_u_min, i_max=i_max, known_closed=shared_known)
        results.append(r)
    return results, shared_known


def perfect_info_run(G, closed_set, s, t, *, v_ort_kmh=15.0):
    """R3 - kusursuz bilgi referansi: kapanma kumesini bastan bilen
    planlayici. Kapali kenarlar cizgeden tumuyle cikarilip tek seferde
    en kisa yol hesaplanir (k=0, ceza yok)."""
    G_a = nx.restricted_view(G, [], closed_set) if closed_set else G
    try:
        path = nx.shortest_path(G_a, s, t, weight="length")
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        return RunResult(reachable=False)
    L = sum(_shortest_parallel_edge(G_a, u, v)[1].get("length", 0.0)
            for u, v in zip(path[:-1], path[1:]))
    v_ort_m_per_min = v_ort_kmh * 1000.0 / 60.0
    return RunResult(reachable=True, distance_m=L, k_discoveries=0,
                      path_nodes=path, time_min=L / v_ort_m_per_min)


def _path_length_within(G_a, path, start_idx, sight_m):
    """path[start_idx:] boyunca, sight_m metreye kadar olan (u,v) kenarlarini
    (kenar, kumulatif_mesafe) olarak dondurur."""
    out = []
    cum = 0.0
    for i in range(start_idx, len(path) - 1):
        u, v = path[i], path[i + 1]
        if not G_a.has_edge(u, v):
            break
        key, data = _shortest_parallel_edge(G_a, u, v)
        length = data.get("length", 0.0)
        if cum >= sight_m:
            break
        out.append((u, v, key, length))
        cum += length
    return out


def line_of_sight_run(G, closed_set, s, t, *, v_ort_kmh=15.0, t_u_min=20.0,
                       i_max=60, sight_m=100.0):
    """R1 - gorus mesafeli ajan: her kavsakta planli yolunun onundeki
    sight_m'lik kesimi gorur; ayni kavsakta yapilan tum gozlemler tek bir
    ceza (t_u) olarak sayilir.

    Algoritma 1'deki gibi i_max YALNIZ yeniden planlama denemelerini
    sinirlar (dis dongu); bir planin guvenli kismini yurumek (ic dongu)
    bu sayaca dahil DEGILDIR - aksi halde uzun ama tek bir kapanmayla
    kesintiye ugramayan bir yol, hop sayisi i_max'i astigi icin yanlislikla
    ULASILAMAZ sayilirdi (bu, ilk uygulamada gercek bir hataydi ve R1'in
    ulasilamama oranini R0'dan yapay olarak yuksek gosteriyordu)."""
    K = set()
    c = s
    L = 0.0
    k = 0

    for _ in range(i_max + 1):
        G_a = nx.restricted_view(G, [], K) if K else G
        try:
            path = nx.shortest_path(G_a, c, t, weight="length")
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return RunResult(reachable=False, distance_m=L, k_discoveries=k)

        idx = 0
        obstacle = False
        while idx < len(path) - 1:
            window = _path_length_within(G_a, path, idx, sight_m)
            seen_closed = [(u, v, key) for (u, v, key, _len) in window if (u, v, key) in closed_set]
            if seen_closed:
                for (u, v, key) in seen_closed:
                    K.add((u, v, key))
                    for rk in _reverse_keys(G, v, u):
                        K.add((v, u, rk))
                k += 1  # ayni kavsakta gorulen tum kapanmalar tek ceza
                obstacle = True
                break

            u, v = path[idx], path[idx + 1]
            key, data = _shortest_parallel_edge(G_a, u, v)
            L += data.get("length", 0.0)
            idx += 1
            c = v

        if not obstacle:
            v_ort_m_per_min = v_ort_kmh * 1000.0 / 60.0
            return RunResult(reachable=True, distance_m=L, k_discoveries=k,
                              path_nodes=path, time_min=L / v_ort_m_per_min + k * t_u_min)

    return RunResult(reachable=False, distance_m=L, k_discoveries=k)
