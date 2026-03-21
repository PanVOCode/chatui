import type { AgentStep, Message, Requirements, VariantData, VariantId } from '../types'

/** Снимок рабочего состояния для отката / повтора. */
export interface ProjectUndoSnapshot {
  variants: VariantData[]
  requirements: Requirements
  messages: Message[]
  currentVariant: VariantId
  tokenCount: number
  agentStep: AgentStep
  agentLabel: string
}

export const MAX_UNDO_DEPTH = 50

export function cloneProjectSnapshot(s: ProjectUndoSnapshot): ProjectUndoSnapshot {
  return structuredClone(s)
}

/** Запись на линии времени версий прототипа (точка восстановления). */
export type SiteVersionStatus = 'draft' | 'live' | 'autosave'

export interface SiteVersionEntry {
  id: string
  title: string
  subtitle?: string
  createdAt: number
  status: SiteVersionStatus
  snapshot: ProjectUndoSnapshot
}
