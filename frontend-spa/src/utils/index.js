// ── FORMAT TIỀN VND ─────────────────────────────────────────────────────────
export const formatPrice = (amount) => {
  if (amount == null) return '—'
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫'
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

// ── TOAST ─────────────────────────────────────────────────────────────────────
export const toast = {
  success: (msg) => window.dispatchEvent(new CustomEvent('vnpt:toast', { detail: { msg, type: 'success' } })),
  error:   (msg) => window.dispatchEvent(new CustomEvent('vnpt:toast', { detail: { msg, type: 'error' } })),
  info:    (msg) => window.dispatchEvent(new CustomEvent('vnpt:toast', { detail: { msg, type: 'info' } })),
}
