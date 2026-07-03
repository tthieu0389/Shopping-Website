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
        className="relative flex flex-col items-center justify-center p-16 overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #00205f 0%, #003087 55%, #1a4fa8 100%)' }}
      >
        {/* Background decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #ffffff, transparent)' }} />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #ffffff, transparent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #4a90d9, transparent)' }} />

        {/* Content */}
        <div className="relative z-10 text-center text-white max-w-sm w-full">
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-2.5 mb-12">
            <div className="w-10 h-10 bg-white/15 backdrop-blur rounded-xl flex items-center justify-center border border-white/20">
              <img
                src="https://upload.wikimedia.org/wikipedia/vi/6/65/VNPT_Logo.svg"
                alt="VNPT"
                className="w-6 brightness-0 invert"
              />
            </div>
            <span className="text-white font-extrabold text-xl tracking-tight">VNPT Shop</span>
          </Link>

          {/* Headline */}
          <h1 className="font-display text-4xl font-bold mb-3 leading-tight">
            Chào mừng<br />trở lại!
          </h1>
          <p className="text-white/70 text-sm leading-relaxed mb-10 max-w-xs mx-auto">
            Đăng nhập để quản lý tài khoản và nhận ưu đãi độc quyền.
          </p>

          {/* Feature cards */}
          <div className="flex flex-col gap-3 text-left">
            {[
              { icon: '📦', title: 'Theo dõi đơn hàng', desc: 'Cập nhật trạng thái đơn hàng realtime' },
              { icon: '⭐', title: 'Tích điểm thưởng', desc: 'Đổi điểm lấy ưu đãi mỗi lần mua' },
              { icon: '🔔', title: 'Thông báo khuyến mãi', desc: 'Nhận ngay khi có flash sale độc quyền' },
            ].map(item => (
              <div key={item.title}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="text-white font-semibold text-sm">{item.title}</p>
                  <p className="text-white/60 text-xs">{item.desc}</p>
                </div>
              </div>
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
            <Link to="/register" className="text-vnpt font-bold hover:underline">Đăng ký →</Link>
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
              className="w-full py-3.5 bg-vnpt text-white rounded-full font-bold text-base hover:bg-vnpt-dark transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {isLoading ? '⏳ Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}