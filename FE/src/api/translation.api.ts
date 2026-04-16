import apiClient from './client'

export const translationApi = {
  autoTranslate: (payload: any, targetLang: string) =>
    apiClient.post('/translation/auto', { payload, targetLang }),
}
