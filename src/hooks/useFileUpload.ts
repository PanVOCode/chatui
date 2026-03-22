import { useState, useCallback } from 'react'
import { convertDocument } from '../lib/publishApi'

export interface UploadedDoc {
  text: string
  url: string
  fileName: string
}

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = useCallback(async (file: File): Promise<UploadedDoc> => {
    setIsUploading(true)
    setError(null)
    try {
      const result = await convertDocument(file)
      return result
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ошибка загрузки файла'
      setError(msg)
      throw new Error(msg)
    } finally {
      setIsUploading(false)
    }
  }, [])

  return { uploadFile, isUploading, error, clearError: () => setError(null) }
}
