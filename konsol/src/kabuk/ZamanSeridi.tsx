import { useEffect, useRef } from 'react'
import { Amac, HazirSecenekler, SuAn } from './Panel'
import { Micro } from './parcalar'
import {
  HAZIR_PENCERELER,
  SAAT,
  useAralik,
  seciliPencere,
  useZaman,
  type PencereId,
} from '@/durum/zamanDurumu'
import { sure, tarihSaat } from '@/lib/bicim'
import { sn } from '@/lib/sinif'

/* Zaman şeridi — ARAYUZ §10.
   Pencere HER ŞEYİ süzer. Varsayılan canlı; şerit geri çekilince geçmişe düşer;
   oynat düğmesi yalnız geçmiş modunda çalışır. */

const SERIT_UZUNLUGU = 30 * 24 * SAAT

export function ZamanSeridi() {
  const serit = useRef<HTMLDivElement>(null)
  const canli = useZaman((d) => d.canli)
  const simdi = useZaman((d) => d.simdi)
  const uzunluk = useZaman((d) => d.uzunluk)
  const oynatiliyor = useZaman((d) => d.oynatiliyor)
  const aralikTasi = useZaman((d) => d.aralikTasi)
  const pencereSec = useZaman((d) => d.pencereSec)
  const oynatDegistir = useZaman((d) => d.oynatDegistir)
  const canliyaDon = useZaman((d) => d.canliyaDon)
  const [t0, t1] = useAralik()
  const secili = useZaman(seciliPencere)

  const seritBaslangic = simdi - SERIT_UZUNLUGU
  const oran = (t: number) => ((t - seritBaslangic) / SERIT_UZUNLUGU) * 100

  // Oynat: yalnız geçmiş modunda ilerler.
  useEffect(() => {
    if (!oynatiliyor || canli) return
    const sayac = window.setInterval(() => {
      const d = useZaman.getState()
      aralikTasi(d.bitis + d.uzunluk * 0.02)
    }, 120)
    return () => window.clearInterval(sayac)
  }, [oynatiliyor, canli, aralikTasi])

  function zamanAl(clientX: number): number {
    const kutu = serit.current?.getBoundingClientRect()
    if (!kutu) return simdi
    const f = Math.min(1, Math.max(0, (clientX - kutu.left) / kutu.width))
    return seritBaslangic + f * SERIT_UZUNLUGU
  }

  return (
    <section
      aria-label="Zaman aralığı"
      className="flex h-timeline shrink-0 flex-col gap-2 rounded-panel border border-line bg-panel px-3 pt-3 pb-2.5"
    >
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={oynatDegistir}
          disabled={canli}
          aria-label={oynatiliyor ? 'Zamanı durdur' : 'Zamanı oynat'}
          title={canli ? 'Oynatma yalnız geçmiş modunda çalışır' : 'Aralığı ileri sar'}
          className="grid h-7 w-7 place-items-center rounded-control border border-line-2 text-ink-2 disabled:opacity-40"
        >
          {oynatiliyor ? '❚❚' : '▶'}
        </button>
        <Micro>Zaman aralığı</Micro>
        <span className="font-mono text-small text-ink-2">
          {tarihSaat(t0)} — {tarihSaat(t1)}
        </span>
        <HazirSecenekler
          etiket="Hazır aralıklar"
          secenekler={HAZIR_PENCERELER.map((p) => ({ id: p.id, etiket: p.etiket }))}
          secili={secili}
          onSec={(id: PencereId) => pencereSec(id)}
        />
        <span className="flex-1" />
        {!canli && (
          <button
            type="button"
            onClick={canliyaDon}
            className="rounded-control border border-line-2 px-2.5 py-1.5 text-small text-ink-2 hover:bg-hover hover:text-ink"
          >
            Canlıya dön
          </button>
        )}
      </div>

      <div
        ref={serit}
        role="slider"
        tabIndex={0}
        aria-label="Zaman penceresi"
        aria-valuemin={seritBaslangic}
        aria-valuemax={simdi}
        aria-valuenow={t1}
        aria-valuetext={`${tarihSaat(t0)} — ${tarihSaat(t1)}`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          aralikTasi(zamanAl(e.clientX))
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) aralikTasi(zamanAl(e.clientX))
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') aralikTasi(t1 - uzunluk * 0.25)
          if (e.key === 'ArrowRight') aralikTasi(t1 + uzunluk * 0.25)
        }}
        className="relative min-h-0 flex-1 cursor-ew-resize touch-none rounded-badge bg-sunken"
      >
        {/* Histogram burada çizilecek: saat başına olay sayısı.
            Veri yok, bu yüzden boş çizgi ve açık bir not bırakılıyor (kural 1). */}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-line-2" />
        <span className="pointer-events-none absolute inset-0 grid place-items-center text-small text-ink-3">
          Olay yoğunluğu için veri yok — canlı akış bağlanınca şerit dolacak.
        </span>
        <div
          aria-hidden
          className={sn(
            'pointer-events-none absolute inset-y-0 min-w-1 border-x border-accent bg-accent-soft',
          )}
          style={{
            left: `${Math.max(0, oran(t0))}%`,
            width: `${Math.max(1, oran(t1) - Math.max(0, oran(t0)))}%`,
          }}
        />
      </div>

      <div className="flex items-baseline justify-between gap-3">
        <Amac>Şeridi geri çekince geçmişe bakarsın; bıraktığında canlıya dönmek tek tıktır.</Amac>
        <SuAn>
          {canli
            ? `Canlı: son ${sure(uzunluk)} gösteriliyor, pencere saatle birlikte kayıyor.`
            : `Geçmiş: ${tarihSaat(t0)} — ${tarihSaat(t1)} arası (${sure(uzunluk)}) gösteriliyor.`}
        </SuAn>
      </div>
    </section>
  )
}
