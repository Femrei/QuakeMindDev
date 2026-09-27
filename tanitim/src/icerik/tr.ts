import type { SiteIcerik } from './tipler'

/* Kural 1 ve 8: bu sayfadaki her sayı ölçülmüş bir koşumdan gelir ve yanında
   hangi koşulda ölçüldüğü yazar. Ölçülmemiş hiçbir iddia sayfaya girmez.
   Kaynak: PROJE_DOSYASI.md §6 (ölçülen sonuçlar) ve §9 (kanıt durumu). */

export const tr: SiteIcerik = {
  site: {
    ad: 'QuakeMind',
    unvan: 'QuakeMind — deprem sonrası karar destek platformu',
    aciklama:
      'QuakeMind, uydu görüntüsünden çıkan hasar bilgisini vatandaş çağrılarıyla tek haritada birleştirir, kapalı yolları hesaba katan güzergâhı çıkarır ve ekip sevkini destekler.',
  },

  menu: [
    { ad: 'Sorun', hedef: '#sorun' },
    { ad: 'Nasıl çalışır', hedef: '#nasil' },
    { ad: 'Ekranlar', hedef: '#ekranlar' },
    { ad: 'Ölçülenler', hedef: '#olcumler' },
    { ad: 'Kimler için', hedef: '#kimler' },
    { ad: 'Proje', hedef: '#proje' },
  ],

  hero: {
    rozet: 'TÜBİTAK 2209-A araştırma projesi',
    baslik: 'Hasar nerede, oraya nasıl gidilir?',
    altBaslik:
      'QuakeMind bu iki soruyu tek ekranda birleştirir: uydudan çıkan hasar haritası, yol ağındaki kapanmalar ve vatandaştan gelen çağrılar aynı katmanda toplanır; ekip, kapalı yolları hesaba katan güzergâhla yönlendirilir.',
    dugmeler: [
      { ad: 'Nasıl çalışır', hedef: '#nasil', birincil: true },
      { ad: 'Ölçülen sonuçlar', hedef: '#olcumler' },
    ],
    kaynakNotu:
      '6 Şubat 2023 Kahramanmaraş depremlerinin gerçek verisiyle geliştirildi: Hatay ve Kahramanmaraş, dokuz operasyon bölgesi.',
  },

  sorun: {
    baslik: 'Afetin ilk saatlerinde bilgi var, karar yok',
    giris:
      'Müdahalede iki bilgi aynı anda gerekir: nerede hasar var ve oraya nasıl ulaşılır. Bugün bu ikisi ayrı ayrı çözülüyor; birleştirme işi kriz masasındaki insana kalıyor.',
    maddeler: [
      {
        baslik: 'Hasar haritası ayrı, yol bilgisi ayrı',
        metin:
          'Hasar tespiti bir maskede veya raporda kalır; hangi yolun kapandığı çoğu zaman elle işlenir. İki katman birleşmeden görev planlanamaz.',
      },
      {
        baslik: 'Çağrılar ortak bir ölçüye girmiyor',
        metin:
          'Telefon, metin ve saha bildirimi farklı yerlerde birikir. Hangi çağrıya önce gidileceğini belirleyen ortak bir aciliyet ölçüsü yoktur.',
      },
      {
        baslik: 'Sessiz bölgeler gözden kaçıyor',
        metin:
          'Uydu yıkım gösterdiği hâlde oradan hiç çağrı gelmiyorsa, orası kimsenin haber veremediği yerdir. Bu soru bugün haritaya sorulamıyor.',
      },
    ],
  },

  nasil: {
    baslik: 'Tek zincir: görüntüden ekip sevkine',
    giris:
      'QuakeMind, hasar tespitini ve güzergâh planlamasını aynı zincire bağlar. Zincirin dönüm noktası, hasar bilgisini yol ağının üstüne bir kapanma katmanı olarak yazmaktır.',
    adimlar: [
      {
        baslik: 'Uydudan hasar bölütlemesi',
        metin:
          'Afet sonrası görüntü karolara bölünür, hasarlı alanlar maske olarak çıkarılır; karo sınırlarındaki dikişler ağırlıklı harmanlamayla giderilir.',
      },
      {
        baslik: 'Yol ağına kapanma katmanı',
        metin:
          'Hasar maskesi yol çizgesiyle kesiştirilir: hangi segmentin geçilemez olduğu veriye dayanarak işaretlenir. Zincirin dönüm noktası budur.',
      },
      {
        baslik: 'Kapanma-farkında güzergâh',
        metin:
          'Rota, kapalı segmentler çizgeden çıkarılmış hâldeki ağ üzerinde hesaplanır. Ekip, gittiği yolda kapanmayla karşılaşıp geri dönmez.',
      },
      {
        baslik: 'Ekip sevki ve takip',
        metin:
          'Çağrı en yakın uygun ekibe atanır, aynı çağrıya ikinci ekip gönderilmesi engellenir, durum tek ekrandan izlenir.',
      },
    ],
    kanallar: [
      {
        baslik: 'Yer seviyesi görüntü',
        metin:
          'Saha fotoğraflarında çatlak ve yapı hasarı tespiti; afet ortamında gözden kaçan hasarın maliyeti yanlış alarmdan yüksek olduğu için eşik duyarlılık lehine ayarlanır.',
      },
      {
        baslik: 'Türkçe metin ihbarı',
        metin:
          'Türkçe çağrı ve ihbar metinleri sınıflandırılır, adres ve konum ifadeleri çıkarılır, aciliyet türetilir.',
      },
    ],
    sozlesme:
      'Dört kaynağın çıktısı da tek biçime iner — konum, hasar/aciliyet skoru, güven, zaman, kaynak — ve aynı mekânsal veritabanında toplanır. Ekran modellere değil bu biçime bağlıdır; yeni bir kaynak eklemek ekranı değiştirmez.',
  },

  ekranlar: {
    baslik: 'Komuta konsolu',
    giris:
      'Tek harita, sayfalar yerine modlar: genel durum, SOS kuyruğu, yol ve rota. Mod değişince harita yerinde kalır; yalnız paneller ve açık katmanlar değişir.',
    ogeler: [
      {
        baslik: 'Genel durum',
        metin:
          'Dört kaynağın yoğunluğu tek haritada karışır. Ağırlıkları değiştirerek haritaya soru sorulur: "yalnız çağrılar", "sessiz bölgeler".',
        gorsel: null,
        etiket: 'ekran görüntüsü eklenecek',
      },
      {
        baslik: 'SOS kuyruğu',
        metin:
          'Bekleyen çağrılar aciliyet ve ekip durumuna göre sıralanır; seçilen çağrı haritada gösterilir, en yakın ekip hesaplanır.',
        gorsel: null,
        etiket: 'ekran görüntüsü eklenecek',
      },
      {
        baslik: 'Yol ve rota',
        metin:
          'Kapalı yollar ve ekibin geçebileceği güzergâh. Zaman aralığı değişince kapanma durumu da değişir.',
        gorsel: null,
        etiket: 'ekran görüntüsü eklenecek',
      },
    ],
  },

  olcumler: {
    baslik: 'Ölçülen sonuçlar',
    giris:
      'Aşağıdaki sayıların hepsi koşulmuş bir deneyden gelir; her kartın altında hangi koşulda ölçüldüğü yazar. Ölçülmemiş hiçbir iddia bu sayfada yer almaz.',
    kartlar: [
      {
        deger: '18/18',
        etiket: 'görev ataması başarılı',
        kosul: 'Uçtan uca senaryo koşumu: 9 operasyon bölgesi, 18 afetzede, 18 ekip.',
      },
      {
        deger: '9/9',
        etiket: 'mükerrer sevk engellendi',
        kosul: 'Aynı çağrıya ikinci ekip gönderme denemesi sunucu tarafında reddedildi.',
      },
      {
        deger: '74,4 dk',
        etiket: 'güzergâh kazancı (parametreden bağımsız)',
        kosul:
          'Kapanma-farkında planlayıcı ile kapanma-bilgisiz ajanın karşılaştırması; senaryo parametresine bağlı kısım bu sayının dışında tutuldu.',
      },
      {
        deger: '0,82',
        etiket: 'Türkçe ihbar sınıflandırma (mikro-F₁)',
        kosul: 'BERTurk, sekiz model karşılaştırması, n = 305, çok etiketli, eşik 0,50.',
      },
      {
        deger: '0,85',
        etiket: 'risk sıralaması (ROC-AUC)',
        kosul:
          'CatBoost, yedi model karşılaştırması, n = 454, beş katlı ileri yürüyen bölme (± 0,09).',
      },
      {
        deger: '0,37',
        etiket: 'bina hasarı bölütlemesi (IoU)',
        kosul: 'Beş mimari karşılaştırması, ayrılmış test kümesi, 512 px karo, tek tohum.',
      },
    ],
    dipnot:
      'Gerçek veriyle çalışan prototipte Antakya için 4.545 yol, 3.686 yapı ve 73 hasarlı yol segmenti işlendi (Copernicus EMS EMSR648); 492 gerçek deprem kaydı ve 90 AFAD toplanma alanı haritaya bindi. Senaryodaki çağrılar ve ekipler gerçek çağrı değildir; ekranda da "senaryo verisi" diye etiketlidir.',
  },

  durustluk: {
    baslik: 'Neyi henüz ölçmedik',
    giris:
      'Bir karar destek sisteminde ölçülmemiş iddia, yanlış iddiadan daha tehlikelidir. Açık olan noktalar şunlar:',
    maddeler: [
      'Yol hasarı bölütlemesinin başarımı ölçülmedi: etiketli yol hasarı veri kümesi elimizde yok.',
      'Yer seviyesi tespit modellerinin mAP değeri henüz koşulmadı; ölçülen tek şey çıkarım gecikmesi.',
      'Mimariler arası farklar tek tohumla ölçüldü; farkların varyans içinde kalıp kalmadığı bilinmiyor.',
      'Bir bölgede öğrenilenin başka bölgeye taşınıp taşınmadığı ölçülmedi.',
      'Güzergâh karşılaştırmasındaki büyük süre farkının çoğu bir senaryo parametresinden gelir; bu yüzden yukarıda yalnız parametreden bağımsız kazanç verilmiştir.',
    ],
  },

  kimler: {
    baslik: 'Kimin işine yarar',
    giris: 'Üç farklı kullanıcı, üç farklı ekran. Herkes yalnız işine yarayanı görür.',
    roller: [
      {
        baslik: 'Kriz masası / koordinatör',
        metin: 'Bölgenin bütün durumu tek haritada.',
        maddeler: [
          'Hasarın nerede yoğunlaştığı',
          'Bekleyen çağrılar ve öncelik sırası',
          'Hangi yolların kapalı olduğu',
          'Sessiz bölgeler: hasar var, çağrı yok',
        ],
      },
      {
        baslik: 'Saha ekibi',
        metin: 'Görev, güzergâh ve durum bildirimi.',
        maddeler: [
          'Atanan çağrı ve konumu',
          'Kapalı yolları atlayan güzergâh',
          'Sahadan fotoğrafla hasar bildirimi',
        ],
      },
      {
        baslik: 'Afetzede / vatandaş',
        metin: 'Hafif ve tek amaçlı ekran.',
        maddeler: [
          'Konumla birlikte yardım çağrısı',
          'En yakın toplanma alanı',
          'Oraya giden açık yol',
        ],
      },
    ],
  },

  proje: {
    baslik: 'Proje',
    giris:
      'QuakeMind bir araştırma projesidir; TÜBİTAK 2209-A Üniversite Öğrencileri Araştırma Projeleri Destek Programı kapsamında yürütülmektedir.',
    kunye: [
      { etiket: 'Program', deger: 'TÜBİTAK 2209-A' },
      { etiket: 'Kurum', deger: 'KTO Karatay Üniversitesi, Konya' },
      { etiket: 'Yürütücüler', deger: 'Furkan Emre İnce · Utku Ceylan' },
      { etiket: 'Danışman', deger: 'Dr. Öğr. Üyesi Esra Uray' },
      {
        etiket: 'Çalışma alanı',
        deger: '6 Şubat 2023 Kahramanmaraş depremleri — Hatay ve Kahramanmaraş',
      },
    ],
    durum:
      'Sistem geliştirme aşamasındadır. Ölçülen sonuçlar yukarıda; ölçülmemiş noktalar da aynı sayfada açıkça yazılıdır.',
  },

  altbilgi: {
    hak: 'QuakeMind — TÜBİTAK 2209-A araştırma projesi',
    not: 'Sayfadaki bütün sayılar koşulmuş deneylerden gelir; koşulun kendisi sayının yanında yazar.',
  },
}
