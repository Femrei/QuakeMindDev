import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { CheckCircle, MapPin, Minus, Plus } from '@phosphor-icons/react'
import { dogruluk, saat } from '@/lib/bicim'
import { sn } from '@/lib/sinif'
import type { EtkinKonum } from './konum'

/* Afetzede ekranının ortak parçaları (J-50, J-51). Dokunma hedefleri en az
   40 px; afetzede telefonda, elleri titreyerek ya da eldivenle basabilir. */

/** Pencerelerdeki adım başlığı: "1 · Fotoğraf". */
export function Adim({ no, baslik, ek, children }: { no: number; baslik: string; ek?: ReactNode; children: ReactNode }) {
  return (
    <section className="border-t border-line pt-3 first:border-t-0 first:pt-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-subtitle text-ink">
          <span
            aria-hidden
            className="grid h-6 w-6 place-items-center rounded-full bg-raised font-mono text-small text-ink-2"
          >
            {no}
          </span>
          {baslik}
        </h3>
        {ek}
      </div>
      {children}
    </section>
  )
}

/** Konumun kısa yazısı ve değiştirme düğmesi. Konum yoksa gönderim olmaz. */
export function KonumSatiri({ konum, konumAc, not }: { konum: EtkinKonum | null; konumAc: () => void; not?: string }) {
  return (
    <div
      className={sn(
        'flex items-center gap-2.5 rounded-control border px-2.5 py-2',
        konum ? 'border-line-2' : 'border-crit',
      )}
    >
      <MapPin size={20} weight="fill" className={sn('shrink-0', konum ? 'text-ok' : 'text-crit')} aria-hidden />
      <span className="min-w-0 flex-1 text-body text-ink">
        {konum?.kaynak === 'gps'
          ? `Cihaz konumu, ${dogruluk(konum.dogrulukM)}`
          : konum?.kaynak === 'mahalle'
            ? `${konum.yer.ad} merkezi (yaklaşık)`
            : 'Konumun yok; ekip nereye gideceğini bilemez.'}
        {not && <span className="block text-small text-ink-3">{not}</span>}
      </span>
      <button
        type="button"
        onClick={konumAc}
        className="h-9 shrink-0 rounded-control border border-line-2 px-3 text-body text-ink hover:bg-hover"
      >
        {konum ? 'Değiştir' : 'Konumunu seç'}
      </button>
    </div>
  )
}

/** Kişi sayısı: büyük eksi / artı düğmeleri. */
export function KisiSayaci({ deger, degis }: { deger: number; degis: Dispatch<SetStateAction<number>> }) {
  return (
    <span className="flex items-center gap-2">
      <span className="text-body text-ink-2">Kaç kişi</span>
      <button
        type="button"
        aria-label="Bir kişi azalt"
        disabled={deger <= 1}
        onClick={() => degis((n) => Math.max(1, n - 1))}
        className="grid h-10 w-10 place-items-center rounded-control border border-line-2 text-ink hover:bg-hover disabled:opacity-40"
      >
        <Minus size={18} weight="bold" />
      </button>
      <output aria-live="polite" className="w-8 text-center font-mono text-title text-ink">
        {deger}
      </output>
      <button
        type="button"
        aria-label="Bir kişi artır"
        disabled={deger >= 500}
        onClick={() => degis((n) => Math.min(500, n + 1))}
        className="grid h-10 w-10 place-items-center rounded-control border border-line-2 text-ink hover:bg-hover disabled:opacity-40"
      >
        <Plus size={18} weight="bold" />
      </button>
    </span>
  )
}

/** Gönderim başarılı: yalnız sunucunun 201 yanıtından sonra gösterilir. */
export function Gonderildi({
  baslik,
  kimlik,
  zaman,
  children,
}: {
  baslik: string
  kimlik: string
  zaman: number
  children?: ReactNode
}) {
  return (
    <div role="status" className="rounded-panel border-2 border-ok px-3.5 py-3">
      <p className="flex items-center gap-2 text-subtitle text-ink">
        <CheckCircle size={22} weight="fill" className="text-ok" aria-hidden />
        {baslik}
      </p>
      <p className="mt-1 text-small text-ink-2">
        Kayıt {kimlik} · {saat(zaman)}. Durumu "Bildirimlerim" listesinde görünür; koordinasyon
        ekibi gördüğünde "Görüldü" olur.
      </p>
      {children}
    </div>
  )
}

/** Birincil ve ikincil düğme: pencerelerde aynı boy ve görünüş. */
export const BIRINCIL =
  'flex h-11 w-full items-center justify-center gap-2 rounded-control bg-accent px-3 text-subtitle text-accent-ink hover:bg-accent/90 disabled:opacity-50'
export const IKINCIL =
  'flex h-11 w-full items-center justify-center gap-2 rounded-control border border-line-2 px-3 text-body text-ink hover:bg-hover disabled:opacity-50'

/** Deprem sonrası ilk adımlar: AFAD'ın genel önerileri, kısa. */
export function IlkAdimlar({ className }: { className?: string }) {
  return (
    <div className={sn('text-small text-ink-2', className)}>
      <p className="text-ink">Deprem sonrası ilk adımlar</p>
      <ul className="mt-1 grid list-disc gap-0.5 pl-4">
        <li>Sarsıntı bitince binadan çık; asansör kullanma.</li>
        <li>Gaz, elektrik ve suyu kapat; çakmak ya da kibrit yakma.</li>
        <li>Hasarlı binaya girme; artçı sarsıntılara hazırlıklı ol.</li>
        <li>Toplanma alanına git; telefonu yalnız acil durumda kullan.</li>
      </ul>
    </div>
  )
}
