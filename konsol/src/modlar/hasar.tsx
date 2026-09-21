import { useEffect, useMemo, useState } from 'react'
import { Amac, Bolum, HazirSecenekler, InceAyar, SuAn, Teknik, VeriYok } from '@/kabuk/Panel'
import { Chip, Kaydirici, Micro, Rozet } from '@/kabuk/parcalar'
import { sonIsSec, useIsler } from '@/durum/islerDurumu'
import { useCanliAkisDurumu } from '@/canli/canliAkis'
import { useHarita } from '@/harita/HaritaKabugu'
import {
  BOLGELER,
  KAYNAKLAR,
  analizBaslat,
  depremOncesiSurum,
  depremSonrasiSurum,
  useAnalizSegmentleri,
  useOamArama,
  useWaybackSurumleri,
  type AnalizSonucu,
  type BolgeId,
  type KaynakId,
  type OamGoruntu,
} from '@/veri/analiz'
import { kutuCevresi, useSecim, type SecimModu } from '@/durum/secimDurumu'
import { gunMetni, sayi, saat } from '@/lib/bicim'
import { sn } from '@/lib/sinif'

/* Hasar analizi modu: uydu görüntüsünden yol kapanmalarını çıkaran modelin
   koşturulduğu ekran. Model istek yolunda koşmaz; iş kuyruğa girer (kural 3). */

const HAZIRLAR = [
  {
    id: 'hizli',
    etiket: 'Hızlı tarama',
    aciklama: 'küçük alan, kaba sonuç',
    ayar: { radiusKm: 1.5, threshold: 0.45, postProcessLevel: 1, damageBooster: 3.5 },
  },
  {
    id: 'standart',
    etiket: 'Standart analiz',
    aciklama: 'varsayılan alan ve eşik',
    ayar: { radiusKm: 2.5, threshold: 0.4, postProcessLevel: 2, damageBooster: 3.5 },
  },
  {
    id: 'genis',
    etiket: 'Geniş alan',
    aciklama: 'daha büyük bölge, daha uzun sürer',
    ayar: { radiusKm: 4, threshold: 0.4, postProcessLevel: 2, damageBooster: 3.5 },
  },
  {
    id: 'hassas',
    etiket: 'Hassas tarama',
    aciklama: 'düşük eşik, daha çok hasar işaretler',
    ayar: { radiusKm: 2.5, threshold: 0.28, postProcessLevel: 3, damageBooster: 4.5 },
  },
] as const

type HazirId = (typeof HAZIRLAR)[number]['id']

type Ayar = { radiusKm: number; threshold: number; postProcessLevel: number; damageBooster: number }

