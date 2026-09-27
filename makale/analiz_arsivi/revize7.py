# -*- coding: utf-8 -*-
"""Revizyon 7: metin kanali -- J-111/J-116 duzeltmesi sonrasi.

Kaynak olcum: QuakeMindBackend/benchmark/reports/kanal_olcumu_metin_duzeltilmis.json
(araclar_kanal_olc.py --yalniz-metin, 27 Eylul 2026, duzeltilmis classify_detay).
Dokunulanlar: Bolum 3.6 (normallestirme, karar sirasi, kurtarma katmani, NER
paragrafi, Tablo 8 dipnotu), Bolum 3.9 atama ornegi, Bolum 4.5 kanal olcumleri
+ metin egilimi + Tablo 14, Bolum 5.3(c), Bolum 6 gelecek isler.
"""
import shutil
import sys

sys.path.insert(0, r"C:\Users\utkuc\AppData\Local\Temp\claude\D--quakemind-final-QuakeMind\4779ac37-74b5-4aeb-8690-74d7792eedc5\scratchpad")
from docx import Document
from yardimci import Duzenleyici

SRC = r"D:\quakemind_final\QuakeMind\makale\arsiv\QuakeMind_Makale_YEDEK_pre_revize7_2026-09-27.docx"
DST = r"D:\quakemind_final\QuakeMind\makale\QuakeMind_Makale_Taslak_2026-09-16_sekillieklendi_v3_LOCAL_2026-09-21.docx"
shutil.copyfile(SRC, DST)
doc = Document(DST)
D = Duzenleyici(doc)


def govde_yaz(sub, yeni):
    """Kalin baslik run'i + govde: baslik korunur, govde tek run olur."""
    p = D.bul(sub)
    rs = p.runs
    assert rs[0].bold and len(rs) >= 2, sub
    rs[1].text = yeni
    rs[1].bold = False
    for r in rs[2:]:
        r._element.getparent().remove(r._element)
    D.log.append("GOVDE " + sub[:40])


# --- Bolum 3.6, birinci asama: siniflandirici kucuk harfli metin GORMUYOR ---
govde_yaz("Birinci aşama — metin normalleştirme.",
          " Türkçe sondan eklemeli bir dil olduğundan, yüzey biçimleri sözlük tabanlı eşlemeyi kırar. "
          "Önceki sürümde hatta çağrılan kök/ek ayrıştırıcının (Zemberek) çıktısı ne sınıflandırıcıya ne de "
          "anahtar sözcük kurallarına aktarılmadığından çağrı bu sürümde kaldırılmıştır. Normalleştirme "
          "bağlantıların, kullanıcı adlarının ve noktalamanın çıkarılmasından ibarettir; büyük/küçük harf "
          "korunur, çünkü kullanılan BERTurk ayrıştırıcısı harf büyüklüğüne duyarlıdır. Küçük harfe çevirme "
          "yalnız anahtar sözcük eşleşmesinde ve Türkçeye duyarlı biçimde ('I' → 'ı', 'İ' → 'i') yapılır.")

# --- Bolum 3.6, ikinci asama: karar sirasi ---
govde_yaz("İkinci aşama — sınıflandırma.",
          " BERTurk [32] tabanlı bir metin sınıflandırıcı, 13 alt kategori için sigmoid çıkışlı çok etiketli "
          "bir kurguda skor üretir; sevk hattı bu skorlardan en yüksek olanın etiketini alır. Alt kategoriler, "
          "sevk mantığının kullandığı beş üst kategoriye eşlenir (Tablo 8). Karar sırası şöyledir. En yüksek "
          "skor 0,30 veya üzerindeyse ve etiket \"Alakasız\" değilse modelin etiketi eşlenir. Model kararsızsa "
          "(en yüksek skor 0,30'un altında) ya da \"Alakasız\" diyorsa bir anahtar sözcük kurtarma katmanı "
          "devreye girer: metin dört kategoriden (Acil Yardım İhtiyacı, Enkaz Bildirimi, Lojistik İhtiyaç "
          "Bildirimi, Yol Kapanma Bilgisi) birine ait bir anahtar sözcük içeriyorsa kayıt o kategoriye atanır; "
          "birden çok kategori eşleşirse bu sıra (hayati önem sırası) esas alınır. Kurtarılamayan kararsız "
          "kayıt \"Belirsiz\" kategorisine atanır; bu durumda varlık ismi tanıma ve coğrafi kodlama yine "
          "çalıştırılır ve kayıt düşük aciliyet düzeyiyle sevk zincirine aktarılır. Kurtarılamayan ve modelin "
          "\"Alakasız\" dediği kayıt zincirden düşer. Gösterilen güven, gösterilen üst kategoriye eşlenen alt "
          "etiketlerin en yüksek skorudur. Bu tasarımın sonuçları Bölüm 4.5 ve Bölüm 5.3(c)'de "
          "tartışılmaktadır.")

