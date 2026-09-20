import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './', // Ruta base relativa para despliegue flexible en cualquier hosting o subdirectorio
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-mqtt': ['mqtt'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true, // Permite acceder desde la red local (móvil/tablet en misma WiFi)
  },
  preview: {
    port: 4173,
    host: true,
  }
})