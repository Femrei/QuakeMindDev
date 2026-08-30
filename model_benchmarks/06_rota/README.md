# 06 · Kapanma-farkında rota

Burada **model değil algoritma** kıyaslanır.

**Bizim yöntem:** yerel OSM PBF grafı üzerinde A* / Dijkstra; hasar iki yoldan
girer — (1) tıkanıklığın 25 m yarıçapında sert kapatma, (2) hasar noktalarına
yakınlığa göre kenar ağırlığı cezası. Kapanma fiziksel yolun iki yönünü birden
kapatır. Karşılaştırma tabanı: kapanmaları bilmeyen naif ajan.

## Defterler

| dosya | karşılaştırma | ne gösterir |
|---|---|---|
| `01_risk_weighted_astar` | **referans** — hard + soft | + 80/80 erişilebilirlik eğrisi |
| `02_naive_agent` | kapanma bilgisiz | bilgi kazancı; ayrıca *fiili* bloklanma oranı |
| `03_pure_shortest_path` | sadece sert kapatma | yumuşak cezanın katkısını izole eder |
| `04_algo_comparison` | Dijkstra vs A* vs çift yönlü | hesap süresi — "<10 sn" iddiası |
| `05_osrm` | OSRM (Contraction Hierarchies) | endüstri hız tabanı (yerel Docker) |
| `06_openrouteservice_avoid_areas` | ORS avoid_polygons | sahada kullanılan sistem (MSF 2023) |
| `00_leaderboard` | özet tablo | — |

## Metrikler

Seyahat süresi · mesafe · başarısız rota oranı · hesap süresi ·
erişilebilirlik oranı · rota değişim oranı · **80/80 sınırı** (olayların %80'ine
erişimin %80 olasılıkla korunduğu bozulma seviyesi).

Antakya (126 olay) ve Kahramanmaraş (35 olay) aynı iki şehir olduğu için
literatürdeki rota değişim oranıyla (%80 / %80) doğrudan karşılaştırılabilir.

## Veri

| kaynak | kullanım | durum |
|---|---|---|
| Geofabrik Türkiye OSM PBF | yol grafı | indir → `common.CONFIG['osm_pbf']` |
| Copernicus EMSR648 | kapanma zemin doğruluğu | depoda `safety_areas.geojson` |
| HOT OSM 2023 Türkiye | üçüncü kapanma kaynağı | opsiyonel |

## Kurulum

```bash
pip install -q osmnx pyrosm networkx requests openrouteservice shapely
python _build.py
```

`01`'i önce çalıştır — referans yolları `data/baseline_paths.pkl`'e yazar,
diğer defterler rota değişim oranı için bunu kullanır.
