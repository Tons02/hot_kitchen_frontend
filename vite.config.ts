import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        // Long-lived vendor chunks stay cached in the browser across app deploys.
        codeSplitting: {
          groups: [
            {
              name: 'vendor-react',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/,
              priority: 30,
            },
            {
              // Only loaded by pages that play an animation.
              name: 'vendor-lottie',
              test: /[\\/]node_modules[\\/]lottie-web[\\/]/,
              priority: 25,
            },
            {
              name: 'vendor-redux',
              test: /[\\/]node_modules[\\/](@reduxjs|redux|react-redux|redux-thunk|reselect|immer)[\\/]/,
              priority: 20,
            },
            {
              name: 'vendor-ui',
              test: /[\\/]node_modules[\\/](radix-ui|@radix-ui|@floating-ui|sonner|next-themes|lucide-react)[\\/]/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
})
