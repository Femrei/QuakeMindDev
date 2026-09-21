import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useOturum } from '@/kimlik/oturum'
import { Marka } from '@/kabuk/Marka'
import { Amac, Bolum, Panel, Teknik, VeriYok } from '@/kabuk/Panel'
import { Rozet } from '@/kabuk/parcalar'
import { apiPost } from '@/veri/istemci'
import { useSosCagrilari, type SosCagrisi } from '@/veri/sorgular'
import { useAralik } from '@/durum/zamanDurumu'
import { tarihSaat } from '@/lib/bicim'

/* Afetzede ekranı ayrıdır ve HAFİFtir (ARAYUZ §8): yardım çağrısı, kendi
   çağrılarının durumu ve toplanma alanı. Harita motoru bu yola girmez. */

const ONCELIKLER = [
  { id: 'kritik', etiket: 'Mahsur kaldım', aciklama: 'Enkaz altındayım ya da çıkamıyorum' },
  { id: 'yuksek', etiket: 'Yaralı var', aciklama: 'Tıbbi yardım gerekiyor' },
  { id: 'orta', etiket: 'Yardım gerekli', aciklama: 'Barınma, su, ısınma' },
] as const

export function AfetzedeEkrani() {
  const { oturum, cikisYap } = useOturum()
  const qc = useQueryClient()
  const aralik = useAralik()
  const cagrilar = useSosCagrilari(aralik)

  const [oncelik, setOncelik] = useState<(typeof ONCELIKLER)[number]['id']>('kritik')
  const [metin, setMetin] = useState('')
  const [konum, setKonum] = useState<{ lon: number; lat: number } | null>(null)
  const [konumHatasi, setKonumHatasi] = useState<string | null>(null)
  const [konumAraniyor, setKonumAraniyor] = useState(false)

  const cagriAc = useMutation({
    mutationFn: (govde: { lon: number; lat: number; oncelik: string; metin?: string }) =>
      apiPost<SosCagrisi>('/api/sos', govde),
    onSuccess: () => {
      setMetin('')
      void qc.invalidateQueries({ queryKey: ['sos'] })
    },
  })

  function konumAl() {
    setKonumHatasi(null)
    setKonumAraniyor(true)
    if (!navigator.geolocation) {
      setKonumAraniyor(false)
      setKonumHatasi('Bu tarayıcı konum vermiyor. Konumunu elle girmen gerekiyor.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setKonum({ lon: p.coords.longitude, lat: p.coords.latitude })
        setKonumAraniyor(false)
      },
      (e) => {
        setKonumAraniyor(false)
        setKonumHatasi(
          e.code === e.PERMISSION_DENIED
            ? 'Konum izni verilmedi. İzin verirsen çağrın doğru yere düşer.'
            : 'Konum alınamadı.',
        )
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  return (
    <div className="h-full overflow-auto bg-ground p-gutter">
      <header className="mb-3.5 flex items-center justify-between gap-3">
        <Marka />
        <button
          type="button"
          onClick={() => void cikisYap()}
          className="rounded-control border border-line-2 px-2.5 py-1.5 text-small text-ink-2"
        >
          Çıkış
        </button>
      </header>

      <div className="mx-auto grid max-w-form gap-gutter">
        <Panel baslik="Yardım çağrısı">
          <Bolum>
            <Amac>Yardıma ihtiyacın varsa durumunu ve konumunu bildir.</Amac>

            <div className="mt-3 grid gap-1.5">
              {ONCELIKLER.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setOncelik(o.id)}
                  aria-pressed={oncelik === o.id}
                  className={
                    oncelik === o.id
                      ? 'rounded-control border border-accent bg-accent-soft px-3 py-2.5 text-left'
                      : 'rounded-control border border-line-2 px-3 py-2.5 text-left hover:bg-hover'
                  }
                >
                  <span className="block text-body text-ink">{o.etiket}</span>
                  <span className="block text-small text-ink-3">{o.aciklama}</span>
                </button>
              ))}
            </div>

            <label className="mt-3 block text-micro ls-micro text-ink-3 uppercase" htmlFor="metin">
              Kısa açıklama
            </label>
            <textarea
              id="metin"
              rows={2}
              value={metin}
              onChange={(e) => setMetin(e.target.value)}
              placeholder="Kaç kişisiniz, neredesiniz?"
              className="mt-1.5 w-full rounded-control border border-line-2 bg-sunken px-2.5 py-2 text-body text-ink"
            />

            <div className="mt-3 flex items-center justify-between gap-2 rounded-control border border-line-2 bg-sunken px-2.5 py-2">
              <span className="text-small text-ink-2">
                {konum
                  ? `Konum alındı: ${konum.lat.toFixed(5)}, ${konum.lon.toFixed(5)}`
                  : 'Konum alınmadı'}
              </span>
              <button
                type="button"
                onClick={konumAl}
                disabled={konumAraniyor}
                className="text-small text-accent disabled:opacity-50"
              >
                {konumAraniyor ? 'alınıyor…' : konum ? 'yenile' : 'konumumu al'}
              </button>
            </div>
            {konumHatasi && <p className="mt-1.5 text-small text-ink-3">{konumHatasi}</p>}

            <button
              type="button"
              disabled={!konum || cagriAc.isPending}
              onClick={() =>
                konum &&
                cagriAc.mutate({
                  lon: konum.lon,
                  lat: konum.lat,
                  oncelik,
                  metin: metin.trim() || undefined,
                })
              }
              className="mt-3 w-full rounded-control bg-crit px-3 py-2.5 text-body font-semibold text-ink disabled:opacity-40"
            >
              {cagriAc.isPending ? 'Gönderiliyor…' : 'Yardım çağır'}
            </button>

            {!konum && (
              <p className="mt-2 text-small text-ink-3">
                Çağrı göndermek için önce konumun gerekiyor — ekip oraya yönlendirilecek.
              </p>
            )}
            {cagriAc.isError && (
              <p role="alert" className="mt-2 text-small text-crit">
                {cagriAc.error instanceof Error ? cagriAc.error.message : 'Çağrı gönderilemedi.'}
              </p>
            )}
            {cagriAc.isSuccess && (
              <p className="mt-2 text-small text-ok">
                Çağrın alındı. Koordinasyon ekranında görünüyor.
              </p>
            )}
          </Bolum>
        </Panel>

        <Panel baslik="Çağrılarım">
          <Bolum>
            {cagrilar.data?.length ? (
              <ul>
                {cagrilar.data.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-baseline justify-between gap-2 border-b border-line py-2 last:border-b-0"
                  >
                    <span>
                      <span className="block text-body text-ink">{tarihSaat(c.zaman)}</span>
                      <span className="block text-small text-ink-3">{c.metin ?? '—'}</span>
                    </span>
                    <Rozet ton={c.durum === 'atandi' ? 'ok' : c.durum === 'kapandi' ? 'nötr' : 'crit'}>
                      {c.durum === 'atandi' ? 'Ekip yolda' : c.durum === 'kapandi' ? 'Kapandı' : 'Bekliyor'}
                    </Rozet>
                  </li>
                ))}
              </ul>
            ) : (
              <VeriYok ne="Çağrı" neden="henüz çağrı göndermedin" />
            )}
            <Teknik>
              Yalnız kendi çağrılarını görürsün; bu sınır sunucuda uygulanır, ekranda değil.
            </Teknik>
          </Bolum>
        </Panel>

        <Panel baslik="En yakın toplanma alanı">
          <Bolum>
            <Amac>Nereye gitmelisin? En yakın güvenli alan ve oraya giden yol.</Amac>
            <div className="mt-2">
              <VeriYok ne="Toplanma alanları" neden="AFAD verisi ucu henüz bağlanmadı" />
            </div>
          </Bolum>
        </Panel>

        {oturum && (
          <p className="text-small text-ink-3">
            Oturum: {oturum.adSoyad} · {oturum.rol}
          </p>
        )}
      </div>
    </div>
  )
}
