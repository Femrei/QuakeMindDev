import { useState } from 'react'
import { useOturum } from '@/kimlik/oturum'
import { ROL_ADI } from '@/kimlik/roller'
import { Marka } from '@/kabuk/Marka'
import { BildirimBandi } from './BildirimBandi'
import { CagriFormu, type EtkinKonum } from './CagriFormu'
import { Cagrilarim } from './Cagrilarim'
import { ToplanmaAlanlari } from './ToplanmaAlanlari'
import { useCevrimici, useGpsKonumu } from './konum'
import { useCagrilarim, type Yer } from './veri'

/* ---------------------------------------------------------------------------
   Afetzede ekranı (J-43). Ayrı ve HAFİF (ARAYUZ §8, MIMARI §7): harita motoru
   ve analiz modülleri bu yola girmez. Telefonda tek sütun; sırası afetzedenin
   önceliğine göre: bildirim → yardım çağrısı → çağrılarım → toplanma alanı.

   Canlı veri tek akıştan gelir (kural 4): kendi çağrının durumu ve acil
   bildirimler. Sunucu afetzedeye başkasının çağrısını ve ekip konumlarını
   göndermez (J-42).
--------------------------------------------------------------------------- */

export function AfetzedeEkrani() {
  const { oturum, cikisYap } = useOturum()
  const cevrimici = useCevrimici()
  const { gps, iste } = useGpsKonumu()
  const [mahalle, setMahalle] = useState<Yer | null>(null)
  const cagrilar = useCagrilarim()

  // Koordinatör ve yönetici bu ekranı önizleyebilir; sunucu onlara bütün
  // çağrıları verdiği için "açık çağrın var" hatırlatması yalnız afetzedede.
  const onizleme = oturum?.rol !== 'afetzede'

  const gpsKonumu = gps.durum === 'hata' ? null : gps.konum
  const konum: EtkinKonum | null = mahalle
    ? { kaynak: 'mahalle', lon: mahalle.lon, lat: mahalle.lat, yer: mahalle }
    : gpsKonumu
      ? { kaynak: 'gps', lon: gpsKonumu.lon, lat: gpsKonumu.lat, dogrulukM: gpsKonumu.dogrulukM }
      : null

  const acikCagri = onizleme ? null : (cagrilar.data?.find((c) => c.durum !== 'kapandi') ?? null)

  return (
    <div className="h-full overflow-auto bg-ground">
      <header className="sticky top-0 z-10 border-b border-line bg-ground">
        <div className="mx-auto flex max-w-form items-center justify-between gap-3 px-gutter py-2.5">
          <Marka />
          <span className="flex items-center gap-1.5">
            <a
              href="tel:112"
              className="rounded-control border border-crit px-2.5 py-1.5 text-small font-semibold text-crit"
            >
              112'yi ara
            </a>
            <button
              type="button"
              onClick={() => void cikisYap()}
              className="rounded-control border border-line-2 px-2.5 py-1.5 text-small text-ink-2 hover:bg-hover"
            >
              Çıkış
            </button>
          </span>
        </div>
      </header>

      <main className="mx-auto grid max-w-form gap-gutter px-gutter py-gutter">
        {!cevrimici && (
          <p role="alert" className="rounded-panel border border-crit bg-panel px-3 py-2.5 text-body text-ink">
            İnternet bağlantın yok. Çağrı şu an gönderilemez; şebeke varsa 112'yi ara. Bağlantı
            dönünce bu sayfa çalışmaya devam eder.
          </p>
        )}

        {onizleme && oturum && (
          <p className="rounded-panel border border-line-2 bg-panel px-3 py-2.5 text-small text-ink-2">
            Önizleme: bu ekranı {ROL_ADI[oturum.rol].toLocaleLowerCase('tr-TR')} rolüyle
            görüyorsun. Buradan gönderilen çağrı gerçek kayıt olarak koordinasyon ekranına düşer.
          </p>
        )}

        <BildirimBandi />

        <CagriFormu
          konum={konum}
          gps={gps}
          gpsIste={() => {
            setMahalle(null)
            iste()
          }}
          mahalleSec={setMahalle}
          acikCagri={acikCagri}
          cagrilar={cagrilar.data ?? []}
        />

        <Cagrilarim
          cagrilar={cagrilar.data}
          yukleniyor={cagrilar.isPending}
          hata={cagrilar.isError}
          onizleme={onizleme}
        />

        <ToplanmaAlanlari konum={konum} />

        {oturum && (
          <p className="pb-2 text-small text-ink-3">
            Oturum: {oturum.adSoyad} · {ROL_ADI[oturum.rol]}
          </p>
        )}
      </main>
    </div>
  )
}
