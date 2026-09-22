import { useCallback, useEffect, useRef, useState } from 'react'

/* Düdük sesi (J-50): enkaz altındaki afetzede telefonundan ses çıkarsın,
   ekip onu duysun. Üç kısa ses, uluslararası yardım işaretidir; 2,5 sn arayla
   tekrarlanır. Ses cihazda üretilir, sunucuya hiçbir şey gitmez. Sayaç bir
   uç yoklaması değildir (kural 4), yalnız sesi tekrarlar. */

const FREKANS_HZ = 3150
const TEKRAR_MS = 2500

export function useDuduk() {
  const ses = useRef<AudioContext | null>(null)
  const sayac = useRef<number | null>(null)
  const [caliyor, setCaliyor] = useState(false)

  const durdur = useCallback(() => {
    if (sayac.current != null) window.clearInterval(sayac.current)
    sayac.current = null
    setCaliyor(false)
  }, [])

  const cal = useCallback(() => {
    const Yapici =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Yapici) return
    const c = (ses.current ??= new Yapici())
    void c.resume()
    const ucKisa = () => {
      const t0 = c.currentTime + 0.05
      for (let i = 0; i < 3; i++) {
        const b = t0 + i * 0.45
        const osilator = c.createOscillator()
        const kazanc = c.createGain()
        osilator.type = 'square'
        osilator.frequency.value = FREKANS_HZ
        kazanc.gain.setValueAtTime(0, b)
        kazanc.gain.linearRampToValueAtTime(0.5, b + 0.02)
        kazanc.gain.setValueAtTime(0.5, b + 0.28)
        kazanc.gain.linearRampToValueAtTime(0, b + 0.3)
        osilator.connect(kazanc).connect(c.destination)
        osilator.start(b)
        osilator.stop(b + 0.32)
      }
    }
    ucKisa()
    if (sayac.current != null) window.clearInterval(sayac.current)
    sayac.current = window.setInterval(ucKisa, TEKRAR_MS)
    setCaliyor(true)
  }, [])

  useEffect(() => durdur, [durdur])
  return { caliyor, cal, durdur }
}
