# QuakeMind — Ölçüm Envanteri (77 yer tutucu)

_Üretim: 2026-09-25 · Kaynak: `QuakeMind_Makale_Taslak_...LOCAL_2026-09-21.docx`_

Docx'te **72 `[ÖLÇÜLECEK]` + 5 `[TARANACAK]` = 77** yer tutucu var. Aşağıda her biri
_neyi ölçtüğü_ ve _neyin engellediğine_ göre eşlenmiştir. Engel kategorileri:

- **🟥 GPU** — Kaggle "aynı bölme/tohum(42)" protokolüyle yeniden eğitim/koşum (Furkan)
- **🟦 VERİ** — diskte olmayan etiketli ham veri gerekli
- **🟨 KÜNYE** — ölçüm değil, veri-kümesi/insan künye bilgisi (etiketleyici sayısı vb.)
- **🟩 TÜRETİLİR** — başka bir tablo dolunca otomatik/elle dolar (özet hücresi)

---

## Tablo 5 — Yol hasarı veri kümesi künyesi · 6 yer tutucu · 🟨 KÜNYE
Bunlar ölçüm koşumu değil, veri kümesi/etiketleme künyesidir.

| Hücre | Alan | Engel | Nasıl doldurulur |
|---|---|---|---|
| T5 r1 | Kaynak görüntü ve sürüm | 🟨 | Kullanılan Maxar/Esri karo künyesi (tarih+id) yazılır |
| T5 r4 | Toplam karo sayısı | 🟩/🟨 | KATE-PD protokolü: 1013 karo (docx metninde geçiyor) → buraya işlenir |
| T5 r5 | Hasarlı piksel oranı | 🟦 | Etiketli maske kümesi üzerinde hesap (veri gelince) |
| T5 r6 | Etiketleyici sayısı | 🟨 | İnsan künye bilgisi (kaç kişi etiketledi) |
| T5 r8 | Etiketleyiciler arası uyum (IoU) | 🟦/🟨 | En az 2 etiketleyici + çakışan maskeler gerekli |
| T5 r9 | Uzman doğrulaması | 🟨 | Süreç künyesi (inşaat müh. doğruladı mı) |

> **Not:** r4/r6/r9 aslında **şu an yazılabilir** — ölçüm değil, bilinen protokol/süreç bilgisi.
> Furkan'a/Esra hocaya sorulacak: etiketleyici sayısı, uzman doğrulama süreci.

## Tablo 14 — Rota kapatma, mimari kıyaslaması · 35 yer tutucu (5 TARANACAK + 30 ÖLÇÜLECEK) · 🟥 GPU
5 mimari × (τ + DP/YN/YP/Kesinlik/Duyarlılık/F₁). SegFormer satırı (r6) **kapandı** (sıfır-örtüşme).

| Satır | Model | Engel | Nasıl doldurulur |
|---|---|---|---|
| r1 | U-Net [14] | 🟥 | Ağırlık yok → yeniden eğit, sonra `table14_segformer_closure.py` bu checkpoint'le |
| r2 | LinkNet [15] | 🟥 | " |
| r3 | FPN [16] | 🟥 | " |
| r4 | PSPNet [17] | 🟥 | " |
| r5 | DeepLabV3+ [18] | 🟥 | " |
| r6 | SegFormer [19] | ✅ | Dolu: τ=0,40 · DP=0 · YN=180 · YP=136 · K/D/F₁=0,000 |

> Yerelde `01_yol_hasari/local_colab_run/results/{linknet,pspnet,...}.json` VAR ama
> **farklı protokol** (tek tohum, KATE-CD+MedBFS bina verisi, checkpoint diskte yok) →
> Tablo 14'te kullanılamaz. `table14_segformer_closure.py` altyapısı hazır; sadece
> 5 checkpoint gelince her biri için koşulur.

