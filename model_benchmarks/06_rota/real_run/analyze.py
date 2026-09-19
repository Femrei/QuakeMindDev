"""
run_full.py'nin uretttigi results/full_run.json'dan makale-tarzi ozet
tablolari turetir. Ham L (mesafe) ve k (kesif) saklandigi icin t_u/v_ort
duyarliligi YENIDEN SIMULASYON GEREKTIRMEDEN, sadece T = L/v_ort + k*t_u
formulunun farkli parametrelerle yeniden hesaplanmasiyla yapilir.
"""
import json
import statistics as st
from pathlib import Path

RESULTS_DIR = Path(__file__).resolve().parent / "results"

V_ORT_KMH = 15.0
T_U_MIN = 20.0


def time_min(L, k, t_u=T_U_MIN, v_ort_kmh=V_ORT_KMH):
    return L / (v_ort_kmh * 1000.0 / 60.0) + k * t_u


def load():
    with open(RESULTS_DIR / "full_run.json", encoding="utf-8") as f:
        return json.load(f)


def flatten(data, source_filter=None):
    """(district, seed, source, method) -> list of run dicts uzerinden
    duz bir liste dondurur."""
    rows = []
    for dcode, dobj in data.items():
        for seed, sobj in dobj["seeds"].items():
            for source, methods in sobj["sources"].items():
                if source_filter and source not in source_filter:
                    continue
                for method, runs in methods.items():
                    for run in runs:
                        rows.append({"district": dcode, "seed": seed, "source": source,
                                     "method": method, **run})
    return rows


def summarize_time(rows, method, source, t_u=T_U_MIN, v_ort_kmh=V_ORT_KMH):
    sel = [r for r in rows if r["method"] == method and r["source"] == source and r["reachable"]]
    unreachable = [r for r in rows if r["method"] == method and r["source"] == source and not r["reachable"]]
    times = [time_min(r["distance_m"], r["k_discoveries"], t_u, v_ort_kmh) for r in sel]
    ks = [r["k_discoveries"] for r in sel]
    n_total = len(sel) + len(unreachable)
    if not times:
        return None
    return {
        "n": len(times), "n_unreachable": len(unreachable), "n_total": n_total,
        "mean_time_min": st.mean(times),
        "std_time_min": st.pstdev(times) if len(times) > 1 else 0.0,
        "mean_k": st.mean(ks) if ks else 0.0,
    }


def table_headline(data):
    """Tablo 16 tarzi: sentetik senaryoda R0 vs R3 (tum bolgeler/tohumlar)."""
    rows = flatten(data, source_filter={"synthetic"})
    r0 = summarize_time(rows, "R0", "synthetic")
    r3 = summarize_time(rows, "R3", "synthetic")
    print("\n=== Tablo 16 tarzi (senaryo geneli, sentetik kapanma) ===")
    print(f"  R0 (naif)         : {r0['mean_time_min']:.1f} ± {r0['std_time_min']:.1f} dk "
          f"(n={r0['n']}, ulasilamayan={r0['n_unreachable']}/{r0['n_total']})")
    print(f"  R3 (onerilen/tam) : {r3['mean_time_min']:.1f} ± {r3['std_time_min']:.1f} dk "
          f"(n={r3['n']}, ulasilamayan={r3['n_unreachable']}/{r3['n_total']})")
    diff = r0['mean_time_min'] - r3['mean_time_min']
    print(f"  Fark: {diff:.1f} dk")
    return {"R0": r0, "R3": r3, "diff_min": diff}


