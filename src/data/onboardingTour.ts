export type TourStepPlacement = 'center' | 'target'

/** Одна строка шпаргалки: готовая строка сочетания (без горы отдельных kbd). */
export interface TourShortcutLine {
  combo: string
  description: string
}

export interface TourStep {
  id: string
  placement: TourStepPlacement
  targetAttr?: string
  title: string
  body: string
  /** Короткие строки под текстом шага */
  shortcuts?: TourShortcutLine[]
  /** Только для финального шага: плотная таблица без дублирования kbd */
  cheatsheet?: TourShortcutLine[]
}

export const ONBOARDING_STORAGE_KEY = 'prototyper-onboarding-v1'

export function buildTourSteps(mod: string): TourStep[] {
  return [
    {
      id: 'welcome',
      placement: 'center',
      title: 'Добро пожаловать',
      body:
        'Короткий обзор: шапка, панель вариантов и документов слева, превью по центру, чат с агентом справа. Дальше — по зонам экрана.',
      shortcuts: [
        { combo: '?', description: 'Открыть этот тур (вне полей ввода)' },
        { combo: 'Shift + /', description: 'То же на части раскладок' },
      ],
    },
    {
      id: 'topbar-nav',
      placement: 'target',
      targetAttr: 'topbar-nav',
      title: 'Навигация и история',
      body:
        '«Назад» — выход из экрана (с подтверждением, если есть несохранённые варианты). Следующие кнопки — отмена и возврат последних изменений в проекте.',
      shortcuts: [
        { combo: `${mod} + Z`, description: 'Отменить' },
        { combo: `${mod} + Shift + Z`, description: 'Вернуть отменённое' },
        { combo: `${mod} + Y`, description: 'Вернуть (как в Windows)' },
      ],
    },
    {
      id: 'topbar-context',
      placement: 'target',
      targetAttr: 'topbar-context',
      title: 'Проект и режим превью',
      body:
        'Имя проекта — клик для переименования. Кнопка «?» снова откроет тур. Переключатель Desktop / Phone задаёт тип превью. Счётчик токенов и аватары — контекст сессии.',
    },
    {
      id: 'left',
      placement: 'target',
      targetAttr: 'left-panel',
      title: 'Варианты и входные данные',
      body:
        'Варианты A, B и C — отдельные прототипы. Ниже — бизнес-требования и guideline (файл или текст). Блок «Агент» показывает ход генерации.',
    },
    {
      id: 'versions',
      placement: 'target',
      targetAttr: 'version-timeline',
      title: 'Версии на линии времени',
      body:
        'Внизу центральной колонки (превью) — горизонтальная ось: слева направо от старых версий к новым. После генерации или импорта URL появляется точка. Нажмите запись, чтобы восстановить прототип на тот момент (стек отмены Ctrl+Z при этом сбрасывается).',
    },
    {
      id: 'center',
      placement: 'target',
      targetAttr: 'center-preview',
      title: 'Превью',
      body:
        'Логический вьюпорт на сетке; список разрешений меняет ширину и высоту. Full-size — оверлей на весь экран, если есть HTML или URL.',
      shortcuts: [{ combo: 'Esc', description: 'Закрыть полноэкранный просмотр' }],
    },
    {
      id: 'chat',
      placement: 'target',
      targetAttr: 'chat-panel',
      title: 'Диалог с агентом',
      body:
        'Опишите задачу или вставьте URL — ссылка загрузится в текущий вариант. Кнопки «Прикрепить», «Макет», «Голос» пока заглушки (скоро).',
      shortcuts: [
        { combo: 'Enter', description: 'Отправить' },
        { combo: 'Shift + Enter', description: 'Новая строка в поле ввода' },
      ],
    },
    {
      id: 'cheatsheet',
      placement: 'center',
      title: 'Горячие клавиши',
      body: 'Работают, когда фокус не в поле ввода, textarea или contenteditable.',
      cheatsheet: [
        { combo: `${mod} + Z`, description: 'Отменить последнее действие' },
        { combo: `${mod} + Shift + Z`, description: 'Вернуть после отмены' },
        { combo: `${mod} + Y`, description: 'Вернуть (Windows)' },
        { combo: 'Esc', description: 'Закрыть полноэкранный просмотр' },
        { combo: '?  ·  Shift + /', description: 'Открыть этот тур' },
        { combo: 'Enter / ← / →', description: 'Шаги тура (пока тур открыт)' },
      ],
    },
  ]
}
