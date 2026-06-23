import { Link } from 'react-router-dom'

export default function CheckoutSuccessPage() {
  return (
    <div className="max-w-[680px] mx-auto px-10 py-16 text-center">
      <div className="text-[72px] mb-4">✅</div>
      <h1 className="font-display text-3xl font-bold text-body mb-3">Đặt hàng thành công!</h1>
      <p className="text-muted mb-8 leading-relaxed">
        Cảm ơn bạn đã mua hàng tại VNPT Shop. Đơn hàng đang được xử lý và sẽ giao trong{' '}
        <strong>2 tiếng</strong>.
      </p>

      <div className="bg-cream border border-shade rounded-xl p-7 text-left mb-8">
        <div className="text-xs font-bold text-muted uppercase tracking-wider mb-5">Thông tin đơn hàng</div>
        {[
          ['Trạng thái', '🟡 Đang xử lý'],
          ['Phương thức vận chuyển', '⚡ Giao hàng nhanh 2H'],
          ['Dự kiến giao hàng', 'Trước 17:00 hôm nay'],
        ].map(([l, v]) => (
          <div key={l} className="flex justify-between items-center py-3 border-b border-shade last:border-none text-sm">
            <span className="text-muted">{l}</span>
            <span className="font-semibold">{v}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-3 justify-center">
        <Link to="/account/orders" className="px-7 py-3 border-2 border-vnpt text-vnpt rounded-full font-bold text-sm hover:bg-vnpt hover:text-white transition-all">
          Xem đơn hàng
        </Link>
        <Link to="/" className="px-7 py-3 bg-vnpt text-white rounded-full font-bold text-sm hover:bg-vnpt-dark transition-all">
          Về trang chủ
        </Link>
      </div>
    </div>
  )
}
