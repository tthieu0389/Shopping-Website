import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Breadcrumb } from '../components/common/index.jsx'
import { toast } from '../utils/index.js'
import { contactApi } from '../api/index.js'

const CONTACT_INFO = [
  { icon: '📞', title: 'Hotline miễn phí', value: '1800 1234',       sub: 'Hỗ trợ 24/7' },
  { icon: '📧', title: 'Email',             value: 'hotro@vnpt.vn',   sub: 'Phản hồi trong 2-4 giờ' },
  { icon: '🏪', title: 'Cửa hàng',          value: '200+ cửa hàng',   sub: 'Toàn quốc' },
  { icon: '🕐', title: 'Giờ làm việc',      value: 'T2–CN: 7:30–21:00', sub: 'Kể cả ngày lễ' },
]

const REQUEST_TYPES = [
  'Tư vấn mua hàng',
  'Kiểm tra đơn hàng',
  'Đổi trả / Hoàn tiền',
  'Bảo hành',
  'Khác',
]

export default function ContactPage() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  const [sending, setSending] = useState(false)

  const onSubmit = async (data) => {
    setSending(true)
    try {
      await contactApi.send({
        name:    data.name,
        email:   data.email,
        message: `[${data.type}] ${data.message}`,
      })
      toast.success('Đã gửi yêu cầu! Chúng tôi sẽ liên hệ sớm.')
      reset()
    } catch (err) {
      toast.error(err.message || 'Gửi thất bại, vui lòng thử lại')
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <div
        className="text-center py-14 px-10"
        style={{ background: 'linear-gradient(135deg, #00205f, #003087)' }}
      >
        <h1 className="font-display text-4xl font-bold text-white mb-3">📞 Liên hệ với chúng tôi</h1>
        <p className="text-white/75 text-sm">Đội ngũ hỗ trợ VNPT Shop luôn sẵn sàng 24/7</p>
      </div>

      <Breadcrumb items={[{ to: '/', label: 'Trang chủ' }, { label: 'Liên hệ' }]} />

      <div className="max-w-[1200px] mx-auto px-10 py-12 grid grid-cols-[1fr_380px] gap-8">

        {/* ── FORM ─────────────────────────────────────────────────────────── */}
        <div className="bg-white border border-shade rounded-[20px] p-9">
          <h2 className="font-display text-2xl font-bold text-body mb-2">Gửi yêu cầu hỗ trợ</h2>
          <p className="text-sm text-muted mb-7">
            Điền form bên dưới, chúng tôi sẽ phản hồi trong 2–4 giờ
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold block mb-1.5">Họ và tên *</label>
                <input
                  {...register('name', { required: 'Vui lòng nhập họ tên' })}
                  placeholder="Nguyễn Văn A"
                  className={`w-full px-4 py-3 border rounded-lg text-sm font-body outline-none focus:border-vnpt transition-colors ${
                    errors.name ? 'border-accent' : 'border-shade'
                  }`}
                />
                {errors.name && <p className="text-xs text-accent mt-1">{errors.name.message}</p>}
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
            </div>

            <div>
              <label className="text-sm font-semibold block mb-1.5">Loại yêu cầu</label>
              <select
                {...register('type')}
                className="w-full px-4 py-3 border border-shade rounded-lg text-sm font-body outline-none focus:border-vnpt bg-white"
              >
                {REQUEST_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-1.5">Nội dung *</label>
              <textarea
                {...register('message', { required: 'Vui lòng nhập nội dung' })}
                rows={5}
                placeholder="Mô tả chi tiết yêu cầu của bạn..."
                className={`w-full px-4 py-3 border rounded-lg text-sm font-body outline-none focus:border-vnpt resize-none transition-colors ${
                  errors.message ? 'border-accent' : 'border-shade'
                }`}
              />
              {errors.message && <p className="text-xs text-accent mt-1">{errors.message.message}</p>}
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full py-3.5 bg-vnpt text-white rounded-full font-bold text-base hover:bg-vnpt-dark transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {sending ? '⏳ Đang gửi...' : '📤 Gửi yêu cầu'}
            </button>
          </form>
        </div>

        {/* ── CONTACT INFO ─────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {CONTACT_INFO.map(({ icon, title, value, sub }) => (
            <div key={title} className="bg-white border border-shade rounded-xl p-5 flex items-start gap-4">
              <div className="w-11 h-11 bg-vnpt-light rounded-[10px] flex items-center justify-center text-xl flex-shrink-0">
                {icon}
              </div>
              <div>
                <div className="text-sm font-bold text-body">{title}</div>
                <div className="text-base font-semibold text-vnpt">{value}</div>
                <div className="text-xs text-muted">{sub}</div>
              </div>
            </div>
          ))}

          {/* Map placeholder */}
          <div className="bg-vnpt-light rounded-xl p-6 text-center border border-shade">
            <div className="text-4xl mb-3">🗺️</div>
            <div className="text-sm font-semibold text-body mb-1">Văn phòng đại diện</div>
            <div className="text-xs text-muted leading-relaxed">
              57 Huỳnh Thúc Kháng, Đống Đa, Hà Nội
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
