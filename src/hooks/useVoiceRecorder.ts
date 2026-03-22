import { useRef, useState, useCallback, useEffect } from 'react'
import { getSupportedMimeType } from '../lib/audioUtils'

export type VoiceState = 'idle' | 'recording' | 'transcribing'

/** Возвращает секунды записи (для отображения). */
export function useVoiceRecorder(onAudioReady: (blob: Blob) => Promise<void>) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [elapsed, setElapsed]       = useState(0)   // секунды
  const [error, setError]           = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef        = useRef<MediaStream | null>(null)
  const chunksRef        = useRef<Blob[]>([])
  const rafRef           = useRef<number | null>(null)
  const startTimeRef     = useRef<number>(0)

  useEffect(() => () => stopInternal(), [])

  function stopInternal() {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    mediaRecorderRef.current = null
    streamRef.current = null
  }

  function tick() {
    const secs = (performance.now() - startTimeRef.current) / 1000
    setElapsed(Math.floor(secs))
    rafRef.current = requestAnimationFrame(tick)
  }

  const startRecording = useCallback(async () => {
    if (voiceState !== 'idle') return
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []

      const mimeType = getSupportedMimeType()
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = mr

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.start(100)

      setVoiceState('recording')
      setElapsed(0)
      startTimeRef.current = performance.now()
      rafRef.current = requestAnimationFrame(tick)
    } catch {
      setError('Нет доступа к микрофону. Разрешите использование в настройках браузера.')
      setVoiceState('idle')
    }
  }, [voiceState])

  const stopRecording = useCallback(() => {
    const mr = mediaRecorderRef.current
    if (!mr || voiceState !== 'recording') return

    if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null }

    mr.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: mr.mimeType })
      streamRef.current?.getTracks().forEach((t) => t.stop())
      mediaRecorderRef.current = null
      streamRef.current = null
      chunksRef.current = []
      setVoiceState('transcribing')
      setElapsed(0)
      try {
        await onAudioReady(blob)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ошибка распознавания речи')
      } finally {
        setVoiceState('idle')
      }
    }
    mr.stop()
  }, [voiceState, onAudioReady])

  const cancelRecording = useCallback(() => {
    if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
    streamRef.current = null
    chunksRef.current = []
    setVoiceState('idle')
    setElapsed(0)
  }, [])

  return { voiceState, elapsed, error, startRecording, stopRecording, cancelRecording }
}
