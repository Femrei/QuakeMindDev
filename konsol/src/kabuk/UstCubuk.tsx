import { NavLink, useNavigate } from 'react-router-dom'
import { useOturum } from '@/kimlik/oturum'
import { ROL_ADI } from '@/kimlik/roller'
import { MODLAR } from '@/modlar/modlar'
import { useZaman } from '@/durum/zamanDurumu'
import { useCanliAkisDurumu } from '@/canli/canliAkis'
import { useKonsol } from '@/durum/konsolDurumu'
import { saat } from '@/lib/bicim'
import { sn } from '@/lib/sinif'
import { Marka } from './Marka'

export function UstCubuk() {
  const { oturum, cikisYap } = useOturum()
  const git = useNavigate()
  const canli = useZaman((d) => d.canli)
  const bitis = useZaman((d) => (d.canli ? d.simdi : d.bitis))
  const canliyaDon = useZaman((d) => d.canliyaDon)
  const akis = useCanliAkisDurumu((d) => d.durum)
  const komutPaleti = useKonsol((d) => d.komutPaleti)

  const baglantiMetni =
    akis === 'bagli'
      ? 'Canlı akış bağlı'
      : akis === 'baglaniyor'
        ? 'Akışa bağlanılıyor'
        : 'Canlı akış bağlı değil'

  return (
    <header className="flex h-topbar shrink-0 items-center gap-gutter border-b border-line bg-panel px-3.5">
      <Marka />
      <span className="h-5 w-px bg-line-2" />

      <nav className="flex gap-0.5" aria-label="Çalışma modu">
        {MODLAR.map((m) => (
          <NavLink
            key={m.id}
            to={`/konsol/${m.id}`}
            title={m.ozet}
            className={({ isActive }) =>
              sn(
                'rounded-control px-2.5 py-1.5 text-body transition-colors duration-150 ease-out-qm',
                isActive ? 'bg-raised text-ink' : 'text-ink-2 hover:bg-hover hover:text-ink',
              )
            }
          >
            {m.ad}
          </NavLink>
        ))}
      </nav>

      <span className="flex-1" />

      <button
        type="button"
        onClick={() => komutPaleti(true)}
        className="flex items-center gap-2 rounded-control border border-line-2 px-2.5 py-1.5 text-small text-ink-2 hover:bg-hover hover:text-ink"
      >
        Ara veya komut ver
        <kbd className="rounded-badge border border-line-2 bg-sunken px-1 py-0.5 font-mono text-micro text-ink-3">
          Ctrl K
        </kbd>
      </button>

      {/* Canlı / Geçmiş rozeti — ARAYUZ §10 */}
      <span className="flex items-center gap-2 text-small text-ink-2" title={baglantiMetni}>
        <span
          aria-hidden
          className={sn(
            'h-1.5 w-1.5 rounded-full',
            canli && akis === 'bagli' ? 'bg-ok' : canli ? 'bg-mid' : 'bg-ink-3',
          )}
        />
        {canli ? 'Canlı' : 'Geçmiş'}
        <span className="font-mono text-small text-ink-3">{saat(bitis)}</span>
      </span>

      {!canli && (
        <button
          type="button"
          onClick={canliyaDon}
          className="rounded-control border border-line-2 px-2.5 py-1.5 text-small text-ink-2 hover:bg-hover hover:text-ink"
        >
          Canlıya dön
        </button>
      )}

      <button
        type="button"
        onClick={() => {
          void cikisYap().then(() => git('/giris', { replace: true }))
        }}
        title={oturum ? `${oturum.adSoyad} · ${ROL_ADI[oturum.rol]} — çıkış yap` : 'Çıkış yap'}
        className="grid h-6 w-6 place-items-center rounded-full bg-accent-deep text-micro text-ink"
      >
        {bashar(oturum?.adSoyad)}
      </button>
    </header>
  )
}

function bashar(ad?: string): string {
  if (!ad) return '—'
  return ad
    .split(' ')
    .slice(0, 2)
    .map((p) => p.charAt(0).toLocaleUpperCase('tr'))
    .join('')
}
