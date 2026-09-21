import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/** maplibre-gl ve deck.gl ile onların bağımlılıkları (npm ls ile çıkarıldı). */
const HARITA_YIGINI =
  /[\\/]node_modules[\\/](maplibre-gl|@maplibre|@mapbox|@deck\.gl|@luma\.gl|@loaders\.gl|@math\.gl|@probe\.gl|mjolnir\.js|gl-matrix|earcut|kdbush|apache-arrow|flatbuffers)[\\/]/

/** Rollup ve Vite'ın ortak yardımcıları: hem harita yığını hem uygulama kullanır. */
const ORTAK_YARDIMCI = /^\0(commonjsHelpers\.js|vite\/preload-helper)/

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
        // Harita motoru ayrı parçada: afetzede ve giriş ekranı bu parçayı indirmez.
        // Nesne biçimi ({ harita: ['maplibre-gl', ...] }) Rollup'ın ortak
        // yardımcılarını (dinamik içe aktarma ön-yükleyicisi, CommonJS
        // yardımcıları) da bu parçaya çekiyordu; giriş dosyası o yardımcılar için
        // 2 MB'lık parçayı statik içe aktarıyor, her ekran haritayı indiriyordu
        // (J-43 ölçümü: afetzede ekranı 637,6 KB gzip JS). Burada yalnız harita
        // yığınının paketleri seçilir.
        manualChunks(id) {
          if (HARITA_YIGINI.test(id)) return 'harita'
          // Bir parçaya atanan modülün atanmamış bağımlılıkları o parçaya çekilir;
          // bu iki yardımcı ayrılmazsa yine harita parçasına düşer.
          if (ORTAK_YARDIMCI.test(id)) return 'yardimci'
        },
      },
    },
  },
})
