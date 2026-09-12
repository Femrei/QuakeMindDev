# QuakeMind Makale Taslağı — Detaylı Düzeltme ve Tamamlama Listesi

**Belge:** `MAKALE_TASLAK_TR__1_.docx`
**İnceleme tarihi:** 12 Eylül 2026
**Taslak hacmi:** ~17 280 kelime · 23 tablo · 21 şekil (10'u üretilmiş, 11'i yer tutucu) · 17 denklem · 57 kaynak
**İşaretli boşluk sayısı:** 187 adet `[ÖLÇÜLECEK]` + 8 adet `[EKLENECEK]`

---

## 0. Yönetici Özeti

Taslak, metodolojik dürüstlük bakımından beklenenin çok üzerinde: ölçülen/ölçülmeyen ayrımı, kazanç ayrıştırması, sınırlılıkların 13 maddede açıkça sayılması hakemin ilk eleştiri hattını baştan kapatıyor. Sayısal iç tutarlılık da büyük ölçüde sağlam — Tablo 12, 16, 17, 21, 22'deki türetilmiş değerleri (F₁↔kesinlik/duyarlılık, IoU↔F₁, yüzde hesapları, toplamlar) tek tek yeniden hesapladım, **hepsi tutuyor**.

Buna karşılık taslağı nihai seviyeye taşımak için kapatılması gereken **4 kritik**, **9 yüksek**, **21 orta** ve **çok sayıda biçimsel** eksik var. Kritik olanların ortak paydası şu: **Bölüm 3 (Yöntem), Bölüm 4'te raporlanan koşumu tarif etmiyor.** Bazı yerlerde yöntem "yapılacak" derken sonuç "yapıldı" diyor, bazı yerlerde tam tersi. Hoca/hakem bu uyuşmazlıkları ilk okumada yakalar.

**Öncelik sırası:** Bölüm A → Bölüm B → Bölüm E (kaynakça) → Bölüm D (biçim) → Bölüm C (ölçüm boşlukları, eğitim bittikçe).

---

## A. KRİTİK — Yöntem ile Sonuç Arasındaki Doğrudan Çelişkiler

Bunlar "eksik" değil, **birbirini yalanlayan iki ifade**. Düzeltilmeden gönderilirse hakem raporunda ilk maddeler bunlar olur.

### A1. Sentetik kapanma üreticisi Bölüm 3'te hiç tanımlanmamış ❗

- Makalenin manşet sonucu (206,6 dk vs 1641,0 dk) **tamamen sentetik kapanma kümesine** dayanıyor.
- **"Sentetik" kelimesi Bölüm 3 (Materyal ve Yöntem) içinde sıfır kez geçiyor.** Üretici yalnızca Bölüm 4.3, 4.5, 4.6 ve 5.3(a)'da *sonuç* olarak anılıyor.
- Okuyucu şunları öğrenemiyor: kapanma noktaları hangi dağılımla, hangi yoğunluk parametresiyle, hangi topolojik kısıt altında (kavşaklara mı, kenar ortalarına mı, ana arterlere mi) yerleştiriliyor; rastgele tohum kaç; bölge başına oran nasıl seçiliyor (%0,6–4,5 aralığı nasıl doğuyor).
- **Yapılacak:** Bölüm 3.8'e `3.8.x Sentetik Kapanma Üreticisi` alt başlığı ekleyin. İçermesi gerekenler: (i) üretim algoritması (tercihen sözde kod, Algoritma 2 olarak), (ii) parametreler ve değerleri, (iii) rastgele tohum, (iv) yoğunluk parametresinin bölge bazında nasıl belirlendiği, (v) neden bu tasarımın seçildiği. Tablo 5'e benzer bir "üretici künyesi" tablosu da iş görür.
- **Not:** Bu tanım yapılmadan 4.3'teki "tutarlılık kontrolü" ve 4.6'daki tüm sayılar yeniden üretilemez. Bu, makalenin tekrarlanabilirlik iddiasındaki en büyük gedik.

### A2. Ekip–hedef atama kuralı hiç tanımlanmamış ❗

- Bölüm 3.9 yalnızca **görev kilitleme** (eşzamanlılık denetimi) anlatıyor ve açıkça "atama eniyilemesi değildir" diyor. Doğru bir sınırlama, ancak:
- **18 ekibin 18 hedefe hangi kuralla eşleştirildiği hiçbir yerde yazmıyor** (en yakın ekip mi? aciliyet sırasına göre mi? açgözlü mü? rastgele mi? karargâh bazlı mı?).
- **Sorun:** Toplam müdahale süresi 206,6 dk doğrudan bu kuralın çıktısı. Kural bilinmeden ne 206,6 dk ne de naif ajanla farkı yorumlanabilir. Hakem "bu sayı neyin ölçüsü?" diye soracaktır.
- **Yapılacak:** Bölüm 3.9'a atama kuralını (sözde kod veya 3–4 cümlelik kesin tanım) ekleyin. Kural basit/açgözlü ise bunu açıkça yazın — zayıflık değil, kapsam beyanıdır ve zaten 3.9'daki dar iddiayla uyumlu olur.

### A3. Bölüm 3.7 ile Bölüm 4.11 birbirini iki noktada yalanlıyor ❗

| Bölüm 3.7 (Yöntem) diyor ki | Bölüm 4.11 (Sonuç) diyor ki |
|---|---|
| "Katalog verisi üzerinde **önce kümelenmeden arındırma uygulanarak** artçı sarsıntılar ayıklanır." | "(ii) **katalogda artçı ayıklaması (declustering) yapılmamıştır**" |
| "Bu karşılaştırma ve olasılık kalibrasyonu **henüz yapılmamıştır**." | Tablo 22'de 7 model karşılaştırılmış, Brier skorları verilmiş, Şekil 20'de kalibrasyon eğrileri çizilmiş. |

