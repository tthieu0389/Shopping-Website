import { Link } from 'react-router-dom'
import { useCountdown } from '@/hooks'
import { useProducts, useCategories } from '@/hooks'
import { ProductCard, TrustBand, SectionHead, CountdownTimer, LoadingSpinner } from '@/components/common'

const CATEGORIES = [
  { slug: 'dien-thoai',   icon: '📱', name: 'Điện thoại',       count: '248 sản phẩm' },
  { slug: 'sim-so',       icon: '📶', name: 'Sim số đẹp',       count: '5.200+ sim' },
  { slug: 'goi-cuoc',     icon: '🌐', name: 'Gói cước 4G/5G',   count: '32 gói cước' },
  { slug: 'may-tinh-bang',icon: '💻', name: 'Máy tính bảng',    count: '86 sản phẩm' },
  { slug: 'phu-kien',     icon: '🎧', name: 'Phụ kiện',         count: '340+ phụ kiện' },
]

const SERVICES = [
  { icon: '🌐', name: 'Internet cáp quang', desc: 'Kết nối tốc độ cao lên đến 1Gbps. Ổn định, không giật lag.', price: '185.000₫/tháng', sub: 'Gói cơ bản 100Mbps' },
  { icon: '📺', name: 'MyTV — Truyền hình số', desc: '500+ kênh truyền hình trong nước và quốc tế. Xem lại 7 ngày.', price: '69.000₫/tháng', sub: 'Gói cơ bản 150 kênh' },
  { icon: '☁️', name: 'VNPT Cloud', desc: 'Lưu trữ và bảo mật dữ liệu doanh nghiệp trên cloud Việt Nam.', price: 'Miễn phí 3 tháng đầu', sub: 'Từ 200.000₫/tháng sau' },
]

const REVIEWS = [
  { initials: 'TL', name: 'Trần Thị Lan', date: '12/06/2024', rating: 5, text: 'Mua iPhone 16 Pro Max tại VNPT Shop, giá rẻ hơn, máy chính hãng, được tặng ốp lưng. Giao hàng chỉ 1.5 tiếng rất ấn tượng!' },
  { initials: 'MH', name: 'Nguyễn Minh Hùng', date: '08/06/2024', rating: 5, text: 'Đăng ký sim số đẹp online rất tiện, nhân viên tư vấn nhiệt tình. Sim về nhanh, kích hoạt ngay được.' },
  { initials: 'PV', name: 'Phạm Thùy Vân', date: '03/06/2024', rating: 4, text: 'Gói Internet cáp quang tốt, tốc độ ổn định. Kỹ thuật viên lắp đặt chuyên nghiệp. Rất hài lòng.' },
]

