import { useId, useState, type ReactNode } from 'react'
import { Amac, Bolum, Panel } from '@/kabuk/Panel'
import { Micro } from '@/kabuk/parcalar'
import { ApiHatasi } from '@/veri/istemci'
import { IHTIYAC_ADI, type Ihtiyac, type SosCagrisi } from '@/veri/sorgular'
import { dogruluk, saat, tarihSaat } from '@/lib/bicim'
import { sn } from '@/lib/sinif'
import { DURUMLAR, ISLEM_DURUMU } from './etiketler'
import { KABA_DOGRULUK_M, type GpsDurumu } from './konum'
import { MahalleSecici, YER_TURU } from './MahalleSecici'
import { useCagriGonder, type Yer } from './veri'

/* ---------------------------------------------------------------------------
   Yardım çağrısı (J-43). Eski webdeki üç sorun burada yok:
   · Gönderim başarısız olunca "SOS sinyaliniz alındı" yazmıyor; hata ve
     sebebi yazılır, bilgiler silinmez.
   · Konum alınamazsa Antakya merkezine düşen sessiz bir varsayılan yok;
     konum ya cihazdan ya afetzedenin seçtiği mahalleden gelir ve hangisi
     olduğu çağrıyla birlikte kaydedilir.
   · Kişi sayısı ve ihtiyaçlar mesajın içine metin olarak gömülmüyor;
     ekiplerin süzebileceği alanlar olarak gider.
--------------------------------------------------------------------------- */

export type EtkinKonum =
  | { kaynak: 'gps'; lon: number; lat: number; dogrulukM: number }
  | { kaynak: 'mahalle'; lon: number; lat: number; yer: Yer }

const METIN_SINIRI = 500

function hataMetni(e: unknown): string {
  if (e instanceof ApiHatasi) {
    if (e.durum === 401) return 'Oturumun kapanmış; yeniden giriş yapıp gönder.'
    if (e.durum === 422) return `Sunucu bilgileri kabul etmedi: ${e.message}.`
    if (e.durum >= 500) return 'Sunucu çağrıyı şu an kaydedemedi.'
    return e.message
  }
  if (e instanceof TypeError) return 'Sunucuya ulaşılamadı; internet bağlantın kopmuş olabilir.'
  return e instanceof Error ? e.message : 'Bilinmeyen bir hata oluştu.'
}

type Props = {
  konum: EtkinKonum | null
  gps: GpsDurumu
  gpsIste: () => void
  mahalleSec: (yer: Yer | null) => void
  /** Afetzedenin açık (kapanmamış) çağrısı; varsa ikinci çağrıdan önce hatırlatılır. */
  acikCagri: SosCagrisi | null
  /** Canlı akışla tazelenen liste: gönderilen çağrının güncel durumu buradan okunur. */
  cagrilar: SosCagrisi[]
}

