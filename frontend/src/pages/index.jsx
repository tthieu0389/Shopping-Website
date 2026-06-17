// ── Page stubs — mỗi page sẽ được phát triển đầy đủ sau ──────────────────────
// Hiện tại mỗi page hiển thị layout đúng, sẵn sàng để code feature

import { Link, useSearchParams, useParams } from 'react-router-dom'
import { Breadcrumb, LoadingSpinner, EmptyState, SectionHead, ProductCard, CountdownTimer } from '@/components/common'
import { useProducts, useProduct, useCountdown, useSearch } from '@/hooks'
import useCartStore from '@/store/cartStore'
import useAuthStore from '@/store/authStore'
import { formatPrice, toast } from '@/utils'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { authApi, contactApi } from '@/api'

// ── PRODUCTS PAGE ─────────────────────────────────────────────────────────────
export function ProductsPage() {
  const [searchParams] = useSearchParams()
  const category = searchParams.get('category') || ''
  const [filters, setFilters] = useState({ category, page: 1, limit: 12 })
  const [sort, setSort] = useState('featured')

  const { data: products, total, loading } = useProducts({ ...filters, sort })

  return (
    <div>
      <Breadcrumb items={[{ to: '/', label: 'Trang chủ' }, { label: 'Sản phẩm' }]} />
      <div className="max-w-[1200px] mx-auto px-10 py-8 grid grid-cols-[260px_1fr] gap-7">
        {/* Sidebar filters */}
        <aside className="sticky top-20 self-start">
          <FilterSidebar filters={filters} onChange={setFilters} />
        </aside>
        {/* Product grid */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-muted">Hiển thị <strong className="text-body">{products.length}</strong> / <strong className="text-body">{total}</strong> sản phẩm</p>
            <select value={sort} onChange={e => setSort(e.target.value)} className="px-3 py-2 border border-shade rounded-lg text-sm font-body outline-none">
              <option value="featured">Nổi bật nhất</option>
              <option value="price_asc">Giá thấp đến cao</option>
              <option value="price_desc">Giá cao đến thấp</option>
              <option value="newest">Mới nhất</option>
              <option value="best_seller">Bán chạy nhất</option>
            </select>
          </div>
          {loading ? <LoadingSpinner /> : (
            products.length === 0
              ? <EmptyState icon="🔍" title="Không tìm thấy sản phẩm" desc="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm" action={<Link to="/products" className="px-6 py-2.5 bg-vnpt text-white rounded-full text-sm font-bold">Xem tất cả</Link>} />
              : <div className="grid grid-cols-3 gap-4">{products.map(p => <ProductCard key={p.id} product={p}/>)}</div>
          )}
        </div>
      </div>
    </div>
  )
}

function FilterSidebar({ filters, onChange }) {
  const categories = [
    { slug: 'dien-thoai', label: 'Điện thoại', count: 248 },
    { slug: 'may-tinh-bang', label: 'Máy tính bảng', count: 86 },
    { slug: 'sim-so', label: 'Sim số đẹp', count: '5.2k' },
    { slug: 'tai-nghe', label: 'Tai nghe', count: 120 },
    { slug: 'dong-ho', label: 'Đồng hồ thông minh', count: 45 },
    { slug: 'phu-kien', label: 'Phụ kiện', count: 340 },
  ]
  const brands = ['Apple','Samsung','Xiaomi','OPPO','Vivo','Realme']
  const Box = ({ title, children }) => (
    <div className="bg-white border border-shade rounded-xl p-5 mb-4">
      <div className="text-sm font-bold text-body mb-4 pb-3 border-b border-shade">{title}</div>
      {children}
    </div>
  )
  const Item = ({ id, label, count, checked, onChange: onC }) => (
    <label className="flex items-center gap-2.5 py-1.5 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onC} className="accent-vnpt w-4 h-4"/>
      <span className="text-sm text-body flex-1">{label}</span>
      {count && <span className="text-xs text-muted bg-surface px-2 py-0.5 rounded-full">{count}</span>}
    </label>
  )
  return (
    <>
      <Box title="Danh mục">
        {categories.map(c => <Item key={c.slug} label={c.label} count={c.count} checked={filters.category === c.slug} onChange={() => onChange(f => ({ ...f, category: f.category === c.slug ? '' : c.slug }))}/>)}
      </Box>
      <Box title="Thương hiệu">
        {brands.map(b => <Item key={b} label={b} checked={filters.brand === b} onChange={() => onChange(f => ({ ...f, brand: f.brand === b ? '' : b }))}/>)}
      </Box>
      <Box title="Khoảng giá">
        <div className="grid grid-cols-2 gap-2 mt-1">
          <input type="text" placeholder="Từ (₫)" className="px-3 py-2 border border-shade rounded-lg text-sm font-body outline-none focus:border-vnpt"/>
          <input type="text" placeholder="Đến (₫)" className="px-3 py-2 border border-shade rounded-lg text-sm font-body outline-none focus:border-vnpt"/>
        </div>
        <button onClick={() => onChange(f => ({...f}))} className="w-full mt-3 py-2.5 bg-vnpt text-white rounded-full text-sm font-semibold hover:bg-vnpt-dark transition-colors">
          Áp dụng
        </button>
      </Box>
    </>
  )
}

// ── PRODUCT DETAIL PAGE ───────────────────────────────────────────────────────
export function ProductDetailPage() {
  const { slug } = useParams()
  const { data: product, loading } = useProduct(slug)
  const addItem = useCartStore(s => s.addItem)
  const [qty, setQty] = useState(1)
  const [activeTab, setActiveTab] = useState('desc')

  if (loading) return <LoadingSpinner />
  if (!product) return <EmptyState icon="😢" title="Không tìm thấy sản phẩm" action={<Link to="/products" className="px-6 py-2.5 bg-vnpt text-white rounded-full text-sm font-bold">Quay lại</Link>}/>

  const handleAdd = () => { addItem(product, qty); toast.success(`Đã thêm ${product.name} vào giỏ!`) }

  return (
    <div>
      <Breadcrumb items={[{to:'/',label:'Trang chủ'},{to:'/products',label:'Sản phẩm'},{label:product.name}]}/>
      <div className="max-w-[1200px] mx-auto px-10 py-8 grid grid-cols-2 gap-14 items-start">
        {/* Gallery */}
        <div className="sticky top-20">
          <div className="aspect-square rounded-[20px] bg-cream border border-shade flex items-center justify-center overflow-hidden mb-4">
            <img src={product.img || product.thumbnail} alt={product.name} className="w-3/4 h-3/4 object-contain"/>
          </div>
        </div>
        {/* Info */}
        <div>
          <div className="text-xs text-vnpt font-bold uppercase tracking-wider mb-2">{product.brand} · Chính hãng VN/A</div>
          <h1 className="font-display text-2xl font-bold text-body leading-snug mb-4">{product.name}</h1>
          <div className="flex items-baseline gap-3 flex-wrap mb-6">
            <span className="text-4xl font-bold text-accent font-display">{formatPrice(product.price)}</span>
            {product.oldPrice && <span className="text-base text-muted line-through">{formatPrice(product.oldPrice)}</span>}
            {product.discount > 0 && <span className="bg-red-50 text-accent text-sm font-bold px-3 py-1 rounded-full">-{product.discount}%</span>}
          </div>
          {/* Policies */}
          <div className="grid grid-cols-2 gap-2.5 mb-6">
            {[['🚚','Giao hàng 2H','Miễn phí nội thành'],['🛡️','Bảo hành 12 tháng','Chính hãng'],['🔄','Đổi trả 7 ngày','Không cần lý do'],['💳','Trả góp 0%','Đến 24 tháng']].map(([icon,t,s]) => (
              <div key={t} className="flex items-center gap-2.5 p-3 bg-cream rounded-lg">
                <span className="text-lg">{icon}</span>
                <div><div className="text-xs font-bold text-body">{t}</div><div className="text-[11px] text-muted">{s}</div></div>
              </div>
            ))}
          </div>
          {/* Qty */}
          <div className="flex items-center gap-4 mb-4">
            <span className="text-sm font-semibold text-body">Số lượng:</span>
            <div className="flex items-center border border-shade rounded-lg overflow-hidden">
              <button onClick={() => setQty(q => Math.max(1,q-1))} className="w-9 h-9 bg-cream text-lg hover:bg-vnpt-light transition-colors">−</button>
              <span className="w-12 text-center text-sm font-bold border-x border-shade h-9 flex items-center justify-center">{qty}</span>
              <button onClick={() => setQty(q => q+1)} className="w-9 h-9 bg-cream text-lg hover:bg-vnpt-light transition-colors">+</button>
            </div>
            <span className="text-sm text-success">✓ Còn hàng</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleAdd} className="py-4 bg-vnpt text-white rounded-full font-bold text-base hover:bg-vnpt-dark transition-all">🛒 Thêm vào giỏ</button>
            <Link to="/checkout" className="py-4 bg-accent text-white rounded-full font-bold text-base hover:bg-accent-dark transition-all text-center">⚡ Mua ngay</Link>
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div className="max-w-[1200px] mx-auto px-10 pb-16">
        <div className="flex border-b border-shade mb-7">
          {[['desc','Mô tả'],['specs','Thông số kỹ thuật'],['reviews','Đánh giá']].map(([id,label]) => (
            <button key={id} onClick={() => setActiveTab(id)} className={`px-5 py-3.5 text-sm font-semibold border-b-2 -mb-px transition-all ${activeTab===id?'border-vnpt text-vnpt':'border-transparent text-muted hover:text-body'}`}>{label}</button>
          ))}
        </div>
        {activeTab === 'desc' && <div className="text-sm text-muted leading-relaxed">{product.description || 'Chưa có mô tả sản phẩm.'}</div>}
        {activeTab === 'specs' && <div className="text-sm text-muted">Thông số kỹ thuật sẽ hiển thị ở đây.</div>}
        {activeTab === 'reviews' && <div className="text-sm text-muted">Đánh giá khách hàng sẽ hiển thị ở đây.</div>}
      </div>
    </div>
  )
}

