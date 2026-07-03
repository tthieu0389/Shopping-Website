import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { toast } from '../utils/index.js'
import useAuthStore from '../store/authStore.js'

export default function LoginPage() {
  const { login, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [showPassword, setShowPassword] = useState(false)

  const onSubmit = async (data) => {
    clearError()
    const res = await login(data)
    if (res.success) {
      toast.success('Đăng nhập thành công!')
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex w-[52%] relative flex-col justify-between p-14 overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #00205f 0%, #003087 60%, #1a4fa8 100%)' }}
      >
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Glow blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 80% 10%, #4a8fff, transparent 60%)' }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 20% 90%, #003087, transparent 60%)' }} />

        {/* Logo */}
        <Link to="/" className="relative z-10 flex items-center gap-3 w-fit">
          <div className="w-9 h-9 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center">
            <img
              src="https://upload.wikimedia.org/wikipedia/vi/6/65/VNPT_Logo.svg"
              alt="VNPT"
              className="w-5 brightness-0 invert"
            />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">VNPT Shop</span>
        </Link>

        {/* Center content */}
        <div className="relative z-10">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-[0.2em] mb-4">
            Mua sắm công nghệ
          </p>
          <h1
            className="text-white font-bold leading-[1.05] mb-6"
            style={{ fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', fontFamily: 'Roboto, sans-serif' }}
          >
            Chào mừng<br />trở lại.
          </h1>
          <p className="text-white/55 text-base leading-relaxed max-w-xs">
            Đăng nhập để xem đơn hàng, quản lý địa chỉ giao hàng và tiếp tục mua sắm.
          </p>

          {/* Divider */}
          <div className="mt-10 pt-10 border-t border-white/10">
            <div className="grid grid-cols-2 gap-6">
              {[
                { num: '500+', label: 'Sản phẩm công nghệ' },
                { num: '24/7', label: 'Hỗ trợ khách hàng' },
              ].map(s => (
                <div key={s.num}>
                  <p className="text-white text-2xl font-bold" style={{ fontFamily: 'Roboto, sans-serif' }}>{s.num}</p>
                  <p className="text-white/45 text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom note */}
        <p className="relative z-10 text-white/25 text-xs">
          © {new Date().getFullYear()} VNPT Shop. All rights reserved.
        </p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-[380px]">

          {/* Mobile logo */}
          <Link to="/" className="flex lg:hidden items-center gap-2.5 mb-10">
            <div className="w-8 h-8 bg-vnpt/10 rounded-lg flex items-center justify-center">
              <img src="https://upload.wikimedia.org/wikipedia/vi/6/65/VNPT_Logo.svg" alt="VNPT" className="w-4.5" />
            </div>
            <span className="text-vnpt font-bold text-base">VNPT Shop</span>
          </Link>

          <h2
            className="font-bold text-body mb-1"
            style={{ fontSize: '1.75rem', fontFamily: 'Roboto, sans-serif' }}
          >
            Đăng nhập
          </h2>
          <p className="text-muted text-sm mb-8">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-vnpt font-semibold hover:underline">Tạo tài khoản →</Link>
          </p>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600 font-medium">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-5">
            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-body uppercase tracking-wide block mb-2">Email</label>
              <input
                {...register('email', {
                  required: 'Vui lòng nhập email',
                  pattern: { value: /\S+@\S+\.\S+/, message: 'Email không hợp lệ' },
                })}
                type="email"
                placeholder="example@email.com"
                autoComplete="email"
                className={`w-full px-4 py-3.5 border rounded-xl text-sm outline-none transition-all
                  focus:border-vnpt focus:ring-2 focus:ring-vnpt/10
                  ${errors.email ? 'border-red-400 bg-red-50' : 'border-shade bg-surface'}`}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1.5">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-body uppercase tracking-wide block mb-2">Mật khẩu</label>
              <div className="relative">
                <input
                  {...register('password', {
                    required: 'Vui lòng nhập mật khẩu',
                    minLength: { value: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                  className={`w-full px-4 py-3.5 pr-12 border rounded-xl text-sm outline-none transition-all
                    focus:border-vnpt focus:ring-2 focus:ring-vnpt/10
                    ${errors.password ? 'border-red-400 bg-red-50' : 'border-shade bg-surface'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-body transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1.5">{errors.password.message}</p>}
            </div>

            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isLoading}
              className="w-full py-3.5 bg-vnpt hover:bg-vnpt-dark text-white rounded-xl font-bold text-sm tracking-wide transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </div>

          <p className="text-center text-xs text-muted mt-8">
            Bằng cách đăng nhập, bạn đồng ý với{' '}
            <span className="text-vnpt font-medium cursor-pointer hover:underline">Điều khoản sử dụng</span>
            {' '}và{' '}
            <span className="text-vnpt font-medium cursor-pointer hover:underline">Chính sách bảo mật</span>.
          </p>
        </div>
      </div>
    </div>
  )
}