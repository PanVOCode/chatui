import type { ChatPhase, DocCollection, DocEntry } from '../types'

export function getPhasePrompt(phase: ChatPhase): string {
  switch (phase) {
    case 'business_collect':
      return 'Загрузите бизнес-требования — прикрепите файл или введите текст. Можно пропустить.'
    case 'guideline_collect':
      return 'Есть гайдлайн? Загрузите файл, вставьте текст или пропустите.'
    case 'wishes_collect':
      return 'Есть пожелания? Напишите, загрузите файл или пропустите.'
    case 'review':
      return 'Данные собраны. Всё устраивает? Если нет — выберите раздел для редактирования.'
    case 'edit_business':
      return 'Обновите бизнес-требования — загрузите новый файл или введите текст.'
    case 'edit_guideline':
      return 'Обновите гайдлайн — загрузите новый файл или введите текст.'
    case 'edit_wishes':
      return 'Обновите пожелания — напишите или загрузите файл.'
    case 'done':
      return 'Готово. Данные собраны.'
    default:
      return ''
  }
}

export function getQuickReplies(phase: ChatPhase): string[] {
  switch (phase) {
    case 'greet':
      return ['Начать']
    case 'business_collect':
    case 'guideline_collect':
    case 'wishes_collect':
    case 'edit_business':
    case 'edit_guideline':
    case 'edit_wishes':
      return ['Пропустить']
    case 'review':
      return ['Бизнес-требования', 'Гайдлайн', 'Пожелания', 'Готово']
    default:
      return []
  }
}

export function validateDocCollection(docs: DocCollection): boolean {
  const hasEntry = (e: DocEntry) => !!(e.text || e.files.length)
  return hasEntry(docs.business) || hasEntry(docs.guideline) || hasEntry(docs.wishes)
}

export function isSkipReply(text: string): boolean {
  return /^(нет|no|не|пропустить|skip|дальше|готово|хватит)/i.test(text.trim())
}
