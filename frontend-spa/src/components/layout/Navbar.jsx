import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore.js'
import useCartStore from '../../store/cartStore.js'
import { useSearch, useAvatarUrl } from '../../hooks/index.js'
import { formatPrice, resolveImageUrl } from '../../utils/index.js'

function SearchResultItem({ product: p, onSelect }) {
  const img = resolveImageUrl(p.img || p.thumbnail || p.image_url || null)
  const [errored, setErrored] = useState(false)
  const showImg = img && !errored

  return (
    <button
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-cream transition-colors text-left"
      onMouseDown={(e) => {
        e.preventDefault()
        onSelect(p.slug)
      }}
    >
      <div className="w-10 h-10 bg-cream rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden">
        {showImg ? (
          <img src={img} alt={p.name} className="w-full h-full object-cover" onError={() => setErrored(true)} />
        ) : (
          <span className="text-xl">📦</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-body line-clamp-1">{p.name}</div>
        <div className="text-xs text-accent font-bold">{formatPrice(p.price)}</div>
      </div>
    </button>
  )
}

function SearchBox({ className = '', searchRef, query, onInputChange, onFocus, onClear, showDropdown, loading, results, onSelectResult }) {
  return (
    <div
      ref={searchRef}
      className={`relative flex items-center bg-cream border border-shade rounded-full px-4 py-2 gap-2 focus-within:border-vnpt transition-colors ${className}`}
    >
      <svg className="w-4 h-4 text-muted flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="text"
        placeholder="Tìm sản phẩm..."
        className="bg-transparent border-none outline-none text-sm font-body w-full min-w-0 text-body"
        value={query}
        onChange={onInputChange}
        onFocus={onFocus}
        autoComplete="off"
      />
      {query && (
        <button onClick={onClear} className="text-muted hover:text-body transition-colors flex-shrink-0 text-base leading-none">✕</button>
      )}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-shade rounded-xl shadow-lg z-50 overflow-y-auto overflow-x-hidden max-h-80">
          {loading && <div className="p-4 text-sm text-muted text-center">Đang tìm...</div>}
          {!loading && results.length === 0 && (
            <div className="p-4 text-sm text-muted text-center">Không tìm thấy &ldquo;{query}&rdquo;</div>
          )}
          {!loading && results.length > 0 && results.map(p => (
            <SearchResultItem key={p.id} product={p} onSelect={onSelectResult} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const avatarUrl = useAvatarUrl()
  const items = useCartStore(s => s.items)
  const cartCount = items.length
  const navigate = useNavigate()

  const { query, setQuery, results, loading } = useSearch()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const searchRef = useRef(null)
  const userMenuRef = useRef(null)
  const mobileMenuRef = useRef(null)

  const handleLogout = () => { logout(); navigate('/'); setMobileOpen(false); setUserMenuOpen(false) }

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handle = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false)
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Khóa scroll body khi mobile menu mở
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  // Đóng mobile menu khi resize lên lg
  useEffect(() => {
    const handle = () => { if (window.innerWidth >= 1024) setMobileOpen(false) }
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])

  const handleInputChange = (e) => { setQuery(e.target.value); setSearchOpen(true) }
  const handleSelectResult = (slug) => { setSearchOpen(false); setQuery(''); navigate(`/products/${slug}`); setMobileOpen(false) }
  const handleClearSearch = () => { setQuery(''); setSearchOpen(false) }

  const navLinks = [
    { to: '/',                               label: 'Trang chủ' },
    { to: '/products?product_type=device',   label: 'Điện thoại' },
    { to: '/products?product_type=sim',      label: 'Sim' },
    { to: '/products?product_type=internet', label: 'Dịch vụ' },
    { to: '/flash-sale',                     label: 'Flash Sale' },
    { to: '/blog',                           label: 'Tin tức' },
    { to: '/contact',                        label: 'Liên hệ' },
  ]

  const showDropdown = searchOpen && query.trim().length > 0

  const navLinkClass = (to, isActive) => {
    const [path, qs] = to.split('?')
    const active = qs
      ? window.location.pathname === path && window.location.search.includes(qs)
      : isActive
    return `whitespace-nowrap transition-all duration-200 px-3.5 py-2 rounded-md text-sm font-medium ${
      active ? 'text-vnpt bg-vnpt-light' : 'text-muted hover:text-vnpt hover:bg-vnpt-light'
    }`
  }

  const mobileLinkClass = (to, isActive) => {
    const [path, qs] = to.split('?')
    const active = qs
      ? window.location.pathname === path && window.location.search.includes(qs)
      : isActive
    return `flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all ${
      active ? 'text-vnpt bg-vnpt-light font-semibold' : 'text-body hover:bg-cream hover:text-vnpt'
    }`
  }

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-vnpt text-white text-center py-2 px-4 text-xs sm:text-sm font-medium">
        🎉 Flash Sale hôm nay — Giảm đến{' '}
        <span className="text-blue-300 font-bold">50%</span> cho iPhone &amp; Samsung ·{' '}
        <Link to="/flash-sale" className="text-blue-300 underline">Mua ngay →</Link>
      </div>

      {/* Navbar */}
      <nav className="bg-white border-b border-shade sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 flex items-center gap-3 lg:gap-4 h-14 sm:h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0" onClick={() => setMobileOpen(false)}>
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-vnpt rounded-lg flex items-center justify-center flex-shrink-0">
              <img src="https://upload.wikimedia.org/wikipedia/vi/6/65/VNPT_Logo.svg" alt="VNPT" className="w-5 sm:w-6 brightness-0 invert" />
            </div>
            <span className="font-extrabold text-base sm:text-lg text-vnpt hidden sm:inline">VNPT Shop</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden lg:flex gap-0.5 flex-1 min-w-0 ml-2">
            {navLinks.map(({ to, label }) => (
              <NavLink key={to} to={to} end className={({ isActive }) => navLinkClass(to, isActive)}>
                {label}
              </NavLink>
            ))}
          </div>

          {/* Desktop search */}
          <SearchBox
            className="hidden lg:flex w-[200px] xl:w-[240px] flex-shrink-0"
            searchRef={searchRef}
            query={query}
            onInputChange={handleInputChange}
            onFocus={() => { if (query.trim()) setSearchOpen(true) }}
            onClear={handleClearSearch}
            showDropdown={showDropdown}
            loading={loading}
            results={results}
            onSelectResult={handleSelectResult}
          />

          {/* Right controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto flex-shrink-0">

            {/* User menu — desktop */}
            {isAuthenticated ? (
              <div ref={userMenuRef} className="relative hidden sm:block">
                <button
                  onClick={() => setUserMenuOpen(o => !o)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-shade hover:border-vnpt transition-colors text-sm font-semibold text-body"
                >
                  <div className="w-7 h-7 rounded-full bg-vnpt text-white flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden">
                    {avatarUrl
                      ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      : user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden md:inline max-w-[80px] truncate">{user?.name?.split(' ').pop()}</span>
                  <svg className={`w-3.5 h-3.5 text-muted transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-shade rounded-xl shadow-xl z-50 overflow-hidden">
                    {user?.role === 'admin' && (
                      <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-vnpt hover:bg-vnpt-light border-b border-shade">🛠️ Trang quản trị</Link>
                    )}
                    {user?.role === 'staff' && (
                      <Link to="/staff" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-amber-600 hover:bg-amber-50 border-b border-shade">🔶 Trang nhân viên</Link>
                    )}
                    <Link to="/account"           onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-cream">👤 Tài khoản</Link>
                    <Link to="/account/orders"    onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-cream">📦 Đơn hàng</Link>
                    <Link to="/account/addresses" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-cream">📍 Địa chỉ</Link>
                    <div className="border-t border-shade">
                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-cream text-accent">🚪 Đăng xuất</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5">
                <Link to="/login" className="px-3 sm:px-4 py-1.5 border border-vnpt text-vnpt rounded-full text-xs sm:text-sm font-semibold hover:bg-vnpt hover:text-white transition-all whitespace-nowrap">
                  Đăng nhập
                </Link>
                <Link to="/register" className="px-3 sm:px-4 py-1.5 bg-vnpt text-white rounded-full text-xs sm:text-sm font-semibold hover:bg-vnpt-dark transition-all whitespace-nowrap">
                  Đăng ký
                </Link>
              </div>
            )}

            {/* Cart */}
            <Link to="/cart" className="relative w-9 h-9 border border-shade rounded-lg flex items-center justify-center hover:border-vnpt hover:text-vnpt transition-all text-body flex-shrink-0">
              🛒
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white px-0.5">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* Hamburger */}
            <button
              onClick={() => setMobileOpen(o => !o)}
              aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
              className="lg:hidden w-9 h-9 border border-shade rounded-lg flex items-center justify-center hover:border-vnpt hover:text-vnpt transition-all text-body flex-shrink-0"
            >
              {mobileOpen ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu — full screen overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 flex flex-col" style={{ top: '0' }}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />

          {/* Drawer — slides in from right, nhường phần navbar */}
          <div
            ref={mobileMenuRef}
            className="relative ml-auto w-full max-w-[320px] h-full bg-white shadow-2xl flex flex-col overflow-y-auto"
            style={{ marginTop: '0' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-shade sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-vnpt rounded-lg flex items-center justify-center">
                  <img src="https://upload.wikimedia.org/wikipedia/vi/6/65/VNPT_Logo.svg" alt="VNPT" className="w-5 brightness-0 invert" />
                </div>
                <span className="font-extrabold text-base text-vnpt">VNPT Shop</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-9 h-9 rounded-full border border-shade flex items-center justify-center text-muted hover:text-body hover:bg-cream transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 px-4 py-4 flex flex-col gap-3">
              {/* Search */}
              <SearchBox
                className="w-full"
                searchRef={searchRef}
                query={query}
                onInputChange={handleInputChange}
                onFocus={() => { if (query.trim()) setSearchOpen(true) }}
                onClear={handleClearSearch}
                showDropdown={showDropdown}
                loading={loading}
                results={results}
                onSelectResult={handleSelectResult}
              />

              {/* Nav links */}
              <nav className="flex flex-col gap-1">
                {navLinks.map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) => mobileLinkClass(to, isActive)}
                  >
                    {label}
                  </NavLink>
                ))}
              </nav>

              {/* Auth — chỉ hiện trên mobile (sm trở xuống), desktop đã có ở navbar */}
              <div className="sm:hidden border-t border-shade pt-3 mt-1 flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-3 px-4 py-3 bg-cream rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-vnpt text-white flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden">
                        {avatarUrl
                          ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          : user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-body">{user?.name}</div>
                        <div className="text-xs text-muted">{user?.email}</div>
                      </div>
                    </div>
                    {user?.role === 'admin' && (
                      <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-vnpt hover:bg-vnpt-light transition-all">🛠️ Trang quản trị</Link>
                    )}
                    {user?.role === 'staff' && (
                      <Link to="/staff" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-amber-600 hover:bg-amber-50 transition-all">🔶 Trang nhân viên</Link>
                    )}
                    <Link to="/account"           onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm hover:bg-cream transition-all">👤 Tài khoản của tôi</Link>
                    <Link to="/account/orders"    onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm hover:bg-cream transition-all">📦 Đơn hàng</Link>
                    <Link to="/account/addresses" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm hover:bg-cream transition-all">📍 Địa chỉ</Link>
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-accent hover:bg-red-50 transition-all text-left">🚪 Đăng xuất</button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="w-full py-3 border-2 border-vnpt text-vnpt rounded-full text-sm font-semibold hover:bg-vnpt hover:text-white transition-all text-center">
                      Đăng nhập
                    </Link>
                    <Link to="/register" onClick={() => setMobileOpen(false)} className="w-full py-3 bg-vnpt text-white rounded-full text-sm font-semibold hover:bg-vnpt-dark transition-all text-center">
                      Đăng ký
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}