export function HasarSol() {
  const [bolge, setBolge] = useState<BolgeId>('antakya')
  // Çalışma alanımız 6 Şubat 2023 depremleri: varsayılan kaynak tarihli arşiv,
  // varsayılan tarih de depremden sonraki ilk görüntü.
  const [kaynak, setKaynak] = useState<KaynakId>('esri')
  const [waybackId, setWaybackId] = useState<string | null>(null)
  const [hazir, setHazir] = useState<HazirId | null>('standart')
  const [ayar, setAyar] = useState<Ayar>({ ...HAZIRLAR[1].ayar })
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)

  // OpenAerialMap: tarih aralığı varsayılanı 6 Şubat 2023 depremlerinin ilk üç haftası.
  const [oamBaslangic, setOamBaslangic] = useState('2023-02-06')
  const [oamBitis, setOamBitis] = useState('2023-02-28')
  const [oamArandi, setOamArandi] = useState(false)
  const [oamSecili, setOamSecili] = useState<OamGoruntu | null>(null)

  const secimModu = useSecim((d) => d.modu)
  const moduSec = useSecim((d) => d.moduSec)
  const kutu = useSecim((d) => d.kutu)
  const cokgen = useSecim((d) => d.cokgen)
  const merkez = useSecim((d) => d.merkez)
  const kutuSec = useSecim((d) => d.kutuSec)
  const secimTemizle = useSecim((d) => d.temizle)
  const ciziyor = useSecim((d) => d.ciziyor)
  const taslakKose = useSecim((d) => d.taslak?.nokta?.length ?? 0)
  const cizimiBitir = useSecim((d) => d.cizimiBitir)
  const sonKoseyiSil = useSecim((d) => d.sonKoseyiSil)
  const cizimiIptal = useSecim((d) => d.cizimiIptal)

  const surumler = useWaybackSurumleri()
  const isBasladi = useIsler((d) => d.isBasladi)
  const akis = useCanliAkisDurumu((d) => d.durum)
  const { ucus } = useHarita()

  const bolgeBilgi = BOLGELER.find((b) => b.id === bolge)!

  const tarihler = useMemo(() => {
    const liste = surumler.data ?? []
    return {
      liste,
      sonrasi: depremSonrasiSurum(liste),
      oncesi: depremOncesiSurum(liste),
      guncel: liste[0],
    }
  }, [surumler.data])

  // Liste gelince varsayılanı seç: depremden sonraki ilk görüntü.
  useEffect(() => {
    if (waybackId === null && tarihler.sonrasi) setWaybackId(tarihler.sonrasi.id)
  }, [waybackId, tarihler.sonrasi])

  const seciliSurum = tarihler.liste.find((v) => v.id === waybackId)
  const tarihliKaynak = kaynak === 'esri'
  const oamKaynak = kaynak === 'oam'

  // Analiz merkezi: seçilen nokta ya da kutunun ortası, yoksa şehir merkezi.
  const analizMerkezi: [number, number] = kutu
    ? [(kutu[0] + kutu[2]) / 2, (kutu[1] + kutu[3]) / 2]
    : (merkez ?? [bolgeBilgi.lon, bolgeBilgi.lat])

  const oam = useOamArama({
    lat: analizMerkezi[1],
    lon: analizMerkezi[0],
    baslangic: oamBaslangic,
    bitis: oamBitis,
    kutu: kutu ?? null,
    aktif: oamKaynak && oamArandi,
  })

  const olcu = kutu ? kutuCevresi(kutu) : null

  function hazirSec(id: HazirId) {
    const h = HAZIRLAR.find((x) => x.id === id)!
    setHazir(id)
    setAyar({ ...h.ayar })
  }

  function ayarDegistir(yama: Partial<Ayar>) {
    setAyar((a) => ({ ...a, ...yama }))
    setHazir(null)
  }

  async function baslat() {
    setHata(null)
    setGonderiliyor(true)
    try {
      const { analysisId } = await analizBaslat({
        city: bolgeBilgi.ad,
        latitude: analizMerkezi[1],
        longitude: analizMerkezi[0],
        source: kaynak,
        threshold: ayar.threshold,
        damageBooster: ayar.damageBooster,
        postProcessLevel: ayar.postProcessLevel,
        radiusKm: ayar.radiusKm,
        waybackId: tarihliKaynak ? (waybackId ?? undefined) : undefined,
        oamTileUrl: oamKaynak ? (oamSecili?.tms_url ?? undefined) : undefined,
        // Alan çizildiyse merkez+yarıçap yerine kutu gönderilir.
        bboxWest: kutu?.[0],
        bboxSouth: kutu?.[1],
        bboxEast: kutu?.[2],
        bboxNorth: kutu?.[3],
      })
      isBasladi(analysisId, 'hasar-analizi', 'Sıraya alındı.', {
        bolge: bolgeBilgi.ad,
        kaynak: oamSecili
          ? `OpenAerialMap · ${oamSecili.provider}`
          : (KAYNAKLAR.find((k) => k.id === kaynak)?.ad ?? kaynak),
        goruntuTarihi: tarihliKaynak
          ? seciliSurum?.date
          : oamSecili
            ? oamSecili.date.slice(0, 10)
            : undefined,
        esik: ayar.threshold,
        sonIsleme: ayar.postProcessLevel,
        yaricapKm: ayar.radiusKm,
      })
      ucus(bolgeBilgi.lon, bolgeBilgi.lat, 13)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Analiz başlatılamadı.')
    } finally {
      setGonderiliyor(false)
    }
  }

  return (
    <Bolum baslik="Uydudan hasar analizi" ek={<Micro>{bolgeBilgi.ad}</Micro>}>
      {/* 1 — amaç */}
      <Amac>
        Bu bölgede hangi yollar kapandı? Seçtiğin alanın uydu görüntüsü modelden geçer, hasarlı
        alanlar yol ağının üstüne kapanma olarak yazılır; rota bundan sonra o ağda hesaplanır.
      </Amac>

      {/* 2 — hazır seçenekler */}
      <HazirSecenekler
        etiket="Hazır analiz ayarları"
        secenekler={HAZIRLAR.map((h) => ({ id: h.id, etiket: h.etiket }))}
        secili={hazir}
        onSec={hazirSec}
      />

      {/* Konum: şehir merkezi mi, haritada seçilen alan mı? */}
      <div className="mt-3">
        <Micro>Analiz alanı</Micro>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {(
            [
              ['sehir', 'Şehir merkezi'],
              ['nokta', 'Nokta seç'],
              ['alan', 'Alan çiz'],
              ['cokgen', 'Çokgen çiz'],
            ] as Array<[SecimModu, string]>
          ).map(([id, etiket]) => (
            <Chip key={id} secili={secimModu === id} onClick={() => moduSec(id)}>
              {etiket}
            </Chip>
          ))}
        </div>

        <p className="mt-1.5 text-small text-ink-3">
          {secimModu === 'sehir' &&
            'Şehir merkezinden itibaren aşağıdaki yarıçap kadar alan analiz edilir.'}
          {secimModu === 'nokta' && 'Haritaya tıkla: analiz merkezi oraya taşınır.'}
          {secimModu === 'alan' && 'Haritada basılı tutup sürükle: dikdörtgen alan çizilir.'}
          {secimModu === 'cokgen' &&
            'Her tıklama bir köşe. Bitir düğmesi, çift tıklama ya da Enter kapatır; Esc vazgeçer.'}
        </p>

        {secimModu === 'cokgen' && ciziyor && (
          <div className="mt-2 rounded-control border border-accent bg-accent-soft px-2.5 py-2">
            <p className="text-small text-ink">
              Çizim sürüyor · {taslakKose} köşe
              {taslakKose < 3 ? ' (en az 3 köşe gerekir)' : ''}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={cizimiBitir}
                disabled={taslakKose < 3}
                className="rounded-control bg-accent px-2.5 py-1.5 text-small font-semibold text-accent-ink disabled:opacity-40"
              >
                Bitir
              </button>
              <button
                type="button"
                onClick={sonKoseyiSil}
                className="rounded-control border border-line-2 px-2.5 py-1.5 text-small text-ink-2 hover:bg-hover hover:text-ink"
              >
                Son noktayı sil
              </button>
              <button
                type="button"
                onClick={cizimiIptal}
                className="rounded-control border border-line-2 px-2.5 py-1.5 text-small text-ink-2 hover:bg-hover hover:text-ink"
              >
                Vazgeç
              </button>
            </div>
          </div>
        )}

        {olcu && (
          <div className="mt-2 flex items-baseline justify-between gap-2 rounded-control border border-line-2 bg-sunken px-2.5 py-2">
            <span className="text-small text-ink">
              {cokgen ? 'Çokgen' : 'Dikdörtgen'} ·{' '}
              <span className="font-mono">
                {olcu.genislikKm.toFixed(1).replace('.', ',')} ×{' '}
                {olcu.yukseklikKm.toFixed(1).replace('.', ',')} km
              </span>
            </span>
            <button type="button" onClick={secimTemizle} className="text-small text-accent">
              Temizle
            </button>
          </div>
        )}

        {cokgen && (
          <p className="mt-1.5 text-small text-ink-3">
            Çıkarım ucu bugün yalnız dikdörtgen alan kabul ediyor; çokgenin sınır kutusu
            analiz edilir, köşelerdeki fazlalık da hesaba girer.
          </p>
        )}

        <label className="mt-3 block text-micro ls-micro text-ink-3 uppercase" htmlFor="bolge">
          Bölge
        </label>
        <select
          id="bolge"
          value={bolge}
          onChange={(e) => setBolge(e.target.value as BolgeId)}
          className="mt-1.5 w-full rounded-control border border-line-2 bg-sunken px-2.5 py-2 text-body text-ink"
        >
          {BOLGELER.map((b) => (
            <option key={b.id} value={b.id}>
              {b.ad}
            </option>
          ))}
        </select>

        <label className="mt-3 block text-micro ls-micro text-ink-3 uppercase" htmlFor="kaynak">
          Görüntü kaynağı
        </label>
        <select
          id="kaynak"
          value={kaynak}
          onChange={(e) => setKaynak(e.target.value as KaynakId)}
          className="mt-1.5 w-full rounded-control border border-line-2 bg-sunken px-2.5 py-2 text-body text-ink"
        >
          {KAYNAKLAR.map((k) => (
            <option key={k.id} value={k.id}>
              {k.ad}
            </option>
          ))}
        </select>

        {tarihliKaynak && (
          <div className="mt-3">
            <Micro>Görüntü tarihi</Micro>
            {surumler.isLoading && (
              <p className="mt-1.5 text-small text-ink-3">Arşiv sürümleri alınıyor…</p>
            )}
            {surumler.isError && (
              <p className="mt-1.5 text-small text-ink-3">
                Arşiv sürümleri alınamadı — uç bağlı değil. Tarih seçilemiyor.
              </p>
            )}
            {tarihler.liste.length > 0 && (
              <>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {[
                    { s: tarihler.sonrasi, etiket: 'Deprem sonrası' },
                    { s: tarihler.oncesi, etiket: 'Deprem öncesi' },
                    { s: tarihler.guncel, etiket: 'En güncel' },
                  ].map(
                    ({ s: surum, etiket }) =>
                      surum && (
                        <Chip
                          key={etiket}
                          secili={waybackId === surum.id}
                          onClick={() => setWaybackId(surum.id)}
                        >
                          {etiket}
                        </Chip>
                      ),
                  )}
                </div>

                <select
                  aria-label="Arşiv görüntü tarihi"
                  value={waybackId ?? ''}
                  onChange={(e) => setWaybackId(e.target.value)}
                  className="mt-1.5 w-full rounded-control border border-line-2 bg-sunken px-2.5 py-2 text-body text-ink"
                >
                  {tarihler.liste.map((v) => (
                    <option key={v.id} value={v.id}>
                      {gunMetni(v.date)}
                    </option>
                  ))}
                </select>

                <p className="mt-1.5 text-small text-ink-3">
                  {tarihler.liste.length} arşiv sürümü var. 6 Şubat 2023 depremlerinden sonraki ilk
                  görüntü{' '}
                  {tarihler.sonrasi ? gunMetni(tarihler.sonrasi.date) : 'bulunamadı'}; hasarı bu
                  görüntüde ararız.
                </p>
              </>
            )}
          </div>
        )}

        {oamKaynak && (
          <div className="mt-3">
            <Micro>Görüntü tarih aralığı</Micro>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              <input
                type="date"
                aria-label="Başlangıç tarihi"
                value={oamBaslangic}
                onChange={(e) => {
                  setOamBaslangic(e.target.value)
                  setOamArandi(false)
                }}
                className="rounded-control border border-line-2 bg-sunken px-2.5 py-2 text-body text-ink"
              />
              <input
                type="date"
                aria-label="Bitiş tarihi"
                value={oamBitis}
                onChange={(e) => {
                  setOamBitis(e.target.value)
                  setOamArandi(false)
                }}
                className="rounded-control border border-line-2 bg-sunken px-2.5 py-2 text-body text-ink"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setOamArandi(true)
                void oam.refetch()
              }}
              className="mt-1.5 w-full rounded-control border border-line-2 px-3 py-2 text-body text-ink-2 hover:bg-hover hover:text-ink"
            >
              Görüntü ara
            </button>

            {oamArandi && oam.isFetching && (
              <p className="mt-1.5 text-small text-ink-3">Görüntüler aranıyor…</p>
            )}
            {oamArandi && oam.isError && (
              <p className="mt-1.5 text-small text-ink-3">
                Arama yapılamadı — OpenAerialMap ucu yanıt vermedi.
              </p>
            )}
            {oamArandi && oam.data?.length === 0 && (
              <p className="mt-1.5 text-small text-ink-3">
                Bu tarih aralığında ve bu alanda görüntü yok. Aralığı genişlet ya da alanı
                büyüt.
              </p>
            )}

            {!!oam.data?.length && (
              <>
                <div className="mt-2 overflow-hidden rounded-control border border-line-2">
                  {oam.data.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        setOamSecili(g)
                        kutuSec(g.bbox)
                        moduSec('alan')
                        const [b, gu, d, k] = g.bbox
                        ucus((b + d) / 2, (gu + k) / 2, 15)
                      }}
                      className={sn(
                        'block w-full border-b border-line px-2.5 py-2 text-left last:border-b-0',
                        oamSecili?.id === g.id ? 'bg-accent-soft' : 'hover:bg-hover',
                      )}
                    >
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-small text-ink">{g.provider}</span>
                        <span className="font-mono text-small text-ink-3">
                          {gunMetni(g.date.slice(0, 10))}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-small text-ink-2">{g.title}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-small text-ink-3">
                  {oam.data.length} görüntü bulundu. Seçtiğinde analiz alanı o görüntünün
                  kapsadığı kutuya oturur; haritadan değiştirebilirsin.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={baslat}
        disabled={gonderiliyor}
        className="mt-3 w-full rounded-control bg-accent px-3 py-2.5 text-body font-semibold text-accent-ink disabled:opacity-50"
      >
        {gonderiliyor ? 'İş kuyruğa veriliyor…' : 'Analizi başlat'}
      </button>

      {hata && (
        <p role="alert" className="mt-2 text-small text-crit">
          {hata}
        </p>
      )}

      {akis !== 'bagli' && (
        <p className="mt-2 text-small text-ink-3">
          Canlı akış bağlı değil: analiz başlasa bile ilerleme buraya düşmez.
        </p>
      )}

      {/* 3 — ince ayar en altta */}
      <InceAyar baslik="İnce ayar">
        <Satir
          etiket="Alan yarıçapı"
          deger={`${ayar.radiusKm.toFixed(1).replace('.', ',')} km`}
          kaydirici={
            <Kaydirici
              etiket="Alan yarıçapı (km)"
              deger={ayar.radiusKm * 10}
              enAz={5}
              enCok={60}
              adim={5}
              degerEtiketi={`${ayar.radiusKm.toFixed(1).replace('.', ',')}`}
              onDegis={(v) => ayarDegistir({ radiusKm: v / 10 })}
            />
          }
          not={
            olcu
              ? 'Haritadan alan seçili olduğu için yarıçap kullanılmıyor; seçimi temizlersen geri devreye girer.'
              : 'Analiz edilen kare alanın yarı genişliği. Büyüdükçe süre artar.'
          }
        />
        <Satir
          etiket="Hasar eşiği"
          deger={ayar.threshold.toFixed(2).replace('.', ',')}
          kaydirici={
            <Kaydirici
              etiket="Hasar eşiği"
              deger={ayar.threshold * 100}
              enAz={15}
              enCok={80}
              adim={1}
              degerEtiketi={ayar.threshold.toFixed(2).replace('.', ',')}
              onDegis={(v) => ayarDegistir({ threshold: v / 100 })}
            />
          }
          not="Düşük eşik daha çok yeri hasarlı işaretler: gözden kaçan azalır, yanlış alarm artar."
        />
        <Satir
          etiket="Son işleme"
          deger={`seviye ${ayar.postProcessLevel}`}
          kaydirici={
            <Kaydirici
              etiket="Son işleme seviyesi"
              deger={ayar.postProcessLevel}
              enAz={1}
              enCok={3}
              adim={1}
              degerEtiketi={String(ayar.postProcessLevel)}
              onDegis={(v) => ayarDegistir({ postProcessLevel: v })}
            />
          }
          not="Maskedeki küçük lekeleri temizler. Yükseldikçe sonuç sadeleşir, ufak hasar kaybolabilir."
        />
      </InceAyar>

      {/* 4 — şu an ne görüyorum */}
      <SuAn>
        {olcu
          ? `Haritada seçilen ${olcu.genislikKm.toFixed(1).replace('.', ',')} × ${olcu.yukseklikKm
              .toFixed(1)
              .replace('.', ',')} km'lik alan`
          : `${bolgeBilgi.ad} merkezli ${ayar.radiusKm.toFixed(1).replace('.', ',')} km yarıçaplı alan`}
        ,{' '}
        {oamSecili
          ? `${gunMetni(oamSecili.date.slice(0, 10))} tarihli ${oamSecili.provider} görüntüsü`
          : tarihliKaynak && seciliSurum
            ? `${gunMetni(seciliSurum.date)} tarihli arşiv görüntüsü`
            : KAYNAKLAR.find((k) => k.id === kaynak)?.ad.toLocaleLowerCase('tr')}{' '}
        ile, eşik{' '}
        {ayar.threshold.toFixed(2).replace('.', ',')} ve son işleme seviye {ayar.postProcessLevel}{' '}
        ayarıyla analiz edilecek.
      </SuAn>

      {/* 5 — teknik not */}
      <Teknik>
        Model bu istekte koşmaz: istek kuyruğa girer (HTTP 202) ve ayrı bir işçi süreçte işlenir.
        İlerleme canlı akıştaki “iş durumu” mesajlarıyla gelir; sonuç bittiğinde tek istekle
        indirilir. Ekran hiçbir ucu yoklamaz.
      </Teknik>
    </Bolum>
  )
}

