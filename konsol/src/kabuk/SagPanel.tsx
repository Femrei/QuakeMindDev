import { Panel } from './Panel'
import { Micro } from './parcalar'
import { GenelSag } from '@/modlar/genel'
import { SosSag } from '@/modlar/sos'
import { EkiplerSag } from '@/modlar/ekipler'
import { IhtiyacSag } from '@/modlar/ihtiyac'
import { BildirimSag } from '@/modlar/bildirim'
import { HasarSag } from '@/modlar/hasar'
import { KameraSag } from '@/modlar/kamera'
import { MetinSag } from '@/modlar/metin'
import { RiskSag } from '@/modlar/risk'
import { YolSag } from '@/modlar/yol'
import type { ModId } from '@/modlar/modlar'
import { useAralik } from '@/durum/zamanDurumu'
import { tarih } from '@/lib/bicim'

const MOD_PANELI: Record<ModId, () => React.JSX.Element> = {
  genel: GenelSag,
  sos: SosSag,
  ekipler: EkiplerSag,
  ihtiyac: IhtiyacSag,
  bildirim: BildirimSag,
  hasar: HasarSag,
  kamera: KameraSag,
  metin: MetinSag,
  risk: RiskSag,
  yol: YolSag,
}

export function SagPanel({ mod }: { mod: ModId }) {
  const ModPaneli = MOD_PANELI[mod]
  const [t0, t1] = useAralik()

  return (
    <Panel
      baslik="Antakya · durum"
      ek={
        <Micro>
          {tarih(t0)} – {tarih(t1)}
        </Micro>
      }
    >
      <ModPaneli />
    </Panel>
  )
}