// ── FLASH SALE PAGE ───────────────────────────────────────────────────────────
export function FlashSalePage() {
  const { h, m, s } = useCountdown(6443)
  const { data: products, loading } = useProducts({ flash_sale: true })
  return (
    <div>
      <div className="text-white text-center py-12 px-10" style={{background:'linear-gradient(135deg,#7b0000,#E30613)'}}>
        <div className="text-xs font-bold uppercase tracking-[2px] text-white/70 mb-2">⚡ Flash Sale đặc biệt</div>
        <h1 className="font-display text-5xl font-bold mb-3">🔥 FLASH SALE HÔM NAY</h1>
        <p className="text-white/80 mb-6">Giảm đến <strong>50%</strong> cho hàng trăm sản phẩm công nghệ chính hãng</p>
        <div className="flex justify-center"><CountdownTimer h={h} m={m} s={s}/></div>
      </div>
      <div className="max-w-[1200px] mx-auto px-10 py-10">
        {loading ? <LoadingSpinner/> : (
          <div className="grid grid-cols-4 gap-4">
            {products.map(p => <ProductCard key={p.id} product={p} showProgress/>)}
            {products.length === 0 && <div className="col-span-4 text-center text-muted py-16">Chưa có sản phẩm Flash Sale</div>}
          </div>
        )}
      </div>
    </div>
  )
}

