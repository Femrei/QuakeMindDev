import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Amac, Bolum, HazirSecenekler, SuAn, Teknik, VeriYok } from '@/kabuk/Panel'
import { Micro, Rozet } from '@/kabuk/parcalar'
import { useHarita } from '@/harita/HaritaKabugu'
import { useKonsol, type EkipSuzgeci } from '@/durum/konsolDurumu'
import { useZaman } from '@/durum/zamanDurumu'
import { useOturum } from '@/kimlik/oturum'
import { once, saatten, sayi } from '@/lib/bicim'
import { sn } from '@/lib/sinif'
import {
  EKIP_TURU,
  GOREV_DURUMU,
  kurumTur,
  uzaklikMetni,
  useEkipKaydet,
  useEkipler,
  useUyeAdaylari,
  useUyeleriAyarla,
  type Ekip,
  type EkipGorevi,
  type EkipTuru,
} from '@/veri/gorev'
import { hedefEtiketi } from './sevk'

/* ---------------------------------------------------------------------------
   Ekipler modu (J-54): hangi ekip nerede, neye gidiyor, kaç kişiyle.
   Ekibin tanımı (kurum, tür, kişi sayısı) ve ekibe bağlı saha hesapları da
   burada. Bağlı hesap, ekibin görevini kendi telefonundan günceller.
--------------------------------------------------------------------------- */

const SUZGECLER: ReadonlyArray<{ id: EkipSuzgeci; etiket: string }> = [
  { id: 'tum', etiket: 'Tümü' },
  { id: 'musait', etiket: 'Müsait' },
  { id: 'gorevde', etiket: 'Görevde' },
  { id: 'hizmet-disi', etiket: 'Hizmet dışı' },
]

function suz(l: Ekip[], s: EkipSuzgeci): Ekip[] {
  if (s === 'musait') return l.filter((e) => e.musait)
  if (s === 'gorevde') return l.filter((e) => e.gorev)
  if (s === 'hizmet-disi') return l.filter((e) => e.durum === 'hizmet-disi')
  return l
}

/** Görevdekiler önce (olay yerinde, yolda, atandı), sonra müsaitler, en sonda hizmet dışı. */
const GOREV_SIRASI = { 'olay-yerinde': 0, yolda: 1, atandi: 2, tamamlandi: 3, iptal: 3 }
function sira(e: Ekip) {
  if (e.gorev) return GOREV_SIRASI[e.gorev.durum]
  return e.durum === 'hizmet-disi' ? 5 : 4
}

/** Olayın açıldığı mod: SOS kuyruğu ya da ihbarın türünün modu. */
const OLAY_MODU = { sos: 'sos', fotograf: 'kamera', metin: 'metin', ihtiyac: 'ihtiyac' } as const

function useKoordinasyon() {
  const rol = useOturum().oturum?.rol
  return rol === 'koordinator' || rol === 'yonetici'
}

export function EkiplerSol() {
  const ekipler = useEkipler()
  const suzgec = useKonsol((d) => d.ekipSuzgeci)
  const suzgecSec = useKonsol((d) => d.ekipSuzgeciSec)
  const koordinasyon = useKoordinasyon()

  const liste = ekipler.data ?? []
  const gorevde = liste.filter((e) => e.gorev)
  const musait = liste.filter((e) => e.musait).length
  const disi = liste.filter((e) => e.durum === 'hizmet-disi').length
  const sahada = gorevde.reduce((t, e) => t + (e.gorev?.kisiSayisi ?? 0), 0)

  return (
    <>
      <Bolum
        baslik="Ekipler"
        ek={<Micro>{ekipler.data ? `${sayi(suz(liste, suzgec).length)} / ${sayi(liste.length)}` : '—'}</Micro>}
      >
        <Amac>Hangi ekip nerede, neye gidiyor, kaç kişiyle? Ekibin tanımı ve bağlı hesapları da burada.</Amac>
        <HazirSecenekler etiket="Ekip süzgeçleri" secenekler={SUZGECLER} secili={suzgec} onSec={suzgecSec} />
        <SuAn>
          {ekipler.isError
            ? 'Ekip ucu yanıt vermiyor.'
            : !ekipler.data
              ? 'Ekipler yükleniyor…'
              : liste.length === 0
                ? 'Kayıtlı ekip yok. Sevk yapmak için önce ekip ekle.'
                : `${sayi(liste.length)} ekip: ${sayi(musait)} müsait, ${sayi(gorevde.length)} görevde${
                    disi ? `, ${sayi(disi)} hizmet dışı` : ''
                  }. Görevdeki ekiplerle sahada ${sayi(sahada)} kişi var.`}
        </SuAn>
        {ekipler.isError && (
          <div className="mt-2">
            <VeriYok ne="Ekipler" neden="ekip ucu yanıt vermedi" />
          </div>
        )}
        <Teknik>
          Ekibin konumu kendi telefonundan (görev ekranı açıkken) ya da koordinasyondan gelir; yanında ne
          zaman bildirildiği yazar. Uzaklıklar kuş uçuşu.
        </Teknik>
      </Bolum>
      {koordinasyon && (
        <Bolum baslik="Ekip ekle">
          <EkipFormu />
        </Bolum>
      )}
    </>
  )
}

