import { blobToPcmChunks } from './audioUtils'

const PROXY_URL = 'https://media.progressusbot.ru/api/stt/recognize?lang=ru-RU&format=lpcm&sampleRateHertz=16000'

export async function recognizeSpeech(audioBlob: Blob): Promise<string> {
  const chunks = await blobToPcmChunks(audioBlob)

  const results: string[] = []
  for (const chunk of chunks) {
    const text = await recognizeChunk(chunk)
    if (text) results.push(text)
  }

  return results.join(' ')
}

async function recognizeChunk(pcm: Int16Array): Promise<string> {
  const body = pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + pcm.byteLength)

  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const msg = (data as { error?: { message?: string } }).error?.message
    throw new Error(msg ?? `STT ошибка ${res.status}`)
  }

  const data = await res.json() as { result?: string }
  return data.result ?? ''
}
