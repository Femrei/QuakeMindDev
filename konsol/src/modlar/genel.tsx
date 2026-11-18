import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Amac, Bolum, HazirSecenekler, InceAyar, SuAn, Teknik, VeriYok } from '@/kabuk/Panel'
import { Chip, Micro, Rozet } from '@/kabuk/parcalar'
import { useHarita } from '@/harita/HaritaKabugu'
import { sn } from '@/lib/sinif'
import {
  KANALLAR,
  KANAL_BILGI,
  KARISIM_HAZIRLARI,
  useKonsol,
  type KanalId,
} from '@/durum/konsolDurumu'
import { sayi, sure, tarihSaat } from '@/lib/bicim'
import { seciliPencere, useSorguAraligi, useZaman } from '@/durum/zamanDurumu'
import {
  ONCELIK_ADI,
  ONCELIK_TON,
  useOzet,
  useSosCagrilari,
  type SosCagrisi,
} from '@/veri/sorgular'
import { IHBAR_TURU, useIhbarlar, type Ihbar, type IhbarTuru } from '@/veri/ihbar'
import { IhbarDetayi, IhbarSatiri, TurSimgesi } from './ihbarParcalari'
import { GorevOzetSatiri } from './sevk'
import { SosDetayi } from './sos'

/** "Son ihbarlar" satırı: SOS çağrısı ya da afetzede ihbarı (J-51). Uydu
    noktaları ihbar değildir, listede yok; ısı haritasında görünür. */
type Satir = { anahtar: string; zaman: number } & (
  | { tur: 'sos'; sos: SosCagrisi }
  | { tur: IhbarTuru; ihbar: Ihbar }
)

type Suzgec = 'tum' | 'sos' | IhbarTuru
const SUZGECLER: ReadonlyArray<{ id: Suzgec; etiket: string }> = [
  { id: 'tum', etiket: 'Tümü' },
  { id: 'sos', etiket: 'SOS' },
  { id: 'fotograf', etiket: 'Fotoğraf' },
  { id: 'metin', etiket: 'Metin' },
  { id: 'ihtiyac', etiket: 'İhtiyaç' },
]
const LISTE_BOYU = 30
/** Bu kadar bildirimin altında ısı haritası "az veri" uyarısı verir (J-175). */
const AZ_VERI = 10

/** Sunucudaki kaynak tipi → ısı kanalı. Sayım tek yerden gelir (özet ucu),
    yoksa aynı çağrı hem nokta hem çağrı olarak iki kez sayılıyor. */
const KAYNAK_KANAL: Record<string, KanalId> = { uydu: 'sat', sos: 'sos', kamera: 'cam', metin: 'nlp' }

/** Kaynak etkisi seviyeleri (J-172): eski kaydırıcı -1..1,5 arası sayı
    gösteriyordu ("×1,0"), ne demek olduğu anlaşılmıyordu. Hazır karışımların
    ara değerleri (ör. -0,6) en yakın seviyede gösterilir. */
const SEVIYELER = [
  { id: 'cikar', ad: 'Çıkar', deger: -1, aciklama: 'Bu kaynağın olduğu yeri soğutur' },
  { id: 'kapali', ad: 'Kapalı', deger: 0, aciklama: 'Bu kaynak ısıyı etkilemez' },
  { id: 'normal', ad: 'Normal', deger: 1, aciklama: 'Öteki kaynaklarla eşit katkı' },
  { id: 'guclu', ad: 'Güçlü', deger: 1.5, aciklama: 'Bu kaynak öne çıkar' },
] as const

function enYakinSeviye(w: number) {
  return SEVIYELER.reduce((en, sv) => (Math.abs(sv.deger - w) < Math.abs(en.deger - w) ? sv : en)).id
}

