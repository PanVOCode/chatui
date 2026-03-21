import { useCallback, useRef, useState } from 'react'
import type { RequirementDocument } from '../types'
import Drawer from './Drawer'
import { convertDocument, uploadImage } from '../lib/publishApi'

// Форматы для текстовых документов
const DOC_ACCEPT = '.txt,.md,.markdown,.json,.csv,.html,.htm,.pdf,.docx,.odt,.rtf,.epub'
// Форматы для изображений
const IMG_ACCEPT = '.jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.tiff'

type DocSlot = 'business' | 'guideline'

interface Props {
  open: boolean
  business: RequirementDocument
  guideline: RequirementDocument
  onClose: () => void
  onSlotChange: (slot: DocSlot, doc: RequirementDocument) => void
}

export default function DocsDrawer({ open, business, guideline, onClose, onSlotChange }: Props) {
  return (
    <Drawer open={open} side="left" width={440} title="Документы"
      icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
      onClose={onClose}
    >
      <div className="p-4 flex flex-col gap-5">
        <SlotSection
          label="Бизнес-требования"
          doc={business}
          placeholder="Вставьте текст бизнес-требований: цели, аудитория, ограничения…"
          onCommit={(doc) => onSlotChange('business', doc)}
          onClear={() => onSlotChange('business', { raw: '', summary: null })}
        />
        <div style={{ height: 1, background: 'var(--color-border)' }} />
        <SlotSection
          label="Guideline"
          doc={guideline}
          placeholder="Вставьте текст guideline: бренд, типографика, сетка, UI-правила…"
          onCommit={(doc) => onSlotChange('guideline', doc)}
          onClear={() => onSlotChange('guideline', { raw: '', summary: null })}
        />
        <div style={{ height: 1, background: 'var(--color-border)' }} />
        <ImageUploadSection />
      </div>
    </Drawer>
  )
}

