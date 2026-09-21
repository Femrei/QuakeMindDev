import {
  ScatterplotLayer,
  PathLayer,
  PolygonLayer,
  BitmapLayer,
  SolidPolygonLayer,
  TextLayer,
} from '@deck.gl/layers'
import { CollisionFilterExtension, type CollisionFilterExtensionProps } from '@deck.gl/extensions'
import type { Layer, PickingInfo } from '@deck.gl/core'
import type { KatmanId } from '@/durum/konsolDurumu'
import {
  KAYNAK_ADI,
  ONCELIK_ADI,
  sosEkBilgi,
  type Ekip,
  type HasarNoktasi,
  type SosCagrisi,
} from '@/veri/sorgular'
import type { Kutu, Nokta } from '@/durum/secimDurumu'
import type { Yol } from '@/veri/analiz'
import type { AltlikVerisi, Etiket } from '@/veri/altlik'
import { tarihSaat } from '@/lib/bicim'
import { tokenPx, tokenRenk } from './tokenRenk'

/* Veri katmanları altlıktan belirgin şekilde ayrılır: altlık soğuk ve sönük,
   veri sıcak ve doygun (ARAYUZ §11). Hasar renkleri haritada ve panelde aynıdır. */

const ONCELIK_RENK: Record<SosCagrisi['oncelik'], [number, number, number, number]> = {
  kritik: [255, 92, 92, 240],
  yuksek: [255, 145, 82, 235],
  orta: [242, 193, 78, 225],
}

const KAYNAK_RENK: Record<HasarNoktasi['kaynak'], [number, number, number, number]> = {
  uydu: [69, 200, 224, 220],
  sos: [255, 92, 92, 220],
  kamera: [242, 193, 78, 220],
  metin: [176, 140, 255, 220],
}

/* Altlık yol hiyerarşisi (ARAYUZ §3, §11): renk token dosyasından, genişlik
   prototipte sınanan değerler (metre; en az 0,7 piksel). */
const YOL_RENGI = [
  '--color-map-motorway',
  '--color-map-primary',
  '--color-map-secondary',
  '--color-map-local',
  '--color-map-track',
] as const
const YOL_GENISLIGI_M = [7, 5, 3.4, 2, 1.4]

/* Adlar (J-41): çakışan ad yazılmaz, önceliği yüksek olan kalır (şehir >
   ilçe > köy > mahalle > büyük yol > sokak). Adlar veri katmanlarının üstünde,
   zemin renginde ince bir haleyle yazılır; yine de sönük tondadır (ARAYUZ §11). */
const CAKISMA = new CollisionFilterExtension()

/** Yakınlaştırmaya göre yazılan adlar: -1 yalnız bölge adları, 0 şehir/ilçe,
    1 +köy, 2 +mahalle, 3 +sokak. */
export type EtiketSeviyesi = -1 | 0 | 1 | 2 | 3

function etiketKatmani(id: string, data: Etiket[], boy: number, renk: [number, number, number]) {
  return new TextLayer<Etiket, CollisionFilterExtensionProps<Etiket>>({
    id,
    data,
    getPosition: (d) => [d.lon, d.lat],
    getText: (d) => d.ad,
    getAngle: (d) => d.aci,
    getSize: boy,
    getColor: renk,
    fontFamily: 'IBM Plex Sans, sans-serif',
    fontWeight: 500,
    characterSet: 'auto',
    fontSettings: { sdf: true },
    outlineWidth: 3,
    outlineColor: [...tokenRenk('--color-ground'), 255],
    getTextAnchor: 'middle',
    getAlignmentBaseline: 'center',
    extensions: [CAKISMA],
    collisionGroup: 'adlar',
    getCollisionPriority: (d) => d.oncelik,
    // Çakışma sınaması adı biraz büyük sayar: adlar birbirine yapışmasın.
    collisionTestProps: { sizeScale: 1.3 },
  })
}

