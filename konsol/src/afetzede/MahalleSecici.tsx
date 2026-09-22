import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { sayi } from '@/lib/bicim'
import { aramaAnahtari } from './konum'
import { useYerler, type Yer } from './veri'

/* ---------------------------------------------------------------------------
   Konum alınamazsa afetzede mahallesini seçer (J-43). Liste altlığın yer
   adlarıdır (OSM, `araclar_altlik_uret.py`); yalnız altlığı üretilmiş
   bölgeleri kapsar ve bu ekranda açıkça yazılır.

   Arama (J-51, kullanıcı: "a yazınca a ile başlayanlar, ab yazınca ab ile
   başlayanlar çıksın; yoksa söylesin"):
     · İlk harften itibaren çalışır; önce adı yazılanla BAŞLAYANLAR, sonra
       adındaki başka bir kelimesi yazılanla başlayanlar ("Mehmet Akif" ← "ak").
       Adın ortasındaki harf dizisi eşleşme sayılmaz.
     · Büyük/küçük farkı yok sayılır. Düz harf Türkçe karşılığını da bulur
       ("c" hem C'yi hem Ç'yi, "cukur" Çukur'u); Türkçe harf yazılırsa o harf
       birebir aranır ("ç" yalnız Ç ile başlayanları getirir). Büyük "I"
       Türkçe klavyede ı, İngilizce klavyede i olduğu için ikisini de bulur.
     · Eşleşen harfler kalın; kaç yer bulunduğu yazılır; yoksa söylenir.
     · Enter ilk sonucu seçer; aşağı/yukarı ok listede gezinir.
--------------------------------------------------------------------------- */

export const YER_TURU: Record<Yer['tur'], string> = {
  city: 'Şehir merkezi',
  town: 'İlçe',
  village: 'Köy',
  suburb: 'Mahalle',
  neighbourhood: 'Mahalle',
  quarter: 'Semt',
}

const EN_COK_SONUC = 50

/** Yazılınca birebir aranan harfler. Şapkalı harfler (â, î, û) adlarda tutarsız
    yazıldığı için bu listede yok; her iki yönde düzleştirilir. */
const TURKCE_HARF = /[çğıöşü]/

/** `anahtar`: Türkçe harfleri düzleştirilmiş; `kucuk`: yalnız küçük harf.
    İkisi de adla harf harf hizalıdır (düzleştirme harf sayısını değiştirmez). */
type Kayit = { yer: Yer; anahtar: string; kucuk: string }
/** `turkce`: yazılanda Türkçe harf olan sıralar; oralarda adın harfi birebir aynı olmalı. */
type Aranan = { anahtar: string; kucuk: string; turkce: number[] }
type Sonuc = { yer: Yer; bas: number }

function arananHazirla(metin: string): Aranan {
  const kucuk = metin
    .replace(/I/g, 'i')
    .toLocaleLowerCase('tr-TR')
    .replace(/\s+/g, ' ')
    .trim()
  const turkce: number[] = []
  for (let j = 0; j < kucuk.length; j++) if (TURKCE_HARF.test(kucuk[j])) turkce.push(j)
  return { anahtar: aramaAnahtari(kucuk), kucuk, turkce }
}

function uyar(k: Kayit, i: number, q: Aranan): boolean {
  if (!k.anahtar.startsWith(q.anahtar, i)) return false
  return q.turkce.every((j) => k.kucuk[i + j] === q.kucuk[j])
}

/** Yazılanın adda başladığı yer: 0 (adın başı) ya da bir kelimenin başı; yoksa -1. */
function eslesme(k: Kayit, q: Aranan): number {
  if (uyar(k, 0, q)) return 0
  let i = k.anahtar.indexOf(q.anahtar, 1)
  while (i > 0) {
    if (!/[\p{L}\p{N}]/u.test(k.anahtar[i - 1]) && uyar(k, i, q)) return i
    i = k.anahtar.indexOf(q.anahtar, i + 1)
  }
  return -1
}