## Tablo 15 — Bölgeler arası genelleme · 26 yer tutucu · 🟥 GPU
| Satır | Eğitim→Test | Engel | Not |
|---|---|---|---|
| r1 | Hatay→Hatay | 🟥 | İl-ayrık eğitim koşumu yok (4 metrik) |
| r2 | Hatay→K.Maraş | 🟥 | " (5: fark dahil) |
| r3 | K.Maraş→K.Maraş | 🟥 | " |
| r4 | K.Maraş→Hatay | 🟥 | " |
| r5 | Birleşik→Hatay | 🟥(kısmi) | IoU=0,387 **var**; F₁/Kesinlik/Duyarlılık/fark eksik |
| r6 | Birleşik→K.Maraş | 🟥(kısmi) | IoU=0,399 **var**; F₁/Kesinlik/Duyarlılık/fark eksik |

> r1-r4: 4 ayrı "bir ili dışarıda bırak" eğitim koşumu gerekir (GPU).
> r5-r6: Birleşik model **zaten eğitilmiş** (SegFormer-B4); F₁/Kesinlik/Duyarlılık
> mevcut checkpoint'le yerel çıkarımdan **hesaplanabilir** — checkpoint diskte var
> (`optimized_mitb4_focal_dice30.pth`) + etiketli test karosu gerekli (🟦).

## Tablo 22 — Ablasyon · 3 yer tutucu (kalan)
| Satır | Eksen | Engel | Not |
|---|---|---|---|
| r1 | Ağırlıklı pencere harmanlaması (var/yok) | 🟦 | Etiketli test karosu + iki çıkarım modu; CPU'da mümkün |
| r2 | Morfolojik son işleme (0/1/2) | 🟦 | Test karosu + maske gerekli (V₀ ile aynı engel) |
| r3 | Kayıp ağırlıkları (λ_f, λ_d) ızgara | 🟥 | Kayıpta ağırlık parametresi **yok** → GPU yeniden eğitim |

> r4/r5 (r_h, λ(d)) ✅ dolu · r6 (V₀) kısmi ✅ · r7 (risk ağırlıkları) ✅ · r8 (focal α) ✅

## Tablo 26 — Değerlendirme özet matrisi · 4 yer tutucu · 🟩 TÜRETİLİR
| Satır | Eksen | Engel | Türediği kaynak |
|---|---|---|---|
| r1 | Yol bölütleme (IoU/K/D/F₁) | 🟩→🟦 | Etiketli EMSR648 yol katmanı testi |
| r2 | Yer seviyesi hasar (mAP) | 🟩→🟥 | Tablo 24 (YOLO) dolunca |
| r5 | Çok-mimari yol (6 mimari IoU) | 🟩→🟥 | Tablo 13/14 dolunca |
| r7 | Bölgeler arası genelleme | 🟩→🟥 | Tablo 15 dolunca |

## Paragraf yer tutucuları · 3 adet · 🟩 TÜRETİLİR
| Konum | İçerik | Not |
|---|---|---|
| P280 | "Bölüm 4.3/4.4/4.7/4.9 tabloları iskelet, hücreler [ÖLÇÜLECEK]" | Tablolar dolunca cümle güncellenir |
| P471 | YOLO mAP "bu sürümde ölçülmemiştir" | Tablo 24 dolunca |
| P477 | Özet: 4 eksen "[ÖLÇÜLECEK] olarak işaretli" | Tümü dolunca |

---

## Özet — engel kırılımı
| Engel | Yer tutucu sayısı | Kilit aksiyon |
|---|---|---|
| 🟥 GPU (Furkan yeniden eğitim/koşum) | ~61 (T14:35, T15:26 kısmen, T22 r3) | 5 mimari + il-ayrık 4 + λ_f/λ_d |
| 🟦 VERİ (etiketli ham karo indir) | T5 r5/r8, T22 r1/r2, T15 r5-r6 metrikleri, T26 r1 | KATE-PD/QQB/EMSR648 karo indir |
| 🟨 KÜNYE (şimdi yazılabilir) | T5 r1/r4/r6/r9 | Furkan/Esra hocaya sor, protokolden doldur |
| 🟩 TÜRETİLİR (başka tablo dolunca) | T26 r1/r2/r5/r7, P280/P471/P477 | Otomatik |

**En büyük kaldıraç:** T14 + T15 = 61 hücrenin ~%90'ı tek Furkan koşumuna bağlı.
Detaylı protokol: `FURKAN_GPU_IS_PAKETI_2026-09-25.md`.
