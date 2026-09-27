# -*- coding: utf-8 -*-
"""Donus maliyetli aramanin gercekten donusu umursadigini gosterir.

Bu bir IDDIA degil OLCUMDUR: sagdan trafikte sola donus karsi akimi keser,
o yuzden esit uzunluktaki iki secenekten sag donuslu olan secilmelidir.
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import networkx as nx  # noqa: E402

from apps.road_damage.utils import donus  # noqa: E402

# 3x3 izgara; ~111 m arayla (0,001 derece enlem).
ADIM = 0.001


def izgara():
    G = nx.MultiDiGraph()
    for i in range(3):
        for j in range(3):
            G.add_node((i, j), y=36.0 + i * ADIM, x=36.0 + j * ADIM)
    for i in range(3):
        for j in range(3):
            for di, dj in ((0, 1), (1, 0)):
                a, b = (i, j), (i + di, j + dj)
                if b in G:
                    G.add_edge(a, b, length=111.0)
                    G.add_edge(b, a, length=111.0)
    return G


def sure(_u, _v, _k, d):
    return d["length"] / (30.0 / 3.6)     # 30 km/sa


def test_sol_donus_sagdan_pahali():
    """Ayni kavsakta sola donmek saga donmekten pahali olmali."""
    G = izgara()
    y = donus.kenar_yonleri(G)
    # (1,1)'e GUNEYDEN gelelim: (0,1) -> (1,1). Kuzeye gidiyoruz.
    gelen = ((0, 1), (1, 1), 0)
    sag = donus.en_kisa_yol(G, (1, 1), (1, 2), sure, yonler=y, gelen_kenar=gelen)[0]
    sol = donus.en_kisa_yol(G, (1, 1), (1, 0), sure, yonler=y, gelen_kenar=gelen)[0]
    duz = donus.en_kisa_yol(G, (1, 1), (2, 1), sure, yonler=y, gelen_kenar=gelen)[0]
    print(f"   duz {duz:.1f} sn | sag {sag:.1f} sn | sol {sol:.1f} sn")
    assert duz < sag < sol, (duz, sag, sol)
    assert math.isclose(sag - duz, donus.DONUS_SN["sag"], abs_tol=1e-6)
    assert math.isclose(sol - duz, donus.DONUS_SN["sol"], abs_tol=1e-6)


def test_esit_uzunlukta_sag_donuslu_yol_secilir():
    """Iki L yolu ayni uzunlukta; sagdan trafikte sag donuslu olan secilir."""
    G = izgara()
    y = donus.kenar_yonleri(G)
    gelen = ((0, 0), (1, 0), 0)          # kuzeye gidiyoruz, (1,0)'dayiz
    # hedef (2,1): ya once kuzey sonra dogu (sag donus), ya once dogu sonra kuzey (sol)
    sn, dugumler, kenarlar, sayac = donus.en_kisa_yol(
        G, (1, 0), (2, 1), sure, yonler=y, gelen_kenar=gelen)
    print(f"   secilen yol {dugumler} | donusler {sayac} | {sn:.1f} sn")
    assert sayac["sol"] == 0, sayac
    assert sayac["sag"] == 1, sayac


def test_u_donusu_en_pahali():
    G = izgara()
    y = donus.kenar_yonleri(G)
    gelen = ((0, 1), (1, 1), 0)
    u = donus.en_kisa_yol(G, (1, 1), (0, 1), sure, yonler=y, gelen_kenar=gelen)[0]
    duz = donus.en_kisa_yol(G, (1, 1), (2, 1), sure, yonler=y, gelen_kenar=gelen)[0]
    print(f"   duz {duz:.1f} sn | U {u:.1f} sn")
    assert u - duz >= donus.DONUS_SN["u"] - 1e-6, (u, duz)


def test_tek_yon_ters_girilemez():
    """`oneway` kenar tek yonlu eklendiyse ters yon bulunmamali."""
    G = nx.MultiDiGraph()
    G.add_node("a", y=36.000, x=36.000)
    G.add_node("b", y=36.001, x=36.000)
    G.add_edge("a", "b", length=111.0)          # yalniz a->b
    y = donus.kenar_yonleri(G)
    ileri = donus.en_kisa_yol(G, "a", "b", sure, yonler=y)[0]
    geri = donus.en_kisa_yol(G, "b", "a", sure, yonler=y)[0]
    print(f"   ileri {ileri:.1f} sn | geri {geri}")
    assert ileri is not None and geri is None


if __name__ == "__main__":
    for ad, f in sorted(globals().items()):
        if ad.startswith("test_"):
            print(f"{ad}:")
            f()
            print("   GECTI")