export function CagriFormu({ konum, gps, gpsIste, mahalleSec, acikCagri, cagrilar }: Props) {
  const notKimligi = useId()
  const [oncelik, setOncelik] = useState<SosCagrisi['oncelik'] | null>(null)
  const [kisi, setKisi] = useState(1)
  const [ihtiyaclar, setIhtiyaclar] = useState<Ihtiyac[]>([])
  const [metin, setMetin] = useState('')
  const [gonderilen, setGonderilen] = useState<SosCagrisi | null>(null)
  const gonder = useCagriGonder()

  const ihtiyacDegistir = (i: Ihtiyac) =>
    setIhtiyaclar((l) => (l.includes(i) ? l.filter((x) => x !== i) : [...l, i]))

  function gonderTikla() {
    if (!oncelik || !konum) return
    gonder.mutate(
      {
        lon: konum.lon,
        lat: konum.lat,
        oncelik,
        kisiSayisi: kisi,
        ihtiyaclar: ihtiyaclar.length ? ihtiyaclar : undefined,
        metin: metin.trim() || undefined,
        mahalle: konum.kaynak === 'mahalle' ? konum.yer.ad : undefined,
        konumKaynagi: konum.kaynak,
        konumDogrulukM: konum.kaynak === 'gps' ? Math.round(konum.dogrulukM) : undefined,
      },
      {
        onSuccess: (c) => {
          setGonderilen(c)
          setOncelik(null)
          setIhtiyaclar([])
          setMetin('')
        },
      },
    )
  }

  const eksik = [!oncelik && 'durumunu seç', !konum && 'konumun gerekli'].filter(Boolean)
  const guncel = gonderilen ? (cagrilar.find((c) => c.id === gonderilen.id) ?? gonderilen) : null

  return (
    <Panel baslik="Yardım çağrısı">
      <Bolum>
        <Amac>
          Durumunu seç, konumunu doğrula ve gönder. Çağrın koordinasyon ekranına düşer; ekip
          atanınca burada görürsün.
        </Amac>

        <Micro className="mt-4 block">Durumun</Micro>
        <div role="group" aria-label="Durumun" className="mt-1.5 grid gap-1.5">
          {DURUMLAR.map((d) => (
            <button
              key={d.oncelik}
              type="button"
              aria-pressed={oncelik === d.oncelik}
              onClick={() => setOncelik(d.oncelik)}
              className={sn(
                'rounded-control border px-3 py-3 text-left transition-colors duration-150 ease-out-qm',
                oncelik === d.oncelik ? 'border-accent bg-accent-soft' : 'border-line-2 hover:bg-hover',
              )}
            >
              <span className="block text-subtitle text-ink">{d.etiket}</span>
              <span className="mt-0.5 block text-small text-ink-3">{d.aciklama}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span>
            <span className="block text-body text-ink">Kaç kişisiniz?</span>
            <span className="block text-small text-ink-3">Seninle birlikte yardım bekleyen</span>
          </span>
          <span className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Bir kişi azalt"
              disabled={kisi <= 1}
              onClick={() => setKisi((k) => Math.max(1, k - 1))}
              className="h-10 w-10 rounded-control border border-line-2 text-subtitle text-ink disabled:opacity-40"
            >
              −
            </button>
            <output aria-live="polite" className="w-10 text-center font-mono text-title text-ink">
              {kisi}
            </output>
            <button
              type="button"
              aria-label="Bir kişi artır"
              disabled={kisi >= 500}
              onClick={() => setKisi((k) => Math.min(500, k + 1))}
              className="h-10 w-10 rounded-control border border-line-2 text-subtitle text-ink disabled:opacity-40"
            >
              +
            </button>
          </span>
        </div>

        <Micro className="mt-4 block">İhtiyaçlar · isteğe bağlı</Micro>
        <div role="group" aria-label="İhtiyaçlar" className="mt-1.5 grid grid-cols-2 gap-1.5">
          {(Object.keys(IHTIYAC_ADI) as Ihtiyac[]).map((i) => (
            <button
              key={i}
              type="button"
              aria-pressed={ihtiyaclar.includes(i)}
              onClick={() => ihtiyacDegistir(i)}
              className={sn(
                'rounded-control border px-2.5 py-2.5 text-left text-body transition-colors duration-150 ease-out-qm',
                ihtiyaclar.includes(i)
                  ? 'border-accent bg-accent-soft text-ink'
                  : 'border-line-2 text-ink-2 hover:bg-hover',
              )}
            >
              {IHTIYAC_ADI[i]}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-baseline justify-between gap-2">
          <label htmlFor={notKimligi}>
            <Micro>Not · isteğe bağlı</Micro>
          </label>
          <span className="text-small text-ink-3">
            {metin.length}/{METIN_SINIRI}
          </span>
        </div>
        <textarea
          id={notKimligi}
          rows={3}
          maxLength={METIN_SINIRI}
          value={metin}
          onChange={(e) => setMetin(e.target.value)}
          placeholder="Bina adı, kat, giriş yönü, yaralının durumu…"
          className="mt-1.5 w-full rounded-control border border-line-2 bg-sunken px-2.5 py-2 text-body text-ink"
        />

        <KonumBolumu konum={konum} gps={gps} gpsIste={gpsIste} mahalleSec={mahalleSec} />

        {acikCagri && !gonderilen && (
          <p className="mt-4 rounded-control border border-line-2 px-2.5 py-2 text-small text-ink-2">
            Açık bir çağrın var: {tarihSaat(acikCagri.zaman)} ·{' '}
            {ISLEM_DURUMU[acikCagri.durum].ad.toLocaleLowerCase('tr-TR')}. Durumun değiştiyse
            (ör. yaralı oldu) yeni çağrı gönder; değişmediyse ikinci çağrıya gerek yok.
          </p>
        )}

        <button
          type="button"
          disabled={eksik.length > 0 || gonder.isPending}
          onClick={gonderTikla}
          className="mt-4 w-full rounded-control bg-crit px-3 py-3.5 text-subtitle font-semibold text-ground disabled:opacity-40"
        >
          {gonder.isPending ? 'Gönderiliyor…' : gonder.isError ? 'Tekrar gönder' : 'Yardım çağır'}
        </button>

        {/* Gönderimden sonra seçim sıfırlanır; o an "durumunu seç" yazmak
            çağrı gitmemiş gibi okunuyordu. İpucu yeni çağrıya başlayınca döner. */}
        {eksik.length > 0 && !gonder.isPending && !(guncel && !oncelik) && (
          <p className="mt-2 text-small text-ink-3">Göndermek için: {eksik.join(' · ')}.</p>
        )}

        {gonder.isError && (
          <div role="alert" className="mt-3 rounded-control border border-crit px-2.5 py-2.5">
            <p className="text-body text-crit">Çağrın gönderilemedi.</p>
            <p className="mt-0.5 text-small text-ink-2">
              {hataMetni(gonder.error)} Bilgilerin duruyor, tekrar gönderebilirsin. Şebeke varsa
              112'yi de ara.
            </p>
          </div>
        )}

        {guncel && !gonder.isError && (
          <div role="status" className="mt-3 rounded-control border border-ok px-2.5 py-2.5">
            <p className="text-body text-ink">Çağrın alındı · {saat(guncel.zaman)}</p>
            <p className="mt-0.5 text-small text-ink-2">
              Durum: {ISLEM_DURUMU[guncel.durum].ad} — {ISLEM_DURUMU[guncel.durum].aciklama}
            </p>
            <p className="mt-0.5 text-small text-ink-3">
              Durum değişince burada ve “Çağrılarım”da kendiliğinden güncellenir.
            </p>
          </div>
        )}
      </Bolum>
    </Panel>
  )
}

/* ---- konum --------------------------------------------------------------- */

function KonumBolumu({
  konum,
  gps,
  gpsIste,
  mahalleSec,
}: Pick<Props, 'konum' | 'gps' | 'gpsIste' | 'mahalleSec'>) {
  const [seciyor, setSeciyor] = useState(false)
  const gpsKonumu = gps.durum === 'hata' ? null : gps.konum

  const dugme =
    'rounded-control border border-line-2 px-2.5 py-1.5 text-small text-ink-2 hover:bg-hover hover:text-ink'

  let icerik: ReactNode
  let eylemler: ReactNode

  if (konum?.kaynak === 'mahalle') {
    icerik = (
      <>
        <span className="block text-body text-ink">
          {konum.yer.ad} · {YER_TURU[konum.yer.tur]} · {konum.yer.bolgeAd}
        </span>
        <span className="mt-0.5 block text-small text-ink-2">
          Mahalle merkezi, yaklaşık konum. Ekip seni bulabilsin diye nota sokak, bina ve kat yaz.
        </span>
      </>
    )
    eylemler = (
      <>
        <button type="button" className={dugme} onClick={() => setSeciyor((s) => !s)}>
          Değiştir
        </button>
        {gpsKonumu && (
          <button type="button" className={dugme} onClick={() => mahalleSec(null)}>
            Cihaz konumunu kullan
          </button>
        )}
      </>
    )
  } else if (konum?.kaynak === 'gps') {
    const kaba = konum.dogrulukM > KABA_DOGRULUK_M
    icerik = (
      <>
        <span className="block text-body text-ink">
          {gps.durum === 'araniyor' ? 'Konumun alındı, iyileştiriliyor…' : 'Cihaz konumun alındı'}
        </span>
        <span className="mt-0.5 block text-small text-ink-2">
          {dogruluk(konum.dogrulukM)} doğruluk ·{' '}
          <span className="font-mono">
            {konum.lat.toFixed(5)}, {konum.lon.toFixed(5)}
          </span>
        </span>
        {kaba && (
          <span className="mt-1 block text-small text-ink">
            Dikkat: doğruluk düşük, ekip seni bu genişlikte bir alanda arar. Mahalleni seçmek ya da
            nota adres yazmak işe yarar.
          </span>
        )}
      </>
    )
    eylemler = (
      <>
        {gps.durum === 'alindi' && (
          <button type="button" className={dugme} onClick={gpsIste}>
            Yenile
          </button>
        )}
        <button type="button" className={dugme} onClick={() => setSeciyor((s) => !s)}>
          Mahalle seç
        </button>
      </>
    )
  } else if (gps.durum === 'araniyor') {
    icerik = <span className="block text-body text-ink-2">Konumun alınıyor…</span>
    eylemler = (
      <button type="button" className={dugme} onClick={() => setSeciyor((s) => !s)}>
        Mahalle seç
      </button>
    )
  } else {
    const neden =
      gps.durum === 'hata' && gps.neden === 'izin'
        ? 'Konum izni verilmedi. İzin verirsen çağrın tam yerine düşer; vermezsen mahalleni seç.'
        : gps.durum === 'hata' && gps.neden === 'desteklenmiyor'
          ? 'Bu tarayıcı konum vermiyor. Mahalleni seç.'
          : 'Konum bulunamadı. Açık alana çıkıp tekrar dene ya da mahalleni seç.'
    icerik = (
      <>
        <span className="block text-body text-ink">Konum yok</span>
        <span className="mt-0.5 block text-small text-ink-2">{neden}</span>
        <span className="mt-1 block text-small text-ink-3">
          Konum olmadan çağrı gönderilemez: ekip nereye gideceğini bilemez. Mahallen listede
          yoksa 112'yi ara.
        </span>
      </>
    )
    eylemler = (
      <>
        {!(gps.durum === 'hata' && gps.neden === 'desteklenmiyor') && (
          <button type="button" className={dugme} onClick={gpsIste}>
            Tekrar dene
          </button>
        )}
        <button type="button" className={dugme} onClick={() => setSeciyor((s) => !s)}>
          Mahalle seç
        </button>
      </>
    )
  }

  return (
    <div className="mt-4">
      <Micro className="block">Konum</Micro>
      <div
        aria-live="polite"
        className="mt-1.5 rounded-control border border-line-2 bg-sunken px-2.5 py-2.5"
      >
        {icerik}
        <span className="mt-2 flex flex-wrap gap-1.5">{eylemler}</span>
      </div>
      {seciyor && (
        <MahalleSecici
          onSec={(y) => {
            mahalleSec(y)
            setSeciyor(false)
          }}
        />
      )}
    </div>
  )
}
