"""
Sekil 10 icin veri uretimi: H-Z1, tohum=51, emsr648_medium kapanma kumesi,
od_pairs[2] -- R0 (naif ajan) ile R3 (onerilen sistem / kusursuz bilgi)
guzergahlarinin dugum-koordinat dizilerini, kapali kenarlari ve R0'in
kesif noktalarini JSON olarak disari yazar (cizim ayri bir adimda, matplotlib
gerektirmeyen bir ortamda da calisabilsin diye).
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from scenario import load_district
from emsr648_closures import closed_osm_edges
from assignment import build_victims_and_teams, run_algorithm3
from naive_agent import naive_agent_run, perfect_info_run

CODE = "H-Z1"
SEED = 51
RULE = "medium"
OD_INDEX = 2
OUT_PATH = Path(__file__).resolve().parent / "results" / "figure10_data.json"


def main():
    dg = load_district(CODE)
    G = dg.G
    print(f"graf: {G.number_of_nodes()} dugum, {G.number_of_edges()} kenar")

    closed_set = closed_osm_edges(G, "AOI11", RULE)
    print(f"kapali kenar sayisi ({RULE}): {len(closed_set)}")

    victims, teams = build_victims_and_teams(G, 6, SEED)
    assignments, _lock = run_algorithm3(G, victims, teams)
    od_pairs = [(t["hq_node"], v["node"]) for (t, v, _role) in assignments]
    s, t = od_pairs[OD_INDEX]
    print(f"od_pairs[{OD_INDEX}] = ({s}, {t})")

    r0 = naive_agent_run(G, closed_set, s, t)
    r3 = perfect_info_run(G, closed_set, s, t)
    print(f"R0: reachable={r0.reachable} dist={r0.distance_m:.1f}m k={r0.k_discoveries} "
          f"path_len={len(r0.path_nodes)}")
    print(f"R3: reachable={r3.reachable} dist={r3.distance_m:.1f}m k={r3.k_discoveries} "
          f"path_len={len(r3.path_nodes)}")

    def node_coord(n):
        d = G.nodes[n]
        return [d["y"], d["x"]]  # [lat, lon]

    def path_coords(path_nodes):
        return [node_coord(n) for n in path_nodes]

    # naive_agent_run yalniz SON (temiz) alt-yolu dondurur; R0'in fiilen
    # yurudugu TAM izi (30 kez tikanip geri planlama yaparak) yeniden
    # kurmak icin ayni algoritmayi burada tekrar calistirip her adimda
    # gercekten ilerledigi dugumleri (walked_nodes) de topluyoruz.
    import networkx as nx
    from naive_agent import _shortest_parallel_edge, _reverse_keys

    K = set()
    discovered_edge_coords = []
    walked_nodes = [s]
    c = s
    for _ in range(60):
        G_a = nx.restricted_view(G, [], K) if K else G
        try:
            path = nx.shortest_path(G_a, c, t, weight="length")
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            break
        obstacle = False
        for u, v in zip(path[:-1], path[1:]):
            key, _data = _shortest_parallel_edge(G_a, u, v)
            if (u, v, key) in closed_set:
                K.add((u, v, key))
                for rk in _reverse_keys(G, v, u):
                    K.add((v, u, rk))
                discovered_edge_coords.append([node_coord(u), node_coord(v)])
                c = u
                obstacle = True
                break
            walked_nodes.append(v)
            c = v
        if not obstacle:
            break
    r0_full_path_coords = path_coords(walked_nodes)

    # Kapali kenarlarin TAMAMININ (bu bolgede, bu kuralda) koordinatlarini da
    # haritada gri olarak gostermek icin cikart (yalniz gorunur/bbox'a yakin
    # olanlari -- guzergah bbox'ina gore filtrelenecek).
    all_closed_coords = []
    for (u, v, k) in closed_set:
        if G.has_edge(u, v, k):
            all_closed_coords.append([node_coord(u), node_coord(v)])

    out = {
        "district": CODE, "seed": SEED, "rule": RULE, "od_index": OD_INDEX,
        "od_pair": [s, t],
        "r0": {
            "reachable": r0.reachable, "distance_m": r0.distance_m,
            "k_discoveries": r0.k_discoveries, "time_min": r0.time_min,
            "path_coords": r0_full_path_coords,
            "final_leg_coords": path_coords(r0.path_nodes),
        },
        "r3": {
            "reachable": r3.reachable, "distance_m": r3.distance_m,
            "k_discoveries": r3.k_discoveries, "time_min": r3.time_min,
            "path_coords": path_coords(r3.path_nodes),
        },
        "discovered_edge_coords": discovered_edge_coords,
        "all_closed_edge_coords": all_closed_coords,
    }
    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"yazildi -> {OUT_PATH}")


if __name__ == "__main__":
    main()