function adKatmanlari(
  bolgeler: AltlikVerisi[],
  bolgeAdlari: Etiket[],
  seviye: EtiketSeviyesi,
): Layer[] {
  if (seviye < 0) {
    return [etiketKatmani('ad-bolgeler', bolgeAdlari, tokenPx('--text-title'), tokenRenk('--color-ink'))]
  }
  const L: Layer[] = []
  for (const b of bolgeler) {
    const yerSeviyesi = Math.min(seviye, 2) as 0 | 1 | 2
    L.push(
      etiketKatmani(
        `ad-${b.id}-yer-${yerSeviyesi}`,
        b.yerAdlari[yerSeviyesi],
        tokenPx(yerSeviyesi === 0 ? '--text-subtitle' : '--text-small'),
        tokenRenk(yerSeviyesi === 0 ? '--color-ink' : '--color-ink-2'),
      ),
    )
    if (seviye >= 3) {
      L.push(
        etiketKatmani(
          `ad-${b.id}-sokak`,
          b.sokakAdlari,
          tokenPx('--text-micro'),
          tokenRenk('--color-ink-3'),
        ),
      )
    }
  }
  return L
}

/** Kendi verimizden altlık: su, yapılar, nehirler, yollar — en altta çizilir.
    Yapılar yalnız `yapiGorunur` iken kurulur: uzak yakınlaştırmada seçilmezler,
    ama birkaç bölgenin 300 bini aşan çokgenini üçgenlemek arayüzü dondururdu. */
function altlikKatmanlari(
  bolgeler: AltlikVerisi[],
  k: Record<KatmanId, boolean>,
  yapiGorunur: boolean,
): Layer[] {
  const L: Layer[] = []
  for (const b of bolgeler) {
    L.push(
      new SolidPolygonLayer({
        id: `altlik-${b.id}-su`,
        data: b.su,
        _normalize: false,
        getFillColor: tokenRenk('--color-map-water'),
      }),
    )
    if (k.yapilar && yapiGorunur) {
      L.push(
        new SolidPolygonLayer({
          id: `altlik-${b.id}-yapi`,
          data: b.yapilar,
          _normalize: false,
          getFillColor: tokenRenk('--color-map-building'),
        }),
      )
    }
    L.push(
      new PathLayer({
        id: `altlik-${b.id}-nehir`,
        data: b.nehirler,
        _pathType: 'open',
        getColor: tokenRenk('--color-map-water'),
        getWidth: 8,
        widthUnits: 'meters',
        widthMinPixels: 1.4,
      }),
    )
    if (k.yollar) {
      for (const y of b.yollar) {
        L.push(
          new PathLayer({
            id: `altlik-${b.id}-yol-${y.sinif}`,
            data: y.veri,
            _pathType: 'open',
            getColor: tokenRenk(YOL_RENGI[y.sinif]),
            getWidth: YOL_GENISLIGI_M[y.sinif],
            widthUnits: 'meters',
            widthMinPixels: 0.7,
            widthMaxPixels: 14,
            capRounded: true,
            jointRounded: true,
          }),
        )
      }
    }
  }
  return L
}

export type KatmanGirdisi = {
  katmanlar: Record<KatmanId, boolean>
  /** Görünen bölgelerin altlık paketleri. */
  altlik?: AltlikVerisi[]
  /** Yakınlaştırma yapıların seçilebileceği kadar mı (bkz. altlikKatmanlari). */
  altlikYapiGorunur?: boolean
  /** Uzak yakınlaştırmada yazılan bölge adları (altlık kataloğundan). */
  bolgeAdlari?: Etiket[]
  /** Isı katmanının örtücülüğü; yakınlaştıkça azalır (bkz. KatmanKopru). */
  isiOrtuculugu?: number
  etiketSeviyesi?: EtiketSeviyesi
  hasar: HasarNoktasi[]
  sos: SosCagrisi[]
  ekipler: Ekip[]
  seciliSos: string | null
  /** Bitmiş hasar analizinin yol geometrisi. */
  analiz?: { kapali: Yol[]; acik: Yol[] } | null
  /** Kanalların ağırlıklı karışımından çıkan ısı dokusu. */
  isi?: { goruntu: ImageData; sinirlar: [number, number, number, number] } | null
  /** Analiz alanı seçimi: kesinleşmiş şekil ve çizim sürerken taslak. */
  secim?: {
    kutu: Kutu | null
    cokgen: Nokta[] | null
    taslak: { kutu?: Kutu; nokta?: Nokta[] } | null
  }
}

function kutuHalkasi(k: Kutu): Nokta[] {
  return [
    [k[0], k[1]],
    [k[2], k[1]],
    [k[2], k[3]],
    [k[0], k[3]],
  ]
}

