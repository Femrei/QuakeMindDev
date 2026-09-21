import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Konsol statik dosyalara derlenir; çalışması için Node sunucusu gerekmez (MIMARI.md §7).
// Geliştirmede /api ve /api/live (SSE) FastAPI'ye vekillenir.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    host: '127.0.0.1',
    port: 3200,
    // Token dosyası depo kökündeki tasarim/ klasöründe; site ile ortak.
    fs: { allow: ['..'] },
    proxy: {
      '/api': {
        target: process.env.QM_API ?? 'http://127.0.0.1:8000',
        changeOrigin: true,
        // SSE akışının tamponlanmaması için sıkıştırma kapalı
        configure: (proxy) => {
          proxy.on('proxyReq', (req) => req.setHeader('accept-encoding', 'identity'))
        },
      },
    },
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        // Harita motoru ayrı parçada: afetzede ekranı bu parçayı indirmez.
        manualChunks: {
          harita: ['maplibre-gl', '@deck.gl/core', '@deck.gl/layers', '@deck.gl/mapbox'],
        },
      },
    },
  },
})
