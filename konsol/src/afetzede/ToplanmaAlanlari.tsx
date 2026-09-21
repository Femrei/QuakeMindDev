import { Amac, Bolum, Panel, SuAn, Teknik, VeriYok } from '@/kabuk/Panel'
import type { EtkinKonum } from './CagriFormu'
import { mesafeMetni, yon } from './konum'
import { useToplanmaAlanlari, type ToplanmaAlani } from './veri'

/* ---------------------------------------------------------------------------
   En yakın toplanma alanları (J-43).

   Bu ekran harita motoru indirmez (MIMARI §7); alanı uzaklık ve yönle verir.
   Eski web iki şeyi yanlış söylüyordu:
   · Her alanı "Güvenli" diye etiketliyordu. Liste depremden ÖNCEKİ resmi
     listedir; alanın bugünkü durumu (hasar, doluluk) bilinmiyor.
   · Rotayı dış OSRM sunucusundan istiyordu: kullanıcının tam konumu üçüncü
     tarafa gidiyordu ve o rota yıkık ya da kapalı yolları bilmiyordu.
   Hasar bilgili yol tarifi afetzede için henüz yok (J-44).
--------------------------------------------------------------------------- */

const GOSTERILEN = 5

function osmBaglantisi(a: ToplanmaAlani): string {
  // Yalnız alanın konumu gider; kullanıcının konumu bağlantıya yazılmaz.
  const lat = a.lat.toFixed(5)
  const lon = a.lon.toFixed(5)
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`
}

function YonOku({ derece }: { derece: number }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      aria-hidden="true"
      style={{ transform: `rotate(${Math.round(derece)}deg)` }}
      className="shrink-0"
    >
      <path d="M7 1.5 11 12 7 9.5 3 12Z" fill="currentColor" />
    </svg>
  )
}

export function ToplanmaAlanlari({ konum }: { konum: EtkinKonum | null }) {
  const sorgu = useToplanmaAlanlari(konum)
  const alanlar = (sorgu.data?.records ?? []).slice(0, GOSTERILEN)

  return (
    <Panel baslik="En yakın toplanma alanları">
      <Bolum>
        <Amac>Deprem sonrası gidebileceğin resmi toplanma alanları, sana uzaklığa göre sıralı.</Amac>

        <div className="mt-3">
          {!konum ? (
            <VeriYok
              ne="En yakın alan"
              neden="konumun olmadan hesaplanamaz; yukarıdan konumunu al ya da mahalleni seç"
            />
          ) : sorgu.isPending ? (
            <p className="text-small text-ink-3">Toplanma alanları aranıyor…</p>
          ) : sorgu.isError ? (
            <p role="alert" className="text-small text-crit">
              Toplanma alanları alınamadı. Bağlantın dönünce sayfayı yenile.
            </p>
          ) : alanlar.length === 0 ? (
            <VeriYok ne="10 km içindeki toplanma alanları" neden="bu çevrede kayıtlı alan yok" />
          ) : (
            <ol>
              {alanlar.map((a, i) => {
                const y = yon(konum, a)
                const ad = a.toplanma_alani || a.name
                const yer = [a.mahalle, a.ilce].filter(Boolean).join(' · ')
                return (
                  <li
                    key={`${ad}-${a.lat}-${a.lon}`}
                    className="border-b border-line py-2.5 first:pt-0 last:border-b-0"
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-body text-ink">
                        {i + 1}. {ad}
                      </span>
                      <span className="shrink-0 font-mono text-body text-ink">{mesafeMetni(a.dist_m)}</span>
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="text-small text-ink-3">{yer || 'Mahalle bilgisi yok'}</span>
                      <span className="flex shrink-0 items-center gap-1 text-small text-ink-2">
                        <YonOku derece={y.derece} />
                        {y.ad}
                      </span>
                    </span>
                    <a
                      href={osmBaglantisi(a)}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-1.5 inline-block text-small text-accent underline-offset-2 hover:underline"
                    >
                      Haritada aç (OpenStreetMap, dış site)
                    </a>
                  </li>
                )
              })}
            </ol>
          )}
        </div>

        {konum && alanlar.length > 0 && (
          <SuAn>
            Uzaklıklar kuş uçuşu, yön senin konumundan alana doğru; yürüyeceğin yol daha uzun
            olabilir. Hesap{' '}
            {konum.kaynak === 'mahalle'
              ? `${konum.yer.ad} merkezine göre (yaklaşık)`
              : 'cihaz konumuna göre'}
            .
          </SuAn>
        )}

        <Teknik>
          Kaynak: AFAD toplanma alanları veri seti. Liste depremden önceki resmi listedir; alanın
          bugünkü durumu (hasar, doluluk) burada yok. Dış harita yıkık ve kapalı yolları bilmez;
          hasar bilgili yol tarifi bu ekranda henüz yok. Konumun dış rota servisine gönderilmez.
        </Teknik>
      </Bolum>
    </Panel>
  )
}
