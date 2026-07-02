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
      // Backend không trả token sau register → chuyển sang trang login
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-2">
      {/* Left panel */}
      <div
        className="flex flex-col items-center justify-center p-16"
        style={{ background: 'linear-gradient(135deg, #00205f, #003087, #b30a12)' }}
      >
        <div className="text-center text-white max-w-xs">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 bg-vnpt rounded-lg flex items-center justify-center">
              <img
                src="https://upload.wikimedia.org/wikipedia/vi/6/65/VNPT_Logo.svg"
                alt="VNPT"
                className="w-6 brightness-0 invert"
              />
            </div>
            <span className="text-white font-extrabold text-xl">VNPT Shop</span>
          </Link>
          <div className="font-display text-3xl font-bold mb-4">
            Tham gia ngay<br />
            <span className="text-yellow-300">VNPT Shop!</span>
          </div>
          <p className="text-white/75 text-sm leading-relaxed mb-6">
            Đăng ký để nhận ưu đãi đặc biệt dành riêng cho thành viên mới.
          </p>
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
              className="w-full py-3.5 bg-vnpt text-white rounded-full font-bold text-base hover:bg-vnpt-dark transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? '⏳ Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}