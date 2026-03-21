import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react'
import type { ScreenResolutionPreset } from '../data/previewResolutions'
import { prepareDesktopPreviewSrcDoc, prepareMobilePreviewSrcDoc, PREVIEW_IFRAME_ATTRS } from '../lib/previewSrcDoc'
import { normalizeHttpUrl } from '../lib/previewUrl'
import type { VariantData, VariantId, ViewMode } from '../types'
import IframeWithFallback from './IframeWithFallback'

interface Props {
  view: ViewMode
  variants: VariantData[]
  currentVariantId: VariantId
  desktopResolutionId: string
  mobileResolutionId: string
  onDesktopResolutionChange: (id: string) => void
  onMobileResolutionChange: (id: string) => void
  desktopPresets: ScreenResolutionPreset[]
  mobilePresets: ScreenResolutionPreset[]
  onSelectVariant: (id: VariantId) => void
  onExpandFullscreen: () => void
}

export default function CenterPreview({
  view, variants, currentVariantId,
  desktopResolutionId, mobileResolutionId,
  onDesktopResolutionChange, onMobileResolutionChange,
  desktopPresets, mobilePresets,
  onSelectVariant, onExpandFullscreen,
}: Props) {
  const variant = variants.find((v) => v.id === currentVariantId)
  const html = variant?.html ?? null
  const url  = variant?.url  ?? null
  const isGenerating = variant?.status === 'generating'

  const activePreset = useMemo(() => {
    const list = view === 'desktop' ? desktopPresets : mobilePresets
    const id = view === 'desktop' ? desktopResolutionId : mobileResolutionId
    return list.find((p) => p.id === id) ?? list[0]!
  }, [view, desktopPresets, mobilePresets, desktopResolutionId, mobileResolutionId])

  const onResChange = view === 'desktop' ? onDesktopResolutionChange : onMobileResolutionChange
  const resList = view === 'desktop' ? desktopPresets : mobilePresets
  const resValue = view === 'desktop' ? desktopResolutionId : mobileResolutionId

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0" data-tour="center-preview">
      {/* Variant tabs + resolution */}
      <div
        className="flex items-stretch shrink-0"
        style={{ height: 36, background: 'var(--color-s0)', borderBottom: '1px solid var(--color-border)' }}
      >
        {variants.map((v) => {
          const active = v.id === currentVariantId
          const gen = v.status === 'generating'
          return (
            <button
              key={v.id}
              onClick={() => onSelectVariant(v.id)}
              className="interactive flex items-center gap-1.5 px-4 cursor-pointer text-[11px] font-semibold"
              style={{
                background: 'transparent', border: 'none',
                borderBottom: `2px solid ${active ? 'var(--color-accent)' : 'transparent'}`,
                color: active ? 'var(--color-accent)' : 'var(--color-muted)',
              }}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${gen ? 'anim-blink' : ''}`}
                style={{
                  background: active && !gen ? 'var(--color-ok)' : gen ? 'var(--color-warn)' : 'var(--color-muted)',
                  opacity: active || gen ? 1 : .4,
                  boxShadow: active && !gen ? '0 0 6px rgba(16,185,129,.4)' : 'none',
                }}
              />
              Вариант {v.id}
            </button>
          )
        })}

        <div className="flex-1" />

        <div className="flex items-center gap-2 pr-3">
          <label className="flex items-center gap-1.5">
            <span className="sr-only">Разрешение превью</span>
            <select
              value={resValue} onChange={(e) => onResChange(e.target.value)}
              aria-label={`Разрешение ${view === 'desktop' ? 'Desktop' : 'Mobile'}`}
              className="interactive rounded px-1.5 py-0.5 text-[10px] cursor-pointer"
              style={{
                fontFamily: 'var(--font-mono)', color: 'var(--color-muted)',
                background: 'var(--color-s2)', border: '1px solid var(--color-border)',
              }}
            >
              {resList.map((p) => (
                <option key={p.id} value={p.id}>{p.width}×{p.height} · {p.share}</option>
              ))}
            </select>
          </label>
          <button
            type="button" onClick={onExpandFullscreen} title="Полноэкранный просмотр"
            disabled={!html && !url}
            className="interactive flex items-center justify-center w-6 h-6 rounded cursor-pointer"
            style={{ border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-muted)' }}
          ><ExpandIcon /></button>
        </div>
      </div>

      {/* Preview stage */}
      <div
        className="flex-1 min-h-0 flex flex-col overflow-hidden p-6"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(200,200,222,.15) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          backgroundColor: 'var(--color-bg)',
        }}
      >
        <p
          className="text-center text-[10px] pb-2 shrink-0 leading-snug max-w-2xl mx-auto px-2"
          style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}
        >
          Логический экран: <strong style={{ color: 'var(--color-ink)' }}>{activePreset.width}×{activePreset.height}</strong> CSS px
          {' · '}{activePreset.share}
          <br />
          <span className="opacity-80">
            {view === 'desktop'
              ? 'Сайт рендерится как на мониторе этого размера; рамка масштабирует картинку (брейкпоинты по ширине вьюпорта).'
              : 'iframe задаёт мобильный viewport (width=device-width → как на телефоне).'}
          </span>
        </p>
        {view === 'desktop' ? (
          <DesktopResolutionPreview
            logicalWidth={activePreset.width}
            logicalHeight={activePreset.height}
            html={html} url={url}
            variantId={currentVariantId}
            isGenerating={isGenerating}
          />
        ) : (
          <MobileResolutionPreview
            logicalWidth={activePreset.width}
            logicalHeight={activePreset.height}
            html={html} url={url}
            variantId={currentVariantId}
            isGenerating={isGenerating}
          />
        )}
      </div>
    </div>
  )
}

/* ─── Scale calculation ──────────────────────────────────────────────── */

const DESKTOP_CHROME_PX = 38
const MOBILE_STATUS_LOGICAL_PX = 22
const MOBILE_HOME_LOGICAL_PX = 8

function useFittedScale(
  measureRef: RefObject<HTMLElement | null>,
  logicalWidth: number,
  logicalHeight: number,
  chromeHeight: number,
) {
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const el = measureRef.current
    if (!el) return

    const run = () => {
      const rw = el.clientWidth
      const rh = el.clientHeight
      const availH = Math.max(0, rh - chromeHeight)
      if (logicalWidth <= 0 || logicalHeight <= 0 || rw <= 0) return
      const sx = rw / logicalWidth
      const sy = availH > 0 ? availH / logicalHeight : sx
      const s = Math.min(sx, sy, 1)
      setScale(s > 0 && Number.isFinite(s) ? s : 0.05)
    }

    run()
    const ro = new ResizeObserver(run)
    ro.observe(el)
    return () => ro.disconnect()
  }, [logicalWidth, logicalHeight, chromeHeight])

  return scale
}

/* ─── Desktop ────────────────────────────────────────────────────────── */

function DesktopResolutionPreview({
  logicalWidth: w, logicalHeight: h, html, url, variantId, isGenerating,
}: {
  logicalWidth: number; logicalHeight: number
  html: string | null; url: string | null
  variantId: VariantId; isGenerating: boolean
}) {
  const measureRef = useRef<HTMLDivElement>(null)
  const scale = useFittedScale(measureRef, w, h, DESKTOP_CHROME_PX)
  const visW = w * scale
  const visH = h * scale

  return (
    <div
      ref={measureRef}
      className="flex-1 min-h-0 min-w-0 w-full flex flex-col items-center justify-center gap-1"
      aria-label="Превью Desktop"
    >
      <div
        style={{
          width: visW,
          display: 'flex', flexDirection: 'column',
          borderRadius: 10, overflow: 'hidden',
          boxShadow: '0 0 0 1px rgba(255,255,255,.05), 0 10px 40px rgba(0,0,0,.25)',
        }}
      >
        <DesktopBrowserChrome url={url} />
        <div style={{ width: visW, height: visH, position: 'relative', overflow: 'hidden', background: '#fff' }}>
          <div style={{
            position: 'absolute', top: 0, left: 0,
            width: w, height: h,
            transform: `scale(${scale})`, transformOrigin: 'top left',
          }}>
            {url ? (
              <IframeWithFallback
                key={`desk-url-${variantId}-${w}x${h}`}
                src={url} paddingTop={0}
                title={`Сайт Desktop вариант ${variantId}`}
                viewportWidth={w} viewportHeight={h}
              />
            ) : html ? (
              <iframe
                key={`desk-${variantId}-${w}x${h}`}
                {...PREVIEW_IFRAME_ATTRS}
                srcDoc={prepareDesktopPreviewSrcDoc(html, w)}
                title={`Прототип Desktop вариант ${variantId}`}
                width={w} height={h}
                style={{ display: 'block', width: w, height: h, border: 'none', background: '#fff' }}
              />
            ) : (
              <div style={{ width: w, height: h, background: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <EmptyState isGenerating={isGenerating} />
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="text-[10px] shrink-0" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
        Масштаб: {(scale * 100).toFixed(0)}% (вьюпорт {w}×{h}px)
      </p>
      <ExternalUrlOpenLink url={url} />
    </div>
  )
}

function DesktopBrowserChrome({ url }: { url: string | null }) {
  return (
    <div
      aria-hidden="true"
      style={{
        height: DESKTOP_CHROME_PX, flexShrink: 0,
        background: 'linear-gradient(to bottom, #ebebeb, #d9d9d9)',
        borderBottom: '1px solid #c2c2c2',
        display: 'flex', alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', gap: 6, paddingLeft: 12, flexShrink: 0 }}>
        {(['#ff5f57', '#febc2e', '#28c840'] as const).map((c, i) => (
          <div
            key={i}
            style={{
              width: 12, height: 12, borderRadius: '50%', background: c,
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,.4), 0 1px 2px rgba(0,0,0,.2)',
            }}
          />
        ))}
      </div>
      <div style={{
        flex: 1, maxWidth: 400, margin: '0 auto', height: 24, borderRadius: 6,
        background: '#fff', border: '1px solid #ccc',
        display: 'flex', alignItems: 'center', paddingLeft: 8, paddingRight: 8, gap: 5, overflow: 'hidden',
      }}>
        <LockIcon />
        <span style={{
          fontSize: 11, color: '#555', fontFamily: 'var(--font-mono)', letterSpacing: '-.2px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
        }}>
          {url ? url.replace(/^https?:\/\//, '') : 'prototype.local'}
        </span>
      </div>
      <div style={{ width: 78, flexShrink: 0 }} />
    </div>
  )
}

/* ─── Mobile ─────────────────────────────────────────────────────────── */

function MobileResolutionPreview({
  logicalWidth: w, logicalHeight: h, html, url, variantId, isGenerating,
}: {
  logicalWidth: number; logicalHeight: number
  html: string | null; url: string | null
  variantId: VariantId; isGenerating: boolean
}) {
  const [time, setTime] = useState(() => fmtTime())
  const measureRef = useRef<HTMLDivElement>(null)
  const logicalPhoneH = h + MOBILE_STATUS_LOGICAL_PX + MOBILE_HOME_LOGICAL_PX
  const scale = useFittedScale(measureRef, w, logicalPhoneH, 0)
  const visW = w * scale
  const visPhoneH = logicalPhoneH * scale

  useEffect(() => {
    const id = setInterval(() => setTime(fmtTime()), 10_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      ref={measureRef}
      className="flex-1 min-h-0 min-w-0 w-full flex flex-col items-center justify-center gap-1"
      aria-label="Превью Mobile"
    >
      <div
        style={{
          width: visW, height: visPhoneH, borderRadius: 22, overflow: 'hidden',
          boxShadow: '0 0 0 1px rgba(255,255,255,.06), 0 14px 40px rgba(0,0,0,.3)',
          display: 'flex', flexDirection: 'column', background: '#fff',
        }}
      >
        <div style={{ width: visW, height: visPhoneH, position: 'relative', overflow: 'hidden', background: '#fff', flexShrink: 0 }}>
          <div style={{
            position: 'absolute', top: 0, left: 0,
            width: w, height: logicalPhoneH,
            transform: `scale(${scale})`, transformOrigin: 'top left',
            display: 'flex', flexDirection: 'column', background: '#fff',
          }}>
            {/* Status bar */}
            <div
              aria-hidden="true"
              style={{
                height: MOBILE_STATUS_LOGICAL_PX, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 10px', background: '#fff', borderBottom: '1px solid #ebebeb', boxSizing: 'border-box',
              }}
            >
              <span style={{
                fontSize: 10, fontWeight: 600, color: '#000',
                letterSpacing: '-0.2px', fontFamily: 'var(--font-mono)', lineHeight: 1,
                transform: 'translateX(10px)',
              }}>{time}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, transform: 'translateX(-10px)' }}>
                <SignalBars /><WifiIcon /><BatteryIcon />
              </div>
            </div>

            {/* Viewport */}
            <div style={{ width: w, height: h, position: 'relative', overflow: 'hidden', flexShrink: 0, background: '#fff' }}>
              {url ? (
                <IframeWithFallback
                  key={`mob-url-${variantId}-${w}x${h}`}
                  src={url} paddingTop={0}
                  title={`Сайт Mobile вариант ${variantId}`}
                  viewportWidth={w} viewportHeight={h} hideScrollbar
                />
              ) : html ? (
                <iframe
                  key={`mob-${variantId}-${w}x${h}`}
                  {...PREVIEW_IFRAME_ATTRS}
                  srcDoc={prepareMobilePreviewSrcDoc(html)}
                  title={`Прототип Mobile вариант ${variantId}`}
                  width={w} height={h}
                  style={{ display: 'block', width: w, height: h, border: 'none', background: '#fff' }}
                />
              ) : (
                <div style={{ width: w, height: h, background: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <EmptyState isGenerating={isGenerating} />
                </div>
              )}
            </div>

            {/* Home indicator */}
            <div
              aria-hidden="true"
              style={{
                height: MOBILE_HOME_LOGICAL_PX, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#fff', borderTop: '1px solid #f0f0f0', boxSizing: 'border-box',
              }}
            >
              <div style={{ width: '32%', maxWidth: 96, height: 3, borderRadius: 2, background: 'rgba(0,0,0,.14)' }} />
            </div>
          </div>
        </div>
      </div>
      <p className="text-[10px] shrink-0" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
        Масштаб: {(scale * 100).toFixed(0)}% (вьюпорт {w}×{h}px)
      </p>
      <ExternalUrlOpenLink url={url} />
    </div>
  )
}

/* ─── Shared pieces ──────────────────────────────────────────────────── */

function ExternalUrlOpenLink({ url }: { url: string | null }) {
  if (!url) return null
  const href = normalizeHttpUrl(url) ?? url
  return (
    <p className="text-center text-[10px] leading-snug max-w-2xl mx-auto px-2 mt-0.5 shrink-0"
      style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}
    >
      <a href={href} target="_blank" rel="noopener noreferrer"
        className="underline decoration-dotted underline-offset-2 font-semibold interactive"
        style={{ color: 'var(--color-accent)' }}
      >Открыть оригинал ↗</a>
    </p>
  )
}

function EmptyState({ isGenerating = false }: { isGenerating?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4 pointer-events-none select-none text-center px-6">
      <div
        className="flex items-center justify-center rounded-2xl"
        style={{ width: 56, height: 56, background: 'var(--color-s2)', border: '1px solid var(--color-border)' }}
        aria-hidden="true"
      >
        {isGenerating ? (
          <span className="anim-spin rounded-full block"
            style={{ width: 22, height: 22, border: '2px solid var(--color-accent)', borderTopColor: 'transparent' }} />
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="1.5">
            <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        )}
      </div>
      <div>
        <p className="text-[14px] font-semibold mb-1"
          style={{ color: 'var(--color-ink)', textWrap: 'balance' } as CSSProperties}>
          {isGenerating ? 'Генерирую прототип…' : 'Превью появится здесь'}
        </p>
        <p className="text-[12px] leading-relaxed"
          style={{ color: 'var(--color-muted)', textWrap: 'balance' } as CSSProperties}>
          {isGenerating ? 'Это займёт несколько секунд' : 'Напишите задачу в чате справа'}
        </p>
      </div>
    </div>
  )
}

function LockIcon() {
  return (
    <svg width="9" height="11" viewBox="0 0 24 28" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <rect x="3" y="12" width="18" height="14" rx="3" fill="#888" stroke="none" />
      <path d="M7 12V8a5 5 0 0110 0v4" fill="none" stroke="#888" />
    </svg>
  )
}

function ExpandIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  )
}

function fmtTime() {
  return new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
}

function SignalBars() {
  return (
    <svg width="13" height="9" viewBox="0 0 17 12" fill="black" aria-label="Сигнал" role="img">
      <rect x="0" y="8" width="3" height="4" rx="1" />
      <rect x="4.5" y="5" width="3" height="7" rx="1" />
      <rect x="9" y="2" width="3" height="10" rx="1" />
      <rect x="13.5" y="0" width="3" height="12" rx="1" opacity=".3" />
    </svg>
  )
}

function WifiIcon() {
  return (
    <svg width="12" height="9" viewBox="0 0 24 17" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" aria-label="Wi-Fi" role="img">
      <path d="M12 14.5a.5.5 0 100 1 .5.5 0 000-1z" fill="black" stroke="none" transform="scale(1.8) translate(-4.6,-4.8)" />
      <path d="M5.5 10.5C7.5 8.5 10 7.5 12 7.5s4.5 1 6.5 3" opacity=".6" />
      <path d="M2 7C5 4 8.5 2.5 12 2.5s7 1.5 10 4.5" opacity=".3" />
      <circle cx="12" cy="14.5" r="1.2" fill="black" stroke="none" />
    </svg>
  )
}

function BatteryIcon() {
  return (
    <svg width="19" height="9" viewBox="0 0 25 12" aria-label="Батарея 80%" role="img">
      <rect x="0.5" y="0.5" width="21" height="11" rx="3" ry="3" fill="none" stroke="black" strokeWidth="1.2" opacity=".35" />
      <rect x="2" y="2" width="16" height="8" rx="1.5" fill="black" />
      <path d="M22.5 4v4a2 2 0 000-4z" fill="black" opacity=".4" />
    </svg>
  )
}
