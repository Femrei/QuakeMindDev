import { useMemo, useState } from 'react'
import { Amac, Bolum, HazirSecenekler, InceAyar, SuAn, Teknik, VeriYok } from '@/kabuk/Panel'
import { Anahtar, Micro, Rozet } from '@/kabuk/parcalar'
import { useAralik } from '@/durum/zamanDurumu'
import {
  ONCELIK_ADI,
  ONCELIK_TON,
  useEnYakinEkip,
  useEkipler,
  useSosAta,
  useSosCagrilari,
  type SosCagrisi,
  sosEkBilgi,
} from '@/veri/sorgular'
import { useKonsol } from '@/durum/konsolDurumu'
import { useHarita } from '@/harita/HaritaKabugu'
import { sayi, tarihSaat } from '@/lib/bicim'
import { sn } from '@/lib/sinif'

const SUZGECLER = [
  { id: 'bekleyen', etiket: 'Bekleyen çağrılar' },
  { id: 'kritik', etiket: 'Yalnız kritik' },
  { id: 'atanan', etiket: 'Ekibe atananlar' },
  { id: 'tum', etiket: 'Tümü' },
] as const
type SuzgecId = (typeof SUZGECLER)[number]['id']


/** Süzgeç ve sıralama tek yerde: panel ile liste aynı kuralı kullanır. */
function suz(cagrilar: SosCagrisi[], suzgec: SuzgecId): SosCagrisi[] {
  switch (suzgec) {
    case 'bekleyen':
      return cagrilar.filter((c) => c.durum === 'bekliyor')
    case 'kritik':
      return cagrilar.filter((c) => c.oncelik === 'kritik' && c.durum !== 'kapandi')
    case 'atanan':
      return cagrilar.filter((c) => c.durum === 'atandi')
    default:
      return cagrilar
  }
}

const ONCELIK_SIRASI = { kritik: 0, yuksek: 1, orta: 2 }

export function SosSol() {
  const [suzgec, setSuzgec] = useState<SuzgecId>('bekleyen')
  const [yakinaGore, setYakinaGore] = useState(false)
  const aralik = useAralik()
  const sos = useSosCagrilari(aralik)
  const ekipler = useEkipler()

  const gorunen = suz(sos.data ?? [], suzgec)
  const toplam = sos.data?.length ?? null

  return (
    <Bolum
      baslik="Çağrı kuyruğu"
      ek={<Micro>{toplam === null ? '—' : `${sayi(gorunen.length)} / ${sayi(toplam)}`}</Micro>}
    >
      <Amac>Hangi çağrıya önce gidilecek? Kuyruğu aciliyet ve ekip durumuna göre daraltır.</Amac>

      <HazirSecenekler
        etiket="Kuyruk süzgeçleri"
        secenekler={SUZGECLER}
        secili={suzgec}
        onSec={setSuzgec}
      />

      <InceAyar baslik="Sıralama">
        <Anahtar
          acik={yakinaGore}
          etiket="Ekibe yakınlığa göre sırala"
          onDegis={() => setYakinaGore((v) => !v)}
        />
      </InceAyar>

      <SuAn>
        {toplam === null
          ? 'Çağrı ucu yanıt vermiyor; kuyruk gösterilemiyor.'
          : `${SUZGECLER.find((s) => s.id === suzgec)?.etiket}: seçili aralıktaki ${sayi(
              toplam,
            )} çağrının ${sayi(gorunen.length)} tanesi listede, ${
              yakinaGore ? 'ekibe yakınlığa' : 'aciliyete'
            } göre sıralı.`}
      </SuAn>

      {sos.isError && (
        <div className="mt-2">
          <VeriYok ne="SOS çağrıları" neden="çağrı ucu yanıt vermedi" />
        </div>
      )}

      {ekipler.data?.length === 0 && (
        <p className="mt-2 text-small text-ink-3">
          Kayıtlı ekip yok: sevk yapılamaz. Ekipler koordinatör tarafından tanımlanır.
        </p>
      )}

      <Teknik>
        Kuyruk yoklamayla değil, canlı akıştaki “yeni-sos” mesajıyla tazelenir; mesaj gelmezse
        istek de gitmez. Sıralama ve süzme istemcide, sayılar sunucuda hesaplanır.
      </Teknik>
    </Bolum>
  )
}

