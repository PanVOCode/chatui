import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { buildTourSteps } from '../data/onboardingTour'

function modKeyLabel(): string {
  if (typeof navigator === 'undefined') return 'Ctrl'
  return /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent) ? '⌘' : 'Ctrl'
}

const PAD = 10
const TOUR_Z = 400_000
const VIEW_MARGIN = 12
const CARD_GAP = 20
const PANEL_W = 300

interface Box {
  left: number
  top: number
  width: number
  height: number
}

function boxesOverlap(a: Box, b: Box): boolean {
  return !(
    a.left + a.width <= b.left ||
    a.left >= b.left + b.width ||
    a.top + a.height <= b.top ||
    a.top >= b.top + b.height
  )
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

function hotBox(r: DOMRect): Box {
  return {
    left: r.left - PAD,
    top: r.top - PAD,
    width: r.width + PAD * 2,
    height: r.height + PAD * 2,
  }
}

function pickPanelPosition(
  hot: Box,
  vw: number,
  vh: number,
  panelW: number,
  panelH: number,
): { left: number; top: number; placement: 'right' | 'left' | 'below' | 'above' } {
  const M = VIEW_MARGIN

  const tryRight = (): { left: number; top: number; placement: 'right' } => {
    let left = hot.left + hot.width + CARD_GAP
    let top = hot.top + (hot.height - panelH) / 2
    left = clamp(left, M, vw - panelW - M)
    top = clamp(top, M, vh - panelH - M)
    return { left, top, placement: 'right' }
  }
  const tryLeft = (): { left: number; top: number; placement: 'left' } => {
    let left = hot.left - panelW - CARD_GAP
    let top = hot.top + (hot.height - panelH) / 2
    left = clamp(left, M, vw - panelW - M)
    top = clamp(top, M, vh - panelH - M)
    return { left, top, placement: 'left' }
  }
  const tryBelow = (): { left: number; top: number; placement: 'below' } => {
    let left = hot.left + (hot.width - panelW) / 2
    let top = hot.top + hot.height + CARD_GAP
    left = clamp(left, M, vw - panelW - M)
    top = clamp(top, M, vh - panelH - M)
    return { left, top, placement: 'below' }
  }
  const tryAbove = (): { left: number; top: number; placement: 'above' } => {
    let left = hot.left + (hot.width - panelW) / 2
    let top = hot.top - panelH - CARD_GAP
    left = clamp(left, M, vw - panelW - M)
    top = clamp(top, M, vh - panelH - M)
    return { left, top, placement: 'above' }
  }

  const order = [tryRight, tryLeft, tryBelow, tryAbove]
  for (const t of order) {
    const p = t()
    const pb: Box = { left: p.left, top: p.top, width: panelW, height: panelH }
    if (!boxesOverlap(pb, hot)) {
      return p
    }
  }

  return pickCornerAwayFromHot(hot, vw, vh, panelW, panelH, M)
}

/** Если зона подсветки огромная — ставим карточку в угол, дальше всего от центра hot. */
function pickCornerAwayFromHot(
  hot: Box,
  vw: number,
  vh: number,
  panelW: number,
  panelH: number,
  M: number,
): { left: number; top: number; placement: 'right' | 'left' | 'below' | 'above' } {
  const hx = hot.left + hot.width / 2
  const hy = hot.top + hot.height / 2
  const corners = [
    { left: M, top: M },
    { left: vw - panelW - M, top: M },
    { left: M, top: vh - panelH - M },
    { left: vw - panelW - M, top: vh - panelH - M },
  ]
  let best = corners[0]!
  let bestD = -1
  for (const c of corners) {
    const cx = c.left + panelW / 2
    const cy = c.top + panelH / 2
    const d = (cx - hx) ** 2 + (cy - hy) ** 2
    if (d > bestD) {
      bestD = d
      best = c
    }
  }

  const pcx = best.left + panelW / 2
  const pcy = best.top + panelH / 2
  let placement: 'right' | 'left' | 'below' | 'above'
  if (pcx > hx + 40) placement = 'right'
  else if (pcx < hx - 40) placement = 'left'
  else if (pcy > hy + 40) placement = 'below'
  else placement = 'above'

  return { left: best.left, top: best.top, placement }
}

/** Рисованная кривая «от руки» + наконечник. */
function casualArrowPath(
  hot: Box,
  panel: Box,
  placement: 'right' | 'left' | 'below' | 'above',
): string {
  const hx = hot.left + hot.width / 2
  const hy = hot.top + hot.height / 2
  const inset = 6

  let x1: number
  let y1: number
  let x2: number
  let y2: number

  switch (placement) {
    case 'right':
      x2 = hot.left + hot.width - inset
      y2 = clamp(hy, hot.top + inset, hot.top + hot.height - inset)
      x1 = panel.left - inset
      y1 = clamp(hy, panel.top + inset, panel.top + panel.height - inset)
      break
    case 'left':
      x2 = hot.left + inset
      y2 = clamp(hy, hot.top + inset, hot.top + hot.height - inset)
      x1 = panel.left + panel.width + inset
      y1 = clamp(hy, panel.top + inset, panel.top + panel.height - inset)
      break
    case 'below':
      x2 = clamp(hx, hot.left + inset, hot.left + hot.width - inset)
      y2 = hot.top + hot.height - inset
      x1 = clamp(hx, panel.left + inset, panel.left + panel.width - inset)
      y1 = panel.top - inset
      break
    case 'above':
      x2 = clamp(hx, hot.left + inset, hot.left + hot.width - inset)
      y2 = hot.top + inset
      x1 = clamp(hx, panel.left + inset, panel.left + panel.width - inset)
      y1 = panel.top + panel.height + inset
      break
  }

  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const px = (-dy / len) * 22
  const py = (dx / len) * 22
  const cx1 = x1 + dx * 0.28 + px * 0.5
  const cy1 = y1 + dy * 0.28 + py * 0.5
  const cx2 = x1 + dx * 0.72 - px * 0.35
  const cy2 = y1 + dy * 0.72 - py * 0.35

  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${cx1.toFixed(1)} ${cy1.toFixed(1)}, ${cx2.toFixed(1)} ${cy2.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`
}

function estimatePanelHeight(step: ReturnType<typeof buildTourSteps>[0]): number {
  let h = 200
  if (step.cheatsheet?.length) h = 400
  else if (step.shortcuts?.length) h += step.shortcuts.length * 36
  if (step.body.length > 120) h += 24
  return Math.min(h, 480)
}

interface Props {
  open: boolean
  onDismiss: () => void
  onComplete: () => void
}

export default function OnboardingTour({ open, onDismiss, onComplete }: Props) {
  const mod = useMemo(() => modKeyLabel(), [])
  const steps = useMemo(() => buildTourSteps(mod === '⌘' ? '⌘' : 'Ctrl'), [mod])
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [cardLayout, setCardLayout] = useState({
    top: 0,
    left: 0,
    width: PANEL_W,
    placement: 'right' as 'right' | 'left' | 'below' | 'above',
  })
  const [arrowD, setArrowD] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const step = steps[index]!
  const isLast = index === steps.length - 1

  const measureAndPlace = useCallback(() => {
    const s = steps[index]
    const vw = window.innerWidth
    const vh = window.innerHeight

    if (!s || s.placement === 'center' || !s.targetAttr) {
      setRect(null)
      setArrowD(null)
      setCardLayout({
        top: Math.max(VIEW_MARGIN, (vh - 400) / 2),
        left: Math.max(VIEW_MARGIN, (vw - Math.min(420, vw - 32)) / 2),
        width: Math.min(420, vw - 32),
        placement: 'right',
      })
      return
    }

    const el = document.querySelector(`[data-tour="${s.targetAttr}"]`)
    if (!el || !(el instanceof HTMLElement)) {
      setRect(null)
      setArrowD(null)
      setCardLayout({
        top: 80,
        left: VIEW_MARGIN,
        width: Math.min(420, vw - 24),
        placement: 'right',
      })
      return
    }

    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    const r = el.getBoundingClientRect()
    setRect(r)

    const hot = hotBox(r)
    const panelW = Math.min(PANEL_W, vw - 2 * VIEW_MARGIN)
    const estH = estimatePanelHeight(s)
    const pos = pickPanelPosition(hot, vw, vh, panelW, estH)
    setCardLayout({ top: pos.top, left: pos.left, width: panelW, placement: pos.placement })

    const panelBox: Box = { left: pos.left, top: pos.top, width: panelW, height: estH }
    setArrowD(casualArrowPath(hot, panelBox, pos.placement))
  }, [index, steps])

  useLayoutEffect(() => {
    if (!open) return
    measureAndPlace()
  }, [open, measureAndPlace])

  useLayoutEffect(() => {
    if (!open || step.placement === 'center' || !rect) return
    const el = panelRef.current
    if (!el) return

    const hot = hotBox(rect)
    const vw = window.innerWidth
    const vh = window.innerHeight
    const pr = el.getBoundingClientRect()
    const panelW = pr.width
    const panelH = pr.height

    const pos = pickPanelPosition(hot, vw, vh, panelW, panelH)
    const pb: Box = { left: pos.left, top: pos.top, width: panelW, height: panelH }

    setCardLayout((prev) => {
      if (
        Math.abs(prev.top - pos.top) < 1 &&
        Math.abs(prev.left - pos.left) < 1 &&
        prev.width === panelW &&
        prev.placement === pos.placement
      ) {
        return prev
      }
      return { top: pos.top, left: pos.left, width: panelW, placement: pos.placement }
    })

    setArrowD(casualArrowPath(hot, pb, pos.placement))
  }, [open, index, rect, step.placement, step.body, step.cheatsheet, step.shortcuts])

  useEffect(() => {
    if (!open) return
    const ro = new ResizeObserver(() => measureAndPlace())
    ro.observe(document.documentElement)
    const attr = steps[index]?.targetAttr
    if (attr) {
      const el = document.querySelector(`[data-tour="${attr}"]`)
      if (el instanceof HTMLElement) ro.observe(el)
    }
    const onScroll = () => measureAndPlace()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      ro.disconnect()
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [open, index, steps, measureAndPlace])

  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    if (!panel) return

    const focusables = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement)

    requestAnimationFrame(() => {
      const f = focusables()
      const primary = f.find((el) => el.classList.contains('btn-gradient')) ?? f[0]
      primary?.focus()
    })

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Tab') {
        const f = focusables()
        if (f.length === 0) return
        const ix = f.indexOf(document.activeElement as HTMLElement)
        if (e.shiftKey) {
          if (ix <= 0) {
            e.preventDefault()
            f[f.length - 1]?.focus()
          }
        } else if (ix === f.length - 1 || ix === -1) {
          e.preventDefault()
          f[0]?.focus()
        }
        return
      }

      if (e.key === 'Escape') {
        e.preventDefault()
        onDismiss()
        return
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        if (isLast) onComplete()
        else setIndex((i) => Math.min(i + 1, steps.length - 1))
        return
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        setIndex((i) => Math.max(0, i - 1))
        return
      }
      if (e.key === 'Enter') {
        const t = e.target as HTMLElement
        if (t.closest('button, a, [role="button"]')) return
        e.preventDefault()
        if (isLast) onComplete()
        else setIndex((i) => Math.min(i + 1, steps.length - 1))
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, index, isLast, onDismiss, onComplete, steps.length])

  useEffect(() => {
    if (open) setIndex(0)
  }, [open])

  if (!open) return null

  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  const panelAnim =
    reduceMotion ? '' : step.placement === 'center' ? 'onboarding-tour-panel--anim-center' : 'onboarding-tour-panel--anim'

  const shortcutRows = step.shortcuts ?? []
  const cheatsheet = step.cheatsheet ?? []
  const isCenter = step.placement === 'center'

  const node = (
    <div
      className="onboarding-tour-root"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: TOUR_Z,
        pointerEvents: 'auto',
        fontFamily: 'var(--font-body), system-ui, sans-serif',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-tour-title"
      aria-describedby="onboarding-tour-body"
    >
      {rect ? (
        <div
          aria-hidden
          className="onboarding-tour-spotlight"
          style={{
            position: 'fixed',
            left: rect.left - PAD,
            top: rect.top - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            borderRadius: 14,
            pointerEvents: 'none',
            zIndex: TOUR_Z + 1,
          }}
        />
      ) : (
        <div
          aria-hidden
          className="onboarding-tour-dim-full"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: TOUR_Z,
            pointerEvents: 'none',
          }}
        />
      )}

      {!isCenter && arrowD && (
        <svg
          className="onboarding-tour-arrow-layer fixed inset-0 w-full h-full"
          style={{ zIndex: TOUR_Z + 2 }}
          aria-hidden
        >
          <defs>
            <marker
              id="onboarding-tour-arrowhead"
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,7 L7,3.5 z" fill="#6366f1" />
            </marker>
          </defs>
          <path
            className="onboarding-tour-arrow-path"
            d={arrowD}
            markerEnd="url(#onboarding-tour-arrowhead)"
          />
        </svg>
      )}

      <div
        ref={panelRef}
        id="onboarding-tour-body"
        className={`onboarding-tour-panel ${panelAnim}`}
        style={{
          position: 'fixed',
          top: isCenter ? '50%' : cardLayout.top,
          left: isCenter ? '50%' : cardLayout.left,
          transform: isCenter ? 'translate(-50%, -50%)' : 'none',
          width: isCenter ? 'min(420px, calc(100vw - 32px))' : cardLayout.width,
          maxHeight: 'min(62vh, 460px)',
          overflow: 'auto',
          zIndex: TOUR_Z + 3,
          padding: '18px 18px 14px',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <span className="onboarding-tour-step-pill">
            Шаг {index + 1} из {steps.length}
          </span>
        </div>

        <h2
          id="onboarding-tour-title"
          className="m-0 mb-2 text-[18px] font-extrabold leading-tight tracking-tight"
          style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display), Syne, sans-serif' }}
        >
          {step.title}
        </h2>

        <p className="m-0 mb-3 text-[13px] leading-relaxed" style={{ color: 'var(--color-muted-hi)' }}>
          {step.body}
        </p>

        {shortcutRows.length > 0 && (
          <ul className="list-none m-0 mb-3 p-0 flex flex-col gap-2.5" aria-label="Сочетания клавиш для этого шага">
            {shortcutRows.map((row, i) => (
              <li key={i} className="onboarding-tour-shortcut-row">
                <span className="onboarding-tour-combo">{row.combo}</span>
                <span className="onboarding-tour-desc">{row.description}</span>
              </li>
            ))}
          </ul>
        )}

        {cheatsheet.length > 0 && (
          <div
            className="onboarding-tour-panel-inner-glass rounded-[10px] mb-3 overflow-hidden"
            role="region"
            aria-label="Все горячие клавиши"
          >
            <table className="w-full text-left border-collapse text-[12px]">
              <tbody>
                {cheatsheet.map((row, i) => (
                  <tr
                    key={i}
                    style={{
                      borderTop: i === 0 ? 'none' : '1px solid var(--color-border)',
                    }}
                  >
                    <th
                      scope="row"
                      className="align-top py-2.5 px-3 font-mono font-semibold whitespace-nowrap"
                      style={{
                        color: 'var(--color-ink)',
                        background: 'rgba(237, 237, 248, 0.65)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                      }}
                    >
                      {row.combo}
                    </th>
                    <td className="align-top py-2.5 pr-3 pl-2" style={{ color: 'var(--color-muted-hi)' }}>
                      {row.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div
          className="flex flex-wrap items-center gap-2 pt-3"
          style={{ borderTop: '1px solid rgba(226, 226, 240, 0.85)' }}
        >
          <button type="button" onClick={onDismiss} className="onboarding-tour-btn-ghost">
            Закрыть тур
          </button>
          <p className="m-0 w-full text-[11px] order-last sm:order-none sm:w-auto sm:flex-1 sm:min-w-[120px]" style={{ color: 'var(--color-muted)' }}>
            Автозапуск отключится. Снова открыть: кнопка «?» в шапке.
          </p>
          {index > 0 && (
            <button type="button" onClick={() => setIndex((i) => i - 1)} className="onboarding-tour-btn-back ml-auto sm:ml-0">
              Назад
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (isLast) onComplete()
              else setIndex((i) => i + 1)
            }}
            className="btn-gradient px-4 py-2 rounded-lg text-white text-[12px] font-semibold cursor-pointer"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {isLast ? 'Завершить обзор' : 'Далее'}
          </button>
        </div>

        <p className="onboarding-tour-foot m-0 mt-3">
          В туре: ← ↑ назад · → ↓ далее · Enter — далее (если не на кнопке) · Esc — «Закрыть тур»
        </p>
      </div>
    </div>
  )

  return createPortal(node, document.body)
}