- **Yapılacak (a):** Bölüm 3.7'deki declustering cümlesini gelecek zamana çevirin veya "bu sürümde uygulanmamıştır" notunu yöntem tarafına da taşıyın. Tercih: *"Katalog verisi üzerinde kümelenmeden arındırma planlanmakta olup bu sürümde uygulanmamıştır (Bölüm 4.11)."*
- **Yapılacak (b):** "henüz yapılmamıştır" cümlesini silin; karşılaştırma yapılmış. Yerine kalibrasyonun *iyileştirilmesinin* (izotonik/Platt) yapılmadığını yazın — 4.11'deki dördüncü gözlemle tutarlı olur.
- **Ek eksik:** Bölüm 3.7 iki naif tabandan söz ediyor (yalnızca fay mesafesi, yalnızca sismisite yoğunluğu). **Tablo 22'de bu iki taban yok.** Ya koşup tabloya ekleyin ya da 3.7'den çıkarıp gelecek çalışmaya taşıyın.

### A4. Metin sınıflandırma: Bölüm 3.6 tek etiketli, Bölüm 4.10 çok etiketli ❗

- Bölüm 3.6: *"...ihbarı 13 alt kategoriden **birine** atar."* (tek etiketli)
- Bölüm 4.10: *"...**çok etiketli** alt kategori kümesi üzerinde yapılmıştır; **bir ihbar birden çok etiket taşıyabilmekte** ve karar eşiği 0,50 olarak sabitlenmiştir."*
- Bu iki ifade uyuşmuyor; hangisi sistemin gerçek davranışı?
- İlgili ikinci tutarsızlık: Bölüm 3.6'da "belirsiz" eşiği **0,30**, Bölüm 4.10'da karar eşiği **0,50**. İkisinin ilişkisi (biri sigmoid çıktısı, diğeri softmax en yüksek skor mu?) açıklanmıyor.
- **Yapılacak:** Bölüm 3.6'yı çok etiketli kurguyu anlatacak biçimde yeniden yazın; 0,30 ve 0,50 eşiklerinin hangi büyüklüğe uygulandığını açıkça ayırın; Tablo 9'un çok etiketli kurguda nasıl çalıştığını (bir ihbar birden çok üst kategoriye düşebilir mi?) belirtin.

---

## B. YÜKSEK ÖNCELİK — Eksik Yöntem Tanımları ve Aşırı İddialar

### B1. Bölüm 3.5 (YOLOv8) için veri kümesi ve eğitim protokolü tamamen yok

İki YOLOv8 modeli tarif ediliyor ama şunların hiçbiri yok: eğitim veri kümesi (kaynak, boyut, etiketleme), sınıf dağılımı, eğitim hiperparametreleri, bölme stratejisi, mAP değeri. Tablo 23'te `[ÖLÇÜLECEK]`, ama **yöntem tarafı da boş**. En azından veri kümesi künyesi ve eğitim ayarları Bölüm 3.5'e girmeli; mAP sonradan doldurulabilir.

### B2. Metin veri kümesinin kaynağı hiçbir yerde yazmıyor

- Bölüm 4.10'da `n_sınama = 305`, `%15` oranından toplam ≈ **2 030 kayıt** çıkıyor. Bu kümenin **nereden geldiği, nasıl etiketlendiği, kim tarafından etiketlendiği, etik izin durumu** makalede hiç geçmiyor.
- 2023 depremi sosyal medya paylaşımlarından derlendiyse **kişisel veri / etik beyanı gerekir** — mevcut "Etik Standartların Beyanı" yalnızca senaryo kayıtlarının sentetik olduğunu söylüyor, bu kümeyi kapsamıyor.
- **Yapılacak:** Bölüm 3.6'ya veri kümesi künyesi (kaynak, toplam kayıt, kategori dağılımı, etiketleyici sayısı, etiketleyiciler arası uyum, anonimleştirme) ekleyin; Etik beyanını genişletin.

### B3. Risk skorlamada pozitif sınıf tanımı yok

- Tablo 22'nin tamamı `pozitif oran = 0,687` üzerine kurulu ama **"pozitif" ne demek hiçbir yerde tanımlanmamış** (30 gün içinde M ≥ ? büyüklüğünde olay mı? hücre bazında mı, olay bazında mı?).
- Ek tutarsızlık: Bölüm 3.7 **ızgara hücresi** bazlı öznitelik anlatıyor (faya mesafe, sismisite yoğunluğu, derinlik dağılımı); Bölüm 4.11 ise **olay kaydı** bazlı bir küme anlatıyor (454 kayıt, enlem/boylam/derinlik, 7 günlük kayan pencere). Birim hangisi?
- **Yapılacak:** Pozitif etiketin formal tanımını Bölüm 3.7'ye yazın; analiz biriminin (hücre mi olay mı) 3.7 ve 4.11'de aynı olduğundan emin olun.

### B4. Ortalama hız `v_ort` boş — tüm süre sonuçları buna bağlı

- Tablo 11'de `[EKLENECEK]`. Ama 206,6 / 1641,0 / 352,5 / 16,9 dakikalık **her sayı** bu parametreden türüyor.
- Ayrıca `v_ort` bir donanım özelliği değil, model parametresi — Tablo 11 (donanım/yazılım ortamı) yanlış yer. Bölüm 3.8 "Süre hesabı" paragrafına veya ayrı bir senaryo parametreleri tablosuna taşıyın.
- **Yapılacak:** Değeri girin, gerekçelendirin (afet koşullarındaki ortalama hız için kaynak veya varsayım beyanı), yerini değiştirin.

### B5. Bölüm 4.5'in sonuçları, Bölüm 3.6'da anlatılan **düzeltilmiş** kuralla değil, **eski** kuralla üretilmiş

