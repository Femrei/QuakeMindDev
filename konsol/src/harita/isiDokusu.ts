import type { IsiIzgarasi } from '@/veri/sorgular'
import { KANAL_BILGI, type KanalId } from '@/durum/konsolDurumu'
import { tokenRenk } from './tokenRenk'

/* ---------------------------------------------------------------------------
   Isı dokusu: kanal ızgaralarını ağırlıklarla karıştırıp tek bir görüntüye
   çevirir (MIMARI §5).

   · Sunucu her kanalın ızgarasını AYRI üretir; karışım burada yapılır, bu
     yüzden ağırlık değişince sunucuya istek gitmez.
   · İstemci ikinci kez bulanıklaştırma YAPMAZ; gelen değer olduğu gibi
     renklendirilir. Bulanıklık tanımı sunucuda kalır.
   · Negatif ağırlık desteklenir: "uydu yıkık gösteriyor ama çağrı yok"
     sorusu böyle sorulur.

   Renk ve koyuluk ayrı şey söyler (J-175):
   · RENK = hangi kaynak. Hücrenin rengi, katkı veren kaynakların renklerinin
     katkı oranıyla karışımıdır; tek kaynaklı yer o kaynağın saf rengindedir.
     Eskiden dört kaynak toplanıp tek mor-sarı skalayla boyanıyordu: hangi
     rengin nereden geldiği okunmuyordu.
   · KOYULUK = ne kadar. Saydamlık mutlak yoğunluktan gelir (sunucu referansı:
     1,0 ≈ aynı yerde 3 birim ağırlıklı bildirim). Tek bildirim soluk kalır.
     Eskiden en düşük değer bile koyu ve opak boyanıyordu; üç bildirim bütün
     şehir merkezini "yoğun hasar" gibi gösteriyordu.
--------------------------------------------------------------------------- */

/** Bu yoğunluğun altı çizilmez: tek bildirimin uzak kuyruğu zemini boyamasın. */
const ESIK = 0.08
/** Tam yoğunlukta saydamlık (0-255). Zemin ve simgeler okunur kalsın. */
const ALFA_EN_COK = 215
/** Koyuluk eğrisi: doğrusal. 1'in altı düşük yoğunluğu öne çıkarır ve az
    bildirimi geniş, koyu bir leke gibi gösteriyordu (J-175; tarayıcıda gözle seçildi). */
const ALFA_US = 1

const KANAL_RENK: Record<KanalId, `--color-${string}`> = {
  sat: '--color-ch-sat',
  sos: '--color-ch-sos',
  cam: '--color-ch-cam',
  nlp: '--color-ch-nlp',
}

export type KanalIzgarasi = { kanal: KanalId; veri: IsiIzgarasi | undefined; agirlik: number }

export type IsiHucresi = {
  /** Karışık yoğunluk, 0-1 (mutlak ölçek). */
  yogunluk: number
  /** Pozitif katkıların payı, büyükten küçüğe. */
  paylar: Array<{ kanal: KanalId; pay: number }>
  /** Bu hücrede "Çıkar" ağırlıklı kaynakların düşürdüğü miktar (0 değilse). */
  dusulen: number
}

export type IsiDokusu = {
  goruntu: ImageData
  sinirlar: [number, number, number, number]
  /** Karışıma giren kanal sayısı ve toplam nokta (panelde yazmak için). */
  kanalSayisi: number
  noktaSayisi: number
  /** Görüntü pikselindeki (x sağa, y aşağı) hücrenin dökümü; çizilmeyen hücrede null. */
  hucre: (x: number, y: number) => IsiHucresi | null
  boyut: number
}

