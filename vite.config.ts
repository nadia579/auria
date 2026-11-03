import react from '@vitejs/plugin-react'
import Icons from 'unplugin-icons/vite'
import { FileSystemIconLoader } from 'unplugin-icons/loaders'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => ({
  // On GitHub Pages the app lives at https://nadia579.github.io/auria/
  base: command === 'build' || isPreview ? '/auria/' : '/',

  plugins: [
    react(),

    // Icons: "~icons/material-symbols/..." from Iconify, "~icons/auria/..." from src/icons/auria
    Icons({
      compiler: 'jsx',
      jsx: 'react',
      customCollections: {
        auria: FileSystemIconLoader('./src/icons/auria'),
      },
    }),

    // PWA: generates manifest and service worker (offline cache, automatic updates)
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'Auria',
        short_name: 'Auria',
        description: "Calendario del ciclo e diario dell'emicrania",
        lang: 'it',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#2A0838',
        theme_color: '#3D004F',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
}))
