import { GIRIS_HARITASI as H } from './girisHaritasiVerisi'

/* ---------------------------------------------------------------------------
   Giriş ekranının arka planı (J-176): Türkiye'nin etkin fayları, ana yol
   iskeleti ve 6 Şubat 2023 depremleri. Süs değil, uygulamanın coğrafyası;
   her öğe gerçek veriden ve lejantta ne olduğu yazılı (CLAUDE.md §1).

   · Renk = fay türü (doğrultu atımlı, normal, ters); kalınlık ve parlaklık =
     kayma hızı (mm/yıl). Kuzey ve Doğu Anadolu fayları bu yüzden öne çıkar.
     Fay renkleri soğuk tonlar; kırmızı yalnız yıkıcı depremin merkezinde.
   · Hareket yalnız açılışta, bir kez: önce silüet, sonra yavaştan hızlıya
     faylar, en son deprem merkezlerinde tek bir halka (ARAYUZ §7: opacity ve
     transform; sürekli hareket ve yanıp sönme yok). "Hareketi azalt" açıksa
     anında görünür.
   · Ayrı parça olarak tembel yüklenir, yalnız geniş ekranda istenir.
--------------------------------------------------------------------------- */

const TURLER = [
  ['dogrultu', 'Doğrultu atımlı', 'var(--color-fay-dogrultu)'],
  ['normal', 'Normal', 'var(--color-fay-normal)'],
  ['ters', 'Ters', 'var(--color-fay-ters)'],
] as const

const sayiTr = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export default function GirisHaritasi() {
  return (
    <>
      <svg
        viewBox={`0 0 ${H.genislik} ${H.yukseklik}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        focusable="false"
        className="absolute inset-0 h-full w-full"
      >
        <path className="giris-yollar" d={H.yollar} />
        {TURLER.map(([t]) =>
          H.faylar[t].map((d, s) =>
            d ? <path key={`${t}-${s}`} className={`giris-fay giris-fay-${t} giris-fay-h${s}`} d={d} /> : null,
          ),
        )}
        {H.depremler.map((o) => (
          <g key={o.yer}>
            <circle className="giris-deprem-halka" cx={o.x} cy={o.y} r={16} />
            <circle className="giris-deprem-nokta" cx={o.x} cy={o.y} r={3.6} />
            <text className="giris-deprem-yazi" x={o.x + 9} y={o.y + (o.yer === 'Elbistan' ? -7 : 12)}>
              {`Mw ${sayiTr(o.mw)} ${o.yer}`}
            </text>
          </g>
        ))}
      </svg>

      <div className="giris-lejant absolute right-4 bottom-4 hidden w-64 rounded-panel border border-line bg-panel px-3 py-2.5 xl:block">
        <p className="text-micro ls-micro text-ink-3 uppercase">Türkiye'nin etkin fayları</p>
        <ul className="mt-1.5 space-y-1">
          {TURLER.map(([t, ad, renk]) => (
            <li key={t} className="flex items-center gap-2 text-small text-ink-2">
              <span aria-hidden className="h-0.5 w-5 rounded-badge" style={{ background: renk }} />
              {ad} <span className="text-ink-3">· {H.faySayisi[t]}</span>
            </li>
          ))}
          <li className="text-small text-ink-3">Kalın çizgi: hızlı kayan fay (10+ mm/yıl)</li>
          <li className="flex items-center gap-2 text-small text-ink-2">
            <span aria-hidden className="h-2 w-2 rounded-full bg-crit" />6 Şubat 2023 depremleri
          </li>
        </ul>
        <p className="mt-2 text-micro text-ink-3">GEM (CC BY-SA 4.0) · © OpenStreetMap (ODbL) · deprem kataloğu</p>
      </div>
    </>
  )
}
