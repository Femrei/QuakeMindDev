// @ts-check
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'

// Tanıtım sitesi: varsayılan olarak sıfır istemci JavaScript'i üretir, statik
// dosyalara derlenir. Uygulama (konsol/) ayrı; ikisi tasarim/token.css'i paylaşır.
export default defineConfig({
  // Dil yapısı iki dile hazır: şimdilik yalnız Türkçe, /en sonra eklenecek.
  i18n: {
    defaultLocale: 'tr',
    locales: ['tr'],
    routing: { prefixDefaultLocale: false },
  },
  server: { host: '127.0.0.1', port: 3300 },
  vite: {
    plugins: [tailwindcss()],
    // Ortak token dosyası depo kökündeki tasarim/ klasöründe.
    server: { fs: { allow: ['..'] } },
  },
})
