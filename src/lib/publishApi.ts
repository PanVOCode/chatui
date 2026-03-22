const BASE = 'https://media.progressusbot.ru'
const API_KEY = import.meta.env.VITE_PUBLISH_API_KEY as string | undefined

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
