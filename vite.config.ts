import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// base: './' — GitHub Pages'da HashRouter bilan ishlaydi
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Русский шаг за шагом',
        short_name: 'Русский',
        description: "Shaxsiy rus tili o'rganish ilovasi",
        lang: 'uz',
        display: 'standalone',
        background_color: '#FBFBF8',
        theme_color: '#FBFBF8',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // Ilova qobig'i keshda — offline ochiladi; ma'lumot Supabase'dan
        globPatterns: ['**/*.{js,css,html,png,svg}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  base: './',
});