- Bölüm 3.6 anahtar sözcük kurtarma kümesinin beş üst kategoriyi kapsayacak şekilde "bu sürümde genişletildiğini" söylüyor.
- Bölüm 4.5'teki iki yanlış negatif ise **düzeltme öncesi** kuralın sonucu.
- Yani **yöntemde anlatılan sistem ile sonuçları raporlanan sistem aynı sistem değil.** Şu an bu durum satır aralarında kalıyor.
- **Yapılacak (tercih sırası):** (1) Senaryoyu düzeltilmiş kuralla yeniden koşup sonucu raporlayın — en temiz çözüm ve tek ek koşum. (2) Mümkün değilse Bölüm 4.5'in başına kalın puntoyla: *"Bu koşum, Bölüm 3.6'da tanımlanan genişletilmiş kurtarma kuralı uygulanmadan önceki sürümle yürütülmüştür; düzeltilmiş kuralla yeniden koşum gelecek sürümdedir."*

### B6. Üç geçilebilirlik kuralı (katı / dengeli / gevşek) Bölüm 3'te tanımlanmamış

- Bölüm 4.3: *"**Bölüm 3.2'de tanımlanan** üç kural altında..."* — ama Bölüm 3.2 ve Tablo 4 yalnızca **tek** eşlemeyi (dengeli kural) veriyor. Üç kuralın tanımı ilk kez 4.3'te, madde işaretleri arasında ortaya çıkıyor.
- Ayrıca **dengeli ile gevşek kuralın tanım metni neredeyse aynı** yazılmış: ikisi de "yalnızca Destroyed kapalı" diyor. Fark (Damaged'a ceza uygulanıp uygulanmaması) yalnızca parantez içinde ima ediliyor.
- **Yapılacak:** Tablo 4'ü üç sütunlu hale getirin (Katı / Dengeli / Gevşek) veya Bölüm 3.2'ye küçük bir Tablo 4b ekleyin. Üç kuralı şöyle kesinleştirin:
  - **Katı:** Destroyed + Damaged → sert kapatma; Possibly damaged → müdahale yok
  - **Dengeli (esas alınan):** Destroyed → sert kapatma; Damaged → yumuşak ceza (Denk. 8–9); Possibly → müdahale yok
  - **Gevşek:** Destroyed → sert kapatma; Damaged ve Possibly → **hiçbir müdahale yok** (ceza dahil)

### B7. Giriş'teki 2. katkı iddiası, Bölüm 4'te karşılanmıyor

- Katkı 2: *"...üç alternatif kural altında **ayrı ayrı raporlanmaktadır**."*
- Gerçek: Tablo 19'un operasyonel sütunlarının **tamamı** `[ÖLÇÜLECEK]`. Yani raporlanmıyor, raporlanacak.
- **Yapılacak:** İddiayı ölçülene indirin: *"...üç alternatif kural altında ayrı ayrı raporlanmasına yönelik bir çerçeve tanımlanmakta ve kural bazında kapanma sayıları verilmektedir."* (Kapanma sayıları gerçekten verilmiş — Tablo 19'un ilk iki sütunu dolu.)

### B8. Tablo 12'nin başlığı yanıltıcı; ÖZ'de aynı çekince eksik

- Başlık: *"(KATE-CD + MEDBFS, **ayrılmış sınama kümesi**)"* — ama dipnot SegFormer'ın **ayrılmış sınama kümesinde değerlendirilmediğini** söylüyor. Yani başlık, satırlardan birinde yanlış.
- Aynı şekilde ÖZ, SegFormer'ın 0,4276 değerini verirken yalnızca **kodlayıcı sabitlenememesi** çekincesini anıyor; **farklı bölme / sınama kümesi yokluğu** çekincesini anmıyor. Bu ikincisi en az birincisi kadar ciddi.
- **Yapılacak:** Başlığı düzeltin (*"...beş mimari ayrılmış sınama kümesinde, SegFormer doğrulama kümesinde"*) ve ÖZ'deki ilgili cümleye ikinci çekinceyi ekleyin.

### B9. Kodlayıcı sabitlemesi iddiası ile Tablo 6'daki gerçek durum uyuşmuyor

- Bölüm 3.4: *"Bu sürümde koşulan ResNet yapılandırmasında kademe sayısı beştir ve mimariler arasında eşittir; **dolayısıyla ilk koşum kendi içinde tutarlıdır**."*
- Ama Tablo 6'ya göre DeepLabV3+ **ResNet-101 (45,7 M)**, diğer dördü **ResNet-18 (~11–14 M)** kullanıyor. Kodlayıcı kapasitesi mimariler arasında **3–4 kat** farklı. "Kendi içinde tutarlı" ifadesi bu haliyle savunulamaz.
- **Yapılacak:** Cümleyi düzeltin: *"...kademe sayısı beştir ve eşittir; ancak kodlayıcı kapasitesi eşit değildir (DeepLabV3+ için ResNet-101, diğerleri için ResNet-18), dolayısıyla ilk koşum yalnızca kademe sayısı bakımından tutarlıdır."*

---

## C. ORTA ÖNCELİK — Tutarlılık, Mantık ve Tanım Sorunları

### C1. ÖZ'deki `t_u` tanımı Bölüm 3.8'inkiyle çelişiyor

- ÖZ: *"...**keşif ve geri dönüş** cezası varsayımından..."* / ABSTRACT: *"exploration-and-**return** penalty"*
- Bölüm 3.8: *"...`t_u` parametresi, **kenar üzerinde kat edilen ek mesafeyi değil**, kavşakta durum değerlendirmesi ve yeniden yönlenme süresini temsil etmektedir."*
- "Geri dönüş" ifadesi tam da 3.8'in reddettiği yorumu çağrıştırıyor.
- **Yapılacak:** ÖZ ve ABSTRACT'ta "yeniden yönlenme cezası" / "re-routing penalty" kullanın.

### C2. Denklem (9) yumuşak cezası ile `r_h = 25 m` sert kapatma yarıçapı örtüşüyor

- `λ(d) = 3,0` bandı `d < 50 m` için tanımlı; ama `d < 25 m` olan kenarlar zaten çizgeden silinmiş durumda. Yani bu band fiilen yalnızca 25–50 m aralığını kapsıyor.
- **Yapılacak:** Denklem (9)'un altına bir cümle: *"Sert kapatma nedeniyle `d < r_h` olan kenarlar çizgede bulunmadığından ilk basamak fiilen `r_h ≤ d < 50 m` aralığına karşılık gelir."*

### C3. Kenar orta noktası ölçütü: bir yerde reddediliyor, başka yerde kullanılıyor

- Bölüm 3.8(a): orta nokta ölçütü açıkça eleştiriliyor (*"kenarın bir ucunda gerçekleşen bir kapanmayı sistematik olarak kaçırmaktadır"*), bu yüzden sert kapatmada kenar geometrisine dik uzaklık kullanılıyor. Doğru.
- Ama hemen ardından (Denk. 9 sonrası): *"Tablo 4'te 'Damaged' derecesine karşılık gelen ceza, **ilgili kesimin orta noktası** hasar noktası kabul edilerek ... uygulanır."*
- Aynı gerekçe burada da geçerli. En azından bu seçimin neden kabul edilebilir olduğu (yumuşak cezanın zaten mesafeye göre kademeli olması vb.) yazılmalı.

### C4. Erken durdurma ölçütü, makalenin kendi ölçüt eleştirisiyle çelişiyor

- Bölüm 4.1.2: *"...**doğrulama ortalama IoU'sunda** 8 devir iyileşme olmaması hâlinde erken durdurma"*
- Bölüm 3.10 ve 4.2 ise ortalama IoU'nun arka plan baskınlığı nedeniyle **yanıltıcı** olduğunu, karşılaştırmanın `IoU_hasar` üzerinden yapılması gerektiğini uzun uzun savunuyor.
- Model seçimi/durdurma ölçütü olarak eleştirilen ölçütün kullanılması, ölçüt tartışmasının inandırıcılığını zedeliyor.
- **Yapılacak:** Ya erken durdurmayı `IoU_hasar`'a çevirip yeniden koşun, ya da bunu Bölüm 4.2'nin sapma listesine (iv) maddesi olarak ekleyin.

### C5. Bölüm 3.3'te yakınlaştırma düzeyi hesabı üç noktada hatalı/eksik

1. **cos φ düzeltmesi yok.** `s(z) = 40 075 / 2^z` ekvator formülü. Tablo 2 ise "37° enlemde 15,3–0,48 m/piksel" diyor — yani orada cos(37°) uygulanmış. İki yer tutarsız.
2. **Karo boyutu tutarsız.** Tablo 2'deki m/piksel değerleri **256 piksellik** harita karosu varsayımıyla tutuyor (z13 → 15,3 m/px ✓). Bölüm 3.3 ise modelin karosunun **512 × 512** olduğunu söylüyor. "Karo" sözcüğü iki farklı şey için kullanılıyor (harita karosu / model karosu).
3. **"hedef karo sayısı altı" ifadesi yanlış.** `2r / s(z) ≤ 6` koşulu **bir kenardaki** karo sayısını sınırlar; toplam karo sayısı en fazla 36 olur.
- **Yapılacak:** (i) formüle cos φ ekleyin veya Tablo 2'yi ekvator değerine çevirin; (ii) "harita karosu" ve "model karosu" terimlerini ayırın; (iii) "bir kenardaki karo sayısı altı" yazın.

### C6. Algoritma 1 sözde kodunda mantık boşlukları

- 15. satır `c = g ise dongusu kir` **iç** döngüyü kırıyor; dış döngü (3. satır) devam edip `Dijkstra(G_a, g, g)` çağırıyor. Hedefe varışta dış döngünün de sonlanması gerekiyor.
- `I_max = 60` sınırına ulaşıldığında ne döneceği tanımsız (ULASILAMAZ mı? mevcut L, k, T mi?).
- 16. satırın (T hesabı) döngü dışında olduğu girintiden anlaşılmıyor — .docx'te girintiler kaybolmuş.
- `e_ters` (13. satır) tanımlanmadan kullanılıyor.
- **Yapılacak:** Sözde kodu tek boşluklu bir yazı tipiyle, girintili biçimde yeniden dizin; çıkış koşullarını ve `e_ters`'i açıkça tanımlayın. `ULASILAMAZ` durumunun toplam süreye nasıl yansıdığını (sonsuz mu, dışlanıyor mu) belirtin.

### C7. Dijkstra–A* eniyilik doğrulaması niceliksiz

*"Dijkstra yalnızca eniyilik denetimi amacıyla koşulmuş ve iki algoritmanın aynı yolu ürettiği doğrulanmıştır"* — kaç güzergâh çifti üzerinde? 18/18 mi? Sayıyı yazın.

### C8. `k = 68` keşif olayı sayısı gerekçelendirilmeli

18 güzergâh için 68 keşif = güzergâh başına ~3,8 kapalı kenara çarpma. Kapanma oranı %0,6–4,5 iken bu oran yüksek görünüyor. Hakem sorar. Bölüm 4.6'ya bir–iki cümlelik açıklama ekleyin (naif ajanın yeniden planlamasının aynı koridora yönlendirmesi vb.) veya bölge bazında dağılımını verin.

### C9. Bölüm 4.2'de "hasarsız karoların %95'i elenmiştir" — sonuçlara etkisi tartışılmamış

Bu eleme, test kümesinin sınıf dağılımını gerçek dağılımdan koparıyor. Dolayısıyla Tablo 12'deki **doğruluk, özgüllük ve kesinlik** değerleri gerçek dağılımı yansıtmıyor (`IoU_hasar` ve duyarlılık görece daha dayanıklı). Bir cümleyle belirtilmeli ve Bölüm 4.2'nin sapma listesine eklenmeli.

### C10. Tablo 12'de iki değer birden kalın — okuyucu hangisinin ne olduğunu ayıramıyor

`LinkNet 0,3700` (kıyaslama mimarileri içinde en iyi) ve `SegFormer 0,4276` (genel en iyi, farklı protokol) aynı biçimde vurgulanmış. Dipnotta ayrımı açıklayın veya farklı vurgu kullanın.

### C11. Şüpheli sayısal çakışmalar — doğrulanmalı

1. **Tablo 12** SegFormer `IoU_hasar = 0,4276` ile **Tablo 22** Çok katmanlı algılayıcı `ROC-AUC = 0,4276` — birbirinden tamamen bağımsız iki deneyde dört haneye kadar aynı değer. Büyük olasılıkla rastlantı ama kopyala-yapıştır hatası riski var; kaynak çıktılardan teyit edin.
2. **Tablo 21** DistilBERTurk: `Mikro duyarlılık = 0,4230` ve `Tam küme doğruluğu = 0,4230` — aynı değer. Mümkün ama teyide değer.

### C12. Tablo 21'de eksik hücre

Çift yönlü UKSB + fastText satırında **Eğitim süresi = "---"**. Diğer yedi model için verilmişken bunun boş kalması gerekçesiz. Ölçün veya "kaydedilmemiştir" dipnotu düşün.

### C13. Tablo 9 aciliyet sıralaması gerekçelendirilmeli

"Enkaz kaldırma → 5" iken "Sağlık → 4". Bölüm 4.5'te kaçırılan iki ihbarın **hayati medikal çağrı** olması, bu sıralamanın sorgulanmasını kaçınılmaz kılıyor. Sıralamanın gerekçesi ("hayat kurtarma penceresinin darlığı") tek cümlede kalmış; 2–3 cümleye çıkarın veya sağlık kategorisini yeniden konumlandırın.

### C14. Bölüm 4.1.1 kendi kendiyle çelişiyor

*"...eğitim ortamına ait alanlar **Bölüm 4.2'deki karşılaştırma yürütüldükten sonra** raporlanacaktır."* — Ama Bölüm 4.2 **zaten yürütülmüş** (Tablo 12 dolu). Dolayısıyla eğitim ortamı bilgisi şu anda mevcut olmalı. Cümleyi kaldırıp değerleri girin.

### C15. "Senaryo v2" terimi açıklanmamış

Tablo 11'de geçiyor, başka hiçbir yerde geçmiyor. Ya tanımlayın ya da sadeleştirin.

### C16. Bölüm 3.4 "Ağırlık başlangıcı" paragrafı gelecek zamanda ama koşum yapılmış

*"...tüm mimariler aynı ImageNet ön eğitimli başlangıçtan, **aynı tohumlarla ince ayarlanacaktır**"* — Tablo 12 tek tohumla koşulmuş (4.2'nin (iii) maddesi). Ayrıca SegFormer MiT-B4/ImageNet, diğerleri ResNet/ImageNet — "aynı başlangıç" değil. Paragrafı hedeflenen/koşulan ayrımıyla yeniden yazın.

### C17. Model ağırlığı adında yazım hatası + anonimlik riski

`Utbird/dispath_optimized_mitb4_focal_dice30`
- `dispath` → muhtemelen `dispatch` (kaynakta da hatalıysa olduğu gibi bırakıp `[sic]` düşün).
- Depo sahibi adı **yazar kimliğini ele veriyor.** Çift kör hakemlik varsa bu satır ile Veri Erişilebilirliği bölümündeki depo adresi anonimleştirilmeli.

### C18. Bölüm 5.3'te iki sınırlılık eksik

Mevcut (a)–(m) listesi güçlü ama şunlar yok:
- **Yer seviyesi tespit başarımının (mAP) hiç ölçülmemiş olması** (yalnızca Tablo 23'te görünüyor).
- **Metin ve risk veri kümelerinin künyesinin/etiketleme protokolünün raporlanmamış olması.**
- Yeni maddeler **(n)** ve **(o)** olarak ekleyin.

### C19. Tablo 2 ile Bölüm 3.1 arasındaki kanal uyumsuzluğu

Bölüm 3.1 beş veri kanalı tanımlıyor; Tablo 2 altı veri **kaynağı** listeliyor. "Acil çağrı" kanalının ve metin ihbarlarının kaynağı Tablo 2'de yok. Tablo 2'ye iki satır ekleyin veya başlığına "dış veri kaynakları" niteleyicisi koyun.

### C20. Tablo 13'te `τ` sütunu `[ÖLÇÜLECEK]` olarak işaretlenmiş

`τ` bir **taranacak parametre**, ölçülecek bir sonuç değil. `[TARANACAK]` veya doğrudan değer aralığı (`{0,1; 0,3; 0,5}` gibi) yazın.

### C21. ÖZ'de kısaltmalar açılmadan kullanılmış

`IoU`, `mAP`, `F₁` — ÖZ'de tanımsız geçiyor (IoU ilk kez Bölüm 2.1'de açılıyor). Çoğu dergi özette kısaltma açılmasını ister.

---

## D. BİÇİM, DERGİ GEREKSİNİMLERİ VE .DOCX TEKNİK SORUNLARI

### D1. Denklemler gerçek denklem nesnesi değil ❗

`.docx` içindeki OMML (Office Math) nesne sayısı: **0**. Denklem (1)–(17)'nin tamamı **ham LaTeX metni** olarak duruyor (`\\mathcal{L}_{\\text{odaksal}} = -\\alpha_t\\,...`). Hiçbiri okunabilir biçimde görüntülenmiyor. Denklem (9) ise `\\begin{cases}` bloğu olarak tamamen dağılmış durumda.

- **Yapılacak:** 17 denklemin tamamını Word Denklem Düzenleyicisi (veya MathType) ile yeniden girin. LaTeX'ten dönüştürmek için Word'de `Alt + =` sonra LaTeX modunu kullanabilirsiniz.
- Denklem numaraları sağa hizalı, parantez içinde olmalı; metindeki "Denklem (n)" atıfları buna uymalı.

### D2. Yazar bilgileri tamamen eksik ❗

Belge **başlıktan doğrudan ÖZ'e** geçiyor. Eksikler: yazar adları, kurum/bölüm adresleri, e-posta, **ORCID numaraları**, sorumlu yazar işareti. Bölüm "Yazarların Katkıları"nda 4 yazar için `[YAZAR ADI 1–4]` yer tutucusu var ama künye yok.

### D3. Çapraz başvuruların hiçbiri alan kodu değil

`w:fldChar` sayısı: **0**. Tüm "Tablo 12", "Şekil 8", "Bölüm 5.3(g)", "Denklem (11)" atıfları **elle yazılmış**. Bir tablo/şekil eklenir veya silinirse tüm numaralandırma elle düzeltilmek zorunda kalır — bu aşamada hata kaynağı. En azından son sürümde tam bir numara denetimi yapın (aşağıdaki F ve G bölümlerindeki envanteri kullanın).

### D4. ÖZ ve ABSTRACT çok uzun

- ÖZ: **389 kelime** · ABSTRACT: **499 kelime**
- Çoğu Türk mühendislik dergisi (Gazi Üniv. Fen Bilimleri, Politeknik, Journal of the Faculty of Engineering and Architecture of Gazi University vb.) **150–250 kelime** sınırı koyar.
- **Yapılacak:** Hedef dergiyi belirleyip sınıra indirin. Kırpılacak ilk aday: çok mimarili karşılaştırma ve metin sınıflandırma sayısal ayrıntıları (bunlar zaten ön bulgu).
- İkisi arasında **uzunluk ve içerik farkı** var; birebir örtüşmeleri gerekir.

### D5. Makale hacmi çok büyük

~17 280 kelime + 23 tablo + 21 şekil. Tipik dergi sınırı 8 000–10 000 kelime, 8–12 şekil/tablo. **Yapılacak:** Tablo 5, 13, 14, 18, 20 (tamamı iskelet) ve Tablo 23'ü **Ek (Appendix)** bölümüne taşımayı değerlendirin; Bölüm 2'yi %20–25 kısaltın.

### D6. Başlık çok uzun

Türkçe başlık ~30 kelime, iki noktalı yapıda. Bazı dergiler 15–20 kelime sınırı koyar. Kısaltma önerisi: *"Uydu Görüntüsünden Yol Hasarı Bölütlemesi ile Kapanma-Farkında Ekip Sevkinin Bütünleştirilmesi: 6 Şubat 2023 Kahramanmaraş Depremleri Örneği"*

### D7. Şekil 8'de alt şekil etiketleri yok

Beş ayrı görsel tek bir "Şekil 8" altında toplanmış. **(a)–(e)** etiketleri ekleyin ve altyazıda hangi harfin hangi mimariye ait olduğunu belirtin. Aynı sorun Şekil 15 (2 görsel), Şekil 18 (2 görsel), Şekil 21 (2 görsel) için de geçerli — altyazılarda "üstte/altta" denmiş, etiket daha güvenli.

### D8. Şekil 9 hem "üretilmemiştir" diyor hem de altyazısı var

Ya şekli üretin ya da hem yer tutucuyu hem altyazıyı kaldırıp Bölüm 4.2'ye "niteliksel karşılaştırma bu sürümde sunulmamıştır" cümlesini koyun.

### D9. Görsellerin çözünürlüğü ve okunabilirliği denetlenmeli

17 PNG dosyası gömülü. Dergiler genelde **≥300 dpi** ister. Ayrıca Şekil 8/15/18/21'deki eksen etiketi ve lejant yazı boyutlarının basılı boyutta okunabilir olduğunu kontrol edin. Grafik metinlerinin dili (Türkçe/İngilizce) makale geneliyle tutarlı olmalı.

### D10. Eksik standart bölümler

- **Kısaltmalar/Simgeler listesi** yok (17 denklem ve çok sayıda sembol var; dergi isterse gerekli).
- **Öne çıkanlar (Highlights)** yok.
- Teşekkür'de `[PROJE NUMARASI EKLENECEK]`.
- Veri Erişilebilirliği'nde `[DEPO ADRESİ EKLENECEK]`.

---

## E. KAYNAKÇA — Tespit Edilen Sorunlar

### E1. Beş kaynakta yazar adı hiç yok ❗

| No | Sorun |
|---|---|
| **[23]** | *"Vector-guided post-earthquake damaged road extraction..."* — **yazar yok** |
| **[24]** | *"Segment-anything embedding for pixel-level road damage extraction..."* — **yazar yok** |
| **[25]** | *"Deep learning-based detection and assessment of road damage..."* — **yazar yok** |
| **[29]** | *"DamageScope: An integrated pipeline..."* — **yazar yok** |
| **[31]** | *"Reliability boundaries under synthetic post-earthquake road disruption..."* — **yazar yok** |

Bunların beşi de metinde **önemli konumlarda** kullanılıyor ([23]–[25] yol hasarı yazınının tamamı, [29] en yakın bütünleşik hat, [31] sentetik kesinti referansı). Yazar listeleri mutlaka tamamlanmalı.

### E2. Türkçe model kaynakları yanlış atıflanmış ❗

- **ConvBERTurk** için [51] verilmiş — ama [51] **Jiang vd., ConvBERT** (genel mimari, Türkçe modeli değil).
- **DistilBERTurk** için [52] verilmiş — ama [52] **Sanh vd., DistilBERT** (genel yöntem).
- Her iki Türkçe model de **Schweter'ın BERTurk paketinin** parçası. Doğrusu: mimari kaynağını + Türkçe model kaynağını ([32]) birlikte anmak. Örnek: `ConvBERTurk [32, 51]`.

### E3. "et al." kullanımı tutarsız

[5] ve [12] "et al." kullanıyor, geri kalanı tam yazar listesi veriyor. Dergi stiline göre tekdüzeleştirin.

### E4. `[KÜNYE DOĞRULANACAK]` işaretli iki kaynak

- **[56] KATE-CD** — yazar listesi ve varsa eşlik eden makale eklenecek. Ayrıca Bölüm 4.2'deki tanım ("404 görüntü–maske çifti, ikili küme") ile kaynağın gerçek içeriği (değişim tespiti kümesi, deprem öncesi/sonrası çift) uyuşuyor mu teyit edin.
- **[57] MEDBFS** — yazar listesi eklenecek. Ayrıca **kullanılan Türkiye alt kümesinin boyutu** (kaç görüntü/karo) makalede hiç yazmıyor; ekleyin.

### E5. 2026 tarihli dört kaynak teyit edilmeli

[7], [23], [26], [31] — hepsi 2026. Yayımlanmış / baskıda / preprint durumlarını doğrulayın, DOI ekleyin, "(baskıda)" gerekiyorsa belirtin. [7] cilt/sayfa bilgisi eksik.

### E6. [1] iki farklı şey için kullanılıyor

[1] AFAD **Ön Değerlendirme Raporu**. Ama Tablo 2 ve Bölüm 3.7'de **AFAD deprem kataloğu / açık web servisi** için de [1] veriliyor. İkisi farklı kaynak — katalog için ayrı bir kaynak numarası açın.

### E7. DOI/URL bilgileri eksik

[57] dışında hiçbir kaynakta DOI yok. Web kaynaklarında ([44]–[47]) **erişim tarihi** yok. Çoğu dergi ikisini de ister.

### E8. Yazılım kaynakları atıfsız

Bölüm 4.1.3'te **segmentation_models_pytorch**, **HuggingFace Transformers**, **NetworkX**, **PostGIS**, **PyTorch** anılıyor, hiçbirine atıf yok. En azından PyTorch ve Transformers'a atıf ekleyin.

---

## F. ÜRETİLECEK ŞEKİLLER (11 adet)

Tümü şu an italik köşeli parantez içinde **yer tutucu** durumda. Açıklamalar ayrıntılı yazılmış, bu iyi — üretimde doğrudan kullanılabilir.

| # | Şekil | Ne gösterecek | Tahmini zorluk |
|---|---|---|---|
| 1 | **Şekil 1** | Yazının algılama × karar ekseninde konumlandırılması, boşluğun görsel özeti | Kolay (kavramsal şema) |
| 2 | **Şekil 2** | Üç katmanlı sistem mimarisi ve veri akışı (HTTP 200 / 202 ayrımı) | Orta |
| 3 | **Şekil 3** | Çalışma alanı haritası: DAFZ, iki dış merkez, dokuz operasyon bölgesi | Orta (GIS) |
| 4 | **Şekil 4** | Karolama + ağırlık penceresi + harmanlama + 3 seviyeli son işleme | Orta (kod çıktısı) |
| 5 | **Şekil 5** | Kapanma katmanının çizgeye işlenmesi (a–d panelleri) | Orta |
| 6 | **Şekil 6** | Üç düzeyli değerlendirme protokolü ve R0–R3 konumu | Kolay |
| 7 | **Şekil 9** | Altı mimarinin görsel bölütleme karşılaştırması | Orta (koşum gerekir) |
| 8 | **Şekil 10** | Üretilen vs EMSR648 referans kapanma oranı (kural bazında) | Kolay |
| 9 | **Şekil 11** | Önerilen güzergâh vs naif ajan güzergâhı, harita üzerinde | Orta |
| 10 | **Şekil 12** | Süre farkının mesafe/ceza bileşenlerine ayrıştırılması + `t_u` taraması | Kolay |
| 11 | **Şekil 13** | `IoU_hasar` ↔ ortalama ulaşım süresi ilişkisi (görev tabanlı) | Tablo 18 dolunca |

> **Not:** Şekil 12 ve Şekil 10 mevcut verilerle **hemen** üretilebilir (Tablo 17 ve 4.3'teki oranlar yeterli). Şekil 6 ve Şekil 1 de veri gerektirmiyor. Bu dördünü şimdiden üretmek taslağı gözle görülür biçimde tamamlanmış gösterir.

---

## G. `[ÖLÇÜLECEK]` / `[EKLENECEK]` ENVANTERİ (187 + 8 adet)

### G1. Eğitim/koşum beklemeden **şimdi** doldurulabilecekler (öncelikli)

| Yer | Alan | Neden şimdi doldurulabilir |
|---|---|---|
| Tablo 11 | İşlemci, Sistem belleği, İşletim sistemi, PyTorch sürümü (senaryo sütunu) | Metin zaten "hâlihazırda bilinmekte" diyor |
| Tablo 11 | **Ortalama hız `v_ort`** | Koşum yapılmış, parametre belli olmalı |
| Tablo 11 | Eğitim ortamı: işlemci, bellek, OS, PyTorch | Tablo 12 koşulmuş → ortam biliniyor |
| Tablo 15 | Acil çağrı gecikmesi | Kural tabanlı, ölçülmesi saniyelik iş |
| Tablo 12 | GFLOPs (6 satır) | Model tanımından hesaplanır, yeniden eğitim gerekmez |
| Tablo 12 | Çıkarım süresi (6 satır) | Tek karo çıkarımı, dakikalar sürer |
| Teşekkür | TÜBİTAK proje numarası | — |
| Veri Erişilebilirliği | Depo adresi | — |
| Yazar Katkıları | 4 yazar adı | — |

### G2. SegFormer'ın üç katmanlı bölmeyle yeniden koşulması gerekenler

Tablo 12'de SegFormer satırının **Doğruluk, Kesinlik, Duyarlılık, F₁, Özgüllük** hücreleri. Bu tek koşum, hem satırı tamamlar hem de B8'deki başlık sorununu ortadan kaldırır. **En yüksek getirili tek iş.**

### G3. Yol hasarı eğitim kümesine bağlı olanlar (uzun vadeli)

- Tablo 5 (7 hücre) — küme künyesi
- Tablo 13 (42 hücre) — kapanma katmanının yer gerçeğine göre değerlendirilmesi
- Tablo 14 (24 hücre) — bölgeler arası genelleme
- Tablo 18 (48 hücre) — görev tabanlı değerlendirme
- Tablo 23'ün ilgili satırları

### G4. Ek koşum gerektirenler

- Tablo 16: **R1** ve **R2** referansları (8 hücre) — R0/R3 altyapısı hazır, görece düşük maliyetli
- Tablo 19: operasyonel sütunlar (12 hücre)
- Tablo 20: bileşen çıkarma / parametre duyarlılığı (7 eksen)
- Bölüm 3.3: karo kalite eşiği `V₀` ve elenen karo oranı

---

## H. ÖNERİLEN ÇALIŞMA SIRASI

**1. Hafta — Kritik tutarlılık (kod/koşum gerektirmez, tamamen yazım)**
- [ ] A1: Sentetik üretici tanımını Bölüm 3.8'e yaz
- [ ] A2: Ekip–hedef atama kuralını Bölüm 3.9'a yaz
- [ ] A3: Bölüm 3.7'deki iki çelişkili cümleyi düzelt
- [ ] A4: Bölüm 3.6'yı çok etiketli kurguya göre yeniden yaz
- [ ] B6: Üç geçilebilirlik kuralını Bölüm 3.2'de tanımla
- [ ] B7: Giriş 2. katkı iddiasını ölçülene indir
- [ ] B8, B9, C1, C3, C4, C9, C10, C14, C16: cümle düzeltmeleri

**2. Hafta — Eksik yöntem tanımları**
- [ ] B1: YOLOv8 veri kümesi + eğitim protokolü
- [ ] B2: Metin veri kümesi künyesi + etik beyan genişletmesi
- [ ] B3: Risk skorlamada pozitif sınıf tanımı + analiz birimi
- [ ] B4: `v_ort` değeri ve yeri
- [ ] B5: Senaryoyu düzeltilmiş kuralla yeniden koş (veya açık beyan)
- [ ] C5, C6: Yakınlaştırma hesabı ve Algoritma 1 düzeltmeleri

**3. Hafta — Kaynakça ve biçim**
- [ ] E1: Beş kaynağın yazar listesini tamamla
- [ ] E2: ConvBERTurk / DistilBERTurk atıflarını düzelt
- [ ] E4, E5, E6, E7, E8: künye doğrulamaları, DOI, erişim tarihi, yazılım atıfları
- [ ] D1: **17 denklemi Word denklem nesnesi olarak yeniden gir**
- [ ] D2: Yazar künyesi + ORCID
- [ ] D4: ÖZ ve ABSTRACT'ı dergi sınırına indir, birbiriyle örtüştür
- [ ] D6, D7, D8, D9: başlık, alt şekil etiketleri, Şekil 9 kararı, çözünürlük

**4. Hafta — Şekil üretimi ve doldurulabilir hücreler**
- [ ] F: Şekil 1, 6, 10, 12'yi üret (veri hazır)
- [ ] F: Şekil 2, 3, 4, 5'i üret
- [ ] G1: Şimdi doldurulabilecek 9 kalem
- [ ] G2: SegFormer'ı üç katmanlı bölmeyle yeniden koş

**Sonraki dönem (eğitim tamamlandıkça)**
- [ ] G3: Yol hasarı kümesi → Tablo 5, 13, 14, 18
- [ ] G4: R1/R2 referansları, Tablo 19, Tablo 20
- [ ] F: Şekil 9, 11, 13

---

## I. GÜÇLÜ YANLAR (Korunması Gerekenler)

Düzeltme yaparken bunları zayıflatmayın — taslağın en ayırt edici tarafları bunlar:

1. **Ölçülen/ölçülmeyen ayrımının kalın puntoyla sürekli tekrarlanması.** Bölüm 4'ün girişindeki ayrım paragrafı, ÖZ'deki çekince cümleleri, tablolardaki `[ÖLÇÜLECEK]` işaretleri. Hakemin "bu sonuç neyi ölçüyor?" sorusunu baştan kapatıyor.
2. **Kazancın Denklem (11) ile ayrıştırılması ve `t_u` taraması (Tablo 17).** %87,4'lük iddiayı kendi kendine çürütüp %26,5'lik savunulabilir tabanı raporlamak, alan yazınındaki en yaygın abartma hatasına doğrudan cevap.
3. **Güzergâh iç tutarlılığı bulgusunun "matematiksel zorunluluk" olarak açıkça nitelenmesi.** Çoğu makale bunu başarı olarak satar.
4. **Kahramanmaraş AOI-04'te hiç "Destroyed" yol kesimi olmaması gözlemi.** Bu, makalenin en aktarılabilir metodolojik katkısı — aynı yer gerçeğinden 134 kapanma ya da sıfır kapanma çıkabilmesi güçlü bir argüman.
5. **Makro-F₁ tersine dönmesi bulgusu (Tablo 21) ile 4.5'teki yanlış negatif gözleminin birbirine bağlanması** — ve "birbirini kanıtlamamakta, aynı yönü işaret etmektedir" ifadesinin tercih edilmesi.
6. **Sayısal iç tutarlılık.** Tablo 12, 16, 17, 21, 22'deki türetilmiş tüm değerleri yeniden hesapladım (F₁ ↔ kesinlik/duyarlılık, IoU ↔ F₁, ortalama IoU ↔ ön/arka plan, yüzde ve toplam kontrolleri): **hepsi tutarlı.** Bu, taslağın en sessiz ama en değerli özelliği.
