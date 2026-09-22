import type { ReactNode } from 'react'
import { sn } from '@/lib/sinif'

export function Micro({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={sn('text-micro ls-micro text-ink-3 uppercase', className)}>{children}</span>
  )
}

export function Chip({
  secili,
  onClick,
  children,
}: {
  secili: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={secili}
      onClick={onClick}
      className={sn(
        'rounded-full border px-2.5 py-1.5 text-small transition-colors duration-150 ease-out-qm',
        secili
          ? 'border-accent bg-accent-soft text-ink'
          : 'border-line-2 text-ink-2 hover:bg-hover hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}

export function Anahtar({
  acik,
  etiket,
  onDegis,
  ek,
}: {
  acik: boolean
  etiket: string
  onDegis: () => void
  ek?: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={acik}
      onClick={onDegis}
      className="flex w-full items-center justify-between gap-2.5 py-1.5 text-body text-ink-2"
    >
      <span className="flex items-center gap-2 text-ink">{etiket}</span>
      <span className="flex items-center gap-2">
        {ek}
        <span
          className={sn(
            'relative h-4 w-8 shrink-0 rounded-full transition-colors duration-150 ease-out-qm',
            acik ? 'bg-accent-deep' : 'bg-line-2',
          )}
        >
          <span
            className={sn(
              'absolute top-0.5 left-0.5 h-3 w-3 rounded-full transition-transform duration-150 ease-out-qm',
              acik ? 'translate-x-4 bg-ink' : 'bg-ink-3',
            )}
          />
        </span>
      </span>
    </button>
  )
}

export function Rozet({
  ton,
  children,
}: {
  ton: 'crit' | 'high' | 'mid' | 'ok' | 'accent' | 'nötr'
  children: ReactNode
}) {
  const tonlar: Record<string, string> = {
    crit: 'border-crit text-crit',
    high: 'border-high text-high',
    mid: 'border-mid text-mid',
    ok: 'border-ok text-ok',
    accent: 'border-accent text-accent',
    nötr: 'border-line-2 text-ink-3',
  }
  return (
    <span
      className={sn(
        'rounded-badge border px-1.5 py-1 text-micro ls-micro uppercase',
        tonlar[ton],
      )}
    >
      {children}
    </span>
  )
}

export function Kaydirici({
  etiket,
  deger,
  enAz,
  enCok,
  adim,
  degerEtiketi,
  kapali,
  onDegis,
}: {
  etiket: string
  deger: number
  enAz: number
  enCok: number
  adim: number
  degerEtiketi: string
  kapali?: boolean
  onDegis: (v: number) => void
}) {
  return (
    <span className="kilav-kaydirici mt-1.5 items-center gap-2.5">
      <input
        type="range"
        aria-label={etiket}
        min={enAz}
        max={enCok}
        step={adim}
        value={deger}
        disabled={kapali}
        onChange={(e) => onDegis(Number(e.target.value))}
        className="h-0.5 w-full accent-accent"
      />
      <b className="text-right font-mono text-small font-medium text-ink-2">{degerEtiketi}</b>
    </span>
  )
}