export function EkiplerSag() {
  const ekipler = useEkipler()
  const suzgec = useKonsol((d) => d.ekipSuzgeci)
  const liste = useMemo(
    () =>
      suz(
        [...(ekipler.data ?? [])].sort((a, b) => sira(a) - sira(b) || a.ad.localeCompare(b.ad, 'tr')),
        suzgec,
      ),
    [ekipler.data, suzgec],
  )

  return (
    <Bolum
      baslik={SUZGECLER.find((s) => s.id === suzgec)?.etiket ?? 'Ekipler'}
      ek={<Micro>{sayi(liste.length)}</Micro>}
      dolgusuz
    >
      {liste.length ? (
        <div className="border-t border-line">
          {liste.map((e) => (
            <EkipKarti key={e.id} ekip={e} />
          ))}
        </div>
      ) : (
        <div className="px-3 pb-3">
          <VeriYok
            ne="Bu süzgeçte ekip"
            neden={ekipler.isError ? 'ekip ucu yanıt vermedi' : 'eşleşen ekip yok'}
          />
        </div>
      )}
    </Bolum>
  )
}

function gorevSatiri(g: EkipGorevi): string {
  if (g.durum === 'olay-yerinde') return g.vardi ? `${saatten(g.vardi)} beri olay yerinde` : 'olay yerinde'
  const asama = GOREV_DURUMU[g.durum].kisa.toLocaleLowerCase('tr')
  const uzaklik = uzaklikMetni(g.yol, g.kalanM)
  return uzaklik ? `${asama}, olaya ${uzaklik}` : asama
}

