# GPU iş paketi — çoklu tohum ve bölgeler arası genelleme (28 Eylül 2026)

Makalede GPU gerektiren iki eksik kaldı:
- Sınırlılık (o): Tablo 12'deki on mimari tek tohumlu.
- §4.4: bölgeler arası genelleme deneyi tasarlandı ama koşulmadı.

İkisi de mevcut Kaggle defteriyle koşulabilir; defterde kod değişikliği gerekmez, yalnız ayar
hücresi değişir.

**Defter:** Kaggle `furkanemrence/quakemind-rapor-paketi` → `defter_ve_araclar/03_kaggle_protokol.ipynb`
(P2 protokolü; 2 km blok bölmesi, `veri_ornekleri/bolme_listesi.csv`).

**Girdi veri seti:** `furkanemrence/quakemind-veri-paketi`. Defter dosyaların SHA-1'ini denetler.

**GPU:** Tesla T4. Bir U-Net MiT-B4 koşusu yaklaşık 82 dk sürdü (kayıttaki `sure_dk`).

Her koşu `kosu_kayitlari/.../tohum_<n>.json` üretir; bu dosyaları bu depoya getirmek yeterli.
Makale tarafını ben güncellerim.

---

## Oturum 1 — çoklu tohum (sınırlılık o, Tablo 12 dipnotu)

En iyi üç MiT-B4 mimarisi, iki ek tohum. `segformer_mitb4` için tohum 7 zaten var.
Tahmini süre 5 koşu × yaklaşık 80 dk ≈ 7 saat; 12 saatlik oturuma sığar.

Ayar hücresinde (hücre 0) şunlar değişir:

```python
MODEL_ADI = "unet_mitb4"
TOHUMLAR = [7, 2026]
PROTOKOL = "P2"
BOLGE_EGITIMI = None
KUYRUK = [dict(MODEL_ADI="upernet_mitb4", TOHUMLAR=[7, 2026]),
          dict(MODEL_ADI="segformer_mitb4", TOHUMLAR=[2026])]
KOSU_PAYI_SA = 2.5
```

Sonuç, Tablo 12'nin "tek tohum" dipnotu ve sınırlılık (o) yerine üç tohumlu ortalama ±
standart sapma olarak yazılır. MiT-B4 ailesi içindeki 0,03'lük farkın tohum oynamasını aşıp
aşmadığı bununla görülür.

## Oturum 2 — bölgeler arası genelleme (§4.4, Tablo 22 satırı)

Yalnız bir ilin verisiyle eğitip öbür ilde sınama: iki yönlü, iki koşu. Defterin önerdiği
model SegFormer-B4; en iyi model U-Net de eklenirse dört koşu olur. Tahmini süre 2–4 ×
yaklaşık 80 dk.

```python
MODEL_ADI = "segformer_mitb4"
TOHUMLAR = [42]
PROTOKOL = "P2"
BOLGE_EGITIMI = "haric:Hatay"            # Hatay eğitimde yok → Hatay'da sınanır
KUYRUK = [dict(BOLGE_EGITIMI="haric:Kahramanmaraş"),
          dict(MODEL_ADI="unet_mitb4", BOLGE_EGITIMI="haric:Hatay"),
          dict(MODEL_ADI="unet_mitb4", BOLGE_EGITIMI="haric:Kahramanmaraş")]
```

Defterin son hücresi (Tablo 15 bloğu) `_haric_*` deneylerini birleşik eğitimle yan yana
tablolar. Makalede §4.4'e tablo olarak girer; birleşik eğitimin il bazındaki değerleri zaten
var (Hatay 0,267–0,425, Kahramanmaraş 0,324–0,456).

---

Not: Son işleme seviyesinin etkisi için GPU gerekmedi. Mevcut koşu kayıtlarında
(`morfoloji` 1/2) ölçülmüştü; makaleye işlendi (revize12).