export function katmanlariKur(g: KatmanGirdisi): Layer[] {
  const L: Layer[] = altlikKatmanlari(g.altlik ?? [], g.katmanlar, g.altlikYapiGorunur ?? false)

  // Isı haritası: kanal ızgaraları sunucudan gelir, karışım istemcide yapılır
  // ve doku olarak çizilir. İkinci bir bulanıklaştırma YOK (MIMARI §5).
  if (g.katmanlar.isi && g.isi) {
    L.push(
      new BitmapLayer({
        id: 'isi',
        image: g.isi.goruntu,
        bounds: g.isi.sinirlar,
        opacity: g.isiOrtuculugu ?? 0.72,
        textureParameters: { minFilter: 'linear', magFilter: 'linear' },
      }),
    )
  }


  // Analiz sonucu: önce açık yollar (sönük), sonra kapalı olanlar (kırmızı),
  // böylece kapalı segmentler her zaman üstte kalır.
  if (g.katmanlar.analizSonucu && g.analiz) {
    L.push(
      new PathLayer<Yol>({
        id: 'analiz-acik',
        data: g.analiz.acik,
        getPath: (d) => d,
        getColor: [92, 104, 126, 150],
        getWidth: 2,
        widthUnits: 'pixels',
        widthMinPixels: 1,
        capRounded: true,
        jointRounded: true,
      }),
    )
    L.push(
      new PathLayer<Yol>({
        id: 'analiz-kapali',
        data: g.analiz.kapali,
        getPath: (d) => d,
        // Kapalı yol = kritik durum rengi; panelde de aynı kırmızı kullanılır.
        getColor: [255, 92, 92, 255],
        getWidth: 5,
        widthUnits: 'pixels',
        widthMinPixels: 3,
        capRounded: true,
        jointRounded: true,
        pickable: true,
      }),
    )
  }

  if (g.katmanlar.hasarliYollar) {
    L.push(
      new PathLayer<{ path: [number, number][]; derece: number }>({
        id: 'hasarli-yollar',
        data: [],
        getPath: (d) => d.path,
        getColor: [255, 145, 82, 255],
        getWidth: 4,
        widthUnits: 'pixels',
        widthMinPixels: 2.5,
        capRounded: true,
        pickable: true,
      }),
    )
  }

  // Adlar zeminin, ısının ve yolların üstünde, veri noktalarının altında:
  // bir sokak adı SOS noktasının üstüne binmesin (veri önde, ARAYUZ §11).
  L.push(...adKatmanlari(g.altlik ?? [], g.bolgeAdlari ?? [], g.etiketSeviyesi ?? -1))

  // Hasar noktaları birleşik ısının kaynağıdır; ısıyla birlikte açılır.
  // ("Yapılar" bayrağı artık altlıktaki yapıları çizer.)
  if (g.katmanlar.isi) {
    L.push(
      new ScatterplotLayer<HasarNoktasi>({
        id: 'hasar-noktalari',
        data: g.hasar,
        getPosition: (d) => [d.lon, d.lat],
        getRadius: (d) => 18 + d.skor * 22,
        radiusUnits: 'meters',
        radiusMinPixels: 2.5,
        radiusMaxPixels: 12,
        getFillColor: (d) => KAYNAK_RENK[d.kaynak],
        pickable: true,
      }),
    )
  }

  if (g.katmanlar.ekipler) {
    L.push(
      new ScatterplotLayer<Ekip>({
        id: 'ekipler',
        data: g.ekipler,
        getPosition: (d) => [d.lon, d.lat],
        getRadius: 30,
        radiusMinPixels: 4,
        radiusMaxPixels: 10,
        getFillColor: [69, 200, 224, 235],
        stroked: true,
        lineWidthMinPixels: 1.4,
        getLineColor: [8, 12, 18, 255],
        pickable: true,
      }),
    )
  }

  L.push(
    new ScatterplotLayer<SosCagrisi>({
      id: 'sos',
      data: g.sos,
      getPosition: (d) => [d.lon, d.lat],
      getRadius: (d) => (g.seciliSos === d.id ? 52 : 34),
      radiusUnits: 'meters',
      radiusMinPixels: 4.5,
      radiusMaxPixels: 14,
      getFillColor: (d) => ONCELIK_RENK[d.oncelik],
      stroked: true,
      lineWidthMinPixels: 1.6,
      getLineColor: (d) => (g.seciliSos === d.id ? [232, 236, 244, 255] : [10, 14, 20, 220]),
      updateTriggers: { getRadius: g.seciliSos, getLineColor: g.seciliSos },
      pickable: true,
    }),
  )

  // Seçim şekilleri en üstte: veri katmanlarını gizlemesin diye içi çok soluk,
  // kenarı vurgu renginde.
  const secim = g.secim
  if (secim) {
    const taslakHalka = secim.taslak?.kutu
      ? kutuHalkasi(secim.taslak.kutu)
      : (secim.taslak?.nokta ?? null)
    const kesinHalka = secim.cokgen ?? (secim.kutu ? kutuHalkasi(secim.kutu) : null)
    const halka = taslakHalka ?? kesinHalka

    if (halka && halka.length >= 2) {
      L.push(
        new PolygonLayer<{ halka: Nokta[] }>({
          id: 'secim-alani',
          data: [{ halka }],
          getPolygon: (d) => d.halka,
          filled: true,
          stroked: true,
          getFillColor: [69, 200, 224, 26],
          getLineColor: [69, 200, 224, 235],
          getLineWidth: 2,
          lineWidthUnits: 'pixels',
          lineWidthMinPixels: 2,
        }),
      )
      L.push(
        new ScatterplotLayer<Nokta>({
          id: 'secim-koseleri',
          data: halka,
          getPosition: (d) => d,
          getRadius: 4,
          radiusUnits: 'pixels',
          getFillColor: [232, 236, 244, 255],
          stroked: true,
          lineWidthMinPixels: 1.5,
          getLineColor: [27, 108, 126, 255],
        }),
      )
    }
  }

  return L
}

