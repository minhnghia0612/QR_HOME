import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/api',
})

// Request interceptor: attach JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('qr_home_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isPublicPath = error.config?.url?.includes('/qr-config') || 
                        error.config?.url?.includes('/public/') ||
                        error.config?.url?.includes('/traffic')

    // Only redirect/reload if NOT on landing page to avoid infinite loops or confusing reloads
    if (error.response?.status === 401 && !isPublicPath && window.location.pathname !== '/') {
      localStorage.removeItem('qr_home_token')
      window.location.href = '/'
    }
    return Promise.reject(error)
  },
)

export default apiClient
