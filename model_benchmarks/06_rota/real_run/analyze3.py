"""Bolum 4.8 (gecilebilirlik kurali) icin il bazinda (Hatay: H-Z1+H-Z3,
Kahramanmaras: K-Z1+K-Z2) kirilim."""
import json
from analyze import load, flatten, summarize_time

data = load()

HATAY = {"H-Z1", "H-Z3"}
KAHRAMANMARAS = {"K-Z1", "K-Z2"}

for il_name, codes in [("Hatay", HATAY), ("Kahramanmaras", KAHRAMANMARAS)]:
    filtered = {k: v for k, v in data.items() if k in codes}
    rows = flatten(filtered)
    print(f"\n=== {il_name} ({codes}) ===")
    for rule in ("strict", "medium", "loose"):
        source = f"emsr648_{rule}"
        r0 = summarize_time(rows, "R0", source)
        r3 = summarize_time(rows, "R3", source)
        if r0 is None:
            print(f"  [{rule}] veri yok")
            continue
        print(f"  [{rule}] R0={r0['mean_time_min']:.1f}+-{r0['std_time_min']:.1f} dk (n={r0['n']}), "
              f"R3={r3['mean_time_min']:.1f}+-{r3['std_time_min']:.1f} dk, "
              f"fark={r0['mean_time_min']-r3['mean_time_min']:.1f} dk")
