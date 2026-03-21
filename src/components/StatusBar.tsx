import type { AgentStep, DrawerKind, Requirements } from '../types'

interface Props {
  requirements: Requirements
  agentStep: AgentStep
  agentLabel: string
  onOpenDrawer: (kind: DrawerKind) => void
}

export default function StatusBar({ requirements, agentStep, agentLabel, onOpenDrawer }: Props) {
  const hasBT = Boolean(requirements.business.raw)
  const hasGL = Boolean(requirements.guideline.raw)

  return (
    <div
      className="flex items-center gap-3.5 px-3.5 shrink-0"
      style={{
        height: 28,
        background: 'var(--color-s0)',
        borderTop: '1px solid var(--color-border)',
        fontSize: 10,
        fontFamily: 'var(--font-body)',
        color: 'var(--color-muted)',
      }}
    >
      <span className="interactive cursor-pointer" onClick={() => onOpenDrawer('docs')} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span className="inline-block w-[5px] h-[5px] rounded-full" style={{ background: hasBT ? 'var(--color-ok)' : 'var(--color-muted)', opacity: hasBT ? 1 : .4 }} />
        БТ: {hasBT ? (requirements.business.fileName ?? 'текст') : '—'}
      </span>
      <span style={{ color: 'var(--color-border)' }}>·</span>
      <span className="interactive cursor-pointer" onClick={() => onOpenDrawer('docs')} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span className="inline-block w-[5px] h-[5px] rounded-full" style={{ background: hasGL ? 'var(--color-ok)' : 'var(--color-muted)', opacity: hasGL ? 1 : .4 }} />
        Guideline: {hasGL ? (requirements.guideline.fileName ?? 'текст') : '—'}
      </span>
      <span style={{ color: 'var(--color-border)' }}>·</span>
      <span className="interactive cursor-pointer" onClick={() => onOpenDrawer('agent')} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span
          className={`inline-block w-[5px] h-[5px] rounded-full ${agentStep > 0 && agentStep < 4 ? 'anim-blink' : ''}`}
          style={{ background: agentStep === 4 ? 'var(--color-ok)' : agentStep > 0 ? 'var(--color-warn)' : 'var(--color-muted)', opacity: agentStep === 0 ? .4 : 1 }}
        />
        {agentStep === 0 ? 'Агент: ожидание' : agentLabel}
      </span>
      <span className="ml-auto text-[9px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}>
        Ctrl+Z отмена · ? тур
      </span>
    </div>
  )
}
