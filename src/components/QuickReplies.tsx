interface Props {
  replies: string[]
  onSelect: (reply: string) => void
}

export default function QuickReplies({ replies, onSelect }: Props) {
  if (replies.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5 px-3 pt-2.5">
      {replies.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onSelect(r)}
          className="interactive px-3 py-1 rounded-full text-[11px] font-semibold cursor-pointer anim-fade-in"
          style={{
            border: '1px solid var(--color-accent)',
            background: 'var(--color-accent-lo)',
            color: 'var(--color-accent)',
          }}
        >
          {r}
        </button>
      ))}
    </div>
  )
}
