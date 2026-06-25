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

const STEPS = ['Giỏ hàng', 'Thông tin', 'Thanh toán', 'Xác nhận']

export default function CheckoutPage() {
  const { items, total, clearCart } = useCartStore()
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
        payment_method: data.payment_method,
        note: data.note || undefined,
      }

      // Gắn địa chỉ
      if (useExistingAddress && selectedAddressId) {
        payload.address_id = Number(selectedAddressId)
      }

      await cartApi.checkout(payload)
      await clearCart()
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
      {/* Checkout Navbar */}
      <nav className="bg-white border-b border-shade px-10 h-16 flex items-center justify-between sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-xl text-vnpt">
          <div className="w-9 h-9 bg-vnpt rounded-lg flex items-center justify-center">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/VNPT_Logo.svg/512px-VNPT_Logo.svg.png" alt="" className="w-6 brightness-0 invert" />
          </div>
          VNPT Shop
        </Link>
        <div className="text-sm text-muted">🔒 Thanh toán an toàn</div>
      </nav>

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

            {/* Thông tin liên hệ */}
            <div className="bg-white border border-shade rounded-xl p-7">
              <div className="flex items-center gap-3 text-base font-bold text-body mb-5">
                <span className="w-7 h-7 rounded-full bg-vnpt text-white flex items-center justify-center text-xs font-bold">1</span>
                Thông tin liên hệ
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold block mb-1.5">Họ và tên *</label>
                  <input
                    {...register('name', { required: 'Vui lòng nhập họ tên' })}
                    placeholder="Nguyễn Văn A"
                    className={`w-full px-4 py-3 border rounded-lg text-sm font-body outline-none focus:border-vnpt transition-colors ${errors.name ? 'border-accent' : 'border-shade'}`}
                  />
                  {errors.name && <p className="text-xs text-accent mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1.5">Số điện thoại *</label>
                  <input
                    {...register('phone', { required: 'Vui lòng nhập số điện thoại', pattern: { value: /^[0-9]{9,11}$/, message: 'Số điện thoại không hợp lệ' } })}
                    type="tel"
                    placeholder="0901 234 567"
                    className={`w-full px-4 py-3 border rounded-lg text-sm font-body outline-none focus:border-vnpt transition-colors ${errors.phone ? 'border-accent' : 'border-shade'}`}
                  />
                  {errors.phone && <p className="text-xs text-accent mt-1">{errors.phone.message}</p>}
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-semibold block mb-1.5">Email</label>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="example@email.com"
                    className="w-full px-4 py-3 border border-shade rounded-lg text-sm font-body outline-none focus:border-vnpt transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Địa chỉ giao hàng */}
            <div className="bg-white border border-shade rounded-xl p-7">
              <div className="flex items-center gap-3 text-base font-bold text-body mb-5">
                <span className="w-7 h-7 rounded-full bg-vnpt text-white flex items-center justify-center text-xs font-bold">2</span>
                Địa chỉ giao hàng
              </div>

              {addresses.length > 0 && (
                <div className="flex gap-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setUseExistingAddress(true)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${useExistingAddress ? 'bg-vnpt text-white' : 'border border-shade text-muted hover:border-vnpt'}`}
                  >
                    Dùng địa chỉ đã lưu
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseExistingAddress(false)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${!useExistingAddress ? 'bg-vnpt text-white' : 'border border-shade text-muted hover:border-vnpt'}`}
                  >
                    Nhập địa chỉ mới
                  </button>
                </div>
              )}

              {useExistingAddress && addresses.length > 0 ? (
                <div className="space-y-2">
                  {addresses.map(addr => (
                    <label key={addr.id} className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${selectedAddressId == addr.id ? 'border-vnpt bg-vnpt-light' : 'border-shade hover:border-vnpt-light'}`}>
                      <input type="radio" {...register('address_id')} value={addr.id} className="accent-vnpt mt-0.5" />
                      <div className="text-sm">
                        <div className="font-semibold text-body">{addr.receiver_name} · {addr.phone}</div>
                        <div className="text-muted">{addr.address_line}, {addr.ward}, {addr.district}, {addr.province}</div>
                        {addr.is_default && <span className="text-xs text-vnpt font-semibold">Địa chỉ mặc định</span>}
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold block mb-1.5">Tỉnh / Thành phố *</label>
                    <input
                      {...register('city', { required: !useExistingAddress })}
                      placeholder="TP. Hồ Chí Minh"
                      className="w-full px-4 py-3 border border-shade rounded-lg text-sm font-body outline-none focus:border-vnpt"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold block mb-1.5">Quận / Huyện *</label>
                    <input
                      {...register('district', { required: !useExistingAddress })}
                      placeholder="Quận 1"
                      className="w-full px-4 py-3 border border-shade rounded-lg text-sm font-body outline-none focus:border-vnpt"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-semibold block mb-1.5">Địa chỉ cụ thể *</label>
                    <input
                      {...register('address', { required: !useExistingAddress && 'Vui lòng nhập địa chỉ' })}
                      placeholder="Số nhà, tên đường..."
                      className={`w-full px-4 py-3 border rounded-lg text-sm font-body outline-none focus:border-vnpt transition-colors ${errors.address ? 'border-accent' : 'border-shade'}`}
                    />
                    {errors.address && <p className="text-xs text-accent mt-1">{errors.address.message}</p>}
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-semibold block mb-1.5">Ghi chú</label>
                    <input
                      {...register('note')}
                      placeholder="Giao giờ hành chính, gọi trước 30 phút..."
                      className="w-full px-4 py-3 border border-shade rounded-lg text-sm font-body outline-none focus:border-vnpt"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Phương thức thanh toán */}
            <div className="bg-white border border-shade rounded-xl p-7">
              <div className="flex items-center gap-3 text-base font-bold text-body mb-5">
                <span className="w-7 h-7 rounded-full bg-vnpt text-white flex items-center justify-center text-xs font-bold">3</span>
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
                <div key={item.key} className="flex items-center gap-3">
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
                <span>{formatPrice(total())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Vận chuyển</span>
                <span className="text-success">Miễn phí</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t-2 border-shade mb-5">
              <span className="text-base font-bold">Tổng cộng</span>
              <span className="text-xl font-bold text-accent font-display">{formatPrice(total())}</span>
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