"""Tablo 17/18/20 icin tam gerekli kirilimlar: yalniz H-Z1+K-Z1 (gercek
EMSR648 katkisi olan iki bolge)."""
import json
import statistics as st
from analyze import load, flatten, summarize_time, time_min

data = load()

# ---- H-Z1 + K-Z1 only, synthetic ----
sub = {k: v for k, v in data.items() if k in ("H-Z1", "K-Z1")}
rows_synth = flatten(sub, source_filter={"synthetic"})
print("=== H-Z1+K-Z1 synthetic ===")
for m in ("R0", "R1", "R2", "R3"):
    s = summarize_time(rows_synth, m, "synthetic")
    print(f"  {m}: {s['mean_time_min']:.1f} +- {s['std_time_min']:.1f} (k={s['mean_k']:.2f}, n={s['n']}, unreach={s['n_unreachable']})")

print("\n=== H-Z1+K-Z1 EMSR648 rules ===")
for rule in ("strict", "medium", "loose"):
    source = f"emsr648_{rule}"
    r0 = summarize_time(rows_synth if False else flatten(sub), "R0", source)
    r3 = summarize_time(flatten(sub), "R3", source)
    print(f"  [{rule}] R0={r0['mean_time_min']:.1f}+-{r0['std_time_min']:.1f} k={r0['mean_k']:.2f} n={r0['n']} unreach={r0['n_unreachable']}, R3={r3['mean_time_min']:.1f}+-{r3['std_time_min']:.1f}")

# t_u sweep for H-Z1+K-Z1 synthetic AND for the full 8-region synthetic (already have) plus EMSR rules
print("\n=== t_u sweep (8-region synthetic) R0 ===")
rows_all_synth = flatten(data, source_filter={"synthetic"})
for t_u in (0, 2, 5, 10, 20, 30):
    s = summarize_time(rows_all_synth, "R0", "synthetic", t_u=t_u)
    print(f"  t_u={t_u}: R0={s['mean_time_min']:.1f}")

print("\n=== t_u sweep EMSR648 rules (H-Z1+K-Z1) R0 ===")
rows_sub_all = flatten(sub)
for rule in ("strict", "medium", "loose"):
    source = f"emsr648_{rule}"
    line = []
    for t_u in (0, 2, 5, 10, 20, 30):
        s = summarize_time(rows_sub_all, "R0", source, t_u=t_u)
        line.append(f"t{t_u}={s['mean_time_min']:.1f}")
    print(f"  [{rule}]", " ".join(line))
