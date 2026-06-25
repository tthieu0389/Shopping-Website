import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
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
      localStorage.removeItem('vnpt_token')
      // Xóa đúng key Zustand persist (vnpt_auth) thay vì vnpt_user
      localStorage.removeItem('vnpt_auth')
      window.location.href = '/login'
    }

    if (status === 403) {
      console.warn('Không có quyền truy cập')
    }

    return Promise.reject({ status, message, raw: error.response?.data })
  }
)

export default api