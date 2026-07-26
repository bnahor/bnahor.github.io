import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react-swc'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

// The site was served from /website/ until it moved to the user-site root.
// Links already sent out — most importantly the résumé URL in submitted job
// applications — still point there, and GitHub Pages cannot rewrite paths.
// Emitting copies at build time keeps public/ the single source of truth.
const LEGACY_ASSETS = ['rohan-bahl-resume.pdf', 'og-card.png']

function legacyWebsitePath(): Plugin {
  return {
    name: 'legacy-website-path',
    apply: 'build',
    closeBundle: async () => {
      const legacyDir = path.join(rootDir, 'dist', 'website')
      await fs.mkdir(legacyDir, { recursive: true })

      for (const asset of LEGACY_ASSETS) {
        await fs.copyFile(path.join(rootDir, 'dist', asset), path.join(legacyDir, asset))
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), legacyWebsitePath()],
  base: './',
  esbuild: {
    drop: ['debugger'],
    pure: ['console.log', 'console.info', 'console.debug'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/framer-motion')) {
            return 'vendor-react'
          }
        },
      },
    },
    minify: 'esbuild',
    sourcemap: false,
    target: 'es2020',
    chunkSizeWarningLimit: 600,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion'],
  },
})
