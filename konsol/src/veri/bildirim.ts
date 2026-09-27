import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from './istemci'

/* ---------------------------------------------------------------------------
   Acil durum bildirimleri (J-45). Afetzede ekranı yayındakileri okur, konsol
   yayınlar ve geri çeker. Tazeleme canlı akıştaki "bildirim" mesajıyla olur
   (önek ['bildirimler'] iki sorguyu da kapsar; kural 4).
--------------------------------------------------------------------------- */

export type BildirimOnemi = 'acil' | 'uyari' | 'bilgi'

/** Rozet tonu ve kenar rengi: kırmızı ve turuncu yalnız aciliyet için (ARAYUZ §3). */
/** Bilgi duyurusu da dikkat çekmeli (J-51, kullanıcı): gri değil, vurgu
    rengindedir. Kırmızı ve turuncu yine yalnız acil ve uyarı içindir. */
export const ONEM: Record<
  BildirimOnemi,
  { ad: string; aciklama: string; ton: 'crit' | 'high' | 'nötr'; kenar: string; metin: string; zemin: string }
> = {
  acil: {
    ad: 'Acil', aciklama: 'Hemen harekete geçilmesi gereken durum', ton: 'crit',
    kenar: 'border-crit', metin: 'text-crit', zemin: 'bg-crit/15',
  },
  uyari: {
    ad: 'Uyarı', aciklama: 'Dikkat edilmesi gereken durum', ton: 'high',
    kenar: 'border-high', metin: 'text-high', zemin: 'bg-high/15',
  },
  bilgi: {
    ad: 'Bilgi', aciklama: 'Duyuru: dağıtım, açılan alan, saat', ton: 'nötr',
    kenar: 'border-accent', metin: 'text-accent', zemin: 'bg-accent-soft',
  },
}

/** Listede en önemli olan: acil, sonra uyarı, sonra en yeni. */
export function enOnemli<T extends { onem: string }>(liste: T[]): T | undefined {
  return liste.find((b) => b.onem === 'acil') ?? liste.find((b) => b.onem === 'uyari') ?? liste[0]
}

export const onemi = (o: string) => ONEM[o as BildirimOnemi] ?? ONEM.bilgi

/** Afetzedeye giden alanlar. */
export type Bildirim = {
  id: string
  baslik: string
  metin: string
  onem: BildirimOnemi
  konum: string | null
  buyukluk: number | null
  /** epoch ms */
  zaman: number
}

/** Konsolun gördüğü kayıt: kaynağı ve kişileri de taşır. */
export type BildirimKaydi = Bildirim & {
  /** "konsol": yeni kimlik · "eski": eski web ucu (J-45) */
  kaynak: 'konsol' | 'eski'
  gonderen: string | null
  kaldirildi: number | null
  kaldiran: string | null
}

export type BildirimIstegi = {
  baslik: string
  metin: string
  onem: BildirimOnemi
  konum?: string
  buyukluk?: number
}

/** Yayındaki en yeni 5 bildirim (afetzede bandı). */
export function useAktifBildirimler() {
  return useQuery({
    queryKey: ['bildirimler', 'aktif'],
    queryFn: () => apiGet<Bildirim[]>('/api/bildirimler/aktif'),
  })
}

/** Konsol: yayındakiler ve geri çekilenler. */
export function useBildirimGecmisi() {
  return useQuery({
    queryKey: ['bildirimler', 'gecmis'],
    queryFn: () => apiGet<BildirimKaydi[]>('/api/bildirimler', { sinir: 30 }),
  })
}

export function useBildirimYayinla() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (govde: BildirimIstegi) => apiPost<BildirimKaydi>('/api/bildirimler', govde),
    onSettled: () => qc.invalidateQueries({ queryKey: ['bildirimler'] }),
  })
}

export function useBildirimKaldir() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiPost<BildirimKaydi>(`/api/bildirimler/${id}/kaldir`, {}),
    onSettled: () => qc.invalidateQueries({ queryKey: ['bildirimler'] }),
  })
}
