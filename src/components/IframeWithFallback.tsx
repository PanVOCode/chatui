import { useEffect, useState, type CSSProperties } from 'react'
import {
  injectEmbedCompat,
  injectFixedViewport,
  injectHideScrollbar,
  injectMobilePreviewViewport,
  PREVIEW_IFRAME_ATTRS,
} from '../lib/previewSrcDoc'
import { normalizeHttpUrl, resolveEmbedMode, type ResolvedEmbedMode } from '../lib/previewUrl'
import { stripHtmlMetaCsp } from '../lib/proxyHtmlPrep'

type FetchState = 'loading' | 'ready' | 'error'

const PROXIES = [
  (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
]

function injectBase(html: string, baseUrl: string): string {
  const tag = `<base href="${baseUrl}" target="_blank">`
  const lower = html.toLowerCase()
  const headIdx = lower.indexOf('<head>')
  if (headIdx !== -1) return html.slice(0, headIdx + 6) + tag + html.slice(headIdx + 6)
  const htmlIdx = lower.indexOf('<html')
  const afterHtml = htmlIdx !== -1 ? html.indexOf('>', htmlIdx) + 1 : 0
  return html.slice(0, afterHtml) + tag + html.slice(afterHtml)
}

export type UrlEmbedMode = 'auto' | 'native' | 'proxied'

export default function IframeWithFallback({
  src,
  paddingTop,
  title,
  viewportWidth,
  viewportHeight,
  hideScrollbar,
  embedMode = 'auto',
}: {
  src: string
  paddingTop: number
  title: string
  viewportWidth?: number
  viewportHeight?: number
  hideScrollbar?: boolean
  /** auto: HEAD через dev-сервер; native: iframe src=URL; proxied: HTML через CORS-прокси + srcDoc */
  embedMode?: UrlEmbedMode
}) {
  const fixedVp = viewportWidth != null && viewportHeight != null
  const normalizedUrl = normalizeHttpUrl(src)

  const [resolvedMode, setResolvedMode] = useState<ResolvedEmbedMode | null>(() =>
    embedMode === 'native' ? 'native' : embedMode === 'proxied' ? 'proxied' : null,
  )
  const [nativeLoaded, setNativeLoaded] = useState(false)

  const [proxyState, setProxyState] = useState<FetchState>('loading')
  const [srcDoc, setSrcDoc] = useState<string | null>(null)

  useEffect(() => {
    setNativeLoaded(false)
    if (embedMode === 'auto') {
      setResolvedMode(null)
      if (!normalizedUrl) return undefined
      let cancel = false
      void resolveEmbedMode(normalizedUrl).then((m) => {
        if (!cancel) setResolvedMode(m)
      })
      return () => {
        cancel = true
      }
    }
    setResolvedMode(embedMode === 'native' ? 'native' : 'proxied')
    return undefined
  }, [src, embedMode, normalizedUrl])

  useEffect(() => {
    if (resolvedMode !== 'proxied' || !normalizedUrl) return
    const ac = new AbortController()
    setProxyState('loading')
    setSrcDoc(null)

    ;(async () => {
      for (const makeUrl of PROXIES) {
        if (ac.signal.aborted) return
        try {
          const res = await fetch(makeUrl(normalizedUrl), {
            signal: ac.signal,
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
          })
          if (!res.ok) continue
          const html = await res.text()
          if (ac.signal.aborted) return
          let prepared = stripHtmlMetaCsp(html)
          if (hideScrollbar) {
            prepared = injectMobilePreviewViewport(prepared)
            prepared = injectHideScrollbar(prepared)
          } else if (fixedVp && viewportWidth != null) {
            prepared = injectFixedViewport(prepared, viewportWidth)
          }
          prepared = injectEmbedCompat(prepared)
          setSrcDoc(injectBase(prepared, normalizedUrl))
          setProxyState('ready')
          return
        } catch {
          // try next proxy
        }
      }
      if (!ac.signal.aborted) setProxyState('error')
    })()

    return () => ac.abort()
  }, [resolvedMode, normalizedUrl, fixedVp, viewportWidth, hideScrollbar])

  const base: CSSProperties = fixedVp
    ? {
        position: 'absolute',
        top: 0,
        left: 0,
        width: viewportWidth,
        height: viewportHeight,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 14,
        paddingTop,
        background: '#f5f5f7',
      }
    : {
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 14,
        paddingTop,
        background: '#f5f5f7',
      }

  if (!normalizedUrl) {
    return (
      <div style={base} role="alert">
        <p style={{ fontSize: 13, color: '#555', textAlign: 'center', maxWidth: 280 }}>
          Некорректный URL для превью.
        </p>
      </div>
    )
  }

  if (resolvedMode === null) {
    return (
      <div style={base} aria-label="Проверка возможности встраивания">
        <span
          className="anim-spin rounded-full"
          style={{
            width: 28,
            height: 28,
            border: '2.5px solid var(--color-accent)',
            borderTopColor: 'transparent',
            display: 'block',
          }}
          aria-hidden="true"
        />
        <p style={{ fontSize: 13, color: '#666', fontFamily: 'var(--font-body)' }}>
          Проверяю заголовки сайта…
        </p>
      </div>
    )
  }

  if (resolvedMode === 'native') {
    const wrap: CSSProperties = fixedVp
      ? {
          position: 'absolute',
          top: 0,
          left: 0,
          width: viewportWidth,
          height: viewportHeight,
          boxSizing: 'border-box',
          paddingTop,
          background: '#fff',
        }
      : {
          position: 'absolute',
          inset: 0,
          paddingTop,
          background: '#fff',
        }

    return (
      <div style={wrap}>
        {!nativeLoaded ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 14,
              background: '#f5f5f7',
            }}
            aria-busy="true"
            aria-label="Загрузка сайта"
          >
            <span
              className="anim-spin rounded-full"
              style={{
                width: 28,
                height: 28,
                border: '2.5px solid var(--color-accent)',
                borderTopColor: 'transparent',
                display: 'block',
              }}
              aria-hidden="true"
            />
            <p style={{ fontSize: 13, color: '#666', fontFamily: 'var(--font-body)' }}>Загружаю сайт…</p>
          </div>
        ) : null}
        <iframe
          key={`native-${normalizedUrl}`}
          {...PREVIEW_IFRAME_ATTRS}
          src={normalizedUrl}
          title={title}
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setNativeLoaded(true)}
          style={{
            display: 'block',
            width: '100%',
            height: paddingTop ? `calc(100% - ${paddingTop}px)` : '100%',
            border: 'none',
            background: '#fff',
            boxSizing: 'border-box',
          }}
        />
      </div>
    )
  }

  if (proxyState === 'loading') {
    return (
      <div style={base} aria-label="Загрузка сайта">
        <span
          className="anim-spin rounded-full"
          style={{
            width: 28,
            height: 28,
            border: '2.5px solid var(--color-accent)',
            borderTopColor: 'transparent',
            display: 'block',
          }}
          aria-hidden="true"
        />
        <p style={{ fontSize: 13, color: '#666', fontFamily: 'var(--font-body)' }}>
          Загружаю HTML через прокси…
        </p>
      </div>
    )
  }

  if (proxyState === 'error') {
    return (
      <div style={base} role="alert">
        <div style={{ fontSize: 28 }} aria-hidden="true">
          🌐
        </div>
        <p style={{ fontSize: 13, color: '#555', textAlign: 'center', maxWidth: 280, lineHeight: 1.6 }}>
          Не удалось загрузить сайт через прокси.
          <br />
          <span style={{ fontSize: 11, color: '#999' }}>Проверьте URL или попробуйте другой адрес.</span>
        </p>
        <a
          href={normalizedUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 12,
            color: '#6366f1',
            padding: '6px 16px',
            border: '1px solid rgba(99,102,241,.3)',
            borderRadius: 8,
            textDecoration: 'none',
            background: 'rgba(99,102,241,.06)',
          }}
        >
          Открыть напрямую ↗
        </a>
      </div>
    )
  }

  return (
    <iframe
      key={`proxied-${normalizedUrl}`}
      {...PREVIEW_IFRAME_ATTRS}
      srcDoc={srcDoc!}
      title={title}
      width={fixedVp ? viewportWidth : undefined}
      height={fixedVp ? viewportHeight : undefined}
      style={
        fixedVp
          ? {
              position: 'absolute',
              top: 0,
              left: 0,
              width: viewportWidth,
              height: viewportHeight,
              border: 'none',
              paddingTop,
              background: '#fff',
              display: 'block',
              boxSizing: 'border-box',
            }
          : {
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              border: 'none',
              paddingTop,
              background: '#fff',
            }
      }
    />
  )
}
