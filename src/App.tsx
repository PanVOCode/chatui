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
// import { TEMPLATES, detectTemplate, mutateTemplate } from './data/templates'
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
import {
  getPhasePrompt,
  getQuickReplies,
  validateDocCollection,
  isSkipReply,
} from './lib/chatPhaseTransitions'
import { recognizeSpeech } from './lib/speechKitApi'
import { isImageFile, parsePdf } from './lib/publishApi'
import { useVoiceRecorder } from './hooks/useVoiceRecorder'
import { useFileUpload } from './hooks/useFileUpload'
import type {
  AgentStep,
  BTSummary,
  ChatPhase,
  DocCollection,
  DocEntry,
  DocFile,
  DrawerKind,
  Message,
  RequirementDocument,
  Requirements,
  VariantData,
  VariantId,
  ViewMode,
} from './types'

function makeId() { return Math.random().toString(36).slice(2) }
function nowTime() { return new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }) }
function esc(s: string) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }

const EMPTY_ENTRY: DocEntry = { text: '', files: [] }
const EMPTY_DOCS: DocCollection = { business: EMPTY_ENTRY, guideline: EMPTY_ENTRY, wishes: EMPTY_ENTRY }

export default function App() {
  // ── UI state ──────────────────────────────────────────────────────────────
  const [view, setView]                         = useState<ViewMode>('desktop')
  const [currentVariant, setCurrentVariant]     = useState<VariantId>('A')
  const [projectName, setProjectName]           = useState('Без названия')
  const [tokenCount, setTokenCount]             = useState(0)
  const [fullscreen, setFullscreen]             = useState(false)
  const [desktopResolutionId, setDesktopResolutionId] = useState(DEFAULT_DESKTOP_RESOLUTION_ID)
  const [mobileResolutionId, setMobileResolutionId]   = useState(DEFAULT_MOBILE_RESOLUTION_ID)
  const [isGenerating]                          = useState(false)
  const [agentStep, setAgentStep]               = useState<AgentStep>(0)
  const [agentLabel, setAgentLabel]             = useState('')
  const [activeDrawer, setActiveDrawer]         = useState<DrawerKind>(null)
  const [tourOpen, setTourOpen]                 = useState(false)

  // ── Requirements (для DocsDrawer совместимости) ───────────────────────────
  const [requirements, setRequirements] = useState<Requirements>({
    business: { raw: '', summary: null },
    guideline: { raw: '', summary: null },
  })

  // ── Variants ──────────────────────────────────────────────────────────────
  const [variants, setVariants] = useState<VariantData[]>([
    { id: 'A', label: 'Вариант A', html: null, url: null, status: 'empty' },
    { id: 'B', label: 'Вариант B', html: null, url: null, status: 'empty' },
    { id: 'C', label: 'Вариант C', html: null, url: null, status: 'empty' },
  ])

  // ── Chat phase machine ────────────────────────────────────────────────────
  const [chatPhase, setChatPhase]         = useState<ChatPhase>('greet')
  const [docCollection, setDocCollection] = useState<DocCollection>(EMPTY_DOCS)
  // prefillText/prefillKey: only set when entering an edit phase (not derived live from docCollection)
  const [prefillText, setPrefillText]     = useState<string | undefined>(undefined)
  const [prefillKey, setPrefillKey]       = useState(0)

  // ── Messages ──────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([{
    id: makeId(), role: 'agent', time: nowTime(), type: 'normal',
    text: 'Привет! Я соберу данные для генерации прототипа.',
  }])

  // ── Undo/redo & versions ──────────────────────────────────────────────────
  const [undoPast, setUndoPast]             = useState<ProjectUndoSnapshot[]>([])
  const [undoFuture, setUndoFuture]         = useState<ProjectUndoSnapshot[]>([])
  const [siteVersions, setSiteVersions]     = useState<SiteVersionEntry[]>([])
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null)

  const snapshotRef          = useRef<ProjectUndoSnapshot | null>(null)
  const recordVersionAfterGen = useRef(false)

  useEffect(() => {
    snapshotRef.current = { variants, requirements, messages, currentVariant, tokenCount, agentStep, agentLabel }
  }, [variants, requirements, messages, currentVariant, tokenCount, agentStep, agentLabel])

  // ── Voice ─────────────────────────────────────────────────────────────────
  const handleAudioReady = useCallback(async (blob: Blob) => {
    const text = await recognizeSpeech(blob)
    if (text) dispatchChat(text)
  }, [])

  const { voiceState, elapsed: voiceElapsed, error: voiceError, startRecording, stopRecording, cancelRecording } =
    useVoiceRecorder(handleAudioReady)

  // ── File upload ───────────────────────────────────────────────────────────
  const { uploadFile } = useFileUpload()

  // ── Helpers ───────────────────────────────────────────────────────────────
  const addMsg = useCallback((msg: Omit<Message, 'id' | 'time'>) => {
    setMessages((prev) => [...prev, { ...msg, id: makeId(), time: nowTime() }])
  }, [])

  // ── Chat phase state machine ──────────────────────────────────────────────
  type FileAttachment = DocFile[]

  function setEntry(field: keyof DocCollection, text: string, newFiles: FileAttachment) {
    setDocCollection((prev) => ({
      ...prev,
      [field]: {
        text: text || prev[field].text,
        files: [...prev[field].files, ...newFiles],
      },
    }))
  }

  function entryDesc(e: DocEntry): string {
    const parts: string[] = []
    if (e.text) parts.push(esc(e.text.slice(0, 120)) + (e.text.length > 120 ? '…' : ''))
    e.files.forEach((f) => parts.push(
      `<a href="${f.url}" target="_blank" style="color:var(--color-accent)">${esc(f.fileName)}</a>`
    ))
    return parts.join('<br/>')
  }

  function goToReview() {
    setDocCollection((docs) => {
      if (!validateDocCollection(docs)) {
        addMsg({ role: 'agent', type: 'normal', text: 'Нужен хотя бы один документ. Загрузите что-нибудь.' })
        setChatPhase('business_collect')
        setTimeout(() => addMsg({ role: 'agent', text: getPhasePrompt('business_collect'), type: 'normal' }), 300)
      } else {
        const summary = [
          `Бизнес: ${docs.business.text || docs.business.files.length ? entryDesc(docs.business) : '—'}`,
          `Гайдлайн: ${docs.guideline.text || docs.guideline.files.length ? entryDesc(docs.guideline) : '—'}`,
          `Пожелания: ${docs.wishes.text || docs.wishes.files.length ? entryDesc(docs.wishes) : '—'}`,
        ].join('<br/>')
        addMsg({ role: 'agent', text: `${getPhasePrompt('review')}<br/><br/>${summary}`, type: 'normal' })
        setChatPhase('review')
      }
      return docs
    })
  }

  const dispatchChat = useCallback((text: string, files: FileAttachment = []) => {
    const fileNames = files.map((f) => esc(f.fileName)).join(', ')
    const display = text || (fileNames ? fileNames : '')
    if (display) addMsg({ role: 'user', text: display, type: 'normal' })

    setChatPhase((phase) => {
      const skip = isSkipReply(text) && files.length === 0

      switch (phase) {
        case 'greet': {
          setTimeout(() => addMsg({ role: 'agent', text: getPhasePrompt('business_collect'), type: 'normal' }), 100)
          return 'business_collect'
        }

        case 'business_collect': {
          if (!skip) setEntry('business', text, files)
          setTimeout(() => addMsg({ role: 'agent', text: getPhasePrompt('guideline_collect'), type: 'normal' }), 100)
          return 'guideline_collect'
        }

        case 'guideline_collect': {
          if (!skip) setEntry('guideline', text, files)
          setTimeout(() => addMsg({ role: 'agent', text: getPhasePrompt('wishes_collect'), type: 'normal' }), 100)
          return 'wishes_collect'
        }

        case 'wishes_collect': {
          if (!skip) setEntry('wishes', text, files)
          setTimeout(() => goToReview(), 100)
          return 'wishes_collect'
        }

        case 'review': {
          if (/бизнес/i.test(text)) {
            setDocCollection((docs) => {
              setPrefillText(docs.business.text)
              setPrefillKey((k) => k + 1)
              const desc = entryDesc(docs.business)
              const msg = desc
                ? `Текущее:<br/>${desc}<br/><br/>${getPhasePrompt('edit_business')}`
                : getPhasePrompt('edit_business')
              setTimeout(() => addMsg({ role: 'agent', text: msg, type: 'normal' }), 100)
              return docs
            })
            return 'edit_business'
          }
          if (/гайд/i.test(text)) {
            setDocCollection((docs) => {
              setPrefillText(docs.guideline.text)
              setPrefillKey((k) => k + 1)
              const desc = entryDesc(docs.guideline)
              const msg = desc
                ? `Текущее:<br/>${desc}<br/><br/>${getPhasePrompt('edit_guideline')}`
                : getPhasePrompt('edit_guideline')
              setTimeout(() => addMsg({ role: 'agent', text: msg, type: 'normal' }), 100)
              return docs
            })
            return 'edit_guideline'
          }
          if (/пожелани/i.test(text)) {
            setDocCollection((docs) => {
              setPrefillText(docs.wishes.text)
              setPrefillKey((k) => k + 1)
              const desc = entryDesc(docs.wishes)
              const msg = desc
                ? `Текущее:<br/>${desc}<br/><br/>${getPhasePrompt('edit_wishes')}`
                : getPhasePrompt('edit_wishes')
              setTimeout(() => addMsg({ role: 'agent', text: msg, type: 'normal' }), 100)
              return docs
            })
            return 'edit_wishes'
          }
          // "Готово"
          setDocCollection((docs) => {
            const toOutput = (entry: DocEntry) => {
              const docTexts = entry.files
                .filter((f) => !isImageFile(f.fileName) && f.content)
                .map((f) => f.content!)
              const mergedText = [entry.text, ...docTexts].filter(Boolean).join('\n\n')
              const images = entry.files.filter((f) => isImageFile(f.fileName))
              return { text: mergedText, files: images }
            }
            const output = {
              business: toOutput(docs.business),
              guideline: toOutput(docs.guideline),
              wishes: toOutput(docs.wishes),
            }
            console.log('[chatui] docCollection:', JSON.stringify(output, null, 2))
            return docs
          })
          setTimeout(() => addMsg({ role: 'agent', text: getPhasePrompt('done'), type: 'normal' }), 100)
          return 'done'
        }

        case 'edit_business': {
          if (!skip) setEntry('business', text, files)
          setPrefillText(undefined)
          setTimeout(() => goToReview(), 100)
          return 'edit_business'
        }
        case 'edit_guideline': {
          if (!skip) setEntry('guideline', text, files)
          setPrefillText(undefined)
          setTimeout(() => goToReview(), 100)
          return 'edit_guideline'
        }
        case 'edit_wishes': {
          if (!skip) setEntry('wishes', text, files)
          setPrefillText(undefined)
          setTimeout(() => goToReview(), 100)
          return 'edit_wishes'
        }

        default:
          return phase
      }
    })
  }, [addMsg])

  // ── Submit (текст + файлы вместе) ─────────────────────────────────────────
  const handleSubmit = useCallback(async (typedText: string, rawFiles: File[]) => {
    const isEditPhase = chatPhase === 'edit_business' || chatPhase === 'edit_guideline' || chatPhase === 'edit_wishes'
    if (!typedText.trim() && rawFiles.length === 0 && !isEditPhase) return

    const uploaded: FileAttachment = []
    const extractedTexts: string[] = []

    for (const file of rawFiles) {
      addMsg({ role: 'system', text: `Загружаю <strong>${esc(file.name)}</strong>…`, type: 'system-context' })
      try {
        if (file.name.toLowerCase().endsWith('.pdf')) {
          const { text: pdfText, images } = await parsePdf(file)
          if (pdfText) extractedTexts.push(pdfText)
          for (const img of images) uploaded.push(img)
          addMsg({
            role: 'system',
            text: `PDF обработан: ${images.length} изображений извлечено`,
            type: 'system-context',
          })
        } else {
          const { url, fileName, content } = await uploadFile(file)
          uploaded.push({ url, fileName, content })
          addMsg({ role: 'system', text: `Загружено: <strong>${esc(fileName)}</strong>`, type: 'system-context' })
        }
      } catch (e) {
        addMsg({ role: 'system', text: `Ошибка: ${esc(e instanceof Error ? e.message : 'Ошибка загрузки')}`, type: 'system-context' })
      }
    }

    const combinedText = [typedText.trim(), ...extractedTexts].filter(Boolean).join('\n\n')
    dispatchChat(combinedText, uploaded)
  }, [addMsg, uploadFile, dispatchChat, chatPhase])

  // ── DocsDrawer slot change (совместимость) ────────────────────────────────
  const handleSlotDocumentChange = useCallback((slot: 'business' | 'guideline', doc: RequirementDocument) => {
    setRequirements((prev) => ({ ...prev, [slot]: doc }))
    if (doc.raw) {
      setDocCollection((prev) => ({
        ...prev,
        [slot]: {
          text: doc.raw,
          files: doc.fileUrl ? [{ url: doc.fileUrl, fileName: doc.fileName ?? '' }] : [],
        },
      }))
      addMsg({ role: 'system', text: `<strong>${slot === 'business' ? 'Бизнес-требования' : 'Guideline'}</strong>: загружено <strong>${doc.fileName ?? 'текст'}</strong>`, type: 'system-context' })
    }
  }, [addMsg])

  // ── Undo/redo ─────────────────────────────────────────────────────────────
  const applySnapshot = useCallback((s: ProjectUndoSnapshot) => {
    const c = cloneProjectSnapshot(s)
    setVariants(c.variants); setRequirements(c.requirements); setMessages(c.messages)
    setCurrentVariant(c.currentVariant); setTokenCount(c.tokenCount)
    setAgentStep(c.agentStep); setAgentLabel(c.agentLabel)
  }, [])

  const undo = useCallback(() => {
    if (isGenerating) return
    setUndoPast((p) => {
      if (!p.length) return p
      const prev = p[p.length - 1]!
      setUndoFuture((f) => [cloneProjectSnapshot(snapshotRef.current!), ...f].slice(0, MAX_UNDO_DEPTH))
      applySnapshot(prev)
      return p.slice(0, -1)
    })
  }, [isGenerating, applySnapshot])

  const redo = useCallback(() => {
    if (isGenerating) return
    setUndoFuture((f) => {
      if (!f.length) return f
      const next = f[0]!
      setUndoPast((p) => [...p, cloneProjectSnapshot(snapshotRef.current!)].slice(-MAX_UNDO_DEPTH))
      applySnapshot(next)
      return f.slice(1)
    })
  }, [isGenerating, applySnapshot])

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
    setSiteVersions((prev) => [...prev, { id: entryId, title: 'Генерация вариантов A–C', createdAt: Date.now(), status: 'draft', snapshot: snap }])
    setActiveVersionId(entryId)
  }, [isGenerating, agentStep, variants, requirements, messages, currentVariant, tokenCount, agentLabel])

  // ── Tour & keyboard ───────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const v = localStorage.getItem(ONBOARDING_STORAGE_KEY)
      if (v !== 'completed' && v !== 'dismissed' && v !== 'done') setTourOpen(true)
    } catch { /* storage blocked */ }
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
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); e.shiftKey ? redo() : undo() }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isGenerating, undo, redo, tourOpen])

  // ── Computed ──────────────────────────────────────────────────────────────
  const currentVariantData  = variants.find((v) => v.id === currentVariant)
  const currentHtml         = currentVariantData?.html ?? null
  const currentUrl          = currentVariantData?.url ?? null
  const fullscreenPreset    = (() => {
    const list = view === 'desktop' ? DESKTOP_RESOLUTIONS : MOBILE_RESOLUTIONS
    const id   = view === 'desktop' ? desktopResolutionId : mobileResolutionId
    return getResolutionById(id, list) ?? list[0]!
  })()

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--color-bg)' }}>
      <TopBar
        projectName={projectName} view={view}
        canUndo={undoPast.length > 0 && !isGenerating}
        canRedo={undoFuture.length > 0 && !isGenerating}
        onViewChange={setView} onProjectRename={setProjectName}
        onUndo={undo} onRedo={redo} onOpenTour={() => setTourOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden min-h-0">
        <IconRail activeDrawer={activeDrawer} requirements={requirements} agentStep={agentStep} onToggle={setActiveDrawer} />

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
          <VersionTimeline versions={siteVersions} activeId={activeVersionId} disabled={isGenerating} onSelect={restoreSiteVersion} />

          <ChatDrawer
            open={activeDrawer === 'chat'}
            messages={messages}
            quickReplies={getQuickReplies(chatPhase)}
            voiceState={voiceState}
            voiceElapsed={voiceElapsed}
            voiceError={voiceError}
            prefillText={prefillText}
            prefillKey={prefillKey}
            canSubmitEmpty={chatPhase === 'edit_business' || chatPhase === 'edit_guideline' || chatPhase === 'edit_wishes'}
            sectionFiles={(() => {
              const field =
                chatPhase === 'business_collect' || chatPhase === 'edit_business' ? docCollection.business :
                chatPhase === 'guideline_collect' || chatPhase === 'edit_guideline' ? docCollection.guideline :
                chatPhase === 'wishes_collect' || chatPhase === 'edit_wishes' ? docCollection.wishes : null
              return field?.files ?? []
            })()}
            onRemoveSectionFile={(idx) => {
              const field =
                chatPhase === 'business_collect' || chatPhase === 'edit_business' ? 'business' :
                chatPhase === 'guideline_collect' || chatPhase === 'edit_guideline' ? 'guideline' :
                chatPhase === 'wishes_collect' || chatPhase === 'edit_wishes' ? 'wishes' : null
              if (!field) return
              setDocCollection((prev) => ({
                ...prev,
                [field]: { ...prev[field], files: prev[field].files.filter((_, i) => i !== idx) },
              }))
            }}
            onClose={() => setActiveDrawer(null)}
            onSubmit={handleSubmit}
            onVoiceStart={startRecording}
            onVoiceStop={stopRecording}
            onVoiceCancel={cancelRecording}
          />
          <DocsDrawer
            open={activeDrawer === 'docs'}
            business={requirements.business} guideline={requirements.guideline}
            onClose={() => setActiveDrawer(null)} onSlotChange={handleSlotDocumentChange}
          />
          <AgentDrawer open={activeDrawer === 'agent'} agentStep={agentStep} agentLabel={agentLabel} onClose={() => setActiveDrawer(null)} />
        </div>
      </div>

      <StatusBar requirements={requirements} agentStep={agentStep} agentLabel={agentLabel} onOpenDrawer={setActiveDrawer} />

      <FullscreenOverlay
        open={fullscreen} html={currentHtml} url={currentUrl}
        variantId={currentVariant} view={view}
        logicalWidth={fullscreenPreset.width} logicalHeight={fullscreenPreset.height}
        onClose={() => setFullscreen(false)}
      />

      <OnboardingTour open={tourOpen} onDismiss={() => { try { localStorage.setItem(ONBOARDING_STORAGE_KEY, 'dismissed') } catch {/**/ } setTourOpen(false) }} onComplete={() => { try { localStorage.setItem(ONBOARDING_STORAGE_KEY, 'completed') } catch {/**/ } setTourOpen(false) }} />
    </div>
  )
}

// Helpers ────────────────────────────────────────────────────────────────────

function mergeDocumentsForCompliance(business: RequirementDocument, guideline: RequirementDocument): BTSummary | null {
  if (!business.summary && !guideline.summary) return null
  return {
    goals: [...(business.summary?.goals ?? []), ...(guideline.summary?.goals ?? [])],
    userRoles: [...(business.summary?.userRoles ?? []), ...(guideline.summary?.userRoles ?? [])],
    constraints: [...(business.summary?.constraints ?? []), ...(guideline.summary?.constraints ?? [])],
  }
}

void mergeDocumentsForCompliance
