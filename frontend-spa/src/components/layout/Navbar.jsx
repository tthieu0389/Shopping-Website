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
        // dùng onMouseDown thay vì onClick để không bị onBlur chặn
        e.preventDefault()
        onSelect(p.slug)
      }}
    >
      <div className="w-10 h-10 bg-cream rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden">
        {showImg ? (
          <img
            src={img}
            alt={p.name}
            className="w-full h-full object-cover"
            onError={() => setErrored(true)}
          />
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

// Component search dùng chung cho thanh nav (desktop) và panel mobile.
// Được định nghĩa ở top-level (không lồng trong Navbar) để tránh bị tạo lại
// component type mới mỗi lần Navbar re-render — nếu không, input sẽ bị
// unmount/mount lại mỗi lần gõ khiến mất focus/cursor.
function SearchBox({
  className = '',
  searchRef,
  query,
  onInputChange,
  onFocus,
  onClear,
  showDropdown,
  loading,
  results,
  onSelectResult,
}) {
  return (
    <div
      ref={searchRef}
      className={`relative flex items-center bg-cream border border-shade rounded-full px-3.5 py-1.5 gap-2 focus-within:border-vnpt transition-colors ${className}`}
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
      {/* Nút X xóa nhanh */}
      {query && (
        <button
          onClick={onClear}
          className="text-muted hover:text-body transition-colors flex-shrink-0 text-base leading-none"
        >
          ✕
        </button>
      )}

      {/* Dropdown kết quả */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-shade rounded-xl shadow-lg z-50 overflow-y-auto overflow-x-hidden max-h-96">
          {loading && (
            <div className="p-4 text-sm text-muted text-center">Đang tìm...</div>
          )}
          {!loading && results.length === 0 && (
            <div className="p-4 text-sm text-muted text-center">Không tìm thấy kết quả cho &ldquo;{query}&rdquo;</div>
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
  const searchRef = useRef(null)

  const handleLogout = () => { logout(); navigate('/') }

  // Đóng dropdown khi click ra ngoài vùng search
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Đóng menu mobile khi resize lên breakpoint desktop (xl)
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 1280) setMobileOpen(false) }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleInputChange = (e) => {
    setQuery(e.target.value)
    setSearchOpen(true)
  }

  const handleSelectResult = (slug) => {
    setSearchOpen(false)
    setQuery('')
    navigate(`/products/${slug}`)
    setMobileOpen(false)
  }

  const handleClearSearch = () => {
    setQuery('')
    setSearchOpen(false)
  }

  const navLinks = [
    { to: '/',                              label: 'Trang chủ' },
    { to: '/products?product_type=device',  label: 'Điện thoại' },
    { to: '/products?product_type=sim',     label: 'Sim' },
    { to: '/products?product_type=internet',label: 'Dịch vụ' },
    { to: '/flash-sale',                    label: 'Flash Sale' },
    { to: '/blog',                          label: 'Tin tức' },
    { to: '/contact',                       label: 'Liên hệ' },
  ]

  const showDropdown = searchOpen && query.trim().length > 0

  const navLinkClass = (to, isActive, extra = '') => {
    // Với link có query params, kiểm tra pathname + search khớp
    const [path, qs] = to.split('?')
    const currentPath = window.location.pathname
    const currentSearch = window.location.search
    const active = qs
      ? currentPath === path && currentSearch.includes(qs)
      : isActive
    return `${extra} whitespace-nowrap transition-all duration-200 ${
      active ? 'text-vnpt bg-vnpt-light' : 'text-muted hover:text-vnpt hover:bg-vnpt-light'
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
      <nav className="bg-white border-b border-shade sticky top-0 z-50 px-4 sm:px-6 lg:px-10">
        <div className="max-w-[1200px] mx-auto flex items-center gap-2 xl:gap-3 h-14 sm:h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 whitespace-nowrap">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-vnpt rounded-lg flex items-center justify-center flex-shrink-0">
              <img
                src="https://upload.wikimedia.org/wikipedia/vi/6/65/VNPT_Logo.svg"
                alt="VNPT"
                className="w-5 sm:w-6 brightness-0 invert"
              />
            </div>
            <span className="font-extrabold text-base sm:text-lg text-vnpt hidden sm:inline">VNPT Shop</span>
          </Link>

          {/* Nav links — chỉ hiện khi màn hình đủ rộng (xl+) để không bị bóp
              chật cùng ô tìm kiếm và nút đăng nhập/đăng ký. overflow-hidden
              là lưới an toàn cuối cùng, không cho chữ tràn ra ngoài đè lên
              phần tử kế bên nếu vì lý do gì đó vẫn thiếu chỗ. */}
          <div className="hidden xl:flex gap-0.5 flex-1 min-w-0 ml-2 overflow-hidden">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end
                className={({ isActive }) => navLinkClass(to, isActive, 'px-2.5 py-2 rounded-md text-sm font-medium')}
              >
                {label}
              </NavLink>
            ))}
          </div>

          {/* Search — cùng breakpoint với nav links, chiều rộng co giãn
              nhưng có giới hạn để không đẩy tràn các phần tử khác */}
          <SearchBox
            className="hidden xl:flex w-44 2xl:w-56 flex-shrink-0"
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

          {/* Right side — không bao giờ được co lại hay xuống dòng */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto flex-shrink-0">
            {isAuthenticated ? (
              <div className="relative group flex-shrink-0">
                <button className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full border border-shade hover:border-vnpt transition-colors text-sm font-semibold text-body whitespace-nowrap">
                  <div className="w-7 h-7 rounded-full bg-vnpt text-white flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      user?.name?.charAt(0)?.toUpperCase() || 'U'
                    )}
                  </div>
                  <span className="hidden sm:inline max-w-[80px] truncate">{user?.name?.split(' ').pop()}</span>
                </button>
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-shade rounded-xl shadow-lg z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-vnpt hover:bg-vnpt-light rounded-t-xl whitespace-nowrap">🛠️ Trang quản trị</Link>
                  )}
                  {user?.role === 'staff' && (
                    <Link to="/staff" className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-amber-600 hover:bg-amber-50 rounded-t-xl whitespace-nowrap">🔶 Trang nhân viên</Link>
                  )}
                  <Link to="/account"           className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-cream whitespace-nowrap">👤 Tài khoản</Link>
                  <Link to="/account/orders"    className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-cream whitespace-nowrap">📦 Đơn hàng</Link>
                  <Link to="/account/addresses" className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-cream whitespace-nowrap">📍 Địa chỉ</Link>
                  <hr className="border-shade" />
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-cream rounded-b-xl text-accent whitespace-nowrap">
                    🚪 Đăng xuất
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-2.5 sm:px-4 py-1.5 border border-vnpt text-vnpt rounded-full text-xs sm:text-sm font-semibold hover:bg-vnpt hover:text-white transition-all whitespace-nowrap flex-shrink-0"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-2.5 sm:px-4 py-1.5 bg-vnpt text-white rounded-full text-xs sm:text-sm font-semibold hover:bg-vnpt-dark transition-all whitespace-nowrap flex-shrink-0"
                >
                  Đăng ký
                </Link>
              </>
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

            {/* Hamburger — chỉ hiện dưới xl, mở panel chứa nav links + tìm kiếm */}
            <button
              onClick={() => setMobileOpen(o => !o)}
              aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
              className="xl:hidden w-9 h-9 border border-shade rounded-lg flex items-center justify-center hover:border-vnpt hover:text-vnpt transition-all text-body flex-shrink-0"
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

        {/* Mobile menu panel — chứa tìm kiếm + nav links, chỉ hiện dưới xl */}
        {mobileOpen && (
          <div className="xl:hidden border-t border-shade px-4 sm:px-6 py-3 flex flex-col gap-3 max-h-[calc(100vh-4rem)] overflow-y-auto">
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
            <div className="flex flex-col gap-0.5">
              {navLinks.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => navLinkClass(to, isActive, 'px-3.5 py-2.5 rounded-md text-sm font-medium')}
                >
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>
    </>
  )
}