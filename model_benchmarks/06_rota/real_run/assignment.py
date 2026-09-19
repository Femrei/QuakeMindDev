"""
Algoritma 3 (makale Bolum 3.9, P240-254) - bolge ici rol-farkinda acgozlu
ekip atamasi. Birebir uygulama; NLP kategori->rol adimi GERCEK BERTurk
siniflandiricisinin (classify_pool.py ile onbelleklenmis) ciktisini kullanir.

Rol dagilimi (~10 arama-kurtarma : 4 medikal : 4 lojistik, makale P255)
ve durum dagilimi (kritik/mahsur/yarali/hafif) ORANSAL olarak uygulanir;
tam sayilar (18 ekip, 7+1..3) orijinal (kayip) sahnenin ozel dagilimidir,
burada YENI ve seffaf bir sekilde her bolge icin ayni oranla uretilir.
"""
import json
import math
from pathlib import Path

import numpy as np

from task_locking import TaskLock, ConflictError

CACHE_PATH = Path(__file__).resolve().parent / "text_category_cache.json"
with open(CACHE_PATH, encoding="utf-8") as f:
    _TEXT_CACHE = json.load(f)
_TEXTS = list(_TEXT_CACHE.keys())

ROLES = ("arama-kurtarma", "medikal", "lojistik")
ROLE_WEIGHTS = (10, 4, 4)  # makale P255 oranindan

STATUS_ORDER = {"kritik": 0, "mahsur": 1, "yarali": 2, "hafif": 3}
STATUS_WEIGHTS = {"kritik": 0.15, "mahsur": 0.15, "yarali": 0.35, "hafif": 0.35}
CHANNEL_ORDER = {"acil_cagri": 0, "diger": 1}

CATEGORY_TO_ROLE = {
    "Enkaz Bildirimi": "arama-kurtarma",
    "Acil Yardım İhtiyacı": "medikal",
    "Lojistik İhtiyaç Bildirimi": "lojistik",
}


def _weighted_roles(n, rng):
    total = sum(ROLE_WEIGHTS)
    counts = [int(n * w / total) for w in ROLE_WEIGHTS]
    while sum(counts) < n:
        counts[rng.integers(0, len(counts))] += 1
    roles = []
    for role, c in zip(ROLES, counts):
        roles.extend([role] * c)
    rng.shuffle(roles)
    return roles[:n]


def _weighted_status(n, rng):
    statuses = list(STATUS_WEIGHTS.keys())
    weights = np.array([STATUS_WEIGHTS[s] for s in statuses])
    weights = weights / weights.sum()
    return list(rng.choice(statuses, size=n, p=weights))


def haversine_m(lat1, lon1, lat2, lon2):
    R = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def build_victims_and_teams(G, n, seed):
    """G'nin en buyuk guclu bagli bilesenindeki dugumlerden n afetzede ve
    n ekip (karargah) orneklenir; roller/durumlar/metinler oransal olarak
    atanir (yukarida aciklanan YENI, seffaf dagilim)."""
    import networkx as nx
    largest_scc = max(nx.strongly_connected_components(G), key=len)
    nodes = list(largest_scc)
    rng = np.random.default_rng(seed)

    victim_nodes = rng.choice(nodes, size=n, replace=False)
    remaining = [nd for nd in nodes if nd not in set(victim_nodes.tolist())]
    team_nodes = rng.choice(remaining if len(remaining) >= n else nodes, size=n, replace=False)

    profile_roles = _weighted_roles(n, rng)
    statuses = _weighted_status(n, rng)
    channels = list(rng.choice(list(CHANNEL_ORDER.keys()), size=n))

    victims = []
    for i in range(n):
        status = statuses[i]
        text = None
        if status in ("yarali", "hafif"):
            text = _TEXTS[rng.integers(0, len(_TEXTS))]
        victims.append({
            "id": f"v{i}", "node": int(victim_nodes[i]), "status": status,
            "channel": channels[i], "profile_role": profile_roles[i], "text": text,
        })

    team_roles = _weighted_roles(n, rng)
    teams = [{"id": f"t{i}", "hq_node": int(team_nodes[i]), "role": team_roles[i]}
             for i in range(n)]

    return victims, teams


def run_algorithm3(G, victims, teams):
    """Algoritma 3'un birebir uygulamasi. Donen: liste of (team, victim, role_used)."""
    V = sorted(victims, key=lambda v: (STATUS_ORDER[v["status"]], CHANNEL_ORDER[v["channel"]]))
    T = list(teams)
    lock = TaskLock()
    assignments = []

    def pos(node_id):
        d = G.nodes[node_id]
        return d["y"], d["x"]

    for v in V:
        if not T:
            break
        if v["status"] in ("kritik", "mahsur"):
            role = v["profile_role"]
        else:
            cat = _TEXT_CACHE[v["text"]]["category"]
            role = CATEGORY_TO_ROLE.get(cat, v["profile_role"])

        H = [t for t in T if t["role"] == role]
        if not H:
            H = T

        vlat, vlon = pos(v["node"])
        t_star = min(H, key=lambda t: haversine_m(vlat, vlon, *pos(t["hq_node"])))
        T.remove(t_star)

        try:
            lock.assign(t_star["id"], v["id"])
        except ConflictError:
            continue  # bu senaryoda olusmaz (her hedef bir kez atanir) ama Algoritma 3, satir 10 ile tutarli

        assignments.append((t_star, v, role))

    return assignments, lock


def test_duplicate_dispatch_on_real_scenario(assignments, lock, n_attempts=5):
    """Algoritma 3'un urettigi GERCEK atamalar uzerinde, halihazirda
    atanmis bir afetzedeye ikinci bir ekibi (farkli id) atamaya calisir;
    TaskLock'un bunu reddettigini dogrular (makale P252, 'HTTP 409')."""
    if not assignments:
        return {"n_attempts": 0, "n_rejected": 0}
    rng = np.random.default_rng(0)
    n_rejected = 0
    for i in range(n_attempts):
        _t, v, _role = assignments[i % len(assignments)]
        fake_team_id = f"duplicate-attempt-{i}"
        try:
            lock.assign(fake_team_id, v["id"])
        except ConflictError:
            n_rejected += 1
    return {"n_attempts": n_attempts, "n_rejected": n_rejected}
