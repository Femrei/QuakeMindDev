import { useId, useState } from 'react'
import { Check, Package, PaperPlaneTilt } from '@phosphor-icons/react'
import { ApiHatasi } from '@/veri/istemci'
import { IHTIYAC_ADI, type Ihtiyac } from '@/veri/sorgular'
import { sn } from '@/lib/sinif'
import { IHTIYAC_SIRASI, type Ihbar } from '@/veri/ihbar'
import { IHTIYAC_IKONU } from '@/veri/ihbarIkon'
import type { EtkinKonum } from './konum'
import { Adim, BIRINCIL, Gonderildi, IKINCIL, KisiSayaci, KonumSatiri } from './parcalar'
import { konumAlanlari, useIhbarGonder } from './veri'

/* ---------------------------------------------------------------------------
   İhtiyaç talebi (J-51). Hayati tehlike yoksa afetzede eksiklerini bildirir:
   su, gıda, barınma, ısınma, ilaç, hijyen. Talep konsolda "İhtiyaç talepleri"
   modunda ve "Son ihbarlar"da anında görünür. Hasar olmadığı için ısı
   haritasına yazılmaz. Hayati tehlike varsa SOS kullanılır; pencere bunu
   en üstte söyler.
--------------------------------------------------------------------------- */

const NOT_SINIRI = 1000

function hataMetni(e: unknown): string {
  if (e instanceof ApiHatasi) return e.message
  if (e instanceof TypeError) return 'sunucuya ulaşılamadı; internet bağlantın kopmuş olabilir'
  return e instanceof Error ? e.message : 'bilinmeyen hata'
}

export function IhtiyacIhbari({ konum, konumAc }: { konum: EtkinKonum | null; konumAc: () => void }) {
  const notKimligi = useId()
  const [secilen, setSecilen] = useState<Ihtiyac[]>([])
  const [kisi, setKisi] = useState(1)
  const [not, setNot] = useState('')
  const [gonderilen, setGonderilen] = useState<Ihbar | null>(null)
  const gonder = useIhbarGonder()

  function degistir(i: Ihtiyac) {
    setSecilen((l) => (l.includes(i) ? l.filter((x) => x !== i) : [...l, i]))
  }

  function gonderTalep() {
    if (!konum) {
      konumAc()
      return
    }
    gonder.mutate(
      {
        tur: 'ihtiyac',
        ihtiyaclar: secilen,
        kisiSayisi: kisi,
        metin: not.trim() || undefined,
        ...konumAlanlari(konum),
      },
      { onSuccess: setGonderilen },
    )
  }

  if (gonderilen) {
    return (
      <div className="grid gap-3">
        <Gonderildi baslik="İhtiyaç talebin koordinasyona ulaştı" kimlik={gonderilen.id} zaman={gonderilen.zaman}>
          <p className="mt-1 text-small text-ink-2">
            Talep: {(gonderilen.ihtiyaclar ?? []).map((i) => IHTIYAC_ADI[i]).join(', ')}
            {gonderilen.kisiSayisi ? ` · ${gonderilen.kisiSayisi} kişi` : ''}.
          </p>
        </Gonderildi>
        <button
          type="button"
          onClick={() => {
            gonder.reset()
            setGonderilen(null)
            setSecilen([])
            setNot('')
          }}
          className={IKINCIL}
        >
          <Package size={18} aria-hidden /> Başka talep gönder
        </button>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <p className="rounded-control border border-crit px-2.5 py-2 text-body text-ink">
        Hayati tehlike varsa (enkaz altında kalan, ağır yaralı) bu pencereyi kapatıp{' '}
        <b className="font-semibold text-crit">SOS</b> gönder ya da 112'yi ara.
      </p>

      <Adim no={1} baslik="Neye ihtiyacın var?">
        <div role="group" aria-label="İhtiyaçlar" className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {IHTIYAC_SIRASI.map((i) => {
            const Ikon = IHTIYAC_IKONU[i]
            const secili = secilen.includes(i)
            return (
              <button
                key={i}
                type="button"
                aria-pressed={secili}
                onClick={() => degistir(i)}
                className={sn(
                  'flex h-14 items-center gap-2 rounded-control border px-2.5 text-left text-body transition-colors duration-150 ease-out-qm',
                  secili
                    ? 'border-ihbar-ihtiyac bg-ihbar-ihtiyac/15 text-ink'
                    : 'border-line-2 text-ink-2 hover:bg-hover hover:text-ink',
                )}
              >
                <Ikon size={22} className="shrink-0 text-ihbar-ihtiyac" weight={secili ? 'fill' : 'regular'} aria-hidden />
                <span className="flex-1">{IHTIYAC_ADI[i]}</span>
                {secili && <Check size={16} weight="bold" className="shrink-0 text-ihbar-ihtiyac" aria-hidden />}
              </button>
            )
          })}
        </div>
      </Adim>

      <Adim no={2} baslik="Kimin için, nereye?">
        <KisiSayaci deger={kisi} degis={setKisi} />
        <div className="mt-2.5 flex items-baseline justify-between gap-2">
          <label htmlFor={notKimligi} className="text-small text-ink-2">
            Not · isteğe bağlı
          </label>
          <span className="text-small text-ink-3">
            {not.length}/{NOT_SINIRI}
          </span>
        </div>
        <textarea
          id={notKimligi}
          rows={2}
          maxLength={NOT_SINIRI}
          value={not}
          onChange={(e) => setNot(e.target.value)}
          placeholder="Örnek: iki bebek var, mama da lazım; çadırdayız."
          className="mt-1 w-full resize-none rounded-control border border-line-2 bg-sunken px-2.5 py-2 text-body text-ink"
        />
        <div className="mt-2">
          <KonumSatiri konum={konum} konumAc={konumAc} not="Dağıtım bu konuma planlanır." />
        </div>
      </Adim>

      <div>
        <button
          type="button"
          disabled={secilen.length === 0 || gonder.isPending}
          onClick={gonderTalep}
          className={BIRINCIL}
        >
          <PaperPlaneTilt size={18} aria-hidden />
          {gonder.isPending
            ? 'Gönderiliyor…'
            : secilen.length === 0
              ? 'Önce en az bir ihtiyaç seç'
              : konum
                ? 'Talebi gönder'
                : 'Önce konumunu seç'}
        </button>
        {gonder.isError && (
          <p role="alert" className="mt-2 text-small text-crit">
            Gönderilemedi: {hataMetni(gonder.error)}. Seçimlerin duruyor; yeniden deneyebilirsin.
          </p>
        )}
      </div>
    </div>
  )
}
