import { Link } from 'react-router-dom'

export default function CheckoutSuccessPage() {
  return (
    <div className="max-w-[680px] mx-auto px-10 py-16 text-center">
      <div className="text-[72px] mb-4">✅</div>
      <h1 className="font-display text-3xl font-bold text-body mb-3">Đặt hàng thành công!</h1>
      <p className="text-muted mb-8 leading-relaxed">
        Cảm ơn bạn đã mua hàng tại VNPT Shop. Đơn hàng của bạn đang được xử lý — chúng tôi sẽ liên hệ xác nhận sớm nhất.
      </p>

      <div className="bg-cream border border-shade rounded-xl p-7 text-left mb-8">
        <div className="text-xs font-bold text-muted uppercase tracking-wider mb-5">Thông tin đơn hàng</div>
        {[
          ['Trạng thái', '🟡 Đang xử lý'],
          ['Thời gian giao hàng', '1 – 3 ngày làm việc'],
          ['Theo dõi đơn hàng', 'Xem tại mục Tài khoản → Đơn hàng'],
        ].map(([l, v]) => (
          <div key={l} className="flex justify-between items-center py-3 border-b border-shade last:border-none text-sm">
            <span className="text-muted">{l}</span>
            <span className="font-semibold">{v}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-3 justify-center">
        {[
          { to: '/account/orders', label: 'Xem đơn hàng' },
          { to: '/',               label: 'Về trang chủ' },
        ].map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className="px-7 py-3 border-2 border-vnpt text-vnpt rounded-full font-bold text-sm transition-all"
            onMouseEnter={e => { e.currentTarget.style.background = '#003087'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '' }}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}