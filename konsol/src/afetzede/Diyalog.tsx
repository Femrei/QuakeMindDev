import { useEffect, useRef, type ReactNode } from 'react'
import { X } from '@phosphor-icons/react'
import { sn } from '@/lib/sinif'

/* Ana ekranı kaydırmasız tutmak için ikincil işler (konum seçimi, hasar
   fotoğrafı, duyurular, çağrı geçmişi) pencerede açılır. Tarayıcının kendi
   <dialog> öğesi: odak pencerede kalır, Esc kapatır. İçerik yalnız açıkken
   kurulur; kapalı pencere veri istemez. */

export function Diyalog({
  acik,
  kapat,
  baslik,
  genis,
  children,
}: {
  acik: boolean
  kapat: () => void
  baslik: string
  /** Fotoğraf ve metin ihbarı gibi adımlı işler için geniş pencere. */
  genis?: boolean
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (acik && !d.open) d.showModal()
    else if (!acik && d.open) d.close()
  }, [acik])

  return (
    <dialog
      ref={ref}
      onClose={kapat}
      // Esc: tarayıcının kendi kapatması her ortamda tetiklenmiyor (sınandı);
      // pencere durumu React'te tutulduğu için kapatma buradan yapılır.
      onCancel={(e) => {
        e.preventDefault()
        kapat()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          kapat()
        }
      }}
      aria-label={baslik}
      className={sn(
        'm-auto w-full rounded-panel border border-line bg-panel p-0 text-ink shadow-float backdrop:bg-ground/80',
        genis ? 'max-w-olcum' : 'max-w-form',
      )}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-line bg-panel px-3.5 py-2.5">
        <h2 className="text-subtitle text-ink">{baslik}</h2>
        <button
          type="button"
          onClick={kapat}
          className="flex h-9 items-center gap-1.5 rounded-control border border-line-2 px-2.5 text-body text-ink-2 hover:bg-hover hover:text-ink"
        >
          <X size={16} aria-hidden /> Kapat
        </button>
      </div>
      <div className="px-3.5 py-3">{acik && children}</div>
    </dialog>
  )
}
