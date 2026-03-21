import { useState } from 'react'
import type { ViewMode } from '../types'

interface Props {
  projectName: string
  view: ViewMode
  tokenCount: number
  canUndo: boolean
  canRedo: boolean
  onViewChange: (v: ViewMode) => void
  onProjectRename: (name: string) => void
  onUndo: () => void
  onRedo: () => void
  onOpenTour: () => void
}

const COLLABORATORS = [
  { initials: 'АМ', color: '#6366f1' },
  { initials: 'МК', color: '#10b981' },
]

function formatTokens(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace('.0', '')}k` : String(n)
}

export default function TopBar({
  projectName, view, tokenCount, canUndo, canRedo,
  onViewChange, onProjectRename, onUndo, onRedo, onOpenTour,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(projectName)

  function commitRename() {
    const name = draft.trim()
    if (name) onProjectRename(name)
    else setDraft(projectName)
    setEditing(false)
  }

  return (
    <header
      className="flex items-center gap-2 px-3 shrink-0"
      style={{ height: 44, background: 'var(--color-s0)', borderBottom: '1px solid var(--color-border)' }}
    >
      <div className="flex items-center gap-1.5" role="group" aria-label="История изменений">
        <TbBtn icon={<UndoIcon />} label="Отменить" disabled={!canUndo} onClick={onUndo} />
        <TbBtn icon={<RedoIcon />} label="Вернуть" disabled={!canRedo} onClick={onRedo} />
      </div>

      <div style={{ width: 1, height: 20, background: 'var(--color-border)', flexShrink: 0 }} />

      <div className="flex items-center gap-2">
        <div
          className="flex items-center justify-center rounded-md shrink-0"
          style={{ width: 22, height: 22, background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-2))' }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        {editing ? (
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setDraft(projectName); setEditing(false) } }}
            autoFocus
            autoComplete="off"
            className="text-[13px] font-semibold px-1.5 rounded outline-none"
            style={{ background: 'var(--color-s2)', border: '1px solid var(--color-accent)', color: 'var(--color-ink)', fontFamily: 'var(--font-body)', width: 180 }}
          />
        ) : (
          <button
            onClick={() => { setDraft(projectName); setEditing(true) }}
            className="interactive rounded px-1 cursor-pointer text-left"
            style={{ background: 'transparent', border: 'none', color: 'var(--color-ink)' }}
          >
            <span className="text-[13px] font-semibold" style={{ fontFamily: 'var(--font-body)' }}>{projectName}</span>
          </button>
        )}
      </div>

      <div className="flex-1" />

      <div
        className="flex p-0.5 rounded-md"
        role="group"
        aria-label="Переключение вида"
        style={{ background: 'var(--color-s2)', border: '1px solid var(--color-border)' }}
      >
        <ViewBtn active={view === 'desktop'} onClick={() => onViewChange('desktop')} label="Desktop" />
        <ViewBtn active={view === 'phone'}   onClick={() => onViewChange('phone')}   label="Phone"   />
      </div>

      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md"
        style={{ background: 'var(--color-s1)', border: '1px solid var(--color-border)' }}
        title="Использовано токенов"
      >
        <span style={{ color: 'var(--color-muted)', fontSize: 10 }}>⬡</span>
        <span className="text-[11px] font-semibold" style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>
          {formatTokens(tokenCount)}
        </span>
      </div>

      <TbBtn icon={<HelpIcon />} label="Открыть тур" onClick={onOpenTour} />

      <div className="flex items-center" role="group" aria-label="Участники">
        {COLLABORATORS.map((c, i) => (
          <div
            key={i}
            title={c.initials}
            className="flex items-center justify-center rounded-full text-white font-semibold"
            style={{
              width: 24, height: 24, background: c.color, border: '2px solid var(--color-s0)',
              fontSize: 8, fontFamily: 'var(--font-display)',
              marginLeft: i === 0 ? 0 : -6, zIndex: COLLABORATORS.length - i, position: 'relative',
            }}
          >{c.initials}</div>
        ))}
      </div>
    </header>
  )
}

function TbBtn({ icon, label, disabled, onClick }: { icon: React.ReactNode; label: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button" onClick={onClick} disabled={disabled} title={label} aria-label={label}
      className="interactive flex items-center justify-center w-7 h-7 rounded-md cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
      style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-muted-hi)' }}
    >{icon}</button>
  )
}

function ViewBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick} aria-pressed={active}
      className="interactive text-[10px] font-medium px-3 py-1 rounded cursor-pointer"
      style={{
        fontFamily: 'var(--font-mono)', border: 'none',
        background: active ? 'var(--color-accent)' : 'transparent',
        color: active ? '#fff' : 'var(--color-muted)',
        boxShadow: active ? '0 2px 8px rgba(99,102,241,.3)' : 'none',
      }}
    >{label}</button>
  )
}

function UndoIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1014.85-3.36L3.51 4.51"/></svg> }
function RedoIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-14.85-3.36L20.49 4.51"/></svg> }
function HelpIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> }
