const R = 14
const CX = 17
const CIRCUMFERENCE = 2 * Math.PI * R // ≈ 87.96

interface Props {
  progress: number  // 0..1
  visible: boolean
}

export default function HoldEnterRing({ progress, visible }: Props) {
  if (!visible) return null

  const offset   = CIRCUMFERENCE * (1 - progress)
  const isAlmost = progress >= 0.9

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      style={{ zIndex: 10 }}
    >
      <div className="relative flex items-center justify-center">
        {/* Center dot */}
        <div
          className="rounded-full anim-glow"
          style={{
            width: 10,
            height: 10,
            background: isAlmost ? 'var(--color-ok)' : 'var(--color-accent)',
            boxShadow: `0 0 8px ${isAlmost ? 'rgba(16,185,129,.6)' : 'rgba(99,102,241,.5)'}`,
          }}
        />
        {/* Ring */}
        <svg
          width={34}
          height={34}
          className="absolute"
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Track */}
          <circle
            cx={CX} cy={CX} r={R}
            fill="none"
            stroke="var(--color-border-hi)"
            strokeWidth={2}
          />
          {/* Progress arc */}
          <circle
            cx={CX} cy={CX} r={R}
            fill="none"
            stroke={isAlmost ? 'var(--color-ok)' : 'var(--color-accent)'}
            strokeWidth={2.5}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke 0.3s ease' }}
          />
        </svg>
      </div>
      {/* Hint */}
      <div
        className="absolute bottom-full mb-2 text-[9px] whitespace-nowrap px-2 py-0.5 rounded"
        style={{
          color: 'var(--color-muted-hi)',
          background: 'var(--color-s1)',
          border: '1px solid var(--color-border)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {isAlmost ? '🎙 Отпустите — начнётся запись' : 'Удерживайте Enter для записи голоса…'}
      </div>
    </div>
  )
}
