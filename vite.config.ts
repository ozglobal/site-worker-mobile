import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"
import path from "node:path"

export default defineConfig({
  root: __dirname,

  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icons/**/*.png"],
      manifest: false, // use public/manifest.json
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallbackDenylist: [/\.pdf$/, /^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),

      // keep ONLY if this folder exists in this repo
      // "@shared-icons": path.resolve(__dirname, "packages/shared-icons"),
    },
  },

  server: {
    port: 5200,
    host: true,
    allowedHosts: [
      ".loca.lt",
      ".ngrok.io",
      ".ngrok-free.app",
      ".trycloudflare.com",
    ],
    proxy: {
      '/api': {
        target: 'https://workerm.kwork365.com',
        changeOrigin: true,
        secure: true,
      },
      '/juso-api': {
        target: 'https://business.juso.go.kr',
        changeOrigin: true,
        secure: true,
        rewrite: (path: string) => path.replace(/^\/juso-api/, ''),
      },
    },
  },

  build: {
    outDir: "dist",
    emptyOutDir: true,
  },

  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "react-i18next",
      "i18next",
      "@tabler/icons-react",
      "lucide-react",
      "@mui/material",
      "@mui/icons-material",
      "date-fns",
    ],
  },
})