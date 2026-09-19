"""Makale metnine dogrudan aktarilacak ek turetilmis sayilar."""
import json
import statistics as st
from pathlib import Path
from analyze import load, flatten, summarize_time, time_min, V_ORT_KMH

RESULTS_DIR = Path(__file__).resolve().parent / "results"

data = load()
rows = flatten(data, source_filter={"synthetic"})

r0_t0 = summarize_time(rows, "R0", "synthetic", t_u=0)
r0_t20 = summarize_time(rows, "R0", "synthetic", t_u=20)
r3 = summarize_time(rows, "R3", "synthetic")
r1 = summarize_time(rows, "R1", "synthetic")
r2 = summarize_time(rows, "R2", "synthetic")

delta_total = r0_t20["mean_time_min"] - r3["mean_time_min"]
delta_distance = r0_t0["mean_time_min"] - r3["mean_time_min"]
pct_from_penalty = 100.0 * (delta_total - delta_distance) / delta_total

print(f"R0 (t_u=20) - R3 = {delta_total:.1f} dk (toplam fark)")
print(f"R0 (t_u=0)  - R3 = {delta_distance:.1f} dk (yalniz mesafe bileseni)")
print(f"Cezadan kaynaklanan pay: %{pct_from_penalty:.1f}")

for name, s in [("R1", r1), ("R2", r2)]:
    captured = r0_t20["mean_time_min"] - s["mean_time_min"]
    pct = 100.0 * captured / delta_total
    print(f"R0->R3 kazancinin {name} tarafindan yakalanan payi: %{pct:.1f}")

r1r2_combo_rows = []  # R1+R2 birlikte (gorus + bilgi paylasimi) icin ayri bir kosum yapilmadi;
# en guclu referans olarak R2'yi (bilgi paylasimi, daha buyuk etkiye sahip) rapor ediyoruz.

print("\n--- EMSR648 bolge bazinda strict kural (Kahramanmaras = 0 testi) ---")
for dcode in ("H-Z1", "H-Z3", "K-Z1", "K-Z2"):
    d = data[dcode]
    print(f"  {dcode} ({d['il']}): EMSR648 strict kapali kenar = {d['emsr648_closed_counts'].get('strict', 'N/A')}, "
          f"medium={d['emsr648_closed_counts'].get('medium')}, loose={d['emsr648_closed_counts'].get('loose')}")

print("\n--- Bolgeler arasi sentetik senaryo dagilimi (n_edges, tohum ortalama etkin oran) ---")
for dcode, d in data.items():
    effs = [d["seeds"][s]["synthetic_info"]["effective_rho"] for s in d["seeds"]]
    print(f"  {dcode} ({d['il']}): n_edges={d['n_edges']}, etkin_oran_ort={st.mean(effs):.4f}")

# Toplam OD cifti / gorev sayisi
total_tasks_per_seed = sum(6 for _ in data)  # N_OD_PAIRS=6 sabit, 8 bolge
print(f"\nTohum basina toplam gorev (OD cifti) sayisi: {total_tasks_per_seed} (8 bolge x 6)")
print(f"Toplam tohum sayisi: 10 (42-51)")
print(f"Toplam kosum (senaryo genelinde, sentetik): {len(rows)//4} OD-cifti-tohum kombinasyonu (4 yontem x bu sayi = {len(rows)} satir)")
