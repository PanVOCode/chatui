import type { ReactNode } from 'react'

interface Props {
  open: boolean
  side: 'left' | 'right'
  width?: number
  title: string
  subtitle?: string
  icon?: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export default function Drawer({ open, side, width = 380, title, subtitle, icon, onClose, children, footer }: Props) {
  return (
    <div
      className="absolute inset-0 flex"
      style={{
        zIndex: 100,
        justifyContent: side === 'right' ? 'flex-end' : 'flex-start',
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(14,14,20,.5)',
          backdropFilter: 'blur(3px)',
          opacity: open ? 1 : 0,
          transition: 'opacity .25s ease',
          pointerEvents: open ? 'auto' : 'none',
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative z-10 h-full flex flex-col"
        style={{
          width,
          maxWidth: '90%',
          background: 'var(--color-s0)',
          borderLeft: side === 'right' ? '1px solid var(--color-border)' : 'none',
          borderRight: side === 'left' ? '1px solid var(--color-border)' : 'none',
          boxShadow: side === 'right' ? '-8px 0 40px rgba(0,0,0,.3)' : '8px 0 40px rgba(0,0,0,.3)',
          transform: open
            ? 'translateX(0)'
            : side === 'right' ? 'translateX(100%)' : 'translateX(-100%)',
          transition: 'transform .28s cubic-bezier(.4,0,.2,1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2 px-4 shrink-0"
          style={{ height: 48, borderBottom: '1px solid var(--color-border)' }}
        >
          {icon}
          <span className="text-[13px] font-semibold flex-1" style={{ color: 'var(--color-ink)' }}>{title}</span>
          {subtitle && (
            <span className="text-[9px]" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>{subtitle}</span>
          )}
          <button
            type="button" onClick={onClose} aria-label="Закрыть"
            className="interactive flex items-center justify-center w-[26px] h-[26px] rounded-md cursor-pointer"
            style={{ border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-muted)' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          {children}
        </div>

        {/* Footer */}
        {footer}
      </div>
    </div>
  )
}
