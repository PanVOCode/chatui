import { useRef, useState, useCallback } from 'react'

const HOLD_DURATION_MS  = 6000
const QUICK_PRESS_MS    = 200   // быстрее — обычная отправка

interface Options {
  onQuickSend: () => void
  onHoldComplete: () => void
}

export function useHoldEnter({ onQuickSend, onHoldComplete }: Options) {
  const [progress, setProgress] = useState(0) // 0..1
  const [isHolding, setIsHolding] = useState(false)

  const startTimeRef  = useRef<number>(0)
  const rafRef        = useRef<number | null>(null)
  const holdingRef    = useRef(false)

  function tick() {
    const elapsed = performance.now() - startTimeRef.current
    const p = Math.min(1, elapsed / HOLD_DURATION_MS)
    setProgress(p)
    if (p >= 1) {
      cleanupHold()
      onHoldComplete()
      return
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  function cleanupHold() {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    holdingRef.current = false
    setIsHolding(false)
    setProgress(0)
  }

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.metaKey || e.repeat) return
    if (holdingRef.current) return
    holdingRef.current = true
    startTimeRef.current = performance.now()
    setIsHolding(true)
    setProgress(0)
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const onKeyUp = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || !holdingRef.current) return
    const held = performance.now() - startTimeRef.current
    cleanupHold()
    if (held < QUICK_PRESS_MS) {
      onQuickSend()
    }
    // 200ms–6s: отмена без действия (ring появился и исчез)
    // >= 6s: уже обработано в tick()
  }, [onQuickSend])

  return { progress, isHolding, onKeyDown, onKeyUp }
}
