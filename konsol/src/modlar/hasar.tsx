import { useEffect, useMemo, useState } from 'react'
import { Amac, Bolum, HazirSecenekler, InceAyar, SuAn, Teknik, VeriYok } from '@/kabuk/Panel'
import { Chip, Kaydirici, Micro, Rozet } from '@/kabuk/parcalar'
import { sonIsSec, useIsler, type IsKunyesi } from '@/durum/islerDurumu'
import { useCanliAkisDurumu } from '@/canli/canliAkis'
import { useHarita } from '@/harita/HaritaKabugu'
import {
  BOLGELER,
  KAYNAKLAR,
  analizBaslat,
  ilkOlaySonrasi,
  kapsamaOrani,
  merkezKutusu,
  oamOnerisi,
  olaydanGun,
  sonOlayOncesi,
  surumunGoruntusu,
  useAnalizSegmentleri,
  useOamArama,
  useUyduModeli,
  useWaybackGoruntuGecmisi,
  useWaybackSurumleri,
  type AnalizSonucu,
  type BolgeId,
  type KaynakId,
  type OamGoruntu,
  type WaybackGoruntu,
  type WaybackGoruntuGecmisi,
} from '@/veri/analiz'
import { kutuCevresi, useSecim, type Kutu, type SecimModu } from '@/durum/secimDurumu'
import { gunMetni, sayi, saat } from '@/lib/bicim'
import { sn } from '@/lib/sinif'

/* Hasar analizi modu: uydu görüntüsünden yol kapanmalarını çıkaran modelin
   koşturulduğu ekran. Model istek yolunda koşmaz; iş kuyruğa girer (kural 3). */

/* Hazır ayarlar alanı seçer. Eşik ve son işleme modelin künyesinden gelir
   (J-36): model hangi ayarla ölçüldüyse üründe de onunla koşar. Eskiden her
   hazır ayar kendi sabit eşiğini taşıyordu; yeni bir model gelince bunlar
   modelin ölçüldüğü ayardan sessizce ayrışırdı. Hassas tarama yalnız eşiği
   modelinkinin %70'ine indirir. */
const HAZIRLAR = [
  { id: 'hizli', etiket: 'Hızlı tarama', aciklama: 'küçük alan', radiusKm: 1.5, esikCarpani: 1 },
  {
    id: 'standart',
    etiket: 'Standart analiz',
    aciklama: 'varsayılan alan, modelin kendi eşiği',
    radiusKm: 2.5,
    esikCarpani: 1,
  },
  {
    id: 'genis',
    etiket: 'Geniş alan',
    aciklama: 'daha büyük bölge, daha uzun sürer',
    radiusKm: 4,
    esikCarpani: 1,
  },
  {
    id: 'hassas',
    etiket: 'Hassas tarama',
    aciklama: "eşik modelinkinin %70'i: daha çok hasar işaretler",
    radiusKm: 2.5,
    esikCarpani: 0.7,
  },
] as const

type HazirId = (typeof HAZIRLAR)[number]['id']

/** Karar ayarlarında null = modelin künyesindeki değer. */
type Ayar = {
  radiusKm: number
  esikCarpani: number
  threshold: number | null
  postProcessLevel: number | null
}

