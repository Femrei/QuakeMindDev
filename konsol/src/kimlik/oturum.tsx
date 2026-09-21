import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Oturum } from './roller'
import * as uc from './oturumUcu'
import { kimlikBagla } from '@/veri/istemci'

/* ---------------------------------------------------------------------------
   Oturum sağlayıcı — gerçek uçlara bağlı (TASIMA_PLANI.md Faz 2).

   Erişim jetonu yalnız bellekte durur; sekme yenilenince httpOnly çerezdeki
   yenileme jetonuyla geri alınır. Rol sunucudan gelir, istemci rol seçemez.
--------------------------------------------------------------------------- */

type OturumDurumu = {
  oturum: Oturum | null
  yukleniyor: boolean
  girisYap: (eposta: string, sifre: string) => Promise<Oturum>
  kayitOl: (eposta: string, adSoyad: string, sifre: string) => Promise<Oturum>
  cikisYap: () => Promise<void>
}

const Baglam = createContext<OturumDurumu | null>(null)

export function OturumSaglayici({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  const [oturum, setOturum] = useState<Oturum | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  // Veri istemcisi jetonu buradan okur; 401'de sessizce yeniler.
  useEffect(() => {
    kimlikBagla(uc.jetonAl, async () => {
      const yeni = await uc.oturumYenile()
      setOturum(yeni)
      return yeni
    })
  }, [])

  // Açılışta: çerez duruyorsa oturum geri alınır.
  useEffect(() => {
    let iptal = false
    uc.oturumYenile()
      .then((yeni) => {
        if (!iptal) setOturum(yeni)
      })
      .finally(() => {
        if (!iptal) setYukleniyor(false)
      })
    return () => {
      iptal = true
    }
  }, [])

  // Önbellek kullanıcıya aittir: sorgular zamanla bayatlamadığı için (staleTime
  // sonsuz) önceki kullanıcının verisi yeni girişte olduğu gibi görünürdü --
  // koordinatörden sonra aynı sekmede giren afetzede herkesin çağrısını görürdü.
  const girisYap = useCallback(
    async (eposta: string, sifre: string) => {
      const yeni = await uc.girisYap(eposta, sifre)
      qc.clear()
      setOturum(yeni)
      return yeni
    },
    [qc],
  )

  const kayitOl = useCallback(
    async (eposta: string, adSoyad: string, sifre: string) => {
      const yeni = await uc.kayitOl(eposta, adSoyad, sifre)
      qc.clear()
      setOturum(yeni)
      return yeni
    },
    [qc],
  )

  const cikisYap = useCallback(async () => {
    await uc.cikisYap()
    qc.clear()
    setOturum(null)
  }, [qc])

  const deger = useMemo(
    () => ({ oturum, yukleniyor, girisYap, kayitOl, cikisYap }),
    [oturum, yukleniyor, girisYap, kayitOl, cikisYap],
  )
  return <Baglam.Provider value={deger}>{children}</Baglam.Provider>
}

export function useOturum(): OturumDurumu {
  const d = useContext(Baglam)
  if (!d) throw new Error('useOturum, OturumSaglayici içinde çağrılmalı.')
  return d
}
