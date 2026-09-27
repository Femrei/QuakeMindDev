import { Link } from 'react-router-dom'
import { Warning } from '@phosphor-icons/react'
import { Micro } from './parcalar'
import { useSimulasyon } from '@/durum/simulasyonDurumu'
import { sonIsSec, useIsler } from '@/durum/islerDurumu'
import { useSimSonuc } from '@/veri/simulasyon'

/* ---------------------------------------------------------------------------
   TATBİKAT şeridi (SIMULASYON_SOZLESMESI.md §5 madde 1).

   Koşu varken KALICIDIR: kapatma düğmesi yoktur ve mod değişince kaybolmaz,
   çünkü asıl işi "ekrandaki bu şey gerçek olay değil" demektir. Şerit kabukta
   durur, mod panelinde değil; bu yüzden SOS moduna geçilse de görünür.

   Yanıp sönmez, renk geçişi yapmaz (ARAYUZ §6: sürekli yanıp sönen öğe yok).
--------------------------------------------------------------------------- */

export function TatbikatSeridi() {
  const isId = useSimulasyon((d) => d.isId)
  const hazir = useSimulasyon((d) => d.hazir)
  const is = useIsler(sonIsSec)
  const sonuc = useSimSonuc(isId)

  if (!isId) return null

  const simIs = is?.isTipi === 'simulasyon' ? is : null
  const alanAdi = sonuc.data?.alan.ad
  // Sayfa yenilendiğinde iş kaydı (sekme belleği) sıfırlanır ama koşu sunucuda
  // durur; o yüzden durum SONUCUN kendisinden de okunur, yoksa biten koşu
  // yenileme sonrası "%0 · katman bekleniyor" görünüyordu.
  const sonucDurumu = sonuc.data?.durum
  const durum =
    simIs?.durum === 'bitti' || sonucDurumu === 'bitti'
      ? 'bitti'
      : simIs?.durum === 'hata' || sonucDurumu === 'hata'
        ? 'hata'
        : 'koşuyor'
  const hazirSayisi = sonucDurumu === 'bitti' ? 4 : hazir.length

  return (
    <div
      role="status"
      className="flex shrink-0 items-center gap-3 rounded-panel border border-mid bg-panel px-3 py-2"
    >
      <span className="flex items-center gap-2 text-mid">
        <Warning size={16} weight="fill" aria-hidden />
        <span className="text-micro ls-micro uppercase">Tatbikat</span>
      </span>
      <span className="text-small text-ink">
        Bu ekranda gördüklerin bir tatbikat koşusudur — gerçek olay değildir.
      </span>
      {alanAdi && <Micro>{alanAdi}</Micro>}
      <Micro>
        {durum === 'bitti'
          ? `${hazirSayisi}/4 katman`
          : durum === 'hata'
            ? 'koşu hatası'
            : `%${Math.round(simIs?.ilerleme ?? sonuc.data?.ilerleme ?? 0)}`}
      </Micro>
      <Link
        to="/konsol/simulasyon"
        className="ml-auto rounded-control border border-line-2 px-2 py-1 text-small text-ink-2 hover:bg-hover hover:text-ink"
      >
        Tatbikat paneli
      </Link>
    </div>
  )
}