export function HasarSol() {
  const [bolge, setBolge] = useState<BolgeId>('antakya')
  // Varsayılan kaynak OpenAerialMap (J-35): Wayback'in 2023 sürümleri deprem
  // bölgesinde deprem ÖNCESİ görüntüyü gösteriyor (Antakya'da 2021 çekimi);
  // OAM'daki Maxar Open Data depremden günler sonra çekildi.
  const [kaynak, setKaynak] = useState<KaynakId>('oam')
  const [waybackId, setWaybackId] = useState<string | null>(null)
  // Elle seçilmediyse varsayılan sürüm konum değiştikçe yeniden belirlenir.
  const [waybackElle, setWaybackElle] = useState(false)
  const [hazir, setHazir] = useState<HazirId | null>('standart')
  const [ayar, setAyar] = useState<Ayar>({
    radiusKm: HAZIRLAR[1].radiusKm,
    esikCarpani: 1,
    threshold: null,
    postProcessLevel: null,
  })
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)

  // OpenAerialMap: tarih aralığı varsayılanı 6 Şubat 2023 depremlerinin ilk üç
  // haftası. Varsayılan kaynak olduğu için açılışta bir kez aranır.
  const [oamBaslangic, setOamBaslangic] = useState('2023-02-06')
  const [oamBitis, setOamBitis] = useState('2023-02-28')
  const [oamArandi, setOamArandi] = useState(true)
  const [oamSecili, setOamSecili] = useState<OamGoruntu | null>(null)
  const [oamElle, setOamElle] = useState(false)

  const secimModu = useSecim((d) => d.modu)
  const moduSec = useSecim((d) => d.moduSec)
  const kutu = useSecim((d) => d.kutu)
  const cokgen = useSecim((d) => d.cokgen)
  const merkez = useSecim((d) => d.merkez)
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

  const liste = useMemo(() => surumler.data ?? [], [surumler.data])
  const tarihliKaynak = kaynak === 'esri'
  const oamKaynak = kaynak === 'oam'

  // Analiz merkezi: seçilen nokta ya da kutunun ortası, yoksa şehir merkezi.
  const [merkezLon, merkezLat] = kutu
    ? [(kutu[0] + kutu[2]) / 2, (kutu[1] + kutu[3]) / 2]
    : (merkez ?? [bolgeBilgi.lon, bolgeBilgi.lat])
  const analizKutusu = useMemo<Kutu>(
    () => kutu ?? merkezKutusu(merkezLon, merkezLat, ayar.radiusKm),
    [kutu, merkezLon, merkezLat, ayar.radiusKm],
  )

  // Wayback: bu konumda hangi sürüm hangi tarihte çekilmiş görüntüyü gösteriyor.
  const gecmis = useWaybackGoruntuGecmisi({
    lat: merkezLat,
    lon: merkezLon,
    radiusKm: ayar.radiusKm,
    aktif: tarihliKaynak,
  })
  const ilkSonrasi = ilkOlaySonrasi(gecmis.data)
  const sonOncesi = sonOlayOncesi(gecmis.data)

  // Varsayılan sürüm: depremden sonra çekilmiş ilk görüntüyü getiren sürüm;
  // bu konumda hiç yoksa en güncel sürüm (ve aşağıda açık uyarı).
  useEffect(() => {
    if (waybackElle || !gecmis.data) return
    const hedef = ilkSonrasi?.surumId ?? liste[0]?.id ?? null
    if (hedef !== null && hedef !== waybackId) setWaybackId(hedef)
  }, [waybackElle, gecmis.data, ilkSonrasi, liste, waybackId])

  const seciliSurum = liste.find((v) => v.id === waybackId)
  const seciliGoruntu = seciliSurum ? surumunGoruntusu(seciliSurum.date, gecmis.data) : undefined

  const oam = useOamArama({
    lat: merkezLat,
    lon: merkezLon,
    baslangic: oamBaslangic,
    bitis: oamBitis,
    kutu: kutu ?? null,
    aktif: oamKaynak && oamArandi,
  })

  // Elle seçilmediyse OAM görüntüsü önerilir: alanı en çok kapsayan en erken
  // Maxar çekimi. Seçim analiz alanını DEĞİŞTİRMEZ.
  const oneri = useMemo(
    () => (oam.data ? oamOnerisi(oam.data, analizKutusu) : undefined),
    [oam.data, analizKutusu],
  )
  useEffect(() => {
    if (!oamElle) setOamSecili(oneri?.goruntu ?? null)
  }, [oamElle, oneri])
  const oamOrani = oamSecili ? kapsamaOrani(oamSecili.bbox, analizKutusu) : null

  const olcu = kutu ? kutuCevresi(kutu) : null

  // Etkin modelin künyesi: karar ayarlarının varsayılanı (J-36).
  const model = useUyduModeli()
  const m = model.data
  const etkinEsik =
    ayar.threshold ?? (m ? Math.round(m.esik * ayar.esikCarpani * 100) / 100 : null)
  const etkinSonIsleme = ayar.postProcessLevel ?? m?.sonIsleme ?? null
  const esikNeden =
    ayar.threshold !== null ? 'elle' : ayar.esikCarpani !== 1 ? 'hassas' : 'modelin'

  function hazirSec(id: HazirId) {
    const h = HAZIRLAR.find((x) => x.id === id)!
    setHazir(id)
    setAyar({ radiusKm: h.radiusKm, esikCarpani: h.esikCarpani, threshold: null, postProcessLevel: null })
  }

  function ayarDegistir(yama: Partial<Ayar>) {
    setAyar((a) => ({ ...a, ...yama }))
    setHazir(null)
  }

  async function baslat() {
    if (!m || etkinEsik === null || etkinSonIsleme === null) return
    setHata(null)
    setGonderiliyor(true)
    try {
      const { analysisId } = await analizBaslat({
        city: bolgeBilgi.ad,
        latitude: merkezLat,
        longitude: merkezLon,
        source: kaynak,
        // Yalnız modelinkinden farklıysa gönderilir; yoksa sunucu künyeyi kullanır.
        threshold: esikNeden === 'modelin' ? undefined : etkinEsik,
        postProcessLevel: ayar.postProcessLevel ?? undefined,
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
        kaynak:
          oamKaynak && oamSecili
            ? `OpenAerialMap · ${oamSecili.provider}`
            : (KAYNAKLAR.find((k) => k.id === kaynak)?.ad ?? kaynak),
        // Çekim tarihi: Wayback'te sürüm tarihi DEĞİL, sürümün gösterdiği görüntününki.
        goruntuTarihi: tarihliKaynak
          ? (seciliGoruntu?.cekimTarihi ?? undefined)
          : oamKaynak && oamSecili
            ? oamSecili.date.slice(0, 10)
            : undefined,
        surumTarihi: tarihliKaynak ? seciliSurum?.date : undefined,
        esik: etkinEsik,
        sonIsleme: etkinSonIsleme,
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
            {liste.length > 0 && (
              <>
                {/* Düğmeler çekim tarihine göre: sürüm tarihi çekim tarihi değildir (J-35). */}
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {[
                    { id: ilkSonrasi?.surumId, etiket: 'Deprem sonrası ilk çekim' },
                    { id: sonOncesi?.surumId, etiket: 'Deprem öncesi' },
                    { id: liste[0]?.id, etiket: 'En güncel' },
                  ].map(
                    ({ id, etiket }) =>
                      id && (
                        <Chip
                          key={etiket}
                          secili={waybackId === id}
                          onClick={() => {
                            setWaybackId(id)
                            setWaybackElle(true)
                          }}
                        >
                          {etiket}
                        </Chip>
                      ),
                  )}
                </div>

                <select
                  aria-label="Arşiv sürümü"
                  value={waybackId ?? ''}
                  onChange={(e) => {
                    setWaybackId(e.target.value)
                    setWaybackElle(true)
                  }}
                  className="mt-1.5 w-full rounded-control border border-line-2 bg-sunken px-2.5 py-2 text-body text-ink"
                >
                  {liste.map((v) => {
                    const g = surumunGoruntusu(v.date, gecmis.data)
                    return (
                      <option key={v.id} value={v.id}>
                        {gunMetni(v.date)} sürümü
                        {g?.cekimTarihi ? ` · çekim ${gunMetni(g.cekimTarihi)}` : ''}
                      </option>
                    )
                  })}
                </select>

                <WaybackBilgisi
                  yukleniyor={gecmis.isLoading}
                  hataVar={gecmis.isError}
                  gecmis={gecmis.data}
                  surumTarihi={seciliSurum?.date}
                  goruntu={seciliGoruntu}
                  ilkSonrasi={ilkSonrasi}
                />
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
                        setOamElle(true)
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
                      <span className="mt-0.5 block text-small text-ink-3">
                        alanı ~%{Math.round(100 * kapsamaOrani(g.bbox, analizKutusu))} kapsıyor
                      </span>
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-small text-ink-3">
                  {oamSecili
                    ? `${oamElle ? 'Seçili' : 'Önerilen'}: ${oamSecili.provider}, ${gunMetni(
                        oamSecili.date.slice(0, 10),
                      )} (depremden ${olaydanGun(oamSecili.date.slice(0, 10))} gün sonra). Analiz alanının ~%${Math.round(
                        100 * (oamOrani ?? 0),
                      )}'ini kapsıyor.`
                    : 'Bu alanı kapsayan Maxar görüntüsü bulunamadı; listeden seç ya da tarih aralığını genişlet.'}{' '}
                  Kapsama sınır kutusundan hesaplanır, görüntünün gerçek izi daha dar olabilir.
                  Görüntü seçmek analiz alanını değiştirmez.
                </p>
                {oamSecili && (oamOrani ?? 0) < 0.95 && (
                  <p className="mt-1.5 rounded-control border border-line-2 px-2.5 py-2 text-small text-ink">
                    Görüntü analiz alanının bir kısmını kapsamıyor: o kısımda görüntü yok, model
                    orada hasar arayamaz. Alanı haritadan görüntünün içine taşı.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={baslat}
        disabled={gonderiliyor || (oamKaynak && !oamSecili) || !m}
        className="mt-3 w-full rounded-control bg-accent px-3 py-2.5 text-body font-semibold text-accent-ink disabled:opacity-50"
      >
        {gonderiliyor ? 'İş kuyruğa veriliyor…' : 'Analizi başlat'}
      </button>

      {/* Seçimsiz OAM isteğinde sunucu görüntüyü kendi seçer ya da Google'a düşer;
          künye o zaman istenenle uyuşmaz. Bu yüzden görüntü seçilmeden başlamaz. */}
      {oamKaynak && !oamSecili && (
        <p className="mt-2 text-small text-ink-3">
          {oam.isFetching
            ? 'OpenAerialMap görüntüleri aranıyor…'
            : 'Analiz için bir OpenAerialMap görüntüsü seç.'}
        </p>
      )}

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
          deger={etkinEsik === null ? '—' : etkinEsik.toFixed(2).replace('.', ',')}
          kaydirici={
            <Kaydirici
              etiket="Hasar eşiği"
              deger={(etkinEsik ?? 0.5) * 100}
              enAz={5}
              enCok={90}
              adim={1}
              degerEtiketi={etkinEsik === null ? '—' : etkinEsik.toFixed(2).replace('.', ',')}
              onDegis={(v) => ayarDegistir({ threshold: v / 100 })}
            />
          }
          not={`${
            m ? `Modelin ölçüldüğü eşik ${m.esik.toFixed(2).replace('.', ',')}. ` : ''
          }Düşük eşik daha çok yeri hasarlı işaretler: gözden kaçan azalır, yanlış alarm artar.`}
        />
        <Satir
          etiket="Son işleme"
          deger={
            etkinSonIsleme === null ? '—' : etkinSonIsleme === 0 ? 'kapalı' : `seviye ${etkinSonIsleme}`
          }
          kaydirici={
            <Kaydirici
              etiket="Son işleme seviyesi"
              deger={etkinSonIsleme ?? 0}
              enAz={0}
              enCok={2}
              adim={1}
              degerEtiketi={String(etkinSonIsleme ?? '—')}
              onDegis={(v) => ayarDegistir({ postProcessLevel: v })}
            />
          }
          not={`${
            m
              ? `Modelin ölçüldüğü ayar: ${m.sonIsleme === 0 ? 'kapalı' : `seviye ${m.sonIsleme}`}. `
              : ''
          }Maskedeki küçük lekeleri temizler. Yükseldikçe sonuç sadeleşir, ufak hasar kaybolabilir.`}
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
        {oamKaynak && oamSecili
          ? `${gunMetni(oamSecili.date.slice(0, 10))} tarihli ${oamSecili.provider} görüntüsü`
          : tarihliKaynak && seciliSurum
            ? `Wayback'in ${gunMetni(seciliSurum.date)} sürümündeki görüntü${
                seciliGoruntu?.cekimTarihi
                  ? ` (çekim ${gunMetni(seciliGoruntu.cekimTarihi)})`
                  : ' (çekim tarihi bilinmiyor)'
              }`
            : KAYNAKLAR.find((k) => k.id === kaynak)?.ad.toLocaleLowerCase('tr')}{' '}
        ile analiz edilecek.{' '}
        {m
          ? `Model: ${m.etiket}; eşik ${etkinEsik?.toFixed(2).replace('.', ',')} (${
              esikNeden === 'modelin'
                ? 'modelin kendi eşiği'
                : esikNeden === 'hassas'
                  ? "hassas tarama: modelinkinin %70'i"
                  : 'elle ayarlandı'
            }), son işleme ${etkinSonIsleme === 0 ? 'kapalı' : `seviye ${etkinSonIsleme}`}.`
          : model.isError
            ? 'Model künyesi okunamadı; analiz başlatılamaz.'
            : 'Model bilgisi alınıyor…'}
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

/** Seçili Wayback sürümünün bu konumda GERÇEKTE gösterdiği görüntü (J-35).
    Sürüm tarihi çekim tarihi değildir; bu blok aradaki farkı açıkça yazar. */
function WaybackBilgisi({
  yukleniyor,
  hataVar,
  gecmis,
  surumTarihi,
  goruntu,
  ilkSonrasi,
}: {
  yukleniyor: boolean
  hataVar: boolean
  gecmis: WaybackGoruntuGecmisi | undefined
  surumTarihi: string | undefined
  goruntu: WaybackGoruntu | undefined
  ilkSonrasi: WaybackGoruntu | undefined
}) {
  let durum: React.ReactNode
  if (yukleniyor) {
    durum = 'Bu konumun arşiv geçmişi çıkarılıyor (ilk seferde birkaç saniye)…'
  } else if (hataVar || !gecmis) {
    durum = 'Çekim tarihi okunamadı; bu görüntünün depremden sonra çekildiği doğrulanamıyor.'
  } else if (goruntu?.cekimTarihi) {
    const gun = olaydanGun(goruntu.cekimTarihi)
    durum = (
      <>
        Seçili sürüm bu konumda{' '}
        <span className="text-ink">{gunMetni(goruntu.cekimTarihi)}</span> tarihinde çekilmiş{' '}
        {goruntu.kaynak ?? 'kaynağı bilinmeyen'} görüntüsünü gösteriyor
        {goruntu.cozunurlukM ? ` (${String(goruntu.cozunurlukM).replace('.', ',')} m)` : ''}.{' '}
        {gun < 0 ? (
          <span className="text-ink">
            Deprem öncesi: görüntüde depremin hasarı yok, bulunan her hasar yanlış alarmdır.
          </span>
        ) : (
          `Depremden ${gun} gün sonra${gun > 60 ? '; enkazın bir kısmı kaldırılmış olabilir' : ''}.`
        )}
      </>
    )
  } else if (surumTarihi && surumTarihi < gecmis.olayTarihi) {
    durum = 'Bu sürüm depremden önce yayımlandı; gösterdiği görüntü de deprem öncesine ait.'
  } else if (gecmis.bitis === 'karo-yok') {
    durum = `Bu sürümde z${gecmis.zoom} yakınlaştırmasında karo yok; analiz daha kaba bir yakınlaştırmaya iner.`
  } else {
    durum = 'Bu sürümün gösterdiği görüntünün çekim tarihi bilinmiyor.'
  }

  return (
    <div className="mt-1.5 text-small text-ink-3">
      <p>{durum}</p>
      {!yukleniyor && gecmis && !ilkSonrasi && (
        <p className="mt-1.5 rounded-control border border-line-2 px-2.5 py-2 text-ink">
          Wayback bu konumda depremden sonra çekilmiş görüntü göstermiyor. Hasar aramak için
          OpenAerialMap'i kullan.
        </p>
      )}
      <p className="mt-1.5">
        Wayback'te sürüm tarihi görüntünün çekim tarihi değildir: güncellenmeyen karo eski
        sürümden gelir. Çekim tarihi Esri'nin metadata katmanından, analizin kullanacağı
        yakınlaştırmada (z{gecmis?.zoom ?? '—'}) okunur.
      </p>
    </div>
  )
}

/** Sonucun görüntü künyesi: koşumun GERÇEKTE kullandığı kaynak sonuçtan okunur. */
function goruntuKunyesi(sonuc: AnalizSonucu, kunye: IsKunyesi | undefined, surumTarihi?: string) {
  const cekimler = (sonuc.imageryCaptures ?? []).filter((c) => c.cekimTarihi)
  if (sonuc.imagerySource === 'esri') {
    const surum = surumTarihi ?? kunye?.surumTarihi
    const cekim = cekimler.length
      ? `çekim ${cekimler
          .map((c) => `${gunMetni(c.cekimTarihi!)}${c.kaynak ? ` (${c.kaynak})` : ''}`)
          .join(', ')}`
      : 'çekim tarihi okunamadı'
    return `Esri Wayback${surum ? ` · ${gunMetni(surum)} sürümü` : ''} · ${cekim}`
  }
  if (sonuc.imagerySource === 'custom') {
    return `${kunye?.kaynak ?? sonuc.imageryLabel ?? 'OpenAerialMap'}${
      kunye?.goruntuTarihi ? ` · çekim ${gunMetni(kunye.goruntuTarihi)}` : ''
    }`
  }
  return `${sonuc.imageryLabel ?? 'Güncel uydu görüntüsü'} · çekim tarihi bilinmiyor`
}

/** Web Mercator'da bir yakınlaştırmanın bu enlemdeki piksel boyu (m). */
function metrePiksel(z: number, enlem: number) {
  return (156543.03 * Math.cos((enlem * Math.PI) / 180)) / 2 ** z
}

export function HasarSag() {
  const is = useIsler(sonIsSec)
  const sonuc = is?.sonuc as AnalizSonucu | undefined
  const surumler = useWaybackSurumleri()
  const segmentler = useAnalizSegmentleri(
    is?.durum === 'bitti' && is.isTipi === 'hasar-analizi' ? is.id : null,
  )

  // Künye sonucun kendisinden okunur (koşumun gerçekte kullandığı görüntü);
  // Wayback'te çekim tarihleri de sonuçta gelir (J-35).
  const surumTarihi =
    sonuc?.waybackId != null
      ? surumler.data?.find((v) => v.id === String(sonuc.waybackId))?.date
      : undefined
  const zamanlama = sonuc?.imageryEventTiming
  const cekimMetni = (sonuc?.imageryCaptures ?? [])
    .flatMap((c) => (c.cekimTarihi ? [gunMetni(c.cekimTarihi)] : []))
    .join(', ')
  const enlem = sonuc?.bounds ? (sonuc.bounds.south + sonuc.bounds.north) / 2 : 37

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
          {/* Kural 1: görüntü depremden önce çekildiyse bu, sayılardan önce okunmalı. */}
          {(zamanlama === 'pre' || zamanlama === 'mixed') && (
            <p
              role="alert"
              className="mb-3 rounded-control border border-line-2 px-2.5 py-2 text-small text-ink"
            >
              {zamanlama === 'pre'
                ? `Bu analiz deprem ÖNCESİ çekilmiş görüntüyle yapıldı (çekim ${cekimMetni}). Görüntüde depremin hasarı yok; aşağıdaki hasar ve kapanmalar yanlış alarmdır, karar için kullanılamaz.`
                : `Alandaki görüntüler karışık (çekim ${cekimMetni || 'bir kısmı bilinmiyor'}); bir kısmı deprem öncesine ait. O kısımlarda sonuç depremi göstermez.`}
            </p>
          )}

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

          {/* Deprem öncesi görüntüde "bölge erişilebilir" gibi bir öneri yanıltır. */}
          {sonuc.recommendedAction && zamanlama !== 'pre' && (
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
            {goruntuKunyesi(sonuc, is.kunye, surumTarihi)}
            {is.kunye ? ` · ${is.kunye.yaricapKm.toFixed(1).replace('.', ',')} km yarıçap` : ''}
          </p>
          {sonuc.imageryZoom != null && (
            <p className="mt-1 text-small text-ink-2">
              <span className="text-ink">Çözünürlük:</span> z{sonuc.imageryZoom} · ~
              {metrePiksel(sonuc.imageryZoom, enlem).toFixed(2).replace('.', ',')} m/piksel
              {sonuc.imageryRequestedZoom != null &&
              sonuc.imageryRequestedZoom !== sonuc.imageryZoom
                ? ` (istenen z${sonuc.imageryRequestedZoom}'de karo yoktu, bir alta inildi)`
                : ''}
            </p>
          )}
          {sonuc.model?.gsdUyarisi && (
            <p className="mt-1.5 rounded-control border border-line-2 px-2.5 py-2 text-small text-ink">
              Model{' '}
              {sonuc.model.egitimGsdM.map((g) => String(g).replace('.', ',')).join('–')} m/piksel
              görüntüyle eğitildi; bu analiz ~
              {sonuc.model.kullanilanGsdM.toFixed(2).replace('.', ',')} m/pikselle yapıldı. Bu
              çözünürlükte çöken bina birkaç piksel kalır, tespit güvenilmez (J-20). Daha küçük alan
              seçmek çözünürlüğü artırır.
            </p>
          )}

          <Teknik>
            Model:{' '}
            {sonuc.model
              ? `${sonuc.model.etiket} (${sonuc.model.mimari} / ${sonuc.model.kodlayici}, ağırlık ${
                  sonuc.model.sha256Kisa
                }) · sınama IoU ${
                  sonuc.model.olcum?.sinamaIoU != null
                    ? sonuc.model.olcum.sinamaIoU.toFixed(3).replace('.', ',')
                    : 'ölçülmedi'
                }`
              : 'bilgi yok'}
            . Kaynak künyesi — bölge: {sonuc.city ?? '—'} · eşik:{' '}
            {sonuc.threshold?.toFixed(2).replace('.', ',') ?? '—'} · hasar çarpanı:{' '}
            {sonuc.damageBooster?.toFixed(1).replace('.', ',') ?? '—'} · son işleme:{' '}
            {sonuc.postProcessLevel == null
              ? '—'
              : sonuc.postProcessLevel === 0
                ? 'kapalı'
                : `seviye ${sonuc.postProcessLevel}`}{' '}
            · kapanma kuralı:{' '}
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
