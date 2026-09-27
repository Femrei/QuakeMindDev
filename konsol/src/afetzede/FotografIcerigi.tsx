import { useId, useState } from 'react'
import { Camera, PaperPlaneTilt, Sparkle, Warning } from '@phosphor-icons/react'
import { ApiHatasi } from '@/veri/istemci'
import { IsaretliFoto, TespitListesi } from '@/kabuk/IsaretliFoto'
import { sn } from '@/lib/sinif'
import { FOTOGRAF_MODELI, type FotografModeli, type Ihbar, type Tespit } from '@/veri/ihbar'
import type { EtkinKonum } from './konum'
import { Adim, BIRINCIL, Gonderildi, IKINCIL, KonumSatiri } from './parcalar'
import { konumAlanlari, useFotografAnalizi, useIhbarGonder } from './veri'

/* ---------------------------------------------------------------------------
   Hasar fotoğrafı ihbarı (J-50, J-51). Dört adım:
     1. Fotoğraf çek ya da seç.
     2. Hangi model baksın: çatlak, bina hasarı ya da ikisi.
     3. Modelin cevabı: işaretli fotoğraf ve model başına sonuç.
     4. İhbar et: not ve konumla koordinasyona gönder. Konsolda kamera
        modunda ve "Son ihbarlar"da anında görünür.
   İnceleme kayıt açmaz; ihbar yalnız afetzede "gönder" deyince açılır.
   Sonuç yalnız sunucudan gelir ve modelin tahmini olarak yazılır: eski web
   sunucuya ulaşamayınca "%96,2 derin çatlak" uyduruyor, modelin çıktısını
   "yapısal tehlike yok" diye güvenlik hükmüne çeviriyordu.
--------------------------------------------------------------------------- */

type Foto = { veri: string; en: number; boy: number }

/** Telefon fotoğrafı 5–10 MB olabilir: uzun kenar 1280 piksele indirilir
    (modeller 640 pikselde çalışıyor), JPEG olarak gönderilir. Yeniden çizim
    fotoğraftaki konum ve cihaz bilgisini (EXIF) de siler. */
const EN_UZUN_KENAR = 1280
const NOT_SINIRI = 1000

function kucult(dosya: File): Promise<Foto> {
  return new Promise((coz, reddet) => {
    const img = new Image()
    const url = URL.createObjectURL(dosya)
    img.onload = () => {
      const oran = Math.min(1, EN_UZUN_KENAR / Math.max(img.width, img.height))
      const tuval = document.createElement('canvas')
      tuval.width = Math.round(img.width * oran)
      tuval.height = Math.round(img.height * oran)
      tuval.getContext('2d')?.drawImage(img, 0, 0, tuval.width, tuval.height)
      URL.revokeObjectURL(url)
      coz({ veri: tuval.toDataURL('image/jpeg', 0.85), en: tuval.width, boy: tuval.height })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reddet(new Error('Fotoğraf okunamadı.'))
    }
    img.src = url
  })
}

const MODEL_SIRASI: FotografModeli[] = ['ikisi', 'catlak', 'bina']

function hataMetni(e: unknown): string {
  if (e instanceof ApiHatasi) return e.message
  if (e instanceof TypeError) return 'sunucuya ulaşılamadı; internet bağlantın kopmuş olabilir'
  return e instanceof Error ? e.message : 'bilinmeyen hata'
}

/** Model başına tek cümle: ne işaretledi, ne işaretlemedi. */
function modelCumleleri(model: FotografModeli, tespitler: Tespit[]): string[] {
  const c: string[] = []
  if (model !== 'bina') {
    const n = tespitler.filter((t) => t.model === 'catlak').length
    c.push(n ? `Çatlak modeli ${n} çatlak işaretledi.` : 'Çatlak modeli çatlak işaretlemedi.')
  }
  if (model !== 'catlak') {
    const bina = tespitler.filter((t) => t.model === 'bina')
    const hasar = bina.filter((t) => t.hasar).sort((a, b) => b.skor - a.skor || b.guven - a.guven)[0]
    const hasarsiz = bina.filter((t) => !t.hasar).sort((a, b) => b.guven - a.guven)[0]
    if (hasar) c.push(`Bina modeli ${hasar.ad.toLocaleLowerCase('tr-TR')} işaretledi (güven %${Math.round(hasar.guven * 100)}).`)
    else if (hasarsiz)
      c.push(`Bina modeli binayı "hasarsız" sınıfına koydu (%${Math.round(hasarsiz.guven * 100)}); bu, binanın güvenli olduğu anlamına gelmez.`)
    else c.push('Bina modeli bir bina işaretlemedi.')
  }
  return c
}

