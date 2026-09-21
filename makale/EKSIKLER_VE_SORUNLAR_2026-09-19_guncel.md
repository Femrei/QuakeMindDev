# QuakeMind — Model ve Veri Seti Aktarım Belgesi (Furkan → Utku)

**Başlangıç:** 19 Eylül 2026 · **Biçim:** kümülatif — her incelenen çalışmadan sonra güncellenir (en altta değişiklik günlüğü)
**Hedef:** bina hasarı bölütlemesinde IoU'yu ve doğruluğu artırmak; veri setini genişletmek; ne yaptığımızı kayıt altına
alıp emsallerle karşılaştırılabilir ve atıf yapılabilir kılmak.
**İş bölümü:** eğitim kodunu Utku yazar ve kendi bilgisayarında koşar. Bu belge veri setlerini (bulma, hazırlama,
adlandırma), model önerilerini, kıyaslama ve kayıt standardını ve makalede açık kalan yerleri verir.

> Durum işaretleri: ✅ karar verildi · 🟡 değerlendiriliyor · ⏳ inceleniyor · ❌ kullanılmayacak

---

## 1. Yönetici özeti (her güncellemede yenilenir)

- **Çıkış noktamız:** SegFormer MiT-B4, sızıntısız 2 km mekânsal bölme, sınama IoU_hasar **0,401–0,434**. Çözünürlük
  belirleyici: 0,375 m'de 0,486, 0,5 m'de 0,395, 0,75 m'de 0,086 (§2).
- **Emsallerin yüksek sayıları çoğu zaman aynı ölçü değil.**
  - En yakın emsal TE23D'nin "SegFormer %74,45"i aslında 2 sınıflı mIoU. Hasar IoU'su %56,98, ve bu sayı sızıntılı rastgele
    karo bölmesiyle, yalnız hasarlı karolarda ölçülmüş.
  - Aynı hesapla bizim mIoU'muz 0,691 (mekânsal bölme) / **0,732** (KATE-PD'nin rastgele bölmesi); yani onlarla aynı
    düzeydeyiz.
  - Hacıefendioğlu vd.'nin (Türkiye 2023) en iyisi IoU 0,394.
  - Emsalle kıyasta bütün ölçütleri adıyla raporlayacağız (§7). Protokolün sayıları nasıl şişirdiğini gösteren bir tablo
    makaleye katkı olur (Ç-03).
- **SegFormer seçimi emsallerle destekleniyor:**
  - TE23D'de 7 model arasında en iyisi SegFormer-B5.
  - RAPID-A MiT-B5 kodlayıcı kullanıyor.
  - DA-SegFormer SegFormer-B4 üzerine kurulu.
  - SegFormer'ı Türkiye 2023 uydu verisinde **mekânsal olarak sızıntısız** bölmeyle, negatif karolarla ve yol kapanmasına
    kadar giden bir zincirde değerlendiren çalışma bulunamadı. Özgünlüğümüz burada.
- **Veri setleri (§5):** 11 küme `QM-VS01…11` adıyla, bağlantı ve hazırlık adımlarıyla listelendi. İndirmeyi Utku yapacak.
  Öne çıkanlar:
  - HaitiBRD — başka bir deprem; **yol hasarı etiketi de var**.
  - Noto 2024 — Türkiye dışı; 140 208 bina.
  - HOTOSM — eğitim verimizde olmayan Kırıkhan, Nurdağı, Adıyaman merkez.
  - TE23D — 2,3 GB, herkese açık.
  - TUE-CD — 2 338 yıkık bina.
- **Model (§6):** 9 model korunuyor.
  - **Eklenecek:** U-Net ResNet-18 taban satırı (Türkiye 2023 emsaliyle köprü).
  - **Analiz olarak:** 9 modelin topluluğu (ek eğitim yok).
  - **İsteğe bağlı:** SegFormer-B5, UNet++ EfficientNet-b7. Mask2Former düşük öncelik.
- **IoU'yu artırma planı (§6.5):** 15 madde. En ucuz ve en umutlu olanlar:
  - gerçek sonrası negatifler (QQB)
  - etiket temizliği (255 = yok say)
  - **focal α taraması** — kütüphanede hasar pikselleri şu an arka plandan 3 kat az ağırlık alıyor (A-19)
  - hasarlı karoları fazla örnekleme
  - kayıp/eşik taraması
  - topluluk
- **Makalede:** 86 `[ÖLÇÜLECEK]`, 6 `[TARANACAK]`, 1 `[KARŞILAŞTIRILAMAZ]`, 1 `[GELECEK ÇALIŞMA]`, 2 bilgi yer tutucusu,
  855 sarı vurgulu (onay bekleyen) metin parçası. Tam liste ve çözüm yolları §8.1–8.3'te. Kaynaklardan çıkan atıf ve sayı
  düzeltmeleri §8.4'te.
- **İkinci tur (makalelerin içinde anılan çalışmalar, Ç-12…Ç-19) — öne çıkanlar:**
  - **Uydudan görünür hasarın sınırı:** Microsoft'un Türkiye ürünü ÇŞB saha verisine göre F1 **0,24**; uydu görüntüsünü elle
    yorumlayan uzmanlar da 0,15–0,23. Optik yöntemler ağır hasarlı binaların yalnız %8–17'sini buluyor; çatısı sağlam kalan bina
    yukarıdan hasarsız görünüyor (Ainscoe vd. 2025, tam metinden teyitli). Makalede hedef "uydudan görünür hasar" diye
    tanımlanmalı (Ç-13).
  - **Yerel verinin değeri:** xBD'de eğitilmiş en iyi modeller İslahiye'de yıkık binada F1 **0,33–0,44**'te kalıyor (Ç-19, tam
    metinden teyitli). Onların sınadığı görüntü QQB'ninkiyle aynı gün ve aynı uydu (WorldView-3, 7 Şubat 2023). Aynı ölçütle
    raporlarsak "Türkiye verisi + SegFormer" farkı sayıyla görünür.
  - **İki zamanlı modeller de aynı düzeyde:** TUE-CD'de hasar sınıfı IoU ≈ **0,41** (Ç-12).
  - **Tablo 15 kusuru (A-20):** "Birleşik" satırı aktarım testi değil; Hatay ↔ Maraş farkı veri kümesi farkı olabilir →
    il-dışarıda-bırakma satırı ve yalnız KATE-PD kontrolü (Ç-16).
  - **Ucuz yeni deneyler:**
    - 0,75 m çöküşünün çözünürlükten mi, etiketten mi geldiğini ayırma (8a, yalnız çıkarım)
    - süperpiksel oylaması son işlemi (15)
    - derin denetim (13b)

---

## 2. Çıkış noktamız (kıyasların referansı)

