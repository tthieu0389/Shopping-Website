import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { toast } from '../utils/index.js'
import useAuthStore from '../store/authStore.js'

export default function LoginPage() {
  const { login, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    clearError()
    const res = await login(data)
    if (res.success) {
      toast.success('Đăng nhập thành công!')
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-2">
      {/* Left panel */}
      <div
        className="flex flex-col items-center justify-center p-16"
        style={{ background: 'linear-gradient(135deg, #00205f, #003087, #1a4fa8)' }}
      >
        <div className="text-center text-white max-w-xs">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/VNPT_Logo.svg/512px-VNPT_Logo.svg.png"
                alt="VNPT"
                className="w-7 brightness-0 invert"
              />
            </div>
            <span className="text-white font-extrabold text-xl">VNPT Shop</span>
          </Link>
          <div className="font-display text-3xl font-bold mb-4">
            Chào mừng trở lại<br />
            <span className="text-blue-300">VNPT Shop!</span>
          </div>
          <p className="text-white/75 text-sm leading-relaxed mb-8">
            Đăng nhập để theo dõi đơn hàng, quản lý tài khoản và nhận ưu đãi độc quyền.
          </p>
          <div className="flex flex-col gap-3 text-left">
            {[
              '🎁 Voucher 200.000₫ khi đăng ký',
              '📦 Theo dõi đơn hàng realtime',
              '⭐ Tích điểm đổi quà mỗi đơn',
            ].map(t => (
              <div key={t} className="flex items-center gap-2 text-sm text-white/85">{t}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center p-16 bg-white">
        <div className="w-full max-w-sm">
          <h2 className="font-display text-3xl font-bold text-body mb-1">Đăng nhập</h2>
          <p className="text-sm text-muted mb-8">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-vnpt font-bold hover:underline">Đăng ký miễn phí →</Link>
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-accent font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-semibold text-body block mb-1.5">Email *</label>
              <input
                {...register('email', {
                  required: 'Vui lòng nhập email',
                  pattern: { value: /\S+@\S+\.\S+/, message: 'Email không hợp lệ' },
                })}
                type="email"
                placeholder="example@email.com"
                className={`w-full px-4 py-3 border rounded-lg text-sm font-body outline-none focus:border-vnpt transition-colors ${
                  errors.email ? 'border-accent' : 'border-shade'
                }`}
              />
              {errors.email && <p className="text-xs text-accent mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-body block mb-1.5">Mật khẩu *</label>
              <input
                {...register('password', {
                  required: 'Vui lòng nhập mật khẩu',
                  minLength: { value: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
                })}
                type="password"
                placeholder="Nhập mật khẩu"
                className={`w-full px-4 py-3 border rounded-lg text-sm font-body outline-none focus:border-vnpt transition-colors ${
                  errors.password ? 'border-accent' : 'border-shade'
                }`}
              />
              {errors.password && <p className="text-xs text-accent mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-vnpt text-white rounded-full font-bold text-base hover:bg-vnpt-dark transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? '⏳ Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
