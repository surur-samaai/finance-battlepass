import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function requireViteApiUrlInProduction(): Plugin {
  return {
    name: 'require-vite-api-url',
    config(_config, { mode }) {
      if (mode === 'production' && !process.env.VITE_API_URL) {
        throw new Error(
          'VITE_API_URL must be set for production builds (configure it in Netlify environment variables).',
        )
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), requireViteApiUrlInProduction()],
})
