import { useState } from 'react'
import { Amac, Bolum, HazirSecenekler, InceAyar, SuAn, Teknik, VeriYok } from '@/kabuk/Panel'
import { Anahtar, Micro } from '@/kabuk/parcalar'
import { useAralik } from '@/durum/zamanDurumu'
import { useEkipler } from '@/veri/sorgular'
import { sayi } from '@/lib/bicim'

const SORULAR = [
  { id: 'kapali', etiket: 'Kapalı yollar' },
  { id: 'ekip-cagri', etiket: 'Ekipten çağrıya' },
  { id: 'hastane', etiket: 'En yakın hastane' },
  { id: 'toplanma', etiket: 'En yakın toplanma alanı' },
] as const
type SoruId = (typeof SORULAR)[number]['id']

export function YolSol() {
  const [soru, setSoru] = useState<SoruId>('kapali')
  const [engelKac, setEngelKac] = useState(true)
  const ekipler = useEkipler()

  return (
    <Bolum baslik="Yol ve rota" ek={<Micro>{ekipler.data ? `${sayi(ekipler.data.length)} ekip` : '—'}</Micro>}>
      <Amac>Ekip oraya hangi yoldan gider? Kapalı yolları atlayan güzergâhı çıkarır.</Amac>

      <HazirSecenekler etiket="Rota soruları" secenekler={SORULAR} secili={soru} onSec={setSoru} />

      <InceAyar baslik="Rota kuralları">
        <Anahtar
          acik={engelKac}
          etiket="Hasarlı yollardan kaçın"
          onDegis={() => setEngelKac((v) => !v)}
        />
      </InceAyar>

      <SuAn>
        {SORULAR.find((s) => s.id === soru)?.etiket} soruluyor;{' '}
        {engelKac ? 'hasarlı yollar güzergâh dışında tutuluyor' : 'bütün yollar kullanılabilir'}.
        Rota için yol ağı ucu gerekiyor.
      </SuAn>

      <div className="mt-2">
        <VeriYok ne="Yol ağı" neden="rota ucu (A*) henüz bağlı değil" />
      </div>

      <Teknik>
        Rota sunucuda, bölge çizgesi üzerinde hesaplanır ve önbelleğe alınır; uzun sürerse iş
        kimliğiyle döner, sonucu canlı akış bildirir.
      </Teknik>
    </Bolum>
  )
}

export function YolSag() {
  const aralik = useAralik()
  const ekipler = useEkipler()

  return (
    <Bolum baslik="Güzergâh">
      <Amac>Seçili rotanın uzunluğu, tahmini süresi ve üzerindeki engeller.</Amac>
      <div className="mt-2">
        <VeriYok
          ne="Güzergâh"
          neden={
            ekipler.isError
              ? 'ekip ve yol ağı uçları henüz bağlı değil'
              : 'henüz bir rota seçilmedi'
          }
        />
      </div>
      <Teknik>
        Güzergâh seçili zaman aralığındaki yol kapanmalarına göre hesaplanır (
        {new Date(aralik[0]).toLocaleDateString('tr-TR')} — {new Date(aralik[1]).toLocaleDateString('tr-TR')}
        ); aralık değişirse rota da değişir.
      </Teknik>
    </Bolum>
  )
}