| Başlık | Bizde |
|---|---|
| Görev | Deprem sonrası **tek zamanlı** optik uydu görüntüsünden **ikili** bina hasarı bölütlemesi; çıktı OSM yol ağıyla kesiştirilip yol kapanması çıkarılıyor |
| Veri | KATE-PD (832 karo; Maxar 0,3–0,375 m + Pléiades 0,5 m; 7 il) · KATE-CD'nin öncesi görüntüleri (boş maskeli negatif) · MEDBFS (438 karo, ~0,75 m) · QuickQuakeBuildings (İslahiye) |
| Bölme | 2 km × 2 km UTM blokları, il bazında %80/10/10, örtüşme sızıntısı yok (`bolme_listesi.csv`) |
| Model | SegFormer MiT-B4 (smp 0.5.0, ImageNet), 512², 0,5 focal + 0,5 dice, AdamW 2e-4, kosinüs yeniden başlatma, parti 8 |
| Ölçüt | IoU_hasar — **bütün sınama pikselleri üzerinden** (global), eşik 0,5 |
| Sonuç | P1 (MEDBFS eğitimde) 0,401 · P2 (MEDBFS'siz, sabır 20) 0,434 (KATE-PD) · KATE-PD resmî rastgele bölmesi 0,481 |
| Tanı | Maxar 0,375 m 0,486 · Pléiades 0,5 m 0,395 · MEDBFS 0,75 m 0,086; >200 m² hasar kümelerinin %74'ü bulunuyor; bileşen kesinliği 0,67; öncesi görüntülerinde yanlış alarm 0 (kestirme şüphesi) |
| Kıyaslanacak 9 model | SegFormer B4/B2/B0 · U-Net/FPN/DeepLabV3+/UPerNet (MiT-B4) · DeepLabV3+ ResNet-101 · UPerNet ConvNeXt-S |

Ayrıntı: `QuakeMind_Devir_Utku_Egitim_2026-09-19/BENIOKU.md` (önceki devir paketi).

---

## 3. İncelenen çalışmalar

### 3.0 Karşılaştırma tablosu

| # | Çalışma | Görev / görüntü | Veri | En iyi sonuç (ölçüt) | Bize uygunluk |
|---|---|---|---|---|---|
| Ç-01 | EIDSeg (AAAI-26) | 5 sınıflı piksel bölütleme / **yer seviyesi** sosyal medya fotoğrafı | 3 266 görüntü, 9 deprem | EoMT ViT-L mIoU 80,8 (5 hasar sınıfı ort.); SegFormer-B5 74,4 | Veri ❌ · yöntem dersleri ✅ |
| Ç-02 | QuickQuakeBuildings (IEEE GRSL 2024) | Bina düzeyi ikili sınıflandırma / SAR + optik, yalnız sonrası | İslahiye, 4 029 bina (169 yıkık), rastgele 5 kat | SAR + optik F1 0,670 · AUROC 0,962; yalnız optik F1 0,605 | Veri 🟡 (QM-VS04, düzeltmeyle) |
| Ç-03 | TE23D (IEEE JSTARS 2025) | İkili hasarlı **alan** bölütlemesi / SkySat ~0,5 m, yalnız sonrası | 1 183 karo 256² (yalnız hasarlı), 4 il, rastgele karo bölmesi | SegFormer-B5 **IoU_hasar 56,98** (mIoU 74,45) | Yeniden üretim ✅ · eğitim ❌ · dış sınama 🟡 |
| Ç-04 | Hacıefendioğlu vd. (Buildings 2024) | İkili "yalnız yıkık" bölütleme / uydu (WV-3, GE-1, SkySat), yalnız sonrası | 377 karo (hepsi pozitif), Türkiye 2023, 11 il | U-Net R18 IoU 0,394 · F1 0,565 (global) | Veri ❌ (kapalı) · U-Net R18 taban ✅ |
| Ç-05 | Noto 2024 (ESSD 2025) | Bina düzeyi ikili hasar envanteri / hava fotoğrafı (etiket kümesi) | 140 208 bina, Japonya | İnsan etiketi: Destroyed F1 0,91, duyarlılık 0,84 | Dış sınama ✅ (QM-VS11 + Maxar 2 Ocak 2024) |
| Ç-06 | Aydin vd. kapsam taraması (Arch. Comput. Methods Eng. 2026) — makalemizde [7] | Derleme / yer seviyesi yapısal hasar | 45 dergi çalışması | — (sıralama yapılmıyor) | Atıf düzeltmeleri ✅ · yöntem ilkeleri ✅ |
| Ç-07 | TUE-CD + MSI-Net (arXiv 2026) | İkili değişim tespiti / uydu öncesi-sonrası | 1 656 karo 256², 2 338 yıkık bina | makalede sayı okunmadı | Veri 🟡 (QM-VS05) |
| Ç-08 | HaitiBRD (DesignSafe 2023) | Bina 4 sınıf + yol hasarı / uydu öncesi-sonrası | ~3,51 km², >9 000 bina | — (veri seti) | Dış sınama + yol ✅ (QM-VS06) |
| Ç-09 | HOTOSM Türkiye yıkık binalar (HDX) | Yıkık bina poligonları (OSM) | 3 434 poligon | — (etiket kümesi) | Bina düzeyi dış sınama ✅ (QM-VS07) |
| Ç-10 | RAPID-A (ASCE OPEN 2025) | 6 modellik topluluk (EffNet-b7/UNet++, **MiT-B5/U-Net**) / Google karosu ~0,23 m; D ve P maskeleri | Antakya 5 679 blok; K.Maraş, Gaziantep sınaması | Piksel ölçütü yok; bina sayısı kıyası | Veri/kod ❌ · topluluk ve negatif dersleri ✅ |
| Ç-11 | DA-SegFormer (IGARSS 2026) | SegFormer-B4 + OHEM/Dice + sınıf farkında örnekleme / **İHA**, kasırga, 11 sınıf | RescueNet ilk sürüm (1 973) | mIoU 72,06 → 74,61 (tek koşu, ablasyon yok) | Veri ❌ · örnekleyici, focal α, çıkarım ölçeği dersleri ✅ |
| Ç-12 | TUE-CD / MSI-Net dergi sürümü (IEEE TGRS 2024) | İkili değişim tespiti (Siyam ResNet-18 + ofset düzeltme) / WV-2 öncesi-sonrası | 1 656 çift 256², 2 338 yıkık bina, bölme 7:1:2 (yöntem yok) | MSI-Net mIoU 68,48 (2 sınıf ort.); değişim sınıfı IoU ≈ 0,41 (türetilmiş) | Veri 🟡 (QM-VS05) · MOC → görüntü–OSM ofset fikri |
| Ç-13 | Microsoft Türkiye hasar raporu (MSR-TR-2023-7) + Ainscoe vd. 2025 doğrulaması | 3 sınıflı piksel bölütleme, ilçe başına ince ayar / Maxar 30 cm + Planet 50 cm, yalnız sonrası | 4 ilçe, 3 849 hasarlı bina (tahmin) | Raporda doğruluk yok; ÇŞB'ye göre F1 0,24, kesinlik 0,42 (Kahramanmaraş + Nurdağı; tam metinden teyitli) | Kıyas ✅ (İslahiye) · etiket ❌ · lisans yok |
| Ç-14 | Song vd. 2020 (IJRS) | DeepLab v2 + SLIC süperpiksel + morfoloji / tek fazlı | (kapalı erişim; özet) | Sayı erişilemedi | Son işlem fikri ✅ (süperpiksel oylaması) |
| Ç-15 | Duarte vd. 2018a/b (Remote Sens. + ISPRS Ann.) | Yama sınıflandırma, çok çözünürlüklü birleştirme / uydu + hava + İHA | 8+ deprem | Uydu doğruluğu 0,905 → 0,944 (ayrı kodlayıcı + birleştirme) | Karışık çözünürlük dersleri ✅ |
| Ç-16 | Valentijn vd. 2020 (Remote Sens.) | Bina düzeyi sınıflandırma, olaylar arası aktarım / xBD öncesi-sonrası | 13 olay (deprem yok), 175 289 bina | Aktarım oranı: Joplin %93, Nepal %53 (makro F1) | **Tablo 15 tasarım dersleri ✅** (A-20) |
| Ç-17 | Xie vd. 2022 (IEEE TGRS) | Tek zamanlı hasar bölütlemesi, **U-Net tabanlı CNN + dikkat** (ViT değil) / Haiti 2010, 0,5 m | Erişilemedi (kapalı) | IoU %62,43 · F1 %76,11 (teyitsiz → makaleye yazılmaz; büyük olasılıkla görüntü başına ortalama) | Derin denetim ve ayrıntı kurtarma fikirleri ✅ |
| Ç-18 | Wiguna vd. 2024b (IEEE GRSL) — Noto | Bina düzeyi sınıflandırma (Swin-T) + sözde etiketli uyarlama / **GSI hava fotoğrafı ~0,2 m** (öncesi Google) | Kendi görsel yorum etiketleri, 4 alan | Bina düzeyi F1, iki sınıf ortalaması 0,62 → 0,75; **hasar sınıfı 0,33 → 0,55** (yalnız xBD: 0,24 → 0,32) | Sayısal kıyas ❌ (farklı görüntü ve etiket) · yöntem fikri ✅ |
| Ç-19 | Wiguna vd. 2024a (IEEE JSTARS) | xBD'de eğitilmiş modellerin sıfır atışlı dış sınaması / Tohoku 2011 + **İslahiye 2023** | xBD eğitim; İslahiye uydu + hava | İslahiye'de yıkık F1: 0,33 (tek zaman) / 0,41 (çift zaman) / 0,44 (xView2 birincisi; piksel düzeyinde 0,38) — tam metinden teyitli | **"Yerel veri" karşılaştırması ✅**, dış sınama protokolü ✅ |

---

### Ç-01 · EIDSeg — yer seviyesi fotoğraflarda piksel düzeyi hasar bölütlemesi

**Künye.** Huang, H., Liu, C., Zhang, D., Patel, S., Masalava, A., Sadak, S., Babolhavaeji, P., Low, W., Roozbahani, M. M.,
Frost, J. D. "EIDSeg: A Pixel-Level Semantic Segmentation Dataset for Post-Earthquake Damage Assessment from Social
Media Images." AAAI-26, 2026, s. 38589–38597. Kod/veri: github.com/HUILIHUANG413/EIDSeg · arXiv:2511.06456.
Kaynak dosya: `Makale - Kaynaklar/00041-HuangH.pdf`.

**Ne yapmışlar.** Dokuz depremden (2008–2023, Türkiye 2023 dahil) toplanan sosyal medya fotoğraflarını beş sınıfta piksel
düzeyinde etiketlemişler: Hasarsız Bina, Hasarlı Bina, Enkaz (Debris), Hasarsız Yol, Hasarlı Yol. Etiketlemeye 6 646
görüntü girmiş, son kümede 3 266 görüntü kalmış. Bölme %80/10/10; rastgele mi olay bazlı mı yazılmamış. Lisans belirtilmemiş.
- **Etiket kalitesi:** 6 etiketçi + 2 uzman. Eğitim aşamasında 300 uzman görüntüsü kullanılmış. Etiketleme turlarına
  100 "altın standart" görüntü gömülmüş. Uyumu 0,60'ın altında kalan görüntü atılmış. Son turda uyum %70'in üzerinde.
- **Belirsiz bölgeler:** "Undesignated" ile işaretlenmiş; payı %2'yi aşan görüntü atılmış.

**Modeller ve sonuçlar** (mIoU = beş hasar sınıfının ortalaması, arka plan yok; s. 7):

| Model (ön eğitim, girdi) | mIoU | Hasarsız bina | Hasarlı bina | Enkaz | GFLOPs | Param (M) |
|---|---|---|---|---|---|---|
| DeepLabV3+ R101 (Cityscapes, 512²) | 67,1 | 43,5 | 65,4 | 77,3 | 79,3 | 58,8 |
| SegFormer MiT-B5 (Cityscapes, 512²) | 74,4 | 54,9 | 73,5 | 82,3 | 110,2 | 84,6 |
| Mask2Former Swin-S (Cityscapes, 512²) | 76,1 | 58,9 | 76,3 | 83,4 | 93,2 | 68,7 |
| Mask2Former Swin-L | 77,4 | 63,5 | 76,9 | 84,3 | 250,5 | 215,5 |
| OneFormer Swin-L | 79,2 | 61,0 | 75,7 | 83,9 | 1 042,1 | 218,8 |
| EoMT ViT-L (1024²) | **80,8** | 70,1 | 80,0 | 84,6 | 1 341,9 | 319,0 |

Eğitim: çapraz entropi kaybı, AdamW 1e-5, ReduceLROnPlateau, en çok 100 dönem, sabır 30, parti 4, tek A100-80GB.

**Bizden farkı.**
- **Görüntü:** eğik açılı yer fotoğrafı; bizde nadir uydu görüntüsü.
- **Sınıflar:** 5 sınıf; bizde ikili.
- **Ölçüt:** 5 sınıf ortalamalı mIoU; bizde global IoU_hasar. %80,8 ile 0,43 **kıyaslanamaz**.
- **Hasar pikseli payı:** onlarda %74 (nesneler kareyi dolduruyor); bizde ortalama %3.
- **Yol tanımı:** onlarda yol üstündeki enkaz "yol hasarı" sayılmıyor. Bizim kapanma kavramımızın tam tersi.

**Neden başarılı (değerlendirme).**
- Nesneler büyük ve hasar pikselleri çoğunlukta.
- Zor ve belirsiz görüntüler kümeden atılmış (seçilim yanlılığı).
- Görev sokak sahnesi; ön eğitim de sokak sahnesi (Cityscapes).
- Model sıralaması yine öğretici: maske sınıflandırmalı modeller (Mask2Former, OneFormer, EoMT) SegFormer'ı geçiyor.
  EoMT'nin kazancı büyük ölçüde 1024²'lik girdiye, yani daha fazla bağlama bağlanıyor.

**Bize uygulanabilir dersler.**
1. **İnsan tavanı:** 50–100 sınama karosunu iki kişi bağımsız etiketlesin, aralarındaki IoU_hasar raporlansın. Bizim 0,43
   bu tavana göre yorumlanır. (Veri hazırlığı — bizde.)
2. **Kümeler arası etiket uyumu:** KATE-PD ile MEDBFS/QQB'nin aynı yerdeki karolarında (İslahiye, Türkoğlu) iki maskenin
   IoU'su ölçülsün. MEDBFS'in 0,086'sı etiket tanımından mı, çözünürlükten mi geliyor, bu ayrılır. (Bizde, yerel.)
3. **"Yok say" etiketi:** yeni etiketlenen karolarda emin olunmayan bölgeler ayrı değerle işaretlensin, kayıptan ve
   ölçütten dışlansın. (Utku'nun kodunda `ignore_index`.)
4. **Kalite süzgeci:** Laplace varyansıyla bulanık karo süzgeci, makalemizdeki karo kalite eşiği V₀'ın (Bölüm 3.3) doğrudan
   karşılığı. Eşiği karolarımız üzerinde yerelde belirleyebiliriz (§8, Tablo 21).
5. **Mask2Former Swin-S aday:** SegFormer-B5'ten ucuz (93 / 110 GFLOPs) ama 1,7 puan iyi (§6).
6. **Bağlam / çözünürlük:** aynı yer örnekleme aralığında 1024² karo ya da 0,5 m görüntüleri 0,3 m'ye büyüterek çıkarım
   denenebilir. Bizim çözünürlük bulgumuzla aynı yönde.
7. **Olay-dışarıda-bırakma karşılığı:** il-dışarıda-bırakma deneyi (Tablo 15'i genişletir).
8. **Ölçütü açık yaz, çoklu tohum ver:** EIDSeg ikisini de yapmıyor; bizim artımız olur.

**Veri seti kullanımı:** ❌ Görevimize uymuyor (eğik açı, konum yok, 5 sınıf).
**Atıf önerisi:**
- Giriş/ilgili çalışmalar: yer seviyesi piksel kümeleri; konum bilgisi olmadığı için bölge ölçeğinde yol ağı analizine
  girdi veremez.
- Tartışma: yer seviyesinde bile en zor ayrım hasarlı–hasarsız bina (Hasarsız Bina IoU %43,5–70,1); ayrıntı arttıkça
  başarım artıyor.

**Not:** EIDSeg'in Tablo 1'inde TUE-CD ve TE23D de geçiyor. İkisine kendi makaleleri üzerinden atıf yapılmalı.

---

### Ç-02 · QuickQuakeBuildings — İslahiye SAR + optik bina hasarı kümesi (IEEE GRSL 2024)

**Künye.** Sun, Y., Wang, Y., Eineder, M. "QuickQuakeBuildings: Post-Earthquake SAR-Optical Dataset for Quick
Damaged-Building Detection." *IEEE Geoscience and Remote Sensing Letters* 21:4011205, 2024. doi:10.1109/LGRS.2024.3406966.
TU München + DLR. Veri/kod: github.com/ya0-sun/PostEQ-SARopt-BuildingDamage. Kaynak dosya: `Makale - Kaynaklar/QuickQuake…pdf`.

**Ne yapmışlar.** İslahiye'de (yaklaşık 4,8 × 5,4 km) olay sonrası tek sahnelerle bina düzeyinde ikili **sınıflandırma**
(hasarlı / sağlam) yapmışlar; piksel düzeyi kapsam dışı.
- **Görüntü:** Capella SAR (9 Şubat, 0,35 m) + Maxar ARD WorldView-3 optik (7 Şubat, 0,31 m).
- **Bina izi ve etiket:** HOT/HDX bina izleri ve "yıkık bina" katmanı (Ç-09 ile aynı kaynak).
- **Sayılar:** 4 029 bina; 169 hasarlı (yani yıkık), 3 860 sağlam (%4,2 pozitif).
- **Bölme:** 5 katlı, katmanlı çapraz doğrulama. Katlar **rastgele**: 1. kattaki binaların en yakın komşusunun %81,4'ü başka
  katta (rastgele beklenen %80).

**Sonuçlar** (Tablo I, 5 kat ort. ± ss; bina düzeyi, eşik en iyi F1'e göre):

| Kip | En iyi model | F1 | AUROC |
|---|---|---|---|
| Yalnız SAR | ResNet-18 geç füzyon + SAR-HUB | 0,282 | 0,769 |
| Yalnız optik | ResNet-18 geç füzyon (görüntü + iz) | 0,605 | 0,941 |
| SAR + optik | ResNet-18 geç füzyon | **0,670** | **0,962** |

Eğitim: BCE kaybı, hasarlılar ağırlıklı örnekleme, AdamW 1e-4, kosinüs azalma, 30 dönem, parti 32, rastgele boyutlu kırpma
ve çevirme.

**Bizden farkı.**
- **Bina izi girdi olarak veriliyor:** binanın yeri biliniyor. Bizde model binayı da kendisi bulmak zorunda.
- **Birim:** bina başına yama; bizde 512² karo.
- **Bölme ve eşik:** rastgele katlar, eşik sınamada seçiliyor, doğrulama kümesi yok. Sonuçlar iyimser; komşu binalar
  arası ortanca uzaklık 16 m.
- **Kıyas:** bizim piksel IoU'muzla **doğrudan kıyaslanamaz**.

**Bizim yeniden kurulumumuzda bulunan sorunlar** (→ EKSIKLER A-18).
1. **Sağlam listesinde hasar etiketli binalar:** 95 binada `earthquake:damage` ya da `damaged:building` etiketi var. 43'ü
   dış sınama karolarımızda (1 109 sağlam poligonun %3,9'u).
   → Maskede **255 = yok say** yapılmalı; dış sınamada yanlış alarm sayımından çıkarılmalı.
2. **Dış sınama ayrıştırılmalı:** 74 karonun 23'ü doğrulama bloklarında (model seçimi o bölgeyi görmüş olabilir).
   → Sınama bloklarındaki 51 karo ayrıca raporlanmalı.
3. **Etiketsiz bina riski:** batıdaki dağlık kesim veri setinde dışlanmış ama bizim karo zarfımızın içinde olabilir.
   → Oradaki binalar maskede 0 sayılıyor olabilir; denetlenmeli.
4. **Lisans çelişkisi:** makale uydu verisine CC BY 4.0 diyor, Maxar Open Data kaydı CC BY-NC 4.0. Biz BY-NC varsayımıyla,
   atıf vererek kullanıyoruz (ticari olmayan proje).

**Bize uygulanabilir dersler.**
1. **Bina düzeyi ölçütler:** QQB ve HOTOSM dış sınamalarında bina başına puan (iz içindeki ortalama hasar olasılığı, iz ~2 m
   tamponlu) → duyarlılık, F1, AUROC, **AUPRC**. Eşik doğrulamada sabitlenir.
2. **Hasarlı karoları fazla örnekle:** QQB'nin hasar pikseli payı %0,35 (KATE-PD'de %3,0). QQB eğitime girerse yıkık binalı
   39 karo fazla örneklenmeli.
3. **Ölçek artırması:** rastgele boyutlu kırpma, çözünürlük düşüşümüze (0,486 → 0,086) karşı denenebilir.
4. **Görüntü başına normalizasyon** (%2 kırpma + [0,1]): Maxar–Pléiades renk farkına karşı denenebilir.
5. **Bina izi kanalı** (isteğe bağlı): iz → ek kanal. Eksik OSM'ye karşı eğitimde rastgele sıfırlanmalı. MiT'in 4 kanal
   girdisi smp'de denetlenmeli.
6. **SAR:** tek sahne var ve görevimiz optik → uygulanmaz. Ama "optik, SAR'dan çok daha iyi" bulgusu (0,605'e karşı 0,282)
   optik tercihimizi destekliyor.

**Veri kullanımı:** 🟡 Kısmen. Kaynaktan yeniden kurduğumuz hâliyle eğitim + bina düzeyi dış sınama için evet (yukarıdaki 1–3
düzeltilerek). Dağıtılan bina yamaları ve Tablo I ile doğrudan kıyas için hayır.

**Atıf önerisi.**
- İlgili çalışmalar: F1 0,670 / AUROC 0,962 (SAR + optik).
- Veri bölümü: "İslahiye verisi QuickQuakeBuildings [X] bina listeleriyle kaynaklarından (Maxar ARD 7 Şubat 2023; OSM 1 Mart
  2023) yeniden kurulmuştur."
- Yöntem gerekçesi: aynı bölgede optik F1 0,605'e karşı SAR 0,282.
- Tartışma: iz girdisi ve rastgele katlar nedeniyle doğrudan kıyaslanamaz.

**Dikkat.** Makale 2. depremi (Elbistan) "artçı" diye anıyor; bu ifadeyi makalemize taşımayalım.
### Ç-03 · TE23D — Türkiye 2023, yalnız sonrası, hasarlı alan bölütlemesi (IEEE JSTARS 2025)

**Künye.** Ekkazan, C., Karsligil, M. E. "TE23D: A Dataset for Earthquake Damage Assessment and Evaluation." *IEEE JSTARS*
18:3852–3863, 2025. doi:10.1109/JSTARS.2025.3526088. YTÜ Intelligent Systems Lab. İletişim: can.ekkazan@optdcom.net,
elif@yildiz.edu.tr. Veri sayfası: isl.ce.yildiz.edu.tr/datasets/te23d. Kaynak dosya: `Makale - Kaynaklar/TE23D_…pdf`.

> **En önemli bulgu:** özetteki **%74,45 hasar sınıfının IoU'su değil**, iki sınıfın ortalaması (mIoU). Tablo IV'te
> SegFormer-B5 için **IoU_hasar = %56,98**, IoU_arka = %91,92; (91,92 + 56,98) / 2 = 74,45. Bizim 0,40–0,43 ile kıyaslanacak
> sayı **0,5698**. Aynı hesapla bizim mIoU'muz: Koşu A (0,401 + 0,981) / 2 = **0,691** · Koşu B (KATE-PD'nin rastgele
> bölmesi) (0,481 + 0,983) / 2 = **0,732** → TE23D'nin 0,7445'iyle aynı düzeydeyiz.

**Veri.**
- **Görüntü:** Planet SkySat, ~0,5 m, yalnız sonrası. 15 GeoTIFF (~482 km²): Adıyaman, Gaziantep, Hatay (Antakya dahil,
  342 km²), Kahramanmaraş.
- **Etiketleme:** 1024² karolarda Label Studio ile poligon çizilmiş. Poligonlar binayı değil, **bütün enkaz alanını**
  kapsıyor (tamamen/kısmen çökmüş ve devrilmiş binalar). Sağlam bina, park ve köprü arka plan.
- **Karolar:** 256² karolara bölünmüş; yalnız **hasar içeren 1 183 karo** tutulmuş (~19 km²). 2 080 poligon.
- **Bölme:** 80/10/10 → 947 / 118 / 118. Yöntem yazılmamış.
- **Erişim:** **herkese açık Google Drive klasörü, 2,3 GB** (PNG karolar, konum bilgisi yok).
- **Lisans:** belirsiz — sayfada hem CC BY-NC-ND 4.0 hem "tüm hakları saklıdır" yazıyor.

**Bölme sızıntısı** (dosya adlarından çıkarım: `sahne_satır_sütun_altkaro`): sınama karolarının **112/118'i en az bir
eğitim karosuyla aynı 1024'lük üst karodan** geliyor; büyük sahnelerin hepsi üç kümede birden var → **karo düzeyinde
rastgele bölme**.

**Modeller ve sonuçlar** (Tablo IV, %; hepsi AdamW 1e-4, parti 4, 100 dönem, A100; omurga, ön eğitim, kayıp ve artırma
yazılmamış; tek koşu):

| Model | IoU_hasar | IoU_arka | mIoU |
|---|---|---|---|
| BEiT | 43,45 | 90,21 | 66,83 |
| U-Net | 43,64 | 89,97 | 66,80 |
| Mask R-CNN | 48,03 | 89,90 | 68,97 |
| DPT | 49,82 | 90,67 | 70,24 |
| U-Net++ | 50,48 | 91,18 | 70,83 |
| MobileViT | 51,79 | 91,19 | 71,49 |
| **SegFormer-B5** | **56,98** | **91,92** | **74,45** |

**Bizim 0,43 ile onların 0,57'si neden farklı?**
1. **Ölçüt karışıklığı** ayıklandıktan sonra açık ~14 puan (0,481'lik Koşu B'ye göre ~9 puan).
2. **Bölme sızıntısı:** komşu karolar eğitim ve sınamada. Bizde rastgele → mekânsal geçiş 5–8 puan düşürüyor; TE23D'de
   komşuluk daha yoğun.
3. **Yalnız hasarlı karolar:** sınamada hasar pikseli payı ~%10–16; bizde negatif karolar var. Aynı model, hasar payı %5
   olan bir sınamada 0,36–0,46'ya düşer (hesap). Tek başına 10–20 puan açabilir.
4. **Kaba, büyük enkaz blokları** IoU'yu yukarı çeker; tek sensör ve tek etiket protokolü de avantaj.
5. **B5 ile B4 farkı** küçük (≤ 1–2 puan).

**Sonuç (değerlendirme):** modelimizin daha kötü olduğuna dair kanıt yok. Farkı büyük ölçüde değerlendirme protokolü
açıklıyor.

**Bize uygulanabilir dersler.**
1. **Doğru sayıyla kıyasla, hepsini raporla:** IoU_hasar yanında IoU_arka, 2 sınıflı mIoU, doğruluk, kesinlik, duyarlılık;
   global toplama açıkça yazılsın (§7).
2. **Protokol duyarlılık tablosu** (makaleye güçlü bir katkı):
   - (a) Bizim protokolümüz.
   - (b) Yalnız hasar içeren sınama karoları — yeniden eğitim yok, mevcut tahminler yeniden puanlanır.
   - (c) Rastgele karo bölmesi (Koşu B zaten buna yakın).

   Böylece yayımlanmış yüksek sayıların nereden geldiği sayıyla gösterilir.
3. **Onların protokolünü yeniden üret:** SegFormer-B4 hattımızı TE23D eğitim kümesinde eğit, TE23D sınamasında onların
   formülleriyle ölç (947 karo × 256², kısa iş). 56,98 ile birebir kıyas bunu verir.
4. **Etiket tanımı:** TE23D'nin "bütün enkaz alanı" tanımı yol kapanması için bina ayak izinden daha uygun olabilir; enkazın
   yola taşması önemli. Kaynaklar arası tanımı tek cümleyle sabitle (Ç-05 dersi 1).
5. **Belirsizlik:** blok bootstrap ile güven aralığı ver; TE23D'de yok.

**Veri kullanımı.**
- ✅ Kendi protokolünde yeniden üretim ve atıf için.
- ❌ Şimdilik ana eğitime katılmaz: konum yok, 4 ilimizle çakışıyor, lisans belirsiz.
- 🟡 Dış sınama ancak karolar konumlandırılırsa (sahne ayak izleri yazarlardan ya da görüntü eşleme) ve çakışanlar
  çıkarılırsa.
- EKSIKLER'deki "yazarlarla iletişim" notu: veri açık, ama **lisans teyidi** için iletişim hâlâ gerekli.

**Atıf önerisi.** "Ekkazan ve Karslıgil [11], SkySat görüntülerinden (~0,5 m) TE23D kümesini (1 183 karo, 256², 2 080 hasarlı
alan poligonu) oluşturmuş; yalnız deprem sonrası görüntüyle ikili bölütlemede SegFormer-B5 ile hasar sınıfı için %56,98 IoU
(iki sınıf ortalaması %74,45 mIoU) bildirmiştir. Yalnız hasar içeren karolar tutulduğundan, hasarsız karolar içeren ve
mekânsal olarak bölünmüş sınamamızla doğrudan karşılaştırılamaz."

**Makalemizde düzeltilecek** (§8.4): P38'deki "her iki küme de bina odaklıdır" cümlesi TE23D için yanlış (enkaz alanı
odaklı).
### Ç-04 · Hacıefendioğlu vd. — Türkiye 2023 yıkık bina bölütlemesi (Buildings 2024)

**Künye.** Hacıefendioğlu, K., Başağa, H. B., Kahya, V., Özgan, K., Altunışık, A. C. "Automatic Detection of Collapsed
Buildings after the 6 February 2023 Türkiye Earthquakes Using Post-Disaster Satellite Images with Deep Learning-Based
Semantic Segmentation Models." *Buildings* 14(3):582, 2024. doi:10.3390/buildings14030582 (CC BY 4.0). KTÜ İnşaat
Mühendisliği; sorumlu yazar Altunışık. Kaynak dosya: `Makale - Kaynaklar/buildings-14-00582-v2.pdf`.

**Veri.**
- **Görüntü:** Maxar açık verisi WorldView-3 ve GeoEye-1 (7 Şubat 2023; 12 + 12 sahne, 17 408²) + Planet SkySat
  (9 Şubat, 1 sahne). Yalnız sonrası. GSD yazılmamış.
- **Karolama:** 512² karolara bölünmüş (27 824 karo). Yalnız **yıkık bina içeren 377 karo** tutulmuş (%1,35).
- **Etiket:** "yalnız yıkık binalar maskelenmiş"; **hasarlı ama ayakta binalar arka plan**. Etiketleyen, araç ve kalite
  kontrolü yazılmamış. Maskeler kaba leke biçiminde.
- **Bölme:** %80 eğitim / %20 sınama. Rastgele mi mekânsal mı yazılmamış; ayrı doğrulama kümesi yok.
- **Erişim:** yalnız istek üzerine; kod paylaşılmamış.

**Modeller ve eğitim.**
- **Modeller:** U-Net, LinkNet, FPN, PSPNet; hepsi ResNet18 kodlayıcılı ve ImageNet ön eğitimli. Kod çözücü ayarları smp
  varsayılanlarıyla birebir aynı.
- **Girdi boyutu:** U-Net ve LinkNet 512², FPN 256², PSPNet 384². Yani girdi boyutu modele göre değişiyor.
- **Eğitim:** Adam 1e-5, parti 8, 100 dönem, **veri artırma yok**, kayıp belirtilmemiş. GTX 1070 Ti.

**Sonuçlar** (Tablo 5, s. 15; ölçütler tek birleşik karışıklık matrisinden, yani global — bizimle aynı tür):

| Ölçüt | U-Net | LinkNet | FPN | PSPNet |
|---|---|---|---|---|
| IoU | **0,394** | 0,381 | 0,358 | 0,269 |
| F1 | **0,565** | 0,551 | 0,527 | 0,424 |
| Kesinlik | 0,718 | 0,697 | **0,770** | 0,597 |
| Duyarlılık | **0,466** | 0,456 | 0,401 | 0,328 |
| Doğruluk | 0,970 | 0,969 | 0,973 | 0,963 |

**Bizden farkı ve karşılaştırma.**
- **Sayılar aynı mertebede:** onların 0,394'ü ile bizim 0,401–0,434'ümüz. Ama kıyas yalnız yön gösterir: onlarda yalnız
  yıkık etiketi, negatifsiz sınama, türü belirsiz bölme, bilinmeyen GSD var.
- **Bölmenin etkisi:** kendi deneyimizde rastgele bölmeden mekânsala geçmek 0,05–0,08 puan düşürüyor (0,481 → 0,43).
  Onların sayısı mekânsal bölmede büyük olasılıkla daha düşük çıkardı (değerlendirme).
- **Doğruluk yanıltıcı:** ~0,97'lik doğruluk arka plan payından geliyor. "Hepsi arka plan" diyen model de ~0,96 alır.
- **Makalemizle bağlantı:** eski Tablo 13'teki ResNet-18'li beş mimari kurgusu bu çalışmaya çok benziyor.

**Bize uygulanabilir dersler.**
1. **U-Net ResNet-18'i hafif bir taban olarak ekle** (§6): Türkiye 2023 emsaliyle doğrudan köprü. Aynı zamanda eski
   Tablo 13 ile süreklilik sağlar. Ucuz (~14 M parametre).
2. **Karşılaştırılabilir ek sayı:** yalnız hasarlı karolar alt kümesinde de IoU raporla. Onların protokolüne en yakın sayı bu.
3. **Kesinlik–duyarlılık dengesi:** bütün modellerinde kesinlik duyarlılıktan yüksek, yıkıntının bir kısmı kaçıyor. Yol
   kapanması için duyarlılık önemli. Eşik ya da kayıp ağırlığını **doğrulama kümesinde** tara (Tablo 21'deki kayıp
   taramasıyla birleşir).
4. **Negatif karo oranı ablasyonu:** onlar negatiflerin %98,6'sını attı, biz tutuyoruz. Farklı negatif oranlarıyla bir
   ablasyon yöntemimizi güçlendirir.
5. **Makalede vurgulanacak farklar:** bütün modeller aynı girdi boyutunda, ayrı doğrulama kümesi, çoklu tohum,
   olasılıklardan PR-AUC.
6. **LinkNet ve PSPNet ekleme:** LinkNet U-Net'le neredeyse aynı, PSPNet en zayıfı.

**Veri kullanımı:** ❌ Kamuya açık değil. Etiket tanımı uyumsuz (hasarlı = arka plan). Konum yok, 11 ilin hepsini
kapsıyor, aynı Maxar koleksiyonu olduğu için test bloklarımıza sızma riski yüksek. Yazarlar koordinatlı karoları verirse
yalnız "yalnız yıkık" dış sınaması olabilir.

**Atıf önerisi.**
- İlgili çalışmalar: "Hacıefendioğlu vd. [X], WorldView-3, GeoEye-1 ve SkySat sonrası görüntülerinden 377 karoda yalnız yıkık
  binaları bölütlemiş; ResNet18 kodlayıcılı dört mimari arasında en yüksek IoU'yu U-Net ile 0,394 olarak bildirmiştir."
- Yöntem: "Yıkık bina içermeyen karoların çıkarıldığı çalışmaların [X] aksine, sınama kümemiz hasarsız karoları da içerir ve
  2 km mekânsal bloklarla ayrılmıştır."
- Tartışma: sayıların aynı mertebede olduğu, ancak etiket tanımı, bölme ve sınama bileşimi farklı olduğundan kıyasın yalnız
  yön gösterdiği.

**Makaledeki tutarsızlıklar** (atıf yaparken dikkat):
- Özgüllük formülü (5) yanlış basılmış; karışıklık matrisinde TN ile FN yer değiştirmiş.
- AUC tek eşikten hesaplanmış.
- s. 12'de konuyla ilgisiz bir "anemi tespiti" cümlesi var.

Doğruluk ve özgüllüğü başarı göstergesi olarak alıntılama; yalnız IoU ve F1'i al.
### Ç-05 · 2024 Noto Yarımadası depremi bina hasarı veri seti (ESSD 2025)

**Künye.** Vescovo, R., Adriano, B., Wiguna, S., Ho, C. Y., Morales, J., Dong, X., Ishii, S., Wako, K., Ezaki, Y.,
Mizutani, A., Mas, E., Tanaka, S., Koshimura, S. "The 2024 Noto Peninsula earthquake building damage dataset: multi-source
visual assessment." *Earth Syst. Sci. Data* 17:5259–5276, 2025. doi:10.5194/essd-17-5259-2025. Tohoku Üniv. (IRIDeS) +
Tokoha Üniv. Veri: Zenodo doi:10.5281/zenodo.11055711 (makale sürüm 2.4'e atıf veriyor; güncel sürüm 2.5, `Noto_Peninsula_Damage_2_5.gpkg`,
47,9 MB, **CC BY 4.0**). Kaynak dosya: `Makale - Kaynaklar/essd-17-5259-2025.pdf`.

**Ne yapmışlar.** 1 Ocak 2024 Noto depremi (Mw 7,5; sarsıntı + tsunami + yangın + heyelan) için **140 208 binanın**
bina düzeyinde ikili hasar envanterini çıkarmışlar. Model yok; bu bir etiket kümesi makalesi.
- **Etiket kaynağı:** GSI sonrası dikey hava fotoğrafları; zor durumlarda eğik hava fotoğrafı, yer ve haber fotoğrafı.
  Halktan fotoğraf kanıtlı düzeltmeler de alınmış.
- **Kodlar:** 0 = Survived (EMS-98 D0–D3; yani **ağır hasar "ayakta" sınıfında**) · 1 = Destroyed (D4–D5; çökme, gömülme,
  sürüklenme, yanma) · 9 = görüş engelli (bulut, gölge, ağaç) · 99 = ayak izi görüntüyle tutarsız.
- **Geometri:** 25 685 ayak izi (%18,3) görüntüye göre yeniden çizilmiş.
- **Biçim:** GeoPackage, EPSG:4326. Görüntü paylaşılmıyor.

**Etiket kalitesi** (bağımsız yer taramasına göre, Tablo 6):

| Sınıf | Kesinlik | Duyarlılık | F1 | n |
|---|---|---|---|---|
| Survived | 0,95 | 0,99 | 0,97 | 1 666 |
| Destroyed | 0,99 | **0,84** | 0,91 | 559 |

**Uzaktan yapılan insan etiketi bile yıkık binaların ~%16'sını kaçırıyor.** Modellerin ulaşabileceği bir üst sınır var.

**Bizden farkı.**
- **Birim:** bina (poligon); bizde piksel.
- **Kaynak:** hava fotoğrafı; bizde uydu.
- **Belirsizlik:** 9 ve 99 kodları var; bizde "yok say" yok.
- **Olay ve yapı stoku:** çoklu tehlike, ahşap yapı, kış.

**Bize uygulanabilir dersler.**
1. **Sınıf tanımını bir ölçeğe bağla:** "hasarlı" sınıfımız EMS-98'de nereye düşüyor? (D3 dahil mi?) KATE-PD, MEDBFS, QQB
   ve TUE-CD tanımlarını tek bir eşleme tablosuna oturt. Tanım karışıklığı başlı başına etiket gürültüsüdür (Ç-01 dersi 2
   ile birlikte).
2. **"Değerlendirilemez" kodu = 255 (yok say):** bulut, gölge, iz uyumsuzluğu. Negatif sınıfı temiz tutar. Bu, §5'teki
   maske kuralımızla aynı.
3. **Geometri denetimi:** OSM izleri ile Maxar görüntüsü arasındaki kaymayı bir örneklemde ölç (QQB'de 1–2 m).
4. **Etiket tavanını raporla:** uzaktan etiketin duyarlılığı bile 0,84. Bu, tartışma bölümümüzde model sonuçlarını
   konumlandırır.
5. **Görüntü tarihini meta veride tut** (brandalar ve enkaz kaldırma tarihe göre değişiyor).

**Veri kullanımı ✅ — Türkiye dışı dış sınama (QM-VS11-NOTO).**
- **Görüntü eşleşmesi:** Maxar Open Data "Japan-Earthquake-Jan-2024" (CC BY-NC 4.0). **2 Ocak 2024** tarihli WorldView-2,
  0,50–0,57 m, bakış açısı 17–26°. Aynı gün ilk GSI uçuşu var; enkaz henüz kaldırılmamış.
- **Bulut:** Wajima, Anamizu, Nanao, Shika %0 · Suzu %0–4 · Monzen %6 · Noto-cho %8. Bakış açısı 42–44° olan beşinci çekim
  kullanılmamalı.
- **Hazırlık:**
  1. GeoPackage'ı indir (47,9 MB; Utku).
  2. `damage_val` → 1 = hasar, 0 = arka plan; 9 → 255 (yok say); 99'u at.
  3. Beş yerleşimin Maxar karolarını indir (~391 MB; Utku). EPSG:32653'e dönüştür, ~0,53 m'de rasterleştir, 512²'ye kes.
  4. Kaymayı denetle (7 m'lik bina 21°'de ~5 piksel yatar).
- **Raporlanacaklar:**
  - Piksel IoU_hasar ve bina düzeyi P/R/F1. Bina düzeyi sonuç, insanın 0,91'lik F1'iyle doğrudan kıyaslanabilir.
  - Yalnız sarsıntı alt kümesi ayrıca (tsunami/yangın/heyelan öznitelikleri 0 olanlar).
- **Risk:** D3 binalar "Survived" sayıldığı için modelimiz onlarda yanlış alarm verebilir. Tanım farkı raporda belirtilmeli.
  Beklenti: IoU Türkiye sınamasından düşük (küçük ahşap evler; bizim 50–200 m² bulma oranımız %32).

**Atıf önerisi.**
- İlgili veri setleri: yer taramasıyla doğrulanmış 140 208 binalık ikili envanter.
- Sınıf tanımı: EMS-98/CEMS eşlemesini gerekçelendirmek için.
- Tartışma: "Uzaktan algılamaya dayalı insan değerlendirmesi bile yer gözlemine göre yıkık binaların yaklaşık %16'sını
  kaçırmaktadır (Destroyed duyarlılığı 0,84; Vescovo vd., 2025)."

**Takip:** Wiguna vd. 2024b → ✅ Ç-18. Tam metin okundu: sınama hava fotoğrafında ve yazarların kendi etiketleriyle; bu veri
setiyle sayısal kıyas yok.
### Ç-06 · Aydin vd. — Yapay zekâ ile hızlı yapısal hasar değerlendirmesi: kapsam taraması (2026)

**Künye.** Aydin, S. B., Gönen, S., Tekin, B., Pelà, L., Caglayan, S. "AI-Driven Post-Earthquake Rapid Structural Damage
Assessment: A Scoping Review of Component-Level and Holistic Approaches." *Archives of Computational Methods in Engineering*,
2026 (çevrimiçi 30.03.2026), doi:10.1007/s11831-026-10556-0, CC BY 4.0. UPC-BarcelonaTech, Sakarya UBÜ, EPFL. Makalemizde
**[7]**. Kaynak dosya: `Makale - Kaynaklar/s11831-026-10556-0.pdf`.

**Kapsam.** PRISMA-ScR; 2015–2025 hakemli dergi makaleleri (konferanslar bilerek dışarıda). Önce 10 658 kayıt bulunmuş,
sonunda **45 çalışma** kalmış (35 bileşen düzeyi, 10 bütüncül). **Betonarme yapıların yer seviyesi ve yakın çekim
görüntüleri** — uydu yok. SegFormer, Swin, ViT hiç geçmiyor; tek Transformer içeren çalışma hibrit bir CNN–Transformer
(Xu vd. 2025). Bizim kümelerimizin hiçbiri (KATE-*, MEDBFS, QQB, TE23D, xBD, BRIGHT) geçmiyor. Çalışma bazındaki
tablolar çevrimiçi ekte (C1–C10), PDF'te yok.

**Toplu bulgular.**
- **Görev:** sınıflandırma 32/45, tespit 14 + 3, bölütleme 13 + 3.
- **Mimari:** en sık ResNet 11, VGG 10, U-Net 7.
- **Doğrulama:** 23 basit bölme, **18 dış test** (farklı deprem), 4 k-katlı. Derleme **basit bölmeyi zayıf, dış testi en
  ikna edici** sayıyor.
- **Açık sorunlar:**
  - Veri darboğazı ve sınıf dengesizliği; yanlış negatifin maliyeti yüksek.
  - İnce taneli hasar.
  - **Görsel tespit ile nicel yapısal başarım arasındaki kopukluk** — derlemenin ana boşluğu.
  - Kara kutu sorunu; alan yanlılığı.
- **Önerilen uygulamalar:**
  - ImageNet aktarımı; bulanık ve düşük çözünürlüklü görüntüleri ayıklama.
  - Yarı sentetik veri ve "Damage-Intact Paste" artırması.
  - Bayesçi hiperparametre arama; MC dropout ile belirsizlik.
  - Yapay zekâ karar destek aracıdır; son söz uzmanda.

**Bize uygulanabilir dersler** (derleme uydu için kanıt sunmuyor; bunlar ilkelerin uyarlaması).
1. **Dış test = en güçlü kanıt:** Noto (QM-VS11) ve HaitiBRD (QM-VS06) dış sınamaları tam bu öneriye karşılık geliyor.
   Hatay ↔ Kahramanmaraş koşuları da (Tablo 15).
2. **Hasar yapıştırma artırması:** yıkık bina maskelerini sağlam karolara kopyala-yapıştır. Yalnız eğitimde; A/B deneyiyle
   ölçülmeli.
3. **Kalite süzgeci:** bulut, gölge ve bulanık karo kuralı (V₀) → eğitimde ve sınamada aynı kural.
4. **MC dropout / tohum topluluğu ile belirsizlik:** düşük güvenli yol kesimleri "doğrulanmalı" diye işaretlenir.
5. **Küçük bütçeli hiperparametre araması:** öğrenme oranı, focal γ/α, dice ağırlığı.
6. **Blok düzeyinde k-katlı doğrulama:** bölme varyansını tohum varyansından ayırır. İsteğe bağlı; maliyetli.
7. **Piksel doğruluğunu birincil ölçüt yapma.**

**Takip edilecek kaynaklar** (derlemenin kaynakçasından, uydu tarafı için):
- Al Shafian & Hu 2024 (*Buildings* 14:2344, uzaktan algılamayla bina hasarı derlemesi)
- Matin & Pradhan 2022 (*Geocarto Int.*)
- Chinmayi vd. 2024 (*Earthq. Res. Adv.*)
- Dong & Shan 2013 (*ISPRS J.*)
- Sajedi & Liang 2021 (MC dropout)
- Bai vd. 2025 (Damage-Intact Paste)

**Makalemizde düzeltilecek atıflar** (güncel docx'te [7]'nin geçtiği yerler; §8.4):
- **P56:** "Kapsam taramasının [7] ana bulgusu, bileşen düzeyi ile bütünsel değerlendirme arasında köprü bulunmadığı…" —
  bu, derlemenin **önceki derlemeler** için söylediği bir şey. Derlemenin ana boşluğu görsel tespit ile **nicel yapısal
  başarım** arasındaki kopukluk. Yeniden yazılmalı.
- **P276 (3.10):** "tek bir olaydan alınmış görüntülerin rastgele bölünmesini metodolojik bir zayıflık saymaktadır" — bu
  ifade derlemede yok. Öneri: "45 çalışmanın 23'ünün basit eğitim/test bölmesiyle değerlendirildiğini, bunun aşırı öğrenmeye
  açık bir zayıflık olduğunu ve farklı depremlerden dış test kümelerinin (18 çalışma) genellemenin en ikna edici kanıtı
  olduğunu belirtmektedir [7]."
- **P452:** "görsel tespit başarımı ile **operasyonel** ve yapısal performans arasındaki kopukluk" — derleme yapısal
  performans diyor. Öneri: "…nicel yapısal başarım (rijitlik kaybı, artık öteleme) arasındaki kopukluğu saptamaktadır [7];
  bu çalışma benzer bir kopukluğun algılama ile operasyonel karar (yol kapanması, ekip sevki) arasında da bulunduğunu ileri
  sürmektedir."
- **P47:** "Gao ve Mosallam" → "Gao ve Mosalam".
- **Uyumlu olanlar:** P21, P131, P461 (alan yanlılığı), P484 (son sorumluluk uzmanda).
- **Künye:** yayındaki yazım "Aydin", "Caglayan" (Türkçe karakterli yazım da kabul edilebilir; dergi biçimine göre).

**Eklenebilecek cümleler:**
- 2.2 / 2.5: "45 dergi çalışmasını derleyen kapsam taraması [7], yazının ağırlıkla yer seviyesi görüntülere ve
  sınıflandırmaya dayandığını göstermektedir; uydu görüntüsünden piksel düzeyinde bina hasarı bölütlemesi bu derlemenin
  kapsamında yer almamaktadır."
- 3.10: "Sınıf dengesizliğinde genel doğruluk nadir fakat kritik hasarları gizleyebildiğinden [7] birincil ölçüt
  IoU_hasar'dır."

---

### Ç-07 · TUE-CD veri seti ve MSI-Net (bağlantılar: Google Drive + GitHub)

**Künye.** Dergi sürümü: Liu, Y., Zhang, K., Guan, C., Zhang, S., Li, H., Wan, W., Sun, J. "Building Change Detection in
Earthquake: A Multiscale Interaction Network With Offset Calibration and a Dataset." *IEEE TGRS* 62:1–17, 2024,
doi:10.1109/TGRS.2024.3438290 (makalemizde [10], yıl doğru; ayrıntı Ç-12). Sonraki arXiv sürümü: Liu, Y., Zhang, Z., arXiv:2606.10329 (9 Haziran
2026). Depo: github.com/RSMagneto/MSI-Net.

**Veri seti (README'den).**
- Olay ve kaynak: Türkiye 2023. WorldView-2 öncesi/sonrası görüntüleri (Maxar açık verisi).
- Büyüklük: 1 656 karo, 256 × 256.
- Bölgeler: Adıyaman, Kahramanmaraş, Hatay, Gaziantep.
- Etiket: **2 338 yıkık bina**.
- İndirme: Google Drive'da `TUE-CD.zip` (herkese açık, "önizlenemeyecek kadar büyük"; boyut sayfada görünmüyor) ve Baidu.
- Lisans: README'de yok.

**Model.** MSI-Net, iki zamanlı değişim tespiti modeli. Üç modülü var:
- **Ortak çapraz dikkat (JCA):** kanal ve konum dikkatini birleştiriyor.
- **Çok ölçekli kayma düzeltme (MOC):** kısa aralıklı çekimlerdeki bakış açısı farkından doğan hizalama kaymasını düzeltiyor.
- **Öznitelik birleştirme (FeI).**

WHU-CD, CLCD ve TUE-CD'de sınanmış. Özette sayı yok, tam metin henüz okunmadı. Depoda kodun bir kısmı var
(`ATT.py`, `MSI.py`, `encoder.py`), eğitim betiği ve lisans yok.

**Bize uygunluk.**
- **Veri 🟡 — umut verici ama iki koşulla.**
  1. Karolarda konum bilgisi olmadığı için bizim il ve ilçelerimizle çakışma denetlenemiyor. MEDBFS'te yaptığımız gibi
     Maxar görüntüsüyle **şablon eşleştirerek konumlandırmak** gerekiyor. Konumlandırılmadan eğitime eklenirse sınama
     kümemize sızıntı olabilir.
  2. Lisans belirsiz; yazarlardan sorulmalı, en azından atıf yapılmalı.
- **Kullanım biçimi:** sonrası görüntüsü + yıkık bina maskesi, ikili eğitimimize doğrudan uyuyor. Konumlandırmadan sonra
  mekânsal bölmeye katılır. Öncesi görüntüleri de bizim negatif düzenimize (öncesi = boş maske) eklenebilir.
- **Etiket anlamı:** yalnız "yıkık" (QQB gibi). KATE-PD'nin "hasarlı bina" tanımından daha dar; ayrı raporlanmalı.
- **256² karolar:** 0,5 m'de 128 m kenar. Ya 256² ile eğitilir (karo boyutu karışımı), ya komşu karolar birleştirilir.
- **Model 🟡:** MSI-Net iki zamanlı olduğu için ana tek zamanlı kıyasa girmez. Olası bir "değişim tespiti yan deneyi"nde
  (KATE-CD çiftleri + TUE-CD) taban olur. MOC'un kayma düzeltme fikri o deney için değerli.

**Hazırlık adımları (Utku):** zip'i indir (boyut indirme sayfasında görülecek) → içeriği incele → şablon eşleştirmeyle
konumlandır → blok/bölme ata → 512'lik düzene çevir → `QM-VS05-TUECD` adıyla kaydet.

---

### Ç-08 · HaitiBRD — 2010 Haiti depremi bina + yol hasarı (DesignSafe PRJ-4169)

**Künye.** Lin, S., Edocia, M., Tsai, F., Chen, L., Kuo, W. (2023). "HaitiBRD: A labeled satellite imagery dataset for
building and road damage assessment of the 2010 Haiti earthquake" [Version 2]. DesignSafe-CI. doi:10.17603/ds2-fqat-4v02.
8 atıf almış (sayfa bilgisi).

**İçerik.**
- **Görüntü:** GeoEye-1, **0,5 m**, öncesi (9 Ocak 2010) ve sonrası (15 Ocak 2010). Maxar Open Data'dan, CC BY-NC 4.0.
- **Alan:** yaklaşık 3,51 km², Port-au-Prince ve çevresi.
- **Bina etiketi:** 9 000'den fazla bina, dört hasar düzeyinde (No damage / Minor / Major / Destroyed), renkli
  bölütleme maskesi olarak.
- **Yol etiketi:** **hasarlı ve hasarsız yol kesimleri çizgi olarak (.shp)**.
- **Etiketleme:** şirket içi ekip, kalite kontrollü.
- **Klasörler:** `cropped/` (20 öncesi/sonrası çift + `labels/buildings`, `labels/roads`) ve `original/` (tam alan;
  öncesi ve sonrası GeoTIFF'ler 53,7'şer MB).
- **Lisans:** Open Data Commons Attribution (etiketler).

**Bize uygunluk ✅ (dış sınama).**
- **Başka bir deprem, başka bir kent:** genelleme sınaması için ideal. Aynı olaydan olmadığı için sızıntı riski yok.
  Çözünürlüğü Pléiades karolarımıza yakın.
- **Yol hasarı etiketi çok değerli.** Bizim kapanma çıkarımımızın (hasar maskesi ∩ OSM yolu) gerçek bir yol hasarı yer
  gerçeğiyle sınanabileceği nadir açık kümelerden biri. Tablo 14'ün EMSR648'siz yeniden tasarımı için aday (§8).
- **İkili eşleme:** "Major + Destroyed → hasarlı" ile "yalnız Destroyed → hasarlı" iki biçimde de raporlanmalı.
- **Boyut küçük:** eğitimden çok dış sınama için.

**Hazırlık adımları (Utku):** indir (~110 MB + küçük dosyalar) → 0,5 m'de 512² karola → maskeyi ikiliye çevir → yol
çizgilerini kesim düzeyine aktar → `QM-VS06-HAITIBRD`.

---

### Ç-09 · HOTOSM Türkiye yıkık binaları (HDX)

**Künye.** Humanitarian OpenStreetMap Team, "HOTOSM Turkey Destroyed Buildings (OpenStreetMap Export)", HDX; 13 Şubat 2023'te
eklendi, son dışa aktarım 22 Mayıs 2023. Lisans **ODbL**.

**İçerik.**
- **Süzgeç:** `destroyed:building = 'yes' AND damage:date = '2023-02-06'`.
- **Kaynak:** Copernicus EMS ve İTÜ CSCRS görüntüleri üzerinden OSM ve MapRoulette gönüllüleri.
- **Biçimler:** GeoJSON (165,6 KB), CSV, GPKG, SHP, KML.
- **Uyarı:** "kalabalık kaynaklıdır, eksiksiz sayılamaz".

**Bizim sorgumuz** (Overpass, 22 Mayıs 2023 tarihli durum, aynı süzgeç): **3 434 yıkık bina poligonu**.
- **İller:** Hatay 1 255 · Gaziantep 1 007 · Adıyaman 599 · Kahramanmaraş 519 · Osmaniye 44 · Malatya 7.
- **Başlıca ilçeler:** Antakya 701 · Nurdağı 656 · Adıyaman merkez 535 · Kırıkhan 435 · İslahiye 317 · Onikişubat 177 ·
  Dulkadiroğlu 106 · Türkoğlu 105 · Elbistan 102.
- **`source` etiketi:** cscrs 1 613 · CopernicusEMS 791 · boş 716 · Microsoft ayak izleri 144.

**Bize uygunluk ✅ (bina düzeyi dış sınama) / 🟡 (eğitim).**
- **Dış sınama:** **Kırıkhan (435), Nurdağı (656) ve Adıyaman merkez (535)** eğitim verimizde yok ya da yok denecek kadar
  az (KATE-PD'de Nurdağı 2 karo). Bu ilçelerde Maxar Open Data sonrası görüntüsüyle "yıkık binaların kaçı bulundu"
  (bina düzeyi duyarlılık) ölçülebilir. Yeni ilçelerde genellemeyi gösterir.
- **Kesinlik ölçülemez:** etiketler eksiksiz değil; etiketlenmemiş yıkık bina yanlış alarm gibi görünür. Yalnız
  duyarlılık güvenilir.
- **Eğitim etiketi:** yalnız yıkık binaların sistematik işlendiği kümelerde (QQB'de yaptığımız gibi etiketli bölgenin
  dışbükey zarfı) olabilir. Önce ilçe ilçe tamlık denetimi gerekir.
- **Çakışma:** İslahiye'deki 317 kayıt büyük olasılıkla QQB etiketleriyle aynı kaynaktan. Mükerrer sayılmamalı.

**Hazırlık adımları (Utku):** Overpass tarihli dışa aktarım (salt okunur API) → ilçe seçimi → Maxar STAC'tan kapsayan
sonrası karoları indir (Utku) → QQB aracıyla karolama → doğrulama/sınama bloklarını dışla → `QM-VS07-HOTOSM`.

---

### Ç-10 · RAPID-A — Türkiye 2023 için derin topluluk öğrenmesi (ASCE OPEN 2025)

**Künye.** Soleimani-Babakamali, M. H., Askari, M., Heravi, M. A., Şişman, R., Attarchian, N., Askan, A., Soleimani, R.,
Taciroğlu, E. "Deep Ensemble Learning for Rapid Large-Scale Postearthquake Damage Assessment: Application to Satellite
Images from the 2023 Türkiye Earthquakes." *ASCE OPEN* 3(1):04025003, 2025. doi:10.1061/AOMJAH.AOENG-0043 (CC BY 4.0). UCLA,
YTÜ, ODTÜ. Ön baskı: Research Square 2023, doi:10.21203/rs.3.rs-3375920/v1.
**Not:** tam metin olarak ön baskı okundu; ASCE sürümünden yalnız özet görüldü. Sayılar ön baskıdan.

**Ne yapmışlar.**
- **Görüntü:** Google Haritalar karoları (Maxar kaynaklı, zoom 19 ≈ 0,23 m/piksel).
- **Eğitim bölgesi:** Antakya'da 5 679 blok (150 m, 640 px).
- **Maskeler:** uzmanlar iki maske çizmiş: **D** = kısmen/tamamen çökmüş, **P** = görünür duvar/çatı hasarı.
- **Hükümet verisi:** hasartespit.csb.gov.tr hasar tespitleri Microsoft ayak izlerine eşlenmiş.
- **Modeller:** 6 modellik topluluk:
  - EfficientNet-b7 + UNet++ (63 M)
  - **MiT-B5 + U-Net** (81 M) — makalenin "SegFormer mit_b5" dediği bu; SegFormer'ın MLP kod çözücüsü değil
  - Her ikisi üç girdiyle: yalnız RGB, RGB + değişim tespiti kanalı (öncesi Bing), RGB + NASA ARIA hasar vekil haritası
    (DPM, 30 m)
- **Eğitim:** Adam 3e-4, ≤ 40 dönem.
- **Birleştirme:** blok bazında oylama (6 modelden ≥ 4'ü hasar derse).
- **Belirsizlik:** maske–ayak izi örtüşme eşiği %20–80 taranıyor; sayılara log-normal dağılım uyduruluyor.

**Değerlendirme.**
- **Piksel ölçütü yok** (IoU/F1 raporlanmamış). Kahramanmaraş ve Gaziantep'te hasarlı bina **sayıları** hükümet sayılarıyla
  kıyaslanmış.
- **Kahramanmaraş:** makul uyum.
- **Gaziantep:** fazla kestirim. Yalnız RGB modeli H + M için medyan **10 860** verirken hükümet sayısı ~1 360.
- Kod bağlantısı (github.com/TRG-AI4Good/RAPID-A) **404**. Görüntüler Google/Bing karosu → veri kullanılamaz.

**Bizden farkı.**
- 6 modelin 4'ü öncesi görüntü ya da SAR istiyor; bizim tek zamanlı optik iddiamıza yalnız RGB kolları uyuyor.
- **Mimari eşleşmesi:** onların "SegFormer"ının karşılığı bizim **U-Net (MiT-B4)** satırımız.
- **Ölçü:** onlar bina sayısıyla ölçüyor, biz pikselle → sayısal kıyas yok.
- **Kapsam:** onlar yol ağına bağlanmıyor → zinciri kapatma özgünlüğümüzü destekliyor.

**Bize uygulanabilir dersler.**
1. **Topluluğu piksel düzeyinde göster:** 9 modelin olasılık ortalaması ya da k/9 oylaması sınama IoU'sunda **ek eğitim
   olmadan** ölçülebilir. RAPID-A bunu göstermiyor; biz gösterirsek katkı olur. Heterojen kodlayıcılar (SegFormer-B4 +
   UPerNet ConvNeXt-S + DeepLabV3+ R101) daha yararlı olabilir.
2. **Az hasarlı kentte yanlış alarm patlaması** (Gaziantep 10 860 / 1 360): gerçek negatiflerin (KATE-CD öncesi, QQB
   sağlamları) önemine ve Tablo 15 / il dışı sınamaya doğrudan kanıt.
3. **Ek kanal (DPM / değişim) yalnız ayrı ablasyon olarak:** "tek zamanlı optik" iddiamızı bozar. 30 m'lik DPM 512'lik karoda
   kenar başına ~5–8 piksel eder.
4. **Belirsizlik:** eşik taraması + dağılım fikri yol kapanmasına taşınabilir (kapanma eşiği tarandıkça kapalı yol sayısının
   dağılımı; topluluk uyuşmazlığından belirsizlik haritası). Yeni simülasyonda, bayrak arkasında.
5. **Sınıf tanımı:** yol kapatan enkaz esas olarak "çökme" (D) tipi hasar. Mümkünse çökme alt kümesi ayrıca raporlanmalı
   (Ç-05'teki EMS-98 eşlemesiyle birlikte).

**Veri/kod kullanımı:** ❌ Kod 404; görüntüler Google/Bing (yeniden dağıtım kısıtlı); hükümet verisi lisansı belirsiz.
Yöntem yeniden uygulanabilir.

**Atıf önerisi.**
- İlgili çalışmalar: "Soleimani-Babakamali vd. (2025), Antakya'da uzmanlarca çizilen çökmüş ve görünür hasarlı bina
  maskeleriyle EfficientNet-b7/UNet++ ve MiT-B5/U-Net tabanlı altı modelden oluşan bir topluluk (RAPID-A) eğitmiş; değişim
  tespiti ve NASA ARIA hasar vekil haritasını ek kanal olarak kullanarak Kahramanmaraş ve Gaziantep'teki hasarlı bina
  sayılarını hükümet verisiyle karşılaştırmıştır."
- Tartışma: "RAPID-A başarımı piksel düzeyinde değil bina sayısı düzeyinde raporladığından doğrudan karşılaştırılamaz;
  ayrıca çıktıyı yol ağına bağlamaz."
- Sınırlılıklar: "Yalnız RGB ile eğitilen modellerin başka bir kentte hasarı büyük ölçüde fazla kestirdiği bildirilmiştir;
  il dışı genelleme ayrıca sınanmalıdır."
- Sayı aktarılacaksa ön baskıya da atıf yapılmalı ya da sayılar ASCE metninden doğrulanmalı.
### Ç-11 · DA-SegFormer — hasar farkında SegFormer (IGARSS 2026, arXiv:2605.09864)

**Künye.** Zhu, K., Tang, W., Hay Tene, R., Liu, Z., Le, N., Rahnemoonfar, M. "DA-SegFormer: Damage-Aware Semantic
Segmentation for Fine-Grained Disaster Assessment." arXiv:2605.09864 (11 Mayıs 2026), IGARSS 2026'ya kabul edildi. Bina Labs,
Lehigh Üniv. **Kod, ağırlık ve bölme listesi yayımlanmamış.**

**Ne yapmışlar.** Yeni mimari yok: **SegFormer-B4** (bizimle aynı kodlayıcı) için bir eğitim ve çıkarım protokolü önerilmiş.
- **Veri:** RescueNet'in ilk sürümü — Michael Kasırgası sonrası **İHA** görüntüsü (cm ölçeği, 3000 × 4000). 11 sınıf: 4
  bina hasarı düzeyi, yol açık/kapalı. 1 973 görüntü (1 591 / 199 / 183); bölme yöntemi yazılmamış.
- **Çerçeve:** MMSegmentation, ADE20K ön eğitimi.

**Eklemeler.**
1. **Sınıf farkında örnekleme:** 1024² kırpıntıların %50'si nadir hasar sınıfı pikseli üzerine ortalanıyor.
2. **OHEM + Dice (1:1):** en zor 100 000 piksel (çapraz entropi) + sınıf başına Dice.
3. **Çözünürlük koruyan çıkarım:** görüntü küçültülmüyor; 1024'lük kayan pencere, adım 768.

Eğitim: AdamW 6e-5, kosinüs, 300 dönem, parti 2, L40S.

**Sonuçlar** (tek koşu, **ablasyon yok**): mIoU 72,06 → **74,61 (+2,55)**.
- **Kazançlar:** az hasar +11,7; büyük hasar +21,3; tam yıkım +3,4.
- **Kayıplar:** 11 sınıfın 7'sinde düşüş; yol-kapalı −4,5, hasarsız bina −2,1.
- **Maliyet:** ~10 kat yavaş (30,5 → 3,0 FPS).
- **Tutarsızlıklar:**
  - Taban çizgisi aynı anda üç şeyde farklı (kayıp, örnekleme, çözünürlük).
  - Lehigh'in sayfası farklı sayılar veriyor (+4,37).
  - Makalenin aktardığı PSPNet %79,43 tartışılmıyor.

**Değerlendirme.**
- Kazancın büyük kısmı büyük olasılıkla **çözünürlükten** geliyor: taban çizgisi görüntüyü 1024'e küçültüyor. En büyük
  kazanç dokuya bağlı az/büyük hasar sınıflarında; iri yapılı "tam yıkım" sınıfında kazanç yalnız +3,4.
- Bizim ikili görevde az/büyük hasar karışıklığı yok. IoU_hasar'da beklenen değişim **0 ile birkaç puan** arası; tek tohumda
  gürültüden ayırt edilemeyebilir.

**Bize uygulanabilir dersler.**
1. **Çıkarım ölçeğini eğitim ölçeğine sabitle** (en değerlisi — yeni simülasyon için):
   - Karşılaştırma ölçümü karo başına ve doğal çözünürlükte; orada sorun yok.
   - Ama uygulamanın `tiling.py:zoom_for_radius` işlevi analiz yarıçapı büyüdükçe zoom'u düşürüyor: 3 km'de z=15, yani
     ~3,9 m/piksel (EKSIKLER J-20). Bu, makalenin "yıkıcı alçak geçiren süzgeç" dediği şeyin ta kendisi.
   - Bizim tanı da aynı yönde: 0,375 m'de 0,486, 0,75 m'de 0,086.
   - **Yeni simülasyonda:** çıkarım ~0,4–0,5 m/piksele (37°K'de z=18 ≈ 0,48 m) sabitlenmeli. Alan büyürse zoom değil yama
     bütçesi büyümeli.
2. **Karo düzeyinde ağırlıklı örnekleyici:** her partinin ~%50'si hasar içeren karolardan gelsin
   (`WeightedRandomSampler`; ya da hasara odaklı kırpma).
   - Beklenen etki: duyarlılık ↑, kesinlik ↓. IoU'ya net etkisi belirsiz.
   - Kapanma kesinliği de ölçülmeli; bileşen tahminlerinin 1/3'ü zaten yanlış alarm.
3. **Focal α taraması (ucuz ve önemli):** kullandığımız kütüphanede (smp 0.5.0) focal kayıp **hasar piksellerini α = 0,25
   ile, arka planı 0,75 ile çarpıyor** (`_functional.py`, satır 83–84; doğrulandı). Bu, "azınlığa odaklan" mantığının
   tersi; γ = 2 bunu kısmen dengeliyor. α ∈ {0,25 · 0,5 · 0,75} denenmeli (→ EKSIKLER A-19; Tablo 21'deki kayıp taramasına bir
   kol olarak eklenebilir).
4. **OHEM:** focal kaybı kolay pikselleri zaten bastırıyor. İstenirse Tablo 21 kayıp taramasına BCE-ilk-%10 + Dice kolu
   eklenir. Risk: kaba poligon etiketlerde en zor pikseller çoğu zaman etiket gürültüsü.
5. **Önerilen küçük deney:** SegFormer-B4, P2, 2 × 2 tasarım (örnekleyici açık/kapalı × focal + Dice / OHEM + Dice), her
   kolda 3 tohum. Hepsi bayrak arkasında, varsayılanı kapalı; etki tohum gürültüsünü aşmadan 9 modele yayılmasın.
6. **Motivasyon için:** İHA'nın cm ölçeğinde ve doğrudan etiketle bile "yol-kapalı" sınıfının IoU'su %41–46'da kalıyor.
   Kapanmayı hasar ∩ yol kesişimiyle çıkarma yaklaşımımızı destekler.

**Veri/kod kullanımı:** kod yok. RescueNet açık ama İHA + kasırga + cm ölçeği + çok sınıflı; ayrıca lisansı CC BY-NC-ND →
eğitime ❌.

**Atıf önerisi.**
- İlgili çalışmalar: SegFormer'ın afet hasarında dengesizlik odaklı eğitimle kullanıldığı yakın tarihli örnek (İHA ve
  kasırga olduğu belirtilerek).
- Tartışma: çözünürlük bulgumuza destek.
- "+21 puan"ı etki büyüklüğü kanıtı olarak **alıntılama**: tek koşu, ablasyon yok, iki kaynak farklı sayılar veriyor.

---

### İkinci tur — makalelerin içinde anılan çalışmalar (§4.1-B, öncelik 1)

### Ç-12 · TUE-CD / MSI-Net — dergi sürümü (IEEE TGRS 2024)

**Künye.** Liu, Y., Zhang, K., Guan, C., Zhang, S., Li, H., Wan, W., Sun, J. "Building Change Detection in Earthquake: A
Multiscale Interaction Network With Offset Calibration and a Dataset." *IEEE TGRS* 62:1–17, 2024. **doi:10.1109/TGRS.2024.3438290**.
Makale numarası 5635217 TE23D kaynakçasından geliyor, Crossref'te doğrulanamadı; atıfta DOI kullanılmalı. Shandong Normal
Üniv. vd. IEEE sürümü kapalı erişim; okunan: arXiv:2606.10329 (2026, CC BY 4.0, 2 yazarlı sonraki sürüm).

**Veri (TUE-CD).**
- **Kaynak ve zaman:** Maxar açık verisi, WorldView-2, öncesi/sonrası çiftleri. Sonrası "depremden sonraki 5 gün içinde".
- **Kapsam:** 1 656 çift 256², 2 338 yıkık bina. İller "örneğin Adıyaman, Kahramanmaraş, Hatay, Gaziantep" diye örnekleniyor.
- **Belirtilmemiş:** çözünürlük; bölme yöntemi (yalnız 7:1:2 oranı var); karo koordinatı ve lisans.
- **Etiket:** ikili değişim haritası (1 = yıkık bina değişimi). Maskenin öncesi ayak izine mi, sonrası enkaza mı çizildiği yazılmamış.
- **Uyarı:** yazarlar sonrası görüntünün farklı bakış açısıyla çekildiğini, yüksek binalarda öncesi–sonrası kayması olduğunu
  vurguluyor.

**Model.** MSI-Net: ağırlık paylaşımlı Siyam ResNet-18 + JCA (kanal ve konum çapraz dikkati) + **MOC** (öğrenilen 2 kanallı
ofset alanıyla öznitelik bükme) + FeI. Eğitim: ağırlıklı çapraz entropi (0,7/0,3), AdamW 1e-3, 200 dönem, parti 16.

**Sonuçlar** (TUE-CD, %; mIoU = iki sınıf ortalaması):

| Yöntem | mF1 | mIoU | OA |
|---|---|---|---|
| FC-EF | 61,60 | 52,94 | 89,10 |
| BIT | 76,50 | 66,83 | 95,52 |
| AMTNet | 76,89 | 67,24 | 95,64 |
| HANet | 76,63 | 67,10 | 96,03 |
| **MSI-Net** | **78,02** | **68,48** | **96,16** |

Ablasyon: en büyük tek katkı MOC'un (+1,8 mIoU).

**Değişim sınıfı IoU'su** (incelemecinin beş ölçütten çözdüğü; makalede yok): MSI-Net **≈ 0,41**, F1 ≈ 0,58 (test piksellerinin
~%4,8'i değişim). Yani **iki zamanlı değişim tespiti bile hasar sınıfında bizim 0,40–0,43 bandımızda**. Görev, bölme ve etiket
farklı olduğu için doğrudan kıyas değil. Makalede tablo tutarsızlıkları var (BIT satırında mF1 hem P'den hem R'den büyük).

**Bize dersler.**
1. **Değişim tespiti literatürüyle kıyas:** mF1/mIoU iki sınıf ortalamasıdır. Bizim sayılarımızı (IoU_hasar, IoU_arka, mIoU)
   birlikte verirsek kıyaslanabilir oluruz (§7 ile aynı ders).
2. **MOC fikrinin bizdeki karşılığı:** görüntü ile OSM yol ağı arasındaki kayma. Kesişimden önce sahne başına
   görüntü–OSM ofsetini ölçüp düzeltmek yanlış kapanmaları azaltabilir (yeni simülasyon, §9.5).
3. **TUE-CD'yi eğitime katma adımları:** lisans iste → içeriği ve georeferansı kontrol et → 30–50 karoda maskenin sonrası
   görüntüye oturup oturmadığını ölç → öznitelik eşlemeyle konumlandır → blok ata → sonrası + maske pozitif, öncesi negatif →
   TUE-CD'li / TUE-CD'siz ablasyon. En büyük risk KATE-PD ile aynı Maxar sahnelerinden sızıntı.

**Makalemizde:** Tablo 1'de TUE-CD'nin görüntü sayısı **1 656** (çift, 256²) olmalı; 2 338 yıkık bina etiketi dipnota. Kaynak
[10]'a doi:10.1109/TGRS.2024.3438290 eklenmeli.

### Ç-13 · Microsoft — Türkiye bina hasar değerlendirmesi (MSR-TR-2023-7) ve bağımsız doğrulaması

**Künye (doğru hâli).** Robinson, C., Gupta, R., Fobi Nsutezo, S., Pound, E., Ortiz, A., Rosa, M., White, K., Dodhia, R., Zolli,
A., Birge, C., Lavista Ferres, J. M. "Turkey Building Damage Assessment." Microsoft Research teknik raporu **MSR-TR-2023-7**,
16 Şubat 2023 (microsoft.com/en-us/research/publication/turkey-earthquake-report/). **EIDSeg'in kaynakçasındaki künye
hatalı**: oradaki alt başlık ve yazar adı raporda geçmiyor.

**Ne yapmışlar.**
- **Görüntü:** yalnız sonrası (7–9 Şubat); Maxar 30 cm ve Planet 50 cm.
- **Kapsam:** 4 ilçe — Kahramanmaraş, Türkoğlu, Nurdağı, İslahiye.
- **Model:** xBD ön eğitimli CNN, **her ilçe için ayrı**, insan-döngülü ince ayarla. 3 sınıflı piksel bölütleme; bina izlerinde
  hasarlı piksel yüzdesi.
- **Tahminler:** 3 849 hasarlı bina (Kahramanmaraş 3 005, Türkoğlu 185, Nurdağı 331, İslahiye 328). **Raporda doğruluk ölçüsü
  yok.**
- **Paylaşım:** şehir başına GeoPackage, herkese açık bağlantılarla. Ama **lisans yok** ("All rights reserved") → açık veri
  değil. Kıyasta atıfla kullanılır; yeniden dağıtım için izin gerekir.

**Bağımsız doğrulama — çok önemli.** Ainscoe, E. A., Swaminathan, R., Way, L., Modugno, S., Chin, S. T., Panta, N., Crevoisier,
T., Yun, S.-H. "Earthquake damage mapped more comprehensively and accurately by radar satellites than optical imagery."
*Communications Earth & Environment* 6:631, 2025. doi:10.1038/s43247-025-02623-4 (açık erişim; **tam metin okundu**, 19 Eylül).
- **Yer gerçeği:** ÇŞB saha hasar tespitinin 17 Şubat 2023'te alınmış ara sürümü (tespit sürerken), 911 181 nokta. Noktalar
  Microsoft bina izlerine atanmış: 228 859 hasarsız, 50 395 hasarlı; 48 044 "değerlendirilemedi" dışarıda.
- **"Hasarlı" tanımı:** ağır hasarlı + acil yıkılacak + yıkık. Az hasarlı ve hasarsız → "hasarsız". Orta hasar bu veride yok.
- **Kıyas alanı:** bütün ürünlerin örtüştüğü iki şehir — **Kahramanmaraş ve Nurdağı** (İslahiye değil).
- **Sonuçlar** (bina düzeyi; ≈ işaretli duyarlılıklar kesinlik ve F1'den hesaplandı):

| Yöntem | Kesinlik | Duyarlılık | F1 | Kestirilen / gerçek hasarlı sayısı |
|---|---|---|---|---|
| Microsoft CNN (optik; Maxar 0,3 m + Planet 0,5 m) | 0,42 | ≈ 0,17 | **0,24** | 0,41 |
| Elle optik yorum ("olası hasarlı" → hasarlı) | 0,64 | ≈ 0,14 | 0,23 | 0,21 |
| Elle optik yorum ("olası hasarlı" → hasarsız) | 0,79 | ≈ 0,08 | 0,15 | 0,10 |
| Radar hasar vekil haritası (SAR, 30 m) | 0,39 | 0,59 | **0,47** | 1,50 |

- **Okuma:** optik yöntemler ağır hasarlı binaların yalnız %8–17'sini buluyor; insan yorumu da modelden iyi değil. Yazarlara göre
  noktaları binalara atarken oluşan hatalar bütün yöntemleri kötü gösteriyor; sayılar **alt sınır** olarak okunmalı.
- **Gerekçe:** çatısı sağlam kalmış ağır hasarlı bina yukarıdan hasarsız görünüyor. Bakış açısı, güneş ve bulut gölgesi farkları
  da hem kesinliği hem duyarlılığı düşürüyor.
- **Bizim için en önemli cümle** (Tartışma bölümü): hasar modelleri çoğunlukla optik görüntüde elle etiketlenmiş verilerle
  eğitilip doğrulanıyor; görüntüde algılanamayan hasar yüzünden eksik kalan etiketler modelleri zayıflatabilir ya da
  yeteneklerini olduğundan yüksek gösterebilir. Bizim etiketlerimiz de optik → IoU'muz "görünür hasar"la uyumu ölçüyor.
- **Kapsam:** ilk 10 günde Maxar'ın optik görüntüsü radar kapsamının yalnız %5,4'ü; Microsoft ürünü ~800 km².
- **Not:** Önceki sürümde radar için yazılan "kesinlik 0,47" yanlıştı; 0,47 radarın F1'i (19 Eylül'de düzeltildi).

**Bize dersler.**
1. **Makalenin çerçevesi:** hedefimiz "**uydudan görünür hasar**". Saha tespitine göre düşük duyarlılık, optik uydunun (insan
   yorumu dahil) ortak sınırı. Kısıtlar bölümüne Ainscoe vd. ile yazılmalı. 0,43'lük IoU'muzu doğru bağlama oturtur.
2. **Adil taban çizgisi (İslahiye):** Microsoft çıktısı ile modelimiz aynı referansa (QQB yıkık bina listesi) göre bina düzeyi
   P/R/F1 ile puanlanabilir; eşik açıkça yazılmalı.
3. **Etiket kaynağı olarak önerilmez:** bina başına yüzde, ayak izi dışındaki enkaz yok, doğruluk düşük, lisans yok.
4. **ÇŞB verisi en güçlü bağımsız referans:** Bakanlıktan talep edilebiliyor (QM-VS13).
5. **Ayak izine bağlı olmamamız** yol kapanması için avantaj (yola taşan enkaz bina izinin dışında kalır).

**Atıf önerisi.** "Microsoft ve ortakları, xBD'de ön eğitilip her ilçe için ayrıca ince ayarlanan bir CNN'i 7–9 Şubat 2023 tarihli
tek zamanlı Maxar/Planet görüntülerine uygulayarak dört ilçede bina düzeyi hasar tahmini üretmiş, ancak doğruluk
raporlamamıştır (Robinson vd., 2023). ÇŞB saha tespitine karşı Kahramanmaraş ve Nurdağı'nda yapılan bağımsız
değerlendirme, ağır hasarlı ve daha kötü durumdaki binalar için bu ürünün F1 değerini 0,24, uydu görüntüsünün elle
yorumlanmasınınkini 0,15–0,23 bulmuş; düşük duyarlılığı, çatısı sağlam kalan hasarlı binaların yukarıdan görülememesine
bağlamıştır (Ainscoe vd., 2025)."

### Ç-14 · Song vd. 2020 — tek fazlı görüntüde süperpiksel + derin öğrenme (IJRS)

**Künye.** Song, D., Tan, X., Wang, B., Zhang, L., Shan, X., Cui, J. "Integration of super-pixel segmentation and deep-learning
methods for evaluating earthquake-damaged buildings using single-phase remote sensing imagery." *IJRS* 41(3):1040–1066, 2020.
doi:10.1080/01431161.2019.1655175. **Kapalı erişim — yalnız özet ve atıf yapan çalışmalar okunabildi; sayı yok.**

**Yöntem** (özetten):
- **DeepLab v2** ile ilk hasar alanları çıkarılıyor.
- **SLIC süperpikselleri** bu alanlara göre birleştiriliyor.
- **Matematiksel morfoloji** ile gürültü temizleniyor.
- İkincil kaynaklara göre veri Wenchuan 2008 hava fotoğrafı ve 3 sınıf. Bu doğrulanmadığı için makalemize yazılmamalı.

**Bize dersler (son işlem — bileşen kesinliğimiz 0,67).**
1. **Süperpiksel oylaması:** sonrası karoya SLIC uygula. Süperpikseldeki ortalama olasılık τ'yu geçerse süperpikselin tamamı
   hasarlı sayılır. Eğitim gerekmez; tek tük hatalı pikselleri siler, sınırları görüntü kenarlarına oturtur. **Yanlış alarmı
   azaltmada ilk denenecek adım.**
2. **Süperpiksel boyutunu m² ile sabitle:** 0,75 m'de aynı piksel sayısı 6,25 kat alan kaplar. Hedef < 50 m²; yoksa zaten %32'de
   kalan 50–200 m²'lik kümeler kaybolur.
3. **Morfoloji + en küçük alan eşiği** (≤ 50 m²), kesinlik-duyarlılık eğrisinden seçilsin.
4. **Temizlik yol kesişiminden önce yapılsın:** yanlış alarm bileşeni doğrudan sahte kapanmaya dönüşür. Etki yol kesimi
   düzeyinde de raporlanmalı.
5. **Deney disiplini:** τ, alan eşiği ve yapı elemanı yalnız doğrulama bloklarında seçilmeli. Bayrak arkasında, varsayılanı
   kapalı. Tablo 21'in "morfolojik son işlem" satırıyla birleşir.

**Yan bulgular (takip edilecek).**
- **Ekkazan'ın 2024 YTÜ yüksek lisans tezi:** 6 Şubat 2023 uydu görüntülerinde hasarlı bölge tespiti; TE23D'yi geliştiriyor,
  SegFormer dahil modelleri değerlendiriyor. **Bize çok yakın emsal**; incelenmeli (Ç-03'ün genişletilmiş hâli olabilir).
- IJRS 46(24) 2025, Beyrut: Felzenszwalb / SNIC / MRS bölütlerinin derin öğrenmeyle karşılaştırması. Süperpiksel algoritması
  seçimi için.

**Atıf önerisi.** Yöntem düzeyinde: "Yalnız deprem sonrası görüntüde derin ağın (DeepLab v2) bulduğu hasar alanlarının SLIC
süperpikselleri ve morfolojiyle iyileştirildiği iki aşamalı bir yaklaşım önerilmiştir (Song vd., 2020)."

### Ç-15 · Duarte vd. 2018 — çok çözünürlüklü öznitelik birleştirme (Remote Sensing + ISPRS Annals)

**Künye.**
- (a) Duarte, D., Nex, F., Kerle, N., Vosselman, G. "Multi-Resolution Feature Fusion for Image Classification of Building
  Damages with Convolutional Neural Networks." *Remote Sensing* 10(10):1636, 2018, doi:10.3390/rs10101636, CC BY 4.0.
- (b) Aynı yazarlar, "Satellite Image Classification of Building Damages Using Airborne and Satellite Image Samples in a Deep
  Learning Approach." *ISPRS Annals* IV-2:89–96, 2018, doi:10.5194/isprs-annals-IV-2-89-2018.
- ITC / Twente. İki çalışmanın da tam metni okundu.

**Ne yapmışlar.**
- **Olaylar:** 8+ deprem (L'Aquila, Port-au-Prince, Christchurch, Katmandu, Portoviejo, Amatrice …).
- **Veri:** üç platformdan hasarlı/sağlam **yama** örnekleri:
  - uydu WV-3 / GE-1, 0,4–0,6 m, ~1 250 + 1 250
  - insanlı hava, 8–18 cm
  - İHA, < 1–12 cm
- **Görev:** yama düzeyinde **ikili sınıflandırma** — bölütleme değil.
- **Model:** sıfırdan eğitilmiş, genişlemeli (dilated) CNN.
- **Stratejiler:** tüm çözünürlükler tek ağda (mresA) · ortak bağlam modülü + çözünürlüğe özgü baş (mresB) · her çözünürlüğe ayrı
  kodlayıcı + birleştirme (mresC / MR_c).

**Sonuçlar** (uydu doğruluğu):

| Kaynak | Taban | Tek ortak ağ | Ortak gövde + ayrı baş | Ayrı kodlayıcı + birleştirme |
|---|---|---|---|---|
| (b) | 0,905 | 0,898 (**−0,7**) | 0,924 (+1,9) | **0,944** (+3,9) |
| (a) | 87,7 | — | — | 89,7 |
| (a) aktarım (Portoviejo) | 81,5 | — | — | 83,4 |

- **Genel ön eğitim işe yaramadı;** başka platformun **hasar** örnekleri yaradı.
- **Karıştırıcı:** birleştirmeli ağlar 5 kat fazla örnek ve 2 kat parametreyle eğitilmiş.
- **Kapsam dışı:** uydunun kendi içindeki çözünürlük farkı ve "bir çözünürlükte eğit, ötekinde sına" hiç denenmemiş.

**Bize dersler (karışık çözünürlük sorunumuz: 0,486 / 0,395 / 0,086).**
1. **Önce ayrıştır — 0,086 çözünürlükten mi, etiketten mi?** Yalnız çıkarım gerekir; dakikalar sürer.
   - (i) Maxar/Pléiades sınama karolarını 0,75 m'ye indirip aynı modelle ölç.
   - (ii) İslahiye'de aynı yere düşen KATE-PD ↔ MEDBFS karolarında iki etiket kümesinin birbirine göre IoU'sunu hesapla.
   - Düşüş küçük ve uyum düşükse sorun **etiket politikası**dır; çözünürlük yöntemleri 0,086'yı düzeltmez.
2. **Düz karıştırma yerine ortak gövde + hedef çözünürlükte baş:** tüm kaynaklarla eğit, kod çözücüyü 0,3–0,5 m ile ince ayarla.
   Deneme 2'deki "MEDBFS'i çıkar" kazancı (0,410 → 0,434) MEDBFS atılmadan korunabilir (değerlendirme).
3. **Ölçek artırması ve ölçek eşitleme:**
   - Eğitimde rastgele ölçek [0,5; 1,2] (sentetik bozunum olarak etiketlenmeli).
   - Çıkarımda 0,75 m karoyu çeyreklere bölüp 512²'ye büyütme; çok ölçekli çıkarım.
   - 1. deney çözünürlüğü suçlarsa en ucuz yol.
4. **Yüksek çözünürlüklü hasar örnekleriyle ön eğitim:** genel ön eğitim değil, hasar örnekleri işe yarıyor. Bizim için aday
   sınırlı (RescueNet İHA, kasırga, lisans NC-ND).
5. **Ölçüm disiplini:** 3 tohum + kaynak başına IoU ve güven aralığı. Onların farkları da gürültü içinde kalıyor.

**Atıf önerisi.** "Farklı platformlardan alınan deprem hasarı örneklerini çözünürlüğe özgü modüllerle öznitelik düzeyinde
birleştirmek uydu doğruluğunu 2–4 puan artırmış, tüm çözünürlükleri tek bir ortak ağa beslemek ise artırmamıştır (Duarte vd.,
2018a, 2018b); ancak bu çalışmalar uydu görüntüsünün kendi içindeki çözünürlük farkını ve piksel düzeyi bölütlemeyi
incelememiştir."

### Ç-16 · Valentijn vd. 2020 — CNN'in tehlike türleri ve olaylar arası aktarılabilirliği (Remote Sensing)

**Künye.** Valentijn, T., Margutti, J., van den Homberg, M., Laaksonen, J. "Multi-Hazard and Spatial Transferability of a CNN for
Automated Building Damage Assessment." *Remote Sensing* 12(17):2839, 2020. doi:10.3390/rs12172839, CC BY 4.0. 510 (Hollanda
Kızılhaçı) + Aalto Üniv. Kod: github.com/rodekruis/caladrius. **Metin tam okundu; tablolardaki sayılara erişilemedi.**

**Ne yapmışlar.**
- **Veri:** xBD'den 13 olay (tornado, kasırga, sel, tsunami, volkan — **deprem yok**), 175 289 bina, öncesi + sonrası.
- **Görev:** bina düzeyinde sınıflandırma; poligon hazır.
- **Model:** iki ayrı Inception-v3 (ImageNet) + FC.
- **Deneyler:** olay içi (%80/10/10, bölme yöntemi yazılmamış) ve **olay dışarıda bırakma** (hedef olayın etiketi hiç
  kullanılmadan).
- **Aktarım ölçüsü:** kaynak modelin makro F1'i / hedefte eğitilmiş modelin makro F1'i.

**Bulgular** (metinden):
- **Joplin tornadosu:** en iyi tekil kaynak %80; **aynı türdeki bütün olaylar birlikte %93**.
- **Nepal seli:** en iyi durumda **%53**; model açık hasarı bile kaçırıyor.
- **Genel:**
  - Aynı hasar türü aktarımı garanti etmiyor.
  - Çok sınıflı eğitip sonra ikiliye toplamak AUC'yi eşit ya da daha yüksek veriyor.
  - Dengeli yeniden örnekleme azınlık sınıfların duyarlılığını artırıyor.
  - Hataların önemli kısmı hasarın düşük tahmin edilmesinden geliyor.
- **Öneri:** yeni bir afette "aynı türdeki bütün olaylarla eğitilmiş model" kullanılmalı; çıktının bir kısmı elle
  doğrulanmalı.
- **Kapsam dışı:** az etiketle ince ayar denenmemiş. Literatürde hedef binaların %10–25'iyle ince ayar her kurulumda iyileştirme
  sağlamış (Xu vd., Nex vd.).

**Bize dersler — Tablo 15 tasarımı için (önemli).**
1. **"Birleşik" satırı bir aktarım testi değil:** hedef ili de içeriyor.
   → **İl-dışarıda-bırakma** satırı ekle: "hedef il hariç diğer iller → hedef". Operasyonel senaryonun karşılığı bu.
2. **Oran sütunu ekle:** IoU(kaynak → hedef) / IoU(hedef → hedef), aynı sınama bloklarında. Mutlak farkın yanında dursun.
3. **Kaynak küme karışıklığı (A-20):**
   - Hatay'ın karoları ağırlıkla KATE-PD (340 KATE-PD + 26 MEDBFS); Kahramanmaraş'ınkiler ağırlıkla MEDBFS (199 KATE-PD + 283
     MEDBFS; 0,75 m, farklı etiket).
   - Hatay ↔ Maraş farkı il değil **veri kümesi farkı** olabilir.
   - **Kontrol:** yalnız KATE-PD karolarıyla tekrar, ya da sonuçları kaynak kümeye göre ayrı raporla. P2 protokolünde MEDBFS
     eğitimde yok, ama sınamalar yine kaynağa göre ayrılmalı.
4. **Eğitim miktarını eşitle:** tek il eğitimlerini eşit karo ya da eşit hasarlı piksel sayısına alt-örnekleyen bir kontrol.
5. **Az etiketle ince ayar eğrisi** (literatürdeki boşluk):
   - İl-dışarıda-bırakma modeline hedef ilin 1 / 2 / 5 / 10 bloğunu ekle; blok düzeyinde ve ≥ 3 çekilişle.
   - Soru: "il-içi IoU'nun %90'ına kaç km² etiketle ulaşılıyor?"
6. **Eşik kaymasını ayrı ölç:**
   - kaynak doğrulamasındaki eşikle IoU
   - hedefte en iyi eşikle IoU ("kâhin" diye etiketlenmeli)
   - eşiksiz piksel AP
7. **Seçimi sınamaya bağlama:** bütün seçimler kaynak doğrulamasında yapılsın.
8. **Belirsizlik ve katmanlama:** ≥ 3 tohum + aynı bloklarda eşleştirilmiş blok bootstrap; blok başına hasar oranı dilimlerinde
   IoU; hedef ilde doğru/yanlış tahmin haritası ve yol kapanması uyumu.
9. **Dış sınamalar (Noto, Haiti):**
   - Bütün illerle eğitilmiş modeli sıfır atışla dene.
   - Çözünürlüğü eğitim GSD'sine eşitle; bakış ve güneş açılarını raporla.
   - Haiti için Xu vd. (arXiv:1910.06444) kıyas noktası olabilir.
10. **İsteğe bağlı:** KATE-CD çiftleriyle tek zamanlı ↔ iki zamanlı model kıyası ("öncesi görüntü aktarımı artırır" varsayımı
    hiç sınanmamış).

**Atıf önerisi.** "Olaylar arası aktarımda başarım hedef olaya güçlü biçimde bağlıdır: hedef olaydan hiç etiket kullanmadan, aynı
hasar türündeki olaylarla eğitilen bir CNN Joplin tornadosunda olay-içi makro F1'in %93'üne ulaşırken Nepal selinde en iyi
durumda %53'te kalmıştır (Valentijn vd., 2020)." Makale "mekânsal aktarılabilirlik" derken olaylar arası aktarımı kastediyor;
bizim olay içi, iller arası sınamamızla bu ayrım açıkça yazılmalı.

**Takip:**
- Nex vd. 2019 (*Remote Sens.* 11:2765; deprem, olay dışı düşüş, %15–25 ile ince ayar)
- Benson & Ecker 2020 (arXiv:2011.10328; xBD olay dışarıda bırakma)
- Xu vd. 2019 (arXiv:1910.06444; Haiti)

### Ç-17 · Xie vd. 2022 — hasarlı binaların heterojenliğini gözeten tek zamanlı bölütleme (IEEE TGRS)

**Künye.** Xie, Y., Feng, D., Chen, H., Liu, Z., Mao, W., Zhu, J., Hu, Y., Baik, S. W. "Damaged Building Detection From
Post-Earthquake Remote Sensing Imagery Considering Heterogeneity Characteristics." *IEEE TGRS* 60:4708417, 2022.
doi:10.1109/TGRS.2022.3200872. Southwest Jiaotong Üniv. vd.
**Kapalı erişim:** özet, anahtar sözcükler, kaynakça başlıkları ve atıf yapan çalışmalar okundu. Sayılar arama özetlerinden
geliyor; PDF'ten teyit edilmedi.

**Ne yapmışlar.**
- **Veri:** 2010 Haiti depremi, **yalnız sonrası**, 0,5 m RGB. Uydu mu hava fotoğrafı mı belirsiz; görüntü sayısı, karo boyutu,
  etiket tanımı ve bölme erişilemedi.
- **Model:** **U-Net tabanlı CNN — ViT değil.** TE23D'nin "ViT" nitelemesi yanlış; "3 094 görüntü" de doğrulanamadı. Üç modül var:
  1. Yerel–küresel bağlam dikkati.
  2. Atlama bağlantısı yerine öz-dikkatli öznitelik birleştirme.
  3. Çok kollu yardımcı sınıflandırıcı.
- **"Heterojenlik":** hasarlı binaların spektral farkı, düzensiz dokusu ve bozulmuş biçimi; yani sınıf içi görünüş çeşitliliği.

**Sonuçlar** (arama özetinden): IoU **%62,43**, F1 %76,11, doğruluk %85,87.
- 3 nesne tabanlı yöntem ve 16 derin modelle kıyaslanmış; IoU artışı %0,03–7,39.
- **Değerlendirme:**
  - Üç sayı tek bir global karışıklık matrisinden gelmiyor gibi (IoU 62,43 ise F1 76,87 olmalıydı) → büyük olasılıkla görüntü
    başına ortalama.
  - Karolar hasar açısından yoğun (piksellerin ~%23'ü doğru bulunmuş hasar). Negatif ağırlıklı sınamamızla doğrudan
    kıyaslanamaz.
  - En iyi rakiple 0,03 puanlık fark varyans bildirilmeden anlamsız.

**Bize dersler.**
1. **Derin denetim:** MiT-B4'ün 1/8 ve 1/16 aşamalarına hafif yardımcı ikili başlar + ek kayıp (~0,4 ağırlık). Çıkarımda
   atılır, ucuz. "Çok kollu yardımcı sınıflandırıcı"nın karşılığı. İsteğe bağlı deney.
2. **Ayrıntı kurtarma:** SegFormer'ın kod çözücüsü 1/4 ölçekte. 10 m'lik bina 0,75 m'de ~13 piksel, 1/4 ölçekte ~3 piksele iniyor.
   **9 model kıyasımızdaki U-Net ve FPN (MiT-B4) bu hipotezi zaten doğrudan sınıyor** — aynı kodlayıcı, atlama bağlantılı kod
   çözücü. Sonuç özellikle 0,75 m karolarda ve küçük binalarda (50–200 m²) ayrıca raporlanmalı.
3. **Heterojenliği veriyle karşılama:** sensörler arası histogram eşleme, güçlü renk oynatma, çok ölçekli eğitim. §6.5'teki 8 ve
   9. maddelerle aynı.
4. **Raporlama:** global IoU yanında görüntü başına ortalama IoU, F1, doğruluk ve sınamadaki hasar pikseli oranı.

**Atıf önerisi.** "Xie vd. (2022), 2010 Haiti depreminin 0,5 m çözünürlüklü deprem sonrası görüntülerinde hasarlı binaların
spektral, doku ve biçim heterojenliğini yerel–küresel bağlam dikkati, öz-dikkatli öznitelik birleştirme ve çok kollu yardımcı
sınıflandırıcı içeren U-Net tabanlı bir CNN ile ele almıştır." Cümlede "ViT" ve "3 094" geçmemeli. **%62,43 makaleye
yazılmayacak:** tam metne erişilemedi; kapalı erişimli PDF'ler aranmıyor (karar, 19 Eylül). Çalışma yalnız yöntem düzeyinde
anılır.

### Ç-18 · Wiguna vd. 2024b — Noto 2024, yarı denetimli öğrenmeyle hasar haritalama (IEEE GRSL)

**Künye.** Wiguna, S., Adriano, B., Vescovo, R., Mas, E., Mizutani, A., Koshimura, S. "Building Damage Mapping of the 2024 Noto
Peninsula Earthquake, Japan, Using Semi-Supervised Learning and VHR Optical Imagery." *IEEE GRSL* 21:1–5, 2024.
doi:10.1109/LGRS.2024.3407725 (hibrit açık erişim, CC BY-NC-ND). Tohoku Üniv. / IRIDeS.
**Erişim:** tam metin IEEE Xplore'da tarayıcıyla okundu (19 Eylül); Tablo I görüntüden okundu. **Aşağıdaki sayılar teyitli.**
Önceki sürümdeki üç tahmin yanlış çıktı: görüntü uydu değil hava fotoğrafı; etiketler yazarların kendi görsel yorumu; özetteki
0,62 hasar sınıfının değil iki sınıfın ortalama F1'i.

**Ne yapmışlar.**
- **Görev:** bina düzeyinde ikili sınıflandırma (hasarsız / hasarlı); bina başına yama.
- **Model:** ön eğitimli Swin-T; BCE, AdamW (1e-4 → 1e-6 kosinüs), 30 dönem, parti 64, tek tohum. ResNet omurgası da denenmiş,
  Swin-T daha iyi.
- **Kaynak veri:** xBD (4 sınıf → ikili; az + ağır + yıkık = hasarlı). İkinci kurulumda 2011 Tohoku eklenmiş (WorldView-3,
  0,5 m, MLIT saha etiketleri).
- **Hedef (Noto), 4 alan:** Ukai balıkçı limanı, Suzu merkez, Wajima merkez, Machinomachi (Wajima).
  - Sonrası: **GSI hava fotoğrafı** (2 Ocak 2024; Wajima 11 Ocak). Öncesi: Google uydu görüntüsü. İkisi de ~0,2 m.
  - Etiket: yazarların bu çalışma için yaptığı görsel yorum (öncesi/sonrası karşılaştırması; yapısı bozulmuş bina = hasarlı).
    Bizim kullanacağımız Noto veri setinden (Ç-05; 140 208 bina, "destroyed / survived") tanım ve kapsam olarak farklı.
- **Uyarlama:** kaynak modelin hedefteki yüksek güvenli tahminleri sözde etiket olarak alınıp yinelemeli ince ayar yapılıyor.
  Son Swin bloğu ve doğrusal katmanlar dışında her şey donuk. Altı güven eşiği denenmiş, sonuçlar en iyisiyle (#5) veriliyor.
  Sözde etiket sayısı önceki turdan azalınca duruluyor. Her tur ~20 dk.
- **Kod/ağırlık:** paylaşılmamış.

**Sonuçlar** (Tablo I, bina düzeyi F1, dört alanın tamamı):

| Başlangıç modeli | Uyarlama | Hasarsız | **Hasarlı** | Ortalama |
|---|---|---|---|---|
| xBD | yok | 0,91 | **0,24** | 0,57 |
| xBD | sözde etiket | 0,90 | **0,32** | 0,61 |
| xBD + Tohoku | yok | 0,92 | **0,33** | 0,62 |
| xBD + Tohoku | sözde etiket | 0,95 | **0,55** | 0,75 |

- Özetteki "0,62 → 0,75" iki sınıfın ortalaması; hasar sınıfındaki artış 0,33 → 0,55.
- Alanlar arası fark büyük: uyarlamadan önce hasar F1'i 0,13 (Suzu) ile 0,41 (Ukai) arasında.
- **Hata biçimi:** çatısı düzleşen çökmüş binayı uyarlama düzeltiyor; çatısı değişmeden dönen ya da eğilen hasarlı bina hâlâ
  "hasarsız". Yazarlar bunu xBD'nin tepeden bakan uydu görüntüsüne bağlıyor — Ainscoe vd.'nin bulgusuyla aynı (Ç-13).

**Bize dersler — Noto dış sınamamız için.**
1. **Sayısal kıyas yok:** onların sınaması 0,2 m hava fotoğrafında ve kendi etiketleriyle; bizimki Maxar WV-2 (0,5 m) ve Noto
   veri setinin etiketleriyle. Sonuçlar aynı tabloya konmaz. Bağlam olarak şu söylenebilir: "xBD ile eğitilmiş bir model,
   uyarlama yapılmadan Noto'da hasarlı binada F1 0,24–0,33 almıştır."
2. **Yerel bağlamın etkisi:** aynı ülkeden geçmiş bir olayı (Tohoku) eğitime eklemek, uyarlamasız hasar F1'ini 0,24'ten 0,33'e
   çıkarmış. Bizim için karşılığı Türkiye verisiyle eğitmenin değeri; Ç-19'daki İslahiye kıyasıyla aynı mesaj.
3. **Birim ve ölçüt (bizim sınamamızda):**
   - Noto etiketi bina düzeyinde → ana ölçüt bina düzeyi P/R/F1. Eşik τ **Türkiye doğrulamasında** sabitlenmeli, Noto'da
     ayarlanmamalı. Piksel IoU ek ölçüt.
   - Hem hasar sınıfının F1'i hem iki sınıf ortalaması verilmeli; özetlerde çoğu zaman ortalama öne çıkıyor.
4. **Sınıf tanımı:** Noto veri setinde pozitif yalnız "destroyed". Kısmi hasar "survived" içinde. Bizim "hasar" sınıfımız daha
   geniş → yanlış pozitif beklenir; yorumda yazılmalı (Ç-05).
5. **Zaman ve kayma:** Noto etiketleri 2–17 Ocak görüntülerinden, sahnemiz 2 Ocak'tan. Sonuçlar `conf` değeri yüksek alt kümede
   ayrıca raporlanmalı.
6. **İsteğe bağlı deney:** Noto'nun etiketsiz görüntüsüyle sözde etiketli uyarlama (onların yöntemi: yalnız son blok + baş ince
   ayarı, eşikli sözde etiket). Bayrak arkasında; uyarlamasız ↔ uyarlamalı farkını kendi kurulumumuzda gösterir.
7. **Ek referans:** BRIGHT'ın Noto alt kümesi (GSI optik + Umbra SAR, 0,5 m, 79 karo, 8 153 bina; 7 modelde olay düzeyi mIoU
   36,49–45,78). Çok kipli olduğu için doğrudan kıyaslanamaz.

**Atıf önerisi.** "Aynı olayda Wiguna vd. (2024), xBD ve 2011 Tohoku verileriyle eğitilmiş bir Swin-T sınıflandırıcıyı hedef
bölgenin etiketsiz hava fotoğraflarından çıkarılan yüksek güvenli sözde etiketlerle yinelemeli olarak ince ayarlamış ve hasarlı
bina sınıfında F1 değerini 0,33'ten 0,55'e çıkarmıştır. Bizim Noto sonucumuz ise uydu görüntüsünde ve hedef bölgeye hiçbir
uyarlama yapılmadan elde edilmiştir; görüntü ve etiketler farklı olduğundan iki sonuç doğrudan karşılaştırılamaz."

### Ç-19 · Wiguna vd. 2024a — acil durum koşullarında derin öğrenme modellerinin dış sınaması (IEEE JSTARS) — **İslahiye dahil**

**Künye.** Wiguna, S., Adriano, B., Mas, E., Koshimura, S. "Evaluation of Deep Learning Models for Building Damage Mapping in
Emergency Response Settings." *IEEE JSTARS* 17:5651–5667, 2024. doi:10.1109/JSTARS.2024.3367853 (altın açık erişim, CC BY-NC-ND).
Tohoku Üniv. / IRIDeS.
**Erişim:** tam metin IEEE Xplore'da tarayıcıyla okundu (19 Eylül); Tablo III, IV, VI ve VII görüntüden okundu. **Aşağıdaki
bütün sayılar teyitli.**

**Ne yapmışlar.**
- **Eğitim:** yalnız xBD üzerinde. Modeller: ResNet34, ResNeXt50, Swin-T, EnsSwin (Swin topluluğu + TTA). Tek ve çift zamanlı.
  Bina konumu biliniyor; 4 hasar sınıfı.
- **Dış sınamalar (hedefte etiket yok, ince ayar yok):**
  - **2011 Tohoku tsunamisi:** yer gerçeği MLIT saha denetimi, iki farklı sınıf eşlemesiyle.
  - **2023 Türkiye depremi, İslahiye:**
    - Görüntü: Maxar Open Data, WorldView-3; öncesi 27 Aralık 2022, sonrası **7 Şubat 2023**; ~0,3 m. QQB'nin sahnesiyle aynı
      gün ve aynı uydu (büyük olasılıkla aynı sahne).
    - Yer gerçeği: OSM bina izleri uydu görüntüsüne hizalanmış; öncesi görüntüde olmayanlar çıkarılıp eksikler eklenmiş.
      **6 145 bina** uydu görüntüsünün görsel yorumuyla xBD'nin 4 sınıfına ayrılmış. Bu etiketler yayımlanmamış.
    - Ek sınama: OpenAerialMap hava fotoğrafı (15 Şubat 2023, ~8 cm).
- **Dış sınamada kullanılan model:** EnsSwin — Swin-T/S/B topluluğu, döndürmeli test zamanı artırması, CE + focal kaybı. Bina
  izinden kesilen yamayı sınıflandırıyor. xView-2 birincisi ise piksel bölütlüyor; bina sınıfı iz içindeki piksellerin çoğunluğundan.

**Sonuçlar** (F1 × 100; hasarsız / az / ağır / yıkık):

| Sınama | Model | F1 (sınıf sırasıyla) | Ortalama |
|---|---|---|---|
| xBD (alan içi) | EnsSwin, çift zaman | 92,8 / 61,4 / 67,5 / **89,5** | 77,8 |
| xBD (alan içi) | EnsSwin, tek zaman | 92,5 / 61,4 / 66,1 / **88,6** | 77,1 |
| **İslahiye, uydu** | EnsSwin, çift zaman | 93,0 / 1,6 / 9,7 / **40,9** | 36,3 |
| **İslahiye, uydu** | EnsSwin, tek zaman | 91,5 / 0,0 / 5,4 / **32,9** | 32,5 |
| **İslahiye, uydu** | xView-2 birincisi, bina düzeyi | 77,1 / 0,0 / 7,6 / **43,6** | 32,1 |
| **İslahiye, uydu** | xView-2 birincisi, piksel düzeyi | 63,7 / 0,0 / 6,0 / **37,9** | 26,9 |

- **Alan dışında hasar sınıfları çöküyor:**
  - Yıkık sınıfında F1 89 → 33–44.
  - Ara sınıflarda 61–67 → 2–10.
  - Hasarsız sınıfı ~93'te kalıyor.
- **Tek zamanın bedeli dışarıda büyüyor:** yıkık F1 tek zamanda 32,9, çift zamanda 40,9 (+8). Alan içinde fark yalnız 0,6–0,9.
- **Etiket eşleme tercihi tek başına ~20 puan oynatıyor:** Tohoku ortalaması 27,3'e karşı 47,3.
- **Kayıp:** CE + focal en iyi. Swin, CNN omurgalardan iyi; özellikle ara sınıflarda.

**Bize dersler.**
1. **Yerel eğitim verisinin değeri — makale için güçlü karşılaştırma:**
   - Küresel veriyle (xBD) eğitilmiş en iyi modeller İslahiye'de yıkık binada F1 0,33–0,44'te kalıyor.
   - Bizim modelimiz Türkiye verisiyle eğitiliyor ve İslahiye'de **mekânsal olarak ayrılmış** bloklarda sınanıyor (QQB dış sınaması).
   - Aynı ölçütle raporlanırsa — bina düzeyi, yalnız yıkık, QQB referansı — **"yerel veri + SegFormer" ile "küresel veri"** doğrudan
     kıyaslanabilir. Bu, makalenin katkısını somutlaştırır.
   - Dikkat: bizimki olay dışı değil, blok dışı sınama; bu fark yazılmalı.
   - **Görüntü aynı, yer gerçeği farklı:** onların referansı 6 145 binanın görsel yorumu, bizimki QQB/OSM yıkık listesi. Kıyas
     "aynı görüntü + aynı ölçüt, farklı referans" diye yazılmalı. Örneklemimiz küçükse güven aralığı (bootstrap) şart.
   - **En iyisi:** yazarlardan (Wiguna, Adriano — Noto etiket setini açık paylaşan ekip) İslahiye referans etiketlerini istemek.
     O zaman modelimiz onların etiketleriyle birebir puanlanır (Furkan, isteğe bağlı; §9).
   - **Piksel ↔ bina farkı:** aynı model piksel düzeyinde belirgin düşük çıkıyor (xView-2 yıkık 37,9 ↔ 43,6). Piksel IoU'muzu
     onların bina düzeyi sayılarıyla kıyaslamak yanlış olur; bina düzeyi ölçütümüz (§7) bu yüzden şart.
2. **Üç basamaklı dış sınama**, her basamakta alan içi skor ve fark (Δ) ile. Basamaklar birleştirilmemeli:
   - aynı olay, yeni ilçe (HOTOSM)
   - yeni olay, farklı ülke (Noto)
   - yeni olay, farklı yapı stoku ve sensör (Haiti)
3. **Etiket eşleme tablosu + duyarlılık:** eşleme tercihi 20 puan oynatabiliyor. Çok dereceli etiketlerde iki eşik raporlanmalı:
   yalnız yıkık, ve ağır + yıkık.
4. **Donmuş model, sıfır hedef etiketi:** eşik ve son işlem 2 km blok doğrulamasında sabitlenir. Hedefte ayarlanan her şey ayrı
   bir "kâhin" satırında raporlanır.
5. **Ayrıntılı rapor:** her dış sette hasar kesinliği ve duyarlılığı, normalize karışıklık matrisi ve hasarsız IoU ayrı verilmeli.
   Global IoU tek başına yetmez.
6. **Tek zaman sınırlılığı:** dış alanda çift zamanın yıkık F1'e +8 puan kattığı bulgusu, 5.3 Sınırlılıklar'da bu çalışmaya atıfla
   anılmalı. KATE-CD çiftleriyle kendi tek ↔ çift kıyasımız isteğe bağlı (Ç-16).
7. **Açık kodlu dış taban çizgisi:** xView-2 birincisi, öncesi görüntü olan alanlarda aynı ölçütle koşulabilir.

**Atıf önerisi.** "xBD'de eğitilmiş modeller etiketsiz yeni olaylara (2011 Tohoku, 2023 İslahiye) doğrudan uygulandığında hasarsız
ve yıkık sınıflar görece korunurken ara hasar sınıflarının çöktüğü, İslahiye'de yıkık sınıfının F1 değerinin 0,33–0,44'e düştüğü
ve yer gerçeği eşleme tercihinin ölçülen başarımı belirgin biçimde değiştirdiği gösterilmiştir (Wiguna vd., 2024)."

---

## 4. Yöntemimize (SegFormer) benzer ya da aynı çalışmalar — ön tarama

SegFormer'ı bina hasarında kullanan çalışma sayısı az; bulunanlar aşağıda. "Durum" sütunu tam metnin incelenip
incelenmediğini gösterir.

| Çalışma | Ne | Neden önemli | Durum |
|---|---|---|---|
| **RAPID-A** — Deep Ensemble Learning for Rapid Large-Scale Postearthquake Damage Assessment, ASCE OPEN 3(1) (doi:10.1061/AOMJAH.AOENG-0043) | 6 modellik topluluk; "SegFormer" kolu aslında **MiT-B5 kodlayıcılı U-Net**; Antakya ~0,23 m; piksel ölçütü yok | Aynı olay; MiT kodlayıcı | ✅ Ç-10 |
| **TE23D** (IEEE JSTARS 2025) | Türkiye 2023, yalnız sonrası, **SegFormer-B5 en iyi** (7 model); IoU_hasar %56,98 (%74,45 = mIoU) | En yakın emsal; SegFormer'ın üstünlüğünü destekliyor | ✅ Ç-03 |
| **DA-SegFormer** (IGARSS 2026, arXiv:2605.09864) | **SegFormer-B4** (bizimle aynı) + OHEM/Dice + sınıf farkında örnekleme + kayan pencere; İHA | Örnekleyici, focal α ve çıkarım ölçeği dersleri | ✅ Ç-11 |
| **SegDetector** (Remote Sensing 14(23):6136, 2022) | SegFormer tabanlı; küçük ve üst üste binen hasarlı binalar; xBD | Küçük bina sorunumuz (50–200 m²'de 7/22) | özet |
| **Singh, Hoskere, Milillo** (arXiv:2412.04664; Earthquake Spectra 2025) | Transformer; optik + SAR + yer hareketi + zemin; Türkiye 2023; çok sınıflı bina düzeyi | Ek kanal fikri (DPM, yer hareketi) | özet |
| **DamageCAT** (arXiv:2504.11637) | Transformer; tipolojiye dayalı hasar kategorisi | Sınıf tanımı | özet |
| **Deep learning based building change detection … Hatay-Antakya** (Int. J. Remote Sensing 46(20), 2025) | Öncesi/sonrası + bina ayak izi | Ayak izi önbilgisi | özet |
| **Multi-task building damage assessment via deep semantic segmentation and pre-disaster polygons** (J. Supercomputing, 2026) | Çok görevli; öncesi poligonlar | Poligon önbilgisi | özet |
| **Feature-based framework for evaluating deep learning models …** (Natural Hazards, 2026) | Kahramanmaraş İHA kümesi + xBD üzerinde modellerin değerlendirilmesi | Değerlendirme çerçevesi | özet |
| **BPKG-SegFormer** (bina çıkarımı) | Bina önbilgisiyle yönlendirilen SegFormer; daha düzgün kenarlar | Kenar/biçim iyileştirmesi | özet |

### 4.1 Kaynakların içinde anılan veri setleri ve çalışmalar (birleştirilmiş)

Altı makalenin (Ç-01…Ç-06) veri tabloları, ilgili çalışma bölümleri ve kaynakçaları tarandı. Tekrarlar ayıklandı;
"Anıldığı yer" sütunu kaydın hangi incelemede geçtiğini gösterir. Başka makalelerden aktarılan sayılar birincil kaynaktan
doğrulanmadan makaleye yazılmaz.

#### A. Anılan veri setleri

| Veri seti | Ne | Anıldığı yer | Bize uygunluk | Karar |
|---|---|---|---|---|
| **TE23D** | SkySat ~0,5 m, Türkiye 2023, 1 183 karo, enkaz alanı | Ç-01, Ç-03 | Yüksek (koşullu) | Katalogda: QM-VS08 |
| **TUE-CD** | WorldView-2 öncesi/sonrası, 1 656 karo, 2 338 yıkık bina. **Dergi sürümü:** Liu vd., IEEE TGRS 62, 2024, doi:10.1109/TGRS.2024.3438290 | Ç-01, Ç-03, Ç-07 | Orta–yüksek (konumlandırma gerekli) | Katalogda: QM-VS05 |
| **xBD** | 19 afet; deprem kısmı küçük (Meksika 2017 ≈ 192 + 192 görüntü, 260 hasarlı bina) | Ç-01, Ç-03 | Orta (ön eğitim) | Katalogda: QM-VS10 |
| **HaitiBRD** | GeoEye-1 0,5 m, bina + yol hasarı | Ç-03, Ç-08 | Dış sınama + yol yer gerçeği | Katalogda: QM-VS06 |
| **HOTOSM yıkık binalar** | OSM, 3 434 poligon | Ç-02, Ç-09 | Bina düzeyi dış sınama | Katalogda: QM-VS07 |
| **HOTOSM bina izleri** (`hotosm_tur_buildings`) | OSM bina poligonları, hasarsız | Ç-02 | Yardımcı: bina düzeyi puan, yok say maskesi | **Yardımcı veri olarak eklendi** |
| **Maxar Open Data Türkiye 2023** | WV-3 / GE-1 sonrası, etiketsiz | Ç-02, Ç-04 | Görüntü kaynağı (QQB, HOTOSM için) | Zaten kullanılıyor |
| **Microsoft AI for Good — Türkiye bina hasar değerlendirmesi (2023, AFAD ortaklığı, 4 şehir)** | Uydu + yapay zekâ ile bina hasar ürünü | Ç-01 (#20), Ç-10 | **Yeni aday:** kıyas ya da etiket kaynağı; erişim ve lisans araştırılacak | **QM-VS12 (araştırılacak)** |
| **ÇŞB hasar tespit kayıtları** (hasartespit.csb.gov.tr) | Adres + hasar durumu (hasarsız / az / orta / ağır / acil yıkılacak / yıkık) | Ç-10 | **Yeni aday:** bina düzeyi yer gerçeği. RAPID-A adresleri coğrafi kodlayıp ayak izlerine eşlemiş. Lisans ve toplu erişim belirsiz | **QM-VS13 (araştırılacak)** |
| International Disasters Charter / KARI Antakya hasar haritası | Nokta düzeyi "olası hasar"; Pléiades 7.2.2023 | Ç-04 | Nitel karşılaştırma | Yalnız atıf |
| **L'Aquila 2009 hasar verisi** (Tertulliani vd. 2012, BSSA 102) | Yer taramalı hasar dağılımı; biçimi bilinmiyor | Ç-05 | Türkiye dışı ikinci dış sınama adayı olabilir | **QM-VS14 (araştırılacak)** |
| GSI sonrası ortofotolar (Noto) | Hava fotoğrafı; Noto etiketlerinin kaynağı | Ç-05 | QM-VS11 için Maxar'a alternatif görüntü | QM-VS11 notuna eklendi |
| **USGS ShakeMap** | Sarsıntı şiddeti (MMI) haritası | Ç-05 | **Yeni analiz fikri:** sınama sonuçlarını sarsıntı şiddetine göre katmanla (Türkiye 2023 için de var) | §7'ye eklendi |
| Copernicus EMS (EMSR648) | Hasar dereceleri ölçeği | Ç-05 | Sınıf tanımı eşlemesi | Tanım tablosunda kullanılacak |
| NASA ARIA DPM | SAR tabanlı hasar vekil haritası, 30 m | Ç-01, Ç-10 | Yalnız ablasyon/tartışma | Hayır (ana hatta) |
| OpenEarthMap | Küresel arazi örtüsü (bina sınıfı var) | Ç-05 | Ön eğitim adayı (düşük öncelik) | Not edildi |
| RescueNet, EarthquakeNet, AIDER | İHA | Ç-01, Ç-03, Ç-11 | Görevimize uymuyor | ❌ |
| Taşçı vd. 2023 (Türkiye 2023 İHA, 1 237 yıkık + 1 498 sağlam) | Görüntü sınıflandırma; iki sınıf farklı kaynaktan | Ç-03 | Kaynak yanlılığı riski | ❌ (yalnız atıf) |
| Incidents, Incidents-1M, MEDIC, EID, DSS, DAD, CrisisBench, Datacenterhub, PEER Hub | Sosyal medya / yer seviyesi | Ç-01, Ç-03, Ç-06 | Uydu görevine uymuyor (yer seviyesi modülü için ilgili olabilir) | ❌ |
| Capella SAR | QQB'nin SAR görüntüsü | Ç-02 | Görev optik | ❌ |

**Not:** hiçbir makale xBD dışında açık bir **uydu** bina hasarı piksel kümesi anmıyor. Türkiye 2023 için anılan uydu
kümeleri yalnız TE23D ve TUE-CD. Veri genişletmede asıl yollar etiket kümelerini (HOTOSM, Noto, ÇŞB, Microsoft) Maxar
görüntüsüyle eşlemek.

#### B. Anılan çalışmalar — ikinci tur okuma listesi

**Öncelik 1 — yöntemimize ya da olayımıza en yakın (tam oku).**

| # | Künye | Neden | Anıldığı yer |
|---|---|---|---|
| O-1 | ✅ Ç-17 · Xie, Y. vd. "Damaged building detection from post-earthquake remote sensing imagery considering heterogeneity characteristics." *IEEE TGRS* 60:4708417, 2022, doi:10.1109/TGRS.2022.3200872 | Tek zamanlı bölütleme; **U-Net tabanlı CNN + dikkat (TE23D'nin "ViT" nitelemesi yanlış)**; IoU %62,43 (teyitsiz) | Ç-03 |
| O-2 | Liu, Y. vd. "Building change detection in earthquake: a multiscale interaction network with offset calibration and a dataset." *IEEE TGRS* 62, 2024, doi:10.1109/TGRS.2024.3438290 — **✅ Ç-12** | TUE-CD'nin dergi sürümü: etiket tanımı, konum, lisans | Ç-01, Ç-03 |
| O-3 | Robinson, C. vd. "Turkey Building Damage Assessment." Microsoft Research **MSR-TR-2023-7**, 2023 (EIDSeg'deki künye hatalı) — **✅ Ç-13** | Türkiye 2023 uydu hasar ürünü; ÇŞB'ye göre F1 0,24 (Ainscoe vd. 2025) | Ç-01, Ç-10 |
| O-9 | ✅ Ç-13 · Ainscoe, E. A. vd. "Earthquake damage mapped more comprehensively and accurately by radar satellites than optical imagery." *Communications Earth & Environment* 6:631, 2025, doi:10.1038/s43247-025-02623-4 (tam metin okundu) | **ÇŞB saha verisine göre optik/radar/elle yorum doğrulaması**; uydudan görünür hasarın sınırı | Ç-13 (yeni) |
| O-10 | Ekkazan, C. 2024, YTÜ yüksek lisans tezi (TE23D yazarı): "Derin öğrenme tabanlı bölütleme yöntemleriyle deprem sonrası uydu görüntülerinden hasarlı bölgelerin tespiti: 6 Şubat 2023 Türkiye depremleri örneği" (avesis.yildiz.edu.tr) | SegFormer dahil modeller, Türkiye 2023 uydu — **bize çok yakın** | Ç-14 (yeni) |
| O-4 | ✅ Ç-18 · Wiguna, S. vd. "Building Damage Mapping of the 2024 Noto Peninsula Earthquake … Semi-Supervised Learning and VHR Optical Imagery." *IEEE GRSL* 21, 2024 (doi:10.1109/LGRS.2024.3407725) | Noto'da sözde etiketli uyarlama; sınama hava fotoğrafında → sayısal kıyas tabanı değil | Ç-05 |
| O-5 | ✅ Ç-19 · Wiguna, S. vd. "Evaluation of Deep Learning Models for Building Damage Mapping in Emergency Response Settings." *IEEE JSTARS*, 2024 (doi:10.1109/JSTARS.2024.3367853) | Hazır modelleri alan dışı veride sınama çerçevesi | Ç-05 |
| O-6 | ✅ Ç-14 · Song, D. vd. "Integration of super-pixel segmentation and deep-learning methods for evaluating earthquake-damaged buildings using single-phase remote sensing imagery." *IJRS* 41(3):1040–1066, 2020 | Tek fazlı görüntüyle deprem hasarı | Ç-03 |
| O-7 | ✅ Ç-15 · Duarte, D. vd. "Multi-resolution feature fusion for image classification of building damages with CNNs." *Remote Sens.* 10:1636, 2018 · Duarte vd. *ISPRS Ann.* IV-2:89–96, 2018 (hava + uydu örnekleri) | **Karışık çözünürlük sorunumuz** (0,375 / 0,5 / 0,75 m) | Ç-03, Ç-04 |
| O-8 | ✅ Ç-16 · Valentijn, T. vd. "Multi-hazard and spatial transferability of a CNN for automated building damage assessment." *Remote Sens.* 12:2839, 2020 | Bölgeler arası aktarılabilirlik (Tablo 15, dış sınamalar) | Ç-05 |

**Öncelik 2 — yöntem fikirleri (kısa oku).**
- **Model ve veri:**
  - Deng & Wang 2022 (*Sci. Rep.* 12:15862, iyileştirilmiş U-Net)
  - Miura vd. 2020 (*Remote Sens.* 12:1924; yıkık / ayakta / mavi branda)
  - Moradi & Shah-Hosseini 2020 (*Environ. Sci. Proc.* 5:16; VHR + U-Net)
  - Bai vd. 2025 (*Constr. Build. Mater.* 491:142718; "Damage-Intact Paste" artırması)
- **Belirsizlik:** Sajedi & Liang 2021 (*CACAIE* 36:126–142; MC dropout)
- **Dış test tasarımı:** Liu vd. 2022 (*Eng. Struct.* 253:113765)
- **Derlemeler ve kılavuzlar:**
  - Al Shafian & Hu 2024 (*Buildings* 14:2344; uydu veri setleri derlemesi)
  - Matin & Pradhan 2022 (*Geocarto Int.*; sınırlılıklar derlemesi)
  - Contreras vd. 2021 (*Earth* 2(4); keşif verisi kaynakları)
  - CEMS hasar değerlendirme kılavuzu (sınıf tanımı)
- **Yer seviyesi modülü için:** Yilmaz vd. 2024 (*J. Earthq. Eng.*; Kahramanmaraş sahasında mobil uygulama testi)

**Yalnız atıf** (makalemizde kullanılacak temel kaynaklar):
- Dong & Shan 2013 (*ISPRS J.* 84) · Gupta vd. 2019 (xBD) · Xie vd. 2021 (SegFormer, NeurIPS) · Cheng vd. 2022 (Mask2Former)
  · Kerssies vd. 2025 (EoMT) · Chen vd. 2018 (DeepLabV3+) · Ronneberger 2015 (U-Net) · Lin 2017 (FPN) · He 2016 (ResNet)
  · Everingham 2010 (PASCAL VOC, IoU)
- Grünthal vd. 1998 (**EMS-98 — "European Macroseismic Scale"**; Noto kaynakçasında "Microseismic" diye yanlış yazılmış)
- Huynh vd. 2014 (uzaktan etiket uç sınıflara kayar) · Ghosh vd. 2011 (GEO-CAN) · Anniballe vd. 2018 (yer taraması ↔ VHR)
- Taşçı vd. 2023 (Türkiye 2023 İHA) · Zhan vd. 2022 (Mask R-CNN Kumamoto) · Li vd. 2023 (DDFormer, SAR) · Zheng vd. 2021
  (ChangeOS, çift zamanlı karşıt örnek) · Rahnemoonfar vd. 2023 (RescueNet)
- AFAD deprem kataloğu ve ön değerlendirme raporu (olay künyesi)
- Metin modülü için Mangalathu & Burton 2019
- Türkiye 2023 görüntüleriyle dış test yapan yer seviyesi çalışmaları: Bhatta & Dang 2024, Yilmaz vd. 2024

**Dikkat:** kaynakçalarda tutarsız atıflar bulundu.
- Hacıefendioğlu vd.'nin [20] ve [29] atıfları kaynakçayla uyuşmuyor.
- EIDSeg'de Mask2Former metinde Swin-B, tabloda Swin-S geçiyor.

Bu kaynaklara atıf yapmadan önce birincil metin açılmalı.

### 4.2 Makalemizi emsallerle kıyaslama: örnek alınacaklar ve yükseltme planı

Kısaltmalar: ✅ var · 🟡 kısmen · — yok.
Çalışmalar: EID = EIDSeg (Ç-01) · QQB = QuickQuakeBuildings (Ç-02) · TE = TE23D (Ç-03) · HAC = Hacıefendioğlu vd. (Ç-04) ·
NOTO (Ç-05) · RAP = RAPID-A (Ç-10) · DAS = DA-SegFormer (Ç-11).

| # | İyi uygulama | EID | QQB | TE | HAC | NOTO | RAP | DAS | Bizim makale (şu an) | Bizi yukarı taşıyacak adım (makalede nerede) |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **Ölçütün formülü ve toplama düzeyi açık** | — | ✅ | 🟡 formül var, toplama yok | 🟡 formülde hata | ✅ | — | 🟡 | 🟡 IoU_hasar var; mIoU ve toplama düzeyi yazılı değil | 3.10'a formül, "bütün sınama pikselleri üzerinden" ifadesi, mIoU / IoU_arka / F1 birlikte |
| 2 | **Sızıntısız (mekânsal) bölme** | — | — rastgele kat | — rastgele karo | — belirsiz | model yok | 🟡 şehir bazlı sınama | — | ✅ 2 km blok | Güçlü yanımız; **protokol duyarlılık tablosuyla** sayıyla göster (Ç-03) |
| 3 | **Sınamada hasarsız örnekler** | ✅ | ✅ sağlam binalar | — | — | ✅ | ✅ | ✅ | ✅ | Vurgula; RAPID-A'nın Gaziantep'teki 8 katlık fazla kestirimini gerekçe yap |
| 4 | **Dış sınama** (başka olay/şehir) | 🟡 ekte | — | — | — | öneriyor | ✅ | — | 🟡 MEDBFS (P2) | HaitiBRD + Noto + HOTOSM ilçeleri → "Genelleme" alt bölümü (4.4) |
| 5 | **Etiket kalitesi ölçümü** (uyum, altın standart, yer doğrulaması) | ✅ | 🟡 | — | — | ✅ | — | — | — | İnsan tavanı (2 kişi, 50–100 karo) + kümeler arası etiket uyumu → 3.2 veya 4.2 |
| 6 | **Sınıf tanımı bir ölçeğe bağlı** (EMS-98/CEMS) | 🟡 | — | 🟡 | — | ✅ | ✅ hükümet sınıfları | ✅ | — | Kümelerin "hasarlı" tanımı → EMS-98 eşleme tablosu (Tablo 5'in yerine gelecek künye tablosuyla) |
| 7 | **Çok model, aynı protokol, maliyetle** | ✅ | ✅ | ✅ | 🟡 girdi boyutu farklı | — | ✅ | ✅ | 🟡 eski Tablo 13 karşılaştırılamaz | 9 model + U-Net R18, GFLOPs / parametre / T4 süresi (Tablo 13, Şekil 7–8) |
| 8 | **Çoklu tohum / güven aralığı** | — | ✅ 5 kat ± ss | — | — | — | 🟡 dağılım | — | — | 3 tohum + blok bootstrap güven aralığı (KALAN_ISLER #29 kapanır) |
| 9 | **Ablasyon** | — | 🟡 | — | — | — | 🟡 kanal | — | 🟡 Tablo 21 iskelet | Kayıp ağırlığı, focal α, örnekleyici, morfoloji → Tablo 21 |
| 10 | **Topluluk ve belirsizlik** | — | — | — | — | — | ✅ | — | — | Topluluk (ek eğitim yok) + belirsizlik haritası → 4.2 / 5.4 |
| 11 | **Bina düzeyi değerlendirme** | — | ✅ | — | — | ✅ | ✅ (sayı) | — | 🟡 bileşen düzeyi | Bina izleriyle P/R/F1/AUPRC (QQB, Noto, HOTOSM) |
| 12 | **Veri seti künyesi** (il, kapsam, çözünürlük, hasar oranı) | ✅ | ✅ | ✅ | 🟡 | ✅ | 🟡 | 🟡 | — Tablo 5 boş | QM-VS01…04 künye tablosu (değerler hazır) |
| 13 | **Veri / kod / bölme paylaşımı, sürümlü** | ✅ GitHub | ✅ | ✅ Drive | — istek üzerine | ✅ Zenodo sürümlü | — 404 | — | — | Bölme listesi + blok kimlikleri + kod (KATE-* CC0 olduğu için mümkün) → "Veri Erişilebilirliği" |
| 14 | **Nitel hata analizi** (şekil) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 | Kaynak/çözünürlüğe göre örnek çıktı ızgarası (yeşil / kırmızı / mavi) |
| 15 | **Aşağı akış görevine bağlama** (yol kapanması, sevk) | — | — | — | — | — | — | — | ✅ **özgün** | Kapanma çıkarımını HaitiBRD yol etiketleriyle **ölç** — yazında ilk nicel doğrulama olur |

**Sonuç (değerlendirme).**
- **Güçlü yanlarımız:** 2 (sızıntısız bölme), 3 (hasarsız örnekler) ve 15 (yol kapanması). Hiçbir emsal üçünü birlikte
  yapmıyor.
- **Eksiklerimiz:** 4, 5, 6, 8, 10, 11, 12, 13. Hepsi bu belgedeki işlerle kapanıyor ve çoğu eğitim gerektirmiyor
  (5, 6, 12, 13 Furkan'da).
- **Kapanınca makalenin iddiası:** "Türkiye 2023 için SegFormer tabanlı hasar bölütlemesini sızıntısız, negatifli, çok
  modelli, çoklu tohumlu ve dış sınamalı olarak değerlendiren ve sonucu yol kapanmasına kadar taşıyıp nicel olarak doğrulayan
  ilk çalışma."

---

## 5. Veri seti kataloğu (ad · bağlantı · açıklama)

**Karar (Furkan, 19 Eylül):** verileri biz indirmiyoruz. Her küme için ad, bağlantı, açıklama ve hazırlık adımlarını
veriyoruz; **indirmeyi ve hazırlığı Utku yapar**. Aynı liste, indirme bağlantılarıyla, `UTKU_ICIN_LISTE.md` dosyasının "Veri seti kataloğu" bölümünde de var.

**Adlandırma kuralı:** `QM-VS<numara>-<KISAAD>`. Hazırlanan her kümenin önerilen klasör düzeni:
- `goruntu/`
- `maske/` — 0 = arka plan, 1 = hasar, 255 = yok say
- `karolar.csv` — ad, kaynak, çözünürlük, il/ilçe, UTM merkez, blok, bölme, etiket anlamı
- `BENIOKU.md` — kaynak, lisans, hazırlık adımları, bilinen sorunlar

**Sızıntı kuralı (bütün yeni kümeler için):**
- Konumu bilinmeyen küme konumlandırılmadan eğitime girmez.
- Doğrulama/sınama bloklarına düşen ya da onlarla örtüşen karolar eğitime girmez (QQB'deki kural).
- Aynı binanın farklı görüntüleri aynı bölmede kalır.

### 5.0 Özet ve öncelik

| Öncelik | Kimlik | Küme | Rol | Boyut | Lisans |
|---|---|---|---|---|---|
| 1 | QM-VS01-KATEPD | KATE-PD | Ana eğitim / doğrulama / sınama | ~360 MB (parquet) | CC0 1.0 |
| 1 | QM-VS02-KATECD | KATE-CD (yalnız öncesi) | Negatif örnek | ~430 MB (parquet) | CC0 1.0 |
| 1 | QM-VS04-QQB | QuickQuakeBuildings (kaynaktan kurulum) | 339 eğitim + 74 dış sınama; gerçek sonrası negatifler | Maxar 4 karo ~314 MB + OSM | Maxar CC BY-NC 4.0 · OSM ODbL |
| 2 | QM-VS03-MEDBFS | MEDBFS Türkiye | P2'de 0,75 m dış sınama | `Turkey.zip` 3,33 GB | CC BY-NC 4.0 |
| 2 | QM-VS06-HAITIBRD | HaitiBRD (Haiti 2010) | Olaylar arası dış sınama + **yol hasarı yer gerçeği** | ~110 MB+ | Etiket ODC-By · görüntü CC BY-NC 4.0 |
| 3 | QM-VS11-NOTO | Noto 2024 + Maxar | Türkiye dışı dış sınama (piksel + bina) | 47,9 MB + ~391 MB | Etiket CC BY 4.0 · görüntü CC BY-NC 4.0 |
| 3 | QM-VS08-TE23D | TE23D | Kendi protokolünde yeniden üretim (56,98 ile kıyas) | 2,3 GB | Belirsiz (CC BY-NC-ND 4.0 + "tüm hakları saklıdır") |
| 4 | QM-VS05-TUECD | TUE-CD | Ek pozitif (konumlandırmadan sonra) | Bilinmiyor (Drive'da boyut görünmüyor) | Belirtilmemiş |
| 4 | QM-VS07-HOTOSM | HOTOSM yıkık binalar + Maxar | Yeni ilçelerde bina düzeyi dış sınama | Poligonlar <1 MB + Maxar ~0,5–0,8 GB | ODbL · Maxar CC BY-NC 4.0 |
| 5 | QM-VS09-BRIGHT | BRIGHT | Sonra: etiketler Maxar sonrasıyla eşlenirse | — | CC BY 4.0 (SAR) / etiket optiğe bağlı |
| 5 | QM-VS10-XBD | xBD / xView2 | Sonra: ön eğitim adayı | Büyük (kayıtlı) | Ticari olmayan |
| 🔎 | QM-VS12-MSTR | Microsoft Türkiye bina hasar ürünü (MSR-TR-2023-7; 4 ilçe GeoPackage) | **Yalnız kıyas** (İslahiye'de bina düzeyi taban çizgisi); etiket olarak önerilmez (Ç-13) | Küçük | **Lisans yok** (All rights reserved) — atıfla kıyas, yeniden dağıtım yok |
| 🔎 | QM-VS13-CSB | ÇŞB hasar tespit kayıtları (Ainscoe vd. 2025: 911 181 nokta, 17 Şubat 2023) | **En güçlü bağımsız yer gerçeği** — Bakanlıktan talep edilerek alınabiliyor (Ç-13) | — | Yeniden dağıtılamaz |
| 🔎 | QM-VS14-LAQUILA | L'Aquila 2009 hasar verisi (Tertulliani vd. 2012) | Türkiye dışı ikinci dış sınama adayı — **biçim araştırılacak** | — | Bilinmiyor |
| yardımcı | — | HOTOSM bina izleri (`hotosm_tur_buildings`) · USGS ShakeMap (2023 depremleri) · OSM yol ağı | Bina düzeyi puan ve yok say maskesi · sonuçları sarsıntı şiddetine göre katmanlama · kapanma | Küçük | ODbL · kamu malı (USGS) · ODbL |
| ❌ | — | EIDSeg (Ç-01), RescueNet (Ç-11) | Kullanılmayacak: yer seviyesi / İHA, görevimize uymuyor | — | — |

### 5.1 Küme kartları

**QM-VS01-KATEPD — KATE-PD.**
- **Bağlantılar:**
  - huggingface.co/datasets/CSCRS/kate-pd (train/validation/test parquet)
  - Konum ızgaraları: CodeOcean kapsülü doi:10.24433/CO.8064763.v1, `data/preprocessing/grid_maxar.geojson`,
    `grid_pleidas.geojson`, `katepd_polygons.geojson`
- **İçerik:** yalnız deprem sonrası, 832 karo 512², Maxar (193) + Pléiades (639), 7 il, hasarlı bina maskesi; resmî bölme
  675/78/79 (karo düzeyinde rastgele).
- **Hazırlık:** ortak mekânsal bölme `bolme_listesi.csv`'de hazır (önceki devir paketi). Konum ızgaraları paketteki
  `kate-pd/preprocessing/`'te.
- **Dikkat:** KATE-CD'nin sonrası görüntüleri bunların birebir kopyası.

**QM-VS02-KATECD — KATE-CD (yalnız öncesi görüntüleri).**
- **Bağlantılar:** huggingface.co/datasets/CSCRS/kate-cd · CodeOcean doi:10.24433/CO.3747729.v1
- **İçerik:** 486 öncesi/sonrası çifti. **Yalnız `pre_image` kullanılır** — boş maske, renkleri ikiz sonrası karoya histogram
  eşlemeyle uydurulur.
- **Dikkat:** sonrası görüntüleri KATE-PD'de aynen var; ikisi ayrı küme sayılmamalı.

**QM-VS03-MEDBFS — MEDBFS Türkiye.**
- **Bağlantılar:** zenodo.org/records/11647956 (`Turkey.zip`, 3,33 GB; yalnız `Turkey/Image/` ve `Turkey/Label/` gerekli) ·
  makale doi:10.3390/data9070088
- **İçerik:** 438 karo, ~0,75 m, öncesi + sonrası + etiket; 256 piksel adımla **yarı örtüşmeli**.
- **Rol:** P2'de eğitim dışı; doğrulama/sınama bloklarındaki 17 karo 0,75 m dış sınama.
- **Dikkat:** GeoTIFF'lerde CRS etiketi yok (EPSG:32637 + 256 adım, bizim envanterle doğrulandı).

**QM-VS04-QQB — QuickQuakeBuildings (kaynaklarından kurulum).**
- **Bağlantılar:**
  - Veri deposu github.com/ya0-sun/PostEQ-SARopt-BuildingDamage (bina listeleri; görüntü TeraBox'ta, hesap istiyor)
  - Maxar ARD görüntüleri (4 karo, ~314 MB):
    `https://maxar-opendata.s3.amazonaws.com/events/Kahramanmaras-turkey-earthquake-23/ard/37/<q>/2023-02-07/1040010082698700-visual.tif`,
    `<q>` ∈ {031133012123, 031133012132, 031133012301, 031133012310}
  - OSM: 1 Mart 2023 tarihli Overpass "attic" sorgusu
- **Hazırlık:** önceki devir paketindeki `qqb_osm.py` → `qqb_karola.py` → `qqb_bolme.py` aynen üretir. Ya da
  `qqb_paket.json` + `qqb_bolme.csv`'den Colab'da yeniden üretilir; yerel çıktıyla birebir aynı olduğu denetlendi.
- **Dikkat (A-18):** 95 hasar etiketli "sağlam" bina → 255. Dış sınamanın 23 karosu doğrulama bloğunda; 51 sınama karosu
  ayrıca raporlanmalı.

**QM-VS05-TUECD — TUE-CD.**
- **Bağlantılar:**
  - Google Drive: drive.google.com/file/d/1tQFQQXOCkb-2iaF0NhB9u_O45db04HkD (`TUE-CD.zip`, herkese açık)
  - Baidu: pan.baidu.com/s/1FSQz4Dyi-gO0PzV-bu0E9A (şifre `tue1`)
  - Kod: github.com/RSMagneto/MSI-Net
  - Makale: arXiv:2606.10329
- **İçerik:** WorldView-2 öncesi/sonrası, 1 656 karo 256², 2 338 yıkık bina; Adıyaman, K.Maraş, Hatay, Gaziantep.
- **Hazırlık:**
  1. Zip'i aç, klasör yapısını ve etiket biçimini incele.
  2. Karoları Maxar görüntüsüyle **şablon eşleştirerek konumlandır** (MEDBFS'te yaptığımız gibi).
  3. Blok/bölme ata; doğrulama/sınama bloklarındakileri eğitimden çıkar.
  4. Sonrası + maske → ikili eğitim verisi; öncesi → negatif.
- **Dikkat:** lisans belirtilmemiş (yazarlara sorulmalı). Etiket yalnız "yıkık".

**QM-VS06-HAITIBRD — HaitiBRD (2010 Haiti depremi).**
- **Bağlantılar:** designsafe-ci.org/data/browser/public/designsafe.storage.published/PRJ-4169 · doi:10.17603/ds2-fqat-4v02
- **İçerik:**
  - GeoEye-1 0,5 m öncesi/sonrası (`original/images/` 2 × 53,7 MB).
  - >9 000 bina 4 düzeyde renkli maske (No damage / Minor / Major / Destroyed).
  - **Hasarlı/hasarsız yol kesimleri .shp**.
  - `cropped/` 20 çift + etiketler; `HaitiBRD_readme.pdf` (144,5 KB).
- **Hazırlık:**
  1. 0,5 m'de 512² karola.
  2. İkiliye çevir: iki eşleme de raporlanacak — (a) Major + Destroyed → 1; (b) yalnız Destroyed → 1.
  3. Yol çizgilerini kesim düzeyinde değerlendirme için sakla (kapanma çıkarımının yer gerçeği).
- **Rol:** yalnız dış sınama.

**QM-VS07-HOTOSM — HOTOSM Türkiye yıkık binaları.**
- **Bağlantılar:**
  - data.humdata.org/dataset/hotosm_tur_destroyed_buildings (GeoJSON 165,6 KB; süzgeç
    `destroyed:building='yes' AND damage:date='2023-02-06'`)
  - Bina izleri: data.humdata.org/dataset/hotosm_tur_buildings
  - Maxar kataloğu: `maxar-opendata.s3.amazonaws.com/events/Kahramanmaras-turkey-earthquake-23/collection.json`
- **İçerik:** 3 434 yıkık bina poligonu (22 Mayıs 2023). Kırıkhan 435 · Nurdağı 656 · Adıyaman merkez 535 — bu üç ilçe eğitim
  verimizde yok.
- **Hazırlık:**
  1. Bu ilçeleri kapsayan Maxar sonrası karolarını katalogdan seç.
  2. QQB araçlarıyla karola; yıkık = 1.
  3. Diğer binalar için HOTOSM bina izleri; tamlık bilinmediği için **kesinlik değil duyarlılık** raporlanır.
- **Dikkat:** İslahiye'deki 317 kayıt QQB ile aynı kaynak; mükerrer sayma.

**QM-VS08-TE23D — TE23D.**
- **Bağlantılar:** isl.ce.yildiz.edu.tr/datasets/te23d (yalnız http) → Google Drive klasörü
  drive.google.com/drive/folders/1JquyINvheHptOFE2U33D3L380Q01LJQc (2,3 GB; train/valid/test görüntü + etiket, `READ_ME.pdf`)
- **İçerik:** 1 183 karo 256² (yalnız hasarlı), SkySat ~0,5 m, **enkaz alanı** etiketi, konum yok.
- **Rol:** **kendi protokolünde yeniden üretim:** SegFormer-B4'ü TE23D train'de eğit, test'te onların formülleriyle ölç.
  Ana eğitime katılmaz.
- **Dikkat:** lisans belirsiz → yazarlardan teyit (can.ekkazan@optdcom.net, elif@yildiz.edu.tr).

**QM-VS09-BRIGHT — BRIGHT** (sonra).
- **Bağlantılar:** zenodo.org/records/14619797 · makale essd.copernicus.org/articles/17/6217/2025/
- **İçerik:** öncesi optik + sonrası SAR, 3 sınıf piksel maskesi; Türkiye 2023 en büyük olay.
- **Rol:** etiketler Maxar sonrası görüntüsüyle eşlenirse büyük bir Türkiye kümesi olur (emek ister).

**QM-VS10-XBD — xBD / xView2** (sonra).
- **Bağlantılar:** xview2.org (kayıt gerekli) · makale arXiv:1911.09296
- **İçerik:** 19 olay, öncesi/sonrası, 4 hasar düzeyi; Türkiye yok.
- **Rol:** ön eğitim adayı.

**QM-VS11-NOTO — 2024 Noto depremi.**
- **Bağlantılar:**
  - Etiketler: zenodo.org/records/15192949 (sürüm 2.5, `Noto_Peninsula_Damage_2_5.gpkg`, 47,9 MB; kavram DOI
    10.5281/zenodo.11055711)
  - Görüntü: `maxar-opendata.s3.amazonaws.com/events/Japan-Earthquake-Jan-2024/collection.json`
- **İçerik:** 140 208 bina — 0 Survived / 1 Destroyed / 9 görüş engelli / 99 tutarsız iz.
- **Hazırlık:**
  1. 2 Ocak 2024 WorldView-2 karolarını kullan (0,50–0,57 m, bakış açısı < 30°). Beş yerleşim: Wajima, Suzu, Anamizu,
     Noto-cho, Monzen (~391 MB).
  2. Poligonları EPSG:32653'e dönüştür; `damage_val`: 1 → 1, 0 → 0, 9 → 255, 99 → çıkar.
  3. Kayma denetimi yap.
- **Rol:** Türkiye dışı dış sınama; bina düzeyi sonuç, insanın 0,91'lik F1'iyle kıyaslanır.

Kullanılmayacaklar: **EIDSeg** (github.com/HUILIHUANG413/EIDSeg; yer seviyesi fotoğraf) ve **RescueNet** (github.com/BinaLab;
İHA, kasırga, CC BY-NC-ND).

---

## 6. Model kararları

| Model | Durum | Gerekçe |
|---|---|---|
| SegFormer MiT-B4 (esas), B2, B0 | ✅ kalıyor | Esas yöntem ve ölçek serisi |
| U-Net, FPN, DeepLabV3+, UPerNet (MiT-B4) | ✅ kalıyor | Kodlayıcı sabit; yalnız kod çözücü farkı |
| DeepLabV3+ ResNet-101, UPerNet ConvNeXt-S | ✅ kalıyor | Aynı kapasite, farklı kodlayıcı |
| Mask2Former Swin-S | 🟡 düşük öncelik (isteğe bağlı) | Kanıt karışık: EIDSeg'de (yer seviyesi) SegFormer-B5'ten +1,7; DA-SegFormer'da (İHA) SegFormer-B4 ile başa baş (71,50'ye karşı 72,06); TE23D'de SegFormer, Mask R-CNN ve BEiT'ten iyi. smp dışı kütüphane gerektiriyor → mühendislik maliyeti kazanca değmiyor |
| SegFormer-B5 | 🟡 isteğe bağlı | TE23D'nin en iyi modeli; ölçek serisini (B0/B2/B4/B5) tamamlar. 82 M / 148,5 GFLOPs; beklenen kazanç ≤ 0,02 |
| UNet++ EfficientNet-b7 | 🟡 isteğe bağlı | RAPID-A'nın CNN kolu (Türkiye 2023); "aynı kapasite, başka kodlayıcı" grubuna uyar (~63 M) |
| **Topluluk (ek eğitim yok)** | ✅ analiz olarak eklensin | 9 modelin olasılık ortalaması / k-oylaması sınamada; RAPID-A'nın göstermediği piksel düzeyi kazanç (Ç-10) |
| **U-Net ResNet-18** | ✅ eklenmesi öneriliyor (hafif taban) | Türkiye 2023 emsalinin (Ç-04) en iyi yapılandırması ve eski Tablo 13'ün U-Net satırı. Bizim mekânsal protokolümüzde aynı modeli koşmak emsalle doğrudan köprü kurar. Ucuz (~14 M parametre) |
| U-Net ResNet-152 | 🟡 isteğe bağlı | KATE-PD yayınındaki taban; yalnız resmî bölmede, bizim ölçütle yeniden üretmek için |
| LinkNet, PSPNet | ❌ | Ç-04'te LinkNet U-Net'le neredeyse aynı, PSPNet en zayıf; MiT kodlayıcıyla da uyumsuzlar |
| MSI-Net | ❌ ana kıyasta yok | İki zamanlı; yalnız olası değişim tespiti yan deneyinde (Ç-07) |
| EoMT / BEiT-L / OneFormer Swin-L | ❌ | 1 000+ GFLOPs, A100-80GB gerektiriyor (Ç-01) |

---

## 6.5 IoU'yu ve doğruluğu artırma planı (bütün incelemelerden)

Sıra, beklenen etki ÷ maliyete göre. "Kanıt" sütunu önerinin nereden geldiğini gösterir. Beklenen etkiler
**değerlendirmedir**, ölçülmedikçe makaleye yazılmaz.

| # | Öneri | Kanıt | Beklenen etki | Maliyet | Kim |
|---|---|---|---|---|---|
| 1 | **Sabrı ≥ 20 tut, MEDBFS'i eğitimden çıkar (P2)** | Bizim A2: 0,410 → 0,434, kazanç kesinlikte | Ölçüldü (+0,02) | Yok | Utku |
| 2 | **Gerçek deprem sonrası negatifler** (QQB'nin sağlam binaları) | Öncesi görüntülerinde yanlış alarm 0 → kestirme şüphesi; Ç-02 | Kesinlik ↑, gerçek sahnede yanlış alarm ↓ | Düşük (veri hazır) | Utku (A3 koşusu) |
| 3 | **Etiket temizliği: 255 = yok say** (bulut, gölge, belirsiz, hasar etiketli "sağlam") | Ç-01, Ç-05; QQB'de 95 bina (A-18) | Gürültü ↓, IoU ↑ | Düşük | Furkan (veri) + Utku (`ignore_index`) |
| 4 | **"Hasarlı" tanımını kümeler arasında eşle** (EMS-98 D3 dahil mi?) | Ç-05; Ç-03'te enkaz alanı, Ç-04'te yalnız yıkık | Tanım gürültüsü ↓; dürüst raporlama | Düşük | Furkan |
| 5 | **Daha çok pozitif:** TUE-CD (2 338 yıkık bina), HOTOSM'un tam etiketli bölgeleri | Ç-07, Ç-09 | Duyarlılık ↑ (özellikle küçük binalar) | Orta (konumlandırma) | Furkan (hazırlık) |
| 6 | **Hasarlı karoları fazla örnekle** | Ç-02 (ağırlıklı örnekleme); Ç-11 bekleniyor | Duyarlılık ↑ | Düşük | Utku |
| 7 | **Kayıp ağırlığı ve eşiği doğrulamada tara** | Ç-04 (her modelde kesinlik > duyarlılık) | Kesinlik–duyarlılık dengesi; yol kapanması için duyarlılık | Orta (4 koşu) | Utku (Tablo 21) |
| 7b | **Focal α taraması** (0,25 / 0,5 / 0,75) — şu an hasar pikselleri 0,25 ile, arka plan 0,75 ile çarpılıyor | Ç-11; A-19 (kütüphane kodunda doğrulandı) | ±1–2 puan; duyarlılık ↑ olası | Düşük (3 koşu) | Utku (Tablo 21 kolu) |
| 8a | **Önce ayrıştırma deneyi:** 0,086 çözünürlükten mi etiketten mi? (Maxar/Pléiades sınamasını 0,75 m'ye indirip ölç + İslahiye'de KATE-PD ↔ MEDBFS etiket uyumu) | Ç-15 | Hangi çözümün işe yarayacağını belirler | Çok düşük (yalnız çıkarım) | Utku (çıkarım) + Furkan (etiket uyumu) |
| 8 | **Çözünürlük dayanıklılığı:** ölçek artırması [0,5; 1,2]; 0,75 m karoyu çeyreklere bölüp büyütme; çok ölçekli çıkarım; ortak gövde + 0,3–0,5 m'de ince ayarlı baş | Bizim tanı (0,486 / 0,395 / 0,086); Ç-01 (1024²); Ç-02; **Ç-15** (tek ortak ağ −0,7, ayrı baş +1,9, ayrı kodlayıcı +3,9) | 0,5–0,75 m'de IoU ↑ | Düşük–orta | Utku |
| 9 | **Radyometrik uyum:** görüntü başına normalizasyon, renk titreşimi | Ç-01, Ç-02 | Maxar–Pléiades farkı ↓ | Düşük | Utku |
| 10 | **Hasar yapıştırma artırması** (yıkık bina → sağlam karo) | Ç-06 (Damage-Intact Paste) | Pozitif oranı ↑ | Düşük | Utku |
| 11 | **Kar / aydınlatma artırması** | Bizim A2 örneği (Elbistan 0,728 → 0,0) | Kış sahnelerinde kararlılık | Düşük | Utku |
| 12 | **Maske sınıflandırmalı model:** Mask2Former Swin-S | Ç-01 (+1,7, yer seviyesi); Ç-11'de SegFormer-B4 ile başa baş | Belirsiz | Orta (smp dışı kütüphane) | Düşük öncelik |
| 13 | **Daha büyük kodlayıcı / bağlam:** SegFormer-B5, 1024² girdi | Ç-03 (B5 en iyi), Ç-01 (1024²) | Küçük (≤ 0,02) | Orta–yüksek (bellek) | Utku (isteğe bağlı) |
| 13b | **Derin denetim:** MiT-B4'ün 1/8 ve 1/16 aşamalarına yardımcı ikili başlar + ek kayıp (çıkarımda atılır) | Ç-17 (çok kollu yardımcı sınıflandırıcı) | Küçük, özellikle küçük binalarda | Düşük | Utku (isteğe bağlı) |
| 14 | **Topluluk (9 modelin olasılık ortalaması / k-oylaması) + test zamanı çevirme** | Ç-06, Ç-10 (RAPID-A bunu yalnız bina sayısında gösteriyor) | Kararlılık ↑, belirsizlik haritası; piksel düzeyinde göstermek katkı olur | Düşük (yalnız çıkarım) | Utku |
| 15 | **Son işlem:** SLIC süperpiksel oylaması (alanı m² ile sabit, < 50 m²) + morfoloji + küçük bileşen atma — **yol kesişiminden önce** | Bizim tanı (bileşen kesinliği 0,67); **Ç-14** (DeepLab v2 + SLIC + morfoloji) | Yanlış alarm ve sahte kapanma ↓ | Çok düşük (eğitim yok) | Utku (Tablo 21) |

**Kaçınılacak tuzak:** yüksek sayıyı protokol oyunuyla almak — yalnız hasarlı karolar, rastgele karo bölmesi, arka planlı
mIoU'yu hasar IoU'su diye yazmak (Ç-03). Bu tuzakları sayıyla gösterip kendimiz yapmamak makalenin güçlü yanı olur.

---

## 7. Kıyaslama ve kayıt standardı (Utku'nun kodu için şartname)

Amaç: her model aynı koşulda koşulsun, sonuçlar tek biçimde kaydedilsin, tablo ve grafik elle uğraşmadan çıksın.

**Sabitler.**
- **Bölme:** `bolme_listesi.csv` (+ QQB için `qqb_bolme.csv`). Değişmez.
- **Tohumlar:** 42, 7, 2026.
- **Eşik:** 0,5.
- **Karo:** 512².
- **Maliyet ölçümü:** GFLOPs 1 × 3 × 512 × 512 için aynı sayaçla. Gecikme aynı GPU'da, parti 1; fp16/fp32 belirtilir.

**Ölçütler (hepsi kaydedilir).**
- **Global (bütün sınama pikselleri):** IoU_hasar, kesinlik, duyarlılık, F1, özgüllük, doğruluk, IoU_arka.
- **Emsalle kıyas için:** mIoU(2 sınıf) = (IoU_hasar + IoU_arka) / 2 ve karo başına ortalama IoU. Birçok makale bunları
  bildiriyor; bizim 0,43 IoU_hasar ≈ 0,70 mIoU'ya denk geliyor.
- **Alt kümeler:** kaynak/çözünürlük (Maxar, Pléiades), il (Hatay, K.Maraş), dış sınamalar (MEDBFS, QQB, HaitiBRD, HOTOSM),
  **sarsıntı şiddeti** (USGS ShakeMap MMI bandı; Noto veri setindeki `USGS_MMI` fikri).
- **Negatifler:** hasar denen piksel oranı, alarm veren karo oranı.
- **Bina düzeyi:** bağlantılı bileşen bulunma oranı (<50 / 50–200 / >200 m²), bileşen kesinliği; QQB'de sağlam binalarda
  yanlış alarm oranı.
- **Son işlem:** morfoloji seviye 0/1/2 (Tablo 21).

**Kayıt biçimi.**
- **Klasör:** `<deney>/<model>/tohum_<n>/`.
- **`gecmis.csv`:** her dönemde bir satır — dönem, öğrenme oranı, eğitim kaybı, doğrulama IoU_hasar, doğrulama F1, süre.
- **`sonuc.json`:** ayarlar, yazılım sürümleri, maliyet ve yukarıdaki bütün ölçütler.
- **Özet:** bütün `sonuc.json`'lardan tek bir `tum_kosular.csv`. Tablo 13/15 ve şekiller bu dosyadan üretilir.

**Grafikler.**
- Eğitim eğrileri
- Model başına IoU (ort. ± ss)
- IoU – GFLOPs saçılımı
- Çözünürlüğe göre çubuklar
- Bölgeler arası matris (Tablo 15)
- Örnek çıktı ızgarası (yeşil doğru / kırmızı yanlış alarm / mavi kaçırılan)

Önceki devirdeki `02_dokuz_model_protokol.ipynb` bu standardı zaten uyguluyor; Utku isterse başvuru olarak kullanabilir.

---

## 8. Makaledeki bekleyen yerler ve çözüm yolları

Kaynak: `QuakeMind_makale/makale/QuakeMind_Makale_Taslak_2026-09-16_sekillieklendi_v3(1).docx` (Utku e8da03d; GitHub'daki
son sürümle aynı). Tarama: 86 `[ÖLÇÜLECEK]`, 6 `[TARANACAK]`, 1 `[KARŞILAŞTIRILAMAZ]`, 1 `[GELECEK ÇALIŞMA]`, 2 bilgi yer
tutucusu, 855 sarı vurgu, 41 "gelecek çalışma / henüz ölçülmedi" cümlesi. Word yorumu ve izlenen değişiklik yok.

### 8.1 Tablolar

| Yer | Açık hücre | Ne bekliyor | Önerilen çözüm | Kim |
|---|---|---|---|---|
| **Tablo 5** (etiketli yol hasarı kümesinin künyesi) | 6 | Yol hasarı kümesi yok; karar (c) "gelecek çalışma" | (a) Tabloyu bina hasarı kümelerinin künyesine çevir (QM-VS01…04; değerler hazır); ya da (b) tabloyu kaldır, yol kümesini 5.3(m)'de anlat. Öneri (a). Yol ekseni için HaitiBRD'nin yol etiketi dış sınamada kullanılabilir | Furkan + Utku (eğitim gerekmez) |
| **Tablo 13** (mimari karşılaştırması) | 5 + `[KARŞILAŞTIRILAMAZ]` | Aynı protokolle 9 model | Utku'nun 9 model koşusu; çıkarım süresi sütunu "T4 GPU" olarak; eski ResNet-18'li satırlar çıkar | Utku |
| **Tablo 14** (kapanma katmanı ↔ EMSR648, kesim düzeyi) | 36 + 6 `[TARANACAK]` (τ) | EMSR648 yeni simülasyonda kullanılmayacak | Tabloyu yeniden tasarla: kapanma çıkarımını (a) **HaitiBRD yol hasarı** etiketlerine göre (olaylar arası), (b) sınama bloklarımızda elle etiketlenecek küçük bir yol kapanması kümesine göre değerlendir; τ taraması aynı kalır. Karar Furkan'da | Karar: Furkan · ölçüm: simülasyon aşaması |
| **Tablo 15** (bölgeler arası) | 28 | Hatay / Maraş / birleşik eğitim | SegFormer MiT-B4 × 3 bölge koşusu **+ il-dışarıda-bırakma satırı + oran sütunu + yalnız KATE-PD kontrolü** (Ç-16, A-20); tablo tasarımı bu şekilde güncellenmeli | Utku (koşu) + Furkan (tablo tasarımı) |
| **Tablo 21** (bileşen çıkarma) | 5 | Pencere harmanlama, morfoloji, kayıp ağırlıkları, V₀, risk ağırlıkları | Kayıp ağırlıkları: 4 eğitim koşusu (Utku). Morfoloji: çıkarımda, her koşuda (Utku). V₀: Laplace varyansı/bulut oranıyla yerelde belirlenebilir (Furkan, Ç-01 dersi 4). Risk ağırlıkları ± 0,1: yerelde, GPU gerekmez (Furkan). Pencere harmanlama: büyük sahne çıkarımı — simülasyon aşaması | Karışık |
| **Tablo 24** (değerlendirme eksenleri) | 4 | Yol bölütlemesi, YOLO mAP, çok mimarili yol kıyası, bölgeler arası | Yol bölütlemesi → Tablo 14'ün yeni tasarımıyla. YOLO mAP → yeni Roboflow anahtarıyla Colab (eski anahtar iptal edilmeli). Çok mimarili yol kıyası → Tablo 13 ile birleştir ya da çıkar. Bölgeler arası → Tablo 15'ten | Utku (YOLO) + Furkan (karar) |

### 8.2 Metin içi yer tutucular

| Yer | Durum | Çözüm |
|---|---|---|
| Yazar bloğu `[ORCID NUMARALARI VE SORUMLU YAZAR BİLGİSİ EKLENECEK …]` | Bilgi eksik | Yazarlar ORCID'lerini verir; çift kör hakemlik varsa blok ayrı başlık sayfasına |
| Veri erişilebilirliği `[ERİŞİM POLİTİKASI KARARLAŞTIRILACAK — açık/istek üzerine/kapalı]` | Karar bekliyor | NLP kümesi için karar (Furkan) |
| Bölüm 3.3 `[GELECEK ÇALIŞMA]` (V₀, karo kalite eşiği) | Planlı | Ya gelecek çalışma olarak kalır ya da Ç-01'deki kalite süzgeciyle ölçülür (öneri: ölç, basit) |
| Bölüm 4 girişi "tablolar iskelet hâlindedir" | Sonuçlara bağlı | Eğitim sonuçlarından sonra yeniden yazılır |
| 5.3(q) YOLO mAP `[ÖLÇÜLECEK]` | Tablo 24 ile aynı | Yukarıdaki gibi |
| 855 sarı vurgu | 16 Eylül'de değişen metin, onay bekliyor (M-85) | Furkan + Utku okuyup onaylar, sonra vurgu temizlenir |

### 8.3 "Henüz yapılmadı / planlanıyor" diyen cümleler (41 yer) — gruplanmış

| Grup | Yerler | Durum / çözüm |
|---|---|---|
| **Eğitim protokolü eski** | 3.4 (kademe sayısının dörde eşitlenmesi "planlanmaktadır"), 3.10 ("model başına 10 tohum"), 4.2 (negatif yok, tek tohum, CPU süresi), 5.3(m) ("ön denemeyle doğrulanacaktır") | Hepsi 9 model protokoluyla karşılanıyor: MiT-B4 sabit kodlayıcı smp'de beş kod çözücüyle çalışıyor (yerelde ölçüldü); negatifler ve mekânsal bölme var; tohum sayısı gerçekte koşulana göre yazılacak. Metin sonuçlarla birlikte yeniden yazılır |
| **Yol hasarı kümesi yok** | 1 Giriş, 3.2.1, 4.2 (iki yer), 5.3(r) | Tablo 5 kararına bağlı. HaitiBRD yol etiketi bir dış sınama yolu açıyor |
| **EMSR648'e bağlı anlatım** | Giriş (134 hasarlı kesim), 3.2 (eşleme), 5.1 ve 6 ("AOI-04'te Destroyed yol yok"), 5.4 | Yeni simülasyonda EMSR648 yok. Bu paragraflar simülasyon aşamasında yeniden yazılacak (bilgi korunur, rolü değişir) |
| **Kapanma katmanı sentetik** | 3.8.1, 4 girişi, Öz ("henüz kazanç üretmediği") | Yeni simülasyonla (SegFormer çıktısı ∩ OSM) çözülecek; Öz son sonuca göre güncellenir |
| **Yazılım tarafı** | 4.5 (HTTP 409 / TaskLock REST'e bağlı değil; kurtarma kuralı uygulanmadı), 5.1, 6 | Uygulama aşaması (frontend/backend sırası) |
| **NLP** | 4.10 (tek koşu), 5.3(c) (sınıflandırıcının P/R/F1'i ölçülmedi), Tablo 24 (beş üst kategori ölçülmedi) | CPU'da yapılabilir: beş üst kategoride P/R/F1 ve 3 tohum. Eğitim kodu Utku'da; veri hazır |
| **Risk skoru** | 3.7, 4.11, 5.3 | Ağırlık duyarlılığı yerelde (Tablo 21 satırı); kalibrasyon ölçülebilir |
| **Gelecek çalışma (bilinçli)** | 5.3(f) çok kipli füzyon, 5.4 SAR füzyonu / belirsizlik / XAI | Kalabilir. Emsallerden destek: Singh vd. (optik + SAR + yer hareketi), RAPID-A (belirsizlik) |
| **Açıklayıcı, sorun değil** | 4.6 (iki yüzde farklı paydalı), Tablo 16 (acil çağrı kanalı ölçülmedi) | Değişiklik gerekmez |

### 8.4 Kaynak incelemelerinden çıkan makale düzeltmeleri

Paragraf numaraları (P…) güncel docx'in python-docx sırası.

| Yer | Sorun | Önerilen düzeltme | Kaynak |
|---|---|---|---|
| P38 | "Her iki küme de bina odaklıdır" — TE23D bina değil **enkaz alanı** etiketliyor | "TUE-CD yıkık binaları, TE23D ise enkaz alanlarını etiketlemektedir; ikisi de yol ağı hasarını etiketlemez" | Ç-03 |
| Tablo 1, TUE-CD satırı | "2338" görüntü sayısı gibi duruyor; 2 338 **yıkık bina etiketi**, karo sayısı 1 656 (256²). Yıl 2024 **doğru** (IEEE TGRS 62, doi:10.1109/TGRS.2024.3438290) | Görüntü sayısı 1 656 (çift, 256²) olmalı; 2 338 yıkık bina etiketi dipnota; kaynağa DOI eklenmeli | Ç-07, Ç-12 |
| Kaynakça | EMS-98'e atıf yapılacaksa doğru ad "European **Macroseismic** Scale" (Grünthal vd. 1998) | Tanım eşleme tablosuyla birlikte eklenmeli | §4.1 |
| 5.3 Sınırlılıklar + Giriş | Hedefin "uydudan **görünür** hasar" olduğu ve saha tespitine (ÇŞB) göre düşük duyarlılığın optik uydunun ortak sınırı olduğu yazılmalı (Kahramanmaraş + Nurdağı'nda ağır hasarlı ve üzeri binalar için Microsoft CNN F1 0,24, elle optik yorum 0,15–0,23; optik duyarlılık %8–17; optik etiketle eğitilen modellerin yeteneği olduğundan yüksek görünebilir) | Ainscoe vd. 2025 + Robinson vd. 2023 atıflarıyla bir paragraf | Ç-13 |
| İlgili çalışmalar | Microsoft Türkiye raporu için doğru künye: Robinson vd., MSR-TR-2023-7 (EIDSeg'deki künye hatalı) | Eklenecekse doğru künyeyle | Ç-13 |
| Tablo 1, TE23D satırı | Görev "hasar değerlendirme" | "İkili hasarlı alan bölütlemesi (yalnız sonrası)" | Ç-03 |
| TE23D'ye her atıf | %74,45 hasar IoU'su değil, 2 sınıflı mIoU | Hasar IoU'su %56,98; mIoU %74,45 — ikisi birlikte ve adıyla | Ç-03 |
| P56 | [7]'nin "ana bulgusu" yanlış aktarılmış | Ana boşluk: görsel tespit ile nicel yapısal başarım arası kopukluk | Ç-06 |
| P276 (3.10) | "[7] tek olaydan rastgele bölmeyi zayıflık sayar" — derlemede yok | "Basit bölme zayıf; farklı depremden dış test en ikna edici (45'in 18'i)" | Ç-06 |
| P452 | "operasyonel ve yapısal performans" | "nicel yapısal başarım"; operasyonel kopukluk bizim iddiamız olarak ayrı cümle | Ç-06 |
| P47 | "Mosallam" | "Mosalam" | Ç-06 |
| P46 (EIDSeg) | Sayılar doğru (uyum > 0,70; EoMT 0,808; SegFormer-B5 0,744) | mIoU'nun 5 hasar sınıfının ortalaması olduğu (arka plan hariç) eklenebilir | Ç-01 |
| İlgili çalışmalar | Hacıefendioğlu vd. 2024 (Türkiye 2023, uydu, U-Net R18 IoU 0,394) makalede yok | Eklenmeli (Ç-04'teki cümle) | Ç-04 |
| İlgili çalışmalar | RAPID-A (Türkiye 2023, EffNet-b7/UNet++ + MiT-B5/U-Net topluluğu) makalede yok | Ç-10'daki cümle; "piksel değil bina sayısı düzeyinde, yol ağına bağlanmıyor" notuyla | Ç-10 |
| İlgili çalışmalar | DA-SegFormer (SegFormer-B4, İHA) makalede yok | Ç-11'deki cümle; "+21 puan" alıntılanmamalı | Ç-11 |
| İlgili çalışmalar | Noto 2024 veri seti (ESSD) makalede yok | Ç-05'teki cümle (uzaktan insan etiketinin duyarlılığı 0,84) | Ç-05 |
| Veri bölümü | QQB'yi kaynaklarından yeniden kurduğumuz yazılmalı | Ç-02'deki cümle | Ç-02 |

---

## 9. Utku için yapılacaklar (öncelik sırasıyla)

**A. Veri (önce).**
1. `UTKU_ICIN_LISTE.md` "Veri seti kataloğu" bölümündeki öncelik 1–2 kümeleri indir ve hazırla (QM-VS01/02/04, sonra 03/06). Adlandırma ve maske
   kuralı §5'te.
2. **QQB düzeltmesi (A-18):** 95 hasar etiketli "sağlam" bina → 255. Dış sınamada 51 sınama-bloğu karosu ayrıca raporlanır.

**B. Ana kıyas (Tablo 13).**
3. **Protokolü sabitle:** P2 (MEDBFS dış sınama, sabır 20) mi, P2 + QQB mi? Önce SegFormer ile iki koşu, sonra karar.
4. **9 model + U-Net ResNet-18, tek tohum** (§6), §7'deki kayıt biçimiyle.
5. **En iyi 3 model × 3 tohum.**
6. **Topluluk analizi:** 9 modelin olasılık ortalaması / k-oylaması sınamada (ek eğitim yok).

**C. Ablasyon ve ek tablolar.**
7. **Tablo 15:** SegFormer Hatay / Maraş / birleşik **+ il-dışarıda-bırakma** (hedef hariç diğer iller → hedef) + oran sütunu + **yalnız KATE-PD karolarıyla kontrol** (Hatay ağırlıkla KATE-PD, Maraş ağırlıkla MEDBFS; A-20). İsteğe bağlı: az etiketle ince ayar eğrisi (1/2/5/10 blok).
8. **Tablo 21:**
   - kayıp ağırlığı taraması (focal payı 0 / 0,25 / 0,75 / 1)
   - **focal α taraması** (0,25 / 0,5 / 0,75; A-19)
   - morfoloji
9. **Örnekleyici deneyi (Ç-11):** hasarlı karo payı ~%50 ile / olmadan. SegFormer-B4, 3 tohum, bayrak arkasında.
10. **Protokol duyarlılık tablosu (Ç-03):**
    - (b) "yalnız hasarlı sınama karoları" puanı — yeniden eğitim yok, mevcut tahminlerle.
    - (c) rastgele bölme — Koşu B zaten var.

**D. Dış sınamalar ve yeniden üretim.**
11. **Dış sınamalar:** QM-VS06 (HaitiBRD), QM-VS11 (Noto), QM-VS07 (HOTOSM) hazırlanınca bütün modellerde yalnız çıkarım.
    Piksel IoU + bina düzeyi P/R/F1/AUPRC.
12. **TE23D yeniden üretimi (Ç-03):** SegFormer-B4'ü TE23D'nin kendi bölmesinde eğit, onların formülleriyle ölç (56,98 ile
    birebir kıyas).

**E. İsteğe bağlı.**
13. SegFormer-B5 · UNet++ EfficientNet-b7 · Mask2Former Swin-S (düşük öncelik).
14. YOLO mAP (Tablo 24) — yeni Roboflow anahtarıyla.

**Furkan'da (eğitim gerektirmeyenler).**
- **Kararlar:** Tablo 14'ün yeniden tasarımı · Tablo 5 · ORCID ve veri erişim politikası.
- **Yerel ölçümler:** V₀ ve risk ağırlığı duyarlılığı · insan tavanı ve kümeler arası etiket uyumu · "hasarlı" tanımının
  EMS-98 eşleme tablosu (Ç-05).
- **Makale düzeltmeleri:** §8.4.
- **İletişim:**
  - TE23D yazarlarıyla lisans teyidi; TUE-CD yazarlarıyla lisans sorusu.
  - ÇŞB'den hasar tespit verisi talebi (QM-VS13). Ainscoe vd. 2025'in gösterdiği yol: csb.gov.tr/en/contact-us ya da Bakanlığın
    KEP adresi (cevrevesehircilikbakanligi@hs01.kep.tr).
  - İsteğe bağlı: Wiguna / Adriano'dan İslahiye referans etiketleri (6 145 bina, xBD sınıfları; Ç-19). Gelirse İslahiye kıyası
    birebir olur.

### 9.5 Yeni simülasyon için şimdiden çıkan notlar (sonraki aşama)

- **Çıkarım ölçeği:** analiz alanı büyüdükçe zoom düşürülmemeli.
  - Çıkarım eğitim ölçeğine (~0,4–0,5 m/piksel; 37°K'de z=18) sabitlenmeli; alan büyürse yama bütçesi büyümeli.
  - Bugünkü `zoom_for_radius` 3 km'de ~3,9 m/piksele iniyor (J-20; Ç-11).
- **Kapanma çıkarımının yer gerçeği:**
  - EMSR648 yerine HaitiBRD'nin hasarlı/hasarsız yol kesimleri (QM-VS06) olaylar arası sınama olarak kullanılabilir.
  - Ayrıca sınama bloklarımızda elle etiketlenecek küçük bir yol kapanması kümesi. Tablo 14'ün yeni tasarımı buna bağlı.
- **Belirsizlik:** topluluk uyuşmazlığından piksel belirsizliği; kapanma eşiği taranarak kapalı yol sayısının dağılımı
  (RAPID-A fikri, Ç-10).
- **Kapanma tanımı:** yol kapatan enkaz esas olarak çökme tipi hasar. TE23D'nin "bütün enkaz alanı" etiket tanımı bu amaca
  bina ayak izinden daha uygun (Ç-03).

---

## 10. Değişiklik günlüğü

| Tarih | Değişiklik |
|---|---|
| 20 Eylül 2026 | `veri_setleri_katalogu.csv` paketten çıkarıldı; katalog okunur biçimde (Türkçe karakterli, tıklanabilir bağlantılı) `UTKU_ICIN_LISTE.md` sonuna taşındı. TUE-CD'nin doğrulanmamış makale numarası yerine DOI yazıldı |
| 19 Eylül 2026 | **Açık erişimli üç makale tam metinden teyit edildi** (tarayıcıyla, PDF indirmeden): Ainscoe vd. 2025 (Microsoft F1 0,24, kesinlik 0,42, 0,41 kat ✓; kıyas alanı Kahramanmaraş + Nurdağı; **düzeltme:** radar 0,47 kesinlik değil F1), Wiguna 2024a (İslahiye tabloları ✓; görüntü QQB ile aynı gün ve uydu; xView-2 piksel düzeyi satırı eklendi), Wiguna 2024b (**düzeltme:** sınama GSI hava fotoğrafında ve yazarların kendi etiketleriyle; 0,62 → 0,75 iki sınıf ortalaması, hasar sınıfı 0,33 → 0,55 → Noto'da sayısal kıyas yok). **Karar:** kapalı erişimli PDF'ler (Xie 2022, Song 2020) aranmıyor; bu çalışmalar yalnız yöntem düzeyinde anılır, sayıları makaleye yazılmaz. §9'a ÇŞB talebi ve İslahiye etiket isteği eklendi. Günlükteki "20 Eylül" tarihleri 19 Eylül olarak düzeltildi. Pakete eksikler dosyasının güncel kopyası (A-18…A-20 dahil) eklendi |
| 19 Eylül 2026 | **İkinci tur tamamlandı (Ç-12…Ç-19):** TUE-CD dergi sürümü (değişim sınıfı IoU ≈ 0,41, bizimle aynı düzey), Microsoft Türkiye raporu (künye düzeltildi; ÇŞB'ye göre F1 0,24 — "uydudan görünür hasar" çerçevesi), Song 2020 (süperpiksel oylaması son işlemi), Duarte 2018 (çözünürlük/etiket ayrıştırma deneyi), Valentijn 2020 (Tablo 15 tasarım kusuru → A-20), Xie 2022 (ViT değil U-Net tabanlı CNN; derin denetim fikri), Wiguna 2024b (Noto kıyas tasarımı), Wiguna 2024a (İslahiye'de xBD modelleri yıkık F1 0,33–0,44 → yerel veri karşılaştırması). IoU planına 8a, 13b eklendi; 15 güncellendi. Yeni takip: Ainscoe vd. 2025, Ekkazan 2024 tezi, Nex vd. 2019, Xu vd. 2019 |
| 19 Eylül 2026 | **§4.1 eklendi:** altı makalenin içinde anılan veri setleri (21 kayıt, birleştirilmiş) ve çalışmalar (ikinci tur okuma listesi: öncelik 1'de 8, öncelik 2'de 11; ayrıca yalnız atıf listesi). Yeni adaylar: QM-VS12 Microsoft Türkiye hasar ürünü, QM-VS13 ÇŞB hasar tespit kayıtları, QM-VS14 L'Aquila 2009 (araştırılacak); yardımcı veri olarak HOTOSM bina izleri ve USGS ShakeMap. TUE-CD'nin dergi sürümü bulundu (IEEE TGRS 2024). **§4.2 eklendi:** makalemizi 7 emsalle 15 iyi uygulamada kıyaslayan tablo ve yükseltme planı |
| 19 Eylül 2026 | Ç-10 RAPID-A ("SegFormer" kolu aslında MiT-B5/U-Net; piksel ölçütü yok; Gaziantep'te 8 kat fazla kestirim) ve Ç-11 DA-SegFormer (SegFormer-B4; kazanç büyük olasılıkla çözünürlükten; focal α bulgusu → EKSIKLER A-19) işlendi. **Karar: verileri biz indirmiyoruz** — §5 ad, bağlantı, açıklama ve hazırlık adımlarıyla yeniden yazıldı; `veri_setleri_katalogu.csv` eklendi. §6 model kararları kesinleşti (U-Net R18 ✅, topluluk analizi ✅, B5 / UNet++ EffNet-b7 isteğe bağlı, Mask2Former düşük öncelik). §6.5 IoU planına focal α eklendi. §9 Utku listesi yeniden düzenlendi; §9.5 yeni simülasyon notları eklendi |
| 19 Eylül 2026 | Ç-02 QuickQuakeBuildings (+ yeniden kurulumumuzda 4 sorun → EKSIKLER A-18), Ç-03 TE23D (%74,45 = mIoU; IoU_hasar 56,98; sızıntılı rastgele bölme), Ç-04 Hacıefendioğlu vd. (IoU 0,394; U-Net R18 taban önerisi), Ç-05 Noto (dış sınama QM-VS11), Ç-06 kapsam taraması [7] (atıf düzeltmeleri) işlendi. §8.4 makale düzeltmeleri eklendi. Model kararlarına U-Net ResNet-18 eklendi |
| 19 Eylül 2026 | Belge oluşturuldu. Ç-01 (EIDSeg) işlendi. Bağlantılardaki üç veri seti incelendi: TUE-CD + MSI-Net (Ç-07), HaitiBRD (Ç-08), HOTOSM (Ç-09; Overpass ile 3 434 poligon, il/ilçe dağılımı). Benzer SegFormer çalışmaları ön taraması (§4). Veri kataloğu ve adlandırma (§5), model kararları (§6), kayıt standardı (§7), makaledeki bekleyen yerlerin tam haritası (§8). Ç-02…Ç-06, Ç-10, Ç-11 inceleniyor |
