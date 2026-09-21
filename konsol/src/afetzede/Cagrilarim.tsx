import { useQueryClient } from '@tanstack/react-query'
import { useCanliAkisDurumu } from '@/canli/canliAkis'
import { Amac, Bolum, Panel, SuAn, Teknik, VeriYok } from '@/kabuk/Panel'
import { Rozet } from '@/kabuk/parcalar'
import { IHTIYAC_ADI, type SosCagrisi } from '@/veri/sorgular'
import { dogruluk, sayi, saat, tarihSaat } from '@/lib/bicim'
import { DURUM_ETIKETI, ISLEM_DURUMU } from './etiketler'

const GOSTERILEN = 10

type Props = {
  cagrilar: SosCagrisi[] | undefined
  yukleniyor: boolean
  hata: boolean
  /** Koordinatör önizlemesinde sunucu bütün çağrıları verir; liste bunu yazar. */
  onizleme: boolean
}

export function Cagrilarim({ cagrilar, yukleniyor, hata, onizleme }: Props) {
  const qc = useQueryClient()
  const akis = useCanliAkisDurumu((d) => d.durum)
  const liste = cagrilar ?? []

  return (
    <Panel baslik={onizleme ? 'Çağrılar · önizleme' : 'Çağrılarım'} ek={<AkisRozeti durum={akis} />}>
      <Bolum>
        <Amac>Gönderdiğin çağrılar ve durumu. Bir ekip atanınca burada görürsün.</Amac>

        <div className="mt-3">
          {yukleniyor ? (
            <p className="text-small text-ink-3">Çağrılar yükleniyor…</p>
          ) : hata ? (
            <p role="alert" className="text-small text-crit">
              Çağrılar alınamadı. Bağlantın dönünce aşağıdan yenileyebilirsin.
            </p>
          ) : liste.length === 0 ? (
            <VeriYok ne="Çağrı" neden="son 7 günde çağrı göndermedin" />
          ) : (
            <ul>
              {liste.slice(0, GOSTERILEN).map((c) => (
                <CagriSatiri key={c.id} c={c} />
              ))}
            </ul>
          )}
        </div>

        {liste.length > 0 && (
          <SuAn>
            Son 7 gün · {sayi(liste.length)} çağrı
            {liste.length > GOSTERILEN ? `, en yeni ${GOSTERILEN} tanesi gösteriliyor` : ''}.
          </SuAn>
        )}

        {akis !== 'bagli' && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-control border border-line-2 px-2.5 py-2">
            <span className="text-small text-ink-2">
              {akis === 'kopuk'
                ? 'Canlı bağlantı koptu, yeniden deneniyor. Bu arada durum değişikliği gelmez.'
                : 'Canlı bağlantı kuruluyor…'}
            </span>
            <button
              type="button"
              onClick={() => void qc.invalidateQueries({ queryKey: ['sos'] })}
              className="rounded-control border border-line-2 px-2.5 py-1.5 text-small text-ink-2 hover:bg-hover"
            >
              Şimdi yenile
            </button>
          </div>
        )}

        {onizleme ? (
          <Teknik>
            Bu ekranı konsol rolüyle görüyorsun: sunucu bu role bütün çağrıları verir. Afetzede
            yalnız kendi çağrılarını görür; bu sınır sunucuda uygulanır, ekranda değil.
          </Teknik>
        ) : (
          <Teknik>
            Yalnız kendi çağrılarını görürsün; bu sınır sunucuda uygulanır. Liste yoklamayla değil,
            çağrının durumu değişince canlı akışla tazelenir.
          </Teknik>
        )}
      </Bolum>
    </Panel>
  )
}

function CagriSatiri({ c }: { c: SosCagrisi }) {
  const d = ISLEM_DURUMU[c.durum]
  const ayrinti = [
    c.kisiSayisi ? `${sayi(c.kisiSayisi)} kişi` : null,
    c.ihtiyaclar?.length ? c.ihtiyaclar.map((i) => IHTIYAC_ADI[i] ?? i).join(', ') : null,
  ].filter(Boolean)
  const konum =
    c.konumKaynagi === 'mahalle'
      ? `Konum: ${c.mahalle ?? 'mahalle'} merkezi (yaklaşık)`
      : c.konumKaynagi === 'gps'
        ? `Konum: cihaz konumu${c.konumDogrulukM != null ? `, ${dogruluk(c.konumDogrulukM)}` : ''}`
        : null

  return (
    <li className="border-b border-line py-2.5 first:pt-0 last:border-b-0">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-body text-ink">
          {tarihSaat(c.zaman)} · {DURUM_ETIKETI[c.oncelik]}
        </span>
        <Rozet ton={d.ton}>{d.ad}</Rozet>
      </span>
      {ayrinti.length > 0 && (
        <span className="mt-0.5 block text-small text-ink-2">{ayrinti.join(' · ')}</span>
      )}
      {c.metin && <span className="mt-0.5 block text-small text-ink-2">“{c.metin}”</span>}
      {konum && <span className="mt-0.5 block text-small text-ink-3">{konum}</span>}
      <span className="mt-0.5 block text-small text-ink-3">
        {c.durum === 'atandi' && c.atamaZamani
          ? `Ekip görevlendirildi · ${saat(c.atamaZamani)}`
          : d.aciklama}
      </span>
    </li>
  )
}

function AkisRozeti({ durum }: { durum: string }) {
  return (
    <span className="text-small text-ink-3">
      {durum === 'bagli' ? 'canlı' : durum === 'kopuk' ? 'bağlantı koptu' : 'bağlanıyor'}
    </span>
  )
}
