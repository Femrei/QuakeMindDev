import { useId, useState } from 'react'
import { Amac, Bolum, HazirSecenekler, InceAyar, SuAn, Teknik, VeriYok } from '@/kabuk/Panel'
import { Micro, Rozet } from '@/kabuk/parcalar'
import { BildirimKarti } from '@/kabuk/BildirimKarti'
import { useOturum } from '@/kimlik/oturum'
import { ApiHatasi } from '@/veri/istemci'
import {
  ONEM,
  onemi,
  useBildirimGecmisi,
  useBildirimKaldir,
  useBildirimYayinla,
  type BildirimKaydi,
  type BildirimOnemi,
} from '@/veri/bildirim'
import { sayi, saat, tarihSaat } from '@/lib/bicim'
import { sn } from '@/lib/sinif'

/* ---------------------------------------------------------------------------
   Acil bildirim modu (J-45). Koordinatör afetzede ekranlarına bildirim
   yayınlar ve yanlış ya da tanımadığı bildirimi geri çeker. Yetkiyi sunucu
   denetler (yalnız koordinatör ve yönetici); buradaki kilit yalnız görünüm.
--------------------------------------------------------------------------- */

const YAYINLAYABILIR = ['koordinator', 'yonetici']

/* Şablonlar veri değildir: köşeli ayraçlı yerler doldurulmadan yayın açılmaz,
   böylece şablon metni gerçek bir olaymış gibi gidemez (kural 1). */
const SABLONLAR = [
  {
    id: 'artci',
    etiket: 'Artçı sarsıntı',
    onem: 'uyari',
    baslik: 'Artçı sarsıntı uyarısı',
    metin: 'Hasarlı binalara girmeyin, açık alanda kalın. En yakın toplanma alanı ekranınızın altında.',
  },
  {
    id: 'tahliye',
    etiket: 'Tahliye',
    onem: 'acil',
    baslik: '[bölge] için tahliye',
    metin: '[bölge] bölgesindeki binaları boşaltın ve en yakın toplanma alanına geçin. Asansör kullanmayın.',
  },
  {
    id: 'dagitim',
    etiket: 'Dağıtım noktası',
    onem: 'bilgi',
    baslik: 'Su ve gıda dağıtımı',
    metin: '[yer] noktasında [saat] itibarıyla su ve gıda dağıtılıyor.',
  },
  {
    id: 'yol',
    etiket: 'Yol kapalı',
    onem: 'uyari',
    baslik: '[yol] ulaşıma kapalı',
    metin: '[yol] enkaz nedeniyle kapalı. [alternatif yol] kullanın.',
  },
] as const satisfies ReadonlyArray<{
  id: string
  etiket: string
  onem: BildirimOnemi
  baslik: string
  metin: string
}>
type SablonId = (typeof SABLONLAR)[number]['id']

const YER_TUTUCU = /\[[^\]]*\]/g
const BASLIK_SINIRI = 120
const METIN_SINIRI = 1000

function hataMetni(e: unknown): string {
  if (e instanceof ApiHatasi) {
    if (e.durum === 403) return 'Bu işlem için yetkin yok: yalnız koordinatör ve yönetici yayınlar.'
    if (e.durum === 401) return 'Oturumun kapanmış; yeniden giriş yap.'
    return e.message
  }
  if (e instanceof TypeError) return 'Sunucuya ulaşılamadı.'
  return e instanceof Error ? e.message : 'Bilinmeyen hata.'
}