export default function HomePage() {
  const { h, m, s } = useCountdown(6443)
  const { data: flashProducts, loading: flashLoading } = useProducts({ flash_sale: true, limit: 4 })
  const { data: featuredProducts, loading: featuredLoading } = useProducts({ featured: true, limit: 4 })

  // Fallback mock nếu API chưa có data
  const MOCK_HERO_PRODUCT = {
    name: 'iPhone 16 Pro Max 256GB Titan Đen',
    brand: 'Apple',
    price: 29990000,
    oldPrice: 39990000,
    discount: 25,
    img: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-9inch-deserttitanium?wid=400&hei=400&fmt=jpeg',
  }

  return (
    <div>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden px-10 py-16"
        style={{ background: 'linear-gradient(135deg, #00205f 0%, #003087 55%, #1a4fa8 100%)' }}
      >
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")` }}
        />
        <div className="relative max-w-[1200px] mx-auto grid grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/12 text-white border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider mb-5">
              🔥 Ưu đãi mùa hè 2024
            </div>
            <h1 className="font-display text-[50px] font-bold text-white leading-tight mb-4">
              Kết nối mọi <span className="text-blue-300">giới hạn</span> — Công nghệ đỉnh cao
            </h1>
            <p className="text-base text-white/80 leading-relaxed mb-7">
              Mua sắm điện thoại, sim số đẹp, gói cước ưu đãi từ nhà mạng hàng đầu Việt Nam. Giao hàng trong 2 giờ tại nội thành.
            </p>
            <div className="flex gap-3 flex-wrap mb-9">
              <Link to="/products" className="px-7 py-3.5 bg-accent text-white rounded-full text-sm font-bold hover:bg-accent-dark hover:-translate-y-0.5 transition-all shadow-md">
                Mua ngay hôm nay
              </Link>
              <Link to="/flash-sale" className="px-7 py-3.5 bg-white/12 text-white border border-white/30 rounded-full text-sm font-semibold hover:bg-white/20 transition-all">
                ⚡ Xem Flash Sale
              </Link>
            </div>
            <div className="flex gap-8">
              {[['2M+','Khách hàng tin dùng'],['500K+','Đơn hàng thành công'],['99.9%','Hàng chính hãng']].map(([n,l]) => (
                <div key={l}>
                  <div className="text-[28px] font-bold text-white font-display">{n}</div>
                  <div className="text-xs text-white/60 mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero card */}
          <div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-[20px] p-7 text-white">
              <div className="w-full aspect-square rounded-[14px] bg-white/8 flex items-center justify-center mb-4 overflow-hidden">
                <img src={MOCK_HERO_PRODUCT.img} alt={MOCK_HERO_PRODUCT.name} className="w-4/5 h-4/5 object-contain"/>
              </div>
              <div className="text-[11px] text-white/60 font-semibold uppercase tracking-wider mb-1">{MOCK_HERO_PRODUCT.brand}</div>
              <div className="font-bold text-[17px] mb-3">{MOCK_HERO_PRODUCT.name}</div>
              <div className="flex items-center gap-2.5 mb-4">
                <span className="text-[28px] font-bold text-blue-300 font-display">{MOCK_HERO_PRODUCT.price.toLocaleString('vi-VN')}₫</span>
                <span className="text-sm text-white/50 line-through">{MOCK_HERO_PRODUCT.oldPrice.toLocaleString('vi-VN')}₫</span>
                <span className="bg-accent text-white text-xs font-bold px-2.5 py-1 rounded-full">-{MOCK_HERO_PRODUCT.discount}%</span>
              </div>
              <button className="w-full py-3 bg-accent text-white rounded-full font-bold text-sm hover:bg-accent-dark transition-colors">
                🛒 Thêm vào giỏ hàng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── TRUST BAND ───────────────────────────────────────────────── */}
      <TrustBand />

      {/* ── CATEGORIES ───────────────────────────────────────────────── */}
      <section className="bg-cream py-16 px-10">
        <div className="max-w-[1200px] mx-auto">
          <SectionHead label="Danh mục" title="Khám phá sản phẩm" sub="Từ sim số đẹp đến điện thoại cao cấp, tất cả đều có tại VNPT Shop"/>
          <div className="grid grid-cols-5 gap-4">
            {CATEGORIES.map(({ slug, icon, name, count }) => (
              <Link
                key={slug}
                to={`/products?category=${slug}`}
                className="bg-white rounded-xl p-6 text-center border border-shade hover:border-vnpt hover:-translate-y-0.5 hover:shadow-md transition-all duration-250"
              >
                <div className="w-14 h-14 bg-vnpt-light rounded-[14px] flex items-center justify-center mx-auto mb-3 text-[26px]">{icon}</div>
                <div className="text-sm font-semibold text-body mb-1">{name}</div>
                <div className="text-xs text-muted">{count}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FLASH SALE ───────────────────────────────────────────────── */}
      <section className="bg-vnpt-dark py-16 px-10">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-center justify-between mb-7">
            <div className="font-display text-[28px] font-bold text-white">
              ⚡ Flash Sale <span className="text-red-400">Hôm nay</span>
            </div>
            <CountdownTimer h={h} m={m} s={s} />
          </div>
          {flashLoading ? (
            <LoadingSpinner text="Đang tải sản phẩm..." />
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {(flashProducts.length > 0 ? flashProducts : []).map(p => (
                <ProductCard key={p.id} product={p} showProgress />
              ))}
              {flashProducts.length === 0 && (
                <div className="col-span-4 text-center text-white/60 py-12 text-sm">
                  Chưa có sản phẩm Flash Sale · <Link to="/products" className="text-blue-300 underline">Xem tất cả sản phẩm</Link>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── PROMO BANNERS ────────────────────────────────────────────── */}
      <div className="bg-cream px-10 py-10">
        <div className="max-w-[1200px] mx-auto grid grid-cols-2 gap-5">
          <div className="rounded-[20px] p-9 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #003087, #1a4fa8)' }}>
            <div className="text-[11px] font-bold uppercase tracking-[2px] opacity-75 mb-2.5">Sim số đẹp</div>
            <div className="font-display text-[28px] font-bold leading-snug mb-2.5">Sim phong thủy<br/>Giá từ 200.000₫</div>
            <div className="text-sm opacity-80 mb-6 leading-relaxed">Hàng ngàn đầu số đẹp, sim tứ quý, ngũ quý, thần tài</div>
            <Link to="/products?category=sim-so" className="inline-block px-5 py-2.5 bg-white text-vnpt rounded-full text-sm font-bold hover:shadow-md transition-all">
              Xem sim ngay →
            </Link>
          </div>
          <div className="rounded-[20px] p-9 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #9b0000, #E30613)' }}>
            <div className="text-[11px] font-bold uppercase tracking-[2px] opacity-75 mb-2.5">Ưu đãi cước</div>
            <div className="font-display text-[28px] font-bold leading-snug mb-2.5">5G không giới hạn<br/>Chỉ 99.000₫/tháng</div>
            <div className="text-sm opacity-80 mb-6 leading-relaxed">Tốc độ đến 1Gbps, vùng phủ sóng toàn quốc</div>
            <Link to="/products?category=goi-cuoc" className="inline-block px-5 py-2.5 bg-white text-accent rounded-full text-sm font-bold hover:shadow-md transition-all">
              Đăng ký ngay →
            </Link>
          </div>
        </div>
      </div>

      {/* ── SERVICES ─────────────────────────────────────────────────── */}
      <section className="py-16 px-10">
        <div className="max-w-[1200px] mx-auto">
          <SectionHead label="Dịch vụ VNPT" title="Giải pháp toàn diện" sub="Từ cá nhân đến doanh nghiệp — VNPT cung cấp đầy đủ dịch vụ viễn thông"/>
          <div className="grid grid-cols-3 gap-5">
            {SERVICES.map(({ icon, name, desc, price, sub }) => (
              <div key={name} className="bg-cream rounded-[20px] p-7 border border-shade hover:border-vnpt hover:bg-white hover:shadow-md transition-all duration-250 cursor-pointer group relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-vnpt scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"/>
                <div className="text-3xl mb-4">{icon}</div>
                <div className="text-[17px] font-bold text-body mb-2">{name}</div>
                <div className="text-sm text-muted leading-relaxed mb-4">{desc}</div>
                <div className="text-xl font-bold text-vnpt font-display">{price}</div>
                <div className="text-xs text-muted">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REVIEWS ──────────────────────────────────────────────────── */}
      <section className="bg-cream py-16 px-10">
        <div className="max-w-[1200px] mx-auto">
          <SectionHead label="Đánh giá khách hàng" title="Khách hàng nói gì?"/>
          <div className="grid grid-cols-3 gap-5">
            {REVIEWS.map(({ initials, name, date, rating, text }) => (
              <div key={name} className="bg-white rounded-xl p-6 border border-shade">
                <div className="text-sm mb-3">{'⭐'.repeat(rating)}</div>
                <p className="text-sm text-body leading-relaxed mb-4">"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-vnpt-light text-vnpt flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-body">{name}</div>
                    <div className="text-xs text-muted">{date}</div>
                    <div className="text-[11px] text-success font-semibold">✅ Đã mua hàng</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ───────────────────────────────────────────────── */}
      <div className="bg-vnpt-dark px-10 py-[72px] text-center">
        <h2 className="font-display text-[32px] font-bold text-white mb-2.5">Nhận ưu đãi sớm nhất</h2>
        <p className="text-white/70 mb-8 text-sm">Đăng ký email để nhận thông báo Flash Sale, mã giảm giá và tin tức công nghệ mới nhất</p>
        <div className="flex max-w-[500px] mx-auto bg-white rounded-full overflow-hidden p-1 pl-5">
          <input type="email" placeholder="Nhập địa chỉ email của bạn..." className="flex-1 border-none outline-none text-sm font-body text-body bg-transparent"/>
          <button className="px-6 py-2.5 bg-vnpt text-white rounded-full text-sm font-bold hover:bg-vnpt-dark transition-colors flex-shrink-0">
            Đăng ký ngay
          </button>
        </div>
      </div>
    </div>
  )
}
