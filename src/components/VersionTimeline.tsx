import { useLayoutEffect, useRef } from 'react'
import type { SiteVersionEntry, SiteVersionStatus } from '../lib/undoTypes'

const STATUS_LABEL: Record<SiteVersionStatus, string> = {
  draft: 'Черновик',
  live: 'Live',
  autosave: 'Авто',
}

function statusClass(status: SiteVersionStatus): string {
  switch (status) {
    case 'live':
      return 'version-timeline-badge--live'
    case 'autosave':
      return 'version-timeline-badge--autosave'
    default:
      return 'version-timeline-badge--draft'
  }
}

function formatVersionTime(ts: number): string {
  return new Intl.DateTimeFormat('ru', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts))
}

interface Props {
  versions: SiteVersionEntry[]
  activeId: string | null
  disabled?: boolean
  onSelect: (entry: SiteVersionEntry) => void
}

/** Слева направо: от старых к новым (как в массиве). */
export default function VersionTimeline({ versions, activeId, disabled, onSelect }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const root = scrollRef.current
    if (!root || !activeId) return
    const active = root.querySelector<HTMLElement>('[data-version-active="true"]')
    active?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [activeId, versions.length])

  return (
    <nav
      data-tour="version-timeline"
      className="version-timeline shrink-0 flex flex-col border-t"
      style={{
        background: 'var(--color-s0)',
        borderColor: 'var(--color-border)',
      }}
      aria-label="Версии прототипа"
    >
      <div
        className="flex items-baseline gap-2 px-3 py-1.5 shrink-0 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <h2
          className="m-0 text-[10px] font-bold uppercase tracking-[0.08em]"
          style={{ color: 'var(--color-muted-hi)', fontFamily: 'var(--font-body)' }}
        >
          Версии
        </h2>
        <p className="m-0 text-[9px] leading-tight truncate" style={{ color: 'var(--color-muted)' }}>
          слева → право по времени · нажмите, чтобы откатиться
        </p>
      </div>

      <div
        ref={scrollRef}
        className="overflow-x-auto overflow-y-hidden px-3 py-2"
        style={{ scrollbarGutter: 'stable' }}
      >
        {versions.length === 0 ? (
          <p className="m-0 py-2 text-[11px] leading-relaxed max-w-xl" style={{ color: 'var(--color-muted)' }}>
            Запустите генерацию или вставьте URL в чат — точка версии появится на оси.
          </p>
        ) : (
          <ol className="version-timeline-list-horizontal m-0 p-0 list-none flex flex-row items-center min-h-[68px]">
            {versions.map((v, i) => {
              const isActive = v.id === activeId
              return (
                <li key={v.id} className="flex flex-row items-center shrink-0">
                  {i > 0 ? (
                    <span
                      className="version-timeline-connector shrink-0 rounded-full"
                      aria-hidden
                      style={{
                        width: 20,
                        height: 2,
                        background: 'var(--color-border)',
                      }}
                    />
                  ) : null}
                  <span
                    className="version-timeline-node-h shrink-0 rounded-full"
                    aria-hidden
                    style={{
                      width: 8,
                      height: 8,
                      marginRight: 6,
                      border: isActive ? '2px solid var(--color-accent)' : '2px solid var(--color-border-hi)',
                      background: isActive ? 'rgba(99, 102, 241, 0.25)' : 'var(--color-s0)',
                      boxShadow: isActive ? '0 0 0 2px rgba(99, 102, 241, 0.12)' : 'none',
                    }}
                  />
                  <button
                    type="button"
                    disabled={disabled}
                    data-version-active={isActive ? 'true' : undefined}
                    onClick={() => onSelect(v)}
                    aria-current={isActive ? 'true' : undefined}
                    className="version-timeline-card text-left rounded-lg px-2.5 py-2 transition-[background,border-color] duration-150 disabled:opacity-45 disabled:cursor-not-allowed min-w-[132px] max-w-[200px]"
                    style={{
                      background: isActive ? 'rgba(99, 102, 241, 0.08)' : 'var(--color-s1)',
                      border: `1px solid ${isActive ? 'rgba(99, 102, 241, 0.35)' : 'var(--color-border)'}`,
                    }}
                  >
                    <div className="flex items-center gap-1 flex-wrap mb-0.5">
                      <span
                        className={`version-timeline-badge text-[8px] font-bold uppercase tracking-wider px-1 py-px rounded ${statusClass(v.status)}`}
                      >
                        {STATUS_LABEL[v.status]}
                      </span>
                      <time
                        dateTime={new Date(v.createdAt).toISOString()}
                        className="text-[9px] tabular-nums"
                        style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}
                      >
                        {formatVersionTime(v.createdAt)}
                      </time>
                    </div>
                    <div
                      className="text-[11px] font-semibold leading-tight line-clamp-2"
                      style={{ color: 'var(--color-ink)' }}
                    >
                      {v.title}
                    </div>
                    {v.subtitle ? (
                      <div
                        className="text-[9px] mt-0.5 truncate"
                        style={{ color: 'var(--color-muted-hi)', fontFamily: 'var(--font-mono)' }}
                        title={v.subtitle}
                      >
                        {v.subtitle}
                      </div>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </nav>
  )
}