function Satir({
  etiket,
  deger,
  kaydirici,
  not,
}: {
  etiket: string
  deger: string
  kaydirici: React.ReactNode
  not: string
}) {
  return (
    <div className="border-t border-line py-2 first:border-t-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-small text-ink">{etiket}</span>
        <span className="font-mono text-small text-ink-2">{deger}</span>
      </div>
      {kaydirici}
      <p className="mt-1 text-small text-ink-3">{not}</p>
    </div>
  )
}

export function HasarSag() {
  const is = useIsler(sonIsSec)
  const sonuc = is?.sonuc as AnalizSonucu | undefined
  const surumler = useWaybackSurumleri()
  const segmentler = useAnalizSegmentleri(
    is?.durum === 'bitti' && is.isTipi === 'hasar-analizi' ? is.id : null,
  )

  // Künye önce sonucun kendisinden okunur (koşumun gerçekte kullandığı görüntü),
  // yoksa isteği gönderirken kaydettiğimiz bilgiye düşülür.
  const surumTarihi =
    sonuc?.waybackId != null
      ? surumler.data?.find((v) => v.id === String(sonuc.waybackId))?.date
      : undefined
  const goruntuTarihi = surumTarihi ?? is?.kunye?.goruntuTarihi

  if (!is) {
    return (
      <Bolum baslik="Analiz">
        <Amac>Başlattığın analizin ilerlemesi ve sonucu burada görünür.</Amac>
        <div className="mt-2">
          <VeriYok ne="Analiz" neden="henüz bir iş başlatılmadı" />
        </div>
      </Bolum>
    )
  }

  const ton =
    is.durum === 'hata' ? 'crit' : is.durum === 'bitti' ? 'ok' : ('mid' as 'crit' | 'ok' | 'mid')
  const etiket =
    is.durum === 'kuyrukta'
      ? 'Sırada'
      : is.durum === 'calisiyor'
        ? 'Çalışıyor'
        : is.durum === 'bitti'
          ? 'Bitti'
          : 'Hata'

  return (
    <>
      <Bolum
        baslik="Analiz"
        ek={<span className="font-mono text-small text-ink-3">{saat(is.baslangic)}</span>}
      >
        <div className="flex items-center justify-between gap-2">
          <Rozet ton={ton}>{etiket}</Rozet>
          <span className="font-mono text-small text-ink-2">{is.ilerleme}%</span>
        </div>

        <div className="mt-2 h-1.5 overflow-hidden rounded-badge bg-sunken">
          <div
            className={sn(
              'h-full rounded-badge transition-all duration-200 ease-out-qm',
              is.durum === 'hata' ? 'bg-crit' : 'bg-accent',
            )}
            style={{ width: `${Math.max(2, Math.min(100, is.ilerleme))}%` }}
          />
        </div>

        <p className="mt-2 text-small text-ink-2">{is.hata ?? is.mesaj}</p>
        <p className="mt-1 font-mono text-small text-ink-3">iş: {is.id.slice(0, 8)}</p>
      </Bolum>

      {sonuc && sonuc.status === 'done' && (
        <Bolum baslik="Sonuç">
          <div className="kilav-kv gap-x-2.5 gap-y-1.5 text-small">
            <dt className="text-ink-3">Kapalı yol</dt>
            <dd className="text-ink">
              {sayi(sonuc.blockedRoads ?? 0)} segment
              {sonuc.blockedRoadPct != null &&
                ` · %${(sonuc.blockedRoadPct * 100).toFixed(1).replace('.', ',')}`}
            </dd>
            <dt className="text-ink-3">Açık yol</dt>
            <dd className="text-ink">{sayi(sonuc.openRoads ?? 0)} segment</dd>
            <dt className="text-ink-3">Hasar oranı</dt>
            <dd className="text-ink">
              {sonuc.damageRate != null
                ? `%${(sonuc.damageRate * 100).toFixed(1).replace('.', ',')}`
                : '—'}
            </dd>
          </div>

          {sonuc.recommendedAction && (
            <p className="mt-3 text-body text-ink-2">{sonuc.recommendedAction}</p>
          )}

          {/* Haritada ne görünüyor: renk tek başına anlam taşımaz, sayısı da yazar. */}
          <p className="mt-3 flex items-center gap-2 text-small text-ink-2">
            <span aria-hidden className="h-0.5 w-4 shrink-0 rounded-badge bg-crit" />
            {segmentler.isLoading
              ? 'Yol geometrisi indiriliyor…'
              : segmentler.data
                ? `Haritada ${sayi(segmentler.data.kapali.length)} kapalı segment kırmızı, ${sayi(
                    segmentler.data.acik.length,
                  )} açık segment sönük çiziliyor.`
                : 'Yol geometrisi alınamadı; harita yalnız sayıları gösteriyor.'}
          </p>

          {/* Kural 1: sonucun künyesi sonucun yanında durur. */}
          <p className="mt-3 text-small text-ink-2">
            <span className="text-ink">Görüntü:</span>{' '}
            {sonuc.imagerySource === 'esri' && goruntuTarihi
              ? `${gunMetni(goruntuTarihi)} tarihli Esri Wayback arşiv görüntüsü`
              : (is.kunye?.kaynak ?? sonuc.imageryLabel ?? 'kaynak bilgisi yok')}
            {goruntuTarihi && sonuc.imagerySource !== 'esri'
              ? ` · ${gunMetni(goruntuTarihi)}`
              : ''}
            {is.kunye ? ` · ${is.kunye.yaricapKm.toFixed(1).replace('.', ',')} km yarıçap` : ''}
          </p>

          <Teknik>
            Kaynak künyesi — bölge: {sonuc.city ?? '—'} · eşik:{' '}
            {sonuc.threshold?.toFixed(2).replace('.', ',') ?? '—'} · hasar çarpanı:{' '}
            {sonuc.damageBooster?.toFixed(1).replace('.', ',') ?? '—'} · kapanma kuralı:{' '}
            {sonuc.closureRule === 'radius'
              ? `yarıçap ${sonuc.blockageRadiusM} m`
              : 'yol pikseli üzerinde hasar'}
            .
          </Teknik>
        </Bolum>
      )}
    </>
  )
}
