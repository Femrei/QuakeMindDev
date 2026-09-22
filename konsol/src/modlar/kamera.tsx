import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Amac, Bolum, HazirSecenekler, SuAn, Teknik, VeriYok } from '@/kabuk/Panel'
import { Micro, Rozet } from '@/kabuk/parcalar'
import { apiPost } from '@/veri/istemci'
import { useKameraCozumleme, type KameraSonucu } from '@/durum/cozumlemeDurumu'
import { sayi } from '@/lib/bicim'
import { GelenIhbarlar } from './ihbarParcalari'

/* Kamera modu: saha fotoğrafında çatlak ve yapı hasarı tespiti (YOLO).
   Görsel sunucuya gönderilir, model orada koşar; sonuç kutularıyla döner. */

const MODELLER = [
  { id: 'hybrid', etiket: 'İkisi birden' },
  { id: 'catlak', etiket: 'Yalnız çatlak' },
  { id: 'bina', etiket: 'Yalnız yapı hasarı' },
] as const
type ModelId = (typeof MODELLER)[number]['id']

export function KameraSol() {
  const [model, setModel] = useState<ModelId>('hybrid')
  const [dosyaAdi, setDosyaAdi] = useState<string | null>(null)
  const girdi = useRef<HTMLInputElement>(null)
  const sonucYaz = useKameraCozumleme((d) => d.yaz)

  const coz = useMutation({
    mutationFn: (govde: { imageBase64: string; modelType: string }) =>
      apiPost<KameraSonucu>('/api/camera/analyze', govde),
    onSuccess: (sonuc) => sonucYaz(sonuc),
  })

  function dosyaSec(dosya: File | undefined) {
    if (!dosya) return
    setDosyaAdi(dosya.name)
    const okuyucu = new FileReader()
    okuyucu.onload = () => {
      const ham = String(okuyucu.result)
      coz.mutate({ imageBase64: ham, modelType: model })
    }
    okuyucu.readAsDataURL(dosya)
  }

  return (
    <Bolum baslik="Kamera tespiti" ek={<Micro>YOLO</Micro>}>
      <Amac>
        Sahadan gelen fotoğrafta ne var? Çatlak ve yapı hasarını işaretler, kritik olanı ayırır.
      </Amac>

      <HazirSecenekler etiket="Model seçimi" secenekler={MODELLER} secili={model} onSec={setModel} />

      <input
        ref={girdi}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => dosyaSec(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => girdi.current?.click()}
        disabled={coz.isPending}
        className="mt-3 w-full rounded-control bg-accent px-3 py-2.5 text-body font-semibold text-accent-ink disabled:opacity-40"
      >
        {coz.isPending ? 'Model koşuyor…' : 'Fotoğraf seç'}
      </button>

      {dosyaAdi && <p className="mt-2 text-small text-ink-3">Dosya: {dosyaAdi}</p>}
      {coz.isError && (
        <p role="alert" className="mt-2 text-small text-crit">
          {coz.error instanceof Error ? coz.error.message : 'Çözümlenemedi.'}
        </p>
      )}

      <SuAn>
        {coz.data
          ? `${MODELLER.find((m) => m.id === model)?.etiket} koşuldu: ${sayi(
              coz.data.detections?.length ?? 0,
            )} tespit.`
          : 'Bir fotoğraf seç; tespitler sağ panelde görünür.'}
      </SuAn>

      <Teknik>
        Güven eşiği bilinçli olarak duyarlılık lehine ayarlıdır: afet ortamında gözden kaçan
        hasarın maliyeti yanlış alarmdan yüksektir. Modelin mAP değeri henüz ölçülmedi, bu yüzden
        buradaki sayılar başarım kanıtı değildir.
      </Teknik>
    </Bolum>
  )
}

/** Afetzedelerin gönderdiği hasar fotoğrafları kamera modunun başında durur
    (J-51): ekip yeni fotoğrafı burada görür, sonra kendi fotoğrafını da
    inceletebilir. */
export function KameraSag() {
  return (
    <>
      <GelenIhbarlar
        tur="fotograf"
        baslik="Afetzedelerden gelen fotoğraflar"
        amac="Afetzedenin seçtiği modelle incelenip ihbar edilen hasar fotoğrafları. Seçince fotoğraf, işaretler ve konum açılır."
      />
      <KendiTespitlerim />
    </>
  )
}

function KendiTespitlerim() {
  const sonuc = useKameraCozumleme((d) => d.sonuc)

  if (!sonuc) {
    return (
      <Bolum baslik="Kendi fotoğrafın">
        <Amac>Soldan seçtiğin fotoğraftaki tespitler ve işaretlenmiş görsel burada görünür.</Amac>
        <div className="mt-2">
          <VeriYok ne="Tespit" neden="henüz fotoğraf gönderilmedi" />
        </div>
      </Bolum>
    )
  }

  const tespitler = sonuc.detections ?? []
  return (
    <>
      <Bolum baslik="Tespitler" ek={<Micro>{sayi(tespitler.length)} kutu</Micro>}>
        {sonuc.annotatedImage && (
          <img
            src={sonuc.annotatedImage}
            alt="Model tespitleriyle işaretlenmiş fotoğraf"
            className="w-full rounded-control border border-line"
          />
        )}

        {tespitler.length === 0 ? (
          <p className="mt-2 text-small text-ink-2">
            Model bu fotoğrafta tespit bulamadı. Bu, hasar yok demek değil: eşiğin altında kalan
            hasar işaretlenmez.
          </p>
        ) : (
          <ul className="mt-2">
            {tespitler.slice(0, 12).map((t, i) => (
              <li
                key={`${t.label}-${i}`}
                className="flex items-baseline justify-between gap-2 border-b border-line py-1.5 last:border-b-0"
              >
                <span className="text-small text-ink">{t.label}</span>
                <span className="flex items-center gap-2">
                  <span className="font-mono text-small text-ink-3">
                    %{(t.confidence ?? 0).toFixed(0)}
                  </span>
                  {t.severity === 'CRITICAL' && <Rozet ton="crit">kritik</Rozet>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Bolum>

      <Bolum baslik="Künye">
        <p className="text-small text-ink-2">{sonuc.advice}</p>
        <Teknik>
          Model: {sonuc.activeModels?.join(', ') || '—'}. Sonuç, gönderilen fotoğrafın kendisinden
          çıkar; konum bilgisi fotoğrafla birlikte gönderilmediyse tespit haritaya düşmez.
        </Teknik>
      </Bolum>
    </>
  )
}
