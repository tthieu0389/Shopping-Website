import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useCountdown, useProducts, useFeaturedReviews } from '../hooks/index.js'
import { ProductCard, TrustBand, SectionHead, CountdownTimer, LoadingSpinner, FlashSaleCard } from '../components/common/index.jsx'
import { formatPrice, formatDate, getInitials, resolveImageUrl } from '../utils/index.js'
import api from '../api/axiosInstance.js'

const CATEGORIES = [
  { type: 'device',    icon: '📱', name: 'Điện thoại',     suffix: 'sản phẩm' },
  { type: 'sim',       icon: '📶', name: 'Sim số đẹp',     suffix: 'sim' },
  { type: 'internet',  icon: '🌐', name: 'Gói cước 4G/5G', suffix: 'gói cước' },
  { type: 'tv',        icon: '📺', name: 'Máy tính bảng',  suffix: 'sản phẩm' },
  { type: 'accessory', icon: '🎧', name: 'Phụ kiện',       suffix: 'phụ kiện' },
]

const SERVICES = [
  { icon: '🌐', name: 'Internet cáp quang',  desc: 'Kết nối tốc độ cao lên đến 1Gbps. Ổn định, không giật lag.',  price: '185.000₫/tháng', sub: 'Gói cơ bản 100Mbps' },
  { icon: '📺', name: 'MyTV — Truyền hình số',desc: '500+ kênh truyền hình trong nước và quốc tế. Xem lại 7 ngày.',price: '69.000₫/tháng',  sub: 'Gói cơ bản 150 kênh' },
  { icon: '☁️', name: 'VNPT Cloud',           desc: 'Lưu trữ và bảo mật dữ liệu doanh nghiệp trên cloud Việt Nam.',price: 'Miễn phí 3 tháng đầu', sub: 'Từ 200.000₫/tháng sau' },
]