# --- Bolum 3.6: kurtarma katmaninin ilk hali ve duzeltmesi ---
D.degistir("Ancak bu genişletme yeni bir sorun doğurmuştur: kurtarma katmanı modelin kararından önce ve koşulsuz "
           "çalıştığı için modelin yüksek güvenle verdiği doğru etiketi ezebilmekte, iki harfli anahtar sözcükler "
           "(\"aç\") alt dizgi olarak \"araç\" veya \"ilaç\" gibi sözcüklerde de eşleşmekte ve döndürülen güven "
           "değeri gösterilen kategoriye ait olmamaktadır. Bu durumun ölçülen etkisi Bölüm 4.5'te verilmektedir.",
           "Bu genişletmenin ilk hâli yeni bir sorun doğurmuştu: kurtarma katmanı modelin kararından önce ve "
           "koşulsuz çalıştığı için modelin yüksek güvenle verdiği etiketi ezebiliyor, iki harfli anahtar "
           "sözcükler (\"aç\") alt dizgi olarak \"araç\" veya \"ilaç\" gibi sözcüklerde de eşleşiyor ve döndürülen "
           "güven değeri gösterilen kategoriye ait olmuyordu. Bu sürümde katman yukarıdaki karar sırasına "
           "getirilmiş, eşleşme sözcük sınırına bağlanmış (dört harften kısa anahtar sözcükler yalnız tam sözcük "
           "olarak, daha uzunları sözcük başından eşleşir; \"aç\" yerine \"aç kaldık\" gibi kalıp ifadeler "
           "kullanılır) ve Türkçe harf dönüşümü düzeltilmiştir. Düzeltmeden önceki ve sonraki ölçülen etki "
           "Bölüm 4.5'te verilmektedir.")

# --- Bolum 3.6, ucuncu asama: NER ile siniflandirici AYNI metni alir ---
D.degistir("Metin, hattın iki aşamasına iki ayrı biçimde girer: varlık ismi tanıma için büyük ve küçük harf "
           "bilgisi korunur, sınıflandırma için ayrı bir normalleştirilmiş sürüm üretilir.",
           "Varlık ismi tanıma ve sınıflandırıcı aynı, büyük/küçük harf bilgisi korunmuş temiz metni kullanır; "
           "küçük harfe çevirme yalnız anahtar sözcük eşleşmesinde yapılır.")

# --- Tablo 8 dipnotu: Lojistik dali artik calisiyor ---
D.yaz("* \"Lojistik\" alt kategorisi, metinde ulaşım alanına ait",
      "* Model \"Lojistik\" alt kategorisini verdiğinde metinde ulaşım alanına ait bir anahtar sözcük varsa kayıt "
      "\"Yol Kapanma Bilgisi / Lojistik\"e (aciliyet 3), yoksa \"Lojistik İhtiyaç Bildirimi\"ne (aciliyet 2) "
      "atanır. Toplam alt kategori sayısı 13'tür.")

