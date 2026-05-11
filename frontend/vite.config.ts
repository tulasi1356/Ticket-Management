import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Same-origin `/comments`, `/attachments`, … in dev avoids mixed origins and flaky file flows.
const RAILS_TARGET = process.env.VITE_PROXY_API ?? 'http://127.0.0.1:3000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/attachments': { target: RAILS_TARGET, changeOrigin: true },
      '/comments': { target: RAILS_TARGET, changeOrigin: true },
      '/tickets': { target: RAILS_TARGET, changeOrigin: true },
      '/users': { target: RAILS_TARGET, changeOrigin: true },
      '/projects': { target: RAILS_TARGET, changeOrigin: true },
      '/sprints': { target: RAILS_TARGET, changeOrigin: true },
    },
  },
})
