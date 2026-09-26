# Devam Notu — 2026-09-26 (iş → ev bilgisayarı geçişi, 17:35 güncel)

> Bu dosya, PC yeniden başlatıldıktan sonra Claude Code ile kaldığımız yerden
> devam edebilmek içindir. Tüm ayrıntılı durum/gerekçe `DURUM.md`'dedir; burası
> yalnızca "bugün ne yaptık, sırada ne var" özetidir.

## Bugün (2026-09-26) tamamlananlar

### Docx düzeltmeleri (hepsi uygulandı, dosya güncel)
1. Şekil 2 — kutu dışına taşan metin düzeltildi (görsel piksel düzeyinde onarıldı).
2. Şekil 10 — placeholder yerine gerçek güzergâh karşılaştırma görseli eklendi
   (`model_benchmarks/06_rota/real_run/results/figure10.png`).
3. P280, P293, P436, P483 — "iskelet"/"hiçbir hücre doldurulmadı" gibi artık
   yanlış olan abartılı ifadeler, tabloların gerçek (kısmi) doluluk durumuna
   göre düzeltildi.
4. Tablo 21 başlığındaki "(iskelet)" ibaresi kaldırıldı (tablo %70 dolu).
5. Tablo 20 dipnotu — "transportationL" İngilizce kalıntısı → "yol" düzeltildi (9 hücre).
6. P398 — cümle sonundaki başıboş "n" harfi silindi.
7. P38 — TE23D "bina odaklı" / "enkaz alanı" çelişkisi hizalandı.
8. P333 — "430-433/480" → "430-432/480" (off-by-one düzeltildi, fiili maks. 432).
9. P232 — "Belen (H-Z5)... sabit" yanlış iddiası düzeltildi. **Gerçek veriyle
   doğrulandı** (`full_run.json` + `synthetic_closures.py` bizzat çalıştırıldı):
   sabit kalan bölgeler **Kırıkhan (H-Z3) ve Kahramanmaraş merkez (K-Z1)** (10
   tohumda da hep 0 yarılama); diğer bölgeler 0-3 arası değişiyor.

### Kod
- `QuakeMindBackend/apps/road_damage/utils/inference.py`: `load_simple_model()`
  artık `arch`/`encoder` parametresi alıyor (varsayılan Segformer/mit_b4, üretim
  kodu bozulmadı) — Tablo 14'ün 5 mimarisini yükleyebilmek için genelleştirildi.
- `model_benchmarks/06_rota/real_run/table14_segformer_closure.py`: CLI eklendi
  (`--label --arch --encoder --checkpoint`), her çalıştırma kendi
  `results/table14_closure_{label}.json` dosyasına yazıyor. Segformer sonucu
  (`table14_segformer_closure.json`) korunuyor. Syntax doğrulandı, henüz
  checkpoint'ler gelmediği için ÇALIŞTIRILMADI.

### Google Drive
- Makale docx'i Drive'a yüklendi: klasör
  https://drive.google.com/drive/folders/1208L5qJP92tYUVJR8-tSJsc7N0jqANWx
  dosya ID `1R5steHoLal0QGs2hLLSMxZbY0cwcbpxu`. **Henüz bugünkü 9 düzeltmeyi
  içeren güncel sürüm Drive'a yüklenmedi** — yerel dosya güncel, Drive'daki eski.
  Sıradaki adım: Drive'da dosyaya sağ tık → Yönet → Yeni sürüm yükle.

## Çözülemeyen / doğrulanamayan bir madde

**P234 / P316 / P447** — "%0,55–4,50" ve "%2,84±0,20" sentetik kapanma oranı
iddiaları. Bunu doğrulamaya çalıştım, biri `SARI_VURGU_TUTARLILIK` raporunun
bulduğu (%1,32–1,97), biri de benim `generate_synthetic_closures()`'ı bizzat
çalıştırarak bulduğum (%2,24–18) olmak üzere **üç farklı sonuç** çıktı, hiçbiri
birbirini doğrulamıyor. **Dokunulmadı** — yanlış bir sayıyla değiştirmektense
olduğu gibi bırakmak daha güvenli. Kaynak scriptin/parametrenin (`rho0` değeri
dahil) hangi koşumdan geldiği netleşirse düzeltilebilir.

