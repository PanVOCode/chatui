/** Конвертация audio Blob (webm/ogg) в mono PCM Int16 @ 16 kHz для Yandex SpeechKit */

const SAMPLE_RATE = 16000
const CHUNK_SAMPLES = SAMPLE_RATE * 29  // 29 секунд

export async function blobToPcmChunks(blob: Blob): Promise<Int16Array[]> {
  const arrayBuffer = await blob.arrayBuffer()
  const audioCtx = new AudioContext({ sampleRate: SAMPLE_RATE })
  let decoded: AudioBuffer
  try {
    decoded = await audioCtx.decodeAudioData(arrayBuffer)
  } finally {
    audioCtx.close()
  }

  const float32 = decoded.numberOfChannels > 1
    ? mixToMono(decoded)
    : decoded.getChannelData(0)

  const int16 = float32ToInt16(float32)

  // Режем на чанки по 29 сек
  const chunks: Int16Array[] = []
  for (let offset = 0; offset < int16.length; offset += CHUNK_SAMPLES) {
    chunks.push(int16.slice(offset, offset + CHUNK_SAMPLES))
  }
  return chunks.length > 0 ? chunks : [int16]
}

function mixToMono(buf: AudioBuffer): Float32Array {
  const len = buf.length
  const out = new Float32Array(len)
  for (let ch = 0; ch < buf.numberOfChannels; ch++) {
    const data = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) out[i] += data[i]!
  }
  const invN = 1 / buf.numberOfChannels
  for (let i = 0; i < len; i++) out[i] *= invN
  return out
}

function float32ToInt16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length)
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]!))
    int16[i] = s < 0 ? s * 32768 : s * 32767
  }
  return int16
}

export function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/ogg;codecs=opus',
    'audio/webm',
  ]
  return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? ''
}
