import { useState, type KeyboardEvent } from 'react'
import { Eye, EyeSlash } from '@phosphor-icons/react'
import { sn } from '@/lib/sinif'

/* ---------------------------------------------------------------------------
   Şifre alanı (J-176): varsayılan gizli, istenirse göz düğmesiyle görünür.

   · Görünürlük alan başınadır ve kalıcı değildir: sayfa ya da kip değişince,
     form gönderilince (`gizle` değişince) yeniden gizlenir. Omuz üstünden
     okunmasın diye kendiliğinden açık kalmaz.
   · Düğme `type="button"`: Enter formu gönderir, düğmeyi tetiklemez.
   · Ekran okuyucu: düğmenin adı ne yapacağını söyler ("Şifreyi göster"),
     `aria-pressed` durumunu, `aria-controls` hangi alana ait olduğunu.
   · Büyük harf kilidi açıksa uyarı: en sık "şifre yanlış" sebebi.
--------------------------------------------------------------------------- */

export function SifreAlani({
  id,
  deger,
  degisti,
  autoComplete,
  className,
  gizle,
  aciklamaId,
}: {
  id: string
  deger: string
  degisti: (v: string) => void
  autoComplete: 'current-password' | 'new-password'
  /** Alanın görünümü: çağıran ekranın input sınıfları. */
  className: string
  /** Bu değer değişince alan yeniden gizlenir (ör. gönderim sayacı, kip). */
  gizle?: unknown
  /** Varsa alanı tarif eden metnin kimliği (aria-describedby). */
  aciklamaId?: string
}) {
  const [gorunur, setGorunur] = useState(false)
  const [buyukHarf, setBuyukHarf] = useState(false)
  const [sonGizle, setSonGizle] = useState(gizle)
  // Render sırasında: `gizle` değişince görünürlük sıfırlanır (etki beklemeden).
  if (gizle !== sonGizle) {
    setSonGizle(gizle)
    setGorunur(false)
  }

  const kilitBak = (e: KeyboardEvent<HTMLInputElement>) => setBuyukHarf(e.getModifierState?.('CapsLock') ?? false)
  const uyariId = `${id}-buyuk-harf`

  return (
    <>
      <div className="relative">
        <input
          id={id}
          type={gorunur ? 'text' : 'password'}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={deger}
          onChange={(e) => degisti(e.target.value)}
          onKeyUp={kilitBak}
          onKeyDown={kilitBak}
          onBlur={() => setBuyukHarf(false)}
          aria-describedby={[aciklamaId, buyukHarf ? uyariId : null].filter(Boolean).join(' ') || undefined}
          className={sn(className, 'pr-10')}
        />
        <button
          type="button"
          onClick={() => setGorunur((g) => !g)}
          aria-label={gorunur ? 'Şifreyi gizle' : 'Şifreyi göster'}
          aria-pressed={gorunur}
          aria-controls={id}
          title={gorunur ? 'Şifreyi gizle' : 'Şifreyi göster'}
          className="absolute inset-y-0 right-0 mt-1.5 grid w-10 place-items-center rounded-control text-ink-3 hover:text-ink"
        >
          {gorunur ? <EyeSlash size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
        </button>
      </div>
      {buyukHarf && (
        <p id={uyariId} role="status" className="mt-1 text-small text-ink-2">
          Büyük harf kilidi açık.
        </p>
      )}
    </>
  )
}
