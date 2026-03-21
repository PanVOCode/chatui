import { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react'
import TopBar from './components/TopBar'
import IconRail from './components/IconRail'
import CenterPreview from './components/CenterPreview'
import ChatDrawer from './components/ChatDrawer'
import DocsDrawer from './components/DocsDrawer'
import AgentDrawer from './components/AgentDrawer'
import StatusBar from './components/StatusBar'
import VersionTimeline from './components/VersionTimeline'
import FullscreenOverlay from './components/FullscreenOverlay'
import OnboardingTour from './components/OnboardingTour'
import { ONBOARDING_STORAGE_KEY } from './data/onboardingTour'
import { TEMPLATES, detectTemplate, mutateTemplate } from './data/templates'
import {
  DEFAULT_DESKTOP_RESOLUTION_ID,
  DEFAULT_MOBILE_RESOLUTION_ID,
  DESKTOP_RESOLUTIONS,
  getResolutionById,
  MOBILE_RESOLUTIONS,
} from './data/previewResolutions'
import {
  cloneProjectSnapshot,
  MAX_UNDO_DEPTH,
  type ProjectUndoSnapshot,
  type SiteVersionEntry,
} from './lib/undoTypes'
import type {
  AgentStep,
  BTSummary,
  ComplianceItem,
  DrawerKind,
  Message,
  Recommendation,
  RequirementDocument,
  Requirements,
  VariantData,
  VariantId,
  ViewMode,
} from './types'

const VARIANT_IDS: VariantId[] = ['A', 'B', 'C']

function makeId() { return Math.random().toString(36).slice(2) }
function nowTime() { return new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }) }
function sleep(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)) }

const AGENT_STEPS: Array<{ step: AgentStep; label: string }> = [
  { step: 1, label: 'Разбираю задачу…' },
  { step: 2, label: 'Генерирую вариант A…' },
  { step: 3, label: 'Генерирую варианты B и C…' },
  { step: 4, label: 'Готово' },
]

