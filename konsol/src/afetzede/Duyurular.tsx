import { useEffect, useState } from 'react'
import { Bell, BellRinging, Megaphone, X } from '@phosphor-icons/react'
import { BildirimKarti } from '@/kabuk/BildirimKarti'
import { Rozet } from '@/kabuk/parcalar'
import { saat } from '@/lib/bicim'
import { sn } from '@/lib/sinif'
import { enOnemli, onemi, type Bildirim } from '@/veri/bildirim'
import { useYeniDuyuru } from '@/canli/yeniOlaylar'
import { IlkAdimlar } from './parcalar'

/* ---------------------------------------------------------------------------
   Koordinasyonun duyuruları (J-43, J-45, J-51).
   · En yenisi sayfanın üstünde tek satırlık bantta durur.
   · Geniş ekranda (≥ 1600 px) sağ sütunun tamamı duyurulardır; daha dar
     ekranda duyurular üst çubuktaki düğmeyle pencerede açılır.
   · Yeni duyuru gelince ekranın üstünde uyarı çıkar (kullanıcı: "duyurular
     ilgi çekmeli, bildirim düşmeli"); izin verildiyse tarayıcı bildirimi de.
   Canlı akıştaki "bildirim" mesajıyla tazelenir; geri çekilen duyuru kalkar.
--------------------------------------------------------------------------- */

export function SonDuyuru({ duyurular, tumunuAc }: { duyurular: Bildirim[]; tumunuAc: () => void }) {
  const son = duyurular[0]
  if (!son) return null
  const o = onemi(son.onem)
  return (
    <div
      role="status"
      aria-live="polite"
      className={sn('flex shrink-0 items-center gap-3 border-b-2 px-3.5 py-2', o.kenar, o.zemin)}
    >
      <Megaphone size={20} weight="fill" className={sn('shrink-0', o.metin)} aria-hidden />
      <Rozet ton={o.ton}>{o.ad}</Rozet>
      <span className="shrink-0 font-mono text-small text-ink-3">{saat(son.zaman)}</span>
      <p className="min-w-0 flex-1 truncate text-body text-ink">
        <b className="font-semibold">{son.baslik}</b>
        {son.metin && <span className="text-ink-2"> — {son.metin}</span>}
      </p>
      <button
        type="button"
        onClick={tumunuAc}
        className="h-8 shrink-0 rounded-control border border-line-2 bg-panel px-2.5 text-small text-ink hover:bg-hover"
      >
        {duyurular.length > 1 ? `Tüm duyurular (${duyurular.length})` : 'Oku'}
      </button>
    </div>
  )
}

export function DuyuruListesi({ duyurular }: { duyurular: Bildirim[] }) {
  if (duyurular.length === 0) {
    return <p className="text-body text-ink-2">Şu an yayında duyuru yok. Yeni duyuru gelince sayfanın üstünde görünür.</p>
  }
  return (
    <div className="grid gap-2">
      {duyurular.map((b) => (
        <BildirimKarti key={b.id} b={b} />
      ))}
    </div>
  )
}

/** Geniş ekranda sağ sütun: duyuruların tam metni. Kartın çerçevesi en önemli
    duyurunun renginde; yeni gelen duyuru bir kez vurgulanır (ARAYUZ §2: sürekli
    yanıp sönme yok, yeni olayda bir kez). */
/** Dar ekranda kart sayfanın akışında durur: yalnız en yeni iki duyuru, kalanı
    pencerede ("Nereye gidebilirim" aşağı itilmesin). */
const DAR_EKRANDA = 2

