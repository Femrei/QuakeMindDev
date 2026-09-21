import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useOturum } from './oturum'
import { varsayilanYol } from './roller'
import { Marka } from '@/kabuk/Marka'

export function GirisEkrani() {
  const { oturum, girisYap } = useOturum()
  const git = useNavigate()
  const [eposta, setEposta] = useState('')
  const [sifre, setSifre] = useState('')
  const [hata, setHata] = useState<string | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)

  if (oturum) return <Navigate to={varsayilanYol(oturum.rol)} replace />

  async function gonder(e: FormEvent) {
    e.preventDefault()
    setHata(null)
    setGonderiliyor(true)
    try {
      const yeni = await girisYap(eposta, sifre)
      git(varsayilanYol(yeni.rol), { replace: true })
    } catch (err) {
      setHata(err instanceof Error ? err.message : 'Giriş yapılamadı.')
    } finally {
      setGonderiliyor(false)
    }
  }

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
            Konsola giriş
          </h1>
          <p className="mt-1.5 text-small text-ink-2">
            Hesabınızın yetkisi girişten sonra sunucudan gelir; ekran buna göre açılır.
          </p>

          <label className="mt-4 block text-micro ls-micro text-ink-3 uppercase" htmlFor="eposta">
            E-posta
          </label>
          <input
            id="eposta"
            type="email"
            autoComplete="username"
            value={eposta}
            onChange={(e) => setEposta(e.target.value)}
            className="mt-1.5 w-full rounded-control border border-line-2 bg-sunken px-2.5 py-2 text-body text-ink outline-none focus:border-accent"
          />

          <label className="mt-3 block text-micro ls-micro text-ink-3 uppercase" htmlFor="sifre">
            Şifre
          </label>
          <input
            id="sifre"
            type="password"
            autoComplete="current-password"
            value={sifre}
            onChange={(e) => setSifre(e.target.value)}
            className="mt-1.5 w-full rounded-control border border-line-2 bg-sunken px-2.5 py-2 text-body text-ink outline-none focus:border-accent"
          />

          {hata && (
            <p role="alert" className="mt-3 text-small text-crit">
              {hata}
            </p>
          )}

          <button
            type="submit"
            disabled={gonderiliyor}
            className="mt-4 w-full rounded-control bg-accent px-3 py-2.5 text-body font-semibold text-accent-ink disabled:opacity-50"
          >
            {gonderiliyor ? 'Giriş yapılıyor…' : 'Giriş yap'}
          </button>
        </form>

        <div className="mt-3 rounded-panel border border-line bg-panel p-3.5">
          <p className="text-micro ls-micro text-ink-3 uppercase">Hesabın yoksa</p>
          <p className="mt-2 text-small text-ink-2">
            Yeni hesaplar <b className="font-medium text-ink">afetzede</b> yetkisiyle açılır. Saha,
            koordinatör ve yönetici yetkisini yönetici verir; bu yetki giriş ekranından seçilemez.
          </p>
        </div>
      </div>
    </div>
  )
}
