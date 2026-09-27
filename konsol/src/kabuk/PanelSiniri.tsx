import { Component, type ErrorInfo, type ReactNode } from 'react'

/* ---------------------------------------------------------------------------
   Panel hata sınırı (25 Eylül 2026, J-63).

   Tek bir mod panelinde atılan hata bütün konsolu karartıyordu: React ağacı
   düşünce ekran bomboş kalıyor, kullanıcı ne olduğunu göremiyordu. Afet
   ekranında bu kabul edilemez — bir panel bozulsa bile harita, öbür panel ve
   üst çubuk ayakta kalmalı.

   Sınır hatayı yutmaz: konsola yazar ve ekranda ne olduğunu söyler.
--------------------------------------------------------------------------- */

type Ozellikler = { baslik: string; children: ReactNode }
type Durum = { hata: Error | null }

export class PanelSiniri extends Component<Ozellikler, Durum> {
  state: Durum = { hata: null }

  static getDerivedStateFromError(hata: Error): Durum {
    return { hata }
  }

  componentDidCatch(hata: Error, bilgi: ErrorInfo) {
    console.error(`[panel] ${this.props.baslik} hata verdi`, hata, bilgi.componentStack)
  }

  render() {
    if (!this.state.hata) return this.props.children
    return (
      <div className="px-3 py-3">
        <p className="text-body text-crit">Bu panel açılamadı.</p>
        <p className="mt-1 text-small text-ink-2">
          {this.state.hata.message || 'Bilinmeyen hata'}
        </p>
        <p className="mt-2 text-small text-ink-3">
          Harita ve öbür paneller çalışmaya devam ediyor. Ayrıntı tarayıcı konsolunda.
        </p>
      </div>
    )
  }
}