/* ---- Üstüne gelince bilgi (J-41) -----------------------------------------
   Prototipteki gibi: nokta ne, ne zaman, ne kadar acil. Metin kullanıcıdan
   geldiği için HTML'e kaçırılarak yazılır. */

const SOS_DURUMU: Record<SosCagrisi['durum'], string> = {
  bekliyor: 'Bekliyor',
  atandi: 'Ekip atandı',
  kapandi: 'Kapandı',
}

/** Ekip durumu serbest metin; bilinenler Türkçe adıyla, ötekiler baş harfi büyük. */
const EKIP_DURUMU: Record<string, string> = {
  musait: 'Müsait',
  gorevde: 'Görevde',
  yolda: 'Yolda',
  mola: 'Molada',
}
const ekipDurumu = (d: string) =>
  EKIP_DURUMU[d] ?? d.charAt(0).toLocaleUpperCase('tr') + d.slice(1)

const kacis = (m: string) =>
  m.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

function ipucuKutusu(baslik: string, satirlar: Array<string | null | undefined | false>) {
  const govde = satirlar
    .filter((x): x is string => !!x)
    .map((x) => `<div>${kacis(x)}</div>`)
    .join('')
  return {
    html: `<div class="qm-ipucu"><div class="qm-ipucu-baslik">${kacis(baslik)}</div>${govde}</div>`,
    style: { background: 'transparent', boxShadow: 'none', padding: '0', margin: '0' },
  }
}

export function haritaIpucu({ object, layer }: PickingInfo) {
  if (!object || !layer) return null
  switch (layer.id) {
    case 'sos': {
      const c = object as SosCagrisi
      const ek = sosEkBilgi(c)
      return ipucuKutusu(`${c.id} · ${ONCELIK_ADI[c.oncelik].toLocaleLowerCase('tr')} aciliyet`, [
        `${SOS_DURUMU[c.durum]}${c.ekipId ? ` (${c.ekipId})` : ''}`,
        c.mahalle,
        ek.kisiIhtiyac,
        c.metin,
        ek.yaklasik && ek.konum,
        tarihSaat(c.zaman),
        'Tıkla: seç ve yakınlaş',
      ])
    }
    case 'hasar-noktalari': {
      const h = object as HasarNoktasi
      return ipucuKutusu(KAYNAK_ADI[h.kaynak], [
        `Hasar skoru %${Math.round(h.skor * 100)} · güven %${Math.round(h.guven * 100)}`,
        tarihSaat(h.zaman),
      ])
    }
    case 'ekipler': {
      const e = object as Ekip
      return ipucuKutusu(e.ad, [
        ekipDurumu(e.durum),
        e.gorev,
        e.guncellendi ? `Konum güncellendi: ${tarihSaat(e.guncellendi)}` : null,
      ])
    }
    case 'analiz-kapali':
      return ipucuKutusu('Kapalı yol', ['Uydu analizinden: modelin tahmini, sahada doğrulanmadı.'])
    default:
      return null
  }
}