/** Seyrek [lat, lon, değer] listesini ızgara dizisine açar (güneyden kuzeye). */
function izgaraya(veri: IsiIzgarasi, boyut: number): Float32Array {
  const { west, south, east, north } = veri.bounds
  const izgara = new Float32Array(boyut * boyut)
  const lonAdim = (east - west) / (boyut - 1)
  const latAdim = (north - south) / (boyut - 1)
  for (const [lat, lon, deger] of veri.points) {
    const x = Math.round((lon - west) / lonAdim)
    const y = Math.round((lat - south) / latAdim)
    if (x < 0 || y < 0 || x >= boyut || y >= boyut) continue
    izgara[y * boyut + x] = deger
  }
  return izgara
}

export function isiDokusuKur(kanallar: KanalIzgarasi[], boyut = 100): IsiDokusu | null {
  const etkin = kanallar.filter((k) => k.veri && k.veri.points.length > 0 && Math.abs(k.agirlik) >= 0.05)
  if (!etkin.length) return null

  const { west, south, east, north } = etkin[0].veri!.bounds
  const izgaralar = etkin.map((k) => ({
    kanal: k.kanal,
    agirlik: k.agirlik,
    deger: izgaraya(k.veri!, boyut),
    rgb: tokenRenk(KANAL_RENK[k.kanal]),
  }))
  const noktaSayisi = etkin.reduce((n, k) => n + (k.agirlik > 0 ? k.veri!.generatedFrom.totalReports : 0), 0)

  const goruntu = new ImageData(boyut, boyut)
  const d = goruntu.data
  for (let y = 0; y < boyut; y++) {
    // Sunucu ızgarası güneyden kuzeye; görüntü kuzeyden güneye.
    const satir = (boyut - 1 - y) * boyut
    for (let x = 0; x < boyut; x++) {
      const h = satir + x
      let arti = 0
      let eksi = 0
      let r = 0
      let g = 0
      let b = 0
      for (const k of izgaralar) {
        const v = k.deger[h]
        if (v === 0) continue
        if (k.agirlik > 0) {
          const katki = k.agirlik * v
          arti += katki
          r += katki * k.rgb[0]
          g += katki * k.rgb[1]
          b += katki * k.rgb[2]
        } else {
          eksi += -k.agirlik * v
        }
      }
      const yogunluk = Math.min(1, arti - eksi)
      if (arti <= 0 || yogunluk < ESIK) continue
      const i = (y * boyut + x) * 4
      d[i] = r / arti
      d[i + 1] = g / arti
      d[i + 2] = b / arti
      d[i + 3] = ALFA_EN_COK * Math.pow(yogunluk, ALFA_US)
    }
  }

  const hucre = (x: number, y: number): IsiHucresi | null => {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    if (xi < 0 || yi < 0 || xi >= boyut || yi >= boyut) return null
    const h = (boyut - 1 - yi) * boyut + xi
    let arti = 0
    let eksi = 0
    const katkilar: Array<{ kanal: KanalId; v: number }> = []
    for (const k of izgaralar) {
      const v = k.deger[h]
      if (v === 0) continue
      if (k.agirlik > 0) {
        arti += k.agirlik * v
        katkilar.push({ kanal: k.kanal, v: k.agirlik * v })
      } else eksi += -k.agirlik * v
    }
    const yogunluk = Math.min(1, arti - eksi)
    if (arti <= 0 || yogunluk < ESIK) return null
    return {
      yogunluk,
      paylar: katkilar.sort((a, b) => b.v - a.v).map((k) => ({ kanal: k.kanal, pay: k.v / arti })),
      dusulen: eksi,
    }
  }

  return {
    goruntu,
    sinirlar: [west, south, east, north],
    kanalSayisi: etkin.length,
    noktaSayisi,
    hucre,
    boyut,
  }
}

/** Bilgi kartı için: "SOS çağrıları %60 · Metin ihbarı %40". */
export function paylarMetni(paylar: IsiHucresi['paylar']): string {
  return paylar
    .filter((p) => p.pay >= 0.05)
    .map((p) => `${KANAL_BILGI[p.kanal].ad} %${Math.round(p.pay * 100)}`)
    .join(' · ')
}
