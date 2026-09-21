#!/usr/bin/env node
/* Keyfi değer denetimi — CLAUDE.md kural 6 / ARAYUZ §2.
   Tailwind'in keyfi değer sözdizimi (text-[13px], bg-[#0b0f17], p-[7px]) ve
   kaynakta doğrudan renk kodu yasaktır. Değerler yalnız src/stil/token.css'te durur. */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const KOK = fileURLToPath(new URL('..', import.meta.url))
const KAYNAK = join(KOK, 'src')
const TOKEN_DOSYASI = join(KAYNAK, 'stil', 'token.css')

const KURALLAR = [
  {
    ad: 'keyfi Tailwind değeri',
    desen: /\b[a-z-]+-\[[^\]]+\]/g,
    // token.css dışında hiçbir yerde olamaz
  },
  {
    ad: 'kaynakta ham renk kodu',
    desen: /#[0-9a-fA-F]{3,8}\b/g,
  },
  {
    ad: 'yasak görsel efekt',
    desen: /\b(backdrop-blur|drop-shadow-glow|glow-|animate-pulse|bg-gradient-to-)/g,
  },
]

const DISARIDA = new Set([TOKEN_DOSYASI, join(KAYNAK, 'harita', 'haritaStili.ts'), join(KAYNAK, 'harita', 'katmanlar.ts')])

function dosyalar(dizin) {
  return readdirSync(dizin).flatMap((ad) => {
    const yol = join(dizin, ad)
    return statSync(yol).isDirectory() ? dosyalar(yol) : [yol]
  })
}

let bulgu = 0
for (const yol of dosyalar(KAYNAK)) {
  if (!/\.(tsx?|css)$/.test(yol) || DISARIDA.has(yol)) continue
  const metin = readFileSync(yol, 'utf8')
  metin.split('\n').forEach((satir, i) => {
    for (const kural of KURALLAR) {
      for (const esleme of satir.matchAll(kural.desen)) {
        console.log(`${relative(KOK, yol)}:${i + 1}  ${kural.ad}: ${esleme[0]}`)
        bulgu++
      }
    }
  })
}

if (bulgu) {
  console.log(`\n${bulgu} keyfi değer bulundu. Değerleri src/stil/token.css'e taşı.`)
  process.exit(1)
}
console.log('Keyfi değer yok. Bütün değerler token dosyasından geliyor.')
