import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { buildFullscreenSrcDoc, PREVIEW_IFRAME_ATTRS } from '../lib/previewSrcDoc'
import type { VariantId, ViewMode } from '../types'
import IframeWithFallback from './IframeWithFallback'

interface Props {
  open: boolean
  html: string | null
  url: string | null
  variantId: VariantId
  view: ViewMode
  logicalWidth: number
  logicalHeight: number
  onClose: () => void
}

export default function FullscreenOverlay({
  open,
  html,
  url,
  variantId,
  view,
  logicalWidth: lw,
  logicalHeight: lh,
  onClose,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  const srcDoc = useMemo(
    () => (html ? buildFullscreenSrcDoc(html, view, lw) : null),
    [html, view, lw],
  )

  const hasContent = Boolean(html && srcDoc) || Boolean(url)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useLayoutEffect(() => {
    if (!open) return
    const el = stageRef.current
    if (!el) return

    const run = () => {
      const maxW = el.clientWidth
      const maxH = el.clientHeight
      if (lw <= 0 || lh <= 0 || maxW <= 0 || maxH <= 0) return
      const s = Math.min(maxW / lw, maxH / lh)
      setScale(s > 0 && Number.isFinite(s) ? s : 0.05)
    }

    run()
    const ro = new ResizeObserver(run)
    ro.observe(el)
    window.addEventListener('resize', run)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', run)
    }
  }, [open, lw, lh])

  if (!open || !hasContent) return null

  const visW = lw * scale
  const visH = lh * scale
  const mobileLike = view === 'phone'

  const overlay = (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 200_000,
        padding: 'max(12px, 2.5vh) max(12px, 2.5vw)',
        boxSizing: 'border-box',
      }}
    >
      {/* Фон на весь экран — под контентом */}
      <div
        className="absolute inset-0 cursor-default"
        style={{ background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
        aria-hidden
      />

      {/* Сцена 95 % — клик по пустому месту сцены закрывает */}
      <div
        ref={stageRef}
        className="relative z-10 flex items-center justify-center"
        style={{
          width: '95vw',
          height: '95vh',
          maxWidth: '95vw',
          maxHeight: '95vh',
          boxSizing: 'border-box',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Полноэкранный просмотр варианта ${variantId}, ${lw}×${lh}`}
          style={{
            width: visW,
            height: visH,
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 10,
            background: '#fff',
            boxShadow: '0 24px 80px rgba(0,0,0,.4)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: lw,
              height: lh,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            {url ? (
              <IframeWithFallback
                key={`fs-url-${variantId}-${url}`}
                src={url}
                paddingTop={0}
                title={`Full-size сайт вариант ${variantId}`}
                viewportWidth={lw}
                viewportHeight={lh}
                hideScrollbar={mobileLike}
              />
            ) : srcDoc ? (
              <iframe
                key={`fs-doc-${variantId}-${lw}x${lh}`}
                {...PREVIEW_IFRAME_ATTRS}
                title={`Full-size вариант ${variantId}`}
                srcDoc={srcDoc}
                width={lw}
                height={lh}
                style={{
                  display: 'block',
                  width: lw,
                  height: lh,
                  border: 'none',
                  background: '#fff',
                }}
              />
            ) : null}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Закрыть полноэкранный просмотр"
        className="interactive fixed flex items-center justify-center rounded-full border-none cursor-pointer"
        style={{
          top: 'max(12px, 2.5vh)',
          right: 'max(12px, 2.5vw)',
          width: 44,
          height: 44,
          zIndex: 200_001,
          background: 'rgba(0,0,0,.2)',
          color: '#fff',
        }}
      >
        <CloseXIcon />
      </button>
    </div>
  )

  return createPortal(overlay, document.body)
}

function CloseXIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
      style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.85))' }}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
