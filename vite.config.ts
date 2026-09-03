import fs from 'node:fs/promises'
import fsSync from 'node:fs'
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

// ---------------------------------------------------------------- library --
// The resources library is ~2.5 GB of largely commercially published books and
// this is a public site, so the files are never built, copied or deployed —
// public/learnlog/library.json carries metadata only. This plugin serves them
// read-only from the dev server so that, on this machine, a page marker opens
// the actual book at the actual page. `apply: 'serve'` means it cannot run in
// a build; __LEARNLOG_LOCAL__ folds to false there and the site falls back to
// the publisher's link.
const LIBRARY_ROOT = path.resolve(
  process.env.LEARNLOG_LIBRARY ?? path.join(process.env.HOME ?? '', 'Desktop', 'resources'),
)

const MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.m4v': 'video/x-m4v',
  '.md': 'text/plain; charset=utf-8',
  '.rtf': 'application/rtf',
  '.epub': 'application/epub+zip',
}

function libraryLocal(): Plugin {
  return {
    name: 'library-local',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/library', (req, res, next) => {
        const raw = decodeURIComponent((req.url ?? '').split('?')[0] ?? '')
        const file = path.resolve(LIBRARY_ROOT, `.${raw}`)

        // Containment check: resolve first, then confirm the result is still
        // inside the root, so `..` segments and symlinked escapes both fail.
        if (file !== LIBRARY_ROOT && !file.startsWith(LIBRARY_ROOT + path.sep)) {
          res.statusCode = 403
          res.end('outside the library')
          return
        }

        const ext = path.extname(file).toLowerCase()
        if (!MIME[ext]) {
          next()
          return
        }

        let stat: import('node:fs').Stats
        let real: string
        try {
          // realpath before stat: resolve() alone is blind to symlinks, so a
          // link inside the library could otherwise point anywhere on disk.
          real = fsSync.realpathSync(file)
          stat = fsSync.statSync(real)
          if (!stat.isFile()) throw new Error('not a file')
        } catch {
          next()
          return
        }

        if (real !== LIBRARY_ROOT && !real.startsWith(LIBRARY_ROOT + path.sep)) {
          res.statusCode = 403
          res.end('outside the library')
          return
        }

        // Range support: PDF viewers fetch byte ranges to page through a large
        // file without downloading it, and video needs it to seek at all.
        const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '')
        const headers = {
          'Content-Type': MIME[ext],
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'no-store',
        }

        if (range) {
          const start = range[1] ? Number(range[1]) : 0
          const end = range[2] ? Math.min(Number(range[2]), stat.size - 1) : stat.size - 1
          if (!(start >= 0 && start <= end && end < stat.size)) {
            res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` })
            res.end()
            return
          }
          res.writeHead(206, {
            ...headers,
            'Content-Range': `bytes ${start}-${end}/${stat.size}`,
            'Content-Length': end - start + 1,
          })
          fsSync.createReadStream(real, { start, end }).pipe(res)
          return
        }

        res.writeHead(200, { ...headers, 'Content-Length': stat.size })
        if (req.method === 'HEAD') res.end()
        else fsSync.createReadStream(real).pipe(res)
      })
    },
  }
}

export default defineConfig(({ command }) => ({
  plugins: [react(), legacyWebsitePath(), libraryLocal()],
  base: './',
  define: {
    // Serving only; a build never has the library behind it.
    __LEARNLOG_LOCAL__: JSON.stringify(command === 'serve'),
  },
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
}))