export default function App() {
  const [view, setView] = useState<ViewMode>('desktop')
  const [currentVariant, setCurrentVariant] = useState<VariantId>('A')
  const [projectName, setProjectName] = useState('Без названия')
  const [tokenCount, setTokenCount] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [desktopResolutionId, setDesktopResolutionId] = useState(DEFAULT_DESKTOP_RESOLUTION_ID)
  const [mobileResolutionId, setMobileResolutionId] = useState(DEFAULT_MOBILE_RESOLUTION_ID)
  const [isGenerating, setIsGenerating] = useState(false)
  const [agentStep, setAgentStep] = useState<AgentStep>(0)
  const [agentLabel, setAgentLabel] = useState('')
  const [activeDrawer, setActiveDrawer] = useState<DrawerKind>(null)
  const [requirements, setRequirements] = useState<Requirements>({
    business: { raw: '', summary: null },
    guideline: { raw: '', summary: null },
  })
  const [variants, setVariants] = useState<VariantData[]>([
    { id: 'A', label: 'Вариант A', html: null, url: null, status: 'empty' },
    { id: 'B', label: 'Вариант B', html: null, url: null, status: 'empty' },
    { id: 'C', label: 'Вариант C', html: null, url: null, status: 'empty' },
  ])
  const [tourOpen, setTourOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { id: makeId(), role: 'agent', text: 'Привет! Загрузите бизнес-требования через панель документов или опишите задачу в чате. Сгенерирую три варианта прототипа.', time: nowTime(), type: 'normal' },
  ])

  const [undoPast, setUndoPast] = useState<ProjectUndoSnapshot[]>([])
  const [undoFuture, setUndoFuture] = useState<ProjectUndoSnapshot[]>([])
  const [siteVersions, setSiteVersions] = useState<SiteVersionEntry[]>([])
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null)

  const snapshotRef = useRef<ProjectUndoSnapshot | null>(null)
  const recordVersionAfterGen = useRef(false)

  useEffect(() => {
    snapshotRef.current = { variants, requirements, messages, currentVariant, tokenCount, agentStep, agentLabel }
  }, [variants, requirements, messages, currentVariant, tokenCount, agentStep, agentLabel])

  const pushUndoSnapshot = useCallback((snap: ProjectUndoSnapshot) => {
    setUndoPast((p) => [...p.slice(-(MAX_UNDO_DEPTH - 1)), cloneProjectSnapshot(snap)])
    setUndoFuture([])
  }, [])

  const applySnapshot = useCallback((s: ProjectUndoSnapshot) => {
    const c = cloneProjectSnapshot(s)
    setVariants(c.variants); setRequirements(c.requirements); setMessages(c.messages)
    setCurrentVariant(c.currentVariant); setTokenCount(c.tokenCount)
    setAgentStep(c.agentStep); setAgentLabel(c.agentLabel)
  }, [])

  const restoreSiteVersion = useCallback((entry: SiteVersionEntry) => {
    if (isGenerating) return
    applySnapshot(entry.snapshot)
    setActiveVersionId(entry.id)
    setUndoPast([]); setUndoFuture([])
  }, [isGenerating, applySnapshot])

  useLayoutEffect(() => {
    if (!recordVersionAfterGen.current || isGenerating || agentStep !== 4) return
    const hasArtifact = variants.some((v) => v.html != null || v.url != null)
    if (!hasArtifact) return
    recordVersionAfterGen.current = false
    const snap = cloneProjectSnapshot({ variants, requirements, messages, currentVariant, tokenCount, agentStep, agentLabel })
    const entryId = makeId()
    setSiteVersions((prev) => [...prev, {
      id: entryId, title: 'Генерация вариантов A–C',
      subtitle: projectName.trim() && projectName !== 'Без названия' ? projectName : undefined,
      createdAt: Date.now(), status: 'draft', snapshot: snap,
    }])
    setActiveVersionId(entryId)
  }, [isGenerating, agentStep, variants, requirements, messages, currentVariant, tokenCount, agentLabel, projectName])

  const undo = useCallback(() => {
    if (isGenerating) return
    setUndoPast((p) => {
      if (p.length === 0) return p
      const prev = p[p.length - 1]!
      setUndoFuture((f) => [cloneProjectSnapshot(snapshotRef.current!), ...f].slice(0, MAX_UNDO_DEPTH))
      applySnapshot(prev)
      return p.slice(0, -1)
    })
  }, [isGenerating, applySnapshot])

  const redo = useCallback(() => {
    if (isGenerating) return
    setUndoFuture((f) => {
      if (f.length === 0) return f
      const next = f[0]!
      setUndoPast((p) => [...p, cloneProjectSnapshot(snapshotRef.current!)].slice(-MAX_UNDO_DEPTH))
      applySnapshot(next)
      return f.slice(1)
    })
  }, [isGenerating, applySnapshot])

  useEffect(() => {
    try {
      const v = localStorage.getItem(ONBOARDING_STORAGE_KEY)
      if (v !== 'completed' && v !== 'dismissed' && v !== 'done') setTourOpen(true)
    } catch { /* storage blocked */ }
  }, [])

  const dismissTour = useCallback(() => {
    try { localStorage.setItem(ONBOARDING_STORAGE_KEY, 'dismissed') } catch { /* */ }
    setTourOpen(false)
  }, [])
  const completeTour = useCallback(() => {
    try { localStorage.setItem(ONBOARDING_STORAGE_KEY, 'completed') } catch { /* */ }
    setTourOpen(false)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (tourOpen || isGenerating) return
      const el = e.target as HTMLElement | null
      if (el?.closest('input, textarea, select, [contenteditable="true"]')) return
      if (e.key === '?' || (e.shiftKey && e.key === '/')) { e.preventDefault(); setTourOpen(true); return }
      if (e.key === '1') { setActiveDrawer(null); return }
      if (e.key === '2') { setActiveDrawer((d) => d === 'chat' ? null : 'chat'); return }
      if (e.key === '3') { setActiveDrawer((d) => d === 'docs' ? null : 'docs'); return }
      if (e.key === '4') { setActiveDrawer((d) => d === 'agent' ? null : 'agent'); return }
      if (e.key === 'Escape') { setActiveDrawer(null); return }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' || e.key === 'Z') { e.preventDefault(); e.shiftKey ? redo() : undo() }
        else if (e.key === 'y' || e.key === 'Y') { e.preventDefault(); redo() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isGenerating, undo, redo, tourOpen])

  /* ── Helpers ── */
  const addMsg = useCallback((msg: Omit<Message, 'id' | 'time'>) => {
    setMessages((prev) => [...prev, { ...msg, id: makeId(), time: nowTime() }])
  }, [])

  const updateVariant = useCallback((id: VariantId, patch: Partial<VariantData>) => {
    setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)))
  }, [])

  function advanceStep(step: AgentStep) {
    setAgentStep(step)
    setAgentLabel(AGENT_STEPS.find((s) => s.step === step)?.label ?? '')
  }

  /* ── Generate ── */
  const handleGenerate = useCallback(async (prompt: string) => {
    if (isGenerating) return
    recordVersionAfterGen.current = true
    setIsGenerating(true)

    const userMsg: Message = { id: makeId(), role: 'user', text: prompt, time: nowTime(), type: 'normal' }
    const messagesWithUser = [...messages, userMsg]
    setMessages(messagesWithUser)

    pushUndoSnapshot({ variants, requirements, messages: messagesWithUser, currentVariant, tokenCount, agentStep, agentLabel })

    if (requirements.business.summary || requirements.guideline.summary) {
      addMsg({ role: 'system', text: 'Учитываю загруженные бизнес-требования и guideline при генерации.', type: 'system-context' })
    }

    advanceStep(1); await sleep(800)
    VARIANT_IDS.forEach((id) => updateVariant(id, { status: 'generating', html: null, url: null }))
    advanceStep(2); await sleep(1100)

    const key = detectTemplate(prompt)
    const base = TEMPLATES[key]
    updateVariant('A', { html: base, status: 'ready' })
    setCurrentVariant('A')
    addMsg({ role: 'agent', text: `✅ Вариант <strong>A</strong> готов — сгенерировал на основе «${escHtml(prompt)}».`, type: 'normal' })

    advanceStep(3); await sleep(900)
    updateVariant('B', { html: mutateTemplate(base, 2), status: 'ready' })
    updateVariant('C', { html: mutateTemplate(base, 3), status: 'ready' })
    advanceStep(4)
    setTokenCount((t) => t + 1800 + Math.floor(Math.random() * 400))

    const merged = mergeDocumentsForCompliance(requirements.business, requirements.guideline)
    const compliance: ComplianceItem[] = merged ? buildCompliance(merged) : [
      { label: 'Навигация реализована', status: 'ok' },
      { label: 'Мобильная адаптация', status: 'question' },
      { label: 'Форма обратной связи', status: 'ok' },
    ]
    addMsg({ role: 'agent', text: '', type: 'compliance', compliance })
    await sleep(600)

    const recommendations: Recommendation[] = [
      { title: 'Добавьте онбординг для новых пользователей', reason: 'Целевая аудитория — новые пользователи; без подсказок удержание снижается на 30–40%.' },
      { title: 'Упростите главный CTA до одного действия', reason: 'Сейчас три конкурирующих кнопки на первом экране снижают конверсию.' },
    ]
    addMsg({ role: 'agent', text: '', type: 'recommendation', recommendations })
    setIsGenerating(false)
  }, [isGenerating, requirements, messages, variants, currentVariant, tokenCount, agentStep, agentLabel, addMsg, updateVariant, pushUndoSnapshot])

  /* ── Load URL ── */
  const handleLoadUrl = useCallback((url: string, opts?: { priorMessages?: Message[] }) => {
    const msgsBase = opts?.priorMessages ?? messages
    pushUndoSnapshot({ variants, requirements, messages: msgsBase, currentVariant, tokenCount, agentStep, agentLabel })
    const agentMsg: Message = { id: makeId(), role: 'agent', text: `🌐 Сайт загружен в вариант <strong>${currentVariant}</strong>: <code style="font-size:11px;background:rgba(99,102,241,.15);padding:1px 5px;border-radius:4px">${url}</code>`, type: 'normal', time: nowTime() }
    const nextMessages = [...msgsBase, agentMsg]
    const nextVariants = variants.map((v) => v.id === currentVariant ? { ...v, url, html: null, status: 'ready' as const } : v)
    setVariants(nextVariants); setMessages(nextMessages)

    const entryId = makeId()
    setSiteVersions((prev) => [...prev, {
      id: entryId, title: 'Импорт URL',
      subtitle: url.replace(/^https?:\/\//, '').split('/')[0]?.slice(0, 40),
      createdAt: Date.now(), status: 'autosave',
      snapshot: cloneProjectSnapshot({ variants: nextVariants, requirements, messages: nextMessages, currentVariant, tokenCount, agentStep, agentLabel }),
    }])
    setActiveVersionId(entryId)
  }, [currentVariant, variants, requirements, messages, tokenCount, agentStep, agentLabel, pushUndoSnapshot])

  /* ── Chat send ── */
  const handleChatSend = useCallback((text: string) => {
    const urlMatch = text.match(/https?:\/\/[^\s]+/)
    if (urlMatch) {
      const clean = urlMatch[0].replace(/[.,;]$/, '')
      const userMsg: Message = { id: makeId(), role: 'user', text, type: 'normal', time: nowTime() }
      handleLoadUrl(clean, { priorMessages: [...messages, userMsg] })
      return
    }
    handleGenerate(text)
  }, [handleGenerate, handleLoadUrl, messages])

  /* ── Requirements change ── */
  const handleSlotDocumentChange = useCallback((slot: 'business' | 'guideline', doc: RequirementDocument) => {
    pushUndoSnapshot({ variants, requirements, messages, currentVariant, tokenCount, agentStep, agentLabel })
    setRequirements((prev) => ({ ...prev, [slot]: doc }))
    if (doc.raw) {
      const label = slot === 'business' ? 'Бизнес-требования' : 'Guideline'
      addMsg({ role: 'system', text: `<strong>${label}</strong>: загружено <strong>${doc.fileName ?? 'текст'}</strong>`, type: 'system-context' })
    }
  }, [addMsg, pushUndoSnapshot, variants, requirements, messages, currentVariant, tokenCount, agentStep, agentLabel])

  /* ── Fullscreen ── */
  const currentVariantData = variants.find((v) => v.id === currentVariant)
  const currentHtml = currentVariantData?.html ?? null
  const currentUrl = currentVariantData?.url ?? null
  const fullscreenPreset = (() => {
    const list = view === 'desktop' ? DESKTOP_RESOLUTIONS : MOBILE_RESOLUTIONS
    const id = view === 'desktop' ? desktopResolutionId : mobileResolutionId
    return getResolutionById(id, list) ?? list[0]!
  })()

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--color-bg)' }}>
      <TopBar
        projectName={projectName} view={view} tokenCount={tokenCount}
        canUndo={undoPast.length > 0 && !isGenerating}
        canRedo={undoFuture.length > 0 && !isGenerating}
        onViewChange={setView} onProjectRename={setProjectName}
        onUndo={undo} onRedo={redo} onOpenTour={() => setTourOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden min-h-0">
        <IconRail
          activeDrawer={activeDrawer}
          requirements={requirements}
          agentStep={agentStep}
          onToggle={setActiveDrawer}
        />

        <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden relative">
          <CenterPreview
            view={view} variants={variants} currentVariantId={currentVariant}
            desktopResolutionId={desktopResolutionId} mobileResolutionId={mobileResolutionId}
            onDesktopResolutionChange={setDesktopResolutionId}
            onMobileResolutionChange={setMobileResolutionId}
            desktopPresets={DESKTOP_RESOLUTIONS} mobilePresets={MOBILE_RESOLUTIONS}
            onSelectVariant={setCurrentVariant}
            onExpandFullscreen={() => setFullscreen(true)}
          />
          <VersionTimeline
            versions={siteVersions} activeId={activeVersionId}
            disabled={isGenerating} onSelect={restoreSiteVersion}
          />

          {/* Drawers overlay inside center */}
          <ChatDrawer
            open={activeDrawer === 'chat'} messages={messages}
            onClose={() => setActiveDrawer(null)} onSend={handleChatSend}
            onFileUpload={() => addMsg({ role: 'system', text: 'Загрузка макетов через чат пока в разработке — используйте панель «Документы» слева.', type: 'system-context' })}
          />
          <DocsDrawer
            open={activeDrawer === 'docs'}
            business={requirements.business} guideline={requirements.guideline}
            onClose={() => setActiveDrawer(null)} onSlotChange={handleSlotDocumentChange}
          />
          <AgentDrawer
            open={activeDrawer === 'agent'} agentStep={agentStep} agentLabel={agentLabel}
            onClose={() => setActiveDrawer(null)}
          />
        </div>
      </div>

      <StatusBar
        requirements={requirements} agentStep={agentStep} agentLabel={agentLabel}
        onOpenDrawer={setActiveDrawer}
      />

      <FullscreenOverlay
        open={fullscreen} html={currentHtml} url={currentUrl}
        variantId={currentVariant} view={view}
        logicalWidth={fullscreenPreset.width} logicalHeight={fullscreenPreset.height}
        onClose={() => setFullscreen(false)}
      />

      <OnboardingTour open={tourOpen} onDismiss={dismissTour} onComplete={completeTour} />
    </div>
  )
}

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function mergeDocumentsForCompliance(business: RequirementDocument, guideline: RequirementDocument): BTSummary | null {
  if (!business.summary && !guideline.summary) return null
  return {
    goals: [...(business.summary?.goals ?? []), ...(guideline.summary?.goals ?? [])],
    userRoles: [...(business.summary?.userRoles ?? []), ...(guideline.summary?.userRoles ?? [])],
    constraints: [...(business.summary?.constraints ?? []), ...(guideline.summary?.constraints ?? [])],
  }
}

function buildCompliance(summary: BTSummary): ComplianceItem[] {
  return [
    ...summary.goals.slice(0, 2).map((g) => ({ label: g.slice(0, 55), status: 'ok' as const })),
    ...summary.constraints.slice(0, 2).map((c) => ({ label: c.slice(0, 55), status: 'question' as const })),
    { label: 'Доступность (WCAG AA)', status: 'question' as const },
  ]
}
