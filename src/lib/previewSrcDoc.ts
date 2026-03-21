import type { ViewMode } from '../types'

/** Убирает device-width viewport, чтобы документ считал ширину = логической (как на мониторе). */
export function injectFixedViewport(html: string, width: number): string {
  const stripped = html.replace(/<meta[^>]*name\s*=\s*["']viewport["'][^>]*>/gi, '')
  const tag = `<meta name="viewport" content="width=${width}, initial-scale=1">`
  const lower = stripped.toLowerCase()
  const headIdx = lower.indexOf('<head>')
  if (headIdx !== -1) return stripped.slice(0, headIdx + 6) + tag + stripped.slice(headIdx + 6)
  const htmlIdx = lower.indexOf('<html')
  const afterHtml = htmlIdx !== -1 ? stripped.indexOf('>', htmlIdx) + 1 : 0
  return stripped.slice(0, afterHtml) + tag + stripped.slice(afterHtml)
}

/**
 * Мобильное превью: во вложенном iframe `device-width` = ширина iframe.
 */
export function injectMobilePreviewViewport(html: string): string {
  const stripped = html.replace(/<meta[^>]*name\s*=\s*["']viewport["'][^>]*>/gi, '')
  const tag =
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
  const lower = stripped.toLowerCase()
  const headIdx = lower.indexOf('<head>')
  if (headIdx !== -1) return stripped.slice(0, headIdx + 6) + tag + stripped.slice(headIdx + 6)
  const htmlIdx = lower.indexOf('<html')
  const afterHtml = htmlIdx !== -1 ? stripped.indexOf('>', htmlIdx) + 1 : 0
  return stripped.slice(0, afterHtml) + tag + stripped.slice(afterHtml)
}

const PREVIEW_HIDE_SCROLLBAR_STYLE =
  '<style data-prototyper-hide-scrollbar>' +
  'html,body,*{scrollbar-width:none;-ms-overflow-style:none;}' +
  '*::-webkit-scrollbar{width:0!important;height:0!important;display:none!important}' +
  '</style>'

/**
 * Ранний скрипт: часть библиотек отключает анимации, если `top !== self`.
 * В sandbox/iframe это ломает превью. Подмена срабатывает не везде (неконфигурируемые свойства), но помогает во многих случаях.
 */
const EMBED_COMPAT_SCRIPT =
  '<script data-prototyper-embed-compat>' +
  '(function(){try{var o=window;function f(){return o}' +
  'try{Object.defineProperty(o,"top",{get:f,configurable:true})}catch(e){}' +
  'try{Object.defineProperty(o,"parent",{get:f,configurable:true})}catch(e2){}' +
  '}catch(e3){}})();' +
  '<\/script>'

/** Максимально широкая Permissions Policy для встроенного превью (что браузер разрешит во фрейме). */
export const PREVIEW_IFRAME_ALLOW =
  'accelerometer; autoplay; camera; clipboard-read; clipboard-write; display-capture; ' +
  'encrypted-media; fullscreen; gamepad; geolocation; gyroscope; magnetometer; microphone; ' +
  'midi; payment; picture-in-picture; publickey-credentials-get; screen-wake-lock; usb; ' +
  'web-share; xr-spatial-tracking'

/** Общие атрибуты iframe для превью: без sandbox — максимум возможностей (прототипы доверенные локально). */
export const PREVIEW_IFRAME_ATTRS = {
  allow: PREVIEW_IFRAME_ALLOW,
  allowFullScreen: true,
} as const

/** Вставляет совместимый скрипт в конец `<head>`, чтобы meta/viewport оставались первыми. */
export function injectEmbedCompat(html: string): string {
  if (html.includes('data-prototyper-embed-compat')) return html
  const lower = html.toLowerCase()
  const headClose = lower.indexOf('</head>')
  if (headClose !== -1) return html.slice(0, headClose) + EMBED_COMPAT_SCRIPT + html.slice(headClose)
  const headOpen = lower.indexOf('<head>')
  if (headOpen !== -1) {
    const after = headOpen + 6
    return html.slice(0, after) + EMBED_COMPAT_SCRIPT + html.slice(after)
  }
  const htmlIdx = lower.indexOf('<html')
  if (htmlIdx !== -1) {
    const afterTag = html.indexOf('>', htmlIdx) + 1
    return html.slice(0, afterTag) + '<head>' + EMBED_COMPAT_SCRIPT + '</head>' + html.slice(afterTag)
  }
  return EMBED_COMPAT_SCRIPT + html
}

/** Скрывает полосу прокрутки у документа в iframe. */
export function injectHideScrollbar(html: string): string {
  if (html.includes('data-prototyper-hide-scrollbar')) return html
  const lower = html.toLowerCase()
  const headIdx = lower.indexOf('<head>')
  if (headIdx !== -1) return html.slice(0, headIdx + 6) + PREVIEW_HIDE_SCROLLBAR_STYLE + html.slice(headIdx + 6)
  const htmlIdx = lower.indexOf('<html')
  const afterHtml = htmlIdx !== -1 ? html.indexOf('>', htmlIdx) + 1 : 0
  return html.slice(0, afterHtml) + PREVIEW_HIDE_SCROLLBAR_STYLE + html.slice(afterHtml)
}

/** Локальный srcDoc для мобильного превью: device-width + без скроллбара. */
export function prepareMobilePreviewSrcDoc(html: string): string {
  return injectEmbedCompat(injectHideScrollbar(injectMobilePreviewViewport(html)))
}

/** Десктопное превью в центре: фиксированная логическая ширина + совместимость с iframe. */
export function prepareDesktopPreviewSrcDoc(html: string, logicalWidth: number): string {
  return injectEmbedCompat(injectFixedViewport(html, logicalWidth))
}

/** Полноэкранный просмотр прототипа (srcDoc). */
export function buildFullscreenSrcDoc(html: string, view: ViewMode, logicalWidth: number): string {
  if (view === 'phone') return prepareMobilePreviewSrcDoc(html)
  return prepareDesktopPreviewSrcDoc(html, logicalWidth)
}
