import type { ReactNode } from 'react'
import { Rozet } from './parcalar'
import { tarihSaat } from '@/lib/bicim'
import { sn } from '@/lib/sinif'
import { onemi, type Bildirim } from '@/veri/bildirim'

/* Afetzedenin gördüğü bildirim kartı. Afetzede bandı ve konsolun önizlemesi
   aynı bileşeni kullanır: koordinatör yayınlamadan önce tam olarak neyin
   görüneceğini görür. */

type Props = {
  b: Pick<Bildirim, 'baslik' | 'metin' | 'onem' | 'konum' | 'buyukluk'> & { zaman: number | null }
  children?: ReactNode
}

export function BildirimKarti({ b, children }: Props) {
  const o = onemi(b.onem)
  const ayrinti = [
    b.konum ? `Bölge: ${b.konum}` : null,
    b.buyukluk != null ? `Büyüklük: ${b.buyukluk.toFixed(1).replace('.', ',')}` : null,
  ].filter(Boolean)

  return (
    <section
      aria-label="Acil durum bildirimi"
      className={sn('rounded-panel border bg-panel px-3 py-3', o.kenar)}
    >
      <div className="flex items-center justify-between gap-2">
        <Rozet ton={o.ton}>{o.ad}</Rozet>
        <span className="text-small text-ink-3">{b.zaman ? tarihSaat(b.zaman) : 'şimdi'}</span>
      </div>
      <p className="mt-2 text-subtitle text-ink">{b.baslik}</p>
      {b.metin && <p className="mt-1 text-body text-ink-2">{b.metin}</p>}
      {ayrinti.length > 0 && <p className="mt-1.5 text-small text-ink-2">{ayrinti.join(' · ')}</p>}
      <p className="mt-2 text-small text-ink-3">Kaynak: koordinasyon merkezinin yayınladığı bildirim.</p>
      {children}
    </section>
  )
}
