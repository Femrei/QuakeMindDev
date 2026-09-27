# -*- coding: utf-8 -*-
"""Tarama revizyonu - BOLUM B: rota motoru / tatbikat anlatiminin koda
uydurulmasi (Algoritma 1, A* sezgiseli, yumusak ceza, ceza payi, kapsama,
duyarlilik modeli, rota varyantlari)."""
from docx.oxml.ns import qn


def uygula(D, doc):
    deg, yaz, sil = D.degistir, D.yaz, D.sil

    # ---------------------------------------------------------------- OZ / ABSTRACT
    deg("(A*, sert kapatma ve yakınlık tabanlı ağırlık cezası)",
        "(süre tabanlı ve dönüş maliyetli A*, sert kapatma)")
    deg("Kapanmaya varan ekibin kaybettiği süre, önceki sürümdeki 20 dakikalık sabit yerine değerlendirme ve manevradan "
        "oluşan 1,42 dakikaya indirilmiş ve toplam kazanç mesafeden ve cezadan gelen bileşenlerine ayrıştırılarak "
        "raporlanmıştır.",
        "Kapanmaya varan ekibin kaybettiği süre, önceki sürümdeki 20 dakikalık sabit yerine değerlendirme ve manevradan "
        "oluşan 1,42 dakikaya indirilmiştir; buna karşın kaba bir kestirime göre en sağlam alanda kazancın büyük bölümü "
        "hâlâ bu beyan edilmiş cezadan gelmektedir, bu nedenle sonuç cezanın değerine duyarlılığıyla birlikte bant "
        "olarak raporlanmıştır.")
    deg("(A* with hard edge removal and proximity-based edge penalties)",
        "(time-based, turn-aware A* with hard edge removal)")
    deg("The time lost by a team reaching a blockage was reduced from the previous 20-minute constant to 1.42 minutes "
        "(assessment plus manoeuvre) and reported decomposed into its distance- and penalty-derived components.",
        "The time lost by a team reaching a blockage was reduced from the previous 20-minute constant to 1.42 minutes "
        "(assessment plus manoeuvre); a rough estimate nevertheless attributes most of the gain in the most robust area "
        "to this declared penalty, so the result is reported as a band together with its sensitivity to the penalty value.")

    # ---------------------------------------------------------------- 2.1 / 3.4
    deg("; model yol-özgü bir sınıfla eğitilmemiş,", "; modeller yol-özgü bir sınıfla eğitilmemiş,")
    deg("Yol kapanması, bu ikili hasar maskesinin OSM yol ağının rasterize edilmiş hâliyle (6 piksel çizgi kalınlığı) "
        "piksel düzeyinde kesiştirilmesiyle türetilir; kesişen en az bir piksel içeren yol kenarı sert kapatma ile "
        "çizgeden çıkarılır",
        "Yol kapanması, bu ikili hasar maskesinin OSM yol kenarlarının merkez çizgisi boyunca yaklaşık 5 m aralıkla "
        "(kenar başına en az üç nokta) örneklenmesiyle türetilir; örnek noktalarından biri hasarlı piksele düşen kenar "
        "sert kapatma ile çizgeden çıkarılır (canlı analiz ucunun ayrıca ürettiği 6 piksellik, yaklaşık 3 m genişliğindeki "
        "yol bandı maskesi görselleştirme içindir ve kapanma kararına girmez)")
    deg("Seviye seçimi bir yapılandırma parametresidir; seviyenin sonuç ölçütleri üzerindeki etkisi Bölüm 4.9'da bileşen "
        "çıkarma analizi ile incelenecektir.",
        "Seviye seçimi model künyesinde tutulan bir yapılandırma parametresidir: tatbikattaki üç model seviye 0 (son "
        "işleme yok) ve 0,5 karar eşiğiyle, varsayılan işletim modeli ise seviye 2 ve 0,4 eşiğiyle koşar. Seviyenin "
        "sonuç ölçütleri üzerindeki etkisi bu sürümde ölçülmemiştir.")

    # ---------------------------------------------------------------- 3.8 yumusak ceza
    yaz("(b) Yumuşak ceza — hedeflenen tasarım.",
        "(b) Yumuşak ceza. Sert kapatmadan artakalan her kenar, en yakın hasar kümesine olan uzaklığına bağlı bir "
        "çarpanla cezalandırılır:")
    yaz("Burada w(e) kenarın metre cinsinden uzunluğu",
        "Burada w(e) kenarın metre cinsinden uzunluğu, d_min(e) kenarın orta noktasından en yakın hasar kümesinin "
        "merkezine uzaklığı, λ(·) basamaklı bir ceza fonksiyonudur:")
    yaz("Denklem (9), sürekli bir azalma çekirdeği yerine",
        "Denklem (9) sürekli bir azalma çekirdeği yerine basamaklı bir yapı kullanır: hasar noktası konumlarının kendisi "
        "metre düzeyinde belirsiz olduğundan sürekli bir çekirdek bu belirsizliği hak etmeyen bir çözünürlük izlenimi "
        "verirdi. Basamak sınırları ve çarpan değerleri beyan edilmiş model parametreleridir; ölçülmüş değerler değildir. "
        "r_h = 0 olduğundan sert kapatma yalnızca hasarla örtüşen kenarları çıkarır; ilk basamak (d < 50 m) hasarla "
        "örtüşmeyen ama ona yakın kenarlara uygulanır.")
    yaz("Bu sürümde koşulan yapılandırmada Denklem (9)'daki",
        "Yumuşak ceza yalnızca haritadaki sarı güzergâh varyantında ve tekil güzergâh ucunda kullanılır; kıyas "
        "kollarındaki QuakeMind kolu yalnızca sert kapatmayla çalışır. Sarı varyant düğüm tabanlı aranır, dönüş maliyeti "
        "içermez ve süresi düz 15 km/sa ile hesaplanır; bu nedenle sarı varyantın süresi gri ve mavi güzergâhlarla "
        "doğrudan karşılaştırılmamalıdır (Tablo 19 bu yüzden yalnızca uzunlukları verir). Önceki sürümlerde denenen "
        "doğrusal çekirdek (d ≤ 150 m için 1 + 4·(1 − d/150)) bu sürümde kullanılmamaktadır.")
    yaz("Yol bulma.",
        "Yol bulma. Kıyas kollarının üçü de kenar tabanlı (satır grafiği) çizgede A* [42] ile arar; maliyet saniye "
        "cinsindendir: kenar uzunluğunun kenar hızına bölümü ile kavşaktaki dönüş süresinin toplamı. Haritadaki gri ve "
        "mavi güzergâh varyantları aynı süre ölçütüyle Dijkstra [41] ile hesaplanır. Önceki sürümde anılan, ayrı bir "
        "Dijkstra uygulamasıyla 90 görevde yapılan eniyilik denetimi bu sürümde yinelenmemiştir. A* sezgiseli, düğüm ile "
        "hedef arasındaki büyük çember uzaklığına dayanır:")
    yaz("Denklem (10)'da R = 6 371 000 m",
        "Denklem (10)'da R = 6 371 000 m, (φ_n, λ_n) değerlendirilen düğümün, (φ_g, λ_g) hedefin enlem ve boylamıdır. "
        "Süre tabanlı aramada sezgisel h(n)/v_max olarak kullanılır (v_max = 22,2 m/s ≈ 80 km/sa). Bu sezgisel, çizgede "
        "hızı v_max'ı aşan kenar bulunmadığında kabul edilebilirdir ve A* eniyi çözümü korur; hız tablosunda otoyol "
        "sınıfı 90 km/sa olduğundan ve maxspeed etiketi 130 km/sa'ya kadar kabul edildiğinden bu koşul her çizgede "
        "kendiliğinden sağlanmaz, mahalle çizgelerinde 80 km/sa'yı aşan kenar bulunup bulunmadığı bu sürümde ayrıca "
        "raporlanmamıştır. Sarı varyant ve tekil güzergâh ucunda maliyet cezalı metredir; orada λ(d) ≥ 1 olduğundan h(n) "
        "kabul edilebilirdir. Bu çalışmada öğrenilmiş bir yol bulucu kullanılmamaktadır; katkı, arama algoritmasında "
        "değil hasar bilgisinin klasik en kısa yol araması için tutarlı bir kısıta dönüştürülmesindedir.")
    deg("(kentsel sınıflarda 20–70 km/sa, otoyolda 90)",
        "(sınıf tablosunda 20–90 km/sa: konut yolu 30, ana yol 50, otoyol 90; maxspeed etiketi 5–130 km/sa aralığında "
        "kabul edilir)")
    yaz("Kapanma katmanının çizgeye işlenme süreci Şekil 5'te gösterilmektedir.",
        "Kapanma katmanının gerçek bir mahallede çizgeye işlenmesi ve sonuçtaki ekip güzergâhları Şekil 5'te "
        "gösterilmektedir.")

    # ---------------------------------------------------------------- Algoritma 1
    yaz("Algoritma 1. Kapanma-bilgisiz (naif) ajan simülasyonu.",
        "Algoritma 1. Kapanmayı bilmeyen ekibin simülasyonu (süre tabanlı, kenar durumlu arama).")
    ornek = D.bul("Girdi : G(V,E) yol çizgesi;")
    satirlar = [
        "Girdi : G(V,E) yönlü yol çizgesi (kenar uzunluğu w(e), kenar hızı v(e), dönüş süresi τ);",
        "        B gerçek kapalı kenar kümesi (ekibe gizli); s başlangıç düğümü; g hedef düğüm;",
        "        I_max = 60 en çok yol hesabı (ilk plan dahil)",
        "Çıktı : toplam süre T ve keşfedilen kapanma sayısı k; ya da ULAŞILAMAZ",
        "1: K <- boş küme ; c <- s ; e_g <- yok ; T <- 0 ; k <- 0   // K: ekibin bildiği kapalı kenarlar",
        "2: i = 1 .. I_max döngüsü",
        "3:     P <- A*(G \\ K, c, g, maliyet = w(e)/v(e) + τ, giriş kenarı = e_g)",
        "4:     P boş ise ULAŞILAMAZ döndür",
        "5:     engel <- yanlış",
        "6:     P üzerindeki her ardışık kenar e = (u, v) için",
        "7:         e ∈ B ise",
        "8:             K <- K ∪ {e, ters(e)} ; k <- k + 1 ; c <- u   // kenara girilmez, kavşakta öğrenilir",
        "9:             T <- T + c_kapanma ; engel <- doğru ; iç döngüden çık",
        "10:        T <- T + w(e)/v(e) + τ(e_g, e) ; e_g <- e ; c <- v",
        "11:    engel = yanlış ise T, k döndür                  // c = g: hedefe varıldı",
        "12: ULAŞILAMAZ döndür                                   // I_max yol hesabı aşıldı",
        "c_kapanma = değerlendirme 1,0 dk + manevra 25 sn = 1,42 dk. Satır 3'teki yeniden planlama geri dönüşü ayrıca "
        "25 sn'lik U dönüşü olarak fiyatlar; manevra bu nedenle iki kez sayılmaktadır (Bölüm 5.3(b)).",
    ]
    # eski satirlari (Girdi ... Sure:) ve aciklama paragrafini sil
    govde = ornek._p.getparent()
    cocuk = list(govde.iterchildren())
    bas = cocuk.index(ornek._p)
    son = cocuk.index(D.bul("Süre: T = Σ w(e)/v(e) + k · c_kapanma")._p)
    capa = cocuk[bas - 1]
    import copy
    ornek_kopya = copy.deepcopy(ornek._p)
    for el in cocuk[bas:son + 1]:
        govde.remove(el)
    from docx.text.paragraph import Paragraph
    sablon = Paragraph(ornek_kopya, doc)
    for s in satirlar:
        capa = D.sonrasina_ekle(capa, s, sablon)._p
    yaz("Algoritma 1'in 8. satırındaki ayrıntı",
        "Kıyas kolları aynı çizge, aynı kapanma kümesi ve aynı ekip–afetzede çiftleriyle, tek süreç içinde koşturulur. "
        "Telsizle paylaşan filoda bir ekibin öğrendiği kapanma o andan itibaren bütün ekiplerin arama çizgesinden "
        "çıkarılır; telsizle öğrenilen kapanma cezasız yeniden planlamaya yol açar.")
    yaz("Ceza teriminin niteliği.",
        "Ceza teriminin niteliği. Kapalı kenara varan ekip kavşakta durur, durumu değerlendirir ve yeniden yönlenir. "
        "Önceki sürümde bu ekibe keşif başına sabit 20 dakikalık bir ceza yükleniyordu ve makaledeki farkın büyük bölümü "
        "doğrudan bu varsayımdan geliyordu; bu sürümde ceza ayrıştırılmış ve beyan edilmiştir: değerlendirme 1,0 dk + "
        "manevra 25 sn = 1,42 dk. Ekibin fiilen fazladan sürdüğü yol ve dönüşler çizge üzerinde hesaplanır; kod her görev "
        "için hem sabit cezayı hem de cezadan gelen toplam süreyi ayrıca yazar. Cezanın farktaki payı Bölüm 4.6'da, ceza "
        "süresine duyarlılık Bölüm 4.9'da ele alınmaktadır.")
    yaz("Denklem (11)'de ΔT_mesafe",
        "Denklem (11)'de ΔT_mesafe, kapanmayı bilmeyen ekip ile QuakeMind arasındaki fark içinde kat edilen yol ve "
        "dönüş farkından doğan, t_u'dan bağımsız bileşendir; k·t_u ise keşif başına beyan edilen cezanın (t_u = 1,42 dk) "
        "toplamıdır. Bu ayrım Bölüm 4 ve Bölüm 5 boyunca korunmakta; t_u değerine duyarlılık Bölüm 4.9'da ayrıca "
        "taranmaktadır.")

    # Tablo 10 ikinci satir
    t10 = doc.tables[10]
    r = t10.rows[2]
    D.hucre_yaz(r.cells[1], 'mahalle ağı (+150 m marj)')
    D.hucre_yaz(r.cells[3], '%15,2 (Defne / Elektrik, ölçeğin değiştirildiği koşuda; güncel kurulumda %19)')

    # ---------------------------------------------------------------- 3.10
    deg("kapanmalar doğrudan hasar maskesinin OSM yol ağıyla piksel kesişiminden gelir (Bölüm 3.4)",
        "kapanmalar doğrudan hasar maskesinin OSM yol kenarlarının merkez çizgisi boyunca örneklenmesinden gelir "
        "(Bölüm 3.4)")
    deg("beş turda döndürülerek 25 çift oluşturulur.",
        "beş turda döndürülerek en çok 25 çift oluşturulur (afetzedeler modelin hasarlı bulduğu yerlere konduğundan "
        "Defne'de afetzede sayısı 1–5 arasındadır; Tablo 17).")

    # ---------------------------------------------------------------- 4.5
    yaz("Güzergâh iç tutarlılığı.",
        "Güzergâh iç tutarlılığı. Rotalanan güzergâhların hiçbiri kapalı olarak işaretlenmiş bir kenar içeremez: "
        "QuakeMind kolunda kapalı kenarlara sonsuz ağırlık verilir, harita varyantlarında ise bu kenarlar çizge "
        "görünümünden (nx.restricted_view) tümüyle dışlanır; en kısa yol araması bu kenarları yapısal olarak kullanamaz. "
        "Bu, ayrı ve bağımsız bir yol bulucuyla çapraz doğrulanmamıştır; önceki sürümde anılan '90 görevde en fazla "
        "0,00 m fark' denetimi bu sürümde yinelenmemiştir. Sahadaki geçilebilirliğin doğrulanması ayrı bir konudur ve "
        "burada iddia edilmemektedir.")

    # ---------------------------------------------------------------- 4.6
    deg("Çıkarımın fiilen değerlendirebildiği kenar oranı (kapsama) alana ve modele göre %19–46 arasındadır; modelin "
        "görmediği kenar açık sayılır ama ölçülmemiştir.",
        "Modelin fiilen değerlendirebildiği kenar oranı (kapsama) görüntünün uçuş izine ve mahalle çizgisine bağlıdır, "
        "modelden bağımsızdır: Defne'de %19, İslahiye'de %46, Nurdağı'nda %44; modelin görmediği kenar açık sayılır ama "
        "ölçülmemiştir.")
    yaz("Tablo 17. Üç gerçek mahallede",
        "Tablo 17. Üç gerçek mahallede kapanmayı önceden bilmenin erişim süresine etkisi (üç model × beş tohum; görev "
        "başına ortalama ± standart sapma, dakika). Mahalle başına beş giriş ağzı × afetzede sayısı kadar çift kurulur "
        "(en çok 25). Ortalamalar yalnız bütün kolların ulaştığı ortak görevlerden alınmıştır. Keşif: ortak görevlerde "
        "yaşanan toplam kapanma keşfi (tohum ortalaması). Kol ortalamaları 0,1 dk'ya yuvarlandığından küçük farklarda "
        "(ör. İslahiye) kazanç birkaç puan belirsizdir.")
    yaz("Farkın ayrıştırılması.",
        "Farkın ayrıştırılması. Kapanmayı bilmeyen ekip ile QuakeMind arasındaki süre farkı iki bileşenden oluşur "
        "(Denklem 11): ekibin fiilen fazladan sürdüğü yol ve dönüşlerden gelen fark ile kapanmaya her varışta yüklenen "
        "beyan edilmiş ceza (1,42 dk). Tablo 17'deki değerlerden yapılan kaba bir kestirime göre (keşif sayısının "
        "kapanmayı bilmeyen ekibe ait olduğu ve 25 ortak görev varsayımıyla) Nurdağı'nda (U-Net MiT-B4) cezanın toplam "
        "farktaki payı yaklaşık %83'tür (44,4 × 1,42 ≈ 62,9 dk; 25 × 3,04 ≈ 76,0 dk). Yani 20 dakikalık sabit kaldırılmış "
        "olsa da kazancın büyük bölümü hâlâ kapanmaya varış anındaki beyan edilmiş cezadan gelmektedir; bu nedenle sonuç, "
        "cezanın değerine duyarlılığıyla birlikte bant olarak verilmiştir (Bölüm 4.9, Tablo 21). Kod her görev için "
        "cezadan gelen süreyi ayrıca yazmaktadır; alan ve model bazında kesin ayrıştırma bu alanla yeniden koşularak "
        "raporlanacaktır [ÖLÇÜLECEK]. Kapanmayı bilmeyen ekip her kapalı koridoru tek tek keşfettiğinden yoğun hasarlı "
        "alanlarda keşif sayısı yükselir; bu nedenle bu kola göre hesaplanan fark bir üst sınır olarak okunmalı, "
        "telsizle paylaşan filoyla birlikte değerlendirilmelidir.")
    yaz("Şekil 11. Üç gerçek mahallede",
        "Şekil 11. Kolların görev başına erişim süresi ve kazancın ceza süresine duyarlılığı.")
    yaz("(a) Çubuklar üç kolun",
        "(a) Üç gerçek mahallede kolların görev başına ortalama erişim süresi (U-Net MiT-B4, beş tohum); çizgiler "
        "standart sapmadır. (b) QuakeMind kolunun kazancının beyan edilen değerlendirme süresine (0,5–2,0 dk; toplam ceza "
        "0,92–2,42 dk) duyarlılığı (segformer_mitb4_dice30, tohum 42; Tablo 21); alanların sıralaması değişmez. Taralı "
        "sütun önceki taslakta kullanılan 20 dakikalık sabittir ve sonuç olarak kullanılmamıştır.")
    deg("ve sıklığıyla (kapanmaya çarpan görev oranı) raporlanmıştır", "ve sıklığıyla (keşif sayısı) raporlanmıştır")

    # ---------------------------------------------------------------- 4.7
    t19 = doc.tables[20]
    for row in t19.rows:
        k = row.cells[0].text
        if k == 'Ekip 1':
            D.hucre_yaz(row.cells[4], 'kapanma rotayı değiştiriyor: metrede kısa (467 → 462 m), sürede uzun (0,9 → 1,0 dk)')
        elif k == 'Ekip 5':
            D.hucre_yaz(row.cells[4], 'metrede kısa (449 → 400 m); süre ölçütüyle seçildiğinden sürede kısa olamaz')
        elif k.startswith('Ortalama uzama'):
            D.hucre_yaz(row.cells[0], 'Ortalama uzama (mavi, griye göre)')
            D.hucre_yaz(row.cells[1], '—')
            D.hucre_yaz(row.cells[2], '101,7 m (%32,8)')
            D.hucre_yaz(row.cells[3], '—')
            D.hucre_yaz(row.cells[4], 'süre: 0,43 dk (%61,6); en büyük 1,8 dk')
    deg("ve hasara yakın kenarların pahalılaştığı sarı çizgi.",
        "ve hasara yakın kenarların pahalılaştığı sarı çizgi. Ekip 4 kayıtta raporlanmamıştır; uzama ortalaması yalnızca "
        "araçla tamamlanan rotalardan alınmıştır.")
    deg("en büyük süre uzaması 1,8 dk'dır.",
        "en büyük süre uzaması 1,8 dk'dır (çift başına süreler 0,1 dk'ya yuvarlandığından yüzde kaba bir değerdir).")
    deg("Nurdağı'nda tohum başına 29–44 keşifle", "Nurdağı'nda 29–44 keşifle (tohum ortalaması)")
    yaz("Şekil 12. Kapanmayı önceden bilmenin kazancının",
        "Şekil 12. QuakeMind kolunun kazancı ile keşif sayısı arasındaki ilişki (Tablo 17'nin sekiz satırı; hata "
        "çubukları beş tohum üzerinden standart sapma). Genel eğilim keşif sayısıyla artan kazançtır; Defne'de (boş "
        "işaret; beş tohum tek kurulum veriyor) ortak görev sayısı az olduğundan az sayıda keşif de görev başına yüksek "
        "bir kazanç üretebilmektedir.")
    deg("Sınanan hipotez. Deneyden önce kapanmaların", "Sınanan hipotez. Çalışmanın önceki sürümünde kapanmaların")

    # ---------------------------------------------------------------- 4.8
    deg("üç alanda dört yarıçapla ölçülmüştür (Tablo 20).",
        "üç alanda dört yarıçapla, U-Net MiT-B4 modeli ve tohum 42 ile ölçülmüştür (Tablo 20).")
    deg("Tablo 20. Moloz yayılım yarıçapının (r_h) operasyonel sonuca duyarlılığı:",
        "Tablo 20. Moloz yayılım yarıçapının (r_h) operasyonel sonuca duyarlılığı (U-Net MiT-B4, tohum 42):")

    # ---------------------------------------------------------------- 4.9
    deg("Bileşen Çıkarma ve Parametre Duyarlılığı", "Parametre Duyarlılığı")
    yaz("Sonucun beyan edilmiş sabitlere duyarlılığı üç alanda",
        "Sonucun beyan edilmiş sabitlere duyarlılığı üç alanda, aynı maske ve tek tohumla (42) ölçülmüştür (Tablo 21). "
        "Bu koşu Tablo 17'deki üç modelden biriyle değil, platformun varsayılan işletim modeliyle (segformer_mitb4_dice30; "
        "karar eşiği 0,4, son işleme seviye 2) yapılmıştır; bu nedenle ANA satırındaki süreler Tablo 17'deki değerlerle "
        "aynı değildir ve tablo mutlak süreleri değil, sabitlerin göreli etkisini okumak için verilmiştir. Bu modelin "
        "sınama IoU'su künyesinde kayıtlı değildir. Yalnızca beyan edilmiş sabitler değiştirilmiş; hücreler kapanmayı "
        "bilmeyen ekipten QuakeMind'e geçişi (dakika) ve kazancı göstermektedir.")
    deg("Tablo 21. Beyan edilen ceza süresine ve dönüş maliyetine duyarlılık:",
        "Tablo 21. Beyan edilen ceza süresine ve dönüş maliyetine duyarlılık (segformer_mitb4_dice30, tohum 42):")
    # P94 (yanlis yerde duran okunus) -> Tablo 21'in arkasina; yer tutucu cumle silinir
    okunus = D.bul("Üç okunuş öne çıkar.")
    yer = D.bul("Bu tablonun değerleri Bölüm 3.10'da tanımlanan protokolle üretilecektir.", nth=1)
    yer._p.addnext(okunus._p)
    yer._p.getparent().remove(yer._p)
    yaz("Üç okunuş öne çıkar.",
        "Üç okunuş öne çıkar. Dönüş maliyeti (sağdan trafik kuralı) mutlak süreleri Defne ve Nurdağı'nda yaklaşık %30 "
        "artırır; göreli kazancı bu iki alanda neredeyse değiştirmez (%28↔%29, %58↔%56), İslahiye'de ise %13'ten %27'ye "
        "çıkarır; dolayısıyla 'kapanmayı bilmek şu kadar kazandırıyor' cümlesi bu parametreden tümüyle bağımsız değildir. "
        "Değerlendirme süresi 0,5–2,0 dk aralığında (toplam ceza 0,92–2,42 dk) ölçülü bir etki yapar (kazanç Defne %24–41, "
        "İslahiye %13–19, Nurdağı %50–67) ancak alanların sıralaması değişmez; sonuç tek sayı değil bant olarak "
        "raporlanmalıdır. Önceki taslaktaki 20 dakikalık sabit ise tek başına sonucu üretmektedir: aynı alan ve "
        "kapanmalarla Nurdağı '22,6 dk → 1,4 dk, %94 iyileşme' diye okunur. Bu satır sonuç olarak kullanılmamış, yalnızca "
        "neden bırakıldığını göstermek için tutulmuştur.")
    for r in D.bul("Üç okunuş öne çıkar.").runs:
        r.italic = None  # onceki revizyonda tablo notu bicimini almisti

    # ---------------------------------------------------------------- 5
    deg("Kapanmaya varan ekibin kaybettiği süre önceki sürümdeki 20 dakikalık sabitten 1,42 dakikaya indirilmiş ve "
        "mesafeden gelen bileşeninden ayrıştırılmıştır; mekanizma sınamasında cezanın süredeki payı %97,4'ten %30'a "
        "düşmüştür.",
        "Kapanmaya varan ekibin kaybettiği süre önceki sürümdeki 20 dakikalık sabitten 1,42 dakikaya indirilmiştir; buna "
        "karşın kaba kestirime göre Nurdağı'nda kazancın yaklaşık %83'ü hâlâ bu beyan edilmiş cezadan gelmektedir "
        "(Bölüm 4.6), bu nedenle kazanç cezanın değerine duyarlılığıyla birlikte bant olarak okunmalıdır.")
    yaz("(b) Kapanmaya varan ekibin kaybettiği süre bir model parametresidir;",
        "(b) Kapanmaya varan ekibin kaybettiği süre bir model parametresidir; bu sürümde değerlendirme 1,0 dk + manevra "
        "25 sn = 1,42 dk olarak ayrıştırılmış ve beyan edilmiştir. Kaba kestirime göre kazancın büyük bölümü bu cezadan "
        "gelmektedir (Bölüm 4.6); ceza süresine duyarlılık Bölüm 4.9'da taranmış ve alanların sıralamasının değişmediği "
        "gösterilmiştir, yine de mutlak süreler ve kazanç yüzdesi bu beyan edilmiş sabite bağlıdır. Kodlamada iki kusur "
        "bulunmaktadır: kapanmada geri dönen ekibin manevrası hem 1,42 dk'lık cezanın içinde hem de yeniden planlamadaki "
        "25 sn'lik U dönüşü olarak iki kez sayılmakta, OSM'deki oneway = −1 (çizim yönünün tersine tek yön) etiketi ise "
        "ileri yön olarak yorumlanmaktadır; ikisinin sonuç üzerindeki etkisi ölçülmemiştir. Telsizle paylaşan filo kolu, "
        "tek başına öğrenen ekibe göre kazancın bir bölümünü yakalar.")
    yaz("(p) Görev tabanlı değerlendirmede model uydu görüntüsüyle",
        "(p) Görev tabanlı değerlendirmede modeller uydu görüntüsüyle (0,3–0,5 m/piksel) eğitilmiş ve drone "
        "ortofotolarında, eğitim ölçeğine yakın z18 çözünürlüğünde (yaklaşık 0,48 m/piksel) çalıştırılmıştır. Çözünürlük "
        "eşlenmiş olsa da platform ve sensör farkı (İHA ortofoto mozaiği ile uydu görüntüsü arasındaki bakış açısı, ışık "
        "ve işleme farkları) bir alan kayması oluşturur; bu, kapanma katmanının düşük duyarlılığının olası nedenlerinden "
        "biridir.")

    ek_duzeltmeler(D, doc)

    # kalinti denetimi: bu ifadeler govdede kalmamali
    for yasak in ("%30'a", "Bölüm 4.7'deki deneyde", "Tablo 4'te \"Damaged\"", "r_h = 25 m'den", "hedeflenen tasarım"):
        n = D.say(yasak)
        D.log.append("KALINTI %-28s %d" % (yasak, n))


