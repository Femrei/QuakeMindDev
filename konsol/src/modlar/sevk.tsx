import { useState, type ReactNode } from 'react'
import { MapPin, Plus, UsersThree } from '@phosphor-icons/react'
import { Bolum } from '@/kabuk/Panel'
import { Micro, Rozet } from '@/kabuk/parcalar'
import { useOturum } from '@/kimlik/oturum'
import { useZaman } from '@/durum/zamanDurumu'
import { mesafe, once, saat, suredir, sureMetni } from '@/lib/bicim'
import { sn } from '@/lib/sinif'
import { IHBAR_TURU } from '@/veri/ihbar'
import {
  GOREV_ADIMLARI,
  GOREV_DURUMU,
  SONRAKI_ADIM,
  acikGorev,
  adimZamani,
  kurumTur,
  gorevOzeti,
  uzaklikMetni,
  useAdayEkipler,
  useEkipler,
  useGorevDurumu,
  useSevkEt,
  type Ekip,
  type Gorev,
  type GorevDurumu,
  type HedefOzeti,
  type HedefTur,
} from '@/veri/gorev'

/* ---------------------------------------------------------------------------
   "Kim gidiyor" (J-54). Kullanıcı: "hangi ihbar, neredeki ihbar, hangi ekip
   gidecek ya da gidiyor, kaç kişi gidiyor; bunlar hep belirsiz."

   Olayın ayrıntısında (SOS, fotoğraf, yazılı, ihtiyaç) aynı bölüm durur:
     · giden her ekip: adı, kurumu, kaç kişi, hangi aşamada, her adım ne zaman
       ve kimden (ekibin telefonu ya da koordinasyon);
     · ekip şu an nerede ve olaya ne kadar uzakta (kuş uçuşu, sunucuda);
     · ekip gönderme: müsait ekipler uzaklığa göre, kişi sayısı ve not;
     · olaya zaten ekip gidiyorsa ikincisi yalnız "ek destek" olarak gider.
--------------------------------------------------------------------------- */

/** "SOS · Akevler" · "Yazılı ihbar · Cebrail" */
export function hedefEtiketi(h: HedefOzeti | null | undefined): string {
  if (!h) return 'olay bulunamadı'
  const tur = h.tur === 'sos' ? 'SOS' : IHBAR_TURU[h.tur].ad
  return [tur, h.mahalle ?? h.etiket].filter(Boolean).join(' · ')
}

/** Görev kaydından (J-54) önce yapılmış atama: çağrıda ekip var ama kaç kişi
    gittiği ve aşaması kaydedilmemiş. Uydurulmaz, eski kayıt olduğu yazılır. */
function useEskiAtama(ekipId: string | null | undefined): string | null {
  const ekipler = useEkipler()
  if (!ekipId) return null
  return ekipler.data?.find((e) => e.id === ekipId)?.ad ?? ekipId
}

/** Listede tek satır: açık görev varsa kim gidiyor. Yoksa `bekleyenYaz` ise
    ne kadardır ekip beklediği (SOS her zaman ekip ister; ihbar istemeyebilir). */
export function GorevOzetSatiri({
  gorevler,
  olayZamani,
  bekleyenYaz,
  eskiEkipId,
}: {
  gorevler: Gorev[] | undefined
  olayZamani: number
  bekleyenYaz: boolean
  eskiEkipId?: string | null
}) {
  const simdi = useZaman((z) => z.simdi)
  const eski = useEskiAtama(eskiEkipId)
  const ozet = gorevOzeti(gorevler)
  if (ozet)
    return (
      <span className="mt-0.5 flex items-center gap-1.5 text-small text-accent">
        <UsersThree size={14} weight="bold" aria-hidden />
        {ozet}
      </span>
    )
  if (eski)
    return (
      <span className="mt-0.5 block text-small text-ink-2">
        {eski} atanmış · eski kayıt, kaç kişi ve hangi aşamada bilinmiyor
      </span>
    )
  if (!bekleyenYaz) return null
  const sure = suredir(olayZamani, simdi)
  return (
    <span className="mt-0.5 block text-small text-ink-2">
      Ekip gönderilmedi · {sure ? `${sure} bekliyor` : 'yeni geldi'}
    </span>
  )
}

