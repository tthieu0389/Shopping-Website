import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Breadcrumb } from '../components/common/index.jsx'
import { toast, formatDate } from '../utils/index.js'
import { contactApi } from '../api/index.js'
import useAuthStore from '../store/authStore.js'
import useContactStore from '../store/contactStore.js'

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

// ── TAB: PHẢN HỒI CỦA TÔI ─────────────────────────────────────────────────
// Layout kiểu email/trang admin: danh sách liên hệ bên trái, chi tiết +
// phản hồi (nếu có) bên phải. Khi tab này được mở, tự động đánh dấu đã đọc
// để tắt chấm đỏ ở Navbar.
function MyRepliesTab() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const markAllRead = useContactStore(s => s.markAllRead)

  useEffect(() => {
    contactApi.getMine()
      .then(res => {
        const data = res.data || []
        setContacts(data)
        setSelected(prev => prev ?? data[0] ?? null)
        // Đánh dấu đã đọc + tắt chấm đỏ ngay khi mở tab, không cần chờ
        // user click vào từng tin nhắn — vì họ đã chủ động vào xem rồi.
        markAllRead(data)
      })
      .catch(err => toast.error(err.message || 'Không thể tải phản hồi'))
      .finally(() => setLoading(false))
  }, [markAllRead])

  if (loading) {
    return <div className="py-16 text-center text-muted text-sm">Đang tải...</div>
  }

  if (contacts.length === 0) {
    return (
      <div className="py-16 text-center text-muted flex flex-col items-center gap-2">
        <span className="text-4xl">📭</span>
        <span className="text-sm font-semibold">Bạn chưa gửi yêu cầu liên hệ nào</span>
      </div>
    )
  }

  // Tách phần "[Loại yêu cầu]" khỏi nội dung message để hiện làm tiêu đề gọn
  // trong danh sách, giống cách phân loại ở trang quản trị.
  const parseMessage = (msg = '') => {
    const m = msg.match(/^\[(.+?)\]\s*([\s\S]*)$/)
    return m ? { type: m[1], body: m[2] } : { type: null, body: msg }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 border border-shade rounded-2xl overflow-hidden bg-white" style={{ minHeight: 480 }}>
      {/* Danh sách liên hệ */}
      <div className="flex flex-col border-r border-shade overflow-hidden" style={{ maxHeight: 640 }}>
        <div className="px-4 py-3 border-b border-shade text-[13px] font-bold text-body flex-shrink-0">
          Yêu cầu của tôi ({contacts.length})
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.map(c => {
            const { type, body } = parseMessage(c.message)
            return (
              <div
                key={c.id}
                onClick={() => setSelected(c)}
                className={`px-4 py-3.5 border-b border-shade cursor-pointer transition-colors ${
                  selected?.id === c.id ? 'bg-vnpt-light border-l-2 border-l-vnpt' : 'hover:bg-cream'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5 gap-2">
                  <div className="font-bold text-[13px] text-body truncate flex-1">{type || 'Liên hệ'}</div>
                  <span
                    className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      c.status === 'resolved' ? 'bg-success/10 text-green-600' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {c.status === 'resolved' ? '✓' : '⏳'}
                  </span>
                </div>
                <div className="text-xs text-muted truncate mb-1">{body}</div>
                <div className="text-[11px] text-muted">{formatDate(c.created_at)}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Chi tiết */}
      <div className="flex flex-col overflow-hidden" style={{ maxHeight: 640 }}>
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-muted flex-col gap-2.5">
            <span className="text-4xl">💬</span>
            <span className="text-sm font-semibold">Chọn một yêu cầu để xem chi tiết</span>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-shade flex justify-between items-start gap-3 flex-shrink-0">
              <div>
                <div className="font-extrabold text-base text-body mb-0.5">
                  {parseMessage(selected.message).type || 'Liên hệ'}
                </div>
                <div className="text-[13px] text-muted">{formatDate(selected.created_at)}</div>
              </div>
              <span
                className={`flex-shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                  selected.status === 'resolved' ? 'bg-success/10 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                {selected.status === 'resolved' ? '✓ Đã phản hồi' : '⏳ Đang chờ'}
              </span>
            </div>

            {/* Nội dung */}
            <div className="px-6 py-4 border-b border-shade flex-shrink-0">
              <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Nội dung đã gửi</div>
              <div className="bg-cream rounded-xl p-4 text-sm text-body leading-relaxed whitespace-pre-wrap break-words h-40 resize-y overflow-y-auto">
                {parseMessage(selected.message).body}
              </div>
            </div>

            {/* Phản hồi */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {selected.reply ? (
                <>
                  <div className="text-[11px] font-bold text-vnpt uppercase tracking-wider mb-2">
                    Phản hồi từ VNPT Shop{selected.replied_at ? ` · ${formatDate(selected.replied_at)}` : ''}
                  </div>
                  <div className="bg-vnpt-light/40 border border-vnpt/20 rounded-xl p-4 text-sm text-body leading-relaxed whitespace-pre-wrap break-words">
                    {selected.reply}
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted flex flex-col items-center justify-center h-full gap-2">
                  <span className="text-3xl">⏳</span>
                  <span>Chưa có phản hồi — chúng tôi sẽ liên hệ trong 2–4 giờ</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function ContactPage() {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm()
  const [sending, setSending] = useState(false)
  const message = watch('message', '')
  const MESSAGE_MAX_LEN = 2000
  const { isAuthenticated } = useAuthStore()
  const [tab, setTab] = useState('send') // 'send' | 'mine'

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

      {/* ── TABS ─────────────────────────────────────────────────────────── */}
      {isAuthenticated && (
        <div className="max-w-[1200px] mx-auto px-10 pt-8 flex gap-2">
          <button
            onClick={() => setTab('send')}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-colors ${
              tab === 'send' ? 'bg-vnpt text-white' : 'bg-cream text-muted hover:text-vnpt'
            }`}
          >
            Gửi yêu cầu
          </button>
          <button
            onClick={() => setTab('mine')}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-colors ${
              tab === 'mine' ? 'bg-vnpt text-white' : 'bg-cream text-muted hover:text-vnpt'
            }`}
          >
            Phản hồi của tôi
          </button>
        </div>
      )}

      {tab === 'mine' && isAuthenticated ? (
        <div className="max-w-[800px] mx-auto px-10 py-8">
          <MyRepliesTab />
        </div>
      ) : (
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
                rows={10}
                maxLength={MESSAGE_MAX_LEN}
                placeholder="Mô tả chi tiết yêu cầu của bạn..."
                className={`w-full px-4 py-3 border rounded-lg text-sm font-body outline-none focus:border-vnpt resize-none transition-colors ${
                  errors.message ? 'border-accent' : 'border-shade'
                }`}
              />
              <div className={`text-xs mt-1 text-right ${(message?.length || 0) >= MESSAGE_MAX_LEN ? 'text-accent font-semibold' : 'text-muted'}`}>
                {message?.length || 0}/{MESSAGE_MAX_LEN}
              </div>
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
      )}
    </div>
  )
}