/** Sol panel — birleşik ısı haritası karışımı (ARAYUZ §9 sırasıyla). */
export function GenelSol() {
  const aralik = useSorguAraligi()
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
  // Haritaya giren (ağırlığı pozitif) bildirimlerin toplamı.
  const toplamNokta = ozet.data
    ? KANALLAR.reduce((n, k) => n + (agirliklar[k] > 0.05 ? (sayimlar[k] ?? 0) : 0), 0)
    : null
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

      {/* 3 — ince ayar: her kaynak ısıyı ne kadar etkilesin (J-172) */}
      <InceAyar baslik="Her kaynak ısıyı ne kadar etkilesin?">
        {KANALLAR.map((k) => {
          const bilgi = KANAL_BILGI[k]
          const n = sayimlar[k]
          const yok = n === null || n === 0
          const secili = enYakinSeviye(agirliklar[k])
          return (
            <div key={k} className="border-t border-line py-2 first:border-t-0">
              <div className="flex items-start justify-between gap-2">
                <span className="flex min-w-0 items-start gap-2">
                  <span aria-hidden className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: bilgi.renk }} />
                  <span className="min-w-0">
                    <span className="block text-small text-ink">{bilgi.ad}</span>
                    <span className="block text-small text-ink-3">{bilgi.kaynak}</span>
                  </span>
                </span>
                <span className={sn('shrink-0 text-small', yok ? 'text-ink-3' : 'text-ink-2')}>
                  {n === null ? '—' : yok ? 'bu aralıkta yok' : `${sayi(n)} nokta`}
                </span>
              </div>
              <div
                role="radiogroup"
                aria-label={`${bilgi.ad}: ısıya etkisi`}
                className={sn('mt-1.5 grid grid-cols-4 gap-1', yok && 'opacity-40')}
              >
                {SEVIYELER.map((sv) => (
                  <button
                    key={sv.id}
                    type="button"
                    role="radio"
                    aria-checked={secili === sv.id}
                    disabled={yok}
                    title={sv.aciklama}
                    onClick={() => agirlikAyarla(k, sv.deger)}
                    className={sn(
                      'rounded-control border px-1 py-1 text-small transition-colors duration-150 ease-out-qm',
                      secili === sv.id
                        ? 'border-accent bg-accent-soft text-ink'
                        : 'border-line-2 text-ink-2 hover:bg-hover hover:text-ink',
                    )}
                  >
                    {sv.ad}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
        <p className="mt-1.5 text-small text-ink-3">
          <span className="text-ink-2">Normal</span> eşit katkı, <span className="text-ink-2">Güçlü</span> öne
          çıkarır, <span className="text-ink-2">Kapalı</span> yok sayar, <span className="text-ink-2">Çıkar</span>{' '}
          o kaynağın olduğu yeri soğutur (ör. sessiz bölgeler: uydu yıkık gösteriyor ama çağrı yok).
        </p>
      </InceAyar>

      {/* Haritayı okuma (J-175): renk kaynağı, koyuluk yoğunluğu söyler. */}
      <div className="mt-3 space-y-1.5">
        <p className="text-small text-ink-2">
          <span className="text-ink">Renk</span> hangi kaynaktan geldiğini söyler (yukarıdaki noktalar); iki
          kaynak üst üste binerse renkleri karışır.
        </p>
        <div
          aria-label="Koyuluk ölçeği: soluk tek bildirim, koyu üç ve daha çok bildirim"
          role="img"
          className="h-2 rounded-badge"
          style={{ background: 'linear-gradient(90deg, transparent 0%, var(--color-ink-2) 100%)' }}
        />
        <div className="flex justify-between">
          <Micro>1 bildirim · soluk</Micro>
          <Micro>3+ bildirim üst üste · koyu</Micro>
        </div>
      </div>

      {/* 4 — şu an ne görüyorum */}
      <SuAn>
        {toplamNokta != null && toplamNokta > 0 && toplamNokta < AZ_VERI
          ? `Bu aralıkta yalnız ${sayi(toplamNokta)} bildirim var. Isı haritası yoğunluk göstermek için az; renkli lekeler tek tek bildirimlerin çevresidir, bölgenin hasarlı olduğunu göstermez. Noktalara yakınlaşarak bak.`
          : (hazirNot ??
            (acikKanallar.length
              ? `Haritayı ${acikKanallar.map((k) => KANAL_BILGI[k].ad.toLocaleLowerCase('tr')).join(', ')} oluşturuyor.`
              : 'Isı haritası için veri yok; ağırlıklar veri geldiğinde etkili olur.'))}
      </SuAn>

      {ozet.isError && (
        <div className="mt-2">
          <VeriYok ne="Isı kanalları" neden="özet ucu yanıt vermedi" />
        </div>
      )}

      {/* 5 — teknik not en altta */}
      <Teknik>
        Ağırlık değişince sunucuya istek gitmez. Her kaynağın yoğunluk ızgarası sunucuda bir kez
        hesaplanır (0,5 km Gauss çekirdeği), karışım tarayıcıda yapılır. Ölçek mutlaktır: tam koyuluk
        aynı yerde yaklaşık 3 bildirime denk gelir ve harita kaydırınca renkler kaymaz. Isının
        üzerine gelince o noktadaki kaynak payları görünür.
      </Teknik>
    </Bolum>
  )
}

/** Sağ panel (J-175): "şimdi neye bakmalıyım?" Eskiden altı sayı kartıydı
    (çoğu 0), altında boş bir liste ve teknik not vardı; hiçbiri bir sonraki
    adımı söylemiyordu. Şimdi önce bekleyen iş ve ilgili sayfaya düğme, sonra
    uydu hasarı (yoksa tek satır), sonra açık ihbarlar. Sayılar sunucudan
    (özet) ya da aynı penceredeki listelerden gelir. */
export function GenelSag() {
  const aralik = useSorguAraligi()
  const ozet = useOzet(aralik)
  const sos = useSosCagrilari(aralik)
  const ihbar = useIhbarlar(aralik)
  const simdi = useZaman((d) => d.simdi)
  const pencereSec = useZaman((d) => d.pencereSec)
  const pencere = useZaman(seciliPencere)
  const secili = useKonsol((d) => d.seciliKayit)
  const kayitSec = useKonsol((d) => d.kayitSec)
  const { ucus } = useHarita()
  const git = useNavigate()
  const [suzgec, setSuzgec] = useState<Suzgec>('tum')
  const [kapananlar, setKapananlar] = useState(false)

  // Son ihbarlar, en yeni önce: tıklayınca haritada oraya gidilir (J-41).
  // Canlı akışla gelen SOS ve ihbar listeye anında düşer (J-51).
  const satirlar = useMemo<Satir[]>(() => {
    const cagrilar: Satir[] = (sos.data ?? []).map((c) => ({ anahtar: `sos-${c.id}`, zaman: c.zaman, tur: 'sos', sos: c }))
    const ihbarlar: Satir[] = (ihbar.data ?? []).map((i) => ({ anahtar: `ihb-${i.id}`, zaman: i.zaman, tur: i.tur, ihbar: i }))
    return [...cagrilar, ...ihbarlar].sort((a, b) => b.zaman - a.zaman)
  }, [sos.data, ihbar.data])
  const acikSatirlar = useMemo(
    () => satirlar.filter((x) => (x.tur === 'sos' ? x.sos.durum !== 'kapandi' : x.ihbar.durum !== 'kapandi')),
    [satirlar],
  )
  const kaynakSatirlar = kapananlar ? satirlar : acikSatirlar
  const sayilar = useMemo(() => {
    const s: Record<Suzgec, number> = { tum: kaynakSatirlar.length, sos: 0, fotograf: 0, metin: 0, ihtiyac: 0 }
    for (const x of kaynakSatirlar) s[x.tur] += 1
    return s
  }, [kaynakSatirlar])
  const gorunen = (suzgec === 'tum' ? kaynakSatirlar : kaynakSatirlar.filter((x) => x.tur === suzgec)).slice(0, LISTE_BOYU)

  const seciliCagri = secili?.tip === 'sos' ? (sos.data ?? []).find((c) => c.id === secili.id) : undefined
  const seciliIhbar = secili?.tip === 'ihbar' ? (ihbar.data ?? []).find((i) => i.id === secili.id) : undefined

  // Şimdi bekleyen iş.
  const bekleyenler = (sos.data ?? []).filter((c) => c.durum === 'bekliyor')
  const enEski = bekleyenler.reduce<number | null>((m, c) => (m == null || c.zaman < m ? c.zaman : m), null)
  const yeniIhbar = (ihbar.data ?? []).filter((i) => i.durum === 'yeni')
  const yeniTurler = (['fotograf', 'metin', 'ihtiyac'] as const)
    .map((t) => [t, yeniIhbar.filter((i) => i.tur === t).length] as const)
    .filter(([, n]) => n > 0)
    .map(([t, n]) => `${IHBAR_TURU[t].kisa} ${sayi(n)}`)
    .join(' · ')
  const o = ozet.data
  const uyduVar = !!o && o.yikikYapi + o.hasarliYapi + o.hasarliYol > 0
  const yukleniyor = (q: { isError: boolean; data?: unknown }) => !q.data && !q.isError

  return (
    <>
      <Bolum baslik="Şimdi">
        <div className="space-y-px">
          <IsSatiri
            sayi={bekleyenler.length}
            yukleniyor={yukleniyor(sos)}
            ad="Bekleyen SOS"
            ton="crit"
            aciklama={
              bekleyenler.length
                ? `En uzun bekleyen ${sure(simdi - (enEski ?? simdi))}${o ? ` · ${sayi(o.atananSos)} çağrıya ekip gidiyor` : ''}`
                : o && o.atananSos
                  ? `Bekleyen yok · ${sayi(o.atananSos)} çağrıya ekip gidiyor`
                  : 'Bekleyen çağrı yok'
            }
            eylem={bekleyenler.length ? 'Kuyruğa git' : undefined}
            onEylem={() => git('/konsol/sos')}
          />
          <IsSatiri
            sayi={yeniIhbar.length}
            yukleniyor={yukleniyor(ihbar)}
            ad="Görülmemiş ihbar"
            ton="high"
            aciklama={yeniIhbar.length ? yeniTurler : 'Hepsi görüldü'}
            eylem={yeniIhbar.length ? 'Listede göster' : undefined}
            onEylem={() => {
              setKapananlar(false)
              setSuzgec('tum')
              document.getElementById('son-ihbarlar')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          />
          <IsSatiri
            sayi={o?.gorevdekiEkip ?? 0}
            yukleniyor={yukleniyor(ozet)}
            ad={o?.ekipSayisi != null ? `Görevdeki ekip / ${sayi(o.ekipSayisi)}` : 'Görevdeki ekip'}
            ton="accent"
            aciklama={
              o?.ekipSayisi != null
                ? `${sayi(o.musaitEkip ?? 0)} ekip müsait · sahada ${sayi(o.sahadakiKisi ?? 0)} kişi`
                : 'Ekip bilgisi yok'
            }
            eylem="Ekipler"
            onEylem={() => git('/konsol/ekipler')}
          />
        </div>
      </Bolum>

      <Bolum baslik="Uydu hasarı">
        {!o ? (
          <p className="text-small text-ink-3">{ozet.isError ? 'Özet ucu yanıt vermedi.' : 'Yükleniyor…'}</p>
        ) : uyduVar ? (
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['Yıkık yapı', o.yikikYapi],
                ['Hasarlı yapı', o.hasarliYapi],
                ['Kapalı yol', o.hasarliYol],
              ] as const
            ).map(([ad, n]) => (
              <div key={ad}>
                <div className="font-cond text-metric text-ink">{sayi(n)}</div>
                <div className="text-micro ls-micro text-ink-3 uppercase">{ad}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <p className="text-small text-ink-3">Bu aralıkta uydu analizi yok.</p>
            <button
              type="button"
              onClick={() => git('/konsol/hasar')}
              className="shrink-0 text-small text-accent hover:underline"
            >
              Hasar analizi
            </button>
          </div>
        )}
      </Bolum>

      {seciliCagri && <SosDetayi cagri={seciliCagri} />}
      {seciliIhbar && <IhbarDetayi ihbar={seciliIhbar} />}

      <div id="son-ihbarlar">
        <Bolum
          baslik={kapananlar ? 'Son ihbarlar · hepsi' : 'Açık ihbarlar'}
          ek={<Micro>{sayi(kaynakSatirlar.length)}</Micro>}
          dolgusuz
        >
          <div role="group" aria-label="İhbar türü" className="flex flex-wrap gap-1.5 px-3 pb-2">
            {SUZGECLER.map((sz) => (
              <Chip key={sz.id} secili={suzgec === sz.id} onClick={() => setSuzgec(sz.id)}>
                {sz.id !== 'tum' && (
                  <span aria-hidden className={sn('mr-1.5 inline-block h-2 w-2 rounded-badge', IHBAR_TURU[sz.id].zemin)} />
                )}
                {sz.etiket} {sayi(sayilar[sz.id])}
              </Chip>
            ))}
          </div>
          <label className="flex items-center gap-2 px-3 pb-2.5 text-small text-ink-2">
            <input type="checkbox" checked={kapananlar} onChange={(e) => setKapananlar(e.target.checked)} />
            Kapananları da göster ({sayi(satirlar.length - acikSatirlar.length)})
          </label>
          {gorunen.length ? (
            <div className="border-t border-line">
              {gorunen.map((x) =>
                x.tur === 'sos' ? (
                  <SosSatiri
                    key={x.anahtar}
                    c={x.sos}
                    secili={seciliCagri?.id === x.sos.id}
                    onSec={() => {
                      kayitSec({ tip: 'sos', id: x.sos.id })
                      ucus(x.sos.lon, x.sos.lat, 15.5)
                    }}
                  />
                ) : (
                  <IhbarSatiri
                    key={x.anahtar}
                    ihbar={x.ihbar}
                    secili={seciliIhbar?.id === x.ihbar.id}
                    onSec={() => {
                      kayitSec({ tip: 'ihbar', id: x.ihbar.id })
                      ucus(x.ihbar.lon, x.ihbar.lat, 15.5)
                    }}
                  />
                ),
              )}
            </div>
          ) : (
            <div className="space-y-2 px-3 pb-3">
              <p className="text-small text-ink-3">
                {yukleniyor(sos) || yukleniyor(ihbar)
                  ? 'Yükleniyor…'
                  : sos.isError || ihbar.isError
                    ? 'İhbar uçları yanıt vermedi.'
                    : satirlar.length && !kapananlar
                      ? `Açık ihbar yok; bu aralıktaki ${sayi(satirlar.length)} kaydın hepsi kapandı.`
                      : 'Bu zaman aralığında kayıt yok.'}
              </p>
              {!satirlar.length && pencere !== 'tum' && pencere !== '3g' && !yukleniyor(sos) && (
                <button
                  type="button"
                  onClick={() => pencereSec(pencere === '24s' ? '3g' : '24s')}
                  className="rounded-control border border-line-2 px-2 py-1 text-small text-ink-2 hover:bg-hover hover:text-ink"
                >
                  {pencere === '24s' ? 'Son 3 güne genişlet' : 'Son 24 saate genişlet'}
                </button>
              )}
            </div>
          )}
        </Bolum>
      </div>
    </>
  )
}

/** "Şimdi" bölümünün bir satırı: sayı, ne olduğu, kısa açıklama, sonraki adım. */
function IsSatiri({
  sayi: n,
  yukleniyor,
  ad,
  ton,
  aciklama,
  eylem,
  onEylem,
}: {
  sayi: number
  yukleniyor: boolean
  ad: string
  ton: 'crit' | 'high' | 'accent'
  aciklama: string
  eylem?: string
  onEylem: () => void
}) {
  const renk = { crit: 'text-crit', high: 'text-high', accent: 'text-ink' }[ton]
  const sakin = !yukleniyor && n === 0
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className={sn('w-8 shrink-0 text-right font-cond text-metric', sakin ? 'text-ink-3' : renk)}>
        {yukleniyor ? '—' : sayi(n)}
      </span>
      <span className="min-w-0 flex-1">
        <span className={sn('block text-small', sakin ? 'text-ink-2' : 'text-ink')}>{ad}</span>
        <span className="block truncate text-small text-ink-3">{yukleniyor ? 'Yükleniyor…' : aciklama}</span>
      </span>
      {eylem && !yukleniyor && (
        <button
          type="button"
          onClick={onEylem}
          className="shrink-0 rounded-control border border-line-2 px-2 py-1 text-small text-ink-2 hover:bg-hover hover:text-ink"
        >
          {eylem}
        </button>
      )}
    </div>
  )
}

function SosSatiri({ c, secili, onSec }: { c: SosCagrisi; secili: boolean; onSec: () => void }) {
  const kapali = c.durum === 'kapandi'
  return (
    <button
      type="button"
      onClick={onSec}
      aria-pressed={secili}
      className={sn(
        'flex w-full items-start gap-2.5 border-b border-line px-3 py-2.5 text-left',
        secili ? 'bg-raised' : 'hover:bg-raised',
        c.durum === 'kapandi' && 'opacity-60',
      )}
    >
      <TurSimgesi tur="sos" />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-small text-ink">
            <span className="text-ihbar-sos">SOS</span>
            {c.mahalle ? ` · ${c.mahalle}` : ''}
          </span>
          <Rozet ton={kapali ? 'nötr' : ONCELIK_TON[c.oncelik]}>{kapali ? 'Kapandı' : ONCELIK_ADI[c.oncelik]}</Rozet>
        </span>
        <GorevOzetSatiri
          gorevler={c.gorevler}
          olayZamani={c.zaman}
          bekleyenYaz={!kapali}
          eskiEkipId={c.durum === 'atandi' ? c.ekipId : null}
        />
        <span className="mt-0.5 flex justify-between gap-2 text-small text-ink-3">
          <span className="line-clamp-1">{c.metin ?? c.id}</span>
          <span className="shrink-0 font-mono">{tarihSaat(c.zaman)}</span>
        </span>
      </span>
    </button>
  )
}