export function SevkBolumu({
  hedefTur,
  hedefId,
  gorevler,
  kapali,
  olayZamani,
  eskiEkipId,
}: {
  hedefTur: HedefTur
  hedefId: string
  gorevler: Gorev[]
  kapali: boolean
  olayZamani: number
  /** Görev kaydından önce yapılmış atamanın ekibi (yalnız SOS'ta olabilir). */
  eskiEkipId?: string | null
}) {
  const [secici, setSecici] = useState(false)
  const simdi = useZaman((z) => z.simdi)
  const ekipler = useEkipler()
  const eski = useEskiAtama(eskiEkipId)
  const acik = gorevler.filter(acikGorev)
  const biten = gorevler.filter((g) => !acikGorev(g))
  const kisi = acik.reduce((t, g) => t + g.kisiSayisi, 0)

  return (
    <Bolum
      baslik="Kim gidiyor"
      ek={<Micro>{acik.length ? `${acik.length} ekip · ${kisi} kişi` : 'ekip yok'}</Micro>}
    >
      {acik.length === 0 && !kapali && eski && (
        <p className="text-body text-ink">
          Bu çağrı görev kaydından önce {eski} ekibine atanmış.{' '}
          <span className="text-ink-2">
            Kaç kişi gittiği ve hangi aşamada olduğu kaydedilmemiş. Durumu biliyorsan ekibi buradan yeniden gönder
            ya da çağrıyı kapat.
          </span>
        </p>
      )}
      {acik.length === 0 && !kapali && !eski && (
        <p className="text-body text-ink">
          {biten[0]?.durum === 'iptal'
            ? `Şu an giden ekip yok: ${biten[0].ekip.ad} gelemedi${biten[0].sonuc ? ` (${biten[0].sonuc})` : ''}.`
            : biten[0]?.olaySuruyor
              ? `Şu an giden ekip yok: ${biten[0].ekip.ad} "olay sürüyor" dedi.`
              : 'Henüz ekip gönderilmedi.'}{' '}
          <span className="text-ink-2">Olay {once(olayZamani, simdi)} geldi.</span>
        </p>
      )}
      {acik.length === 0 && kapali && <p className="text-body text-ink-2">Olay kapandı; giden ekip yok.</p>}

      {acik.map((g) => (
        <GorevKarti key={g.id} gorev={g} canliEkip={ekipler.data?.find((e) => e.id === g.ekip.id)} />
      ))}

      {!kapali &&
        (secici ? (
          <EkipSecici
            hedefTur={hedefTur}
            hedefId={hedefId}
            gidenler={acik}
            onKapat={() => setSecici(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setSecici(true)}
            className={sn(
              'mt-2.5 flex h-10 w-full items-center justify-center gap-1.5 rounded-control text-body font-semibold',
              acik.length
                ? 'border border-line-2 text-ink hover:bg-hover'
                : 'bg-accent text-accent-ink hover:bg-accent-deep hover:text-ink',
            )}
          >
            <Plus size={16} weight="bold" aria-hidden />
            {acik.length ? 'Ek destek ekibi gönder' : 'Ekip gönder'}
          </button>
        ))}

      {biten.length > 0 && (
        <details className="mt-2.5 text-small">
          <summary className="cursor-pointer text-ink-2 hover:text-ink">
            Önceki görevler ({biten.length})
          </summary>
          <ul className="mt-1.5">
            {biten.map((g) => (
              <li key={g.id} className="border-t border-line py-1.5">
                <p className="text-ink">
                  {g.ekip.ad} · {g.kisiSayisi} kişi ·{' '}
                  <span className="text-ink-2">
                    {GOREV_DURUMU[g.durum].kisa}
                    {g.bitti ? ` ${saat(g.bitti)}` : ''}
                  </span>
                </p>
                {g.sonuc && <p className="text-ink-2">{g.sonuc}</p>}
                {g.olaySuruyor && (
                  <p className="text-ink-2">Ekip "olay sürüyor" dedi; olay yeniden sıraya girdi.</p>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </Bolum>
  )
}

/** Adımın kimden geldiği: "ekip · Ali Yılmaz" ya da "koordinasyon · Ayşe Kaya". */
function kimden(g: Gorev, d: GorevDurumu): string | null {
  const a = [...(g.adimlar ?? [])].reverse().find((x) => x.durum === d)
  if (!a) return null
  return [a.kaynak === 'ekip' ? 'ekip' : 'koordinasyon', a.kisiAd].filter(Boolean).join(' · ')
}

/** Dört adımlı çizelge: yapılan adım dolu, sıradaki boş. Atlanan adımın
    zamanı uydurulmaz, "bildirilmedi" yazılır. */
export function GorevCizelgesi({ gorev: g, kimdenGoster = true }: { gorev: Gorev; kimdenGoster?: boolean }) {
  const sira = GOREV_ADIMLARI.indexOf(g.durum)
  return (
    <ol aria-label="Görev adımları" className="mt-2 space-y-1">
      {GOREV_ADIMLARI.map((d, i) => {
        const z = adimZamani(g, d)
        const gecti = g.durum !== 'iptal' && i <= sira
        const atlandi = gecti && z == null && i > 0
        return (
          <li key={d} className="flex items-baseline gap-2 text-small">
            <span
              aria-hidden
              className={sn(
                'h-2 w-2 shrink-0 translate-y-px rounded-full border',
                gecti ? 'border-accent bg-accent' : 'border-line-2',
              )}
            />
            <span className={sn('w-24 shrink-0', gecti ? 'text-ink' : 'text-ink-3')}>
              {d === 'tamamlandi' ? 'Bitti' : GOREV_DURUMU[d].kisa}
            </span>
            <span className="w-11 shrink-0 font-mono text-ink-2">{z ? saat(z) : '—'}</span>
            <span className="min-w-0 truncate text-ink-3">
              {atlandi ? 'bildirilmedi' : kimdenGoster && gecti ? kimden(g, d) : ''}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function GorevKarti({ gorev: g, canliEkip }: { gorev: Gorev; canliEkip?: Ekip }) {
  const durum = useGorevDurumu()
  const simdi = useZaman((z) => z.simdi)
  const [form, setForm] = useState<null | 'tamamlandi' | 'iptal'>(null)
  const [not, setNot] = useState('')
  const [suruyor, setSuruyor] = useState(false)
  const sonraki = SONRAKI_ADIM[g.durum]
  const d = GOREV_DURUMU[g.durum]

  // Ekibin konumu ekip listesinden gelir: her konum bildiriminde tazelenir,
  // olay listesinin yeniden istenmesi gerekmez.
  const canli = canliEkip?.gorev?.id === g.id ? canliEkip : null
  const kalanM = canli?.gorev?.kalanM ?? g.kalanM
  const yol = canli ? canli.gorev?.yol : g.yol
  const konumZamani = canli ? canli.konumZamani : g.ekipKonumu?.zaman
  const yerAdi = canli ? canli.yerAdi : g.ekipKonumu?.yerAdi
  const konumVar = canli ? canli.lon != null : g.ekipKonumu != null

  function gonder(yeni: GorevDurumu, ek?: { not?: string; olaySuruyor?: boolean }) {
    durum.mutate(
      { gorevId: g.id, durum: yeni, ...ek },
      {
        onSuccess: () => {
          setForm(null)
          setNot('')
          setSuruyor(false)
        },
      },
    )
  }

  return (
    <div className="mt-2 rounded-control border border-line-2 bg-sunken p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-subtitle font-semibold text-ink">{g.ekip.ad}</p>
          <p className="truncate text-small text-ink-2">{kurumTur(g.ekip) || 'kurum ve tür yazılmamış'}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <p className="text-title leading-none font-semibold text-ink">
            {g.kisiSayisi}
            <span className="text-small font-normal text-ink-2"> kişi</span>
          </p>
          <Rozet ton={d.ton}>{d.kisa}</Rozet>
        </div>
      </div>

      <GorevCizelgesi gorev={g} />

      <p className="mt-2 flex gap-1.5 text-small text-ink">
        <MapPin size={14} weight="bold" className="mt-0.5 shrink-0 text-accent" aria-hidden />
        <span>
          {konumVar ? (
            <>
              Ekip şu an {yerAdi ? `${yerAdi} yakınında` : 'haritada işaretli yerde'}
              {g.durum !== 'olay-yerinde' && uzaklikMetni(yol, kalanM) ? `, olaya ${uzaklikMetni(yol, kalanM)}` : ''}
              <span className="text-ink-3">
                {' '}
                · konum {konumZamani ? once(konumZamani, simdi) : 'zamanı bilinmiyor'}
              </span>
            </>
          ) : (
            <span className="text-ink-2">Ekibin konumu bildirilmedi.</span>
          )}
        </span>
      </p>
      <p className="mt-0.5 pl-5 text-small text-ink-3">
        {g.cikis?.yerAdi
          ? `${g.cikis.yerAdi} yakınından çıktı`
          : g.cikis
            ? 'Çıkış yeri kayıtlı'
            : 'Çıkış yeri bilinmiyor'}
        {g.ekDestek ? ' · ek destek olarak gönderildi' : ''}
        {g.atayanAd ? ` · gönderen ${g.atayanAd}` : ''}
      </p>
      {yol && yol.kapanmadanGecer > 0 && (
        <p className="mt-1 pl-5 text-small text-ink">
          Başka yol olmadığı için rota bilinen bir kapanmadan geçiyor.
        </p>
      )}
      {g.not && <p className="mt-1 pl-5 text-small text-ink">Not: {g.not}</p>}

      {form === null ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {sonraki && sonraki.durum !== 'tamamlandi' && (
            <button
              type="button"
              disabled={durum.isPending}
              onClick={() => gonder(sonraki.durum)}
              className="h-9 flex-1 rounded-control bg-accent px-2.5 text-body font-semibold text-accent-ink hover:bg-accent-deep hover:text-ink disabled:opacity-40"
            >
              {sonraki.eylem}
            </button>
          )}
          <button
            type="button"
            disabled={durum.isPending}
            onClick={() => setForm('tamamlandi')}
            className="h-9 rounded-control border border-line-2 px-2.5 text-body text-ink hover:bg-hover disabled:opacity-40"
          >
            İş bitti…
          </button>
          <button
            type="button"
            disabled={durum.isPending}
            onClick={() => setForm('iptal')}
            className="h-9 rounded-control border border-line-2 px-2.5 text-body text-ink-2 hover:bg-hover hover:text-ink disabled:opacity-40"
          >
            İptal…
          </button>
        </div>
      ) : (
        <div className="mt-2.5 rounded-control border border-line-2 p-2">
          <label className="block text-small text-ink-2" htmlFor={`not-${g.id}`}>
            {form === 'iptal' ? 'Neden iptal? (zorunlu; olay yeniden sıraya girer)' : 'Sonuç (isteğe bağlı)'}
          </label>
          <input
            id={`not-${g.id}`}
            value={not}
            maxLength={300}
            onChange={(e) => setNot(e.target.value)}
            placeholder={form === 'iptal' ? 'ör. yol kapalı, başka ekip gidiyor' : 'ör. 2 kişi kurtarıldı'}
            className="mt-1 w-full rounded-control border border-line-2 bg-panel px-2 py-1.5 text-body text-ink"
          />
          {form === 'tamamlandi' && (
            <label className="mt-2 flex items-start gap-2 text-small text-ink">
              <input
                type="checkbox"
                checked={suruyor}
                onChange={(e) => setSuruyor(e.target.checked)}
                className="mt-0.5 accent-accent"
              />
              Olay sürüyor, başka ekip ya da ekipman gerekiyor (olay kapanmaz, yeniden sıraya girer)
            </label>
          )}
          <div className="mt-2 flex gap-1.5">
            <button
              type="button"
              disabled={durum.isPending || (form === 'iptal' && !not.trim())}
              onClick={() =>
                gonder(form, {
                  not: not.trim() || undefined,
                  olaySuruyor: form === 'tamamlandi' ? suruyor : undefined,
                })
              }
              className="h-9 flex-1 rounded-control bg-accent px-2.5 text-body font-semibold text-accent-ink hover:bg-accent-deep hover:text-ink disabled:opacity-40"
            >
              {form === 'iptal' ? 'Görevi iptal et' : 'İş bitti olarak kaydet'}
            </button>
            <button
              type="button"
              onClick={() => setForm(null)}
              className="h-9 rounded-control border border-line-2 px-2.5 text-body text-ink-2 hover:bg-hover hover:text-ink"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}
      {durum.isError && (
        <p role="alert" className="mt-2 text-small text-crit">
          {durum.error instanceof Error ? durum.error.message : 'Durum kaydedilemedi.'}
        </p>
      )}
      <p className="mt-2 text-small text-ink-3">
        Ekip bu adımları kendi telefonundan işaretler; buradan telsizle gelen bilgiyi gir.
      </p>
    </div>
  )
}

function EkipSecici({
  hedefTur,
  hedefId,
  gidenler,
  onKapat,
}: {
  hedefTur: HedefTur
  hedefId: string
  gidenler: Gorev[]
  onKapat: () => void
}) {
  const adaylar = useAdayEkipler(hedefTur, hedefId, true)
  const sevk = useSevkEt()
  const oturum = useOturum().oturum
  const [secili, setSecili] = useState<string | null>(null)
  const [kisi, setKisi] = useState('')
  const [not, setNot] = useState('')
  const ekDestek = gidenler.length > 0
  const seciliAday = adaylar.data?.find((a) => a.ekip.id === secili) ?? null
  const kayitli = seciliAday?.ekip.kisiSayisi ?? null
  const kisiSayisi = kisi ? Number(kisi) : kayitli
  const kisiGecerli = kisiSayisi != null && kisiSayisi >= 1 && kisiSayisi <= (kayitli ?? 500)
  // Saha kullanıcısı yalnız kendi ekibini gönderebilir; sunucu da denetler.
  const yalnizKendi = oturum?.rol === 'saha' ? (oturum.ekipId ?? '') : null

  function neden(e: Ekip): string | null {
    if (e.durum === 'hizmet-disi') return 'Hizmet dışı'
    if (e.gorev)
      return `Görevde: ${hedefEtiketi(e.gorev.hedef)} · ${GOREV_DURUMU[e.gorev.durum].kisa.toLocaleLowerCase('tr')}`
    if (yalnizKendi !== null && e.id !== yalnizKendi) return 'Yalnız kendi ekibini gönderebilirsin'
    return null
  }

  return (
    <div className="mt-2.5 rounded-control border border-accent p-2.5">
      <p className="text-body font-semibold text-ink">
        {ekDestek ? 'Ek destek olarak hangi ekip gitsin?' : 'Hangi ekip gitsin?'}
      </p>
      {ekDestek && (
        <p className="mt-0.5 text-small text-ink-2">
          Bu olaya zaten {gidenler.map((g) => g.ekip.ad).join(', ')} gidiyor. Seçtiğin ekip ek destek olarak
          gidecek.
        </p>
      )}

      {adaylar.isPending && <p className="mt-2 text-small text-ink-3">Ekipler yükleniyor…</p>}
      {adaylar.isError && (
        <p role="alert" className="mt-2 text-small text-crit">
          Ekip listesi alınamadı.
        </p>
      )}
      {adaylar.data?.length === 0 && (
        <p className="mt-2 text-small text-ink-2">Kayıtlı ekip yok. Ekipler modunda ekip ekle.</p>
      )}
      {!!adaylar.data?.length && adaylar.data.every(({ ekip: e }) => neden(e)) && (
        <p className="mt-2 text-small text-ink">
          Şu an gönderilebilecek ekip yok. Görevdeki bir ekibin işi bitince, bir ekip hizmete dönünce ya da yeni
          ekip eklenince buradan gönderebilirsin.
        </p>
      )}

      {!!adaylar.data?.length && (
        <fieldset className="mt-2">
          <legend className="sr-only">Ekip</legend>
          <ul className="max-h-60 overflow-auto rounded-control border border-line-2">
            {adaylar.data.map(({ ekip: e, mesafeM, yol }) => {
              const engel = neden(e)
              return (
                <li key={e.id} className="border-b border-line last:border-b-0">
                  <label
                    className={sn(
                      'flex items-start gap-2 px-2.5 py-2',
                      engel ? 'opacity-50' : 'cursor-pointer hover:bg-hover',
                      secili === e.id && 'bg-accent-soft',
                    )}
                  >
                    <input
                      type="radio"
                      name={`ekip-${hedefId}`}
                      value={e.id}
                      disabled={!!engel}
                      checked={secili === e.id}
                      onChange={() => {
                        setSecili(e.id)
                        setKisi('')
                      }}
                      className="mt-1 accent-accent"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-body text-ink">{e.ad}</span>
                        <span className="shrink-0 text-right font-mono text-small text-ink-2">
                          {yol ? `~${sureMetni(yol.sureDk)}` : mesafeM != null ? mesafe(mesafeM) : 'konum yok'}
                          <span className="block text-ink-3">
                            {yol ? `yoldan ${mesafe(yol.mesafeM)}` : mesafeM != null ? 'kuş uçuşu' : ''}
                          </span>
                        </span>
                      </span>
                      <span className="block truncate text-small text-ink-2">
                        {[kurumTur(e), e.kisiSayisi ? `${e.kisiSayisi} kişi` : 'kişi sayısı yok']
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                      {engel && <span className="block text-small text-ink-3">{engel}</span>}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        </fieldset>
      )}

      {seciliAday && (
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <Alan
            etiket={kayitli ? `Kaç kişi gidiyor? (en çok ${kayitli})` : 'Kaç kişi gidiyor? (zorunlu)'}
            kimlik={`kisi-${hedefId}`}
          >
            <input
              id={`kisi-${hedefId}`}
              type="number"
              inputMode="numeric"
              min={1}
              max={kayitli ?? 500}
              value={kisi}
              placeholder={kayitli ? String(kayitli) : ''}
              onChange={(e) => setKisi(e.target.value)}
              className="w-full rounded-control border border-line-2 bg-panel px-2 py-1.5 text-body text-ink"
            />
          </Alan>
          <Alan etiket="Not (isteğe bağlı)" kimlik={`not-${hedefId}`}>
            <input
              id={`not-${hedefId}`}
              value={not}
              maxLength={300}
              onChange={(e) => setNot(e.target.value)}
              placeholder="ör. vinç gerekebilir"
              className="w-full rounded-control border border-line-2 bg-panel px-2 py-1.5 text-body text-ink"
            />
          </Alan>
        </div>
      )}

      <div className="mt-2.5 flex gap-1.5">
        <button
          type="button"
          disabled={!seciliAday || !kisiGecerli || sevk.isPending}
          onClick={() =>
            seciliAday &&
            kisiSayisi != null &&
            sevk.mutate(
              {
                hedefTur,
                hedefId,
                ekipId: seciliAday.ekip.id,
                kisiSayisi,
                not: not.trim() || undefined,
                ekDestek,
              },
              { onSuccess: onKapat },
            )
          }
          className="h-10 flex-1 rounded-control bg-accent px-2.5 text-body font-semibold text-accent-ink hover:bg-accent-deep hover:text-ink disabled:opacity-40"
        >
          {seciliAday
            ? `${ekDestek ? 'Ek destek gönder' : 'Gönder'}: ${seciliAday.ekip.ad}${kisiSayisi ? `, ${kisiSayisi} kişi` : ''}`
            : 'Önce ekip seç'}
        </button>
        <button
          type="button"
          onClick={onKapat}
          className="h-10 rounded-control border border-line-2 px-2.5 text-body text-ink-2 hover:bg-hover hover:text-ink"
        >
          Vazgeç
        </button>
      </div>
      {sevk.isError && (
        <p role="alert" className="mt-2 text-small text-crit">
          {sevk.error instanceof Error ? sevk.error.message : 'Ekip gönderilemedi.'}
        </p>
      )}
      <p className="mt-2 text-small text-ink-3">
        Süre ekibin son bildirdiği konumdan, araç yolundan tahmin: tek yönlere uyar, bilinen kapanmalardan
        kaçınır; hız yol türüne göre ortalama bir varsayım, anlık trafik verisi yok. Yol ağı dışındaki ekip
        için kuş uçuşu yazılır.
      </p>
    </div>
  )
}

function Alan({ etiket, kimlik, children }: { etiket: string; kimlik: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={kimlik} className="block text-small text-ink-2">
        {etiket}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  )
}
