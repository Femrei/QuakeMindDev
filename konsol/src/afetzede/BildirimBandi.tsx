import { Rozet } from '@/kabuk/parcalar'
import { tarihSaat } from '@/lib/bicim'
import { sn } from '@/lib/sinif'
import { useBildirimler, type Bildirim } from './veri'

/* Koordinasyonun yayınladığı acil durum bildirimleri (J-43). Eski web bunu
   10 saniyede bir yokluyordu; burada canlı akıştaki "bildirim" mesajı
   gelince bir kez indirilir. Bildirim yoksa bant hiç görünmez. */

const ONEM: Record<string, { ad: string; ton: 'crit' | 'high' | 'nötr'; kenar: string }> = {
  critical: { ad: 'Acil', ton: 'crit', kenar: 'border-crit' },
  warning: { ad: 'Uyarı', ton: 'high', kenar: 'border-high' },
  info: { ad: 'Bilgi', ton: 'nötr', kenar: 'border-line-2' },
}
const onemi = (b: Bildirim) => ONEM[b.onem] ?? ONEM.info

export function BildirimBandi() {
  const bildirimler = useBildirimler()
  const liste = bildirimler.data ?? []
  if (liste.length === 0) return null
  const [son, ...onceki] = liste
  const o = onemi(son)

  return (
    <section
      aria-label="Acil durum bildirimi"
      aria-live="polite"
      className={sn('rounded-panel border bg-panel px-3 py-3', o.kenar)}
    >
      <div className="flex items-center justify-between gap-2">
        <Rozet ton={o.ton}>{o.ad}</Rozet>
        <span className="text-small text-ink-3">{son.zaman ? tarihSaat(son.zaman) : 'zamanı yok'}</span>
      </div>
      <p className="mt-2 text-subtitle text-ink">{son.baslik}</p>
      {son.metin && <p className="mt-1 text-body text-ink-2">{son.metin}</p>}
      <BildirimAyrinti b={son} />
      <p className="mt-2 text-small text-ink-3">Kaynak: koordinasyon merkezinin yayınladığı bildirim.</p>

      {onceki.length > 0 && (
        <details className="mt-2 border-t border-line pt-2">
          <summary className="cursor-pointer text-small text-ink-2">
            Önceki bildirimler ({onceki.length})
          </summary>
          <ul className="mt-1.5">
            {onceki.map((b) => (
              <li key={b.id} className="border-b border-line py-2 last:border-b-0">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-body text-ink">{b.baslik}</span>
                  <span className="shrink-0 text-small text-ink-3">
                    {onemi(b).ad}
                    {b.zaman ? ` · ${tarihSaat(b.zaman)}` : ''}
                  </span>
                </span>
                {b.metin && <span className="mt-0.5 block text-small text-ink-2">{b.metin}</span>}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}

function BildirimAyrinti({ b }: { b: Bildirim }) {
  const parcalar = [
    b.konum ? `Bölge: ${b.konum}` : null,
    b.buyukluk != null ? `Büyüklük: ${b.buyukluk.toFixed(1).replace('.', ',')}` : null,
  ].filter(Boolean)
  if (parcalar.length === 0) return null
  return <p className="mt-1.5 text-small text-ink-2">{parcalar.join(' · ')}</p>
}
