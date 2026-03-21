import type { Plugin } from 'vite'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

/**
 * HEAD/GET целевого URL, чтобы выбрать нативный iframe vs прокси+srcDoc (X-Frame-Options / CSP).
 * Без этого клиент не видит заголовки из-за CORS.
 */
function prototyperEmbedCheck(): Plugin {
  return {
    name: 'prototyper-embed-check',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const host = 'http://localhost'
        let pathname = ''
        try {
          pathname = new URL(req.url ?? '', host).pathname
        } catch {
          return next()
        }
        if (pathname !== '/__prototyper__/embed-check') return next()

        const urlObj = new URL(req.url ?? '', host)
        const target = urlObj.searchParams.get('url')
        if (!target || !/^https?:\/\//i.test(target)) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ error: 'bad_url' }))
          return
        }

        const ac = new AbortController()
        const timer = setTimeout(() => ac.abort(), 12_000)

        const probe = async (): Promise<Response> => {
          let r = await fetch(target, {
            method: 'HEAD',
            redirect: 'follow',
            signal: ac.signal,
            headers: { 'User-Agent': 'PrototyperEmbedCheck/1.0' },
          })
          if (r.status === 405 || r.status === 501) {
            r = await fetch(target, {
              method: 'GET',
              redirect: 'follow',
              signal: ac.signal,
              headers: {
                'User-Agent': 'PrototyperEmbedCheck/1.0',
                Range: 'bytes=0-0',
              },
            })
          }
          return r
        }

        try {
          const r = await probe()
          const xFrameOptions = r.headers.get('x-frame-options')
          const contentSecurityPolicy = r.headers.get('content-security-policy')
          if (r.body) {
            try {
              await r.body.cancel()
            } catch {
              /* ignore */
            }
          }
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(
            JSON.stringify({
              xFrameOptions,
              contentSecurityPolicy,
              ok: r.ok,
            }),
          )
        } catch {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ error: 'fetch_failed', ok: false }))
        } finally {
          clearTimeout(timer)
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [tailwindcss(), react(), prototyperEmbedCheck()],
})
