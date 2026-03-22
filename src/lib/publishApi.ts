const BASE = 'https://media.progressusbot.ru'
const API_KEY = import.meta.env.VITE_PUBLISH_API_KEY as string | undefined

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.tif'])

export function isImageFile(filename: string): boolean {
  const ext = '.' + filename.toLowerCase().split('.').pop()
  return IMAGE_EXTENSIONS.has(ext)
}

export interface ConvertResult {
  text: string
  url: string
  fileName: string
}

export interface ImageUploadResult {
  url: string
}

export async function convertDocument(file: File): Promise<ConvertResult> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/api/publish/convert`, {
    method: 'POST',
    headers: API_KEY ? { 'X-API-Key': API_KEY } : {},
    body: form,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error?.message ?? `Ошибка конвертации: ${res.status}`)
  }
  const data = await res.json()
  const url: string = data.data?.url ?? ''
  // Получаем текст из конвертированного документа
  const textRes = await fetch(url)
  const text = await textRes.text()
  return { text, url, fileName: file.name }
}

export interface PdfParseResult {
  text: string
  images: Array<{ url: string; fileName: string; content: string }>
}

export async function parsePdf(file: File): Promise<PdfParseResult> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/api/publish/pdf-parse`, {
    method: 'POST',
    headers: API_KEY ? { 'X-API-Key': API_KEY } : {},
    body: form,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error?.message ?? `Ошибка парсинга PDF: ${res.status}`)
  }
  const data = await res.json()
  return data.data as PdfParseResult
}

export async function describeImage(url: string): Promise<string> {
  const res = await fetch(`${BASE}/api/vision/describe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY ? { 'X-API-Key': API_KEY } : {}),
    },
    body: JSON.stringify({ url }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error?.message ?? `Ошибка описания: ${res.status}`)
  }
  const data = await res.json()
  return data.description ?? ''
}

export async function uploadImage(file: File): Promise<ImageUploadResult> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/api/publish/image`, {
    method: 'POST',
    headers: API_KEY ? { 'X-API-Key': API_KEY } : {},
    body: form,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error?.message ?? `Ошибка загрузки: ${res.status}`)
  }
  const data = await res.json()
  return { url: data.data?.url ?? '' }
}
