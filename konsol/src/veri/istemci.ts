import { QueryClient } from '@tanstack/react-query'

/**
 * Sunucu verisi TanStack Query'de tutulur (MIMARI §7).
 * Tazeleme YALNIZ SSE mesajıyla olur: zamanlayıcıyla yoklama kapalıdır (kural 4).
 */
export const sorguIstemcisi = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: 30 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchInterval: false,
      retry: 1,
    },
  },
})

export class ApiHatasi extends Error {
  constructor(
    message: string,
    readonly durum: number,
  ) {
    super(message)
  }
}

/** Erişim jetonunu veren kanca; döngüsel import olmasın diye enjekte edilir. */
let jetonKaynagi: () => string | null = () => null
let jetonYenile: (() => Promise<unknown>) | null = null

export function kimlikBagla(kaynak: () => string | null, yenile: () => Promise<unknown>) {
  jetonKaynagi = kaynak
  jetonYenile = yenile
}

function basliklar(ek?: Record<string, string>): Record<string, string> {
  const jeton = jetonKaynagi()
  return { ...(ek ?? {}), ...(jeton ? { authorization: `Bearer ${jeton}` } : {}) }
}

export async function apiPost<T>(yol: string, govde: unknown): Promise<T> {
  const gonder = () =>
    fetch(yol, {
      method: 'POST',
      credentials: 'same-origin',
      headers: basliklar({ 'content-type': 'application/json' }),
      body: JSON.stringify(govde),
    })
  let y = await gonder()

  // GET'teki gibi: erişim jetonu 15 dakikalık. Sayfayı açık bırakıp sonra
  // yardım çağıran afetzedenin isteği 401 ile düşmesin. Yeniden göndermek
  // güvenli: 401'de sunucu isteği kimlik adımında reddetmiştir, kayıt açmamıştır.
  if (y.status === 401 && jetonYenile) {
    await jetonYenile()
    y = await gonder()
  }

  if (!y.ok) {
    let ayrinti = `${yol} → HTTP ${y.status}`
    try {
      const hata = (await y.json()) as { detail?: string }
      if (hata?.detail) ayrinti = hata.detail
    } catch {
      /* gövdesi JSON değilse durum kodu yeter */
    }
    throw new ApiHatasi(ayrinti, y.status)
  }
  return (await y.json()) as T
}

export async function apiGet<T>(yol: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(yol, window.location.origin)
  for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, String(v))
  let y = await fetch(url, { credentials: 'same-origin', headers: basliklar() })

  // Erişim jetonu kısa ömürlü: 401 gelirse bir kez yenileyip tekrar dener.
  if (y.status === 401 && jetonYenile) {
    await jetonYenile()
    y = await fetch(url, { credentials: 'same-origin', headers: basliklar() })
  }

  if (!y.ok) throw new ApiHatasi(`${yol} → HTTP ${y.status}`, y.status)
  return (await y.json()) as T
}
