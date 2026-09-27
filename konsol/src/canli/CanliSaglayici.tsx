import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { canliAkisBaslat } from './canliAkis'
import { useZaman } from '@/durum/zamanDurumu'
import { useIsler } from '@/durum/islerDurumu'
import { useSimulasyon } from '@/durum/simulasyonDurumu'
import { analizSonucuAl } from '@/veri/analiz'
import { useOturum } from '@/kimlik/oturum'
import { yeniOlayIsle } from './yeniOlaylar'

/** İlerleme yüzdeye çevrilir. Hasar analizi 0-100 gönderiyor
    (`cekirdek.py`), simülasyon sözleşmesi 0..1 diyor
    (SIMULASYON_SOZLESMESI.md §3). İki ölçek tek yerde birleşir; 1'den küçük
    değer oran sayılır. Bu fark backend oturumuna bildirildi (J-62). */
function yuzdeye(ilerleme: number | undefined, durum: string): number {
  if (ilerleme == null) return durum === 'bitti' ? 100 : 0
  return ilerleme <= 1 ? Math.round(ilerleme * 100) : ilerleme
}

/**
 * Akış ve saat, uygulamada BİR kez kurulur.
 * Saat yerel bir sayaçtır: dakika değişmedikçe durum güncellenmez, yani
 * saniyede bir yeniden çizim olmaz ve sunucuya hiçbir istek gitmez.
 *
 * Akış kimlik ister (J-42): oturum yokken açılmaz, kullanıcı değişince
 * kapanıp yeniden kurulur. Eskiden giriş ekranında da açılıyordu ve çıkış
 * yapılınca sekmede önceki kullanıcının akışı sürüyordu.
 */
export function CanliSaglayici({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  const kullaniciId = useOturum().oturum?.kullaniciId ?? null

  useEffect(() => {
    if (!kullaniciId) return
    return canliAkisBaslat(qc, {
      dinleyici: (m) => {
        // Yeni SOS ve ihbar: konsolda köşede kısa kart (J-51).
        yeniOlayIsle(m)
        // Simülasyonun katman haberi: o koşunun sonucu tazelenir (sorgu
        // anahtarı `tazelenecekler`'de), ekran katmanı çizmeye başlar.
        if (m.tip === 'simulasyon-katman') {
          useSimulasyon.getState().katmanHazir(m.isId, m.katman)
          return
        }
        // Tatbikat bitirildi: AÇIK olan bütün ekranlar normal akışa döner —
        // bitiren sekmeyi temizlemek yetmez, başka bir koordinatör de bakıyor
        // olabilir (SIMULASYON_SOZLESMESI.md §3).
        if (m.tip === 'is-durumu' && m.isTipi === 'simulasyon' && m.durum === 'iptal') {
          useSimulasyon.getState().temizle()
        }
        if (m.tip !== 'is-durumu') return
        const { isGuncelle, isler } = useIsler.getState()
        if (!isler[m.isId]) {
          // Başka bir sekmede ya da başka bir kullanıcı tarafından başlatılmış iş.
          useIsler.getState().isBasladi(m.isId, m.isTipi, m.mesaj ?? '')
        }
        isGuncelle(m.isId, {
          durum: m.durum,
          ilerleme: yuzdeye(m.ilerleme, m.durum),
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
    })
  }, [qc, kullaniciId])

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
