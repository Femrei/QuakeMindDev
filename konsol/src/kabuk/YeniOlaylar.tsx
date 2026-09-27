import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from '@phosphor-icons/react'
import { useHarita } from '@/harita/HaritaKabugu'
import { useKonsol } from '@/durum/konsolDurumu'
import { saat } from '@/lib/bicim'
import { sn } from '@/lib/sinif'
import { IHBAR_TURU } from '@/veri/ihbar'
import { OMUR_MS, useYeniOlaylar, type Olay } from '@/canli/yeniOlaylar'
import { TurSimgesi } from '@/modlar/ihbarParcalari'

/* ---------------------------------------------------------------------------
   Yeni SOS ve ihbar bildirimi (ARAYUZ §10, J-51): canlı modda yeni çağrı ya
   da ihbar gelince köşede kısa bir kart çıkar, kendiliğinden kapanır.
   Tıklayınca ihbarın modu açılır (SOS → SOS kuyruğu, fotoğraf → kamera, metin
   → metin, ihtiyaç → ihtiyaç talepleri), kayıt seçilir, harita oraya gider.
   Kart yalnız canlı akış mesajından doğar; yoklama yoktur.
--------------------------------------------------------------------------- */

const MOD: Record<Olay['tur'], string> = {
  sos: 'sos',
  fotograf: 'kamera',
  metin: 'metin',
  ihtiyac: 'ihtiyac',
}

export function YeniOlaylar() {
  const olaylar = useYeniOlaylar((d) => d.olaylar)
  if (olaylar.length === 0) return null
  return (
    <div aria-live="polite" aria-label="Yeni çağrı ve ihbarlar" className="flex w-panel-r flex-col gap-2">
      {olaylar.map((o) => (
        <OlayKarti key={o.anahtar} o={o} />
      ))}
    </div>
  )
}

function OlayKarti({ o }: { o: Olay }) {
  const kaldir = useYeniOlaylar((d) => d.kaldir)
  const kayitSec = useKonsol((d) => d.kayitSec)
  const { ucus } = useHarita()
  const git = useNavigate()

  // Kart kendiliğinden kapanır (ARAYUZ §10); tek seferlik zamanlayıcı.
  useEffect(() => {
    const z = window.setTimeout(() => kaldir(o.anahtar), OMUR_MS)
    return () => window.clearTimeout(z)
  }, [o.anahtar, kaldir])

  const ac = () => {
    git(`/konsol/${MOD[o.tur]}`)
    kayitSec({ tip: o.tur === 'sos' ? 'sos' : 'ihbar', id: o.id })
    ucus(o.lon, o.lat, 16)
    kaldir(o.anahtar)
  }

  return (
    <div
      role="status"
      className={sn(
        'flex items-start gap-2.5 rounded-panel border border-l-4 border-line-2 bg-panel px-3 py-2.5 shadow-float',
        IHBAR_TURU[o.tur].solKenar,
      )}
    >
      <TurSimgesi tur={o.tur} />
      <button type="button" onClick={ac} className="min-w-0 flex-1 text-left">
        <span className="flex items-baseline justify-between gap-2">
          <span className="text-body text-ink">{o.baslik}</span>
          <span className="font-mono text-small text-ink-3">{saat(o.zaman)}</span>
        </span>
        {o.alt && <span className="block truncate text-small text-ink-2">{o.alt}</span>}
        <span className="mt-0.5 block text-small text-accent">Göster</span>
      </button>
      <button
        type="button"
        aria-label="Bildirimi kapat"
        onClick={() => kaldir(o.anahtar)}
        className="rounded-control p-1 text-ink-3 hover:bg-hover hover:text-ink"
      >
        <X size={14} />
      </button>
    </div>
  )
}
