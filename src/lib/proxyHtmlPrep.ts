/** Убирает meta CSP из проксированного HTML — иначе страница сама себе режет скрипты во вложенном документе. */
export function stripHtmlMetaCsp(html: string): string {
  return html.replace(
    /<meta\b[^>]*\bhttp-equiv\s*=\s*["']content-security-policy["'][^>]*>/gi,
    '',
  )
}
