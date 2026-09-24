"""Tablo 17/18/20 icin tam gerekli kirilimlar: yalniz H-Z1+K-Z1 (gercek
EMSR648 katkisi olan iki bolge).

D-09 / KALAN_ISLER madde 24 duzeltmesi: asagidaki "H-Z1+K-Z1 EMSR648 rules"
bolumu iki bolgeyi BIRLESIK flatten ediyordu (P382/P383/P358/P448'deki
bolge-ayrimli sayilarin resmi, tekrar-calistirilabilir kaynagi yoktu -- bu
sayilar makale denetiminde `full_run.json`'dan elle/bagimsiz yeniden
hesaplanip dogrulanmisti). `table_emsr648_rules_per_district()` bu bosluğu
kapatir: her bolgeyi AYRI flatten edip R0/R3'u bolge x kural bazinda
raporlar. Ciktisi KALAN_ISLER.md madde 24'teki dogrulanmis sayilarla
(ör. H-Z1 kati fark 14.6 dk, K-Z1 orta-gevsek fark 108.7 dk) eslesmelidir."""
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

print("\n=== H-Z1+K-Z1 EMSR648 rules (birlesik) ===")
for rule in ("strict", "medium", "loose"):
    source = f"emsr648_{rule}"
    r0 = summarize_time(rows_synth if False else flatten(sub), "R0", source)
    r3 = summarize_time(flatten(sub), "R3", source)
    print(f"  [{rule}] R0={r0['mean_time_min']:.1f}+-{r0['std_time_min']:.1f} k={r0['mean_k']:.2f} n={r0['n']} unreach={r0['n_unreachable']}, R3={r3['mean_time_min']:.1f}+-{r3['std_time_min']:.1f}")


def table_emsr648_rules_per_district(data, districts=("H-Z1", "K-Z1")):
    """Tablo 17/madde 24 tarzi: EMSR648 kapsamindaki her bolgeyi AYRI ayri
    (birlestirmeden), 3 kural x R0/R3 olarak raporlar. Ağırlıklı ortalaması
    Tablo 17'nin havuzlanmis (H-Z1+K-Z1 birlesik) degerleriyle eslesmelidir --
    bu iki hesaplama yontemi (bolge-ayrimli agirlikli ort. vs. dogrudan
    havuzlanmis) birbirinin capraz dogrulamasidir."""
    out = {}
    for dcode in districts:
        sub_d = {dcode: data[dcode]}
        rows_d = flatten(sub_d)
        print(f"\n=== {dcode} EMSR648 rules (bolge-ayrimli) ===")
        out[dcode] = {}
        for rule in ("strict", "medium", "loose"):
            source = f"emsr648_{rule}"
            r0 = summarize_time(rows_d, "R0", source)
            r3 = summarize_time(rows_d, "R3", source)
            if r0 is None or r3 is None:
                print(f"  [{rule}] veri yok")
                continue
            diff = r0["mean_time_min"] - r3["mean_time_min"]
            print(f"  [{rule}] R0={r0['mean_time_min']:.1f}+-{r0['std_time_min']:.1f} "
                  f"(n={r0['n']}), R3={r3['mean_time_min']:.1f}+-{r3['std_time_min']:.1f} "
                  f"(n={r3['n']}), fark={diff:.1f} dk")
            out[dcode][rule] = {"R0": r0, "R3": r3, "diff_min": diff}
    return out


district_results = table_emsr648_rules_per_district(data)

with open("results/analysis4_per_district.json", "w", encoding="utf-8") as f:
    json.dump(district_results, f, indent=2, ensure_ascii=False, default=str)

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
