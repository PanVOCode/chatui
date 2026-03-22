import { useCallback } from 'react'
import { convertDocument, describeImage, isImageFile, uploadImage } from '../lib/publishApi'

export interface UploadedDoc {
  url: string
  fileName: string
  content: string  // текст документа или описание картинки
}

export function useFileUpload() {
  const uploadFile = useCallback(async (file: File): Promise<UploadedDoc> => {
    if (isImageFile(file.name)) {
      const { url } = await uploadImage(file)
      const content = await describeImage(url)
      return { url, fileName: file.name, content }
    } else {
      const { text, url, fileName } = await convertDocument(file)
      return { url, fileName, content: text }
    }
  }, [])

  return { uploadFile }
}
