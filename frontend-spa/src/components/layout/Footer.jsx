import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-[#0a0a1a] text-white/60 pt-14 pb-6 px-10">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-11 mb-11">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 bg-vnpt rounded-lg flex items-center justify-center">
                <img
                  src="https://upload.wikimedia.org/wikipedia/vi/6/65/VNPT_Logo.svg"
                  alt="VNPT"
                  className="w-6 brightness-0 invert"
                />
              </div>
              <span className="text-white font-extrabold text-lg">VNPT Shop</span>
            </div>
            <p className="text-sm leading-relaxed mb-5 text-white/50">
              Hệ thống mua sắm điện thoại, sim số và dịch vụ viễn thông hàng đầu Việt Nam. Hơn 2 triệu khách hàng tin dùng.
            </p>
          </div>

          {/* Sản phẩm */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Sản phẩm</h4>
            <ul className="space-y-2.5">
              {[
                ['/products?product_type=device',    'Điện thoại'],
                ['/products?product_type=tv',        'Máy tính bảng'],
                ['/products?product_type=sim',       'Sim số đẹp'],
                ['/products?product_type=accessory', 'Phụ kiện'],
                ['/flash-sale',                      'Flash Sale'],
              ].map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-white/50 hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Dịch vụ */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Dịch vụ</h4>
            <ul className="space-y-2.5">
              {[
                ['/products?product_type=internet', 'Internet cáp quang'],
                ['/products?product_type=tv',       'Truyền hình MyTV'],
                ['/products?product_type=internet', 'VNPT Cloud'],
                ['/contact',                        'Điện thoại cố định'],
                ['/contact',                        'Doanh nghiệp'],
              ].map(([to, label]) => (
                <li key={label}>
                  <Link to={to} className="text-sm text-white/50 hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Hỗ trợ */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Hỗ trợ</h4>
            <ul className="space-y-2.5">
              {[
                ['/contact',          'Liên hệ'],
                ['/account/orders',   'Theo dõi đơn hàng'],
                ['/blog',             'Tin tức & Blog'],
                ['/account',          'Tài khoản của tôi'],
                ['/contact',          'Hotline: 1800 1234'],
              ].map(([to, label]) => (
                <li key={label}>
                  <Link to={to} className="text-sm text-white/50 hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/8 pt-5">
          <p className="text-xs text-white/30">© 2024 VNPT Shop. Bảo lưu mọi quyền. | ĐKKD: 0100686209</p>
        </div>
      </div>
    </footer>
  )
}