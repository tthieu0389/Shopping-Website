import { useState, useCallback, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Breadcrumb, LoadingSpinner } from '../components/common/index.jsx'
import { formatPrice, formatDate, toast, resolveImageUrl } from '../utils/index.js'
import { ordersApi } from '../api/index.js'

// ── Hằng số ───────────────────────────────────────────────────────────────────
const ORDER_STATUS = {
  pending:    { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-700',  dot: 'bg-yellow-400',  step: 0 },
  confirmed:  { label: 'Đã xác nhận',  color: 'bg-blue-100 text-blue-700',      dot: 'bg-blue-500',    step: 1 },
  processing: { label: 'Đang xử lý',   color: 'bg-purple-100 text-purple-700',  dot: 'bg-purple-500',  step: 2 },
  shipped:    { label: 'Đang giao',     color: 'bg-indigo-100 text-indigo-700',  dot: 'bg-indigo-500',  step: 3 },
  completed:  { label: 'Đã giao',       color: 'bg-green-100 text-green-700',    dot: 'bg-green-500',   step: 4 },
  cancelled:  { label: 'Đã huỷ',        color: 'bg-red-100 text-red-700',        dot: 'bg-red-500',     step: -1 },
}

const TIMELINE_STEPS = [
  { key: 'pending',    icon: '📋', label: 'Đặt hàng' },
  { key: 'confirmed',  icon: '✅', label: 'Xác nhận' },
  { key: 'processing', icon: '📦', label: 'Đóng gói' },
  { key: 'shipped',    icon: '🚚', label: 'Đang giao' },
  { key: 'completed',  icon: '🎉', label: 'Đã nhận' },
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
                    done ? 'bg-vnpt' : 'bg-shade'
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
function OrderItems({ items = [] }) {
  if (!items.length) return null

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
          return (
            <div key={item.id ?? i} className="flex items-center gap-4 px-6 py-4 hover:bg-cream transition-colors">
              {/* Ảnh */}
              <div className="w-16 h-16 rounded-lg bg-surface border border-shade flex items-center justify-center overflow-hidden flex-shrink-0">
                {img
                  ? <img src={img} alt={item.name} className="w-full h-full object-contain p-1" onError={e => { e.target.src = 'https://placehold.co/64x64?text=📦' }} />
                  : <span className="text-2xl">📦</span>
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-body text-sm leading-snug line-clamp-2">
                  {item.product_name || item.name || 'Sản phẩm'}
                </div>
                {item.variant_name && (
                  <div className="text-xs text-muted mt-0.5">{item.variant_name}</div>
                )}
                <div className="text-xs text-muted mt-1">
                  {formatPrice(unitPrice)} × {qty}
                </div>
              </div>

              {/* Subtotal */}
              <div className="font-bold text-accent text-base flex-shrink-0">
                {formatPrice(subtotal)}
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

// ── Main: OrderDetailPage ─────────────────────────────────────────────────────
export default function OrderDetailPage() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const { data: order, loading, error, reload } = useOrder(id)
  const [cancelling, setCancelling] = useState(false)

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
            {order.status === 'completed' && (
              <Link
                to={`/products`}
                className="px-5 py-2.5 bg-vnpt text-white rounded-full text-sm font-bold hover:bg-vnpt-dark transition-colors"
              >
                Mua lại
              </Link>
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
            <OrderItems items={items} />
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

            {/* Hỗ trợ */}
            <div className="bg-vnpt-light border border-vnpt/20 rounded-xl px-6 py-5">
              <div className="text-xs font-bold text-vnpt uppercase tracking-wider mb-2">Cần hỗ trợ?</div>
              <p className="text-sm text-vnpt/80 mb-3 leading-relaxed">
                Liên hệ với chúng tôi nếu có vấn đề với đơn hàng này.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-vnpt hover:text-vnpt-dark transition-colors"
              >
                📞 Liên hệ hỗ trợ →
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}