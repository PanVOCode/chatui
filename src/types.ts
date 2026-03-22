export type ViewMode = 'desktop' | 'phone'

export type ChatPhase =
  | 'greet'
  | 'business_collect'
  | 'guideline_collect'
  | 'wishes_collect'
  | 'review'
  | 'edit_business'
  | 'edit_guideline'
  | 'edit_wishes'
  | 'done'

export interface DocFile {
  url: string
  fileName: string
  content?: string  // текст документа или описание картинки от AI
}

export interface DocEntry {
  text: string
  files: DocFile[]
}

export interface DocCollection {
  business: DocEntry
  guideline: DocEntry
  wishes: DocEntry
}
export type VariantId = 'A' | 'B' | 'C'
export type AgentStep = 0 | 1 | 2 | 3 | 4
export type DrawerKind = 'chat' | 'docs' | 'agent' | null

export type MessageType = 'normal' | 'recommendation' | 'compliance' | 'warning' | 'system-context' | 'json-result'

export interface Message {
  id: string
  role: 'user' | 'agent' | 'system'
  text: string
  time: string
  type?: MessageType
  isThinking?: boolean
  compliance?: ComplianceItem[]
  recommendations?: Recommendation[]
  jsonData?: unknown
}

export interface ComplianceItem {
  label: string
  status: 'ok' | 'question' | 'fail'
}

export interface Recommendation {
  title: string
  reason: string
}

export interface VariantData {
  id: VariantId
  label: string
  html: string | null
  url: string | null
  status: 'empty' | 'generating' | 'ready'
}

export interface BTSummary {
  goals: string[]
  userRoles: string[]
  constraints: string[]
}

export interface RequirementDocument {
  raw: string
  summary: BTSummary | null
  fileName?: string
  fileUrl?: string  // URL документа на media.progressusbot.ru
}

export interface Requirements {
  business: RequirementDocument
  guideline: RequirementDocument
}