export function SosSag() {
  const aralik = useAralik()
  const sos = useSosCagrilari(aralik)
  const secili = useKonsol((d) => d.seciliKayit)
  const kayitSec = useKonsol((d) => d.kayitSec)
  const { ucus } = useHarita()

  const seciliId = secili?.tip === 'sos' ? secili.id : null
  const enYakin = useEnYakinEkip(seciliId)
  const ata = useSosAta()

  const sirali = useMemo(
    () =>
      [...(sos.data ?? [])].sort((a, b) => {
        // Önce bekleyenler, sonra aciliyet, sonra en yeni çağrı.
        const durum = Number(a.durum !== 'bekliyor') - Number(b.durum !== 'bekliyor')
        if (durum !== 0) return durum
        const oncelik = ONCELIK_SIRASI[a.oncelik] - ONCELIK_SIRASI[b.oncelik]
        return oncelik !== 0 ? oncelik : b.zaman - a.zaman
      }),
    [sos.data],
  )

  const seciliCagri = sirali.find((c) => c.id === seciliId) ?? null

  return (
    <>
      {seciliCagri && (
        <Bolum baslik="Seçili çağrı" ek={<Micro>{seciliCagri.id}</Micro>}>
          <dl className="kilav-kv gap-x-2.5 gap-y-1.5 text-small">
            <dt className="text-ink-3">Durum</dt>
            <dd className="text-ink">
              {seciliCagri.durum === 'bekliyor'
                ? 'Bekliyor'
                : seciliCagri.durum === 'atandi'
                  ? `Ekip atandı (${seciliCagri.ekipId})`
                  : 'Kapandı'}
            </dd>
            <dt className="text-ink-3">Aciliyet</dt>
            <dd className="text-ink">{ONCELIK_ADI[seciliCagri.oncelik]}</dd>
            <dt className="text-ink-3">Konum</dt>
            <dd className="font-mono text-ink">
              {seciliCagri.lat.toFixed(5)}, {seciliCagri.lon.toFixed(5)}
            </dd>
            <dt className="text-ink-3">En yakın ekip</dt>
            <dd className="text-ink">
              {enYakin.isLoading
                ? 'hesaplanıyor…'
                : enYakin.data?.ekip
                  ? `${enYakin.data.ekip.ad} · ${(
                      (enYakin.data.mesafeM ?? 0) / 1000
                    )
                      .toFixed(1)
                      .replace('.', ',')} km`
                  : 'kayıtlı ekip yok'}
            </dd>
          </dl>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={
                seciliCagri.durum !== 'bekliyor' || !enYakin.data?.ekip || ata.isPending
              }
              onClick={() =>
                enYakin.data?.ekip &&
                ata.mutate({ sosId: seciliCagri.id, ekipId: enYakin.data.ekip.id })
              }
              className="flex-1 rounded-control bg-accent px-3 py-2 text-body font-semibold text-accent-ink disabled:opacity-40"
            >
              {seciliCagri.durum === 'bekliyor' ? 'Ekip gönder' : 'Ekip yolda'}
            </button>
            <button
              type="button"
              onClick={() => ucus(seciliCagri.lon, seciliCagri.lat, 15.5)}
              className="rounded-control border border-line-2 px-3 py-2 text-body text-ink-2 hover:bg-hover hover:text-ink"
            >
              Haritada göster
            </button>
          </div>

          {ata.isError && (
            <p role="alert" className="mt-2 text-small text-crit">
              {ata.error instanceof Error ? ata.error.message : 'Sevk yapılamadı.'}
            </p>
          )}
        </Bolum>
      )}

      <Bolum baslik="Çağrılar" dolgusuz>
        {sirali.length ? (
          <div>
            {sirali.map((c) => {
              const ek = sosEkBilgi(c)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    kayitSec({ tip: 'sos', id: c.id })
                    ucus(c.lon, c.lat, 15)
                  }}
                  className={sn(
                    'block w-full border-b border-line px-3 py-2.5 text-left',
                    seciliId === c.id ? 'bg-raised' : 'hover:bg-raised',
                  )}
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-mono text-small text-ink-2">{c.id}</span>
                    <Rozet
                      ton={
                        c.durum === 'kapandi' ? 'nötr' : c.durum === 'atandi' ? 'ok' : ONCELIK_TON[c.oncelik]
                      }
                    >
                      {c.durum === 'atandi' ? 'Atandı' : c.durum === 'kapandi' ? 'Kapandı' : ONCELIK_ADI[c.oncelik]}
                    </Rozet>
                  </span>
                  <span className="mt-0.5 block text-small text-ink">
                    {c.mahalle ? `${c.mahalle} · ` : ''}
                    {tarihSaat(c.zaman)}
                  </span>
                  {ek.kisiIhtiyac && (
                    <span className="mt-0.5 block text-small text-ink-2">{ek.kisiIhtiyac}</span>
                  )}
                  {c.metin && <span className="mt-1 block text-small text-ink-3">{c.metin}</span>}
                  {ek.yaklasik && (
                    <span className="mt-1 block text-small text-ink">Dikkat: {ek.konum}</span>
                  )}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="px-3 pb-3">
            <VeriYok
              ne="Çağrı listesi"
              neden={sos.isError ? 'çağrı ucu yanıt vermedi' : 'seçili zaman aralığında çağrı yok'}
            />
          </div>
        )}
      </Bolum>
    </>
  )
}
