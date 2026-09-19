"""
Algoritma 2 (makale Bolum 3.8.1, P598-612) - baglantililik korumali
sentetik kapanma uretimi. Birebir uygulama.
"""
import networkx as nx
import numpy as np


def _physical_key(G, u, v, k):
    osmid = G[u][v][k].get("osmid")
    if isinstance(osmid, list):
        osmid = tuple(sorted(osmid))
    return (frozenset((u, v)), osmid)


def generate_synthetic_closures(G, *, rho0=0.18, seed=42, alpha=0.92, max_tries=6):
    """G: osmnx MultiDiGraph (guclu baglantili olmasi beklenmez).
    Donen: (B, info) - B kapali (u,v,k) kumesi, info: {'effective_rho', 'halvings'}."""
    edges_sorted = sorted(G.edges(keys=True), key=lambda e: (e[0], e[1], e[2]))

    groups = {}
    for (u, v, k) in edges_sorted:
        pk = _physical_key(G, u, v, k)
        groups.setdefault(pk, []).append((u, v, k))
    physical_roads = list(groups.items())  # deterministic order (sorted-edge insertion)

    largest_scc = max(nx.strongly_connected_components(G), key=len)
    n0 = len(largest_scc)
    tau = alpha * n0
    rho = rho0

    rng = np.random.default_rng(seed)
    B = set()
    halvings = 0
    for _ in range(max_tries):
        m = max(1, int(len(physical_roads) * rho))
        idx = rng.choice(len(physical_roads), size=m, replace=False)
        B = set()
        for i in idx:
            _, edge_list = physical_roads[i]
            for (u, v, k) in edge_list:
                B.add((u, v, k))

        H = nx.restricted_view(G, [], B)
        ni = len(max(nx.strongly_connected_components(H), key=len))

        if ni >= tau:
            return B, {"effective_rho": rho, "halvings": halvings, "n0": n0, "n_after": ni}

        rho = rho / 2
        halvings += 1

    return B, {"effective_rho": rho, "halvings": halvings, "n0": n0, "n_after": ni}