def table_references(data):
    """Tablo 19 tarzi: R0/R1/R2/R3 karsilastirmasi + R0->R3 kazancinin
    R1/R2 tarafindan yakalanan payi."""
    rows = flatten(data, source_filter={"synthetic"})
    out = {}
    for m in ("R0", "R1", "R2", "R3"):
        out[m] = summarize_time(rows, m, "synthetic")
    print("\n=== Tablo 19 tarzi (R0/R1/R2/R3, sentetik kapanma) ===")
    for m in ("R0", "R1", "R2", "R3"):
        s = out[m]
        print(f"  {m}: {s['mean_time_min']:.1f} ± {s['std_time_min']:.1f} dk "
              f"(k_ort={s['mean_k']:.2f}, ulasilamayan={s['n_unreachable']}/{s['n_total']})")
    total_gain = out["R0"]["mean_time_min"] - out["R3"]["mean_time_min"]
    for m in ("R1", "R2"):
        captured = out["R0"]["mean_time_min"] - out[m]["mean_time_min"]
        pct = 100.0 * captured / total_gain if total_gain else float("nan")
        print(f"  R0->R3 kazancinin {m} tarafindan yakalanan payi: %{pct:.1f}")
    return out


def table_emsr648_rules(data):
    """Tablo 20 tarzi: EMSR648 kapsamindaki bolgelerde 3 kural x R0/R3."""
    rows_all = flatten(data)
    print("\n=== Tablo 20 tarzi (EMSR648 kapsamindaki bolgeler, 3 kural) ===")
    out = {}
    for rule in ("strict", "medium", "loose"):
        source = f"emsr648_{rule}"
        r0 = summarize_time(rows_all, "R0", source)
        r3 = summarize_time(rows_all, "R3", source)
        if r0 is None:
            print(f"  [{rule}] veri yok (EMSR648 kapsamindaki bolge/kesim bulunamadi)")
            continue
        diff = r0['mean_time_min'] - r3['mean_time_min']
        print(f"  [{rule}] R0={r0['mean_time_min']:.1f}±{r0['std_time_min']:.1f} dk, "
              f"R3={r3['mean_time_min']:.1f}±{r3['std_time_min']:.1f} dk, fark={diff:.1f} dk "
              f"(n={r0['n']})")
        out[rule] = {"R0": r0, "R3": r3, "diff_min": diff}
    return out


def table_tu_sensitivity(data):
    """Tablo 17 tarzi: t_u duyarliligi (yeniden simulasyon gerektirmez)."""
    rows = flatten(data, source_filter={"synthetic"})
    print("\n=== Tablo 17 tarzi (t_u duyarliligi, sentetik kapanma, R0) ===")
    out = {}
    for t_u in (0, 5, 10, 20, 30):
        s = summarize_time(rows, "R0", "synthetic", t_u=t_u)
        out[t_u] = s
        print(f"  t_u={t_u} dk: R0 ortalama={s['mean_time_min']:.1f} dk")
    return out


def per_district_table10(data):
    print("\n=== Tablo 10 tarzi (bolge basina sentetik kapanma, tohum ortalamasi) ===")
    out = {}
    for dcode, dobj in data.items():
        effs = [dobj["seeds"][s]["synthetic_info"]["effective_rho"] for s in dobj["seeds"]]
        halvings = [dobj["seeds"][s]["synthetic_info"]["halvings"] for s in dobj["seeds"]]
        n_closed = [len(dobj["seeds"][s]["sources"]["synthetic"]["R0"]) for s in dobj["seeds"]]
        print(f"  {dcode} ({dobj['il']}): n_edges={dobj['n_edges']}, "
              f"etkin_oran={st.mean(effs):.4f}±{st.pstdev(effs) if len(effs)>1 else 0:.4f}, "
              f"yarilama_ort={st.mean(halvings):.2f}")
        out[dcode] = {"n_edges": dobj["n_edges"], "mean_effective_rho": st.mean(effs),
                      "mean_halvings": st.mean(halvings)}
    return out


if __name__ == "__main__":
    data = load()
    print(f"Yuklenen bolge sayisi: {len(data)}")
    result = {
        "table10_style": per_district_table10(data),
        "table16_style": table_headline(data),
        "table17_style": table_tu_sensitivity(data),
        "table19_style": table_references(data),
        "table20_style": table_emsr648_rules(data),
    }
    with open(RESULTS_DIR / "analysis_summary.json", "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False, default=str)
    print(f"\nOzet: {RESULTS_DIR / 'analysis_summary.json'}")