function EkipKarti({ ekip: e }: { ekip: Ekip }) {
  const [duzenle, setDuzenle] = useState(false)
  const simdi = useZaman((z) => z.simdi)
  const { ucus } = useHarita()
  const git = useNavigate()
  const kayitSec = useKonsol((d) => d.kayitSec)
  const koordinasyon = useKoordinasyon()
  const g = e.gorev
  const rozet = g
    ? { ton: GOREV_DURUMU[g.durum].ton, ad: GOREV_DURUMU[g.durum].kisa }
    : e.durum === 'hizmet-disi'
      ? { ton: 'nötr' as const, ad: 'Hizmet dışı' }
      : { ton: 'accent' as const, ad: 'Müsait' }

  function olayiAc() {
    if (!g?.hedef) return
    kayitSec({ tip: g.hedefTur === 'sos' ? 'sos' : 'ihbar', id: g.hedefId })
    git(`/konsol/${OLAY_MODU[g.hedef.tur]}`)
    ucus(g.hedef.lon, g.hedef.lat, 15.5)
  }

  return (
    <div className="border-b border-line px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-body font-semibold text-ink">{e.ad}</p>
          <p className="truncate text-small text-ink-2">
            {[kurumTur(e), e.kisiSayisi ? `${e.kisiSayisi} kişi` : 'kişi sayısı yazılmamış']
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <Rozet ton={rozet.ton}>{rozet.ad}</Rozet>
      </div>

      {g && (
        <p className="mt-1.5 text-small text-ink">
          {hedefEtiketi(g.hedef)} · {g.kisiSayisi} kişi
          <span className="text-ink-2"> · {gorevSatiri(g)}</span>
        </p>
      )}
      <p className="mt-0.5 text-small text-ink-3">
        {e.lon != null
          ? `Konum: ${e.yerAdi ? `${e.yerAdi} yakını` : 'haritada işaretli'} · ${
              e.konumZamani ? once(e.konumZamani, simdi) : 'zamanı bilinmiyor'
            }`
          : 'Konum bildirilmedi'}
      </p>
      <p className="mt-0.5 text-small text-ink-3">
        {e.uyeler.length
          ? `Bağlı hesap: ${e.uyeler.map((u) => u.adSoyad).join(', ')}`
          : 'Bağlı hesap yok: görevini yalnız koordinasyon işaretler.'}
      </p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {g?.hedef && (
          <button
            type="button"
            onClick={olayiAc}
            className="h-8 rounded-control bg-accent px-2.5 text-small font-semibold text-accent-ink hover:bg-accent-deep hover:text-ink"
          >
            Olayı aç
          </button>
        )}
        {e.lon != null && e.lat != null && (
          <button
            type="button"
            onClick={() => ucus(e.lon!, e.lat!, 15.5)}
            className="h-8 rounded-control border border-line-2 px-2.5 text-small text-ink-2 hover:bg-hover hover:text-ink"
          >
            Haritada
          </button>
        )}
        {koordinasyon && (
          <button
            type="button"
            aria-expanded={duzenle}
            onClick={() => setDuzenle((v) => !v)}
            className="h-8 rounded-control border border-line-2 px-2.5 text-small text-ink-2 hover:bg-hover hover:text-ink"
          >
            {duzenle ? 'Vazgeç' : 'Düzenle'}
          </button>
        )}
      </div>
      {duzenle && (
        <div className="mt-2.5 rounded-control border border-line-2 p-2.5">
          <EkipFormu ekip={e} onBitti={() => setDuzenle(false)} />
          <UyeSecici ekip={e} />
        </div>
      )}
    </div>
  )
}

const KURUM_ONERILERI = ['AFAD', 'AKUT', 'UMKE', 'İtfaiye', 'Jandarma', 'Belediye']

/** Ekip ekleme ve düzenleme. Konum isteğe bağlı: ekibin telefonu bildirince
    güncellenir; koordinasyon haritanın ortasını da konum yapabilir. */
function EkipFormu({ ekip, onBitti }: { ekip?: Ekip; onBitti?: () => void }) {
  const kaydet = useEkipKaydet()
  const { haritaAl } = useHarita()
  const [ad, setAd] = useState(ekip?.ad ?? '')
  const [kurum, setKurum] = useState(ekip?.kurum ?? '')
  const [tur, setTur] = useState<EkipTuru | ''>(ekip?.tur ?? '')
  const [kisi, setKisi] = useState(ekip?.kisiSayisi ? String(ekip.kisiSayisi) : '')
  const [durum, setDurum] = useState<'musait' | 'hizmet-disi'>(
    ekip?.durum === 'hizmet-disi' ? 'hizmet-disi' : 'musait',
  )
  const [konum, setKonum] = useState<{ lon: number; lat: number } | null>(null)
  const [tamam, setTamam] = useState<string | null>(null)
  const kimlik = ekip?.id ?? 'yeni'
  const kisiSayisi = kisi ? Number(kisi) : null
  const gecerli = ad.trim().length > 0 && (kisiSayisi == null || (kisiSayisi >= 1 && kisiSayisi <= 500))

  function haritaOrtasi() {
    const m = haritaAl()
    if (!m) return
    const o = m.getCenter()
    setKonum({ lon: Math.round(o.lng * 1e5) / 1e5, lat: Math.round(o.lat * 1e5) / 1e5 })
  }

  function gonder() {
    setTamam(null)
    kaydet.mutate(
      {
        id: ekip?.id,
        ad: ad.trim(),
        kurum: kurum.trim() || null,
        tur: tur || null,
        kisiSayisi,
        ...(konum ?? {}),
        durum,
      },
      {
        onSuccess: (e) => {
          if (ekip) {
            onBitti?.()
            return
          }
          setTamam(`${e.ad} eklendi.`)
          setAd('')
          setKurum('')
          setTur('')
          setKisi('')
          setKonum(null)
        },
      },
    )
  }

  const girdi = 'mt-1 w-full rounded-control border border-line-2 bg-sunken px-2 py-1.5 text-body text-ink'
  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <label className="col-span-2 block text-small text-ink-2">
          Ekibin adı
          <input value={ad} maxLength={60} onChange={(e) => setAd(e.target.value)} placeholder="ör. AKUT 3" className={girdi} />
        </label>
        <label className="block text-small text-ink-2">
          Kurum
          <input
            value={kurum}
            maxLength={60}
            list={`kurumlar-${kimlik}`}
            onChange={(e) => setKurum(e.target.value)}
            placeholder="ör. AFAD"
            className={girdi}
          />
          <datalist id={`kurumlar-${kimlik}`}>
            {KURUM_ONERILERI.map((k) => (
              <option key={k} value={k} />
            ))}
          </datalist>
        </label>
        <label className="block text-small text-ink-2">
          Tür
          <select value={tur} onChange={(e) => setTur(e.target.value as EkipTuru | '')} className={girdi}>
            <option value="">Seç</option>
            {(Object.keys(EKIP_TURU) as EkipTuru[]).map((t) => (
              <option key={t} value={t}>
                {EKIP_TURU[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-small text-ink-2">
          Kişi sayısı
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={500}
            value={kisi}
            onChange={(e) => setKisi(e.target.value)}
            className={girdi}
          />
        </label>
        {ekip && (
          <label className="block text-small text-ink-2">
            Durum
            <select
              value={durum}
              onChange={(e) => setDurum(e.target.value as 'musait' | 'hizmet-disi')}
              className={girdi}
            >
              <option value="musait">Müsait (göreve gidebilir)</option>
              <option value="hizmet-disi">Hizmet dışı</option>
            </select>
          </label>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-small">
        <span className="text-ink-3">
          {konum
            ? `Konum: haritanın ortası (${konum.lat.toFixed(4)}, ${konum.lon.toFixed(4)})`
            : ekip?.lon != null
              ? 'Konum değişmeyecek.'
              : 'Konum yok: ekibin telefonu bildirince görünür.'}
        </span>
        <button
          type="button"
          onClick={haritaOrtasi}
          className="shrink-0 rounded-control border border-line-2 px-2 py-1 text-ink-2 hover:bg-hover hover:text-ink"
        >
          Haritanın ortası
        </button>
      </div>

      <button
        type="button"
        disabled={!gecerli || kaydet.isPending}
        onClick={gonder}
        className={sn(
          'mt-2.5 h-9 w-full rounded-control px-2.5 text-body font-semibold disabled:opacity-40',
          'bg-accent text-accent-ink hover:bg-accent-deep hover:text-ink',
        )}
      >
        {ekip ? 'Kaydet' : 'Ekip ekle'}
      </button>
      {kaydet.isError && (
        <p role="alert" className="mt-2 text-small text-crit">
          {kaydet.error instanceof Error ? kaydet.error.message : 'Ekip kaydedilemedi.'}
        </p>
      )}
      {tamam && (
        <p role="status" className="mt-2 text-small text-ok">
          {tamam}
        </p>
      )}
    </div>
  )
}

/** Ekibe bağlı saha hesapları: bağlı kişi görevi kendi telefonundan günceller. */
function UyeSecici({ ekip }: { ekip: Ekip }) {
  const adaylar = useUyeAdaylari(true)
  const ekipler = useEkipler()
  const ayarla = useUyeleriAyarla()
  const [secili, setSecili] = useState<string[]>(ekip.uyeler.map((u) => u.id))
  const ekipAdi = (id: string | null) => ekipler.data?.find((e) => e.id === id)?.ad ?? id

  return (
    <div className="mt-3 border-t border-line pt-2.5">
      <p className="text-small text-ink-2">Bağlı saha hesapları</p>
      {adaylar.isPending && <p className="mt-1 text-small text-ink-3">Yükleniyor…</p>}
      {adaylar.data?.length === 0 && (
        <p className="mt-1 text-small text-ink-3">
          Saha rolünde hesap yok. Hesap yönetici tarafından açılır (araclar_kullanici.py).
        </p>
      )}
      {!!adaylar.data?.length && (
        <ul className="mt-1">
          {adaylar.data.map((u) => (
            <li key={u.id}>
              <label className="flex items-start gap-2 py-1 text-small text-ink">
                <input
                  type="checkbox"
                  checked={secili.includes(u.id)}
                  onChange={(e) =>
                    setSecili((l) => (e.target.checked ? [...l, u.id] : l.filter((x) => x !== u.id)))
                  }
                  className="mt-0.5 accent-accent"
                />
                <span>
                  {u.adSoyad} <span className="text-ink-3">· {u.eposta}</span>
                  {u.ekipId && u.ekipId !== ekip.id && (
                    <span className="block text-ink-3">Şu an {ekipAdi(u.ekipId)} ekibinde; seçersen oradan çıkar.</span>
                  )}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        disabled={ayarla.isPending || !adaylar.data}
        onClick={() => ayarla.mutate({ ekipId: ekip.id, kullaniciIdleri: secili })}
        className="mt-2 h-8 rounded-control border border-line-2 px-2.5 text-small text-ink hover:bg-hover disabled:opacity-40"
      >
        Hesapları kaydet
      </button>
      {ayarla.isError && (
        <p role="alert" className="mt-2 text-small text-crit">
          {ayarla.error instanceof Error ? ayarla.error.message : 'Hesaplar kaydedilemedi.'}
        </p>
      )}
      {ayarla.isSuccess && <p className="mt-2 text-small text-ok">Kaydedildi.</p>}
    </div>
  )
}
