# Devam Notu — 2026-09-26 (iş → ev bilgisayarı geçişi)

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

## Kaldığımız yer — Tablo 14 GPU işi (güncelleme: 2026-09-26 ~16:45)

Amaç: Tablo 14'ün 5 eksik satırını (U-Net, FPN, DeepLabV3+, LinkNet, PSPNet)
EMSR648 kapanma değerlendirmesiyle doldurmak. Planın arka planı:
`analiz_arsivi/FURKAN_GPU_IS_PAKETI_2026-09-25.md`, `analiz_arsivi/OLCUM_ENVANTERI_2026-09-25.md`.

Tarayıcı kontrolü (Claude in Chrome) artık çalışıyor; Kaggle API token'a GEREK KALMADI.

### 1. Hazır 3 checkpoint — ✅ İNDİRİLDİ (iş bilgisayarı `~/Downloads/`)
Kaggle `furkanemrence/quakemind-modeller` (CC0, herkese açık ama indirme için giriş
gerekir). **Gerçek dosya adları** (eski nottaki `*_s42.pth` adları yanlıştı):
- `unet_mitb4.pth` (257 MB) → `--arch Unet --encoder mit_b4`
- `fpn_mitb4.pth` (251 MB) → `--arch FPN --encoder mit_b4`
- `deeplabv3plus_resnet101.pth` (183 MB) → `--arch DeepLabV3Plus --encoder resnet101`

⚠️ Bu dosyalar git'te YOK (boyut). **Ev bilgisayarında yeniden indir:**
https://www.kaggle.com/datasets/furkanemrence/quakemind-modeller → dosyayı seç → indir simgesi.

### 2. LinkNet + PSPNet (ResNet-34) — ⏳ KAGGLE'DA EĞİTİLİYOR
- Hesap: **utkuceylan** (telefon doğrulandı; `ktotten` hesabında GPU yok, onu kullanma).
- Notebook (PRIVATE): https://www.kaggle.com/code/utkuceylan/notebook25f72b8fc2
  → Version #1, **Save & Run All (Commit)**, GPU T4 ×2, internet açık.
  Tarayıcı/PC kapansa da Kaggle sunucusunda devam eder.
- Defter: `makale/olcum_egitim_grupA_kaggle.ipynb` (= `olcum_egitim_colab.ipynb`
  hücre 0-13 + `/content` klasörü oluşturma düzeltmesi + çıktıyı `/kaggle/working`'e
  kopyalama; Grup B/C çıkarıldı).
- Durum (16:42): veri hazır (KATE-CD 486+486, MEDBFS 438+438; train 1506 / val 158 /
  test 184 karo, sızıntı YOK). 16:25 civarı `linknet_r34 · tohum 42` eğitimi başladı.
  Epoch başına log YOK — yalnız model bitince `OK {... val_iou, test_iou ...}` satırı.
- **Tahmini bitiş: 17:30–17:50** (en kötü ~18:00).
- Bitince: notebook → **Output** sekmesi → `linknet_r34_s42.pth`, `pspnet_r34_s42.pth`
  (+ `olcum_sonuclar.csv`) indir. Hata olduysa **Logs** sekmesine bak.

### 3. Sonraki adım — 5 mimari için kapanma değerlendirmesi (YEREL, CPU yeter)
```
cd model_benchmarks/06_rota/real_run
python table14_segformer_closure.py --label unet       --arch Unet          --encoder mit_b4    --checkpoint ~/Downloads/unet_mitb4.pth
python table14_segformer_closure.py --label fpn        --arch FPN           --encoder mit_b4    --checkpoint ~/Downloads/fpn_mitb4.pth
python table14_segformer_closure.py --label deeplabv3p --arch DeepLabV3Plus --encoder resnet101 --checkpoint ~/Downloads/deeplabv3plus_resnet101.pth
python table14_segformer_closure.py --label linknet    --arch Linknet       --encoder resnet34  --checkpoint ~/Downloads/linknet_r34_s42.pth
python table14_segformer_closure.py --label pspnet     --arch PSPNet        --encoder resnet34  --checkpoint ~/Downloads/pspnet_r34_s42.pth
```
Her biri `results/table14_closure_{label}.json` yazar → Tablo 14 docx'e işlenir.
Not: Claude Code'un otomatik izin sistemi dışarıdan inen `.pth` dosyasının
`torch.load` ile yüklenmesini engelledi — komutları kendin çalıştır (`! python ...`)
ya da Claude'a açıkça izin ver. (Dosyalar kendi Kaggle veri setimizden, güvenilir.)
Ön koşul: `segmentation-models-pytorch` + `timm` kurulu olmalı (MiT-B4 için).

### 4. Drive — ❌ YAPILMADI, ELLE YAPILACAK
Güncel docx Drive'a henüz yüklenmedi (Drive bağlantısı yalnız ad/klasör
değiştirebiliyor, Chrome yükleme sınırı 10 MB, docx 11 MB). Elle: Drive → dosya
(ID `1R5steHoLal0QGs2hLLSMxZbY0cwcbpxu`) → sağ tık → Dosya bilgileri → Sürümleri
yönet → Yeni sürüm yükle. Güncel docx bu commit'le git'te de var.

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
