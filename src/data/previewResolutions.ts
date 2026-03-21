/** Популярные разрешения (условно Feb 2026) — для пропорций превью */

export interface ScreenResolutionPreset {
  id: string
  width: number
  height: number
  /** Доля рынка для подписи в UI */
  share: string
}

export const DESKTOP_RESOLUTIONS: ScreenResolutionPreset[] = [
  { id: '1920x1080', width: 1920, height: 1080, share: '19.27%' },
  { id: '1920x1200', width: 1920, height: 1200, share: 'WUXGA' },
  { id: '1280x1200', width: 1280, height: 1200, share: '11.79%' },
  { id: '1536x864', width: 1536, height: 864, share: '8.23%' },
  { id: '1366x768', width: 1366, height: 768, share: '6.5%' },
  { id: '1280x720', width: 1280, height: 720, share: '3.63%' },
  { id: '800x600', width: 800, height: 600, share: '3.27%' },
]

export const MOBILE_RESOLUTIONS: ScreenResolutionPreset[] = [
  { id: '414x896', width: 414, height: 896, share: '11.82%' },
  { id: '360x800', width: 360, height: 800, share: '9.87%' },
  { id: '390x844', width: 390, height: 844, share: '6.87%' },
  { id: '393x873', width: 393, height: 873, share: '4.61%' },
  { id: '384x832', width: 384, height: 832, share: '4.57%' },
  { id: '360x780', width: 360, height: 780, share: '3.57%' },
]

export const DEFAULT_DESKTOP_RESOLUTION_ID = '1920x1080'
export const DEFAULT_MOBILE_RESOLUTION_ID = '414x896'

export function getResolutionById(
  id: string,
  list: ScreenResolutionPreset[],
): ScreenResolutionPreset | undefined {
  return list.find((p) => p.id === id)
}
