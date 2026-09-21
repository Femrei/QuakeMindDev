import { useEffect, useMemo } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { HaritaKabugu, useHarita } from '@/harita/HaritaKabugu'
import { AlanSecici } from '@/harita/AlanSecici'
import { katmanlariKur } from '@/harita/katmanlar'
import { useKonsol } from '@/durum/konsolDurumu'
import { useSecim } from '@/durum/secimDurumu'
import { useAralik } from '@/durum/zamanDurumu'
import { useEkipler, useHasarNoktalari, useIsiIzgarasi, useSosCagrilari } from '@/veri/sorgular'
import { isiDokusuKur } from '@/harita/isiDokusu'
import { KANALLAR } from '@/durum/konsolDurumu'
import { useAnalizSegmentleri } from '@/veri/analiz'
import { sonIsSec, useIsler } from '@/durum/islerDurumu'
import { MODLAR, VARSAYILAN_MOD, modBul } from '@/modlar/modlar'
import { UstCubuk } from './UstCubuk'
import { SolPanel } from './SolPanel'
import { SagPanel } from './SagPanel'
import { ZamanSeridi } from './ZamanSeridi'
import { KomutPaleti } from './KomutPaleti'

/* ---------------------------------------------------------------------------
   Konsol kabuğu: üst çubuk · sol katman paneli · harita · sağ durum paneli ·
   alt zaman şeridi (ARAYUZ §8).

   Harita bu kabukta BİR kez kurulur. Mod değişince kabuk yeniden kurulmaz;
   yalnız panellerin içeriği ve açık katmanlar değişir.
--------------------------------------------------------------------------- */

export function KonsolKabugu() {
  const { mod } = useParams()
  const tanim = modBul(mod)

  if (!tanim) return <Navigate to={`/konsol/${VARSAYILAN_MOD}`} replace />

  return (
    <div className="flex h-full flex-col">
      <UstCubuk />

      <div className="relative flex min-h-0 flex-1 flex-col overflow-auto genis:block genis:overflow-hidden">
        <HaritaKabugu>
          <KatmanKopru />
          <AlanSecici />

          {/* Dar ekranda (<= 980 px) harita üstte, paneller altında dikey sıralanır. */}
          <div className="relative z-10 flex flex-col gap-gutter p-gutter genis:pointer-events-none genis:absolute genis:inset-0 genis:h-full genis:overflow-hidden">
            <div className="flex min-h-0 flex-1 flex-col gap-gutter genis:flex-row genis:items-stretch">
              <div className="genis:pointer-events-auto genis:w-panel-l genis:shrink-0 flex min-h-0">
                <SolPanel mod={tanim.id} />
              </div>
              <div className="hidden flex-1 genis:block" aria-hidden />
              <div className="genis:pointer-events-auto genis:w-panel-r genis:shrink-0 flex min-h-0">
                <SagPanel mod={tanim.id} />
              </div>
            </div>

            <HaritaKunyesi />

            <div className="genis:pointer-events-auto shrink-0">
              <ZamanSeridi />
            </div>
          </div>
        </HaritaKabugu>
      </div>

      <KomutPaleti />
    </div>
  )
}

// Isı ızgarası şimdilik sabit bir bölge için isteniyor; harita kaydırınca
// yeni istek atılmaz (kural 4). Bölge seçimi ilerleyen adımda panelden gelecek.
const ISI_MERKEZI = { lon: 36.161, lat: 36.202 }
const ISI_YARICAP_KM = 10

/** Kaynak künyesi her zaman ekranda durur (ARAYUZ §11). Altlık verisi henüz
    bağlı olmadığı için harita boş; bu da haritanın üstünde açıkça yazar. */
function HaritaKunyesi() {
  return (
    <div className="genis:pointer-events-auto flex shrink-0 justify-center">
      <p className="rounded-control border border-line bg-panel px-2.5 py-1.5 text-small text-ink-3">
        <span className="text-ink-2">Harita altlığı:</span> kendi verimizden çizilecek (OSM +
        Copernicus) — karo ucu henüz bağlı değil, bu yüzden zemin boş.
      </p>
    </div>
  )
}