function SlotSection({ label, doc, placeholder, onCommit, onClear }: {
  label: string; doc: RequirementDocument; placeholder: string
  onCommit: (doc: RequirementDocument) => void; onClear: () => void
}) {
  const [mode, setMode] = useState<null | 'files' | 'text'>(null)
  const [draft, setDraft] = useState('')
  const [stagedFiles, setStagedFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const dragDepth = useRef(0)
  const [dropActive, setDropActive] = useState(false)

  const stageFiles = useCallback((list: FileList | null) => {
    if (!list) return
    setStagedFiles((p) => [...p, ...Array.from(list)])
  }, [])

  const isLoaded = Boolean(doc.raw)

  const handleSaveFiles = useCallback(async () => {
    if (stagedFiles.length === 0) return
    setLoading(true)
    setError(null)
    try {
      const results = await Promise.all(stagedFiles.map((f) => convertDocument(f)))
      const merged = results.map((r) => r.text).join('\n\n')
      const name = stagedFiles.length === 1 ? stagedFiles[0]!.name : `${stagedFiles.length} файлов`
      // Ссылки на конвертированные документы на media.progressusbot.ru
      const fileUrl = results.map((r) => r.url).join(', ')
      onCommit({ raw: merged, summary: null, fileName: name, fileUrl })
      setStagedFiles([])
      setMode(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [stagedFiles, onCommit])

  if (isLoaded && mode === null) {
    return (
      <section>
        <div className="flex items-center justify-between mb-2">
          <SectionTitle>{label}</SectionTitle>
          <Tag ok>{doc.fileName ?? 'Текст'}</Tag>
        </div>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)', background: 'var(--color-s1)' }}>
          <div className="px-3 py-2.5 text-[11px] leading-relaxed" style={{ color: 'var(--color-muted-hi)' }}>
            {doc.raw.slice(0, 200)}{doc.raw.length > 200 ? '…' : ''}
          </div>
          {doc.fileUrl && (
            <div className="px-3 pb-2 text-[10px]" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
              🔗 <a href={doc.fileUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)' }}>
                {doc.fileUrl.length > 55 ? doc.fileUrl.slice(0, 55) + '…' : doc.fileUrl}
              </a>
            </div>
          )}
        </div>
        <button
          type="button" onClick={onClear}
          className="interactive mt-2 text-[10px] px-2 py-1 rounded cursor-pointer"
          style={{ border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-muted)' }}
        >Очистить</button>
      </section>
    )
  }

  if (mode === null) {
    return (
      <section>
        <SectionTitle>{label}</SectionTitle>
        <div className="flex flex-col gap-2 mt-2">
          <SlotBtn icon="📁" text="Загрузить файл (PDF, DOCX, TXT…)" onClick={() => setMode('files')} />
          <SlotBtn icon="📝" text="Вставить текст" onClick={() => setMode('text')} />
        </div>
      </section>
    )
  }

  if (mode === 'text') {
    return (
      <section>
        <SectionTitle>{label}</SectionTitle>
        <textarea
          value={draft} onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder} rows={5}
          className="w-full mt-2 text-[12px] rounded-xl p-3 resize-none outline-none interactive"
          style={{ background: 'var(--color-s1)', border: '1px solid var(--color-border)', color: 'var(--color-ink)', fontFamily: 'var(--font-body)' }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
        />
        <div className="flex gap-2 mt-2">
          <button
            type="button" disabled={!draft.trim()}
            onClick={() => { onCommit({ raw: draft, summary: null }); setDraft(''); setMode(null) }}
            className="btn-gradient flex-1 text-[12px] font-semibold text-white py-1.5 rounded-lg cursor-pointer"
          >Сохранить</button>
          <button type="button" onClick={() => { setMode(null); setDraft('') }}
            className="interactive px-3 py-1.5 rounded-lg text-[12px] cursor-pointer"
            style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-muted-hi)' }}
          >✕</button>
        </div>
      </section>
    )
  }

  return (
    <section>
      <SectionTitle>{label}</SectionTitle>
      <input ref={fileRef} type="file" multiple accept={DOC_ACCEPT} className="sr-only"
        onChange={(e) => stageFiles(e.target.files)} />
      <div
        role="button" tabIndex={0}
        onClick={() => fileRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current?.click() } }}
        onDragEnter={(e) => { e.preventDefault(); dragDepth.current++; setDropActive(true) }}
        onDragLeave={(e) => { e.preventDefault(); dragDepth.current = Math.max(0, dragDepth.current - 1); if (dragDepth.current === 0) setDropActive(false) }}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
        onDrop={(e) => { e.preventDefault(); dragDepth.current = 0; setDropActive(false); stageFiles(e.dataTransfer.files) }}
        className="interactive mt-2 rounded-xl px-4 py-6 text-center cursor-pointer"
        style={{
          background: dropActive ? 'var(--color-accent-lo)' : 'transparent',
          border: `2px dashed ${dropActive ? 'var(--color-accent)' : 'var(--color-border-hi)'}`,
        }}
      >
        <div className="text-[22px] mb-2">📁</div>
        <div className="text-[12px] font-medium" style={{ color: 'var(--color-muted-hi)' }}>Перетащите файлы сюда</div>
        <div className="text-[10px] mt-1" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
          PDF, DOCX, TXT, MD, HTML — или нажмите
        </div>
      </div>

      {stagedFiles.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {stagedFiles.map((f, i) => (
            <li key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px]"
              style={{ background: 'var(--color-s1)', border: '1px solid var(--color-border)', color: 'var(--color-ink)' }}>
              <span>📄</span>{f.name}
              <button type="button" onClick={() => setStagedFiles((p) => p.filter((_, j) => j !== i))}
                className="ml-auto cursor-pointer" style={{ background: 'none', border: 'none', color: 'var(--color-muted)', fontSize: 10 }}>✕</button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <div className="mt-2 text-[11px] px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,.1)', color: '#ef4444' }}>
          {error}
        </div>
      )}

      <div className="flex gap-2 mt-2">
        <button
          type="button" disabled={stagedFiles.length === 0 || loading}
          onClick={handleSaveFiles}
          className="btn-gradient flex-1 text-[12px] font-semibold text-white py-1.5 rounded-lg cursor-pointer"
        >
          {loading ? 'Конвертирую…' : 'Сохранить'}
        </button>
        <button type="button" onClick={() => { setMode(null); setStagedFiles([]); setError(null) }}
          className="interactive px-3 py-1.5 rounded-lg text-[12px] cursor-pointer"
          style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-muted-hi)' }}
        >✕</button>
      </div>
    </section>
  )
}

function ImageUploadSection() {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ url: string; name: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    setUploading(true)
    setError(null)
    setResult(null)
    try {
      const { url } = await uploadImage(file)
      setResult({ url, name: file.name })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки')
    } finally {
      setUploading(false)
    }
  }, [])

  return (
    <section>
      <SectionTitle>Изображения</SectionTitle>
      <input ref={fileRef} type="file" accept={IMG_ACCEPT} className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />

      <button
        type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
        className="interactive flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-[12px] font-medium cursor-pointer text-left mt-2"
        style={{ background: 'var(--color-s1)', border: '1px solid var(--color-border)', color: 'var(--color-muted-hi)' }}
      >
        <span>🖼️</span>{uploading ? 'Загружаю…' : 'Загрузить изображение'}
      </button>

      {error && (
        <div className="mt-2 text-[11px] px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,.1)', color: '#ef4444' }}>
          {error}
        </div>
      )}

      {result && (
        <div className="mt-2 rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)', background: 'var(--color-s1)' }}>
          <img src={result.url} alt={result.name} className="w-full object-cover" style={{ maxHeight: 120 }} />
          <div className="px-3 py-2 flex items-center justify-between gap-2">
            <span className="text-[10px] truncate" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
              {result.url}
            </span>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(result.url)}
              className="interactive shrink-0 text-[10px] px-2 py-0.5 rounded cursor-pointer"
              style={{ border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-accent)' }}
            >
              Копировать
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-bold uppercase tracking-[.06em] mb-0"
      style={{ color: 'var(--color-muted-hi)', fontFamily: 'var(--font-mono)' }}>{children}</h3>
  )
}

function Tag({ ok, children }: { ok?: boolean; children: React.ReactNode }) {
  return (
    <span className="text-[9px] font-semibold px-2 py-0.5 rounded"
      style={{
        fontFamily: 'var(--font-mono)', letterSpacing: '.04em',
        background: ok ? 'rgba(16,185,129,.12)' : 'rgba(110,110,154,.12)',
        color: ok ? 'var(--color-ok)' : 'var(--color-muted)',
      }}>{children}</span>
  )
}

function SlotBtn({ icon, text, onClick }: { icon: string; text: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="interactive flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-[12px] font-medium cursor-pointer text-left"
      style={{ background: 'var(--color-s1)', border: '1px solid var(--color-border)', color: 'var(--color-muted-hi)' }}
    ><span>{icon}</span>{text}</button>
  )
}
