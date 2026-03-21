export type ResolvedEmbedMode = 'native' | 'proxied'

export interface EmbedCheckResult {
  xFrameOptions: string | null
  contentSecurityPolicy: string | null
  ok: boolean
}

const EMBED_CHECK_PATH = '/__prototyper__/embed-check'

/** Нормализует URL для превью (https по умолчанию). */
export function normalizeHttpUrl(raw: string): string | null {
  const t = raw.trim()
  if (!t) return null
  if (/^https?:\/\//i.test(t)) return t
  if (/^\/\//.test(t)) return `https:${t}`
  return `https://${t.replace(/^\/+/, '')}`
}

function cspBlocksCrossOriginEmbed(csp: string | null): boolean {
  if (!csp) return false
  if (/frame-ancestors\s+['"]?none['"]?/i.test(csp)) return true
  // 'self' = только тот же origin что у документа ответа (чужой сайт), не localhost
  if (/frame-ancestors\s+['"]self['"]/i.test(csp)) return true
  return false
}

/** По заголовкам ответа цели решаем: нативный iframe или прокси+srcDoc. */
export function embedModeFromHeaders(check: EmbedCheckResult): ResolvedEmbedMode {
  if (!check.ok) return 'proxied'
  const xfo = (check.xFrameOptions || '').trim().toLowerCase()
  if (xfo.includes('deny')) return 'proxied'
  if (xfo.includes('sameorigin')) return 'proxied'
  if (cspBlocksCrossOriginEmbed(check.contentSecurityPolicy)) return 'proxied'
  return 'native'
}

let cache: Map<string, { mode: ResolvedEmbedMode; at: number }> | null = null
const CACHE_TTL_MS = 5 * 60 * 1000

function getCache(): Map<string, { mode: ResolvedEmbedMode; at: number }> {
  if (!cache) cache = new Map()
  return cache
}

/**
 * Запрос к dev-middleware Vite (в prod обычно 404 → proxied).
 * Кэшируем, чтобы не дёргать HEAD при каждом ресайзе.
 */
export async function resolveEmbedMode(url: string): Promise<ResolvedEmbedMode> {
  const c = getCache()
  const now = Date.now()
  const hit = c.get(url)
  if (hit && now - hit.at < CACHE_TTL_MS) return hit.mode

  try {
    const r = await fetch(`${EMBED_CHECK_PATH}?url=${encodeURIComponent(url)}`)
    if (!r.ok) {
      c.set(url, { mode: 'proxied', at: now })
      return 'proxied'
    }
    const j = (await r.json()) as EmbedCheckResult
    const mode = embedModeFromHeaders(j)
    c.set(url, { mode, at: now })
    return mode
  } catch {
    c.set(url, { mode: 'proxied', at: now })
    return 'proxied'
  }
}
