// ── FORMAT TIỀN VND ─────────────────────────────────────────────────────────
export const formatPrice = (amount) => {
  if (amount == null) return '—'
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Math.round(amount)) + '₫'
}

// ── FORMAT NGÀY ──────────────────────────────────────────────────────────────
export const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}

// ── TÍNH % GIẢM GIÁ ──────────────────────────────────────────────────────────
export const calcDiscount = (price, oldPrice) => {
  if (!oldPrice || oldPrice <= price) return 0
  return Math.round((1 - price / oldPrice) * 100)
}

// ── TRUNCATE TEXT ────────────────────────────────────────────────────────────
export const truncate = (str, n = 60) =>
  str && str.length > n ? str.slice(0, n) + '...' : str

// ── SLUG → READABLE ──────────────────────────────────────────────────────────
export const slugToTitle = (slug) =>
  slug?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || ''

// ── BUILD QUERY STRING ───────────────────────────────────────────────────────
export const buildQuery = (params) => {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') q.set(k, v)
  })
  return q.toString()
}

// ── DEBOUNCE ─────────────────────────────────────────────────────────────────
export const debounce = (fn, delay = 400) => {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

// ── GET INITIALS ─────────────────────────────────────────────────────────────
export const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

// ── RESOLVE ẢNH (path tương đối từ backend → URL đầy đủ) ─────────────────────
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/api\/?$/, '')
export const resolveImageUrl = (url) => {
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`
}

// ── KIỂM TRA JWT HẾT HẠN ──────────────────────────────────────────────────────
// Giải mã phần payload của JWT (base64url) để đọc "exp" mà không cần verify chữ ký
// (verify chữ ký là việc của backend) — chỉ dùng để quyết định có nên coi phiên
// đăng nhập ở client là còn hiệu lực hay không.
export const isTokenExpired = (token) => {
  if (!token) return true
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    if (!decoded.exp) return false // không có exp thì coi như không hết hạn
    return decoded.exp * 1000 <= Date.now()
  } catch {
    return true // token không hợp lệ/không đọc được -> coi như đã hết hạn
  }
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
export const toast = {
  success: (msg) => window.dispatchEvent(new CustomEvent('vnpt:toast', { detail: { msg, type: 'success' } })),
  error:   (msg) => window.dispatchEvent(new CustomEvent('vnpt:toast', { detail: { msg, type: 'error' } })),
  info:    (msg) => window.dispatchEvent(new CustomEvent('vnpt:toast', { detail: { msg, type: 'info' } })),
}