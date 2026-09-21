import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { canliAkisBaslat } from './canliAkis'
import { useZaman } from '@/durum/zamanDurumu'
import { useIsler } from '@/durum/islerDurumu'
import { analizSonucuAl } from '@/veri/analiz'

/**
 * Akış ve saat, uygulamada BİR kez kurulur.
 * Saat yerel bir sayaçtır: dakika değişmedikçe durum güncellenmez, yani
 * saniyede bir yeniden çizim olmaz ve sunucuya hiçbir istek gitmez.
 */
export function CanliSaglayici({ children }: { children: ReactNode }) {
  const qc = useQueryClient()

  useEffect(
    () =>
      canliAkisBaslat(qc, {
        dinleyici: (m) => {
          if (m.tip !== 'is-durumu') return
          const { isGuncelle, isler } = useIsler.getState()
          if (!isler[m.isId]) {
            // Başka bir sekmede ya da başka bir kullanıcı tarafından başlatılmış iş.
            useIsler.getState().isBasladi(m.isId, m.isTipi, m.mesaj ?? '')
          }
          isGuncelle(m.isId, {
            durum: m.durum,
            ilerleme: m.ilerleme ?? (m.durum === 'bitti' ? 100 : 0),
            mesaj: m.mesaj ?? '',
            hata: m.hata,
            bitis: m.durum === 'bitti' || m.durum === 'hata' ? Date.now() : undefined,
          })
          // Bitti mesajı gelince sonuç TEK istekle indirilir; yoklama yok.
          if (m.durum === 'bitti' && m.isTipi === 'hasar-analizi') {
            analizSonucuAl(m.isId)
              .then((sonuc) => isGuncelle(m.isId, { sonuc }))
              .catch((e: unknown) =>
                isGuncelle(m.isId, {
                  durum: 'hata',
                  hata: e instanceof Error ? e.message : 'Sonuç indirilemedi.',
                }),
              )
          }
        },
      }),
    [qc],
  )

  useEffect(() => {
    const ilerlet = useZaman.getState().saatIlerlet
    let sonDakika = Math.floor(Date.now() / 60_000)
    const sayac = window.setInterval(() => {
      const dakika = Math.floor(Date.now() / 60_000)
      if (dakika !== sonDakika) {
        sonDakika = dakika
        ilerlet(dakika * 60_000)
      }
    }, 1_000)
    return () => window.clearInterval(sayac)
  }, [])

  return <>{children}</>
}