export function DuyuruKarti({ duyurular, tumunuAc }: { duyurular: Bildirim[]; tumunuAc: () => void }) {
  const yeni = useYeniDuyuru((d) => d.duyuru)
  const [vurgu, setVurgu] = useState<string | null>(null)
  useEffect(() => {
    if (!yeni) return
    setVurgu(yeni.id)
    const z = window.setTimeout(() => setVurgu(null), 4000)
    return () => window.clearTimeout(z)
  }, [yeni?.id])

  const onde = enOnemli(duyurular)
  const o = onde ? onemi(onde.onem) : null

  return (
    <section
      aria-label="Duyurular"
      className={sn(
        'flex min-h-0 flex-1 flex-col rounded-panel border bg-panel',
        o ? sn(o.kenar, 'border-t-4') : 'border-line',
      )}
    >
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-3.5 py-2.5">
        <h2 className="flex items-center gap-2 text-subtitle text-ink">
          <Megaphone size={22} weight="fill" className={o ? o.metin : 'text-ink-3'} aria-hidden />
          Duyurular
          {duyurular.length > 0 && (
            <span className={sn('rounded-full px-2 font-mono text-small', o ? sn(o.zemin, 'text-ink') : '')}>
              {duyurular.length}
            </span>
          )}
        </h2>
        <TarayiciBildirimi />
      </header>
      <div className="min-h-0 flex-1 overflow-auto p-2.5">
        {duyurular.length === 0 ? (
          <div className="grid justify-items-center gap-2 px-2 py-6 text-center">
            <Megaphone size={40} className="text-ink-3" aria-hidden />
            <p className="text-body text-ink">Şu an yayında duyuru yok.</p>
            <p className="text-small text-ink-2">
              Koordinasyon merkezi duyuru yayınlayınca burada ve ekranın üstünde uyarı olarak
              görünür: su, gıda ve barınma dağıtımının yeri ve saati, açılan alanlar, artçı uyarıları.
            </p>
          </div>
        ) : (
          <div className="grid gap-2">
            {duyurular.map((b, i) => (
              <div
                key={b.id}
                className={sn(
                  'rounded-panel transition-shadow duration-200 ease-out-qm',
                  vurgu === b.id && 'ring-2 ring-accent',
                  i >= DAR_EKRANDA && 'hidden uclu:block',
                )}
              >
                <BildirimKarti b={b} />
              </div>
            ))}
            {duyurular.length > DAR_EKRANDA && (
              <button
                type="button"
                onClick={tumunuAc}
                className="h-10 rounded-control border border-line-2 text-body text-ink hover:bg-hover uclu:hidden"
              >
                Tüm duyurular ({duyurular.length})
              </button>
            )}
          </div>
        )}
        {/* Geniş ekranda duyuru azken sütunun altı boş kalmasın; çoksa kayarak
            altta kalır. Dar ekranda ilk adımlar gönderilenler kartında. */}
        <IlkAdimlar className="mt-3 hidden rounded-panel border border-line-2 px-3 py-2.5 uclu:block" />
      </div>
      <p className="shrink-0 border-t border-line px-3.5 py-1.5 text-small text-ink-3">
        Kaynak: koordinasyon merkezi. Canlı gelir; geri çekilen duyuru kalkar.
      </p>
    </section>
  )
}

/** Tarayıcı bildirimi: afetzede isterse açar (izin tarayıcıda sorulur). Sekme
    arka plandayken yeni duyuru telefona/masaüstüne bildirim olarak düşer. */
function TarayiciBildirimi() {
  const destek = typeof window !== 'undefined' && 'Notification' in window
  const [izin, setIzin] = useState<NotificationPermission | null>(destek ? Notification.permission : null)
  if (!destek || izin === null) return null
  if (izin === 'granted') {
    return (
      <span className="flex items-center gap-1 text-small text-ok">
        <BellRinging size={16} aria-hidden /> Bildirim açık
      </span>
    )
  }
  if (izin === 'denied') {
    return (
      <span className="text-small text-ink-3" title="Tarayıcının site ayarlarından açılabilir">
        Bildirim izni kapalı
      </span>
    )
  }
  return (
    <button
      type="button"
      onClick={() => void Notification.requestPermission().then(setIzin)}
      className="flex h-8 items-center gap-1.5 rounded-control border border-accent bg-accent-soft px-2.5 text-small text-ink hover:bg-accent/20"
    >
      <Bell size={16} className="text-accent" aria-hidden /> Bildirim aç
    </button>
  )
}

/** Yeni duyuru uyarısı: üst çubuğun hemen altında, ekranın ortasında. Acil
    duyuru kapatılana kadar kalır; ötekiler 30 sn sonra kendiliğinden kapanır. */
export function YeniDuyuruUyarisi({ oku }: { oku: () => void }) {
  const duyuru = useYeniDuyuru((d) => d.duyuru)
  const kapat = useYeniDuyuru((d) => d.kapat)
  useEffect(() => {
    if (!duyuru || duyuru.onem === 'acil') return
    const z = window.setTimeout(kapat, 30_000)
    return () => window.clearTimeout(z)
  }, [duyuru?.id, kapat])
  if (!duyuru) return null
  const o = onemi(duyuru.onem)

  return (
    <div className="pointer-events-none fixed inset-x-0 top-topbar z-30 flex justify-center px-gutter pt-2">
      <div
        role="alert"
        className={sn(
          'pointer-events-auto flex w-full max-w-olcum items-start gap-3 rounded-panel border-2 bg-panel px-3.5 py-3 shadow-float',
          o.kenar,
        )}
      >
        <span aria-hidden className={sn('grid h-10 w-10 shrink-0 place-items-center rounded-control', o.zemin)}>
          <Megaphone size={24} weight="fill" className={o.metin} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-small text-ink-2">
            Yeni duyuru · <Rozet ton={o.ton}>{o.ad}</Rozet> · {saat(duyuru.zaman)}
          </p>
          <p className="mt-0.5 text-subtitle text-ink">{duyuru.baslik}</p>
          <button
            type="button"
            onClick={() => {
              oku()
              kapat()
            }}
            className="mt-2 h-9 rounded-control bg-accent px-3 text-body text-accent-ink hover:bg-accent/90"
          >
            Duyuruyu oku
          </button>
        </div>
        <button
          type="button"
          onClick={kapat}
          aria-label="Uyarıyı kapat"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-control text-ink-3 hover:bg-hover hover:text-ink"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