export function FotografIcerigi({ konum, konumAc }: { konum: EtkinKonum | null; konumAc: () => void }) {
  const kimlik = useId()
  const notKimligi = useId()
  const [foto, setFoto] = useState<Foto | null>(null)
  const [okumaHatasi, setOkumaHatasi] = useState<string | null>(null)
  const [model, setModel] = useState<FotografModeli>('ikisi')
  const [not, setNot] = useState('')
  const [gonderilen, setGonderilen] = useState<Ihbar | null>(null)
  const analiz = useFotografAnalizi()
  const gonder = useIhbarGonder()

  function sifirla() {
    analiz.reset()
    gonder.reset()
    setGonderilen(null)
  }

  async function dosyaSecildi(dosya: File | undefined) {
    sifirla()
    setOkumaHatasi(null)
    if (!dosya) return
    try {
      setFoto(await kucult(dosya))
    } catch (e) {
      setFoto(null)
      setOkumaHatasi(e instanceof Error ? e.message : 'Fotoğraf okunamadı.')
    }
  }

  function ihbarEt() {
    if (!analiz.data || !konum) return
    gonder.mutate(
      {
        tur: 'fotograf',
        analizId: analiz.data.analizId,
        metin: not.trim() || undefined,
        ...konumAlanlari(konum),
      },
      { onSuccess: setGonderilen },
    )
  }

  if (gonderilen) {
    return (
      <div className="grid gap-3">
        <Gonderildi baslik="Fotoğraf ihbarın koordinasyona ulaştı" kimlik={gonderilen.id} zaman={gonderilen.zaman} />
        <button
          type="button"
          onClick={() => {
            sifirla()
            setFoto(null)
            setNot('')
          }}
          className={IKINCIL}
        >
          <Camera size={18} aria-hidden /> Başka fotoğraf gönder
        </button>
      </div>
    )
  }

  const sonuc = analiz.data
  const hasarli = sonuc?.tespitler.filter((t) => t.hasar) ?? []

  return (
    <div className="grid gap-4">
      <p className="text-body text-ink-2">
        Hasarlı bina, duvar ya da kolon gördüysen fotoğrafını çek. Önce modele inceletirsin; sonucu
        görüp istersen ihbar edersin. İnceleme kayıt açmaz.
      </p>

      <Adim no={1} baslik="Fotoğraf">
        <input
          id={kimlik}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => void dosyaSecildi(e.target.files?.[0])}
        />
        {foto && !sonuc ? (
          <div className="flex items-center gap-3">
            <img src={foto.veri} alt="Seçilen fotoğraf" className="h-24 w-32 shrink-0 rounded-control bg-sunken object-cover" />
            <label
              htmlFor={kimlik}
              className="flex h-10 cursor-pointer items-center gap-2 rounded-control border border-line-2 px-3 text-body text-ink hover:bg-hover"
            >
              <Camera size={18} aria-hidden /> Değiştir
            </label>
          </div>
        ) : foto ? (
          <label
            htmlFor={kimlik}
            className="flex h-10 w-fit cursor-pointer items-center gap-2 rounded-control border border-line-2 px-3 text-body text-ink hover:bg-hover"
          >
            <Camera size={18} aria-hidden /> Başka fotoğraf seç
          </label>
        ) : !foto ? (
          <label
            htmlFor={kimlik}
            className="flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-control border-2 border-dashed border-ihbar-fotograf bg-ihbar-fotograf/15 text-subtitle text-ink hover:bg-ihbar-fotograf/25"
          >
            <Camera size={28} className="text-ihbar-fotograf" aria-hidden />
            Fotoğraf çek ya da seç
          </label>
        ) : null}
        {okumaHatasi && (
          <p role="alert" className="mt-2 text-small text-crit">
            {okumaHatasi}
          </p>
        )}
      </Adim>

      <Adim no={2} baslik="Hangi model baksın?">
        <div role="radiogroup" aria-label="Model" className="grid gap-1.5 sm:grid-cols-3">
          {MODEL_SIRASI.map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={model === m}
              onClick={() => {
                setModel(m)
                analiz.reset()
              }}
              className={sn(
                'rounded-control border px-2.5 py-2 text-left transition-colors duration-150 ease-out-qm',
                model === m ? 'border-accent bg-accent-soft' : 'border-line-2 hover:bg-hover',
              )}
            >
              <span className="block text-body font-semibold text-ink">{FOTOGRAF_MODELI[m].ad}</span>
              <span className="mt-0.5 block text-small text-ink-2">{FOTOGRAF_MODELI[m].aciklama}</span>
            </button>
          ))}
        </div>
        {!sonuc && (
          <button
            type="button"
            disabled={!foto || analiz.isPending}
            onClick={() => foto && analiz.mutate({ imageBase64: foto.veri, model })}
            className={sn(BIRINCIL, 'mt-2.5')}
          >
            <Sparkle size={18} aria-hidden />
            {analiz.isPending
              ? 'Model inceliyor… (ilk seferde model yüklenir)'
              : foto
                ? 'Modele incelet'
                : 'Önce fotoğraf seç'}
          </button>
        )}
        {analiz.isError && (
          <p role="alert" className="mt-2 text-small text-crit">
            İncelenemedi: {hataMetni(analiz.error)}. Sonuç uydurulmaz; hasarı "Yazarak bildir" ile de
            iletebilirsin.
          </p>
        )}
      </Adim>

      {sonuc && foto && (
        <Adim
          no={3}
          baslik="Modelin cevabı"
          ek={
            <button
              type="button"
              onClick={() => analiz.reset()}
              className="text-small text-ink-3 hover:text-ink"
            >
              Başka modelle dene
            </button>
          }
        >
          <IsaretliFoto veri={foto.veri} en={sonuc.en} boy={sonuc.boy} tespitler={sonuc.tespitler} className="h-56" />
          <ul className="mt-2 grid gap-0.5 text-body text-ink">
            {modelCumleleri(sonuc.model, sonuc.tespitler).map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <div className="mt-1">
            <TespitListesi tespitler={sonuc.tespitler} />
          </div>
          <p className="mt-2 flex gap-2 rounded-control border border-line-2 px-2.5 py-2 text-small text-ink-2">
            <Warning size={16} className="mt-0.5 shrink-0 text-mid" aria-hidden />
            Bu bir modelin tahmini; binanın güvenli olup olmadığına karar vermez. Hasar şüphesi varsa
            binaya girme.
          </p>
        </Adim>
      )}

      {sonuc && (
        <Adim no={4} baslik="İhbar et">
          {hasarli.length === 0 && (
            <p className="mb-2 text-small text-ink-2">
              Model hasar işaretlemedi. Sen hasar görüyorsan yine de gönderebilirsin; ekip fotoğrafa
              bakar.
            </p>
          )}
          <div className="flex items-baseline justify-between gap-2">
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
            placeholder="Bina, kat, sokak; içeride kimse var mı?"
            className="mt-1 w-full resize-none rounded-control border border-line-2 bg-sunken px-2.5 py-2 text-body text-ink"
          />
          <div className="mt-2">
            <KonumSatiri konum={konum} konumAc={konumAc} not="Ekip bu konuma bakar." />
          </div>
          <p className="mt-2 text-small text-ink-3">
            Fotoğraf, modelin sonucu, notun ve konumun koordinasyon ekibine gider. Fotoğraftaki cihaz
            ve konum bilgisi silinir; kişilerin yüzü görünmesin.
          </p>
          <button
            type="button"
            disabled={gonder.isPending}
            onClick={() => (konum ? ihbarEt() : konumAc())}
            className={sn(BIRINCIL, 'mt-2.5')}
          >
            <PaperPlaneTilt size={18} aria-hidden />
            {gonder.isPending ? 'Gönderiliyor…' : konum ? 'İhbarı gönder' : 'Önce konumunu seç'}
          </button>
          {gonder.isError && (
            <p role="alert" className="mt-2 text-small text-crit">
              Gönderilemedi: {hataMetni(gonder.error)}. Bilgilerin duruyor; yeniden deneyebilirsin.
            </p>
          )}
        </Adim>
      )}
    </div>
  )
}
