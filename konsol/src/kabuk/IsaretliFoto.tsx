import { sn } from '@/lib/sinif'
import { tespitRengi, type Tespit } from '@/veri/ihbar'

/* Fotoğraf ve modelin işaretlediği kutular (J-50, J-51). Kutular tarayıcıda
   çizilir: sunucunun işaretli görüntüsü "Bina Hasarsız / Güvenli" yazıyor ve
   Türkçe harfleri bozuyordu. Görüntü ile kutular aynı kutuya "contain" ile
   oturur, böylece hizalı kalır. Kutu rengi hasarın derecesidir (ağır kırmızı,
   orta turuncu, çatlak sarı), haritadaki hasar renkleriyle aynı. Hasarsız
   sınıfı çizilmez. */

export function IsaretliFoto({
  veri,
  en,
  boy,
  tespitler,
  className,
}: {
  veri: string
  en: number
  boy: number
  tespitler: Tespit[]
  className?: string
}) {
  const kalinlik = Math.max(2, en / 320)
  return (
    <div className={sn('relative w-full overflow-hidden rounded-control bg-sunken', className ?? 'h-64')}>
      <img src={veri} alt="Modelin işaretlediği fotoğraf" className="absolute inset-0 h-full w-full object-contain" />
      <svg
        viewBox={`0 0 ${en} ${boy}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {tespitler
          .filter((t) => t.hasar)
          .map((t, i) => (
            <rect
              key={i}
              x={t.kutu[0]}
              y={t.kutu[1]}
              width={t.kutu[2] - t.kutu[0]}
              height={t.kutu[3] - t.kutu[1]}
              fill="none"
              stroke={`var(${tespitRengi(t)})`}
              strokeWidth={kalinlik}
            />
          ))}
      </svg>
    </div>
  )
}

/** Tespitlerin özeti: model başına kaç işaret, en güvenlisi. */
export function TespitListesi({ tespitler }: { tespitler: Tespit[] }) {
  const hasarli = tespitler.filter((t) => t.hasar).sort((a, b) => b.skor - a.skor || b.guven - a.guven)
  if (hasarli.length === 0) return null
  return (
    <ul>
      {hasarli.map((t, i) => (
        <li key={i} className="flex items-center justify-between gap-2 border-b border-line py-1.5 text-small last:border-b-0">
          <span className="flex items-center gap-2 text-ink">
            <span aria-hidden className="h-2.5 w-2.5 rounded-badge" style={{ background: `var(${tespitRengi(t)})` }} />
            {t.ad}
            <span className="text-ink-3">{t.model === 'catlak' ? 'çatlak modeli' : 'bina modeli'}</span>
          </span>
          <span className="font-mono text-ink-2">güven %{Math.round(t.guven * 100)}</span>
        </li>
      ))}
    </ul>
  )
}