export function BildirimSol() {
  const kimlik = useId()
  const { oturum } = useOturum()
  const yetkili = !!oturum && YAYINLAYABILIR.includes(oturum.rol)
  const gecmis = useBildirimGecmisi()
  const yayinla = useBildirimYayinla()

  const [sablon, setSablon] = useState<SablonId | null>(null)
  const [bekleyenSablon, setBekleyenSablon] = useState<SablonId | null>(null)
  const [onem, setOnem] = useState<BildirimOnemi>('uyari')
  const [baslik, setBaslik] = useState('')
  const [metin, setMetin] = useState('')
  const [konum, setKonum] = useState('')
  const [buyukluk, setBuyukluk] = useState('')
  const [onayda, setOnayda] = useState(false)
  const [son, setSon] = useState<BildirimKaydi | null>(null)

  function sablonUygula(id: SablonId) {
    const s = SABLONLAR.find((x) => x.id === id)!
    setSablon(id)
    setBekleyenSablon(null)
    setOnem(s.onem)
    setBaslik(s.baslik)
    setMetin(s.metin)
    setOnayda(false)
  }

  function sablonSec(id: SablonId) {
    // Elle yazılmış metin sessizce ezilmesin.
    const oncekiSablon = SABLONLAR.find((x) => x.id === sablon)
    const elleYazildi =
      (baslik.trim() || metin.trim()) &&
      !(oncekiSablon && oncekiSablon.baslik === baslik && oncekiSablon.metin === metin)
    if (elleYazildi) setBekleyenSablon(id)
    else sablonUygula(id)
  }

  const bosYerler = [...new Set(`${baslik} ${metin}`.match(YER_TUTUCU) ?? [])]
  const buyuklukSayi = buyukluk.trim() === '' ? undefined : Number(buyukluk.replace(',', '.'))
  const buyuklukGecersiz =
    buyuklukSayi !== undefined && (!Number.isFinite(buyuklukSayi) || buyuklukSayi < 0 || buyuklukSayi > 10)
  const eksik = [
    baslik.trim().length < 3 && 'başlık (en az 3 harf)',
    metin.trim().length < 3 && 'metin (en az 3 harf)',
    bosYerler.length > 0 && `şablondaki ${bosYerler.join(', ')} alanlarını doldur`,
    buyuklukGecersiz && 'büyüklük 0 ile 10 arasında olmalı',
  ].filter(Boolean)

  function gonder() {
    yayinla.mutate(
      {
        baslik: baslik.trim(),
        metin: metin.trim(),
        onem,
        konum: konum.trim() || undefined,
        buyukluk: buyuklukSayi,
      },
      {
        onSuccess: (k) => {
          setSon(k)
          setOnayda(false)
          setSablon(null)
          setBaslik('')
          setMetin('')
          setKonum('')
          setBuyukluk('')
        },
        onError: () => setOnayda(false),
      },
    )
  }

  const yayindaSayisi = (gecmis.data ?? []).filter((b) => !b.kaldirildi).length
  const alan = 'mt-1.5 w-full rounded-control border border-line-2 bg-sunken px-2.5 py-2 text-body text-ink disabled:opacity-50'

  return (
    <Bolum baslik="Acil bildirim" ek={<Micro>{sayi(yayindaSayisi)} yayında</Micro>}>
      <Amac>
        Afetzedelerin ekranının en üstüne düşen duyuru. Yayınladığın anda bütün afetzede ve ekip
        ekranlarına gider.
      </Amac>

      {!yetkili && (
        <p className="mt-2.5 rounded-control border border-line-2 px-2.5 py-2 text-small text-ink-2">
          Yalnız koordinatör ve yönetici yayınlayabilir. Yayındaki bildirimleri sağ panelde
          görebilirsin.
        </p>
      )}

      <HazirSecenekler
        etiket="Bildirim şablonları"
        secenekler={SABLONLAR}
        secili={sablon}
        onSec={sablonSec}
      />
      {bekleyenSablon && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-small text-ink-2">
          Yazdığın metin şablonla değişsin mi?
          <button
            type="button"
            onClick={() => sablonUygula(bekleyenSablon)}
            className="rounded-control border border-line-2 px-2 py-1 hover:bg-hover"
          >
            Değiştir
          </button>
          <button
            type="button"
            onClick={() => setBekleyenSablon(null)}
            className="rounded-control border border-line-2 px-2 py-1 hover:bg-hover"
          >
            Vazgeç
          </button>
        </div>
      )}

      <Micro className="mt-3.5 block">Önem</Micro>
      <div role="group" aria-label="Önem" className="mt-1.5 flex gap-1.5">
        {(Object.keys(ONEM) as BildirimOnemi[]).map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={onem === o}
            disabled={!yetkili}
            onClick={() => setOnem(o)}
            className={sn(
              'flex-1 rounded-control border px-2 py-1.5 text-body transition-colors duration-150 ease-out-qm disabled:opacity-50',
              onem === o ? 'border-accent bg-accent-soft text-ink' : 'border-line-2 text-ink-2 hover:bg-hover',
            )}
          >
            {ONEM[o].ad}
          </button>
        ))}
      </div>
      <p className="mt-1 text-small text-ink-3">{ONEM[onem].aciklama}.</p>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <label htmlFor={`${kimlik}-b`}>
          <Micro>Başlık</Micro>
        </label>
        <span className="text-small text-ink-3">
          {baslik.length}/{BASLIK_SINIRI}
        </span>
      </div>
      <input
        id={`${kimlik}-b`}
        value={baslik}
        maxLength={BASLIK_SINIRI}
        disabled={!yetkili}
        onChange={(e) => setBaslik(e.target.value)}
        className={alan}
      />

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <label htmlFor={`${kimlik}-m`}>
          <Micro>Metin</Micro>
        </label>
        <span className="text-small text-ink-3">
          {metin.length}/{METIN_SINIRI}
        </span>
      </div>
      <textarea
        id={`${kimlik}-m`}
        rows={4}
        value={metin}
        maxLength={METIN_SINIRI}
        disabled={!yetkili}
        onChange={(e) => setMetin(e.target.value)}
        className={alan}
      />

      <InceAyar baslik="İsteğe bağlı">
        <div className="grid grid-cols-2 gap-1.5">
          <label className="text-small text-ink-2">
            Bölge
            <input
              value={konum}
              maxLength={120}
              disabled={!yetkili}
              placeholder="ör. Antakya"
              onChange={(e) => setKonum(e.target.value)}
              className={alan}
            />
          </label>
          <label className="text-small text-ink-2">
            Deprem büyüklüğü
            <input
              value={buyukluk}
              inputMode="decimal"
              disabled={!yetkili}
              placeholder="boş bırak"
              onChange={(e) => setBuyukluk(e.target.value)}
              className={alan}
            />
          </label>
        </div>
      </InceAyar>

      {(baslik || metin) && (
        <div className="mt-3">
          <Micro className="block">Afetzede ekranında</Micro>
          <div className="mt-1.5">
            <BildirimKarti
              b={{
                baslik: baslik || '—',
                metin,
                onem,
                konum: konum.trim() || null,
                buyukluk: buyuklukGecersiz ? null : (buyuklukSayi ?? null),
                zaman: null,
              }}
            />
          </div>
        </div>
      )}

      {onayda ? (
        <div className="mt-3 rounded-control border border-line-2 px-2.5 py-2.5">
          <p className="text-small text-ink">
            Bu bildirim bütün afetzede ve ekip ekranlarına hemen gider. Yanlışsa sağ panelden geri
            çekebilirsin.
          </p>
          <div className="mt-2 flex gap-1.5">
            <button
              type="button"
              disabled={yayinla.isPending}
              onClick={gonder}
              className="flex-1 rounded-control bg-accent px-3 py-2 text-body font-semibold text-accent-ink disabled:opacity-50"
            >
              {yayinla.isPending ? 'Yayınlanıyor…' : 'Evet, yayınla'}
            </button>
            <button
              type="button"
              disabled={yayinla.isPending}
              onClick={() => setOnayda(false)}
              className="rounded-control border border-line-2 px-3 py-2 text-body text-ink-2 hover:bg-hover"
            >
              Vazgeç
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={!yetkili || eksik.length > 0}
          onClick={() => {
            setSon(null)
            setOnayda(true)
          }}
          className="mt-3 w-full rounded-control bg-accent px-3 py-2 text-body font-semibold text-accent-ink disabled:opacity-40"
        >
          Yayınla…
        </button>
      )}

      {yetkili && eksik.length > 0 && (baslik || metin) && (
        <p className="mt-2 text-small text-ink-3">Yayın için: {eksik.join(' · ')}.</p>
      )}

      {yayinla.isError && (
        <p role="alert" className="mt-2 text-small text-crit">
          Yayınlanamadı: {hataMetni(yayinla.error)}
        </p>
      )}

      <SuAn>
        {son
          ? `Yayınlandı · ${saat(son.zaman)} · “${son.baslik}”. Afetzede ekranlarına canlı akışla gitti.`
          : yetkili
            ? 'Şablon seç ya da boş başla; önizleme afetzedenin göreceği hâldir.'
            : 'Yalnız görüntüleme.'}
      </SuAn>

      <Teknik>
        Bildirim sunucuda saklanır; sunucu yeniden başlasa da yayında kalır. Canlı akışla anında
        gider, kimse yoklama yapmaz. Afetzede en yeni 5 bildirimi görür, yayınlayanın adını görmez;
        ad kayda geçer.
      </Teknik>
    </Bolum>
  )
}