// ── HeroSlider ────────────────────────────────────────────────────────────────
function HeroSlider() {
  const { data: allProducts, loading } = useProducts({ limit: 50, product_type: 'device' })
  const [current, setCurrent] = useState(0)
  const timerRef = useRef(null)
  const touchStartX = useRef(0)

  // Lấy top 5 sản phẩm điện thoại giá cao nhất
  const topProducts = [...allProducts]
    .sort((a, b) => (b.price || 0) - (a.price || 0))
    .slice(0, 5)

  const goTo = (idx) => {
    setCurrent(idx)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % Math.max(topProducts.length, 1))
    }, 4000)
  }

  useEffect(() => {
    if (topProducts.length === 0) return
    timerRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % topProducts.length)
    }, 4000)
    return () => clearInterval(timerRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topProducts.length])

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-[20px] p-7 flex items-center justify-center" style={{ minHeight: 420 }}>
        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (topProducts.length === 0) return null

  const p = topProducts[current]
  const img = resolveImageUrl(p.img || p.thumbnail || p.image_url || null)
  const salePrice = p.price
  const rawOld = p.oldPrice || p.original_price
  const originalPrice = rawOld && rawOld > salePrice
    ? rawOld
    : Math.round(salePrice * (1 + (0.15 + (((p.id || 1) * 7) % 26) / 100)))
  const discount = Math.round((1 - salePrice / originalPrice) * 100)

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-[20px] p-7 text-white select-none">
      {/* Ảnh + arrows nằm ngoài ảnh */}
      <div className="relative flex items-center gap-2 mb-4">
        {/* Prev */}
        <button
          onClick={() => goTo((current - 1 + topProducts.length) % topProducts.length)}
          className="flex-shrink-0 w-8 h-8 bg-white/15 hover:bg-white/30 text-white rounded-full flex items-center justify-center text-base font-bold transition-all duration-200"
        >‹</button>

        {/* Ảnh sản phẩm — swipe support */}
        <div
          className="relative flex-1 aspect-square rounded-[14px] bg-white/8 overflow-hidden"
          onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
          onTouchEnd={e => {
            const diff = touchStartX.current - e.changedTouches[0].clientX
            if (Math.abs(diff) > 40) {
              diff > 0 ? goTo((current + 1) % topProducts.length) : goTo((current - 1 + topProducts.length) % topProducts.length)
            }
          }}
        >
          {topProducts.map((prod, i) => {
            const pImg = resolveImageUrl(prod.img || prod.thumbnail || prod.image_url)
            return (
              <img
                key={prod.id}
                src={pImg || 'https://placehold.co/300x300?text=No+Image'}
                alt={prod.name}
                className="absolute inset-0 w-full h-full object-contain p-5 transition-all duration-500"
                style={{ opacity: i === current ? 1 : 0, transform: i === current ? 'scale(1)' : 'scale(0.95)' }}
                onError={e => { e.target.src = 'https://placehold.co/300x300?text=No+Image' }}
              />
            )
          })}
        </div>

        {/* Next */}
        <button
          onClick={() => goTo((current + 1) % topProducts.length)}
          className="flex-shrink-0 w-8 h-8 bg-white/15 hover:bg-white/30 text-white rounded-full flex items-center justify-center text-base font-bold transition-all duration-200"
        >›</button>
      </div>

      {/* Thông tin sản phẩm */}
      <div className="min-h-[90px]">
        <div className="text-[11px] text-white/60 font-semibold uppercase tracking-wider mb-1">{p.brand || 'VNPT Shop'}</div>
        <div className="font-bold text-[16px] leading-snug mb-3 line-clamp-2">{p.name}</div>
        <div className="flex items-center gap-2.5 mb-4">
          <span className="text-[26px] font-bold text-blue-300 font-display">{formatPrice(salePrice)}</span>
          {discount > 0 && (
            <>
              <span className="text-sm text-white/50 line-through">{formatPrice(originalPrice)}</span>
              <span className="bg-accent text-white text-xs font-bold px-2.5 py-1 rounded-full">-{discount}%</span>
            </>
          )}
        </div>
      </div>

      <Link
        to={`/products/${p.slug}`}
        className="block w-full py-3 bg-accent text-white rounded-full font-bold text-sm hover:bg-accent-dark transition-colors text-center mb-4"
      >
        🛒 Xem sản phẩm
      </Link>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-2">
        {topProducts.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? 'w-6 h-2 bg-white'
                : 'w-2 h-2 bg-white/30 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

// ── ReviewsSlider ─────────────────────────────────────────────────────────────
function ReviewsSlider() {
  const { data: reviews, loading } = useFeaturedReviews(9)
  const [page, setPage] = useState(0)
  const [perView, setPerView] = useState(3)
  const timerRef = useRef(null)
  const touchStartX = useRef(0)

  useEffect(() => {
    const updatePerView = () => setPerView(window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3)
    updatePerView()
    window.addEventListener('resize', updatePerView)
    return () => window.removeEventListener('resize', updatePerView)
  }, [])

  const pageCount = Math.max(1, Math.ceil(reviews.length / perView))

  useEffect(() => {
    if (page >= pageCount) setPage(0)
  }, [pageCount, page])

  const goTo = (idx) => {
    setPage((idx + pageCount) % pageCount)
    clearInterval(timerRef.current)
    if (pageCount > 1) {
      timerRef.current = setInterval(() => setPage(p => (p + 1) % pageCount), 5000)
    }
  }

  useEffect(() => {
    if (pageCount <= 1) return
    timerRef.current = setInterval(() => setPage(p => (p + 1) % pageCount), 5000)
    return () => clearInterval(timerRef.current)
  }, [pageCount])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <LoadingSpinner />
      </div>
    )
  }

  if (reviews.length === 0) return null

  const visible = reviews.slice(page * perView, page * perView + perView)

  return (
    <div
      className="relative"
      onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        const diff = touchStartX.current - e.changedTouches[0].clientX
        if (Math.abs(diff) > 40) diff > 0 ? goTo(page + 1) : goTo(page - 1)
      }}
    >
      <div className="flex items-center gap-4">
        {/* Prev */}
        {pageCount > 1 && (
          <button
            onClick={() => goTo(page - 1)}
            aria-label="Đánh giá trước"
            className="hidden md:flex flex-shrink-0 w-10 h-10 bg-white border border-shade hover:bg-vnpt-light hover:border-vnpt text-vnpt rounded-full items-center justify-center text-lg font-bold transition-colors"
          >‹</button>
        )}

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((r) => (
            <div key={r.id} className="bg-white rounded-xl p-6 border border-shade flex flex-col">
              <div className="text-sm mb-3 text-warning">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
              <p className="text-sm text-body leading-relaxed mb-4 flex-1">"{r.comment}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-vnpt-light text-vnpt flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {getInitials(r.user_name)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-body">{r.user_name}</div>
                  <div className="text-xs text-muted">{formatDate(r.created_at)}</div>
                  <div className="text-[11px] text-success font-semibold">✅ Đã mua hàng</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Next */}
        {pageCount > 1 && (
          <button
            onClick={() => goTo(page + 1)}
            aria-label="Đánh giá tiếp theo"
            className="hidden md:flex flex-shrink-0 w-10 h-10 bg-white border border-shade hover:bg-vnpt-light hover:border-vnpt text-vnpt rounded-full items-center justify-center text-lg font-bold transition-colors"
          >›</button>
        )}
      </div>

      {/* Dot indicators */}
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Trang đánh giá ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === page ? 'w-6 h-2 bg-vnpt' : 'w-2 h-2 bg-shade hover:bg-vnpt-light'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── PromoBanners ──────────────────────────────────────────────────────────────
function RollingBanner({ products, loading, label, linkTo, linkLabel, gradient, textColor }) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (products.length <= 1) return
    const t = setInterval(() => setIdx(i => (i + 1) % products.length), 3500)
    return () => clearInterval(t)
  }, [products.length])

  const p = products[idx] || null
  const disc = p?.promotionDiscount ?? null
  const price = p?.price ?? 0
  // Luôn có giá gốc: dùng promotion nếu có, không thì tạo giá gốc giả +18–28%
  const fakeMarkup = p ? (1.18 + ((p.id || 1) * 3 % 10) / 100) : 1.2
  const originalPrice = disc
    ? Math.round(price / (1 - disc / 100))
    : Math.round(price * fakeMarkup)
  const displayDisc = disc ?? Math.round((1 - price / originalPrice) * 100)

  return (
    <div className="rounded-[20px] p-9 text-white flex flex-col justify-between min-h-[260px]" style={{ background: gradient }}>
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[2px] opacity-75 mb-3">{label}</div>
        {loading ? (
          <div className="text-white/50 text-sm">Đang tải...</div>
        ) : !p ? (
          <div className="font-display text-[28px] font-bold leading-snug opacity-60">Chưa có dữ liệu</div>
        ) : (
          <div key={p.id}>
            {/* Tên sản phẩm */}
            <div className="font-display text-[26px] font-bold leading-snug line-clamp-2 mb-4">{p.name}</div>

            {/* Luôn hiển thị dạng sale: giá gốc gạch ngang + badge % + giá sale */}
            <>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-display text-[15px] font-normal line-through opacity-55">
                  {formatPrice(originalPrice)}
                </span>
                <span className="text-[11px] font-bold bg-white text-red-600 px-2.5 py-0.5 rounded-full leading-5">
                  -{displayDisc}%
                </span>
              </div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="font-display text-[32px] font-bold leading-none">{formatPrice(price)}</span>
                <span className="text-sm font-normal opacity-70">/tháng</span>
              </div>
            </>

            {/* Dot indicators */}
            {products.length > 1 && (
              <div className="flex gap-1.5">
                {products.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIdx(i)}
                    className={`rounded-full transition-all duration-300 ${i === idx ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/35 hover:bg-white/60'}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="mt-6">
        <Link to={linkTo} className={`inline-block px-5 py-2.5 bg-white rounded-full text-sm font-bold hover:shadow-md transition-all ${textColor}`}>
          {linkLabel}
        </Link>
      </div>
    </div>
  )
}

function PromoBanners({ simProducts, simLoading, internetProducts, internetLoading, promotionMap }) {
  // Gắn discount vào từng sản phẩm để RollingBanner dùng
  const simWithDisc = simProducts.map(p => ({ ...p, promotionDiscount: promotionMap[p.id] ?? null }))
  const netWithDisc = internetProducts.map(p => ({ ...p, promotionDiscount: promotionMap[p.id] ?? null }))

  return (
    <div className="bg-cream px-10 py-10">
      <div className="max-w-[1200px] mx-auto grid grid-cols-2 gap-5 items-stretch">
        <RollingBanner
          products={simWithDisc}
          loading={simLoading}
          label="Sim số đẹp"
          linkTo="/products?product_type=sim"
          linkLabel="Xem sim ngay →"
          gradient="linear-gradient(135deg, #003087, #1a4fa8)"
          textColor="text-vnpt!"
        />
        <RollingBanner
          products={netWithDisc}
          loading={internetLoading}
          label="Ưu đãi cước"
          linkTo="/products?product_type=internet"
          linkLabel="Đăng ký ngay →"
          gradient="linear-gradient(135deg, #9b0000, #E30613)"
          textColor="text-accent!"
        />
      </div>
    </div>
  )
}

// ── NewsletterSection ─────────────────────────────────────────────────────────
function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errMsg, setErrMsg] = useState('')

  const handleSubmit = async () => {
    const trimmed = email.trim()
    if (!trimmed) { setErrMsg('Vui lòng nhập email.'); setStatus('error'); return }
    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailReg.test(trimmed)) { setErrMsg('Email không hợp lệ.'); setStatus('error'); return }

    setStatus('loading')
    setErrMsg('')
    try {
      await api.post('/contacts', {
        name: 'Newsletter',
        email: trimmed,
        message: 'Đăng ký nhận ưu đãi qua email.',
      })
      setStatus('success')
      setEmail('')
    } catch {
      setErrMsg('Có lỗi xảy ra, vui lòng thử lại.')
      setStatus('error')
    }
  }

  const handleKey = (e) => { if (e.key === 'Enter') handleSubmit() }

  return (
    <div className="bg-vnpt-dark px-10 py-[72px] text-center">
      <h2 className="font-display text-[32px] font-bold text-white mb-2.5">Nhận ưu đãi sớm nhất</h2>
      <p className="text-white/70 mb-8 text-sm">Đăng ký email để nhận thông báo Flash Sale, tin tức công nghệ mới nhất</p>

      <div className="flex max-w-[500px] mx-auto bg-white rounded-full overflow-hidden p-1 pl-5">
        <input
          type="email"
          placeholder="Nhập địa chỉ email của bạn..."
          className="flex-1 border-none outline-none text-sm font-body text-body bg-transparent"
          value={email}
          onChange={e => { setEmail(e.target.value); setStatus('idle') }}
          onKeyDown={handleKey}
          disabled={status === 'loading'}
        />
        <button
          onClick={handleSubmit}
          disabled={status === 'loading'}
          className="px-6 py-2.5 bg-vnpt text-white rounded-full text-sm font-bold hover:bg-vnpt-dark transition-colors flex-shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? 'Đang gửi...' : 'Đăng ký ngay'}
        </button>
      </div>
      {status === 'success' && (
        <p className="text-success text-sm font-semibold mt-3">✅ Đăng ký thành công! Chúng tôi sẽ gửi ưu đãi đến email của bạn.</p>
      )}
      {status === 'error' && (
        <p className="text-red-300 text-xs mt-3">{errMsg}</p>
      )}
    </div>
  )
}

export default function HomePage() {
  const { h, m, s } = useCountdown(6443)
  const { data: flashProducts, loading: flashLoading } = useProducts({ limit: 8 })
  const { data: simProducts, loading: simLoading } = useProducts({ product_type: 'sim', limit: 50 })
  const { data: internetProducts, loading: internetLoading } = useProducts({ product_type: 'internet', limit: 50 })
  const [promotionMap, setPromotionMap] = useState({})
  const [categoryCounts, setCategoryCounts] = useState({})

  useEffect(() => {
    api.get('/product-promotions')
      .then(res => {
        const list = Array.isArray(res) ? res : (res.data || [])
        const map = {}
        list.forEach(p => { map[p.product_id] = p.discount_value })
        setPromotionMap(map)
      })
      .catch(() => {})
  }, [])

  // Fetch số lượng thực tế cho từng danh mục
  useEffect(() => {
    Promise.all(
      CATEGORIES.map(({ type }) =>
        api.get('/products', { params: { product_type: type, limit: 1 } })
          .then(res => ({ type, total: res.total ?? 0 }))
          .catch(() => ({ type, total: 0 }))
      )
    ).then(results => {
      const map = {}
      results.forEach(({ type, total }) => { map[type] = total })
      setCategoryCounts(map)
    })
  }, [])

  return (
    <div>
      {/* HERO */}
      <div
        className="relative overflow-hidden px-10 py-16"
        style={{ background: 'linear-gradient(135deg, #00205f 0%, #003087 55%, #1a4fa8 100%)' }}
      >
        <div className="relative max-w-[1200px] mx-auto grid grid-cols-2 gap-16 items-center">
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
              <Link to="/products?product_type=device" className="px-7 py-3.5 rounded-full text-sm font-bold hover:-translate-y-0.5 transition-all shadow-md" style={{ backgroundColor: '#E30613', color: '#ffffff' }}>
                Mua ngay hôm nay
              </Link>
              <Link to="/flash-sale" className="px-7 py-3.5 rounded-full text-sm font-semibold transition-all" style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)' }}>
                ⚡ Xem Flash Sale
              </Link>
            </div>
            <div className="flex gap-8">
              {[['2M+','Khách hàng tin dùng'],['500K+','Đơn hàng thành công'],['100%','Hàng chính hãng']].map(([n,l]) => (
                <div key={l}>
                  <div className="text-[28px] font-bold text-white font-display">{n}</div>
                  <div className="text-xs text-white/60 mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <HeroSlider />
          </div>
        </div>
      </div>

      {/* TRUST BAND */}
      <TrustBand />

      {/* CATEGORIES */}
      <section className="bg-cream py-16 px-10">
        <div className="max-w-[1200px] mx-auto">
          <SectionHead label="Danh mục" title="Khám phá sản phẩm" sub="Từ sim số đẹp đến điện thoại cao cấp, tất cả đều có tại VNPT Shop" />
          <div className="grid grid-cols-5 gap-4">
            {CATEGORIES.map(({ type, icon, name, suffix }) => {
              const count = categoryCounts[type]
              return (
                <Link
                  key={type}
                  to={`/products?product_type=${type}`}
                  className="bg-white rounded-xl p-6 text-center border border-shade hover:border-vnpt hover:-translate-y-0.5 hover:shadow-md transition-all duration-250"
                >
                  <div className="w-14 h-14 bg-vnpt-light rounded-[14px] flex items-center justify-center mx-auto mb-3 text-[26px]">{icon}</div>
                  <div className="text-sm font-semibold text-body mb-1">{name}</div>
                  <div className="text-xs text-muted">
                    {count === undefined ? '...' : `${count} ${suffix}`}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* FLASH SALE */}
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
              {flashProducts.slice(0, 4).map(p => (
                <FlashSaleCard key={p.id} product={p} />
              ))}
              {flashProducts.length === 0 && (
                <div className="col-span-4 text-center text-white/60 py-12 text-sm">
                  Chưa có sản phẩm Flash Sale ·{' '}
                  <Link to="/products" className="text-blue-300 underline">Xem tất cả sản phẩm</Link>
                </div>
              )}
            </div>
          )}
          {flashProducts.length > 0 && (
            <div className="text-center mt-8">
              <Link to="/flash-sale" className="inline-block px-8 py-3 border-2 border-white/60 text-white! rounded-full font-semibold hover:bg-white/10 hover:border-white transition-all">
                Xem tất cả Flash Sale →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* PROMO BANNERS */}
      <PromoBanners simProducts={simProducts} simLoading={simLoading} internetProducts={internetProducts} internetLoading={internetLoading} promotionMap={promotionMap} />

      {/* SERVICES */}
      <section className="py-16 px-10">
        <div className="max-w-[1200px] mx-auto">
          <SectionHead label="Dịch vụ VNPT" title="Giải pháp toàn diện" sub="Từ cá nhân đến doanh nghiệp — VNPT cung cấp đầy đủ dịch vụ viễn thông" />
          <div className="grid grid-cols-3 gap-5">
            {SERVICES.map(({ icon, name, desc, price, sub }) => (
              <div key={name} className="bg-cream rounded-[20px] p-7 border border-shade hover:border-vnpt hover:bg-white hover:shadow-md transition-all duration-250 cursor-pointer group relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-vnpt scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
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

      {/* REVIEWS */}
      <section className="bg-cream py-16 px-10">
        <div className="max-w-[1200px] mx-auto">
          <SectionHead label="Đánh giá khách hàng" title="Khách hàng nói gì?" />
          <ReviewsSlider />
        </div>
      </section>

      {/* NEWSLETTER */}
      <NewsletterSection />
    </div>
  )
}