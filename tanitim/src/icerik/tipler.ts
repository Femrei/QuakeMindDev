/** Site metinleri tek yerde durur; ikinci dil eklenince yalnız yeni bir
    içerik dosyası yazılır, bileşenler değişmez. */
export type SiteIcerik = {
  site: { ad: string; unvan: string; aciklama: string }
  menu: Array<{ ad: string; hedef: string }>
  hero: {
    rozet: string
    baslik: string
    altBaslik: string
    dugmeler: Array<{ ad: string; hedef: string; birincil?: boolean }>
    kaynakNotu: string
  }
  sorun: { baslik: string; giris: string; maddeler: Array<{ baslik: string; metin: string }> }
  nasil: {
    baslik: string
    giris: string
    adimlar: Array<{ baslik: string; metin: string }>
    kanallar: Array<{ baslik: string; metin: string }>
    sozlesme: string
  }
  ekranlar: {
    baslik: string
    giris: string
    ogeler: Array<{ baslik: string; metin: string; gorsel: string | null; etiket: string }>
  }
  olcumler: {
    baslik: string
    giris: string
    kartlar: Array<{ deger: string; etiket: string; kosul: string }>
    dipnot: string
  }
  durustluk: { baslik: string; giris: string; maddeler: string[] }
  kimler: {
    baslik: string
    giris: string
    roller: Array<{ baslik: string; metin: string; maddeler: string[] }>
  }
  proje: {
    baslik: string
    giris: string
    kunye: Array<{ etiket: string; deger: string }>
    durum: string
  }
  altbilgi: { hak: string; not: string }
}
