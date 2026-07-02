import { NavLink, Outlet, Link, Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore.js'
import { getInitials } from '../../utils/index.js'

const STAFF_MENU = [
  { section: 'Tổng quan' },
  { to: '/staff',           icon: '▦',  label: 'Dashboard',   end: true },
  { section: 'Bán hàng' },
  { to: '/staff/orders',    icon: '📦', label: 'Đơn hàng' },
  { section: 'Sản phẩm' },
  { to: '/staff/products',  icon: '🛍️', label: 'Sản phẩm' },
  { to: '/staff/inventory', icon: '🏭', label: 'Kho hàng' },
  { section: 'Nội dung' },
  { to: '/staff/blogs',     icon: '📰', label: 'Tin tức' },
  { to: '/staff/contacts',  icon: '💬', label: 'Liên hệ' },
]

const PAGE_TITLES = {
  '/staff':          'Dashboard',
  '/staff/orders':   'Đơn hàng',
  '/staff/products': 'Sản phẩm',
  '/staff/inventory':'Kho hàng',
  '/staff/blogs':    'Tin tức',
  '/staff/contacts': 'Liên hệ',
}

function StaffSidebar() {
  return (
    <aside className="w-[230px] flex flex-col flex-shrink-0 h-screen sticky top-0 self-start" style={{ background: 'linear-gradient(180deg, #00205f 0%, #003087 100%)' }}>
      {/* Logo */}
      <Link to="/" className="block px-5 pt-[22px] pb-[18px] border-b border-white/10 hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-canvas rounded-[9px] flex items-center justify-center text-lg flex-shrink-0">🔶</div>
          <div>
            <div className="text-white font-extrabold text-base font-display tracking-tight">VNPT Shop</div>
            <div className="text-amber-300 text-[11px] font-bold tracking-widest uppercase">Staff Panel</div>
          </div>
        </div>
      </Link>

      <nav className="flex-1 px-2 py-2.5 overflow-y-auto">
        {STAFF_MENU.map((item, idx) => {
          if (item.section) {
            return (
              <div key={idx} className="px-3 pt-3.5 pb-1.5 text-[10px] font-bold tracking-wider text-white/60 uppercase">
                {item.section}
              </div>
            )
          }
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-[13px] mb-0.5 transition-all
                ${isActive ? 'bg-white/[0.15] text-white font-bold' : 'text-white/80 hover:bg-white/[0.08] hover:text-white'}`
              }
            >
              <span className="text-[15px] w-5 text-center">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Badge chỉ rõ quyền hạn */}
      <div className="mx-3 mb-3 px-3 py-2 rounded-lg bg-amber-400/15 border border-amber-400/30">
        <div className="text-amber-300 text-[11px] font-bold">🔒 Chế độ Nhân viên</div>
        <div className="text-white/55 text-[10px] mt-0.5">Chỉ xem • Trả lời liên hệ</div>
      </div>

      <div className="border-t border-white/10">
        <ProfileBlock />
      </div>
    </aside>
  )
}

function ProfileBlock() {
  const { user, logout } = useAuthStore()
  return (
    <div className="px-4 py-3.5 flex items-center gap-2.5">
      <div className="w-[34px] h-[34px] rounded-full bg-amber-400 flex items-center justify-center text-vnpt-dark text-xs font-extrabold flex-shrink-0">
        {getInitials(user?.name || 'Staff')}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-white text-[13px] font-bold truncate">{user?.name || 'Nhân viên'}</div>
        <div className="text-amber-300 text-[11px] font-semibold">Nhân viên</div>
      </div>
      <button onClick={logout} title="Đăng xuất" className="text-white/30 hover:text-white text-lg cursor-pointer">⏏</button>
    </div>
  )
}

function TopBar() {
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] || 'Staff'
  return (
    <div className="bg-canvas border-b border-shade px-7 h-[58px] flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <span className="text-muted text-[13px]">Staff</span>
        <span className="text-shade">›</span>
        <span className="text-[15px] font-bold text-body">{title}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
          👁️ Chế độ xem
        </span>
        <Link to="/" className="text-xs font-semibold text-vnpt hover:underline">← Xem trang chủ</Link>
      </div>
    </div>
  )
}

export default function StaffLayout() {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!['admin', 'staff'].includes(user?.role)) return <Navigate to="/" replace />

  return (
    <div className="flex min-h-screen font-body bg-cream text-body">
      <StaffSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 p-7 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
