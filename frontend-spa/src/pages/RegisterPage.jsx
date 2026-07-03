import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { toast } from '../utils/index.js'
import useAuthStore from '../store/authStore.js'

export default function RegisterPage() {
  const { register: registerUser, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const password = watch('password')

  const onSubmit = async (data) => {
    clearError()
    const payload = {
      name:     `${data.first_name} ${data.last_name}`.trim(),
      email:    data.email,
      password: data.password,
    }
    const res = await registerUser(payload)
    if (res.success) {
      toast.success('Đăng ký thành công! Vui lòng đăng nhập 🎉')
      navigate('/login')
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
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #ffffff, transparent)' }} />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #ffffff, transparent)' }} />

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
            Tham gia<br />VNPT Shop!
          </h1>
          <p className="text-white/70 text-sm leading-relaxed mb-10 max-w-xs mx-auto">
            Tạo tài khoản để mua sắm nhanh hơn và nhận ưu đãi dành riêng thành viên.
          </p>

          {/* Steps */}
          <div className="flex flex-col gap-3 text-left">
            {[
              { step: '01', title: 'Tạo tài khoản', desc: 'Điền thông tin cơ bản, xong trong 1 phút' },
              { step: '02', title: 'Khám phá sản phẩm', desc: 'Sim, điện thoại, dịch vụ viễn thông' },
              { step: '03', title: 'Mua sắm & nhận ưu đãi', desc: 'Tích điểm, flash sale độc quyền thành viên' },
            ].map(item => (
              <div key={item.step}
                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                <span className="text-xs font-bold text-white/40 font-display w-5 flex-shrink-0">{item.step}</span>
                <div className="w-px h-8 bg-white/20 flex-shrink-0" />
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
      <div className="flex items-center justify-center p-16 bg-white overflow-y-auto">
        <div className="w-full max-w-sm">
          <h2 className="font-display text-3xl font-bold text-body mb-1">Tạo tài khoản</h2>
          <p className="text-sm text-muted mb-8">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-vnpt font-bold hover:underline">Đăng nhập →</Link>
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-accent font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold block mb-1.5">Họ *</label>
                <input
                  {...register('first_name', { required: 'Nhập họ' })}
                  placeholder="Nguyễn"
                  className={`w-full px-4 py-3 border rounded-lg text-sm font-body outline-none focus:border-vnpt transition-colors ${
                    errors.first_name ? 'border-accent' : 'border-shade'
                  }`}
                />
                {errors.first_name && <p className="text-xs text-accent mt-1">{errors.first_name.message}</p>}
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1.5">Tên *</label>
                <input
                  {...register('last_name', { required: 'Nhập tên' })}
                  placeholder="Văn A"
                  className={`w-full px-4 py-3 border rounded-lg text-sm font-body outline-none focus:border-vnpt transition-colors ${
                    errors.last_name ? 'border-accent' : 'border-shade'
                  }`}
                />
                {errors.last_name && <p className="text-xs text-accent mt-1">{errors.last_name.message}</p>}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-1.5">Email *</label>
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
              <label className="text-sm font-semibold block mb-1.5">Mật khẩu *</label>
              <input
                {...register('password', {
                  required: 'Vui lòng nhập mật khẩu',
                  minLength: { value: 6, message: 'Tối thiểu 6 ký tự' },
                })}
                type="password"
                placeholder="Tối thiểu 6 ký tự"
                className={`w-full px-4 py-3 border rounded-lg text-sm font-body outline-none focus:border-vnpt transition-colors ${
                  errors.password ? 'border-accent' : 'border-shade'
                }`}
              />
              {errors.password && <p className="text-xs text-accent mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold block mb-1.5">Xác nhận mật khẩu *</label>
              <input
                {...register('confirm_password', {
                  required: 'Vui lòng xác nhận mật khẩu',
                  validate: v => v === password || 'Mật khẩu không khớp',
                })}
                type="password"
                placeholder="Nhập lại mật khẩu"
                className={`w-full px-4 py-3 border rounded-lg text-sm font-body outline-none focus:border-vnpt transition-colors ${
                  errors.confirm_password ? 'border-accent' : 'border-shade'
                }`}
              />
              {errors.confirm_password && (
                <p className="text-xs text-accent mt-1">{errors.confirm_password.message}</p>
              )}
            </div>

            <label className="flex items-start gap-2.5 text-xs text-muted cursor-pointer">
              <input
                {...register('agree', { required: 'Vui lòng đồng ý điều khoản' })}
                type="checkbox"
                className="accent-vnpt mt-0.5 flex-shrink-0"
              />
              <span>
                Tôi đồng ý với{' '}
                <span className="text-vnpt font-semibold">Điều khoản sử dụng</span> và{' '}
                <span className="text-vnpt font-semibold">Chính sách bảo mật</span>
              </span>
            </label>
            {errors.agree && <p className="text-xs text-accent -mt-2">{errors.agree.message}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-vnpt text-white rounded-full font-bold text-base hover:bg-vnpt-dark transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {isLoading ? '⏳ Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}