# --- Bolum 3.9 atama kurali: ornek cumlenin GERCEK sinifi ---
D.degistir("\"bina yan yattı, içeride üç kişi var, hilti ve jeneratör lazım\" gibi bir ihbar doğru biçimde lojistik "
           "ihtiyaç olarak sınıflandırılır, ancak oraya gitmesi gereken ekip arama-kurtarma ekibidir.",
           "\"bina yan yattı, içeride üç kişi var, hilti ve jeneratör lazım\" ihbarına sınıflandırıcı ekipman "
           "ihtiyacını yansıtan \"Elektrik Kaynağı\" alt etiketini vermektedir (üst kategori Acil Yardım İhtiyacı, "
           "rol medikal), ancak oraya gitmesi gereken ekip arama-kurtarma ekibidir.")
# ayni paragrafta kalin run kelime ortasinda bitiyordu ("...hedeflenen ekip rol|belirlenir")
p204 = D.bul("Atama kuralı. Tasarımda atama her ilçe")
r0 = p204.runs[0]
bas = "Atama kuralı."
geri = r0.text[len(bas):]
r0.text = bas
import copy
yeni = copy.deepcopy(r0._element)
r0._element.addnext(yeni)
from docx.text.run import Run
r_yeni = Run(yeni, p204)
r_yeni.text = geri
r_yeni.bold = False
D.log.append("KALIN 3.9 Atama kurali: yalniz baslik kalin")

# --- Bolum 4.5 kanal olcumleri ---
D.degistir("Metin kanalında 18 ihbar metninin sınıflandırma medyanı 36,6 ms, en uzunu 43,0 ms'dir; metinlerin dokuzu "
           "yazarın niyetiyle örtüşmüş, örtüşmeyen dokuzun sekizi yüksek güvenle 'Acil Yardım İhtiyacı' sınıfına "
           "kaymıştır.",
           "Metin kanalında 18 ihbar metninin sınıflandırma medyanı 36,6 ms, en uzunu 43,0 ms'dir (gecikme, "
           "sınıflandırma katmanı düzeltilmeden önce ölçülmüştür; Bölüm 3.6); düzeltilmiş katmanla metinlerin on "
           "biri yazarın niyetiyle örtüşmüş (düzeltmeden önce dokuzu), örtüşmeyen yedisinin dördü 'Acil Yardım "
           "İhtiyacı', üçü 'Enkaz Bildirimi' sınıfına gitmiştir.")

govde_yaz("Metin kanalında bir eğilim gözlenmiştir.",
          " On sekiz ihbar metninden on biri yazarın niyetiyle örtüşmüştür. Bu bir doğruluk ölçüsü değildir "
          "('beklenen' etiket tek kişinin yargısıdır ve 'Enkaz Bildirimi' ile 'Acil Yardım İhtiyacı' sınırı "
          "gerçekten bulanıktır). Sınıflandırma katmanının ilk hâlinde örtüşme 9/18'di ve on sekiz çıktının on "
          "ikisini model değil anahtar sözcük kurtarma katmanı belirliyordu (Bölüm 3.6); katman düzeltildikten "
          "sonra kararların on beşini model, üçünü kurtarma katmanı vermektedir. Örtüşmeyen yedi metnin üçünde "
          "model ihtiyaç tipine ait bir alt etiket vermiş (\"su ve bebek maması\" için Yemek, \"soba ve yakacak\" "
          "için Isınma, \"jeneratör ve aydınlatma\" için Arama Ekipmanı), eşleme ise bu alt etiketleri Acil "
          "Yardım'a bağlamıştır (Tablo 8); yazar üçünü de lojistik ihtiyaç olarak etiketlemiştir. Üçünde model "
          "\"Enkaz Kaldırma\" demiştir: enkaz altındaki bir yakınını bildiren, kanaması durmayan bir yaralıyı "
          "bildiren ve çökmüş duvarın kapattığı bir caddeyi bildiren metinler. Kalan birinde, ambulansın "
          "giremediği bir sokağı bildiren metin kurtarma katmanında önceliği yüksek \"ambulans\" sözcüğüyle Acil "
          "Yardım'a atanmıştır. Dikkat çekici bir bulgu, modelin dört yol kapanması metninin hiçbirini ulaşım "
          "etiketiyle tanımamasıdır: üçüne \"Alakasız\" (skor 0,58–0,65), birine \"Enkaz Kaldırma\" demiştir; üç "
          "metin ancak kurtarma katmanı sayesinde zincirde kalmıştır. Yol kapanması bilgisi bu hatta bugün "
          "modelden değil anahtar sözcüklerden gelmektedir. Modelin 13 etiketli ham çıktısının başarımı bu "
          "ölçümle değerlendirilemez; F₁ iddiası için 13 etiket düzeyinde etiketli bir küme gereklidir.")

