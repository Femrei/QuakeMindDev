# Kodlayıcı-Sabit Yeniden Eğitim Sonrası Güncellenecekler

_Oluşturulma: 2026-09-22_

> **✅ UYGULANDI (2026-09-24).** Aşağıdaki 13 maddenin tamamı, Furkan'ın Kaggle'da tamamladığı
> 10 model koşumuyla docx'e işlendi (paragraf numaraları bu koşumda değişti — güncel karşılıkları
> için `DURUM.md` Bölüm A2'ye bakın). Bu dosya artık yalnız tarihsel kayıt olarak tutuluyor.

> Bu dosya, `model_benchmarks/02_bina_hasari` (ve varsa yol hasarı) altındaki 6
> mimarinin (SegFormer MiT-B4 dahil) **aynı kodlayıcı/bölme/tohum/protokolle**
> yeniden eğitilmesi tamamlandığında docx'te güncellenmesi gereken yerlerin
> listesidir. Kaynak: `DURUM.md` B-2 madde 7 ile bağlantılı. Paragraf numaraları
> `QuakeMind_Makale_Taslak_2026-09-16_sekillieklendi_v3_LOCAL_2026-09-21.docx`
> içindeki `python-docx` paragraf indeksine göredir (sürüm değişirse kaymış olabilir).

**Ön koşul (yeniden eğitim şu 4 noktayı da çözüyorsa aşağıdaki liste tam
uygulanır; yalnızca kodlayıcı sabitlendiyse (i) dışındakiler docx'te sınırlılık
olarak kalmaya devam eder):**
- (i) Kodlayıcı tüm 6 mimaride MiT-B4'e sabitlendi mi?
- (ii) Bölme mekânsal blok temelli mi (rastgele değil)?
- (iii) Çoklu tohum (10 tohum) ile varyans ölçüldü mü?
- (iv) Sınama kümesinde hasarsız karo var mı (yalnızca hasarlı karo değil)?
- SegFormer, diğer 5 mimariyle **aynı** bölme/sınama kümesi/IoU hesabıyla mı koşuldu?

---

## 1. Tablo/Şekil — sayılar yeniden üretilecek

| # | Yer | Ne değişecek |
|---|---|---|
| 1 | **Tablo 13** (para 296, 298-299) | Tüm satırlar yeni sayılarla; başlık dipnotundaki "SegFormer farklı bölme protokolüyle değerlendirilmiştir" notu — artık aynı protokolse **kaldırılmalı** |
| 2 | **Şekil 7** (para 305) | Şu an SegFormer grafikte yok ("farklı bölme protokolü" gerekçesiyle); yeni koşumda **SegFormer dahil edilmeli**, alt yazıdaki dışlama cümlesi kaldırılmalı |
| 3 | **Şekil 8** (para 312) | Eğitim/doğrulama eğrileri; SegFormer eğrisi eklenmeli (şu an "ayrı oturumda eğitildiği için dahil edilemedi" notuyla eksik) |

## 2. Metin — Bölüm 3.10 / 4.2 (hedeflenen vs. koşulan ayrımı kalkacak)

| # | Yer | Ne değişecek |
|---|---|---|
| 4 | **Para 122-127** ("Hedeflenen kurgu" / "Bu sürümde koşulan yapılandırma") | Bu iki alt başlığın ayrımı anlamsızlaşır — hedeflenen artık fiilen koşulmuş demektir; tek bir "Koşulan kurgu" paragrafına indirilmeli |
| 5 | **Para 299** (Gözlemler — LinkNet 0,3700 en iyi, PSPNet 0,3385 en kötü, DeepLabV3+ parametre yorumu) | Yeni sıralama/sayılarla tamamen yeniden yazılmalı; "doğrudan karşılaştırılabilir değildir" cümlesi SegFormer artık aynı protokoldeyse **kaldırılmalı** |
| 6 | **Para 300** ((i)-(iv) sınırlılık listesi) | (i) kodlayıcı sabitleme çözüldüyse o madde **silinmeli**; (ii)/(iii)/(iv) hâlâ geçerliyse kalsın, çözüldüyse onlar da silinmeli — yukarıdaki ön koşul kutusuna bakın |
| 7 | **Para 298** (ortalama IoU sütunu, SegFormer hücresinin boş bırakılma gerekçesi) | SegFormer artık aynı hesap yöntemiyle geldiği için hücre doldurulabilir |

## 3. Katkı / Özet / Sınırlılıklar

| # | Yer | Ne değişecek |
|---|---|---|
| 8 | **Para 28** (Giriş, Katkı 3) | "Uygulanan koşumda kodlayıcı sabitlemesi gerçekleştirilemediğinden sonuçlar ön bulgu olarak sunulmaktadır" cümlesi kaldırılmalı/güncellenmeli |
| 9 | **Para 280** (Ölçülen/ölçülmeyen ayrımı) | "Bölüm 4.2'nin karşılaştırması ... üç noktada hedef protokolden ayrılmaktadır; bu nedenle ön bulgu olarak sunulmaktadır" — kaç nokta kaldıysa ona göre güncellenmeli |
| 10 | **Para 468** (Sınırlılıklar, madde o) | "SegFormer satırı ... farklı bir bölme protokolüyle değerlendirilmiştir; ... doğrudan karşılaştırılabilir değildir" — protokol birleştiyse **madde tamamen kaldırılmalı** |
| 11 | **Para 482** (Ölçülemeyenler) | "bölütlemede yol yerine bina hasarı görevi ve sabitlenemeyen kodlayıcı" ifadesindeki "sabitlenemeyen kodlayıcı" kısmı kaldırılmalı (yol yerine bina hasarı kısmı, yol hasarı kümesi hâlâ yoksa kalır) |
| 12 | **ÖZET (TR)** (para 8) | "kıyaslama mimarileri arasında en yüksek ... LinkNet ile elde edilmiştir (0,3700)" cümlesi yeni sonuçla güncellenmeli; SegFormer artık kıyaslamaya dahilse cümle yapısı da değişebilir ("en yüksek IoU X mimarisiyle elde edilmiştir" + SegFormer'ın nerede durduğu) |
| 13 | **ABSTRACT (EN)** (para 13) | TR özetle simetrik İngilizce cümle — aynı güncelleme |

## 4. Kontrol listesi (güncelleme sırası)

1. Yeni `00_comparison_table.csv` / JSON sonuçlarını üret (`iou_fg` dahil, SegFormer dahil).
2. Tablo 13 + Şekil 7 + Şekil 8'i yeni verilerle yeniden oluştur.
3. Para 122-127, 298-300'ü tek "koşulan kurgu" anlatımına indir.
4. Katkı 3 (para 28), Ölçülen/ölçülmeyen (para 280), Sınırlılık (o) (para 468), Ölçülemeyenler (para 482) içindeki "ön bulgu" / "kodlayıcı sabitlenemedi" ifadelerini temizle.
5. TR Özet + EN Abstract'taki LinkNet cümlesini güncelle.
6. `DURUM.md` B-2 madde 7'yi tamamlandı olarak işaretle.
