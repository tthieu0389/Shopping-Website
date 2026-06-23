import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore.js'
import useCartStore from '../../store/cartStore.js'
import { useSearch } from '../../hooks/index.js'
import { formatPrice } from '../../utils/index.js'

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const items = useCartStore(s => s.items)
  const cartCount = items.reduce((s, i) => s + i.qty, 0)
  const navigate = useNavigate()

  const { query, setQuery, results, loading } = useSearch()
  const [searchOpen, setSearchOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  const navLinks = [
    { to: '/',                          label: 'Trang chủ' },
    { to: '/products',                  label: 'Điện thoại' },
    { to: '/products?category=sim-so',  label: 'Sim số' },
    { to: '/products?category=goi-cuoc',label: 'Dịch vụ' },
    { to: '/flash-sale',                label: '🔥 Flash Sale' },
    { to: '/blog',                      label: 'Tin tức' },
  ]

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-vnpt text-white text-center py-2 px-4 text-sm font-medium">
        🎉 Flash Sale hôm nay — Giảm đến{' '}
        <span className="text-blue-300 font-bold">50%</span> cho iPhone &amp; Samsung ·{' '}
        <Link to="/flash-sale" className="text-blue-300 underline">Mua ngay →</Link>
      </div>

      {/* Navbar */}
      <nav className="bg-white border-b border-shade sticky top-0 z-50 px-10">
        <div className="max-w-[1200px] mx-auto flex items-center gap-5 h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 font-extrabold text-xl text-vnpt flex-shrink-0">
            <div className="w-9 h-9 bg-vnpt rounded-lg flex items-center justify-center">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/VNPT_Logo.svg/512px-VNPT_Logo.svg.png"
                alt="VNPT"
                className="w-6 brightness-0 invert"
              />
            </div>
            VNPT Shop
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex gap-0.5 flex-1 ml-3">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    isActive ? 'text-vnpt bg-vnpt-light' : 'text-muted hover:text-vnpt hover:bg-vnpt-light'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>

          {/* Search */}
          <div className="relative hidden md:flex items-center bg-cream border border-shade rounded-full px-4 py-1.5 gap-2 min-w-[200px] focus-within:border-vnpt transition-colors">
            <svg className="w-4 h-4 text-muted flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Tìm sản phẩm..."
              className="bg-transparent border-none outline-none text-sm font-body w-full text-body"
              value={query}
              onChange={e => { setQuery(e.target.value); setSearchOpen(true) }}
              onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
              onFocus={() => query && setSearchOpen(true)}
            />
            {searchOpen && (query || loading) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-shade rounded-xl shadow-lg z-50 overflow-hidden">
                {loading && <div className="p-4 text-sm text-muted text-center">Đang tìm...</div>}
                {!loading && results.length === 0 && query && (
                  <div className="p-4 text-sm text-muted text-center">Không tìm thấy kết quả</div>
                )}
                {results.map(p => (
                  <Link
                    key={p.id}
                    to={`/products/${p.slug}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-cream transition-colors"
                    onClick={() => { setSearchOpen(false); setQuery('') }}
                  >
                    <div className="w-10 h-10 bg-cream rounded-md flex items-center justify-center flex-shrink-0 text-xl">📦</div>
                    <div>
                      <div className="text-sm font-semibold text-body line-clamp-1">{p.name}</div>
                      <div className="text-xs text-accent font-bold">{formatPrice(p.price)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2.5 ml-auto">
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-shade hover:border-vnpt transition-colors text-sm font-semibold text-body">
                  <div className="w-7 h-7 rounded-full bg-vnpt text-white flex items-center justify-center text-xs font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  {user?.name?.split(' ').pop()}
                </button>
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-shade rounded-xl shadow-lg z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <Link to="/account"           className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-cream rounded-t-xl">👤 Tài khoản</Link>
                  <Link to="/account/orders"    className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-cream">📦 Đơn hàng</Link>
                  <Link to="/account/wishlist"  className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-cream">❤️ Yêu thích</Link>
                  <Link to="/account/addresses" className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-cream">📍 Địa chỉ</Link>
                  <hr className="border-shade" />
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-cream rounded-b-xl text-accent">
                    🚪 Đăng xuất
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link to="/login"    className="px-4 py-1.5 border border-vnpt text-vnpt rounded-full text-sm font-semibold hover:bg-vnpt hover:text-white transition-all">Đăng nhập</Link>
                <Link to="/register" className="px-4 py-1.5 bg-vnpt text-white rounded-full text-sm font-semibold hover:bg-vnpt-dark transition-all">Đăng ký</Link>
              </>
            )}

            {/* Cart */}
            <Link to="/cart" className="relative w-9 h-9 border border-shade rounded-lg flex items-center justify-center hover:border-vnpt hover:text-vnpt transition-all text-body">
              🛒
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white px-0.5">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}
