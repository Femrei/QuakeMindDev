import type { SosCagrisi, SosDurumu } from '@/veri/sorgular'

/** Afetzedenin seçtiği durum → çağrının önceliği. Etiket afetzedenin dilinde. */
export const DURUMLAR = [
  { oncelik: 'kritik', etiket: 'Mahsur kaldım', aciklama: 'Enkaz altındayım ya da bulunduğum yerden çıkamıyorum' },
  { oncelik: 'yuksek', etiket: 'Yaralı var', aciklama: 'Tıbbi yardım gerekiyor' },
  { oncelik: 'orta', etiket: 'Yardım gerekli', aciklama: 'Güvendeyim ama su, barınma ya da ısınma gerekiyor' },
] as const satisfies ReadonlyArray<{ oncelik: SosCagrisi['oncelik']; etiket: string; aciklama: string }>

export const DURUM_ETIKETI: Record<SosCagrisi['oncelik'], string> = {
  kritik: 'Mahsur kaldım',
  yuksek: 'Yaralı var',
  orta: 'Yardım gerekli',
}

/** Çağrının işlem durumu: rozet ve tek cümlelik açıklama. */
export const ISLEM_DURUMU: Record<
  SosDurumu,
  { ad: string; ton: 'high' | 'ok' | 'nötr'; aciklama: string }
> = {
  bekliyor: { ad: 'Bekliyor', ton: 'high', aciklama: 'Çağrın kayıtlı, henüz ekip atanmadı.' },
  atandi: { ad: 'Ekip atandı', ton: 'ok', aciklama: 'Bir ekip çağrına görevlendirildi.' },
  kapandi: { ad: 'Kapandı', ton: 'nötr', aciklama: 'Ekip çağrıyı kapattı.' },
}
