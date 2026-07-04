import { useState, useCallback, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Breadcrumb, LoadingSpinner } from '../components/common/index.jsx'
import { formatPrice, formatDate, toast, resolveImageUrl } from '../utils/index.js'
import { ordersApi, contactApi, productsApi } from '../api/index.js'
import useAuthStore from '../store/authStore.js'

// ── Hằng số ───────────────────────────────────────────────────────────────────
const ORDER_STATUS = {
  pending:   { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400', step: 0 },
  confirmed: { label: 'Đã xác nhận',  color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500',   step: 1 },
  shipping:  { label: 'Đang giao',    color: 'bg-indigo-100 text-indigo-700',  dot: 'bg-indigo-500', step: 2 },
  completed: { label: 'Hoàn tất',     color: 'bg-green-100 text-green-700',    dot: 'bg-green-500',  step: 3 },
  cancelled: { label: 'Đã huỷ',       color: 'bg-red-100 text-red-700',        dot: 'bg-red-500',    step: -1 },
}

const TIMELINE_STEPS = [
  { key: 'pending',   icon: '📋', label: 'Đặt hàng' },
  { key: 'confirmed', icon: '✅', label: 'Đã xác nhận' },
  { key: 'shipping',  icon: '🚚', label: 'Đang giao' },
  { key: 'completed', icon: '🎉', label: 'Hoàn tất' },
]

const PAYMENT_LABEL = {
  cod:          'Thanh toán khi nhận hàng (COD)',
  vnpay:        'VNPay',
  momo:         'Ví MoMo',
  bank_transfer: 'Chuyển khoản ngân hàng',
}

// ── Hook: useOrder ─────────────────────────────────────────────────────────────
function useOrder(id) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const reload = useCallback(() => {
    if (!id || isNaN(Number(id))) return
    let cancelled = false
    setLoading(true)
    setError(null)
    ordersApi.getById(id)
      .then(res => {
        if (cancelled) return
        setData(res.data || res)
        setLoading(false)
      })
      .catch(err => {
        if (cancelled) return
        const msg = err?.message || err?.raw?.message || 'Không tìm thấy đơn hàng'
        setError(msg)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    const cancel = reload()
    return () => { if (cancel) cancel() }
  }, [reload])

  return { data, loading, error, reload }
}

// ── Component: OrderTimeline ──────────────────────────────────────────────────
function OrderTimeline({ status }) {
  const info = ORDER_STATUS[status]

  if (status === 'cancelled') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl px-6 py-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-xl flex-shrink-0">❌</div>
        <div>
          <div className="font-bold text-red-700">Đơn hàng đã bị huỷ</div>
          <div className="text-sm text-red-500 mt-0.5">Đơn hàng này đã được huỷ và không thể tiếp tục xử lý.</div>
        </div>
      </div>
    )
  }

  const currentStep = info?.step ?? 0

  return (
    <div className="bg-white border border-shade rounded-xl px-6 py-6">
      <div className="text-xs font-bold text-muted uppercase tracking-wider mb-5">Trạng thái đơn hàng</div>
      <div className="relative flex items-start gap-0">
        {TIMELINE_STEPS.map((step, idx) => {
          const done    = idx < currentStep
          const active  = idx === currentStep
          const isLast  = idx === TIMELINE_STEPS.length - 1
          return (
            <div key={step.key} className="flex-1 relative flex flex-col items-center">
              {/* Connector line (before this circle) */}
              {idx > 0 && (
                <div
                  className={`absolute top-5 right-1/2 w-full h-0.5 -translate-y-1/2 ${
                    done || active ? 'bg-vnpt' : 'bg-shade'
                  }`}
                  style={{ left: '-50%', right: '50%', width: '100%' }}
                />
              )}
              {/* Circle */}
              <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all ${
                active  ? 'border-vnpt bg-vnpt text-white shadow-md scale-110' :
                done    ? 'border-vnpt bg-vnpt text-white' :
                          'border-shade bg-surface text-muted'
              }`}>
                {step.icon}
              </div>
              {/* Label */}
              <div className={`mt-2.5 text-xs font-semibold text-center leading-tight ${
                active ? 'text-vnpt' : done ? 'text-vnpt' : 'text-muted'
              }`}>
                {step.label}
              </div>
              {active && (
                <div className="mt-1 text-[10px] text-vnpt font-bold animate-pulse">● Hiện tại</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Component: OrderItems ─────────────────────────────────────────────────────
function OrderItems({ items = [], orderStatus }) {
  if (!items.length) return null
  const isCompleted = orderStatus === 'completed'
  const navigate = useNavigate()
  const [checking, setChecking] = useState(null) // product_id đang check

  const handleProductClick = async (productId) => {
    setChecking(productId)
    try {
      await productsApi.getById(productId)
      navigate(`/products/${productId}`)
    } catch {
      toast.error('Sản phẩm hiện không còn kinh doanh')
    } finally {
      setChecking(null)
    }
  }

  return (
    <div className="bg-white border border-shade rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-shade flex items-center justify-between">
        <span className="text-xs font-bold text-muted uppercase tracking-wider">
          Sản phẩm đã đặt
        </span>
        <span className="text-xs text-muted">{items.length} sản phẩm</span>
      </div>
      <div className="divide-y divide-shade">
        {items.map((item, i) => {
          const img = resolveImageUrl(item.image_url || item.thumbnail || null)
          const unitPrice = item.unit_price ?? item.price ?? 0
          const qty       = item.quantity ?? 1
          const subtotal  = unitPrice * qty
          const isChecking = checking === item.product_id
          return (
            <div key={item.id ?? i} className="flex items-center gap-4 px-6 py-4 hover:bg-cream transition-colors">
              {/* Ảnh — clickable */}
              <button
                onClick={() => handleProductClick(item.product_id)}
                disabled={isChecking}
                className="w-16 h-16 rounded-lg bg-surface border border-shade flex items-center justify-center overflow-hidden flex-shrink-0 hover:border-vnpt transition-colors disabled:opacity-60 cursor-pointer"
              >
                {isChecking
                  ? <div className="w-5 h-5 border-2 border-vnpt/30 border-t-vnpt rounded-full animate-spin" />
                  : img
                    ? <img src={img} alt={item.product_name} className="w-full h-full object-contain p-1" onError={e => { e.target.src = 'https://placehold.co/64x64?text=📦' }} />
                    : <span className="text-2xl">📦</span>
                }
              </button>

              {/* Info — tên cũng clickable */}
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => handleProductClick(item.product_id)}
                  disabled={isChecking}
                  className="font-semibold text-body text-sm leading-snug line-clamp-2 text-left hover:text-vnpt transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {item.product_name || item.name || 'Sản phẩm'}
                </button>
                {item.variant_name && (
                  <div className="text-xs text-muted mt-0.5">{item.variant_name}</div>
                )}
                <div className="text-xs text-muted mt-1">
                  {formatPrice(unitPrice)} × {qty}
                </div>
              </div>

              {/* Right: subtotal + review btn */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <div className="font-bold text-accent text-base">
                  {formatPrice(subtotal)}
                </div>
                {isCompleted && item.product_id && (
                  <Link
                    to={`/products/${item.product_id}#reviews`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-warning text-warning text-[11px] font-bold hover:bg-warning hover:text-white transition-all duration-200 group"
                  >
                    <svg className="w-3.5 h-3.5 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                    Đánh giá
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Component: OrderSummary ───────────────────────────────────────────────────
function OrderSummary({ order }) {
  const subtotal      = order.subtotal ?? order.total_amount ?? 0
  const discount      = order.discount_amount ?? 0
  const shippingFee   = order.shipping_fee ?? 0
  const total         = order.total_amount ?? 0

  const rows = [
    { label: 'Tạm tính',       value: formatPrice(subtotal + discount - shippingFee) },
    discount   && { label: 'Giảm giá khuyến mãi', value: `-${formatPrice(discount)}`, accent: true },
    { label: 'Phí vận chuyển', value: shippingFee > 0 ? formatPrice(shippingFee) : 'Miễn phí', free: shippingFee === 0 },
  ].filter(Boolean)

  return (
    <div className="bg-white border border-shade rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-shade">
        <span className="text-xs font-bold text-muted uppercase tracking-wider">Tổng thanh toán</span>
      </div>
      <div className="px-6 py-4 space-y-3">
        {rows.map(row => (
          <div key={row.label} className="flex justify-between items-center text-sm">
            <span className="text-muted">{row.label}</span>
            <span className={row.accent ? 'text-green-600 font-semibold' : row.free ? 'text-green-600 font-semibold' : 'text-body'}>
              {row.value}
            </span>
          </div>
        ))}
        <div className="pt-3 border-t border-shade flex justify-between items-center">
          <span className="font-bold text-body">Thành tiền</span>
          <span className="text-xl font-bold text-accent font-display">{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  )
}

// ── Component: InfoBlock ──────────────────────────────────────────────────────
function InfoBlock({ title, children }) {
  return (
    <div className="bg-white border border-shade rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-shade">
        <span className="text-xs font-bold text-muted uppercase tracking-wider">{title}</span>
      </div>
      <div className="px-6 py-4">{children}</div>
    </div>
  )
}

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-shade last:border-none text-sm">
      <span className="text-muted flex-shrink-0">{label}</span>
      <span className="font-semibold text-body text-right">{value}</span>
    </div>
  )
}

// ── Component: ContactOrderModal ──────────────────────────────────────────────
const CONTACT_TYPES = [
  'Kiểm tra trạng thái đơn hàng',
  'Đổi trả / Hoàn tiền',
  'Sản phẩm bị lỗi / Thiếu hàng',
  'Thay đổi địa chỉ giao hàng',
  'Huỷ đơn hàng',
  'Khác',
]

function ContactOrderModal({ order, user, onClose }) {
  const [type, setType]         = useState(CONTACT_TYPES[0])
  const [message, setMessage]   = useState('')
  const [sending, setSending]   = useState(false)
  const overlayRef              = useRef(null)

  // Đóng modal khi click ra ngoài
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  // Đóng bằng Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Khoá scroll body khi modal mở
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const statusInfo = ORDER_STATUS[order.status]
  const items = order.items || order.order_items || []

  // Build nội dung tự động đính kèm thông tin đơn hàng
  const buildMessage = () => {
    const header = [
      `📦 Mã đơn hàng: #${order.id}${order.order_code ? ` (${order.order_code})` : ''}`,
      `📌 Trạng thái: ${statusInfo?.label || order.status}`,
      `💰 Tổng tiền: ${formatPrice(order.total_amount ?? 0)}`,
      `📅 Ngày đặt: ${formatDate(order.created_at)}`,
      items.length ? `🛒 Sản phẩm: ${items.map(i => `${i.product_name || i.name} x${i.quantity}`).join(', ')}` : '',
    ].filter(Boolean).join('\n')

    return `[${type}]\n\n${message.trim()}\n\n───────────────\n${header}`
  }

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Vui lòng nhập nội dung tin nhắn')
      return
    }
    setSending(true)
    try {
      await contactApi.send({
        name:     user?.full_name || user?.name || user?.email || 'Khách hàng',
        email:    user?.email || '',
        message:  buildMessage(),
        order_id: order.id,
      })
      toast.success('Đã gửi tin nhắn! Chúng tôi sẽ phản hồi sớm nhất có thể.')
      onClose()
    } catch (err) {
      toast.error(err?.message || 'Gửi thất bại, vui lòng thử lại')
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      style={{ background: 'rgba(10,10,10,0.55)', backdropFilter: 'blur(4px)' }}
    >
      <div className="w-full sm:max-w-[540px] bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-[fadeSlideUp_0.22s_ease]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-shade">
          <div>
            <h2 className="font-display text-lg font-bold text-body">💬 Trao đổi về đơn hàng</h2>
            <p className="text-xs text-muted mt-0.5">
              Đơn #{order.id}{order.order_code ? ` · ${order.order_code}` : ''} ·{' '}
              <span className={`font-semibold ${statusInfo?.color?.includes('yellow') ? 'text-yellow-600' : statusInfo?.color?.includes('green') ? 'text-green-600' : 'text-vnpt'}`}>
                {statusInfo?.label || order.status}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-surface flex items-center justify-center text-muted hover:text-body transition-colors text-lg"
          >✕</button>
        </div>

        {/* Thông tin đơn hàng đính kèm — preview */}
        <div className="mx-6 mt-5 p-4 bg-vnpt-light border border-vnpt/15 rounded-xl">
          <div className="text-[11px] font-bold text-vnpt uppercase tracking-wider mb-2.5">
            📎 Thông tin đính kèm tự động
          </div>
          <div className="space-y-1 text-xs text-vnpt/80">
            <div className="flex gap-2">
              <span className="text-muted w-20 flex-shrink-0">Mã đơn</span>
              <span className="font-semibold text-body">#{order.id}{order.order_code ? ` (${order.order_code})` : ''}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted w-20 flex-shrink-0">Trạng thái</span>
              <span className="font-semibold text-body">{statusInfo?.label || order.status}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted w-20 flex-shrink-0">Tổng tiền</span>
              <span className="font-semibold text-accent">{formatPrice(order.total_amount ?? 0)}</span>
            </div>
            {items.length > 0 && (
              <div className="flex gap-2">
                <span className="text-muted w-20 flex-shrink-0">Sản phẩm</span>
                <span className="font-semibold text-body line-clamp-2">
                  {items.map(i => `${i.product_name || i.name} ×${i.quantity}`).join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="px-6 pt-4 pb-6 space-y-4">

          {/* Loại yêu cầu */}
          <div>
            <label className="text-sm font-semibold block mb-1.5">Loại yêu cầu</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full px-4 py-2.5 border border-shade rounded-lg text-sm font-body outline-none focus:border-vnpt bg-white transition-colors"
            >
              {CONTACT_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Nội dung */}
          <div>
            <label className="text-sm font-semibold block mb-1.5">
              Nội dung <span className="text-accent">*</span>
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              placeholder="Mô tả chi tiết vấn đề của bạn về đơn hàng này..."
              className="w-full px-4 py-3 border border-shade rounded-lg text-sm font-body outline-none focus:border-vnpt resize-none transition-colors"
            />
            <p className="text-[11px] text-muted mt-1">
              Tin nhắn sẽ được gửi kèm toàn bộ thông tin đơn hàng ở trên.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3 border-2 border-shade text-muted rounded-full text-sm font-bold hover:border-body hover:text-body transition-all"
            >
              Huỷ
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !message.trim()}
              className="flex-[2] py-3 bg-vnpt text-white rounded-full text-sm font-bold hover:bg-vnpt-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {sending ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Đang gửi...</>
              ) : (
                <>📤 Gửi tin nhắn</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main: OrderDetailPage ─────────────────────────────────────────────────────
export default function OrderDetailPage() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const { data: order, loading, error, reload } = useOrder(id)
  const [cancelling, setCancelling]   = useState(false)
  const [showContact, setShowContact] = useState(false)
  const [rebuying, setRebuying]       = useState(false)
  const user = useAuthStore(s => s.user)

  const handleCancel = async () => {
    if (!window.confirm('Bạn có chắc muốn huỷ đơn hàng này không?')) return
    setCancelling(true)
    try {
      await ordersApi.cancel(id)
      toast.success('Đã huỷ đơn hàng thành công')
      reload()
    } catch (err) {
      toast.error(err?.message || 'Không thể huỷ đơn hàng')
    } finally {
      setCancelling(false)
    }
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner text="Đang tải đơn hàng..." />
      </div>
    )
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error || !order) {
    return (
      <div className="max-w-[600px] mx-auto px-10 py-20 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="font-display text-2xl font-bold text-body mb-3">Không tìm thấy đơn hàng</h2>
        <p className="text-muted mb-8">{error || 'Đơn hàng không tồn tại hoặc bạn không có quyền xem.'}</p>
        <Link
          to="/account/orders"
          className="inline-flex items-center gap-2 px-7 py-3 bg-vnpt text-white rounded-full font-bold text-sm hover:bg-vnpt-dark transition-colors"
        >
          ← Quay lại danh sách đơn hàng
        </Link>
      </div>
    )
  }

  const statusInfo = ORDER_STATUS[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400', step: 0 }
  const canCancel  = ['pending', 'confirmed'].includes(order.status)
  const items      = order.items || order.order_items || []

  const handleRebuy = async () => {
    const firstItem = items[0]
    if (!firstItem?.product_id) return
    setRebuying(true)
    try {
      await productsApi.getById(firstItem.product_id)
      navigate(`/products/${firstItem.product_id}`)
    } catch {
      toast.error('Sản phẩm hiện không còn kinh doanh')
    } finally {
      setRebuying(false)
    }
  }

  // Địa chỉ giao hàng
  const addr = order.shipping_address || order.address || null
  const addrText = addr
    ? [addr.address_line, addr.ward, addr.district, addr.province].filter(Boolean).join(', ')
    : order.shipping_address_text || null

  return (
    <div>
      <Breadcrumb items={[
        { to: '/',               label: 'Trang chủ' },
        { to: '/account/orders', label: 'Đơn hàng' },
        { label: `Đơn #${order.id}` },
      ]} />

      <div className="max-w-[1200px] mx-auto px-10 py-8">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <button
                onClick={() => navigate('/account/orders')}
                className="text-muted hover:text-vnpt transition-colors text-sm font-semibold flex items-center gap-1"
              >
                ← Đơn hàng
              </button>
              <span className="text-shade">|</span>
              <h1 className="font-display text-2xl font-bold text-body">
                Đơn #{order.id}
              </h1>
              {order.order_code && (
                <span className="text-sm text-muted font-mono">({order.order_code})</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${statusInfo.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                {statusInfo.label}
              </span>
              <span className="text-sm text-muted">
                Đặt lúc {formatDate(order.created_at)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="px-5 py-2.5 border-2 border-accent text-accent rounded-full text-sm font-bold hover:bg-accent hover:text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {cancelling ? 'Đang huỷ...' : 'Huỷ đơn'}
              </button>
            )}
            {order.status === 'completed' && items.length > 0 && (
              <button
                onClick={handleRebuy}
                disabled={rebuying}
                className="px-5 py-2.5 bg-vnpt text-white rounded-full text-sm font-bold hover:bg-vnpt-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {rebuying && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Mua lại
              </button>
            )}
          </div>
        </div>

        {/* ── Progress timeline ─────────────────────────────────────────────── */}
        <div className="mb-6">
          <OrderTimeline status={order.status} />
        </div>

        {/* ── Main grid ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-[1fr_340px] gap-6 items-start">

          {/* LEFT: items + summary */}
          <div className="space-y-5">
            <OrderItems items={items} orderStatus={order.status} />
            <OrderSummary order={order} />
          </div>

          {/* RIGHT: info cards */}
          <div className="space-y-4 sticky top-24">

            {/* Thông tin giao hàng */}
            <InfoBlock title="Thông tin giao hàng">
              <InfoRow label="Người nhận"  value={order.receiver_name || addr?.receiver_name} />
              <InfoRow label="Số điện thoại" value={order.receiver_phone || addr?.phone} />
              {addrText && (
                <div className="py-2 text-sm">
                  <div className="text-muted mb-1">Địa chỉ</div>
                  <div className="font-semibold text-body leading-snug">{addrText}</div>
                </div>
              )}
            </InfoBlock>

            {/* Thông tin thanh toán */}
            <InfoBlock title="Thanh toán">
              <InfoRow
                label="Phương thức"
                value={PAYMENT_LABEL[order.payment_method] || order.payment_method?.toUpperCase()}
              />
              <InfoRow
                label="Trạng thái"
                value={order.payment_status === 'paid' ? '✅ Đã thanh toán' : '⏳ Chưa thanh toán'}
              />
            </InfoBlock>

            {/* Ghi chú */}
            {order.note && (
              <InfoBlock title="Ghi chú đơn hàng">
                <p className="text-sm text-body leading-relaxed">{order.note}</p>
              </InfoBlock>
            )}

            {/* Hỗ trợ — nút trao đổi đơn hàng */}
            <div className="bg-vnpt-light border border-vnpt/20 rounded-xl px-6 py-5">
              <div className="text-xs font-bold text-vnpt uppercase tracking-wider mb-2">Cần hỗ trợ?</div>
              <p className="text-sm text-vnpt/80 mb-4 leading-relaxed">
                Có vấn đề với đơn hàng này? Gửi tin nhắn cho chúng tôi — thông tin đơn hàng sẽ được đính kèm tự động.
              </p>
              <button
                onClick={() => setShowContact(true)}
                className="w-full py-2.5 bg-vnpt text-white rounded-full text-sm font-bold hover:bg-vnpt-dark transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                💬 Trao đổi về đơn hàng này
              </button>
              <div className="mt-3 text-center">
                <Link
                  to="/contact"
                  className="text-xs text-vnpt/70 hover:text-vnpt transition-colors"
                >
                  Hoặc liên hệ chung →
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Modal trao đổi đơn hàng */}
      {showContact && order && (
        <ContactOrderModal
          order={order}
          user={user}
          onClose={() => setShowContact(false)}
        />
      )}
    </div>
  )
}