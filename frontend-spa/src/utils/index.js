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

// ── TRANSLATE API ERROR → TIẾNG VIỆT ─────────────────────────────────────────
// Nhận err object từ axiosInstance interceptor ({ status, message, raw })
// hoặc Error thông thường, trả về chuỗi tiếng Việt thân thiện.
export const translateApiError = (err, fallback = 'Đã có lỗi xảy ra, vui lòng thử lại') => {
  const msg = (err?.message || err?.raw?.message || '').toLowerCase().trim()

  // 403 Forbidden
  if (err?.status === 403 || msg.startsWith('forbidden'))
    return 'Bạn không có quyền thực hiện hành động này'

  // Auth
  if (msg.includes('no token') || msg.includes('invalid or expired token'))
    return 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại'
  if (msg.includes('invalid credentials'))
    return 'Email hoặc mật khẩu không đúng'
  if (msg.includes('email already') || msg.includes('already in use'))
    return 'Email này đã được sử dụng'

  // Order
  if (msg.includes('only pending or confirmed orders can be cancelled'))
    return 'Chỉ có thể huỷ đơn hàng đang chờ xử lý hoặc đã xác nhận'
  if (msg.includes('cart cannot be empty'))
    return 'Giỏ hàng trống, vui lòng thêm sản phẩm trước khi đặt hàng'
  if (msg.includes('invalid status transition'))
    return 'Không thể chuyển sang trạng thái này'
  if (msg.includes('invalid payment status'))
    return 'Không thể cập nhật trạng thái thanh toán'
  if (msg.includes('order not found'))
    return 'Không tìm thấy đơn hàng'
  if (msg.includes('cannot set cancelled') || msg.includes('use cancelorder'))
    return 'Vui lòng dùng chức năng huỷ đơn hàng'

  // Product / Cart
  if (msg.includes('product') && msg.includes('not found'))
    return 'Không tìm thấy sản phẩm'
  if (msg.includes('invalid product id'))
    return 'Mã sản phẩm không hợp lệ'
  if (msg.includes('cart item not found'))
    return 'Không tìm thấy sản phẩm trong giỏ hàng'
  if (msg.includes('item id required'))
    return 'Thiếu thông tin sản phẩm'
  if (msg.includes('invalid item data'))
    return 'Thông tin sản phẩm không hợp lệ'

  // Địa chỉ / cửa hàng (tiếng Việt không dấu từ backend)
  if (msg.includes('dia chi giao hang') || msg.includes('address') && msg.includes('not found'))
    return 'Địa chỉ giao hàng không tồn tại'
  if (msg.includes('cua hang') || msg.includes('store') && msg.includes('not found'))
    return 'Cửa hàng đã chọn không tồn tại hoặc đã đóng cửa'
  if (msg.includes('vui long chon dia chi') || msg.includes('address_id') || msg.includes('pickup_store_id'))
    return 'Vui lòng chọn địa chỉ giao hàng hoặc cửa hàng nhận hàng'
  if (msg.includes('chi duoc chon mot'))
    return 'Chỉ được chọn một trong hai hình thức nhận hàng'

  // User
  if (msg.includes('user not found') || msg.includes('already deleted'))
    return 'Không tìm thấy tài khoản'
  if (msg.includes('user id is required'))
    return 'Thiếu thông tin người dùng'

  // Review
  if (msg.includes('review not found'))
    return 'Không tìm thấy đánh giá'

  // Category
  if (msg.includes('category not found'))
    return 'Không tìm thấy danh mục'

  // Inventory
  if (msg.includes('quantity cannot be negative'))
    return 'Số lượng không được âm'

  // Contact
  if (msg.includes('contact not found'))
    return 'Không tìm thấy liên hệ'

  // Upload
  if (msg.includes('only jpg') || msg.includes('only jpeg') || msg.includes('png') && msg.includes('allowed'))
    return 'Chỉ chấp nhận file ảnh JPG, PNG hoặc WEBP'
  if (msg.includes('no image') || msg.includes('no images'))
    return 'Vui lòng chọn ảnh để tải lên'
  if (msg.includes('upload error'))
    return 'Tải ảnh thất bại, vui lòng thử lại'

  // Validation
  if (msg.includes('validation error'))
    return 'Dữ liệu không hợp lệ, vui lòng kiểm tra lại'
  if (msg.includes('either address') || msg.includes('cannot use both address'))
    return 'Vui lòng chọn đúng một hình thức nhận hàng'

  // Generic not found
  if (msg.includes('not found'))
    return 'Không tìm thấy dữ liệu'

  // Trả về message gốc nếu đã là tiếng Việt (có dấu), ngược lại dùng fallback
  const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(err?.message || '')
  return hasVietnamese ? (err?.message || fallback) : fallback
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
export const toast = {
  success: (msg) => window.dispatchEvent(new CustomEvent('vnpt:toast', { detail: { msg, type: 'success' } })),
  error:   (msg) => window.dispatchEvent(new CustomEvent('vnpt:toast', { detail: { msg, type: 'error' } })),
  info:    (msg) => window.dispatchEvent(new CustomEvent('vnpt:toast', { detail: { msg, type: 'info' } })),
}

// ── SỰ KIỆN AVATAR THAY ĐỔI ───────────────────────────────────────────────────
// Bắn event toàn cục khi avatar được cập nhật, để Navbar (và bất kỳ nơi nào
// khác đang hiển thị avatar) tự refetch ngay mà không cần reload trang.
export const notifyAvatarUpdated = (avatarPath) =>
  window.dispatchEvent(new CustomEvent('vnpt:avatar-updated', { detail: { avatar: avatarPath } }))