# --- Tablo 14 ---
t14 = [t for t in doc.tables if t.rows[0].cells[0].text == "Kanal" and len(t.columns) == 7][0]
for row in t14.rows:
    if row.cells[0].text == "Türkçe metin":
        D.hucre_yaz(row.cells[5], "yazar niyetiyle 11/18 (düzeltme öncesi 9/18)")
        D.hucre_yaz(row.cells[6], "doğruluk değil; etiketli küme gerekir; gecikme düzeltme öncesi ölçüldü")
        D.log.append("TABLO 14 metin satiri")

# --- Bolum 5.3(c) ---
D.yaz("(c) Metin kanalında 13 alt kategoriyi beş üst kategoriye indiren katman",
      "(c) Metin kanalında 13 alt kategoriyi beş üst kategoriye indiren katman, ilk hâlinde modelin çıktısını "
      "bozuyordu: anahtar sözcük kurtarması modelin kararından önce çalışıp onu koşulsuz eziyor, iki harfli "
      "anahtar sözcükler alt dizgi olarak başka sözcüklerde de eşleşiyor ve gösterilen güven değeri gösterilen "
      "kategoriye ait olmuyordu (tatbikatta on sekiz çıktının on ikisini anahtar sözcük belirliyordu). Katman "
      "düzeltildikten sonra kararların on beşini model vermekte, örtüşme 9/18'den 11/18'e çıkmaktadır (Bölüm "
      "4.5). Kalan ayrılıkların kaynağı artık katman değil, eşleme tasarımı (Yemek, Isınma ve Arama Ekipmanı "
      "alt etiketlerinin Acil Yardım'a bağlanması) ve modelin kendisidir; özellikle model yol kapanması "
      "metinlerini ulaşım etiketiyle tanımamakta, bu bilgi bugün yalnız anahtar sözcük kurtarmasından "
      "gelmektedir. Sınıflandırıcının beş üst kategori üzerindeki kesinlik, duyarlılık ve F₁ değerleri henüz "
      "ölçülmemiştir.")

# --- Bolum 6 gelecek isler ---
D.degistir("mAP ve F₁ cinsinden ölçülmesi ve metin sınıflandırmadaki anahtar sözcük kurtarma katmanının modelin "
           "kararını ezmeyecek biçimde düzeltilmesidir.",
           "mAP ve F₁ cinsinden ölçülmesi, 13 alt kategoriyi beş üst kategoriye indiren eşlemenin (Tablo 8) aynı "
           "etiketli kümeyle sınanması ve yol kapanması ihbarlarının anahtar sözcük yerine modelden "
           "tanınabilmesi için eğitim kümesinin genişletilmesidir.")

# --- Bolum 6 sonuc paragrafi ---
D.degistir("Metin kanalında anahtar sözcük kurtarma katmanının modelin kararını ezdiği gözlenmiştir; bu, kanal "
           "çeşitliliğinin ve katmanlar arası denetimin bir emniyet gereksinimi olduğunu düşündürmektedir.",
           "Metin kanalında anahtar sözcük kurtarma katmanının modelin kararını ezdiği gözlenmiş ve katman "
           "düzeltilmiştir (örtüşme 9/18'den 11/18'e); düzeltmeden sonra da yol kapanması bilgisinin modelden "
           "değil anahtar sözcüklerden geldiği görülmüştür. Bu, kanal çeşitliliğinin ve katmanlar arası "
           "denetimin bir emniyet gereksinimi olduğunu düşündürmektedir.")

# --- Denklem (8) metinde numarasiyla anilmiyordu (diger 16 denklem aniliyor) ---
D.degistir("Burada w(e) kenarın metre cinsinden uzunluğu", "Denklem (8)'de w(e) kenarın metre cinsinden uzunluğu")

doc.save(DST)
print("\n".join(D.log))
