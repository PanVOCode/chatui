export interface LanggraphInput {
  messages: Array<{ type: 'human'; content: string }>
  json_data: {
    site_target: 'mobile' | 'desktop'
    site_pages: string[]
    strategy: {
      brand_name: string
      activity: string
      audience: string
      positioning: string
      usp: string
      offer: string
      guarantees: string
      site_goal: string
      price: string
      work_hours: string
      address: string
      contacts: {
        telegram: boolean
        phone: boolean
        phone_link: string
        form: boolean
        form_link: string
      }
      business_requirements_ref: string
    }
    design: {
      style: string
      typography: string
      animations: string
      reviews: string
      faq: string
      screen_settings: string
      integrations_ui: string
    }
    rkn: {
      rkn_type: string
      name: string
      inn: string
      address: string
      email: string
    }
  }
  repo_name: string
  site_url: string
  iteration_count: 0
  files_created: []
}

export type QuestionId =
  | 'brand_name' | 'site_target' | 'site_pages'
  | 'activity' | 'audience' | 'positioning' | 'usp' | 'offer'
  | 'guarantees' | 'site_goal' | 'price' | 'work_hours' | 'address'
  | 'phone' | 'telegram' | 'design_style' | 'design_typography' | 'design_animations'
  | 'rkn_type' | 'rkn_name' | 'rkn_inn' | 'rkn_address' | 'rkn_email'
  | 'repo_name' | 'site_url'

export interface QuestionDef {
  id: QuestionId
  text: string
  hint?: string
  placeholder?: string
  optional?: boolean
}

export const QUESTIONS: QuestionDef[] = [
  { id: 'brand_name',          text: 'Как называется бренд или компания?', placeholder: 'УниверсалБанк' },
  { id: 'site_target',         text: 'Тип интерфейса — напишите <strong>mobile</strong> или <strong>desktop</strong>.', placeholder: 'mobile / desktop' },
  { id: 'site_pages',          text: 'Какие страницы нужны? Перечислите через запятую.', placeholder: 'home, history, detail, settings' },
  { id: 'activity',            text: 'Что делает компания / сервис? Опишите в одном-двух предложениях.', placeholder: 'Мобильное приложение банка для физических лиц…' },
  { id: 'audience',            text: 'Кто целевая аудитория?', placeholder: 'Физические лица, управляющие финансами через смартфон…' },
  { id: 'positioning',         text: 'В чём главная ценность? (позиционирование)', placeholder: 'Прозрачная история операций в одном месте…' },
  { id: 'usp',                 text: 'Уникальное торговое предложение — чем отличаетесь от конкурентов?', placeholder: 'Сводная история по всем счётам; фильтры; экспорт…' },
  { id: 'offer',               text: 'Что именно предлагаете пользователю (оффер)?', placeholder: 'Просмотр истории, фильтрация, детали операции…' },
  { id: 'guarantees',          text: 'Гарантии и нефункциональные требования?', hint: 'Скорость, безопасность, платформы — или «нет»', placeholder: 'Загрузка до 3с, SSL/TLS, Android ≥ 8.0…', optional: true },
  { id: 'site_goal',           text: 'Цель сайта?', hint: 'Доверие / Продажи / Информирование / Лиды', placeholder: 'Доверие' },
  { id: 'price',               text: 'Ценовой сегмент?', hint: 'Низкий / Средний / Высокий / Премиум', placeholder: 'Средний' },
  { id: 'work_hours',          text: 'Часы работы?', placeholder: 'Круглосуточно', optional: true },
  { id: 'address',             text: 'Адрес или регион присутствия?', placeholder: 'Россия', optional: true },
  { id: 'phone',               text: 'Телефон для связи? (или «нет»)', placeholder: '+78001234567', optional: true },
  { id: 'telegram',            text: 'Telegram-канал или бот? (или «нет»)', placeholder: '@username', optional: true },
  { id: 'design_style',        text: 'Опишите желаемый стиль дизайна.', placeholder: 'Финтех, светлая тема, карточки, нижняя навигация…', optional: true },
  { id: 'design_typography',   text: 'Объём типографики?', hint: 'Минимальный / Средний / Большой', placeholder: 'Средний', optional: true },
  { id: 'design_animations',   text: 'Анимации?', hint: 'Нет / Деликатные / Выразительные', placeholder: 'Деликатные', optional: true },
  { id: 'rkn_type',            text: 'Организационно-правовая форма?', hint: 'ИП / ООО / ПАО / АО', placeholder: 'ООО', optional: true },
  { id: 'rkn_name',            text: 'Официальное юридическое название?', placeholder: 'ООО «Компания»', optional: true },
  { id: 'rkn_inn',             text: 'ИНН?', placeholder: '7700000000', optional: true },
  { id: 'rkn_address',         text: 'Юридический адрес?', placeholder: 'г. Москва, ул. Примерная, д. 1', optional: true },
  { id: 'rkn_email',           text: 'Email для юридической связи?', placeholder: 'legal@company.ru', optional: true },
  { id: 'repo_name',           text: 'Slug репозитория (латиница, дефисы)?', placeholder: 'company-site-2026', optional: true },
  { id: 'site_url',            text: 'URL где будет размещён сайт?', placeholder: 'https://automatoria.ru/company-site/', optional: true },
]

