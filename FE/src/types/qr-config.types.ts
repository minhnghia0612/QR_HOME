export type QrStatus = 'active' | 'paused' | 'inactive'

export interface QrConfig {
  id: string
  status: QrStatus
  qrUrl: string | null
  generatedAt: string | null
  updatedAt: string | null
  spaName: string | null
  spaAddress: string | null
  spaPhone: string | null
  spaEmail: string | null
  spaLogo: string | null
  bannerUrl: string | null
  welcomeMessage: string | null
  backgroundColor: string | null
}
