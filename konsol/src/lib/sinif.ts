/** Koşullu sınıf birleştirici. Harici bağımlılık gerekmiyor. */
export function sn(...parcalar: Array<string | false | null | undefined>): string {
  return parcalar.filter(Boolean).join(' ')
}