/** Mod → açık katmanlar; sorgu sonuçları → deck.gl katmanları. */
function KatmanKopru() {
  const { mod } = useParams()
  const tanim = modBul(mod) ?? MODLAR[0]
  const { hazir, katmanlariYaz, ucus } = useHarita()
  const katmanlar = useKonsol((d) => d.katmanlar)
  const seciliKayit = useKonsol((d) => d.seciliKayit)
  const katmanlariAyarla = useKonsol((d) => d.katmanlariAyarla)
  const aralik = useAralik()
  const secimKutusu = useSecim((d) => d.kutu)
  const secimCokgeni = useSecim((d) => d.cokgen)
  const secimTaslagi = useSecim((d) => d.taslak)

  const hasar = useHasarNoktalari(aralik)
  const sos = useSosCagrilari(aralik)
  const ekipler = useEkipler()

  // Isı: her kanalın ızgarası ayrı gelir, karışım istemcide (MIMARI §5).
  const agirliklar = useKonsol((d) => d.agirliklar)
  const isiAcik = katmanlar.isi
  const isiUydu = useIsiIzgarasi(ISI_MERKEZI, ISI_YARICAP_KM, aralik, 'uydu', isiAcik)
  const isiSos = useIsiIzgarasi(ISI_MERKEZI, ISI_YARICAP_KM, aralik, 'sos', isiAcik)
  const isiKamera = useIsiIzgarasi(ISI_MERKEZI, ISI_YARICAP_KM, aralik, 'kamera', isiAcik)
  const isiMetin = useIsiIzgarasi(ISI_MERKEZI, ISI_YARICAP_KM, aralik, 'metin', isiAcik)

  const isiDokusu = useMemo(() => {
    if (!isiAcik) return null
    const kanalVerisi = {
      sat: isiUydu.data,
      sos: isiSos.data,
      cam: isiKamera.data,
      nlp: isiMetin.data,
    }
    return isiDokusuKur(
      KANALLAR.map((k) => ({ kanal: k, veri: kanalVerisi[k], agirlik: agirliklar[k] })),
    )
  }, [isiAcik, isiUydu.data, isiSos.data, isiKamera.data, isiMetin.data, agirliklar])

  // Biten analizin geometrisi: ağır veri ayrı ve önbelleklenebilir uçtan gelir,
  // yalnız iş "bitti" durumuna geçince istenir.
  const is = useIsler(sonIsSec)
  const analizId = is?.durum === 'bitti' && is.isTipi === 'hasar-analizi' ? is.id : null
  const segmentler = useAnalizSegmentleri(analizId)

  // Mod değişince açık katmanlar değişir; harita yerinde kalır.
  useEffect(() => {
    katmanlariAyarla([...tanim.katmanlar])
  }, [tanim, katmanlariAyarla])

  const deckKatmanlari = useMemo(
    () =>
      katmanlariKur({
        katmanlar,
        hasar: hasar.data ?? [],
        sos: sos.data ?? [],
        ekipler: ekipler.data ?? [],
        seciliSos: seciliKayit?.tip === 'sos' ? seciliKayit.id : null,
        secim: { kutu: secimKutusu, cokgen: secimCokgeni, taslak: secimTaslagi },
        analiz: segmentler.data ?? null,
        isi: isiDokusu,
      }),
    [
      katmanlar,
      hasar.data,
      sos.data,
      ekipler.data,
      seciliKayit,
      secimKutusu,
      secimCokgeni,
      secimTaslagi,
      segmentler.data,
      isiDokusu,
    ],
  )

  useEffect(() => {
    if (hazir) katmanlariYaz(deckKatmanlari)
  }, [hazir, deckKatmanlari, katmanlariYaz])

  // Analiz sonucu haritaya bindiğinde o alana git.
  const sinirlar = segmentler.data?.bounds
  useEffect(() => {
    if (!hazir || !sinirlar) return
    ucus((sinirlar.west + sinirlar.east) / 2, (sinirlar.south + sinirlar.north) / 2, 14.5)
  }, [hazir, sinirlar, ucus])

  return null
}
