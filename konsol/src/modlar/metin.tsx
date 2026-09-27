import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Amac, Bolum, HazirSecenekler, SuAn, Teknik, VeriYok } from '@/kabuk/Panel'
import { Micro, Rozet } from '@/kabuk/parcalar'
import { apiPost } from '@/veri/istemci'
import { useHarita } from '@/harita/HaritaKabugu'
import { useCozumleme, type MetinSonucu } from '@/durum/cozumlemeDurumu'
import { GelenIhbarlar } from './ihbarParcalari'

/* Metin modu: Türkçe ihbar metninden kategori, konum ve aciliyet çıkarımı.
   Model sunucuda koşar; ekran yalnız metni gönderir ve künyesiyle gösterir. */

const ORNEKLER = [
  { id: 'enkaz', etiket: 'Enkaz bildirimi' },
  { id: 'medikal', etiket: 'Tıbbi yardım' },
  { id: 'ihtiyac', etiket: 'Temel ihtiyaç' },
] as const
type OrnekId = (typeof ORNEKLER)[number]['id']

const ORNEK_METIN: Record<OrnekId, string> = {
  enkaz: 'Antakya Armutlu mahallesinde bina çökmüş, üç kişi enkaz altında, acil yardım lazım.',
  medikal: 'Defne Atatürk caddesinde yaralı var, kanaması durmuyor, ambulans gelemiyor.',
  ihtiyac: 'Sümerler mahallesinde çadırdayız, su ve battaniye bitti, iki bebek var.',
}

const ACILIYET_TONU = (n: number) => (n >= 5 ? 'crit' : n >= 4 ? 'high' : n >= 3 ? 'mid' : 'ok')

export function MetinSol() {
  const [metin, setMetin] = useState(ORNEK_METIN.enkaz)
  const [ornek, setOrnek] = useState<OrnekId | null>('enkaz')
  const qc = useQueryClient()
  const { ucus } = useHarita()
  const metinYaz = useCozumleme((d) => d.metinYaz)

  const coz = useMutation({
    mutationFn: (govde: { text: string }) => apiPost<MetinSonucu>('/api/nlp/analyze', govde),
    onSuccess: (sonuc, degisken) => {
      metinYaz(degisken.text, sonuc)
      if (sonuc.konum) ucus(sonuc.konum[1], sonuc.konum[0], 14)
      void qc.invalidateQueries({ queryKey: ['ozet'] })
    },
  })

  return (
    <Bolum baslik="Metin ihbarı" ek={<Micro>BERTurk</Micro>}>
      <Amac>
        Gelen Türkçe ihbar ne diyor? Metni kategoriye ayırır, içindeki adresi konuma çevirir ve
        aciliyetini çıkarır.
      </Amac>

      <HazirSecenekler
        etiket="Örnek ihbarlar"
        secenekler={ORNEKLER}
        secili={ornek}
        onSec={(id) => {
          setOrnek(id)
          setMetin(ORNEK_METIN[id])
        }}
      />

      <label className="mt-3 block text-micro ls-micro text-ink-3 uppercase" htmlFor="ihbar">
        İhbar metni
      </label>
      <textarea
        id="ihbar"
        rows={4}
        value={metin}
        onChange={(e) => {
          setMetin(e.target.value)
          setOrnek(null)
        }}
        className="mt-1.5 w-full rounded-control border border-line-2 bg-sunken px-2.5 py-2 text-body text-ink"
      />

      <button
        type="button"
        disabled={!metin.trim() || coz.isPending}
        onClick={() => coz.mutate({ text: metin.trim() })}
        className="mt-2 w-full rounded-control bg-accent px-3 py-2.5 text-body font-semibold text-accent-ink disabled:opacity-40"
      >
        {coz.isPending ? 'Model koşuyor…' : 'Metni çözümle'}
      </button>

      {coz.isError && (
        <p role="alert" className="mt-2 text-small text-crit">
          {coz.error instanceof Error ? coz.error.message : 'Çözümlenemedi.'}
        </p>
      )}

      <SuAn>
        {coz.data
          ? `Son çözümleme: ${coz.data.kategori}, aciliyet ${coz.data.aciliyet}/5, konum ${
              coz.data.konum_metin ?? 'bulunamadı'
            }.`
          : 'Bir metin gönder; sonuç sağ panelde künyesiyle görünür.'}
      </SuAn>

      <Teknik>
        Model sunucuda, API sürecinde tembel yüklenir; ilk istek modeli belleğe alır, sonrakiler
        hızlıdır. Konum, metindeki adres adaylarından coğrafi kodlamayla bulunur — adres yoksa
        konum boş döner, uydurulmaz.
      </Teknik>
    </Bolum>
  )
}

/** Afetzedelerin yazılı ihbarları metin modunun başında durur (J-51). */
export function MetinSag() {
  return (
    <>
      <GelenIhbarlar
        tur="metin"
        baslik="Afetzedelerden gelen yazılı ihbarlar"
        amac="Afetzedenin yazıp modele incelettiği ihbarlar: kategori, aciliyet ve metindeki adres. Seçince metnin tamamı açılır."
      />
      <KendiCozumlemem />
    </>
  )
}

function KendiCozumlemem() {
  const kayit = useCozumleme((d) => d.metin)
  const sonuc = kayit?.sonuc

  if (!sonuc) {
    return (
      <Bolum baslik="Kendi çözümlemen">
        <Amac>Soldan gönderdiğin metnin kategorisi, aciliyeti ve konumu burada görünür.</Amac>
        <div className="mt-2">
          <VeriYok ne="Çözümleme" neden="henüz metin gönderilmedi" />
        </div>
      </Bolum>
    )
  }

  return (
    <Bolum baslik="Çözümleme">
      <div className="flex items-center justify-between gap-2">
        <span className="text-subtitle text-ink">{sonuc.kategori}</span>
        <Rozet ton={ACILIYET_TONU(sonuc.aciliyet)}>aciliyet {sonuc.aciliyet}/5</Rozet>
      </div>

      <dl className="kilav-kv mt-3 gap-x-2.5 gap-y-1.5 text-small">
        <dt className="text-ink-3">Konum</dt>
        <dd className="text-ink">{sonuc.konum_metin ?? 'metinde adres bulunamadı'}</dd>
        <dt className="text-ink-3">Koordinat</dt>
        <dd className="font-mono text-ink">
          {sonuc.konum ? `${sonuc.konum[0].toFixed(5)}, ${sonuc.konum[1].toFixed(5)}` : '—'}
        </dd>
        <dt className="text-ink-3">Güven</dt>
        <dd className="text-ink">
          %{(sonuc.guven_skoru * 100).toFixed(1).replace('.', ',')}
        </dd>
      </dl>

      {sonuc.konum_adaylari?.length > 0 && (
        <>
          <p className="mt-3 text-micro ls-micro text-ink-3 uppercase">Adres adayları</p>
          <ul className="mt-1.5">
            {sonuc.konum_adaylari.slice(0, 4).map((a) => (
              <li key={a} className="border-t border-line py-1.5 text-small text-ink-2">
                {a}
              </li>
            ))}
          </ul>
        </>
      )}

      <Teknik>
        Kategori ve güven doğrudan modelin çıktısı; aciliyet kural tabanlı türetilir. Sekiz model
        karşılaştırmasında BERTurk mikro-F₁ 0,82 ölçüldü, ancak seyrek kategorilerde klasik taban
        çizgilerinin altında kalıyor — bu ekrandaki sonuç da o sınırın içinde okunmalı.
      </Teknik>
    </Bolum>
  )
}
