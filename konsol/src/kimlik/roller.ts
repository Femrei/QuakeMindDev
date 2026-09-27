/** Roller MIMARI.md §9'daki dört rol. Rol yalnızca sunucudan (veritabanından) gelir. */
export const ROLLER = ['afetzede', 'saha', 'koordinator', 'yonetici'] as const
export type Rol = (typeof ROLLER)[number]

export const ROL_ADI: Record<Rol, string> = {
  afetzede: 'Afetzede',
  saha: 'Saha ekibi',
  koordinator: 'Koordinatör',
  yonetici: 'Yönetici',
}

/** Konsolu (harita, analiz) görebilen roller. Afetzede ayrı ve hafif ekrana gider. */
export const KONSOL_ROLLERI: Rol[] = ['saha', 'koordinator', 'yonetici']

/** Rolün açılışta gideceği yer. */
export function varsayilanYol(rol: Rol): string {
  // Saha ekibi sahada telefonla çalışır: açılışta kendi görev ekranı (J-54).
  return rol === 'afetzede' ? '/afetzede' : rol === 'saha' ? '/ekip' : '/konsol/genel'
}

export type Oturum = {
  kullaniciId: string
  adSoyad: string
  eposta: string
  rol: Rol
  /** Saha kullanıcısının bağlı olduğu ekip (J-54). Yalnız görünüm içindir;
      yetkiyi her uçta sunucu kontrol eder. */
  ekipId?: string | null
  /** Oturumun kaynağı; bugün tek seçenek imzalı erişim jetonu. */
  kaynak: 'jwt'
}