// ── LOGIN PAGE ────────────────────────────────────────────────────────────────
export function LoginPage() {
  const { login, isLoading, error } = useAuthStore()
  const { register, handleSubmit } = useForm()
  const [nav] = [window.location]

  const onSubmit = async (data) => {
    const res = await login(data)
    if (res.success) { toast.success('Đăng nhập thành công!'); window.location.href = '/' }
  }

  return (
    <div className="min-h-screen grid grid-cols-2">
      <div className="flex flex-col items-center justify-center p-16" style={{background:'linear-gradient(135deg,#00205f,#003087,#1a4fa8)'}}>
        <div className="text-center text-white max-w-xs">
          <div className="text-4xl mb-6">🏪</div>
          <div className="font-display text-3xl font-bold mb-4">Chào mừng trở lại<br/><span className="text-blue-300">VNPT Shop!</span></div>
          <p className="text-white/75 text-sm leading-relaxed">Đăng nhập để theo dõi đơn hàng, quản lý tài khoản và nhận ưu đãi độc quyền.</p>
          <div className="mt-8 flex flex-col gap-3 text-left">
            {['🎁 Voucher 200.000₫ khi đăng ký','📦 Theo dõi đơn hàng realtime','⭐ Tích điểm đổi quà mỗi đơn'].map(t => (
              <div key={t} className="flex items-center gap-2 text-sm text-white/85">{t}</div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-16 bg-white">
        <div className="w-full max-w-sm">
          <h2 className="font-display text-3xl font-bold text-body mb-1">Đăng nhập</h2>
          <p className="text-sm text-muted mb-8">Chưa có tài khoản? <Link to="/register" className="text-vnpt font-bold">Đăng ký miễn phí →</Link></p>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-accent font-medium">{error}</div>}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-semibold text-body block mb-1.5">Email hoặc số điện thoại</label>
              <input {...register('email', {required:true})} type="text" placeholder="example@email.com" className="w-full px-4 py-3 border border-shade rounded-lg text-sm font-body outline-none focus:border-vnpt transition-colors"/>
            </div>
            <div>
              <label className="text-sm font-semibold text-body block mb-1.5">Mật khẩu</label>
              <input {...register('password', {required:true})} type="password" placeholder="Nhập mật khẩu" className="w-full px-4 py-3 border border-shade rounded-lg text-sm font-body outline-none focus:border-vnpt transition-colors"/>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" className="accent-vnpt"/> Ghi nhớ</label>
              <a href="#" className="text-sm text-vnpt font-semibold">Quên mật khẩu?</a>
            </div>
            <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-vnpt text-white rounded-full font-bold text-base hover:bg-vnpt-dark transition-all disabled:opacity-60">
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
          <div className="flex items-center gap-3 my-5"><div className="flex-1 h-px bg-shade"/><span className="text-xs text-muted">hoặc đăng nhập với</span><div className="flex-1 h-px bg-shade"/></div>
          <div className="grid grid-cols-2 gap-2.5">
            {['🔵 Google','📘 Facebook'].map(s => (
              <button key={s} className="py-2.5 border border-shade rounded-lg text-sm font-semibold text-body hover:border-vnpt hover:bg-vnpt-light transition-all">{s}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── REGISTER PAGE ─────────────────────────────────────────────────────────────
export function RegisterPage() {
  const { register: registerUser, isLoading, error } = useAuthStore()
  const { register, handleSubmit } = useForm()

  const onSubmit = async (data) => {
    const res = await registerUser(data)
    if (res.success) { toast.success('Đăng ký thành công! 🎉'); window.location.href = '/' }
  }

  return (
    <div className="min-h-screen grid grid-cols-2">
      <div className="flex flex-col items-center justify-center p-16" style={{background:'linear-gradient(135deg,#7b0000,#E30613)'}}>
        <div className="text-center text-white max-w-xs">
          <div className="font-display text-3xl font-bold mb-4">Tham gia ngay<br/>VNPT Shop!</div>
          <div className="bg-white/12 border border-white/20 rounded-2xl p-6 mt-8 text-left">
            <div className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2">🎁 Quà chào mừng</div>
            <div className="text-4xl font-bold font-display">200.000₫</div>
            <div className="text-sm opacity-75 mt-1">Cho đơn hàng đầu tiên từ 500.000₫</div>
            <div className="mt-3 bg-white/15 rounded-lg px-4 py-2 text-sm font-bold tracking-[2px]">VNPTNEW200</div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-16 bg-white overflow-y-auto">
        <div className="w-full max-w-sm">
          <h2 className="font-display text-3xl font-bold text-body mb-1">Tạo tài khoản</h2>
          <p className="text-sm text-muted mb-8">Đã có tài khoản? <Link to="/login" className="text-vnpt font-bold">Đăng nhập →</Link></p>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-accent">{error}</div>}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-semibold block mb-1.5">Họ</label><input {...register('first_name')} className="w-full px-4 py-3 border border-shade rounded-lg text-sm font-body outline-none focus:border-vnpt" placeholder="Nguyễn"/></div>
              <div><label className="text-sm font-semibold block mb-1.5">Tên</label><input {...register('last_name')} className="w-full px-4 py-3 border border-shade rounded-lg text-sm font-body outline-none focus:border-vnpt" placeholder="Văn A"/></div>
            </div>
            <div><label className="text-sm font-semibold block mb-1.5">Số điện thoại *</label><input {...register('phone',{required:true})} type="tel" placeholder="0901 234 567" className="w-full px-4 py-3 border border-shade rounded-lg text-sm font-body outline-none focus:border-vnpt"/></div>
            <div><label className="text-sm font-semibold block mb-1.5">Email *</label><input {...register('email',{required:true})} type="email" placeholder="example@email.com" className="w-full px-4 py-3 border border-shade rounded-lg text-sm font-body outline-none focus:border-vnpt"/></div>
            <div><label className="text-sm font-semibold block mb-1.5">Mật khẩu *</label><input {...register('password',{required:true,minLength:8})} type="password" placeholder="Tối thiểu 8 ký tự" className="w-full px-4 py-3 border border-shade rounded-lg text-sm font-body outline-none focus:border-vnpt"/></div>
            <label className="flex items-start gap-2.5 text-xs text-muted cursor-pointer">
              <input type="checkbox" required className="accent-vnpt mt-0.5 flex-shrink-0"/>
              <span>Tôi đồng ý với <a href="#" className="text-vnpt font-semibold">Điều khoản</a> và <a href="#" className="text-vnpt font-semibold">Chính sách bảo mật</a></span>
            </label>
            <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-accent text-white rounded-full font-bold text-base hover:bg-accent-dark transition-all disabled:opacity-60">
              {isLoading ? 'Đang đăng ký...' : '🎁 Đăng ký & nhận voucher'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ── CART PAGE ─────────────────────────────────────────────────────────────────
export function CartPage() {
  const { items, updateQty, removeItem, subtotal, discount, total, coupon, applyCoupon, removeCoupon } = useCartStore()
  const [couponInput, setCouponInput] = useState('')

  const handleCoupon = async () => {
    // TODO: call promotionsApi.validate(couponInput)
    toast.info('Tính năng mã giảm giá đang phát triển')
  }

  if (items.length === 0) return (
    <div className="max-w-[1200px] mx-auto px-10 py-20">
      <EmptyState icon="🛒" title="Giỏ hàng trống" desc="Hãy thêm sản phẩm vào giỏ hàng để tiếp tục"
        action={<Link to="/products" className="px-7 py-3 bg-vnpt text-white rounded-full font-bold text-sm">Mua sắm ngay</Link>}/>
    </div>
  )

  return (
    <div>
      <Breadcrumb items={[{to:'/',label:'Trang chủ'},{label:'Giỏ hàng'}]}/>
      <div className="max-w-[1200px] mx-auto px-10 py-8">
        <h1 className="font-display text-3xl font-bold text-body mb-6">Giỏ hàng <span className="text-lg text-muted font-normal">({items.reduce((s,i)=>s+i.qty,0)} sản phẩm)</span></h1>
        <div className="grid grid-cols-[1fr_360px] gap-7 items-start">
          <div className="bg-white border border-shade rounded-xl overflow-hidden">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_40px] px-5 py-3.5 bg-cream text-xs font-bold text-muted uppercase tracking-wider border-b border-shade">
              <span>Sản phẩm</span><span>Đơn giá</span><span>Số lượng</span><span>Thành tiền</span><span/>
            </div>
            {items.map(item => (
              <div key={item.key} className="grid grid-cols-[2fr_1fr_1fr_1fr_40px] px-5 py-4 border-b border-shade last:border-none items-center">
                <div className="flex items-center gap-3.5">
                  <div className="w-[70px] h-[70px] rounded-lg bg-cream border border-shade flex items-center justify-center flex-shrink-0">
                    <img src={item.img} alt={item.name} className="w-[80%] h-[80%] object-contain"/>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-body">{item.name}</div>
                    {item.variant && <div className="text-xs text-muted">{item.variant}</div>}
                  </div>
                </div>
                <div className="text-sm font-semibold">{formatPrice(item.price)}</div>
                <div className="flex items-center border border-shade rounded-lg overflow-hidden w-fit">
                  <button onClick={() => updateQty(item.key, item.qty-1)} className="w-8 h-8 bg-cream text-base hover:bg-vnpt-light transition-colors">−</button>
                  <span className="w-10 text-center text-sm font-bold border-x border-shade h-8 flex items-center justify-center">{item.qty}</span>
                  <button onClick={() => updateQty(item.key, item.qty+1)} className="w-8 h-8 bg-cream text-base hover:bg-vnpt-light transition-colors">+</button>
                </div>
                <div className="text-base font-bold text-accent">{formatPrice(item.price * item.qty)}</div>
                <button onClick={() => removeItem(item.key)} className="w-8 h-8 rounded-lg hover:bg-red-50 hover:text-accent transition-all text-muted text-lg flex items-center justify-center">🗑</button>
              </div>
            ))}
            <div className="flex justify-between items-center px-5 py-4 bg-cream">
              <Link to="/products" className="text-sm text-vnpt font-semibold">← Tiếp tục mua hàng</Link>
            </div>
          </div>
          {/* Summary */}
          <div className="bg-white border border-shade rounded-xl p-6 sticky top-20">
            <div className="text-base font-bold text-body mb-5 pb-4 border-b border-shade">Tóm tắt đơn hàng</div>
            {discount > 0 && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-success font-semibold">🎉 Tiết kiệm {formatPrice(discount)} hôm nay!</div>}
            <div className="space-y-3 text-sm mb-4">
              <div className="flex justify-between"><span className="text-muted">Tạm tính</span><span className="font-semibold">{formatPrice(subtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between"><span className="text-muted">Giảm giá</span><span className="font-semibold text-success">-{formatPrice(discount)}</span></div>}
              <div className="flex justify-between"><span className="text-muted">Vận chuyển</span><span className="font-semibold text-success">Miễn phí</span></div>
            </div>
            <div className="flex gap-2 mb-4">
              <input value={couponInput} onChange={e=>setCouponInput(e.target.value)} type="text" placeholder="Mã giảm giá..." className="flex-1 px-3 py-2 border border-shade rounded-lg text-sm font-body outline-none focus:border-vnpt"/>
              <button onClick={handleCoupon} className="px-4 py-2 bg-vnpt text-white rounded-lg text-sm font-semibold whitespace-nowrap">Áp dụng</button>
            </div>
            <div className="flex justify-between items-center pt-4 border-t-2 border-shade mb-5">
              <span className="text-base font-bold text-body">Tổng cộng</span>
              <span className="text-2xl font-bold text-accent font-display">{formatPrice(total)}</span>
            </div>
            <Link to="/checkout" className="block w-full py-4 bg-accent text-white rounded-full font-bold text-base text-center hover:bg-accent-dark transition-colors">⚡ Thanh toán ngay</Link>
            <div className="flex justify-center gap-2 mt-4">
              {['MOMO','VNPAY','VISA','COD'].map(p=><span key={p} className="bg-cream border border-shade rounded px-2 py-1 text-[11px] text-muted font-semibold">{p}</span>)}
            </div>
            <p className="text-center text-xs text-muted mt-3">🔒 Thanh toán SSL 256-bit an toàn</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── CHECKOUT PAGE ─────────────────────────────────────────────────────────────
export function CheckoutPage() {
  const { items, total, clearCart } = useCartStore()
  const { register, handleSubmit } = useForm()
  const [step, setStep] = useState(1)

  const onSubmit = async (data) => {
    // TODO: call ordersApi.create(data)
    toast.success('Đặt hàng thành công! 🎉')
    clearCart()
    window.location.href = '/checkout/success'
  }

  return (
    <div>
      <nav className="bg-white border-b border-shade px-10 h-16 flex items-center justify-between sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-xl text-vnpt">
          <div className="w-9 h-9 bg-vnpt rounded-lg flex items-center justify-center"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/VNPT_Logo.svg/512px-VNPT_Logo.svg.png" alt="" className="w-6 brightness-0 invert"/></div>
          VNPT Shop
        </Link>
        <div className="text-sm text-muted">🔒 Thanh toán an toàn</div>
      </nav>
      {/* Steps */}
      <div className="max-w-[1100px] mx-auto px-10 mt-6 flex items-center gap-0">
        {[['1','Giỏ hàng','done'],['2','Thông tin','active'],['3','Thanh toán','inactive'],['4','Xác nhận','inactive']].map(([n,l,s],i,arr) => (
          <span key={n} className="flex items-center flex-1">
            <span className="flex items-center gap-2">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${s==='done'?'bg-success text-white':s==='active'?'bg-vnpt text-white':'bg-shade text-muted'}`}>{s==='done'?'✓':n}</span>
              <span className={`text-sm font-semibold ${s==='active'?'text-vnpt':s==='done'?'text-success':'text-muted'}`}>{l}</span>
            </span>
            {i < arr.length-1 && <div className={`flex-1 h-0.5 mx-3 ${s==='done'?'bg-success':'bg-shade'}`}/>}
          </span>
        ))}
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="max-w-[1100px] mx-auto px-10 py-8 grid grid-cols-[1fr_380px] gap-8 items-start">
          <div className="space-y-5">
            {/* Contact */}
            <div className="bg-white border border-shade rounded-xl p-7">
              <div className="flex items-center gap-3 text-base font-bold text-body mb-5"><span className="w-7 h-7 rounded-full bg-vnpt text-white flex items-center justify-center text-xs font-bold">1</span>Thông tin liên hệ</div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-semibold block mb-1.5">Họ và tên *</label><input {...register('name',{required:true})} className="w-full px-4 py-3 border border-shade rounded-lg text-sm font-body outline-none focus:border-vnpt" placeholder="Nguyễn Văn A"/></div>
                <div><label className="text-sm font-semibold block mb-1.5">Số điện thoại *</label><input {...register('phone',{required:true})} className="w-full px-4 py-3 border border-shade rounded-lg text-sm font-body outline-none focus:border-vnpt" placeholder="0901 234 567"/></div>
                <div className="col-span-2"><label className="text-sm font-semibold block mb-1.5">Email *</label><input {...register('email',{required:true})} type="email" className="w-full px-4 py-3 border border-shade rounded-lg text-sm font-body outline-none focus:border-vnpt" placeholder="example@email.com"/></div>
              </div>
            </div>
            {/* Address */}
            <div className="bg-white border border-shade rounded-xl p-7">
              <div className="flex items-center gap-3 text-base font-bold text-body mb-5"><span className="w-7 h-7 rounded-full bg-vnpt text-white flex items-center justify-center text-xs font-bold">2</span>Địa chỉ giao hàng</div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-semibold block mb-1.5">Tỉnh / Thành phố *</label><select {...register('city')} className="w-full px-4 py-3 border border-shade rounded-lg text-sm font-body outline-none"><option>TP. Hồ Chí Minh</option><option>Hà Nội</option><option>Đà Nẵng</option><option>An Giang</option></select></div>
                <div><label className="text-sm font-semibold block mb-1.5">Quận / Huyện *</label><select {...register('district')} className="w-full px-4 py-3 border border-shade rounded-lg text-sm font-body outline-none"><option>Quận 1</option><option>Quận 3</option></select></div>
                <div className="col-span-2"><label className="text-sm font-semibold block mb-1.5">Địa chỉ cụ thể *</label><input {...register('address',{required:true})} className="w-full px-4 py-3 border border-shade rounded-lg text-sm font-body outline-none focus:border-vnpt" placeholder="Số nhà, tên đường..."/></div>
                <div className="col-span-2"><label className="text-sm font-semibold block mb-1.5">Ghi chú</label><input {...register('note')} className="w-full px-4 py-3 border border-shade rounded-lg text-sm font-body outline-none focus:border-vnpt" placeholder="Giao giờ hành chính, gọi trước 30 phút..."/></div>
              </div>
            </div>
            {/* Payment */}
            <div className="bg-white border border-shade rounded-xl p-7">
              <div className="flex items-center gap-3 text-base font-bold text-body mb-5"><span className="w-7 h-7 rounded-full bg-vnpt text-white flex items-center justify-center text-xs font-bold">3</span>Phương thức thanh toán</div>
              <div className="space-y-3">
                {[['momo','💜','MoMo','Ví điện tử · Giảm thêm 2%'],['vnpay','🏦','VNPAY','ATM / QR Code'],['card','💳','Thẻ Visa / Mastercard','Trả góp 0% đến 24 tháng'],['cod','💵','Tiền mặt (COD)','Kiểm tra hàng trước khi thanh toán']].map(([val,icon,name,sub]) => (
                  <label key={val} className="flex items-center gap-4 p-4 border border-shade rounded-lg cursor-pointer hover:border-vnpt hover:bg-vnpt-light transition-all has-[:checked]:border-vnpt has-[:checked]:bg-vnpt-light">
                    <input type="radio" {...register('payment_method')} value={val} defaultChecked={val==='momo'} className="accent-vnpt w-4 h-4"/>
                    <span className="text-2xl">{icon}</span>
                    <div><div className="text-sm font-semibold text-body">{name}</div><div className="text-xs text-muted">{sub}</div></div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          {/* Order summary */}
          <div className="bg-white border border-shade rounded-xl p-6 sticky top-24">
            <div className="text-base font-bold text-body mb-4 pb-4 border-b border-shade">Đơn hàng ({items.reduce((s,i)=>s+i.qty,0)} sản phẩm)</div>
            <div className="space-y-3 mb-4">
              {items.map(item => (
                <div key={item.key} className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-cream rounded-lg border border-shade flex items-center justify-center flex-shrink-0 relative">
                    <img src={item.img} alt={item.name} className="w-[80%] h-[80%] object-contain"/>
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-muted text-white text-[10px] font-bold rounded-full flex items-center justify-center">{item.qty}</span>
                  </div>
                  <div className="flex-1 text-xs font-semibold text-body line-clamp-2">{item.name}</div>
                  <div className="text-sm font-bold text-body">{formatPrice(item.price*item.qty)}</div>
                </div>
              ))}
            </div>
            <hr className="border-shade mb-4"/>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between"><span className="text-muted">Tạm tính</span><span>{formatPrice(total)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Vận chuyển</span><span className="text-success">Miễn phí</span></div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t-2 border-shade mb-5">
              <span className="text-base font-bold">Tổng cộng</span>
              <span className="text-xl font-bold text-accent font-display">{formatPrice(total)}</span>
            </div>
            <button type="submit" className="w-full py-4 bg-accent text-white rounded-full font-bold text-base hover:bg-accent-dark transition-colors">✓ Đặt hàng ngay</button>
            <p className="text-center text-xs text-muted mt-3">🔒 Thanh toán SSL 256-bit</p>
          </div>
        </div>
      </form>
    </div>
  )
}

// ── CHECKOUT SUCCESS ──────────────────────────────────────────────────────────
export function CheckoutSuccessPage() {
  return (
    <div className="max-w-[680px] mx-auto px-10 py-16 text-center">
      <div className="text-[72px] mb-4" style={{animation:'pop .4s ease'}}>✅</div>
      <h1 className="font-display text-3xl font-bold text-body mb-3">Đặt hàng thành công!</h1>
      <p className="text-muted mb-8 leading-relaxed">Cảm ơn bạn đã mua hàng tại VNPT Shop. Đơn hàng đang được xử lý và sẽ giao trong <strong>2 tiếng</strong>.</p>
      <div className="bg-cream border border-shade rounded-xl p-7 text-left mb-8">
        <div className="text-xs font-bold text-muted uppercase tracking-wider mb-5">Chi tiết đơn hàng</div>
        {[['Mã đơn hàng','#VNPT-2024-089234'],['Phương thức thanh toán','💜 MoMo'],['Dự kiến giao hàng','⚡ Trước 17:00 hôm nay']].map(([l,v]) => (
          <div key={l} className="flex justify-between items-center py-3 border-b border-shade last:border-none text-sm">
            <span className="text-muted">{l}</span><span className="font-semibold">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-3 justify-center">
        <Link to="/account" className="px-7 py-3 border-2 border-vnpt text-vnpt rounded-full font-bold text-sm hover:bg-vnpt hover:text-white transition-all">Xem đơn hàng</Link>
        <Link to="/" className="px-7 py-3 bg-vnpt text-white rounded-full font-bold text-sm hover:bg-vnpt-dark transition-all">Về trang chủ</Link>
      </div>
    </div>
  )
}

// ── ACCOUNT PAGE ──────────────────────────────────────────────────────────────
export function AccountPage() {
  const { user, logout } = useAuthStore()
  const navItems = [['📊','Tổng quan','/account'],['📦','Đơn hàng','/account/orders'],['❤️','Yêu thích','/account/wishlist'],['📍','Địa chỉ','/account/addresses'],['⚙️','Cài đặt','/account/settings'],['🚪','Đăng xuất',null]]
  return (
    <div>
      <Breadcrumb items={[{to:'/',label:'Trang chủ'},{label:'Tài khoản'}]}/>
      <div className="max-w-[1200px] mx-auto px-10 py-8 grid grid-cols-[260px_1fr] gap-7 items-start">
        <aside className="sticky top-20">
          <div className="bg-white border border-shade rounded-xl p-6 mb-4 text-center">
            <div className="w-16 h-16 rounded-full bg-vnpt text-white flex items-center justify-center text-2xl font-bold mx-auto mb-3">{user?.name?.charAt(0)||'U'}</div>
            <div className="font-bold text-body">{user?.name||'Người dùng'}</div>
            <div className="text-xs text-muted mt-1 mb-3">{user?.email}</div>
            <span className="inline-block bg-yellow-50 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full">🥇 Thành viên Vàng</span>
          </div>
          <nav className="bg-white border border-shade rounded-xl overflow-hidden">
            {navItems.map(([icon,label,to]) => (
              to ? (
                <Link key={label} to={to} className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-body border-b border-shade last:border-none hover:bg-vnpt-light hover:text-vnpt transition-colors">
                  <span>{icon}</span>{label}
                </Link>
              ) : (
                <button key={label} onClick={logout} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-accent hover:bg-red-50 transition-colors">
                  <span>{icon}</span>{label}
                </button>
              )
            ))}
          </nav>
        </aside>
        <div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[['📦','12','Tổng đơn hàng'],['✅','10','Đã giao'],['❤️','28','Yêu thích'],['⭐','1.240','Điểm thưởng']].map(([icon,val,label]) => (
              <div key={label} className="bg-white border border-shade rounded-xl p-5 text-center">
                <div className="text-3xl mb-2">{icon}</div>
                <div className="text-3xl font-bold text-vnpt font-display">{val}</div>
                <div className="text-xs text-muted mt-1">{label}</div>
              </div>
            ))}
          </div>
          <div className="bg-white border border-shade rounded-xl p-6">
            <div className="font-bold text-body mb-4">Đơn hàng gần đây</div>
            <div className="text-sm text-muted text-center py-8">Chưa có đơn hàng nào · <Link to="/products" className="text-vnpt font-semibold">Mua sắm ngay</Link></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── BLOG PAGE ─────────────────────────────────────────────────────────────────
export function BlogPage() {
  return (
    <div>
      <div className="text-center py-14 px-10" style={{background:'linear-gradient(135deg,#00205f,#003087)'}}>
        <h1 className="font-display text-4xl font-bold text-white mb-3">📰 Tin tức & Công nghệ</h1>
        <p className="text-white/75 mb-7">Cập nhật tin tức mới nhất về điện thoại và dịch vụ viễn thông</p>
      </div>
      <div className="max-w-[1200px] mx-auto px-10 py-10 text-center text-muted">
        Blog đang được phát triển · <Link to="/" className="text-vnpt font-semibold">Về trang chủ</Link>
      </div>
    </div>
  )
}

// ── CONTACT PAGE ──────────────────────────────────────────────────────────────
export function ContactPage() {
  const { register, handleSubmit, reset } = useForm()
  const [sending, setSending] = useState(false)

  const onSubmit = async (data) => {
    setSending(true)
    try {
      await contactApi.send(data)
      toast.success('Đã gửi yêu cầu! Chúng tôi sẽ liên hệ sớm.')
      reset()
    } catch { toast.error('Gửi thất bại, vui lòng thử lại') }
    finally { setSending(false) }
  }

  return (
    <div>
      <div className="text-center py-14 px-10" style={{background:'linear-gradient(135deg,#00205f,#003087)'}}>
        <h1 className="font-display text-4xl font-bold text-white mb-3">📞 Liên hệ với chúng tôi</h1>
        <p className="text-white/75">Đội ngũ hỗ trợ VNPT Shop luôn sẵn sàng 24/7</p>
      </div>
      <div className="max-w-[1200px] mx-auto px-10 py-12 grid grid-cols-[1fr_400px] gap-8">
        <div className="bg-white border border-shade rounded-[20px] p-9">
          <h2 className="font-display text-2xl font-bold text-body mb-2">Gửi yêu cầu hỗ trợ</h2>
          <p className="text-sm text-muted mb-7">Điền form bên dưới, chúng tôi sẽ phản hồi trong 2–4 giờ</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-semibold block mb-1.5">Họ và tên *</label><input {...register('name',{required:true})} className="w-full px-4 py-3 border border-shade rounded-lg text-sm font-body outline-none focus:border-vnpt" placeholder="Nguyễn Văn A"/></div>
              <div><label className="text-sm font-semibold block mb-1.5">Số điện thoại *</label><input {...register('phone',{required:true})} className="w-full px-4 py-3 border border-shade rounded-lg text-sm font-body outline-none focus:border-vnpt" placeholder="0901 234 567"/></div>
            </div>
            <div><label className="text-sm font-semibold block mb-1.5">Email *</label><input {...register('email',{required:true})} type="email" className="w-full px-4 py-3 border border-shade rounded-lg text-sm font-body outline-none focus:border-vnpt" placeholder="example@email.com"/></div>
            <div><label className="text-sm font-semibold block mb-1.5">Loại yêu cầu</label>
              <select {...register('type')} className="w-full px-4 py-3 border border-shade rounded-lg text-sm font-body outline-none">
                <option>Tư vấn mua hàng</option><option>Kiểm tra đơn hàng</option><option>Đổi trả / Hoàn tiền</option><option>Bảo hành</option><option>Khác</option>
              </select>
            </div>
            <div><label className="text-sm font-semibold block mb-1.5">Nội dung *</label><textarea {...register('message',{required:true})} rows={5} className="w-full px-4 py-3 border border-shade rounded-lg text-sm font-body outline-none focus:border-vnpt resize-none" placeholder="Mô tả chi tiết yêu cầu..."/></div>
            <button type="submit" disabled={sending} className="w-full py-3.5 bg-vnpt text-white rounded-full font-bold text-base hover:bg-vnpt-dark transition-all disabled:opacity-60">
              {sending ? 'Đang gửi...' : '📤 Gửi yêu cầu'}
            </button>
          </form>
        </div>
        <div className="space-y-5">
          {[['📞','Hotline miễn phí','1800 1234','Hỗ trợ 24/7'],['📧','Email','hotro@vnptshop.vn','Phản hồi trong 2-4 giờ'],['🏪','Cửa hàng','200+ cửa hàng toàn quốc','Tìm cửa hàng gần nhất'],['🕐','Giờ làm việc','T2–T6: 7:30–21:00','T7–CN: 8:00–20:00']].map(([icon,title,val,sub]) => (
            <div key={title} className="bg-white border border-shade rounded-xl p-5 flex items-start gap-4">
              <div className="w-11 h-11 bg-vnpt-light rounded-[10px] flex items-center justify-center text-xl flex-shrink-0">{icon}</div>
              <div><div className="text-sm font-bold text-body">{title}</div><div className="text-base font-semibold text-vnpt">{val}</div><div className="text-xs text-muted">{sub}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── NOT FOUND ─────────────────────────────────────────────────────────────────
export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-10">
      <div className="text-8xl mb-6">🔍</div>
      <h1 className="font-display text-5xl font-bold text-body mb-4">404</h1>
      <p className="text-xl text-muted mb-8">Trang bạn tìm không tồn tại</p>
      <Link to="/" className="px-8 py-3.5 bg-vnpt text-white rounded-full font-bold text-base hover:bg-vnpt-dark transition-all">← Về trang chủ</Link>
    </div>
  )
}
