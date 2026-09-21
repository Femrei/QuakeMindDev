import { Bolum, Panel, Teknik } from './Panel'
import { Anahtar, Micro } from './parcalar'
import { KATMANLAR, KATMAN_ADI, useKonsol } from '@/durum/konsolDurumu'
import { useCanliAkisDurumu } from '@/canli/canliAkis'
import { useAralik } from '@/durum/zamanDurumu'
import { useOzet, useSosCagrilari } from '@/veri/sorgular'
import { sayi } from '@/lib/bicim'
import { GenelSol } from '@/modlar/genel'
import { SosSol } from '@/modlar/sos'
import { HasarSol } from '@/modlar/hasar'
import { KameraSol } from '@/modlar/kamera'
import { MetinSol } from '@/modlar/metin'
import { RiskSol } from '@/modlar/risk'
import { YolSol } from '@/modlar/yol'
import type { ModId } from '@/modlar/modlar'

const MOD_PANELI: Record<ModId, () => React.JSX.Element> = {
  genel: GenelSol,
  sos: SosSol,
  hasar: HasarSol,
  kamera: KameraSol,
  metin: MetinSol,
  risk: RiskSol,
  yol: YolSol,
}

export function SolPanel({ mod }: { mod: ModId }) {
  const ModPaneli = MOD_PANELI[mod]
  const katmanlar = useKonsol((d) => d.katmanlar)
  const katmanDegistir = useKonsol((d) => d.katmanDegistir)
  const akis = useCanliAkisDurumu((d) => d.durum)
  const aralik = useAralik()
  const ozet = useOzet(aralik)
  const sos = useSosCagrilari(aralik)

  const acikSayisi = KATMANLAR.filter((k) => katmanlar[k]).length

  return (
    <Panel baslik="Katmanlar" ek={<Micro>{acikSayisi} katman açık</Micro>}>
      <ModPaneli />

      <Bolum baslik="Harita katmanları">
        {KATMANLAR.map((k) => (
          <Anahtar
            key={k}
            acik={katmanlar[k]}
            etiket={KATMAN_ADI[k]}
            onDegis={() => katmanDegistir(k)}
          />
        ))}
      </Bolum>

      {/* Kural 1: her katman kaynağını yazar. */}
      <Bolum baslik="Veri kaynakları">
        {/* Her katman kaynağını ve o kaynağın o anki durumunu yazar (kural 1). */}
        <dl className="kilav-kv gap-x-2.5 gap-y-1 text-small">
          <dt className="text-ink-3">Uydu hasar</dt>
          <dd className="text-ink">
            SegFormer bölütlemesi —{' '}
            {ozet.isError
              ? 'uç yanıt vermiyor'
              : ozet.data
                ? `${sayi(ozet.data.kaynakSayilari.uydu ?? 0)} nokta`
                : 'yükleniyor'}
          </dd>
          <dt className="text-ink-3">Çağrılar</dt>
          <dd className="text-ink">
            Acil çağrı kaydı —{' '}
            {sos.isError
              ? 'uç yanıt vermiyor'
              : sos.data
                ? `${sayi(sos.data.length)} çağrı`
                : 'yükleniyor'}
          </dd>
          <dt className="text-ink-3">Yol kapanmaları</dt>
          <dd className="text-ink">
            Uydu analizinden —{' '}
            {ozet.data ? `${sayi(ozet.data.hasarliYol)} segment` : 'veri yok'}
          </dd>
          <dt className="text-ink-3">Toplanma</dt>
          <dd className="text-ink">AFAD toplanma alanları — uç henüz bağlanmadı</dd>
          <dt className="text-ink-3">Harita altlığı</dt>
          <dd className="text-ink">OSM + Copernicus — karo ucu henüz bağlanmadı</dd>
          <dt className="text-ink-3">Canlı akış</dt>
          <dd className="text-ink">
            /api/live —{' '}
            {akis === 'bagli' ? 'bağlı' : akis === 'baglaniyor' ? 'bağlanılıyor' : 'bağlı değil'}
          </dd>
        </dl>
        <Teknik>
          Konsol hiçbir veriyi kendisi üretmez; yukarıdaki sayılar sunucudan gelir. Bağlanmamış
          uçların yerine örnek veri konmaz.
        </Teknik>
      </Bolum>
    </Panel>
  )
}
