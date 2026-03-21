import type { DrawerKind, Requirements, AgentStep } from '../types'

interface Props {
  activeDrawer: DrawerKind
  requirements: Requirements
  agentStep: AgentStep
  onToggle: (kind: DrawerKind) => void
}

export default function IconRail({ activeDrawer, requirements, agentStep, onToggle }: Props) {
  const hasDocs = Boolean(requirements.business.raw || requirements.guideline.raw)
  const isWorking = agentStep > 0 && agentStep < 4

  return (
    <nav
      className="flex flex-col items-center py-2 gap-1 shrink-0"
      style={{ width: 48, background: 'var(--color-s0)', borderRight: '1px solid var(--color-border)' }}
      aria-label="Панели"
    >
      <RailBtn
        icon={<DocIcon />}
        label="Документы"
        active={activeDrawer === 'docs'}
        badge={hasDocs}
        onClick={() => onToggle(activeDrawer === 'docs' ? null : 'docs')}
      />
      <RailBtn
        icon={<BoltIcon />}
        label="Агент"
        active={activeDrawer === 'agent'}
        badgeWarn={isWorking}
        onClick={() => onToggle(activeDrawer === 'agent' ? null : 'agent')}
      />
      <div style={{ width: 22, height: 1, background: 'var(--color-border)', margin: '4px 0' }} />
      <RailBtn
        icon={<ChatIcon />}
        label="Чат"
        active={activeDrawer === 'chat'}
        onClick={() => onToggle(activeDrawer === 'chat' ? null : 'chat')}
      />
      <div className="flex-1" />
      <RailBtn icon={<GearIcon />} label="Настройки" active={false} onClick={() => {}} />
    </nav>
  )
}

function RailBtn({ icon, label, active, badge, badgeWarn, onClick }: {
  icon: React.ReactNode; label: string; active: boolean
  badge?: boolean; badgeWarn?: boolean; onClick: () => void
}) {
  return (
    <button
      type="button" onClick={onClick} title={label} aria-label={label} aria-pressed={active}
      className="interactive flex items-center justify-center w-[34px] h-[34px] rounded-lg cursor-pointer relative"
      style={{
        background: active ? 'rgba(99,102,241,.12)' : 'transparent',
        border: `1px solid ${active ? 'rgba(99,102,241,.25)' : 'transparent'}`,
        color: active ? 'var(--color-accent)' : 'var(--color-muted)',
      }}
    >
      {icon}
      {badge && (
        <span className="absolute top-[5px] right-[5px] w-1.5 h-1.5 rounded-full"
          style={{ background: 'var(--color-ok)', boxShadow: '0 0 6px rgba(16,185,129,.5)' }} />
      )}
      {badgeWarn && (
        <span className="absolute top-[5px] right-[5px] w-1.5 h-1.5 rounded-full anim-blink"
          style={{ background: 'var(--color-warn)', boxShadow: '0 0 6px rgba(245,158,11,.5)' }} />
      )}
    </button>
  )
}

function DocIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> }
function BoltIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> }
function ChatIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> }
function GearIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.22.5.67.86 1.18 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg> }