export type QuestionnaireAnswers = Partial<Record<QuestionId, string>>

export function buildLanggraphInput(answers: QuestionnaireAnswers): LanggraphInput {
  const brandName  = answers.brand_name ?? ''
  const siteTarget = answers.site_target?.toLowerCase().includes('mobile') ? 'mobile' : 'desktop'

  const sitePages  = (answers.site_pages ?? 'home')
    .split(/[,;]+/)
    .map((s) => s.trim().toLowerCase().replace(/\s+/g, '-'))
    .filter(Boolean)

  const phone    = answers.phone    && !/^нет$/i.test(answers.phone.trim())    ? answers.phone.trim()    : ''
  const telegram = answers.telegram && !/^нет$/i.test(answers.telegram.trim()) ? answers.telegram.trim() : ''

  const repoSlug  = answers.repo_name
    || brandName.toLowerCase().replace(/[^a-z0-9а-яёА-ЯЁ]+/gi, '-').replace(/^-|-$/g, '') + '-' + new Date().getFullYear()
  const siteUrl   = answers.site_url || `https://automatoria.ru/${repoSlug}/`
  const prompt    = `Сгенерируй прототип веб-интерфейса (${siteTarget === 'mobile' ? 'мобильный first' : 'десктоп'}) по json_data: ${answers.activity || brandName}.`

  return {
    messages: [{ type: 'human', content: prompt }],
    json_data: {
      site_target: siteTarget as 'mobile' | 'desktop',
      site_pages:  sitePages,
      strategy: {
        brand_name:              brandName,
        activity:                answers.activity    ?? '',
        audience:                answers.audience    ?? '',
        positioning:             answers.positioning ?? '',
        usp:                     answers.usp         ?? '',
        offer:                   answers.offer       ?? '',
        guarantees:              answers.guarantees  ?? '',
        site_goal:               answers.site_goal   ?? 'Доверие',
        price:                   answers.price       ?? 'Средний',
        work_hours:              answers.work_hours  ?? '',
        address:                 answers.address     ?? '',
        contacts: {
          telegram:    !!telegram,
          phone:       !!phone,
          phone_link:  phone,
          form:        true,
          form_link:   '#support',
        },
        business_requirements_ref: '',
      },
      design: {
        style:          answers.design_style        ?? '',
        typography:     answers.design_typography   ?? 'Средний',
        animations:     answers.design_animations   ?? 'Деликатные',
        reviews:        '',
        faq:            '',
        screen_settings:  '',
        integrations_ui:  '',
      },
      rkn: {
        rkn_type: answers.rkn_type    ?? '',
        name:     answers.rkn_name    ?? '',
        inn:      answers.rkn_inn     ?? '',
        address:  answers.rkn_address ?? '',
        email:    answers.rkn_email   ?? '',
      },
    },
    repo_name:       repoSlug,
    site_url:        siteUrl,
    iteration_count: 0,
    files_created:   [],
  }
}
