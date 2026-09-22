import { dogruluk } from '@/lib/bicim'
import { Diyalog } from './Diyalog'
import { KABA_DOGRULUK_M, type EtkinKonum, type GpsDurumu } from './konum'
import { MahalleSecici, YER_TURU } from './MahalleSecici'
import type { Yer } from './veri'

/* Konum penceresi: cihaz konumunun durumu, yeniden deneme ve mahalle seçimi.
   Konum olmadan çağrı gönderilemez; SOS'a konumsuz basılınca da bu açılır. */

type Props = {
  acik: boolean
  kapat: () => void
  konum: EtkinKonum | null
  gps: GpsDurumu
  gpsIste: () => void
  mahalleSec: (y: Yer | null) => void
}

export function KonumDiyalogu({ acik, kapat, konum, gps, gpsIste, mahalleSec }: Props) {
  const gpsKonumu = gps.durum === 'hata' ? null : gps.konum

  let durum: string
  if (konum?.kaynak === 'mahalle') {
    durum = `Seçili: ${konum.yer.ad} · ${YER_TURU[konum.yer.tur]} · ${konum.yer.bolgeAd}. Mahalle merkezi yaklaşık konumdur; notuna sokak, bina ve kat yaz.`
  } else if (gpsKonumu) {
    durum =
      gpsKonumu.dogrulukM > KABA_DOGRULUK_M
        ? `Cihaz konumun alındı ama doğruluk düşük (${dogruluk(gpsKonumu.dogrulukM)}): ekip seni bu genişlikte bir alanda arar. Mahalleni seçmek ya da notuna adres yazmak işe yarar.`
        : `Cihaz konumun alındı · ${dogruluk(gpsKonumu.dogrulukM)} doğruluk.`
  } else if (gps.durum === 'araniyor') {
    durum = 'Cihaz konumun aranıyor…'
  } else if (gps.durum === 'hata' && gps.neden === 'izin') {
    durum = 'Konum izni verilmedi. Tarayıcıda izin verirsen çağrın tam yerine düşer; vermezsen mahalleni seç.'
  } else if (gps.durum === 'hata' && gps.neden === 'desteklenmiyor') {
    durum = 'Bu tarayıcı konum vermiyor. Mahalleni seç.'
  } else {
    durum = 'Cihaz konumu bulunamadı. Açık alana çıkıp tekrar dene ya da mahalleni seç.'
  }

  return (
    <Diyalog acik={acik} kapat={kapat} baslik="Konumun">
      <p className="text-body text-ink">{durum}</p>
      <p className="mt-1.5 text-small text-ink-3">
        Konum olmadan çağrı gönderilemez: ekip nereye gideceğini bilemez. Konum veremiyorsan 112'yi ara.
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {!(gps.durum === 'hata' && gps.neden === 'desteklenmiyor') && (
          <button
            type="button"
            onClick={() => {
              mahalleSec(null)
              gpsIste()
            }}
            className="rounded-control border border-line-2 px-2.5 py-1.5 text-small text-ink hover:bg-hover"
          >
            {gpsKonumu ? 'Cihaz konumunu kullan ve yenile' : 'Cihaz konumunu tekrar dene'}
          </button>
        )}
      </div>
      <div className="mt-3 border-t border-line pt-3">
        <p className="text-body text-ink">Ya da mahalleni seç</p>
        <MahalleSecici
          onSec={(y) => {
            mahalleSec(y)
            kapat()
          }}
        />
      </div>
    </Diyalog>
  )
}