export function BildirimSag() {
  const { oturum } = useOturum()
  const yetkili = !!oturum && YAYINLAYABILIR.includes(oturum.rol)
  const gecmis = useBildirimGecmisi()
  const kaldir = useBildirimKaldir()
  const [soruluyor, setSoruluyor] = useState<string | null>(null)

  const liste = gecmis.data ?? []
  const yayinda = liste.filter((b) => !b.kaldirildi)
  const cekilen = liste.filter((b) => b.kaldirildi)

  return (
    <>
      <Bolum baslik="Yayında" ek={<Micro>{sayi(yayinda.length)} bildirim</Micro>}>
        <Amac>Afetzede ekranlarında şu an görünenler. Yanlış ya da tanımadığın bildirimi geri çek.</Amac>
        <div className="mt-2.5">
          {gecmis.isPending ? (
            <p className="text-small text-ink-3">Yükleniyor…</p>
          ) : gecmis.isError ? (
            <VeriYok ne="Bildirim listesi" neden="uç yanıt vermedi" />
          ) : yayinda.length === 0 ? (
            <VeriYok ne="Yayındaki bildirim" neden="şu an yayında bildirim yok" />
          ) : (
            <ul>
              {yayinda.map((b) => (
                <li key={b.id} className="border-b border-line py-2.5 first:pt-0 last:border-b-0">
                  <BildirimSatiri b={b} />
                  {b.kaynak === 'eski' && (
                    <p className="mt-1 text-small text-ink">
                      Dikkat: eski web ucundan geldi. O uç kodda sabit demo jetonlarını kabul ediyor
                      (J-45); tanımadığın bir bildirimse geri çek.
                    </p>
                  )}
                  {yetkili &&
                    (soruluyor === b.id ? (
                      <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-small text-ink-2">
                        Afetzede ekranlarından kalksın mı?
                        <button
                          type="button"
                          disabled={kaldir.isPending}
                          onClick={() =>
                            kaldir.mutate(b.id, { onSettled: () => setSoruluyor(null) })
                          }
                          className="rounded-control border border-line-2 px-2 py-1 text-ink hover:bg-hover disabled:opacity-50"
                        >
                          {kaldir.isPending ? 'Çekiliyor…' : 'Evet, geri çek'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSoruluyor(null)}
                          className="rounded-control border border-line-2 px-2 py-1 hover:bg-hover"
                        >
                          Vazgeç
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSoruluyor(b.id)}
                        className="mt-1.5 rounded-control border border-line-2 px-2 py-1 text-small text-ink-2 hover:bg-hover hover:text-ink"
                      >
                        Geri çek
                      </button>
                    ))}
                </li>
              ))}
            </ul>
          )}
        </div>
        {kaldir.isError && (
          <p role="alert" className="mt-2 text-small text-crit">
            Geri çekilemedi: {hataMetni(kaldir.error)}
          </p>
        )}
        <Teknik>
          Afetzede yayındaki en yeni 5 bildirimi görür. Geri çekilen bildirim silinmez; kim ve ne
          zaman çektiği kayıtta kalır.
        </Teknik>
      </Bolum>

      <Bolum baslik="Geri çekilenler" ek={<Micro>{sayi(cekilen.length)}</Micro>}>
        {cekilen.length === 0 ? (
          <VeriYok ne="Geri çekilen bildirim" neden="son 30 bildirimde yok" />
        ) : (
          <ul>
            {cekilen.map((b) => (
              <li key={b.id} className="border-b border-line py-2.5 first:pt-0 last:border-b-0">
                <BildirimSatiri b={b} />
                <p className="mt-0.5 text-small text-ink-3">
                  Geri çekildi · {b.kaldirildi ? tarihSaat(b.kaldirildi) : '—'}
                  {b.kaldiran ? ` · ${b.kaldiran}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Bolum>
    </>
  )
}

function BildirimSatiri({ b }: { b: BildirimKaydi }) {
  const o = onemi(b.onem)
  return (
    <>
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-body text-ink">{b.baslik}</span>
        <Rozet ton={o.ton}>{o.ad}</Rozet>
      </span>
      <span className="mt-0.5 block text-small text-ink-2">{b.metin}</span>
      <span className="mt-0.5 block text-small text-ink-3">
        {tarihSaat(b.zaman)} · {b.gonderen ?? 'gönderen bilinmiyor'} ·{' '}
        {b.kaynak === 'eski' ? 'eski web ucu' : 'konsol'}
      </span>
    </>
  )
}
