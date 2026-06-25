import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useUserAddresses } from '../hooks/index.js'
import { formatPrice, toast } from '../utils/index.js'
import { cartApi } from '../api/index.js'
import useCartStore from '../store/cartStore.js'
import useAuthStore from '../store/authStore.js'

const PAYMENT_METHODS = [
  { value: 'momo',  icon: '💜', name: 'MoMo',                  sub: 'Ví điện tử · Thanh toán nhanh' },
  { value: 'vnpay', icon: '🏦', name: 'VNPAY',                 sub: 'ATM / QR Code' },
  { value: 'card',  icon: '💳', name: 'Thẻ Visa / Mastercard', sub: 'Trả góp 0% đến 24 tháng' },
  { value: 'cod',   icon: '💵', name: 'Tiền mặt (COD)',         sub: 'Kiểm tra hàng trước khi thanh toán' },
]

// Map frontend value → backend enum (cod | card | wallet)
const toBackendPayment = (value) => {
  if (value === 'momo' || value === 'vnpay') return 'wallet'
  return value
}

const STEPS = ['Giỏ hàng', 'Địa chỉ', 'Thanh toán', 'Xác nhận']

export default function CheckoutPage() {
  const { items: allItems, removeSelectedItems, selectItemsForCheckout } = useCartStore()

  // Lọc chỉ những item user đã chọn từ CartPage
  const selectedIds = (() => {
    try { return new Set(JSON.parse(sessionStorage.getItem('checkout_items') || '[]')) }
    catch { return new Set() }
  })()
  const items = selectedIds.size > 0 ? allItems.filter(i => selectedIds.has(i.id)) : allItems
  const selectedTotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const { user } = useAuthStore()
  const { data: addresses } = useUserAddresses()
  const navigate = useNavigate()

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      name:           user?.name || '',
      phone:          '',
      email:          user?.email || '',
      city:           '',
      district:       '',
      address:        '',
      note:           '',
      payment_method: 'cod',
      address_id:     '',
    }
  })

  const [submitting, setSubmitting] = useState(false)
  const [useExistingAddress, setUseExistingAddress] = useState(addresses.length > 0)

  const selectedAddressId = watch('address_id')

  const onInvalid = (formErrors) => {
    // Form không hợp lệ (thiếu họ tên / SĐT / địa chỉ...) -> báo rõ cho người dùng
    // và cuộn lên field lỗi đầu tiên, tránh tình trạng bấm nút mà "không thấy gì"
    toast.error('Vui lòng kiểm tra lại thông tin đã nhập')
    const firstErrorKey = Object.keys(formErrors)[0]
    const el = document.querySelector(`[name="${firstErrorKey}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const onSubmit = async (data) => {
    if (items.length === 0) { toast.error('Giỏ hàng trống'); return }
    setSubmitting(true)
    try {
      const payload = {
        payment_method: toBackendPayment(data.payment_method),
        note: data.note || undefined,
      }

      // Gắn địa chỉ
      if (useExistingAddress && selectedAddressId) {
        payload.address_id = Number(selectedAddressId)
      }

      await selectItemsForCheckout(items.map(i => i.id))
      await cartApi.checkout(payload)
      sessionStorage.removeItem('checkout_items')
      await removeSelectedItems(items.map(i => i.id))
      toast.success('Đặt hàng thành công! 🎉')
      navigate('/checkout/success')
    } catch (err) {
      toast.error(err.message || 'Đặt hàng thất bại, vui lòng thử lại')
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-[680px] mx-auto px-10 py-16 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="font-display text-2xl font-bold text-body mb-3">Giỏ hàng trống</h2>
        <Link to="/products" className="inline-block px-6 py-3 bg-vnpt text-white rounded-full font-bold text-sm mt-4">
          Mua sắm ngay
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Steps */}
      <div className="max-w-[1100px] mx-auto px-10 mt-6 flex items-center">
        {STEPS.map((label, i, arr) => (
          <span key={label} className="flex items-center flex-1">
            <span className="flex items-center gap-2">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                i === 0 ? 'bg-success text-white'
                : i === 1 ? 'bg-vnpt text-white'
                : 'bg-shade text-muted'
              }`}>
                {i === 0 ? '✓' : i + 1}
              </span>
              <span className={`text-sm font-semibold ${
                i === 1 ? 'text-vnpt' : i === 0 ? 'text-success' : 'text-muted'
              }`}>{label}</span>
            </span>
            {i < arr.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 ${i === 0 ? 'bg-success' : 'bg-shade'}`} />
            )}
          </span>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
        <div className="max-w-[1100px] mx-auto px-10 py-8 grid grid-cols-[1fr_380px] gap-8 items-start">

          {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Địa chỉ (gộp thông tin liên hệ + giao hàng) */}
            <div className="bg-white border border-shade rounded-xl p-7">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3 text-base font-bold text-body">
                  <span className="w-7 h-7 rounded-full bg-vnpt text-white flex items-center justify-center text-xs font-bold">1</span>
                  Địa chỉ
                </div>
                <a href="/account/addresses" className="text-xs text-vnpt font-semibold hover:underline">
                  Quản lý địa chỉ →
                </a>
              </div>

              {addresses.length > 0 ? (
                <div className="space-y-2">
                  {addresses.map(addr => (
                    <label key={addr.id} className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${selectedAddressId == addr.id ? 'border-vnpt bg-vnpt-light' : 'border-shade hover:border-vnpt-light'}`}>
                      <input type="radio" {...register('address_id')} value={addr.id} className="accent-vnpt mt-0.5" />
                      <div className="text-sm flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-body">{addr.receiver_name}</span>
                          <span className="text-muted">·</span>
                          <span className="text-muted">{addr.phone}</span>
                          {addr.is_default && (
                            <span className="ml-auto text-[11px] text-vnpt font-semibold bg-vnpt-light border border-vnpt/20 px-2 py-0.5 rounded-full">
                              Mặc định
                            </span>
                          )}
                        </div>
                        <div className="text-muted">{addr.address_line}, {addr.ward}, {addr.district}, {addr.province}</div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted">
                  <div className="text-3xl mb-2">📍</div>
                  <p className="text-sm mb-3">Bạn chưa có địa chỉ nào được lưu.</p>
                  <a href="/account/addresses" className="inline-block px-5 py-2 border border-vnpt text-vnpt rounded-full text-sm font-semibold hover:bg-vnpt hover:text-white transition-colors">
                    Thêm địa chỉ mới
                  </a>
                </div>
              )}

              {/* Ghi chú đơn hàng */}
              {(addresses.length > 0) && (
                <div className="mt-4 pt-4 border-t border-shade">
                  <label className="text-sm font-semibold block mb-1.5">Ghi chú</label>
                  <input
                    {...register('note')}
                    placeholder="Giao giờ hành chính, gọi trước 30 phút..."
                    className="w-full px-4 py-3 border border-shade rounded-lg text-sm font-body outline-none focus:border-vnpt"
                  />
                </div>
              )}
            </div>

            {/* Phương thức thanh toán */}
            <div className="bg-white border border-shade rounded-xl p-7">
              <div className="flex items-center gap-3 text-base font-bold text-body mb-5">
                <span className="w-7 h-7 rounded-full bg-vnpt text-white flex items-center justify-center text-xs font-bold">2</span>
                Phương thức thanh toán
              </div>
              <div className="space-y-3">
                {PAYMENT_METHODS.map(({ value, icon, name, sub }) => (
                  <label key={value} className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${watch('payment_method') === value ? 'border-vnpt bg-vnpt-light' : 'border-shade hover:border-vnpt-light'}`}>
                    <input type="radio" {...register('payment_method')} value={value} className="accent-vnpt w-4 h-4" />
                    <span className="text-2xl">{icon}</span>
                    <div>
                      <div className="text-sm font-semibold text-body">{name}</div>
                      <div className="text-xs text-muted">{sub}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* ── ORDER SUMMARY ────────────────────────────────────────────── */}
          <div className="bg-white border border-shade rounded-xl p-6 sticky top-24">
            <div className="text-base font-bold text-body mb-4 pb-4 border-b border-shade">
              Đơn hàng ({items.reduce((s, i) => s + i.qty, 0)} sản phẩm)
            </div>

            <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-cream rounded-lg border border-shade flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                    {item.img ? (
                      <img src={item.img} alt={item.name} className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="text-xl">📦</span>
                    )}
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-muted text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {item.qty}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-body line-clamp-2">{item.name}</div>
                  </div>
                  <div className="text-sm font-bold text-body flex-shrink-0">{formatPrice(item.price * item.qty)}</div>
                </div>
              ))}
            </div>

            <hr className="border-shade mb-4" />

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-muted">Tạm tính</span>
                <span>{formatPrice(selectedTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Vận chuyển</span>
                <span className="text-success">Miễn phí</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t-2 border-shade mb-5">
              <span className="text-base font-bold">Tổng cộng</span>
              <span className="text-xl font-bold text-accent font-display">{formatPrice(selectedTotal)}</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-accent text-white rounded-full font-bold text-base hover:bg-accent-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? '⏳ Đang xử lý...' : '✓ Đặt hàng ngay'}
            </button>
            <p className="text-center text-xs text-muted mt-3">🔒 Thanh toán SSL 256-bit an toàn</p>
          </div>
        </div>
      </form>
    </div>
  )
}