export function MahalleSecici({ onSec }: { onSec: (yer: Yer) => void }) {
  const kimlik = useId()
  const [aranan, setAranan] = useState('')
  const yerler = useYerler(true)
  const liste = useRef<HTMLUListElement>(null)

  const kayitlar = useMemo<Kayit[]>(
    () =>
      (yerler.data ?? []).map((y) => ({
        yer: y,
        anahtar: aramaAnahtari(y.ad),
        kucuk: y.ad.toLocaleLowerCase('tr-TR').trim(),
      })),
    [yerler.data],
  )
  const bolgeler = useMemo(
    () => [...new Set((yerler.data ?? []).map((y) => y.bolgeAd))].sort((a, b) => a.localeCompare(b, 'tr')),
    [yerler.data],
  )

  const q = useMemo(() => arananHazirla(aranan), [aranan])
  const a = q.anahtar
  const { sonuclar, toplam } = useMemo(() => {
    if (!q.anahtar) return { sonuclar: [] as Sonuc[], toplam: 0 }
    const basta: Sonuc[] = []
    const kelimede: Sonuc[] = []
    for (const k of kayitlar) {
      const bas = eslesme(k, q)
      if (bas === 0) basta.push({ yer: k.yer, bas })
      else if (bas > 0) kelimede.push({ yer: k.yer, bas })
    }
    const alfabe = (x: Sonuc, y: Sonuc) =>
      x.yer.ad.localeCompare(y.yer.ad, 'tr') || x.yer.bolgeAd.localeCompare(y.yer.bolgeAd, 'tr')
    const hepsi = [...basta.sort(alfabe), ...kelimede.sort(alfabe)]
    return { sonuclar: hepsi.slice(0, EN_COK_SONUC), toplam: hepsi.length }
  }, [q, kayitlar])

  function klavye(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && sonuclar[0]) {
      e.preventDefault()
      onSec(sonuclar[0].yer)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      liste.current?.querySelector('button')?.focus()
    }
  }

  function listeKlavyesi(e: KeyboardEvent<HTMLUListElement>) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const dugmeler = [...(liste.current?.querySelectorAll('button') ?? [])]
    const i = dugmeler.indexOf(document.activeElement as HTMLButtonElement)
    const j = e.key === 'ArrowDown' ? Math.min(dugmeler.length - 1, i + 1) : i - 1
    if (j < 0) document.getElementById(kimlik)?.focus()
    else dugmeler[j]?.focus()
  }

  return (
    <div className="mt-2">
      <label htmlFor={kimlik} className="block text-small text-ink-2">
        Mahalle, köy ya da ilçe adı
      </label>
      <div className="relative mt-1.5">
        <MagnifyingGlass
          size={18}
          className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-ink-3"
          aria-hidden
        />
        <input
          id={kimlik}
          type="search"
          autoComplete="off"
          value={aranan}
          onChange={(e) => setAranan(e.target.value)}
          onKeyDown={klavye}
          placeholder="İlk harflerini yaz, ör. Ak"
          aria-describedby={`${kimlik}-durum`}
          className="w-full rounded-control border border-line-2 bg-sunken py-2.5 pr-2.5 pl-9 text-body text-ink"
        />
      </div>

      <p id={`${kimlik}-durum`} aria-live="polite" className="mt-1.5 text-small text-ink-3">
        {yerler.isPending
          ? 'Yer listesi yükleniyor…'
          : !a
            ? 'İlk harfleri yaz: "a" yazınca A ile başlayan yerler çıkar, yazdıkça daralır.'
            : toplam === 0
              ? null
              : `"${aranan.trim()}" ile başlayan ${sayi(toplam)} yer${
                  toplam > EN_COK_SONUC ? `; ilk ${EN_COK_SONUC} tanesi gösteriliyor, bir harf daha yaz` : ''
                }.`}
      </p>

      {yerler.isError && (
        <p role="alert" className="mt-2 text-small text-crit">
          Yer listesi alınamadı. Konumunu notuna adres olarak yaz.
        </p>
      )}

      {sonuclar.length > 0 && (
        <ul
          ref={liste}
          onKeyDown={listeKlavyesi}
          aria-label="Bulunan yerler"
          className="mt-1.5 max-h-72 overflow-auto rounded-control border border-line-2"
        >
          {sonuclar.map(({ yer: y, bas }) => (
            <li key={`${y.bolge}-${y.ad}-${y.lat}`} className="border-b border-line last:border-b-0">
              <button
                type="button"
                onClick={() => onSec(y)}
                className="flex w-full items-baseline justify-between gap-2 px-2.5 py-2.5 text-left hover:bg-hover focus:bg-hover"
              >
                <span className="min-w-0 truncate text-body text-ink-2">
                  {y.ad.slice(0, bas)}
                  <b className="font-semibold text-ink">{y.ad.slice(bas, bas + a.length)}</b>
                  {y.ad.slice(bas + a.length)}
                </span>
                <span className="shrink-0 text-small text-ink-3">
                  {YER_TURU[y.tur]} · {y.bolgeAd}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {a && yerler.data && toplam === 0 && (
        <div role="status" className="mt-1.5 rounded-control border border-line-2 px-2.5 py-2">
          <p className="text-body text-ink">"{aranan.trim()}" ile başlayan yer yok.</p>
          <p className="mt-0.5 text-small text-ink-3">
            Harfleri kontrol et ya da daha az harf yaz. Bulamazsan adresini nota yaz; ekip notu okur.
          </p>
        </div>
      )}

      {bolgeler.length > 0 && (
        <p className="mt-2 text-small text-ink-3">
          Listede yalnız şu bölgelerin yerleri var: {bolgeler.join(', ')}.
        </p>
      )}
    </div>
  )
}
