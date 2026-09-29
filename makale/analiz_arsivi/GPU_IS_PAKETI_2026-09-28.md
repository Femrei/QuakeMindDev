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

**Hazır defterler.** Ayar bloğu aşağıdakilerle doldurulmuş hâlde bu klasörün altında:
- `kaggle/03_kaggle_protokol_oturum1_coklu_tohum.ipynb`
- `kaggle/03_kaggle_protokol_oturum2_bolgeler_arasi.ipynb`

İkisinde de `AGIRLIK_SAKLA = False` ve `GORSEL = False`; yalnız ölçüm gerektiği için çıktı
küçük kalır.

**Durum (28 Eylül):** iki oturum da başlatıldı (sürüm 2; oturum 1 15:02, oturum 2 15:15).
Tarayıcıdan içe aktarımda işe yarayan yol: defterin `metadata.kaggle` alanına
`{"accelerator": "nvidiaTeslaT4", "dataSources": [{"sourceType": "datasetVersion", "sourceId": 19876899}],
"isInternetEnabled": true}` yazılınca veri paketi kendiliğinden bağlanıyor; hızlandırıcı yine de
düzenleyicideki Session options'tan GPU T4 ×2 seçilmeli. İçe aktarırken Advanced Settings →
Quick Save seçilirse defter koşmadan kaydolur.

**Kuyruk uyarısı (28 Eylül, 2. oturum günlüğünden).** Kuyruk hücresi (9) her deneyde 0. hücreyi değil,
deftere gömülü eski ayar kaynağını (`_KAYNAK["ayar"]`) yeniden çalıştırıyor. O kaynağın sonunda
`MODEL_ADI = "unet_mitb4"` var; `TOHUMLAR = [42]`, `BOLGE_EGITIMI = None`, `AGIRLIK_SAKLA = True`,
`GORSEL = True` da oradan gelir. 0. hücreye eklenen oturum ayarları yalnız ilk koşuya uygulanır. Bu
yüzden 2. oturumda `dict(BOLGE_EGITIMI="haric:Kahramanmaraş")` SegFormer yerine U-Net koştu; son öğe
aynı deney olduğu için atlandı. 1. oturumun kuyruk öğeleri modeli ve tohumları açıkça verdiği için
etkilenmedi (yalnız ağırlık ve görsel de yazılıyor). Kuyruğa her öğeyi bütün farklı ayarlarıyla yazın.

**2. oturum sonucu (bitti, 9 946 sn, GPU T4).** Sınama IoU_hasar (Hatay 34, Kahramanmaraş 32 karo):

| Model | Eğitim (karo) | Hatay | Kahramanmaraş | Tümü (91) |
|---|---|---|---|---|
| U-Net MiT-B4 | birleşik (1 013) | 0,366 | 0,456 | 0,433 |
| U-Net MiT-B4 | Hatay hariç (521) | 0,315 | 0,401 | 0,367 |
| U-Net MiT-B4 | Kahramanmaraş hariç (798) | 0,364 | 0,381 | 0,388 |
| SegFormer MiT-B4 | birleşik (1 013) | 0,387 | 0,399 | 0,407 |
| SegFormer MiT-B4 | Hatay hariç (521) | 0,289 | 0,395 | 0,374 |

Birleşik değerler rapor paketindeki `kosu_kayitlari/kaggle/P2/*/tohum_42.json`'dan; SegFormer için Tablo 12 ile aynı, artırım tohumlu `tohum_42__2` kaydı (ilk `tohum_42` eski kodla koşmuştu, 0,426). SegFormer
Kahramanmaraş hariç koşulmadı (yukarıdaki kuyruk sorunu). Tek tohum.

**Ek oturumlar (28 Eylül akşamı).** Tek deneylik defterler, kuyruk yok (`KUYRUK = []`):
- `kaggle/oturum3_segformer_haric_maras/` — SegFormer-B4, Kahramanmaraş dışarıda (2. oturumda kuyruk
  sorunu yüzünden koşmayan deney). 19:04'te başladı.
- `kaggle/oturum4_segformer_tohum7/` — SegFormer-B4 tohum 7, yeni kodla (artırım tohumlu). Eski
  `tohum_7` kaydı eski kodla koşmuştu (EKSIKLER J-130). Kaggle aynı anda en çok iki GPU koşusuna izin
  veriyor ("Maximum batch GPU session count of 2").
- **Durum (22:50):** oturum 1–4 bitti, sonuçlar `sonuclar/` altında ve makalede (revize15, revize16).
- `kaggle/oturum5_unet_haric_tohumlar/`, `kaggle/oturum6_segformer_haric_tohumlar/` — il dışarıda bırakma,
  tohum 7 ve 2026 (kuyruk öğesinde bütün ayarlar açık). 22:27 ve 22:47'de başladı; ikisi de başarıyla bitti (14 319 ve 12 787 sn),
  sonuçlar `sonuclar/oturum5_*`, `oturum6_*` ve makalede (revize17). Kaggle adresi 6. oturumda kısaltılmış: `03-kaggle-protokol-oturum6-segformer-haric-tohumla`.

**Sonuçların alınması.** Çıktı (ağırlıklarla yüzlerce MB) indirilmez; defter her sonucu günlüğe de
bastığı için yalnız günlük indirilir (Logs → Download Logs) ve `kaggle/gunluk_ayikla.py gunluk.txt
<klasör>` ile `<deney>__<model>__tohum_<n>.json` dosyaları çıkarılır. Kayıtlar `kaggle/sonuclar/`
altında; birleşik eğitim tabanı `sonuclar/birlesik_P2/` (rapor paketi v2'den kopya).

Adımlar (her oturum için):
1. Kaggle → Create → New Notebook → File → Import Notebook ile ilgili `.ipynb` dosyasını yükleyin.
2. Add Input bölümünden `furkanemrence/quakemind-veri-paketi` veri setini ekleyin.
3. Settings'te Accelerator = GPU T4 x2, Internet = On. İkisi de hesapta telefon doğrulaması
   ister.
4. Save Version → Save & Run All (Commit). Defter arka planda koşar, tarayıcı kapatılabilir.
5. Bitince sürümün Output sekmesinden `QuakeMind_egitim/` klasörünü indirin; `tohum_*`
   klasörlerindeki `sonuc.json` dosyalarını bana verin.

Süre (eğitim süreleri kayıtlardan: U-Net 82, UPerNet 91, SegFormer-B4 52 dk):
1. oturum yaklaşık 6,5 saat, 2. oturum yaklaşık 4,5 saat. Defterin süre koruması
(`KOSU_PAYI_SA`, 11,75 saat sınırı) sığmayan deneyi başlatmaz.

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
