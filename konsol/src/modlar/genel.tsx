import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Amac, Bolum, HazirSecenekler, InceAyar, SuAn, Teknik, VeriYok } from '@/kabuk/Panel'
import { Kaydirici, Micro, Rozet } from '@/kabuk/parcalar'
import { useHarita } from '@/harita/HaritaKabugu'
import { sn } from '@/lib/sinif'
import {
  KANALLAR,
  KANAL_BILGI,
  KARISIM_HAZIRLARI,
  useKonsol,
  type KanalId,
} from '@/durum/konsolDurumu'
import { agirlik, sayi, tarihSaat } from '@/lib/bicim'
import { useAralik } from '@/durum/zamanDurumu'
import {
  KAYNAK_ADI,
  ONCELIK_ADI,
  ONCELIK_TON,
  useHasarNoktalari,
  useOzet,
  useSosCagrilari,
  type SosCagrisi,
  sosEkBilgi,
} from '@/veri/sorgular'

/** "Son ihbarlar" satırı: SOS çağrısı ya da öteki kaynakların hasar bildirimi. */
type Ihbar = {
  anahtar: string
  sos?: SosCagrisi
  lon: number
  lat: number
  zaman: number
  baslik: string
  alt: string
  rozet: { ton: 'crit' | 'high' | 'mid' | 'ok' | 'nötr'; ad: string } | null
}

const SOS_DURUM_ADI = { bekliyor: 'Bekliyor', atandi: 'Ekip atandı', kapandi: 'Kapandı' } as const

/** Sunucudaki kaynak tipi → ısı kanalı. Sayım tek yerden gelir (özet ucu),
    yoksa aynı çağrı hem nokta hem çağrı olarak iki kez sayılıyor. */
const KAYNAK_KANAL: Record<string, KanalId> = { uydu: 'sat', sos: 'sos', kamera: 'cam', metin: 'nlp' }

/** Sol panel — birleşik ısı haritası karışımı (ARAYUZ §9 sırasıyla). */
export function GenelSol() {
  const aralik = useAralik()
  const ozet = useOzet(aralik)
  const agirliklar = useKonsol((d) => d.agirliklar)
  const karisim = useKonsol((d) => d.karisim)
  const karisimSec = useKonsol((d) => d.karisimSec)
  const agirlikAyarla = useKonsol((d) => d.agirlikAyarla)

  const sayimlar = useMemo(() => {
    const s: Record<KanalId, number | null> = { sat: null, sos: null, cam: null, nlp: null }
    if (!ozet.data) return s
    for (const k of KANALLAR) s[k] = 0
    for (const [kaynak, adet] of Object.entries(ozet.data.kaynakSayilari)) {
      const kanal = KAYNAK_KANAL[kaynak]
      if (kanal) s[kanal] = adet
    }
    return s
  }, [ozet.data])

  const hazirNot = KARISIM_HAZIRLARI.find((h) => h.id === karisim)?.not
  const acikKanallar = KANALLAR.filter((k) => Math.abs(agirliklar[k]) > 0.05 && (sayimlar[k] ?? 0) > 0)

  return (
    <Bolum baslik="Birleşik ısı haritası" ek={<Micro>{karisim ? 'hazır karışım' : 'özel karışım'}</Micro>}>
      {/* 1 — amaç */}
      <Amac>
        Dört kaynaktan gelen hasar bilgisini tek haritada toplar. Kaynakların ağırlığını
        değiştirerek haritaya farklı sorular sorarsın.
      </Amac>

      {/* 2 — hazır seçenekler */}
      <HazirSecenekler
        etiket="Hazır karışımlar"
        secenekler={KARISIM_HAZIRLARI.map((h) => ({ id: h.id, etiket: h.etiket }))}
        secili={karisim}
        onSec={karisimSec}
      />

      {/* 3 — ince ayar en altta */}
      <InceAyar baslik="Kaynak ağırlıkları">
        {KANALLAR.map((k) => {
          const bilgi = KANAL_BILGI[k]
          const n = sayimlar[k]
          const yok = n === null || n === 0
          return (
            <div key={k} className="border-t border-line py-2 first:border-t-0">
              <div className="kilav-kanal items-center gap-2">
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-badge"
                  style={{ background: bilgi.renk }}
                />
                <span>
                  <span className="text-small text-ink">{bilgi.ad}</span>
                  <br />
                  <span className="text-small text-ink-3">{bilgi.kaynak}</span>
                </span>
                <span className="font-mono text-small whitespace-nowrap text-ink-2">
                  {n === null ? '—' : `${sayi(n)} nokta`}
                </span>
              </div>
              <Kaydirici
                etiket={`${bilgi.ad} ağırlığı`}
                deger={agirliklar[k] * 100}
                enAz={-100}
                enCok={150}
                adim={10}
                kapali={yok}
                degerEtiketi={yok ? '—' : agirlik(agirliklar[k])}
                onDegis={(v) => agirlikAyarla(k, v / 100)}
              />
            </div>
          )
        })}
      </InceAyar>

      <div className="mt-3">
        <div
          aria-label="Isı ölçeği: düşükten yükseğe"
          role="img"
          className="h-2 rounded-badge"
          style={{
            background:
              'linear-gradient(90deg, var(--heat-0) 0%, var(--heat-1) 18%, var(--heat-2) 42%, var(--heat-3) 63%, var(--heat-4) 82%, var(--heat-5) 100%)',
          }}
        />
        <div className="mt-1 flex justify-between">
          <Micro>yok</Micro>
          <Micro>yoğun</Micro>
        </div>
      </div>

      {/* 4 — şu an ne görüyorum */}
      <SuAn>
        {hazirNot ??
          (acikKanallar.length
            ? `Haritayı ${acikKanallar.map((k) => KANAL_BILGI[k].ad.toLocaleLowerCase('tr')).join(', ')} oluşturuyor.`
            : 'Isı haritası için veri yok; ağırlıklar veri geldiğinde etkili olur.')}
      </SuAn>

      {ozet.isError && (
        <div className="mt-2">
          <VeriYok ne="Isı kanalları" neden="özet ucu yanıt vermedi" />
        </div>
      )}

      {/* 5 — teknik not en altta */}
      <Teknik>
        Ağırlık değişince sunucuya istek gitmez. Her kaynağın yoğunluk ızgarası sunucuda bir kez
        hesaplanır, ağırlıklı karışım ekran kartında yapılır; ölçek mutlaktır, harita kaydırınca
        renkler kaymaz.
      </Teknik>
    </Bolum>
  )
}