## Kaldığımız yer — Tablo 14 (güncelleme: 2026-09-26 ~17:35)

### Durum özeti
- ✅ **Kaggle Grup A eğitimi BİTTİ** (utkuceylan, notebook25f72b8fc2, 59 dk, GPU T4):
  - `linknet_r34` s42: val IoU 0,2861 · **test IoU 0,331** · P 0,4525 · R 0,5522 · F1 0,4974
  - `pspnet_r34`  s42: val IoU 0,3094 · **test IoU 0,3502** · P 0,5300 · R 0,5078 · F1 0,5187
- ✅ **7 checkpoint hazır** (iş bilgisayarı `~/Downloads/`, git'te YOK):
  `unet_mitb4.pth`, `fpn_mitb4.pth`, `deeplabv3plus_mitb4.pth`, `deeplabv3plus_resnet101.pth`,
  `linknet_r34_s42.pth`, `pspnet_r34_s42.pth` + SegFormer üretim checkpoint'i
  (`optimized_mitb4_focal_dice30.pth`, yoksa HuggingFace `Utbird/dispath_optimized_mitb4_focal_dice30`'dan kendiliğinden iner).
- ⛔ **Tablo 14 kapanma değerlendirmesi HENÜZ KOŞULAMADI** — Overpass (OSM) sunucuları
  iş ağının IP'sini geçici olarak engelledi (TCP "Connection refused", tüm aynalar).
- Karar (kullanıcı): DeepLabV3+ için **ikisi de** koşulacak (MiT-B4 ve ResNet-101) → Tablo 14'te 7 satır.
- ⚠️ Hatırlatma: TÜM modeller (SegFormer dahil) **bina hasarı** modelidir; yol kapanması =
  hasar maskesi ∩ OSM yol maskesi. Tablo 14'e "farklı görev" uyarısı YAZILMAYACAK.

### Bu oturumda bulunan ve düzeltilen hata (ÖNEMLİ)
`table14_segformer_closure.py` örnek noktalarının tohumu `abs(hash(code))` idi — Python
string `hash()`'i her süreçte rastgele (PYTHONHASHSEED) → **her koşu farklı karolar**
seçiyordu. Sonuçları:
- 2026-09-25'te docx'e işlenen **SegFormer satırı (6 örnek, 4513 kenar, DP=0) tekrar
  üretilemez** → yeni deterministik örnek kümesiyle YENİDEN ölçülecek, satır değişecek.
- Modeller arası karşılaştırma geçersiz olurdu.
Düzeltmeler (commit'te):
- tohum `zlib.crc32(code)` (deterministik); örnek lat/lon artık JSON'a yazılıyor
- `--prefetch` modu: 8 karonun OSM grafı (osmnx `./cache`) + yol maskesi
  (`cache/table14_roadmask/*.npy`) modelsiz önbelleğe alınır; Overpass reddederse 5 dk
  arayla ~2 saat dener. Böylece 7 model **birebir aynı karo/maske/graf** üzerinde ölçülür.
- yol maskesi artık diske önbellekleniyor (eskiden yalnız bellekte → her model Overpass'a
  yeniden gidiyor, reddedilince "YOL MASKESI BOS" diye karo atlıyordu).
- İlk U-Net denemesi (2/8 örnek, eski tohum) GEÇERSİZ sayıldı, repoya konmadı.

### EVDE YAPILACAKLAR (sırayla)
1. `git checkout makale && git pull`
2. 6 checkpoint'i indir → `~/Downloads/`:
   - https://www.kaggle.com/datasets/furkanemrence/quakemind-modeller →
     `unet_mitb4.pth`, `fpn_mitb4.pth`, `deeplabv3plus_mitb4.pth`, `deeplabv3plus_resnet101.pth`
   - https://www.kaggle.com/code/utkuceylan/notebook25f72b8fc2 → **Output** →
     `linknet_r34_s42.pth`, `pspnet_r34_s42.pth` (Kaggle bunları `.zip` uzantısıyla
     indirir; torch checkpoint'i zaten zip biçiminde → **açma**, sadece `.pth` olarak yeniden adlandır)
3. Ortam: `QuakeMindBackend/venv` (smp 0.5.0, timm, osmnx 2.x, torch). Evde venv yoksa
   `pip install -r QuakeMindBackend/requirements.txt` (+ `segmentation-models-pytorch timm osmnx`).
4. Tek komut (CPU yeter, ~1–1,5 saat; önce Overpass erişimi test et:
   `curl -s -o /dev/null -w '%{http_code}' https://overpass-api.de/api/status` → 200 olmalı):
   ```
   model_benchmarks/06_rota/real_run/run_table14_all.sh
   ```
   (`CKPT_DIR`, `LOG_DIR`, `PY` ortam değişkenleriyle yollar değiştirilebilir.)
   "PREFETCH EKSIK" derse Overpass hâlâ kapalıdır — bekleyip tekrar çalıştır.
5. Sonuçlar: `model_benchmarks/06_rota/real_run/results/table14_segformer_closure.json` +
   `table14_closure_{unet,fpn,deeplabv3p_mitb4,deeplabv3p_r101,linknet,pspnet}.json`.
6. Docx Tablo 14 (P334-P338 civarı): 5 `[ÖLÇÜLECEK]` satırını doldur, **DeepLabV3+ için
   2 satır** (MiT-B4 / R101), SegFormer satırını YENİ ölçümle güncelle; altındaki iki
   paragrafı (6 örnek/4513 kenar/"kalan beş mimari ölçülemedi") yeni örneklem ve
   sonuçlarla yeniden yaz. P510'daki "yalnızca SegFormer için" ifadesini düzelt.
   Karşılaştırma: aynı τ taraması, orta kural esas.
7. Docx'i Drive'a "yeni sürüm" olarak elle yükle (11 MB > Chrome 10 MB sınırı;
   dosya ID `1R5steHoLal0QGs2hLLSMxZbY0cwcbpxu`).

## Bugün hâlâ sizden bekleyen kararlar

- 🔴 **Roboflow API anahtarını iptal et + yenile** (git geçmişinde açık,
  `9d4cc22`/`55a50d1`) — Tablo 24 YOLO koşumu için de gerekli.
- ORCID numaraları (P6, placeholder).
- Türkçe metin kümesi erişim politikası (açık / istek üzerine / kapalı, P503).
- 855 sarı vurgunun geri kalanı henüz tam taranmadı (yalnız `SARI_VURGU_TUTARLILIK`
  raporundaki 3 sayısal çelişki — P232✅, P234/316/447❌ çözülemedi, P333✅ — ele
  alındı; geri kalan ~550 vurgu içerik olarak gözden geçirilmedi).

## Klasör düzeni (bugün temizlendi)

Eski/tamamlanmış analiz notları `makale/analiz_arsivi/` altına taşındı
(BOLUM84_ATIF_DENETIM, EGITIM_SONRASI_GUNCELLENECEKLER, OLCUM_ENVANTERI,
SARI_VURGU_TUTARLILIK, FURKAN_GPU_IS_PAKETI). Üst düzeyde yalnız `DURUM.md`
(tek kaynak), `YAPILACAKLAR.md` (kısa liste), bu dosya, `lisans_epostalari_taslak.md`
, `olcum_egitim_colab.ipynb` ve `olcum_egitim_grupA_kaggle.ipynb` kaldı.
