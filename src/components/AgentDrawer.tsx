import type { AgentStep } from '../types'
import Drawer from './Drawer'

const STEPS: Array<{ step: AgentStep; label: string }> = [
  { step: 1, label: 'Разбираю задачу…' },
  { step: 2, label: 'Генерирую вариант A…' },
  { step: 3, label: 'Генерирую варианты B и C…' },
  { step: 4, label: 'Готово' },
]

interface Props {
  open: boolean
  agentStep: AgentStep
  agentLabel: string
  onClose: () => void
}

export default function AgentDrawer({ open, agentStep, agentLabel, onClose }: Props) {
  return (
    <Drawer open={open} side="left" width={360} title="Статус агента"
      icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>}
      onClose={onClose}
    >
      <div className="p-4">
        <div className="rounded-xl p-3.5" style={{ border: '1px solid var(--color-border)', background: 'var(--color-s1)' }}>
          <div className="text-[10px] font-bold uppercase tracking-[.06em] mb-2.5"
            style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>
            Ход генерации
          </div>
          {STEPS.map((s) => {
            const done = agentStep > s.step || agentStep === 4
            const current = agentStep === s.step && agentStep < 4
            return (
              <div key={s.step}
                className="flex items-center gap-2 py-1 text-[11px]"
                style={{ color: done ? 'var(--color-ok)' : current ? 'var(--color-ink)' : 'var(--color-muted)', fontWeight: current ? 600 : 400 }}
              >
                <span className="w-3.5 text-center text-[10px] shrink-0">
                  {done ? '✓' : current ? '◉' : '○'}
                </span>
                {s.label}
              </div>
            )
          })}
        </div>

        {agentStep > 0 && (
          <p className="mt-4 text-[11px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            {agentStep < 4
              ? `Текущий шаг: ${agentLabel}`
              : 'Генерация завершена. Три варианта прототипа готовы к просмотру.'}
          </p>
        )}

        {agentStep === 0 && (
          <p className="mt-4 text-[11px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            Агент ожидает задачу. Отправьте описание в чате — генерация начнётся автоматически.
          </p>
        )}
      </div>
    </Drawer>
  )
}