def ek_duzeltmeler(D, doc):
    deg, yaz = D.degistir, D.yaz
    deg("Bölüm 4.5'teki senaryo değerlendirmesinde kullanılmamıştır.", "Bölüm 4.5'teki tatbikatta kullanılmamıştır.")
    deg("ile senaryo varsayımları.", "ile tatbikat varsayımları.")
    deg("Senaryo koşumu ve gecikme ölçümü", "Tatbikat koşumu ve gecikme ölçümü")
    deg("Senaryo ortamındaki sürümler,", "Tatbikat ortamındaki sürümler,")
    deg("Senaryo koşumları ve Bölüm 4.5'teki gecikme ölçümleri,", "Tatbikat koşumları ve Bölüm 4.5'teki gecikme ölçümleri,")
    deg("Uçtan Uca Senaryo Değerlendirmesi", "Uçtan Uca Tatbikat Değerlendirmesi")
    yaz("Türkçe ihbar metninden yapılandırılmış görev girdisi üretimi.",
        "Türkçe ihbar metninden yapılandırılmış görev girdisi üretimi. BERTurk tabanlı sınıflandırma, kural tabanlı "
        "aciliyet ataması ve varlık ismi tanıma ile coğrafi kodlama adımlarından oluşan hattın doğrudan sevk kuyruğuna "
        "girdi üretecek biçimde tanımlanması ve hattın kural katmanının modelin kararını ezdiği gözleminin açıkça "
        "raporlanması.")
    deg("çıkarılan dizgeler coğrafi kodlama servisine verilerek koordinata dönüştürülür.",
        "çıkarılan dizgeler önce yerel bir il/ilçe sözlüğünde, bulunamazsa Nominatim (OpenStreetMap) coğrafi kodlama "
        "servisinde aranarak koordinata dönüştürülür; tatbikatta coğrafi kodlama çağrılmaz (Bölüm 4.5).")
    # Tablo 7: fiili guven esigi
    t7 = doc.tables[7]
    for row in t7.rows[1:]:
        D.hucre_yaz(row.cells[3], '0,25 (fiilî; kodda 0,20)')
    # Tablo 16: tatbikatta kullanilmayan acil cagri satiri
    t16 = doc.tables[16]
    for row in list(t16.rows):
        if row.cells[0].text.startswith('Acil çağrı'):
            row._tr.getparent().remove(row._tr)
            D.log.append("SATIR- Tablo 16 acil cagri")
    # "esas alinan" etiketi: SegFormer-B4 isletim modelinin mimarisidir
    for ti in (6, 13):
        for row in doc.tables[ti].rows:
            c = row.cells[0]
            if '(esas alınan)' in c.text:
                D.hucre_yaz(c, c.text.replace('(esas alınan)', '(işletim modelinin mimarisi)'))
