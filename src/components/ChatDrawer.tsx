import { useRef, useState, useCallback, useEffect } from 'react'
import type { Message } from '../types'
import Drawer from './Drawer'
import QuickReplies from './QuickReplies'
import HoldEnterRing from './HoldEnterRing'
import { useHoldEnter } from '../hooks/useHoldEnter'
import type { VoiceState } from '../hooks/useVoiceRecorder'

const FILE_ACCEPT = '.txt,.md,.markdown,.pdf,.docx,.odt,.rtf,.epub,.html,.htm,.csv,.json'

interface SectionFile { url: string; fileName: string }

interface Props {
  open: boolean
  messages: Message[]
  quickReplies: string[]
  voiceState: VoiceState
  voiceElapsed: number
  voiceError: string | null
  prefillText?: string
  prefillKey?: number
  sectionFiles?: SectionFile[]
  onRemoveSectionFile?: (index: number) => void
  canSubmitEmpty?: boolean
  onClose: () => void
  onSubmit: (text: string, files: File[]) => void
  onVoiceStart: () => void
  onVoiceStop: () => void
  onVoiceCancel: () => void
}

export default function ChatDrawer({
  open, messages, quickReplies,
  voiceState, voiceElapsed, voiceError,
  prefillText, prefillKey, sectionFiles = [], onRemoveSectionFile,
  canSubmitEmpty,
  onClose, onSubmit,
  onVoiceStart, onVoiceStop, onVoiceCancel,
}: Props) {
  const [value, setValue]             = useState('')
  const [stagedFiles, setStagedFiles] = useState<File[]>([])
  const [fileError, setFileError]     = useState<string | null>(null)

  // Заполняем поле ввода при смене фазы на редактирование (только по prefillKey)
  useEffect(() => {
    if (prefillKey !== undefined && prefillText !== undefined) {
      setValue(prefillText)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [prefillKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const listRef    = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)
  const fileRef    = useRef<HTMLInputElement>(null)

  function scrollBottom() {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }

  function send() {
    const t = value.trim()
    if (!t && stagedFiles.length === 0 && !canSubmitEmpty) return
    setFileError(null)
    setValue('')
    onSubmit(t, stagedFiles)
    setStagedFiles([])
  }

  const { progress: holdProgress, isHolding, onKeyDown, onKeyUp } = useHoldEnter({
    onQuickSend: send,
    onHoldComplete: () => {},
  })

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    onKeyDown(e)
    // Shift+Enter → перенос строки (не перехватываем)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setStagedFiles((p) => [...p, ...Array.from(e.target.files!)])
      e.target.value = ''
    }
  }

  const activeRingProgress = holdProgress
  const ringVisible = isHolding

  const error = voiceError ?? fileError

  const footer = (
    <div className="shrink-0" style={{ borderTop: '1px solid var(--color-border)' }}>

      <QuickReplies replies={quickReplies} onSelect={(r) => { onSubmit(r, []); scrollBottom() }} />

      {error && (
        <div className="mx-3 mt-2 px-3 py-2 rounded-lg text-[10px]"
          style={{ background: 'rgba(239,68,68,.1)', color: '#ef4444' }}>
          {error}
        </div>
      )}

      {/* Файлы текущего раздела (уже загруженные) */}
      {sectionFiles.length > 0 && (
        <div className="mx-3 mt-2">
          <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
            Загружено в этот раздел
          </div>
          <ul className="flex flex-col gap-1">
            {sectionFiles.map((f, i) => (
              <li key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px]"
                style={{ background: 'var(--color-s1)', border: '1px solid var(--color-border)' }}>
                <a href={f.url} target="_blank" rel="noreferrer" className="flex-1 truncate"
                  style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>
                  {f.fileName}
                </a>
                {onRemoveSectionFile && (
                  <button type="button" onClick={() => onRemoveSectionFile(i)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-muted)', fontSize: 11, cursor: 'pointer', lineHeight: 1 }}>
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Новые файлы в очереди на отправку */}
      {stagedFiles.length > 0 && (
        <ul className="mx-3 mt-2 flex flex-col gap-1">
          {stagedFiles.map((f, i) => (
            <li key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px]"
              style={{ background: 'var(--color-s1)', border: '1px solid var(--color-border)', color: 'var(--color-ink)' }}>
              <span className="flex-1 truncate">{f.name}</span>
              <button type="button"
                onClick={() => setStagedFiles((p) => p.filter((_, j) => j !== i))}
                style={{ background: 'none', border: 'none', color: 'var(--color-muted)', fontSize: 10, cursor: 'pointer' }}>✕</button>
            </li>
          ))}
        </ul>
      )}

      <div className="p-3">
        <div className="relative rounded-xl overflow-visible interactive"
          style={{ border: '1px solid var(--color-border)', background: 'var(--color-s1)' }}
          onFocusCapture={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-accent)' }}
          onBlurCapture={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)' }}
        >
          {/* Ring overlay */}
          <HoldEnterRing progress={activeRingProgress} visible={ringVisible} />

          {voiceState !== 'idle' ? (
            <div className="flex items-center gap-3 px-3 py-3">
              <span className="text-[22px]">{voiceState === 'recording' ? '🎙' : '⏳'}</span>
              <span className="flex-1 text-[12px]" style={{ color: 'var(--color-ink)' }}>
                {voiceState === 'recording'
                  ? `Говорите… ${voiceElapsed}с`
                  : 'Распознаю речь…'}
              </span>
              {voiceState === 'recording' && (
                <>
                  <button type="button" onClick={onVoiceStop}
                    className="interactive text-[10px] px-2 py-1 rounded cursor-pointer"
                    style={{ border: '1px solid var(--color-accent)', background: 'var(--color-accent-lo)', color: 'var(--color-accent)', fontWeight: 600 }}>
                    Стоп
                  </button>
                  <button type="button" onClick={onVoiceCancel}
                    className="interactive text-[10px] px-2 py-1 rounded cursor-pointer"
                    style={{ border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-muted)' }}>
                    Отмена
                  </button>
                </>
              )}
            </div>
          ) : (
            <textarea
              ref={inputRef} value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onKeyUp={onKeyUp}
              placeholder={stagedFiles.length > 0 ? `${stagedFiles.length} файл(а) готово к отправке` : 'Ответьте или загрузите документ…'}
              rows={2}
              className="w-full bg-transparent border-none outline-none text-[12px] resize-none px-3 py-2.5"
              style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-body)', maxHeight: 120 }}
            />
          )}

          <div className="flex items-center gap-1 px-2 pb-2">
            <input ref={fileRef} type="file" multiple accept={FILE_ACCEPT} className="sr-only"
              onChange={handleFileChange} />
            <ToolBtn icon={<AttachIcon />} label="Прикрепить документ" onClick={() => fileRef.current?.click()} />

            <div className="flex-1" />

            {/* Mic button — click to start, Стоп/Отмена to stop */}
            <button
              type="button"
              title="Голосовой ввод"
              disabled={voiceState === 'transcribing'}
              className="interactive flex items-center justify-center w-7 h-7 rounded-full cursor-pointer"
              style={{
                border: voiceState === 'recording' ? '2px solid var(--color-accent)' : 'none',
                background: voiceState === 'recording' ? 'var(--color-accent-lo)' : 'transparent',
                color: voiceState === 'recording' ? 'var(--color-accent)' : 'var(--color-muted)',
              }}
              onClick={() => { if (voiceState === 'idle') onVoiceStart() }}
            >
              <MicIcon active={voiceState === 'recording'} />
            </button>

            <button
              type="button"
              onClick={send}
              disabled={voiceState !== 'idle'}
              className="btn-gradient flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-[11px] font-semibold cursor-pointer"
            >
              <SendIcon />
              {stagedFiles.length > 0 ? `Отправить (${stagedFiles.length})` : 'Отправить'}
            </button>
          </div>

          {isHolding && (
            <div className="pb-1 text-center text-[9px]"
              style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
              Удерживайте Enter для записи голоса…
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <Drawer open={open} side="right" width={380} title="Диалог с агентом" subtitle="нить сессии"
      icon={<span className="w-[7px] h-[7px] rounded-full anim-glow" style={{ background: 'var(--color-ok)', boxShadow: '0 0 6px rgba(16,185,129,.5)' }} />}
      onClose={onClose} footer={footer}
    >
      <div ref={listRef} className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-2.5">
          {messages.map((msg) => <MsgItem key={msg.id} msg={msg} />)}
        </div>
      </div>
    </Drawer>
  )
}

// ─── Message rendering ───────────────────────────────────────────────────────

function MsgItem({ msg }: { msg: Message }) {
  if (msg.type === 'json-result') return <JsonResultMsg msg={msg} />

  if (msg.type === 'system-context') return (
    <div className="anim-slide-up self-center text-center text-[10px] px-3 py-1.5 rounded-lg max-w-full"
      style={{ background: 'var(--color-accent-lo)', border: '1px solid rgba(99,102,241,.15)', color: 'var(--color-muted-hi)' }}
      dangerouslySetInnerHTML={{ __html: msg.text }} />
  )

  if (msg.type === 'compliance') return (
    <div className="anim-slide-up self-stretch rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)', background: 'var(--color-s1)' }}>
      <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-semibold" style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-ink)' }}>
        ⚡ Проверка по требованиям
        <span className="text-[9px] ml-auto" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>{msg.time}</span>
      </div>
      <div className="px-3 py-2 flex flex-col gap-1.5">
        {msg.compliance?.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--color-ink)' }}>
            <span style={{ color: item.status === 'ok' ? 'var(--color-ok)' : item.status === 'question' ? 'var(--color-warn)' : '#ef4444', fontWeight: 700 }}>
              {item.status === 'ok' ? '✓' : item.status === 'question' ? '?' : '✗'}
            </span>{item.label}
          </div>
        ))}
      </div>
    </div>
  )

  if (msg.type === 'recommendation') return (
    <div className="anim-slide-up self-stretch rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)', background: 'var(--color-s1)' }}>
      <div className="px-3 py-2 text-[11px] font-semibold" style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-ink)' }}>
        💡 Рекомендации
      </div>
      <div className="px-3 py-2 flex flex-col gap-2">
        {msg.recommendations?.map((r, i) => (
          <div key={i}>
            <div className="text-[11px] font-semibold" style={{ color: 'var(--color-ink)' }}>{r.title}</div>
            <div className="text-[10px] leading-snug" style={{ color: 'var(--color-muted)' }}>{r.reason}</div>
          </div>
        ))}
      </div>
    </div>
  )

  const isUser = msg.role === 'user'
  return (
    <div className={`anim-slide-up flex flex-col gap-1 max-w-[88%] ${isUser ? 'self-end items-end' : 'self-start items-start'}`}>
      {!isUser && (
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted-hi)', fontFamily: 'var(--font-display)' }}>Агент</span>
          <span className="text-[9px]" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>{msg.time}</span>
        </div>
      )}
      <div className="px-3 py-2.5 text-[12px] leading-relaxed"
        style={isUser
          ? { background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-2))', color: '#fff', borderRadius: '12px 12px 4px 12px', boxShadow: '0 2px 10px rgba(99,102,241,.2)' }
          : { background: 'var(--color-s1)', color: 'var(--color-ink)', border: '1px solid var(--color-border)', borderRadius: '4px 12px 12px 12px' }
        }
        dangerouslySetInnerHTML={{ __html: msg.text }} />
      {isUser && <span className="text-[9px]" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>{msg.time}</span>}
    </div>
  )
}

function JsonResultMsg({ msg }: { msg: Message }) {
  const [copied, setCopied] = useState(false)
  const json = JSON.stringify(msg.jsonData, null, 2)

  const copy = useCallback(() => {
    navigator.clipboard.writeText(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [json])

  const download = useCallback(() => {
    const blob = new Blob([json], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'langgraph_input.json'; a.click()
    URL.revokeObjectURL(url)
  }, [json])

  return (
    <div className="anim-slide-up self-stretch rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)', background: 'var(--color-s1)' }}>
      <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <span className="text-[11px] font-semibold" style={{ color: 'var(--color-ink)' }}>🎉 {msg.text}</span>
        <span className="text-[9px] ml-auto" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>{msg.time}</span>
      </div>
      <pre className="px-3 py-2.5 text-[10px] overflow-x-auto leading-relaxed"
        style={{ color: 'var(--color-muted-hi)', fontFamily: 'var(--font-mono)', maxHeight: 320, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {json}
      </pre>
      <div className="flex gap-2 px-3 pb-3">
        <button type="button" onClick={copy}
          className="interactive flex-1 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer"
          style={{ border: '1px solid var(--color-border)', background: copied ? 'rgba(16,185,129,.12)' : 'transparent', color: copied ? 'var(--color-ok)' : 'var(--color-muted-hi)' }}>
          {copied ? '✓ Скопировано' : 'Копировать JSON'}
        </button>
        <button type="button" onClick={download}
          className="btn-gradient px-4 py-1.5 rounded-lg text-[11px] font-semibold text-white cursor-pointer">
          Скачать .json
        </button>
      </div>
    </div>
  )
}

// ─── Small icons ─────────────────────────────────────────────────────────────

function ToolBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} title={label} aria-label={label}
      className="interactive flex items-center justify-center w-7 h-7 rounded-md cursor-pointer"
      style={{ border: 'none', background: 'transparent', color: 'var(--color-muted)' }}
    >{icon}</button>
  )
}

function AttachIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>
}

function MicIcon({ active }: { active: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

function SendIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
}
