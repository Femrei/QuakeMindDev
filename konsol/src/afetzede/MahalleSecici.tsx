import { useId, useMemo, useState } from 'react'
import { aramaAnahtari } from './konum'
import { useYerler, type Yer } from './veri'

/* Konum alınamazsa afetzede mahallesini seçer (J-43). Liste altlığın yer
   adlarıdır (OSM, `araclar_altlik_uret.py`); yalnız altlığı üretilmiş
   bölgeleri kapsar ve bu ekranda açıkça yazılır. */

export const YER_TURU: Record<Yer['tur'], string> = {
  city: 'Şehir merkezi',
  town: 'İlçe',
  village: 'Köy',
  suburb: 'Mahalle',
  neighbourhood: 'Mahalle',
  quarter: 'Semt',
}

const TUR_SIRASI: Record<Yer['tur'], number> = {
  suburb: 0,
  neighbourhood: 0,
  quarter: 1,
  village: 2,
  town: 3,
  city: 4,
}

const EN_COK_SONUC = 8

export function MahalleSecici({ onSec }: { onSec: (yer: Yer) => void }) {
  const kimlik = useId()
  const [aranan, setAranan] = useState('')
  const yerler = useYerler(true)

  const kayitlar = useMemo(
    () => (yerler.data ?? []).map((y) => ({ yer: y, anahtar: aramaAnahtari(y.ad) })),
    [yerler.data],
  )
  const bolgeler = useMemo(
    () => [...new Set((yerler.data ?? []).map((y) => y.bolgeAd))].sort((a, b) => a.localeCompare(b, 'tr')),
    [yerler.data],
  )

  const sonuclar = useMemo(() => {
    const a = aramaAnahtari(aranan)
    if (a.length < 2) return []
    return kayitlar
      .filter((k) => k.anahtar.includes(a))
      .sort(
        (x, y) =>
          Number(!x.anahtar.startsWith(a)) - Number(!y.anahtar.startsWith(a)) ||
          TUR_SIRASI[x.yer.tur] - TUR_SIRASI[y.yer.tur] ||
          x.yer.ad.localeCompare(y.yer.ad, 'tr'),
      )
      .slice(0, EN_COK_SONUC)
      .map((k) => k.yer)
  }, [aranan, kayitlar])

  return (
    <div className="mt-2">
      <label htmlFor={kimlik} className="block text-small text-ink-2">
        Mahalle, köy ya da ilçe adı
      </label>
      <input
        id={kimlik}
        type="search"
        autoComplete="off"
        value={aranan}
        onChange={(e) => setAranan(e.target.value)}
        placeholder="ör. Akevler"
        className="mt-1.5 w-full rounded-control border border-line-2 bg-sunken px-2.5 py-2.5 text-body text-ink"
      />

      {yerler.isPending && <p className="mt-2 text-small text-ink-3">Yer listesi yükleniyor…</p>}
      {yerler.isError && (
        <p role="alert" className="mt-2 text-small text-crit">
          Yer listesi alınamadı. Konumunu notuna adres olarak yaz.
        </p>
      )}

      {sonuclar.length > 0 && (
        <ul className="mt-1.5 overflow-hidden rounded-control border border-line-2">
          {sonuclar.map((y) => (
            <li key={`${y.bolge}-${y.ad}-${y.lat}`} className="border-b border-line last:border-b-0">
              <button
                type="button"
                onClick={() => onSec(y)}
                className="flex w-full items-baseline justify-between gap-2 px-2.5 py-2.5 text-left hover:bg-hover"
              >
                <span className="text-body text-ink">{y.ad}</span>
                <span className="shrink-0 text-small text-ink-3">
                  {YER_TURU[y.tur]} · {y.bolgeAd}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {aramaAnahtari(aranan).length >= 2 && yerler.data && sonuclar.length === 0 && (
        <p className="mt-2 text-small text-ink-3">
          Eşleşen yer yok. Adresini nota yaz; ekip notu okur.
        </p>
      )}

      {bolgeler.length > 0 && (
        <p className="mt-2 text-small text-ink-3">
          Listede yalnız şu bölgelerin yerleri var: {bolgeler.join(', ')}.
        </p>
      )}
    </div>
  )
}