/** Sağ panel — bölge durumu. Sayılar sunucudan gelir, istemci hesap yapmaz. */
export function GenelSag() {
  const aralik = useAralik()
  const ozet = useOzet(aralik)
  const sos = useSosCagrilari(aralik)
  const hasar = useHasarNoktalari(aralik)
  const secili = useKonsol((d) => d.seciliKayit)
  const kayitSec = useKonsol((d) => d.kayitSec)
  const { ucus } = useHarita()
  const git = useNavigate()

  // Son ihbarlar, en yeni önce: tıklayınca haritada oraya gidilir (J-41).
  const ihbarlar = useMemo<Ihbar[]>(() => {
    const cagrilar: Ihbar[] = (sos.data ?? []).map((c) => ({
      anahtar: `sos-${c.id}`,
      sos: c,
      lon: c.lon,
      lat: c.lat,
      zaman: c.zaman,
      baslik: c.id,
      alt: c.mahalle ?? c.metin ?? '',
      rozet:
        c.durum === 'bekliyor'
          ? { ton: ONCELIK_TON[c.oncelik], ad: ONCELIK_ADI[c.oncelik] }
          : { ton: c.durum === 'atandi' ? 'ok' : 'nötr', ad: SOS_DURUM_ADI[c.durum] },
    }))
    // SOS çağrısı sözleşmede hasar noktası olarak da gelir; iki kez listelenmez.
    const bildirimler: Ihbar[] = (hasar.data ?? [])
      .filter((h) => h.kaynak !== 'sos')
      .map((h) => ({
        anahtar: `hasar-${h.id}`,
        lon: h.lon,
        lat: h.lat,
        zaman: h.zaman,
        baslik: KAYNAK_ADI[h.kaynak],
        alt: `Hasar skoru %${Math.round(h.skor * 100)} · güven %${Math.round(h.guven * 100)}`,
        rozet: null,
      }))
    return [...cagrilar, ...bildirimler].sort((a, b) => b.zaman - a.zaman).slice(0, 12)
  }, [sos.data, hasar.data])

  const seciliCagri =
    secili?.tip === 'sos' ? (sos.data ?? []).find((c) => c.id === secili.id) : undefined
  const seciliEk = seciliCagri ? sosEkBilgi(seciliCagri) : null

  const kartlar: Array<[string, string, string]> = [
    [
      'Yıkık yapı',
      ozet.data ? sayi(ozet.data.yikikYapi) : '—',
      ozet.data ? `${sayi(ozet.data.hasarliYapi)} yapı da hasarlı` : 'veri yok',
    ],
    [
      'Kapalı yol',
      ozet.data ? sayi(ozet.data.hasarliYol) : '—',
      ozet.data ? 'uydu analizinden gelen kapanma' : 'veri yok',
    ],
    [
      'Bekleyen SOS',
      ozet.data ? sayi(ozet.data.bekleyenSos) : '—',
      ozet.data ? `${sayi(ozet.data.atananSos)} çağrı ekibe atandı` : 'veri yok',
    ],
    [
      'Aralıktaki çağrı',
      sos.data ? sayi(sos.data.length) : '—',
      ozet.data ? `${sayi(ozet.data.kapananSos)} çağrı kapandı` : 'veri yok',
    ],
  ]

  return (
    <>
      <div className="grid grid-cols-2 gap-px bg-line">
        {kartlar.map(([etiket, deger, alt]) => (
          <div key={etiket} className="bg-panel px-3.5 py-3.5">
            <div className="font-cond text-metric text-ink">{deger}</div>
            <div className="mt-1 text-micro ls-micro text-ink-3 uppercase">{etiket}</div>
            <div className="mt-1 text-small text-ink-3">{alt}</div>
          </div>
        ))}
      </div>
      {seciliCagri && (
        <Bolum baslik="Seçili çağrı" ek={<Micro>{seciliCagri.id}</Micro>}>
          <dl className="kilav-kv gap-x-2.5 gap-y-1.5 text-small">
            <dt className="text-ink-3">Aciliyet</dt>
            <dd className="text-ink">{ONCELIK_ADI[seciliCagri.oncelik]}</dd>
            <dt className="text-ink-3">Durum</dt>
            <dd className="text-ink">
              {SOS_DURUM_ADI[seciliCagri.durum]}
              {seciliCagri.ekipId ? ` (${seciliCagri.ekipId})` : ''}
            </dd>
            {seciliCagri.mahalle && (
              <>
                <dt className="text-ink-3">Mahalle</dt>
                <dd className="text-ink">{seciliCagri.mahalle}</dd>
              </>
            )}
            {seciliCagri.metin && (
              <>
                <dt className="text-ink-3">Metin</dt>
                <dd className="text-ink">{seciliCagri.metin}</dd>
              </>
            )}
            {seciliEk?.kisiIhtiyac && (
              <>
                <dt className="text-ink-3">Kişi, ihtiyaç</dt>
                <dd className="text-ink">{seciliEk.kisiIhtiyac}</dd>
              </>
            )}
            {seciliEk?.konum && (
              <>
                <dt className="text-ink-3">Konum</dt>
                <dd className="text-ink">{seciliEk.konum}</dd>
              </>
            )}
            <dt className="text-ink-3">Zaman</dt>
            <dd className="font-mono text-ink">{tarihSaat(seciliCagri.zaman)}</dd>
          </dl>
          <button
            type="button"
            onClick={() => git('/konsol/sos')}
            className="mt-3 w-full rounded-control border border-line-2 px-3 py-2 text-body text-ink-2 hover:bg-hover hover:text-ink"
          >
            SOS kuyruğunda aç ve ekip gönder
          </button>
        </Bolum>
      )}

      <Bolum baslik="Son ihbarlar" ek={<Micro>{sayi(ihbarlar.length)}</Micro>} dolgusuz>
        {ihbarlar.length ? (
          <div>
            {ihbarlar.map((i) => (
              <button
                key={i.anahtar}
                type="button"
                onClick={() => {
                  if (i.sos) kayitSec({ tip: 'sos', id: i.sos.id })
                  ucus(i.lon, i.lat, 15.5)
                }}
                className={sn(
                  'block w-full border-b border-line px-3 py-2.5 text-left',
                  i.sos && seciliCagri?.id === i.sos.id ? 'bg-raised' : 'hover:bg-raised',
                )}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className={sn('text-small', i.sos ? 'font-mono text-ink-2' : 'text-ink')}>
                    {i.baslik}
                  </span>
                  {i.rozet ? (
                    <Rozet ton={i.rozet.ton}>{i.rozet.ad}</Rozet>
                  ) : (
                    <span className="font-mono text-small text-ink-3">{tarihSaat(i.zaman)}</span>
                  )}
                </span>
                {i.alt && <span className="mt-0.5 block text-small text-ink-3">{i.alt}</span>}
              </button>
            ))}
          </div>
        ) : (
          <div className="px-3 py-2">
            <VeriYok ne="İhbar" neden="seçili zaman aralığında kayıt yok" />
          </div>
        )}
      </Bolum>

      <Bolum baslik="Bölge durumu">
        <Amac>Seçili zaman aralığında bölgenin özeti: ne kadar hasar, kaç bekleyen çağrı?</Amac>
        {ozet.isError && (
          <div className="mt-2">
            <VeriYok ne="Bölge özeti" neden="/api/ozet ucu henüz bağlı değil" />
          </div>
        )}
        <Teknik>
          Bu sayılar sunucuda hazır tutulur; istek anında hesaplanmaz. Zaman penceresi değişince
          sorgu anahtarı değişir, sayılar da pencerenin içini gösterir.
        </Teknik>
      </Bolum>
    </>
  )
}
