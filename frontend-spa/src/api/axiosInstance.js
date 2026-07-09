import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  'ngrok-skip-browser-warning': 'true',
})

// ── Request interceptor: gắn JWT token ──────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vnpt_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: xử lý lỗi tập trung ──────────────────────────────
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.error || error.response?.data?.message || 'Đã có lỗi xảy ra'

    if (status === 401) {
      const url = error.config?.url || ''
      // Không redirect khi chính request login/register bị sai credentials —
      // để trang login tự hiển thị lỗi tại chỗ.
      const isAuthRequest = url.includes('/auth/login') || url.includes('/auth/register')
      if (!isAuthRequest) {
        localStorage.removeItem('vnpt_token')
        localStorage.removeItem('vnpt_auth')
        // Hết phiên đăng nhập -> về trang chủ với vai trò khách
        window.location.href = '/'
      }
    }

    if (status === 403) {
      import('../utils/index.js').then(({ toast }) => {
        toast.error('Bạn không có quyền thực hiện hành động này')
      })
    }

    return Promise.reject({ status, message, raw: error.response?.data })
  }
)

export default api