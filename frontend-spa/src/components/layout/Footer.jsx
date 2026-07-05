import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-[#0a0a1a] text-white/60 pt-12 pb-6">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-10">

        {/* Main grid — 1 col mobile → 2 col sm → 4 col lg */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-8 lg:gap-11 mb-10">

          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 bg-vnpt rounded-lg flex items-center justify-center flex-shrink-0">
                <img src="https://upload.wikimedia.org/wikipedia/vi/6/65/VNPT_Logo.svg" alt="VNPT" className="w-6 brightness-0 invert" />
              </div>
              <span className="text-white font-extrabold text-lg">VNPT Shop</span>
            </div>
            <p className="text-sm leading-relaxed text-white/50 max-w-[340px]">
              Hệ thống mua sắm điện thoại, sim số và dịch vụ viễn thông hàng đầu Việt Nam. Hơn 2 triệu khách hàng tin dùng.
            </p>
            {/* Social links */}
            <div className="flex gap-3 mt-5">
              {[
                { label: 'Facebook', icon: 'f' },
                { label: 'Zalo',     icon: 'Z' },
                { label: 'YouTube',  icon: '▶' },
              ].map(({ label, icon }) => (
                <button
                  key={label}
                  aria-label={label}
                  className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 transition-all text-sm font-bold"
                >
                  {icon}
                </button>
              ))}
            </div>
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
                ['/flash-sale',                      '⚡ Flash Sale'],
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
                ['/contact',        'Liên hệ'],
                ['/account/orders', 'Theo dõi đơn hàng'],
                ['/blog',           'Tin tức & Blog'],
                ['/account',        'Tài khoản của tôi'],
              ].map(([to, label]) => (
                <li key={label}>
                  <Link to={to} className="text-sm text-white/50 hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
              <li>
                <a href="tel:18001234" className="text-sm text-white/50 hover:text-white transition-colors">
                  📞 Hotline: 1800 1234
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/8 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-white/30 text-center sm:text-left">© 2024 VNPT Shop. Bảo lưu mọi quyền. | ĐKKD: 0100686209</p>
          <div className="flex items-center gap-4">
            {['Chính sách bảo mật', 'Điều khoản sử dụng'].map(t => (
              <Link key={t} to="/contact" className="text-xs text-white/30 hover:text-white/60 transition-colors whitespace-nowrap">{t}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}