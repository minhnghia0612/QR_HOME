export type QrStatus = 'active' | 'paused' | 'inactive'
export type CurrencyUnit = 'VND' | 'USD' | 'EUR'
export type CustomerUiSize = 'large' | 'normal' | 'compact'

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
  themeId?: string
  currencyUnit: CurrencyUnit
  primaryColor: string | null
  secondaryColor: string | null
  fontFamily: string | null
  customerUiSize: CustomerUiSize
}
