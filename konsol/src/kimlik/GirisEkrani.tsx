import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useOturum } from './oturum'
import { varsayilanYol } from './roller'
import { Marka } from '@/kabuk/Marka'

/* Giriş ve hesap açma. Afetzede, saha ekibi ve koordinasyon aynı kapıdan girer;
   hangi ekranın açılacağını sunucudan gelen yetki belirler (kural 5).
   Hesap açma formu eskiden yoktu: ekran "yeni hesaplar afetzede olarak açılır"
   diyordu ama afetzedenin hesap açacağı bir yer yoktu (J-48). */

const SIFRE_EN_AZ = 8

export function GirisEkrani() {
  const { oturum, girisYap, kayitOl } = useOturum()
  const git = useNavigate()
  const [kip, setKip] = useState<'giris' | 'kayit'>('giris')
  const [adSoyad, setAdSoyad] = useState('')
  const [eposta, setEposta] = useState('')
  const [sifre, setSifre] = useState('')
  const [hata, setHata] = useState<string | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)

  if (oturum) return <Navigate to={varsayilanYol(oturum.rol)} replace />

  const kayit = kip === 'kayit'
  const eksik = kayit
    ? [
        adSoyad.trim().length < 2 && 'ad soyad',
        !eposta.includes('@') && 'e-posta',
        sifre.length < SIFRE_EN_AZ && `en az ${SIFRE_EN_AZ} karakterlik şifre`,
      ].filter(Boolean)
    : []

  async function gonder(e: FormEvent) {
    e.preventDefault()
    if (eksik.length) return
    setHata(null)
    setGonderiliyor(true)
    try {
      const yeni = kayit
        ? await kayitOl(eposta.trim(), adSoyad.trim(), sifre)
        : await girisYap(eposta, sifre)
      git(varsayilanYol(yeni.rol), { replace: true })
    } catch (err) {
      setHata(err instanceof Error ? err.message : kayit ? 'Hesap açılamadı.' : 'Giriş yapılamadı.')
    } finally {
      setGonderiliyor(false)
    }
  }

  function kipDegistir(yeni: 'giris' | 'kayit') {
    setKip(yeni)
    setHata(null)
    setSifre('')
  }

  const alan =
    'mt-1.5 w-full rounded-control border border-line-2 bg-sunken px-2.5 py-2 text-body text-ink outline-none focus:border-accent'
  const etiket = 'mt-3 block text-micro ls-micro text-ink-3 uppercase'

  return (
    <div className="grid h-full place-items-center overflow-auto bg-ground p-6">
      <div className="w-full max-w-form">
        <div className="mb-5 flex items-center gap-2.5">
          <Marka />
        </div>

        <form
          onSubmit={gonder}
          className="rounded-panel border border-line bg-panel p-3.5"
          aria-labelledby="giris-baslik"
        >
          <h1 id="giris-baslik" className="text-subtitle text-ink">
            {kayit ? 'Hesap aç' : 'Giriş yap'}
          </h1>
          <p className="mt-1.5 text-small text-ink-2">
            {kayit
              ? 'Hesabın afetzede yetkisiyle açılır: yardım çağırır, çağrının durumunu ve en yakın toplanma alanını görürsün.'
              : 'Hesabının yetkisi girişten sonra sunucudan gelir; ekran buna göre açılır.'}
          </p>

          {kayit && (
            <>
              <label className={etiket} htmlFor="ad-soyad">
                Ad soyad
              </label>
              <input
                id="ad-soyad"
                autoComplete="name"
                value={adSoyad}
                onChange={(e) => setAdSoyad(e.target.value)}
                className={alan}
              />
            </>
          )}

          <label className={etiket} htmlFor="eposta">
            E-posta
          </label>
          <input
            id="eposta"
            type="email"
            autoComplete={kayit ? 'email' : 'username'}
            value={eposta}
            onChange={(e) => setEposta(e.target.value)}
            className={alan}
          />

          <label className={etiket} htmlFor="sifre">
            Şifre{kayit ? ` · en az ${SIFRE_EN_AZ} karakter` : ''}
          </label>
          <input
            id="sifre"
            type="password"
            autoComplete={kayit ? 'new-password' : 'current-password'}
            value={sifre}
            onChange={(e) => setSifre(e.target.value)}
            className={alan}
          />

          {hata && (
            <p role="alert" className="mt-3 text-small text-crit">
              {hata}
            </p>
          )}

          <button
            type="submit"
            disabled={gonderiliyor || eksik.length > 0}
            className="mt-4 w-full rounded-control bg-accent px-3 py-2.5 text-body font-semibold text-accent-ink disabled:opacity-50"
          >
            {gonderiliyor
              ? kayit
                ? 'Hesap açılıyor…'
                : 'Giriş yapılıyor…'
              : kayit
                ? 'Hesap aç ve gir'
                : 'Giriş yap'}
          </button>
          {kayit && eksik.length > 0 && (adSoyad || eposta || sifre) && (
            <p className="mt-2 text-small text-ink-3">Eksik: {eksik.join(' · ')}.</p>
          )}
        </form>

        <div className="mt-3 rounded-panel border border-line bg-panel p-3.5">
          {kayit ? (
            <>
              <p className="text-small text-ink-2">Hesabın var mı?</p>
              <button
                type="button"
                onClick={() => kipDegistir('giris')}
                className="mt-2 w-full rounded-control border border-line-2 px-3 py-2 text-body text-ink hover:bg-hover"
              >
                Giriş yap
              </button>
            </>
          ) : (
            <>
              <p className="text-micro ls-micro text-ink-3 uppercase">Hesabın yoksa</p>
              <p className="mt-2 text-small text-ink-2">
                Yardım çağırmak için hesap aç. Yeni hesaplar{' '}
                <b className="font-medium text-ink">afetzede</b> yetkisiyle açılır. Saha,
                koordinatör ve yönetici yetkisini yönetici verir; bu yetki burada seçilemez.
              </p>
              <button
                type="button"
                onClick={() => kipDegistir('kayit')}
                className="mt-2.5 w-full rounded-control border border-line-2 px-3 py-2 text-body text-ink hover:bg-hover"
              >
                Hesap aç
              </button>
            </>
          )}
          <p className="mt-2.5 text-small text-ink-3">Acil durumda 112'yi ara.</p>
        </div>
      </div>
    </div>
  )
}
