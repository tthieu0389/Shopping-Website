/**
 * StaffPanel.jsx — VNPT Shop Staff Dashboard
 * Design: VNPT-Shopify-Hybrid (DESIGN.md)
 * Primary: #003087 | Accent/CTA: #E30613 | Font: Be Vietnam Pro + Roboto
 *
 * Tích hợp: đặt file vào frontend-spa/src/pages/StaffPanel.jsx
 * Thêm route trong App.jsx: <Route path="/staff/*" element={<StaffPanel />} />
 * Bảo vệ route: kiểm tra user.role === 'staff'
 *
 * Chức năng nhân viên:
 * ─ Xử lý đơn hàng (xem, cập nhật trạng thái)
 * ─ Tạo đơn hàng mới cho khách (gắn tên nhân viên vào đơn)
 * ─ Quản lý tin nhắn / liên hệ khách hàng (đọc, trả lời)
 * ─ Phản hồi đánh giá sản phẩm
 * ─ Kiểm tra tồn kho (chỉ xem, không điều chỉnh)
 * ─ Hồ sơ cá nhân & đổi mật khẩu
 */

import { useState } from 'react'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  vnpt:      '#003087',
  vnptDark:  '#00205f',
  vnptMid:   '#1a4fa8',
  vnptLight: '#e8eef8',
  accent:    '#E30613',
  accentBg:  '#fff0f0',
  canvas:    '#ffffff',
  cream:     '#f8f9fa',
  surface:   '#f1f3f5',
  shade:     '#e2e8f0',
  muted:     '#64748b',
  body:      '#1a1a2e',
  success:   '#10b981',
  successBg: '#d1fae5',
  successTx: '#065f46',
  warning:   '#f59e0b',
  warningBg: '#fef3c7',
  warningTx: '#92400e',
  errorBg:   '#fee2e2',
  errorTx:   '#991b1b',
}

// ─── Current staff (from auth store in real app) ──────────────────────────────
const CURRENT_STAFF = {
  id: 3,
  name: 'Lê Minh Tuấn',
  email: 'tuan@vnpt.vn',
  phone: '0987654321',
  joined: '10/03/2024',
  avatar: 'LT',
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const INIT_ORDERS = [
  { id: 'DH-240612-001', customer: 'Nguyễn Văn An',  phone: '0901234567', email: 'an@gmail.com',   total: 33990000, status: 'pending',   items: 1, date: '12/06/2024 10:15', staff: null,                  address: '12 Lê Lợi, Q1, TP.HCM',      payment: 'cod',  note: '' },
  { id: 'DH-240612-002', customer: 'Trần Thị Lan',   phone: '0912345678', email: 'lan@yahoo.com',  total: 8990000,  status: 'confirmed', items: 1, date: '12/06/2024 09:02', staff: CURRENT_STAFF.name,    address: '45 Trần Hưng Đạo, Đà Nẵng',  payment: 'bank', note: 'Giao giờ hành chính' },
  { id: 'DH-240611-003', customer: 'Lê Minh Phúc',  phone: '0987654321', email: 'phuc@email.vn',  total: 1200000,  status: 'shipping',  items: 3, date: '11/06/2024 14:30', staff: null,                  address: '78 Nguyễn Huệ, Hà Nội',       payment: 'momo', note: '' },
  { id: 'DH-240611-004', customer: 'Phạm Thùy Vân', phone: '0978123456', email: 'van@gmail.com',  total: 185000,   status: 'delivered', items: 1, date: '11/06/2024 08:20', staff: 'Võ Lan Anh',          address: '99 Điện Biên Phủ, Hải Phòng', payment: 'vnpay',note: '' },
  { id: 'DH-240610-005', customer: 'Hoàng Đức Nam', phone: '0965432100', email: 'nam@gmail.com',  total: 15990000, status: 'cancelled', items: 2, date: '10/06/2024 16:45', staff: CURRENT_STAFF.name,    address: '34 Pasteur, Q3, TP.HCM',      payment: 'cod',  note: 'Khách đổi ý' },
  { id: 'DH-240610-006', customer: 'Vũ Hà Trang',   phone: '0934567890', email: 'trang@test.vn',  total: 28990000, status: 'pending',   items: 1, date: '10/06/2024 11:10', staff: null,                  address: '5 Bà Triệu, Hà Nội',          payment: 'bank', note: '' },
]

const INIT_CONTACTS = [
  { id: 1, name: 'Lê Văn Bình',  email: 'binh@gmail.com', subject: 'Hỏi về gói 5G doanh nghiệp', msg: 'Tôi muốn hỏi về gói cước 5G doanh nghiệp, giá như thế nào và đăng ký ở đâu?', date: '12/06/2024 10:30', status: 'new',     reply: null, assignedTo: null },
  { id: 2, name: 'Mai Thị Hoa',  email: 'hoa@yahoo.com',  subject: 'Chưa nhận xác nhận đơn hàng', msg: 'Đặt hàng iPhone 16 hôm qua nhưng chưa nhận được email xác nhận.', date: '11/06/2024 15:20', status: 'replied', reply: 'Chào chị Hoa! Đơn hàng đã được xác nhận, email đã gửi lại. Xin lỗi về sự bất tiện!', assignedTo: CURRENT_STAFF.name },
  { id: 3, name: 'Nguyễn Tuấn',  email: 'tuan@email.vn',  subject: 'Sim số đẹp còn hàng không?',  msg: 'Sim số đẹp 0909 xxx xxx còn hàng không? Tôi cần mua gấp cho đối tác.', date: '11/06/2024 09:45', status: 'new',     reply: null, assignedTo: null },
  { id: 4, name: 'Đặng Thị Ngọc',email: 'ngoc@test.vn',   subject: 'Yêu cầu đổi trả sản phẩm',    msg: 'Tôi nhận được điện thoại bị lỗi màn hình, muốn đổi máy mới. Mã đơn DH-240610-006.', date: '10/06/2024 14:10', status: 'read',    reply: null, assignedTo: CURRENT_STAFF.name },
]

const INIT_REVIEWS = [
  { id: 1, product: 'iPhone 16 Pro Max', user: 'Trần Thị Lan',  rating: 5, text: 'Máy mượt, pin trâu, camera cực đỉnh. Giao hàng nhanh, đóng gói cẩn thận!', date: '10/06/2024', reply: null },
  { id: 2, product: 'Samsung Galaxy S25',user: 'Nguyễn Văn An', rating: 4, text: 'Sản phẩm tốt nhưng hộp bên ngoài có vài vết xước nhỏ.', date: '09/06/2024', reply: 'Cảm ơn anh! Chúng tôi sẽ cẩn thận hơn trong đóng gói lần sau.' },
  { id: 3, product: 'Gói 4G Flex 90GB',  user: 'Phạm Thùy Vân', rating: 3, text: 'Tốc độ ban ngày ổn nhưng ban đêm hay bị chậm, không đạt như quảng cáo.', date: '08/06/2024', reply: null },
  { id: 4, product: 'AirPods Pro 2',     user: 'Lê Văn Bình',   rating: 2, text: 'Chất lượng âm thanh không tệ nhưng tai nghe bị nhiễu khi kết nối lần đầu.', date: '07/06/2024', reply: null },
]

const INVENTORY_VIEW = [
  { id: 1, product: 'iPhone 16 Pro Max 256GB',  qty: 12, min: 5,  status: 'ok' },
  { id: 2, product: 'Samsung Galaxy S25 Ultra', qty: 5,  min: 5,  status: 'low' },
  { id: 3, product: 'Sim số đẹp 0909',          qty: 3,  min: 10, status: 'low' },
  { id: 4, product: 'Gói 4G Flex 90GB',         qty: 999,min: 0,  status: 'ok' },
  { id: 5, product: 'AirPods Pro 2 (USB-C)',    qty: 0,  min: 3,  status: 'out' },
  { id: 6, product: 'iPad Air M2 11 inch',      qty: 7,  min: 3,  status: 'ok' },
  { id: 7, product: 'Gói 5G Pro 200GB',         qty: 999,min: 0,  status: 'ok' },
]

const USERS_SEARCH = [
  { id: 1,  name: 'Nguyễn Văn An',   email: 'an@gmail.com',    phone: '0901234567' },
  { id: 2,  name: 'Trần Thị Lan',    email: 'lan@yahoo.com',   phone: '0912345678' },
  { id: 4,  name: 'Phạm Thùy Vân',   email: 'van@gmail.com',   phone: '0978123456' },
  { id: 5,  name: 'Hoàng Đức Nam',   email: 'nam@gmail.com',   phone: '0965432100' },
  { id: 8,  name: 'Vũ Hà Trang',     email: 'trang@test.vn',  phone: '0934567890' },
  { id: 9,  name: 'Đặng Thị Ngọc',   email: 'ngoc@test.vn',   phone: '0923456789' },
  { id: 10, name: 'Bùi Văn Hải',     email: 'hai@email.vn',   phone: '0956781234' },
]

const PRODUCTS_SEARCH = [
  { id: 1, name: 'iPhone 16 Pro Max 256GB',  price: 33990000, stock: 12 },
  { id: 2, name: 'Samsung Galaxy S25 Ultra', price: 28990000, stock: 5 },
  { id: 3, name: 'Oppo Find X8 Pro',         price: 19990000, stock: 8 },
  { id: 4, name: 'Sim số đẹp 0909.xxx.xxx',  price: 2500000,  stock: 3 },
  { id: 5, name: 'Gói 4G Flex 90GB/tháng',  price: 185000,   stock: 999 },
  { id: 6, name: 'Gói 5G Pro 200GB/tháng',  price: 350000,   stock: 999 },
  { id: 7, name: 'AirPods Pro 2 (USB-C)',    price: 6490000,  stock: 0 },
  { id: 8, name: 'iPad Air M2 11 inch',      price: 16990000, stock: 7 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const vnd = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

const ORDER_STATUS = {
  pending:   { label: 'Chờ xác nhận', bg: '#fef3c7', color: '#92400e' },
  confirmed: { label: 'Đã xác nhận',  bg: '#dbeafe', color: '#1e40af' },
  shipping:  { label: 'Đang giao',    bg: '#e0f2fe', color: '#0369a1' },
  delivered: { label: 'Đã giao',      bg: C.successBg, color: C.successTx },
  cancelled: { label: 'Đã huỷ',       bg: C.errorBg,   color: C.errorTx },
}

// ─── UI primitives ────────────────────────────────────────────────────────────
function Badge({ label, bg, color }) {
  return <span style={{ background: bg, color, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, whiteSpace: 'nowrap', display: 'inline-block' }}>{label}</span>
}

function Btn({ children, onClick, variant = 'primary', size = 'md', disabled = false, style: ext }) {
  const base = { borderRadius: 99, border: 'none', fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', opacity: disabled ? 0.5 : 1, transition: 'all .15s' }
  const sizes = { sm: { padding: '6px 14px', fontSize: 12 }, md: { padding: '9px 20px', fontSize: 13 }, lg: { padding: '12px 28px', fontSize: 14 } }
  const variants = {
    primary: { background: C.vnpt, color: '#fff' },
    accent:  { background: C.accent, color: '#fff' },
    outline: { background: C.canvas, color: C.vnpt, border: `1.5px solid ${C.vnpt}` },
    ghost:   { background: 'transparent', color: C.muted, border: `1px solid ${C.shade}` },
    success: { background: C.successBg, color: C.successTx, border: `1px solid ${C.success}` },
  }
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...sizes[size], ...variants[variant], ...ext }}>{children}</button>
}

function Input({ label, value, onChange, placeholder, type = 'text', required, disabled }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.body, marginBottom: 6 }}>{label}{required && <span style={{ color: C.accent }}> *</span>}</label>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
        style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.shade}`, fontSize: 13, color: C.body, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: disabled ? C.cream : C.canvas }} />
    </div>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.body, marginBottom: 6 }}>{label}</label>}
      <select value={value} onChange={onChange} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.shade}`, fontSize: 13, color: C.body, fontFamily: 'inherit', background: C.canvas }}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  )
}

function Textarea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.body, marginBottom: 6 }}>{label}</label>}
      <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
        style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.shade}`, fontSize: 13, color: C.body, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
      />
    </div>
  )
}

function Card({ children, style: s }) {
  return <div style={{ background: C.canvas, border: `1px solid ${C.shade}`, borderRadius: 12, ...s }}>{children}</div>
}

function StatCard({ icon, label, value, sub, bg }) {
  return (
    <Card>
      <div style={{ padding: 18, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: bg || C.vnptLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{icon}</div>
        <div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 2 }}>{label}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.body }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: C.success, fontWeight: 600, marginTop: 3 }}>{sub}</div>}
        </div>
      </div>
    </Card>
  )
}

function Modal({ title, onClose, children, width = 480 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,32,95,.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: C.canvas, borderRadius: 16, width, maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,32,95,.25)' }}>
        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.shade}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.body }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.muted }}>✕</button>
        </div>
        <div style={{ padding: '18px 24px 24px', overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  )
}

function DrawerPanel({ open, onClose, title, subtitle, children }) {
  if (!open) return null
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.2)', zIndex: 90 }} />
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 400, background: C.canvas, boxShadow: '-8px 0 32px rgba(0,32,95,.12)', zIndex: 91, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.shade}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.body }}>{title}</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.muted }}>✕</button>
          </div>
          {subtitle && <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{subtitle}</div>}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>{children}</div>
      </div>
    </>
  )
}

function FilterTabs({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map(([key, label, count]) => (
        <button key={key} onClick={() => onChange(key)}
          style={{ padding: '7px 14px', borderRadius: 99, border: `1.5px solid ${value === key ? C.vnpt : C.shade}`, background: value === key ? C.vnpt : C.canvas, color: value === key ? '#fff' : C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .15s' }}>
          {label}{count !== undefined ? ` (${count})` : ''}
        </button>
      ))}
    </div>
  )
}

function Table({ headers, children }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: C.cream }}>
            {headers.map((h, i) => (
              <th key={i} style={{ padding: '11px 16px', textAlign: 'left', color: C.muted, fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap', borderBottom: `1px solid ${C.shade}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
function TR({ children, onClick, highlight }) {
  const [hover, setHover] = useState(false)
  return (
    <tr onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ borderBottom: `1px solid ${C.shade}`, cursor: onClick ? 'pointer' : 'default', background: highlight ? C.vnptLight : hover ? C.cream : C.canvas, transition: 'background .1s' }}>
      {children}
    </tr>
  )
}
function TD({ children, style: s, muted, bold, accent }) {
  return <td style={{ padding: '12px 16px', color: accent ? C.vnpt : muted ? C.muted : C.body, fontWeight: bold ? 700 : 400, ...s }}>{children}</td>
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════════════════════════
const STAFF_MENU = [
  { section: 'Công việc chính' },
  { key: 'home',      icon: '▦',  label: 'Tổng quan' },
  { key: 'orders',    icon: '📦', label: 'Xử lý đơn hàng' },
  { key: 'create',    icon: '➕', label: 'Tạo đơn cho khách', highlight: true },
  { section: 'Chăm sóc khách hàng' },
  { key: 'messages',  icon: '💬', label: 'Tin nhắn / Liên hệ' },
  { key: 'reviews',   icon: '⭐', label: 'Phản hồi đánh giá' },
  { section: 'Thông tin' },
  { key: 'inventory', icon: '🏭', label: 'Kiểm tra kho hàng' },
  { key: 'profile',   icon: '👤', label: 'Hồ sơ cá nhân' },
]

const PAGE_TITLES_STAFF = {
  home: 'Tổng quan', orders: 'Xử lý đơn hàng', create: 'Tạo đơn hàng mới',
  messages: 'Tin nhắn khách hàng', reviews: 'Phản hồi đánh giá',
  inventory: 'Kiểm tra kho hàng', profile: 'Hồ sơ cá nhân',
}

function StaffSidebar({ active, setActive, newMsgCount, pendingOrderCount }) {
  const badges = { messages: newMsgCount, orders: pendingOrderCount }

  return (
    <aside style={{ width: 230, background: C.vnptDark, display: 'flex', flexDirection: 'column', flexShrink: 0, minHeight: '100vh' }}>
      {/* Logo */}
      <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: C.canvas, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🔷</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, fontFamily: 'Roboto, sans-serif', letterSpacing: -.3 }}>VNPT Shop</div>
            <div style={{ color: 'rgba(255,255,255,.45)', fontSize: 11, fontWeight: 500, letterSpacing: .5 }}>NHÂN VIÊN</div>
          </div>
        </div>
      </div>

      {/* Today stats */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[['📦', 'Đơn hôm nay', '12'], ['💬', 'Tin nhắn mới', String(newMsgCount)]].map(([icon, label, val]) => (
          <div key={label} style={{ background: 'rgba(255,255,255,.08)', borderRadius: 8, padding: '10px 10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 16, marginBottom: 3 }}>{icon}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{val}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', marginTop: 1 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        {STAFF_MENU.map((item, idx) => {
          if (item.section) return (
            <div key={idx} style={{ padding: '14px 12px 6px', fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase' }}>{item.section}</div>
          )
          const isActive = active === item.key
          return (
            <button key={item.key} onClick={() => setActive(item.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 12px', borderRadius: 8, border: isActive ? 'none' : item.highlight ? `1px solid rgba(227,6,19,.4)` : 'none', cursor: 'pointer', background: isActive ? 'rgba(255,255,255,.13)' : item.highlight ? 'rgba(227,6,19,.15)' : 'transparent', color: isActive ? '#fff' : item.highlight ? '#ff8080' : 'rgba(255,255,255,.6)', fontSize: 13, fontWeight: isActive ? 700 : item.highlight ? 600 : 400, marginBottom: 2, textAlign: 'left', transition: 'all .15s', fontFamily: 'inherit' }}>
              <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {badges[item.key] > 0 && (
                <span style={{ background: C.accent, color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 99, minWidth: 18, textAlign: 'center' }}>{badges[item.key]}</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Profile at bottom */}
      <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.vnptMid, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{CURRENT_STAFF.avatar}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: '#fff', fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{CURRENT_STAFF.name}</div>
          <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 11 }}>Nhân viên</div>
        </div>
        <span style={{ color: 'rgba(255,255,255,.3)', fontSize: 18, cursor: 'pointer', marginLeft: 'auto' }}>⏏</span>
      </div>
    </aside>
  )
}

// ─── TOP BAR ─────────────────────────────────────────────────────────────────
function StaffTopBar({ page }) {
  const now = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
  return (
    <div style={{ background: C.canvas, borderBottom: `1px solid ${C.shade}`, padding: '0 28px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: C.muted, fontSize: 13 }}>Nhân viên</span>
        <span style={{ color: C.shade }}>›</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.body }}>{PAGE_TITLES_STAFF[page]}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: 12, color: C.muted }}>{now}</span>
        <div style={{ width: 1, height: 24, background: C.shade }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.vnptMid, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 800 }}>{CURRENT_STAFF.avatar}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.body }}>{CURRENT_STAFF.name}</div>
            <div style={{ fontSize: 11, color: C.success, fontWeight: 600 }}>● Đang trực</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: HOME (Staff overview)
// ═══════════════════════════════════════════════════════════════════════════════
function StaffHome({ orders, contacts, setPage }) {
  const myOrders = orders.filter(o => o.staff === CURRENT_STAFF.name)
  const pending  = orders.filter(o => o.status === 'pending')
  const newMsgs  = contacts.filter(c => c.status === 'new')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Welcome */}
      <div style={{ background: `linear-gradient(135deg, ${C.vnpt}, ${C.vnptMid})`, borderRadius: 16, padding: '24px 28px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Xin chào, {CURRENT_STAFF.name.split(' ').slice(-1)[0]}! 👋</div>
          <div style={{ fontSize: 14, opacity: .8 }}>Hôm nay bạn có {pending.length} đơn đang chờ xử lý và {newMsgs.length} tin nhắn mới.</div>
        </div>
        <div style={{ fontSize: 64, opacity: .15 }}>🧑‍💼</div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard icon="📦" label="Đơn đang chờ"        value={pending.length}    sub="Cần xử lý ngay" bg={pending.length > 0 ? C.warningBg : C.successBg} />
        <StatCard icon="✅" label="Đơn tôi đã xử lý"    value={myOrders.length}   sub="Hôm nay" />
        <StatCard icon="💬" label="Tin nhắn mới"         value={newMsgs.length}    sub="Chờ trả lời" bg={newMsgs.length > 0 ? C.warningBg : C.successBg} />
        <StatCard icon="⭐" label="Đánh giá chờ phản hồi"value={INIT_REVIEWS.filter(r => !r.reply).length} sub="" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Pending orders */}
        <Card>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.shade}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.body }}>⏳ Đơn chờ xác nhận</h3>
            <Btn size="sm" variant="outline" onClick={() => setPage('orders')}>Xem tất cả</Btn>
          </div>
          <div style={{ padding: '8px 0' }}>
            {pending.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: C.muted, fontSize: 13 }}>✅ Không có đơn nào đang chờ!</div>
            ) : pending.map(o => (
              <div key={o.id} onClick={() => setPage('orders')} style={{ padding: '12px 18px', borderBottom: `1px solid ${C.shade}`, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: C.body }}>{o.customer}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{o.id} · {o.date}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: C.vnpt }}>{vnd(o.total)}</div>
                  <Badge label="Chờ xác nhận" bg={C.warningBg} color={C.warningTx} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* New messages */}
        <Card>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.shade}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.body }}>💬 Tin nhắn mới</h3>
            <Btn size="sm" variant="outline" onClick={() => setPage('messages')}>Xem tất cả</Btn>
          </div>
          <div style={{ padding: '8px 0' }}>
            {newMsgs.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: C.muted, fontSize: 13 }}>✅ Không có tin nhắn mới!</div>
            ) : newMsgs.map(c => (
              <div key={c.id} onClick={() => setPage('messages')} style={{ padding: '12px 18px', borderBottom: `1px solid ${C.shade}`, cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: C.body }}>{c.name}</span>
                  <Badge label="Mới" bg="#dbeafe" color="#1e40af" />
                </div>
                <div style={{ fontSize: 12, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.subject}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* My recent handled orders */}
      {myOrders.length > 0 && (
        <Card>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.shade}` }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.body }}>📋 Đơn hàng tôi đã xử lý</h3>
          </div>
          <Table headers={['Mã đơn', 'Khách hàng', 'Tổng tiền', 'Trạng thái', 'Ngày tạo']}>
            {myOrders.slice(0, 5).map((o, i) => (
              <TR key={o.id} highlight={false}>
                <TD accent bold>{o.id}</TD>
                <TD bold>{o.customer}</TD>
                <TD bold>{vnd(o.total)}</TD>
                <TD><Badge {...ORDER_STATUS[o.status]} /></TD>
                <TD muted>{o.date}</TD>
              </TR>
            ))}
          </Table>
        </Card>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: ORDERS (Staff - process orders)
// ═══════════════════════════════════════════════════════════════════════════════
function StaffOrders({ orders, setOrders }) {
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const handleClaim = (id) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, staff: CURRENT_STAFF.name } : o))
    if (selected?.id === id) setSelected(prev => ({ ...prev, staff: CURRENT_STAFF.name }))
  }

  const handleStatus = (id, newStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus, staff: o.staff || CURRENT_STAFF.name } : o))
    if (selected?.id === id) setSelected(prev => ({ ...prev, status: newStatus, staff: prev.staff || CURRENT_STAFF.name }))
  }

  const tabs = [['all', 'Tất cả'], ...Object.entries(ORDER_STATUS).map(([k, v]) => [k, v.label])]
  const pendingCount = orders.filter(o => o.status === 'pending').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {pendingCount > 0 && (
        <div style={{ background: C.warningBg, border: `1px solid #fcd34d`, borderRadius: 10, padding: '12px 18px', fontSize: 13, color: C.warningTx, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          ⚠️ Có {pendingCount} đơn đang chờ xác nhận — vui lòng xử lý sớm nhất có thể.
        </div>
      )}

      <FilterTabs options={tabs} value={filter} onChange={setFilter} />

      <Card>
        <Table headers={['Mã đơn', 'Khách hàng', 'SĐT', 'Tổng tiền', 'Trạng thái', 'Phụ trách', 'Ngày tạo', '']}>
          {filtered.map((o, i) => (
            <TR key={o.id} onClick={() => { setSelected(o); setNote('') }} highlight={o.staff === CURRENT_STAFF.name && o.status !== 'delivered' && o.status !== 'cancelled'}>
              <TD accent bold>{o.id}</TD>
              <TD bold>{o.customer}</TD>
              <TD muted>{o.phone}</TD>
              <TD bold>{vnd(o.total)}</TD>
              <TD><Badge {...ORDER_STATUS[o.status]} /></TD>
              <TD>
                {o.staff ? (
                  <span style={{ fontWeight: 600, fontSize: 12, color: o.staff === CURRENT_STAFF.name ? C.vnpt : C.muted }}>
                    {o.staff === CURRENT_STAFF.name ? '👤 Tôi' : o.staff}
                  </span>
                ) : (
                  <button onClick={e => { e.stopPropagation(); handleClaim(o.id) }}
                    style={{ padding: '4px 10px', borderRadius: 99, border: `1px solid ${C.vnpt}`, background: C.vnptLight, color: C.vnpt, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    Nhận đơn
                  </button>
                )}
              </TD>
              <TD muted style={{ fontSize: 12 }}>{o.date}</TD>
              <TD><span style={{ color: C.vnpt, fontSize: 12, fontWeight: 700 }}>Xử lý →</span></TD>
            </TR>
          ))}
        </Table>
        {filtered.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: C.muted, fontSize: 14 }}>Không có đơn nào trong danh sách này</div>}
      </Card>

      {/* Drawer: Order detail & processing */}
      <DrawerPanel open={!!selected} onClose={() => setSelected(null)} title={selected?.id || ''} subtitle={selected ? `${selected.customer} · ${vnd(selected.total)}` : ''}>
        {selected && (
          <div>
            {/* Staff indicator */}
            <div style={{ marginBottom: 18, padding: '10px 14px', borderRadius: 9, background: selected.staff === CURRENT_STAFF.name ? C.vnptLight : C.cream, border: `1px solid ${selected.staff === CURRENT_STAFF.name ? C.vnpt : C.shade}`, fontSize: 13, fontWeight: 700, color: selected.staff === CURRENT_STAFF.name ? C.vnpt : C.muted }}>
              {selected.staff
                ? (selected.staff === CURRENT_STAFF.name ? `✓ Đơn do bạn phụ trách` : `👤 Đơn do ${selected.staff} phụ trách`)
                : '⬜ Chưa có nhân viên phụ trách'}
            </div>

            {/* Info */}
            <div style={{ background: C.cream, borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                {[['Khách hàng', selected.customer], ['SĐT', selected.phone], ['Email', selected.email], ['Thanh toán', selected.payment?.toUpperCase()], ['Số món', selected.items + ' sản phẩm'], ['Ngày đặt', selected.date]].map(([k, v]) => (
                  <div key={k}><div style={{ fontSize: 11, color: C.muted, marginBottom: 1 }}>{k}</div><div style={{ fontWeight: 700, color: C.body }}>{v}</div></div>
                ))}
              </div>
              {selected.address && <div style={{ marginTop: 12, fontSize: 12, color: C.muted }}>📍 {selected.address}</div>}
              {selected.note && <div style={{ marginTop: 6, fontSize: 12, color: C.muted, fontStyle: 'italic' }}>📝 {selected.note}</div>}
            </div>

            {/* Status update */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.body, marginBottom: 10 }}>Cập nhật trạng thái đơn</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                {Object.entries(ORDER_STATUS).map(([key, { label, bg, color }]) => (
                  <button key={key} onClick={() => handleStatus(selected.id, key)}
                    style={{ padding: '9px 12px', borderRadius: 9, border: `1.5px solid ${selected.status === key ? C.vnpt : C.shade}`, background: selected.status === key ? C.vnptLight : C.canvas, color: selected.status === key ? C.vnpt : C.body, fontSize: 12, fontWeight: selected.status === key ? 800 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s', textAlign: 'center' }}>
                    {selected.status === key ? '✓ ' : ''}{label}
                  </button>
                ))}
              </div>
            </div>

            {/* Note for internal */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.body, marginBottom: 8 }}>Ghi chú nội bộ</div>
              <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú cho đồng nghiệp hoặc ca sau..." rows={3}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.shade}`, fontSize: 13, fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }} />
            </div>

            {!selected.staff && (
              <div style={{ marginTop: 16 }}>
                <Btn variant="primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => handleClaim(selected.id)}>
                  🙋 Nhận phụ trách đơn này
                </Btn>
              </div>
            )}
          </div>
        )}
      </DrawerPanel>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: CREATE ORDER (Staff - create order for customer)
// ═══════════════════════════════════════════════════════════════════════════════
function StaffCreateOrder({ setOrders }) {
  const [step, setStep] = useState(1) // 1: customer, 2: products, 3: info, 4: done
  const [userSearch, setUserSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [productSearch, setProductSearch] = useState('')
  const [cart, setCart] = useState([]) // [{product, qty}]
  const [form, setForm] = useState({ address: '', payment: 'cod', note: '' })
  const [createdOrder, setCreatedOrder] = useState(null)

  const filteredUsers = USERS_SEARCH.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.phone.includes(userSearch)
  )

  const filteredProducts = PRODUCTS_SEARCH.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  )

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { product, qty: 1 }]
    })
  }

  const totalAmount = cart.reduce((sum, i) => sum + i.product.price * i.qty, 0)

  const handleSubmit = () => {
    const order = {
      id: `DH-${Date.now()}`.slice(0, 16),
      customer: selectedUser.name, phone: selectedUser.phone, email: selectedUser.email,
      total: totalAmount, status: 'confirmed', items: cart.reduce((s, i) => s + i.qty, 0),
      date: new Date().toLocaleString('vi-VN'),
      staff: CURRENT_STAFF.name,
      address: form.address, payment: form.payment, note: form.note,
      createdByStaff: true,
    }
    setOrders(prev => [order, ...prev])
    setCreatedOrder(order)
    setStep(4)
  }

  const handleReset = () => {
    setStep(1); setUserSearch(''); setSelectedUser(null); setProductSearch('')
    setCart([]); setForm({ address: '', payment: 'cod', note: '' }); setCreatedOrder(null)
  }

  // ── Step indicator ─────────────────────────────────────────────────────────
  const steps = ['Chọn khách', 'Chọn sản phẩm', 'Xác nhận', 'Hoàn tất']

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Staff badge */}
      <div style={{ background: C.vnptLight, borderRadius: 10, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
        <span style={{ fontSize: 20 }}>🛠️</span>
        <span>Đơn hàng sẽ được tạo bởi <strong style={{ color: C.vnpt }}>{CURRENT_STAFF.name}</strong> — sẽ hiển thị trong hệ thống và lịch sử của khách hàng.</span>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
        {steps.map((s, i) => {
          const num = i + 1
          const done = step > num
          const active = step === num
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: done ? C.success : active ? C.vnpt : C.shade, color: done || active ? '#fff' : C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0, transition: 'all .3s' }}>
                  {done ? '✓' : num}
                </div>
                <span style={{ fontSize: 12, fontWeight: active ? 700 : 400, color: active ? C.vnpt : done ? C.success : C.muted, whiteSpace: 'nowrap' }}>{s}</span>
              </div>
              {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: done ? C.success : C.shade, margin: '0 12px', minWidth: 30, transition: 'background .3s' }} />}
            </div>
          )
        })}
      </div>

      {/* Step 1: Select customer */}
      {step === 1 && (
        <Card style={{ padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.body, marginBottom: 16 }}>Tìm khách hàng</div>
          <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="🔍  Nhập tên, email hoặc số điện thoại..."
            style={{ width: '100%', padding: '11px 16px', borderRadius: 9, border: `1px solid ${C.shade}`, fontSize: 14, color: C.body, boxSizing: 'border-box', outline: 'none', marginBottom: 14 }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
            {filteredUsers.map(u => (
              <div key={u.id} onClick={() => { setSelectedUser(u); setStep(2) }}
                style={{ padding: '13px 16px', borderRadius: 10, border: `1.5px solid ${selectedUser?.id === u.id ? C.vnpt : C.shade}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, background: selectedUser?.id === u.id ? C.vnptLight : C.canvas, transition: 'all .15s' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: C.vnptLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.vnpt, fontWeight: 800, flexShrink: 0 }}>{u.name.split(' ').slice(-1)[0][0]}</div>
                <div>
                  <div style={{ fontWeight: 700, color: C.body }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{u.email} · {u.phone}</div>
                </div>
                <div style={{ marginLeft: 'auto', color: C.vnpt, fontWeight: 700, fontSize: 13 }}>Chọn →</div>
              </div>
            ))}
            {filteredUsers.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: C.muted }}>Không tìm thấy khách hàng phù hợp</div>}
          </div>
        </Card>
      )}

      {/* Step 2: Select products */}
      {step === 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
          <Card style={{ padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.vnptLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.vnpt, fontWeight: 800, fontSize: 13 }}>{selectedUser.name.split(' ').slice(-1)[0][0]}</div>
              <div><div style={{ fontWeight: 700, fontSize: 14, color: C.body }}>{selectedUser.name}</div><div style={{ fontSize: 12, color: C.muted }}>{selectedUser.phone}</div></div>
              <button onClick={() => setStep(1)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>Đổi khách</button>
            </div>

            <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="🔍  Tìm sản phẩm..."
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.shade}`, fontSize: 13, boxSizing: 'border-box', marginBottom: 14, outline: 'none' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 340, overflowY: 'auto' }}>
              {filteredProducts.map(p => (
                <div key={p.id} onClick={() => p.stock > 0 && addToCart(p)}
                  style={{ padding: '12px 14px', borderRadius: 9, border: `1px solid ${C.shade}`, cursor: p.stock > 0 ? 'pointer' : 'not-allowed', opacity: p.stock === 0 ? 0.5 : 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.canvas, transition: 'all .1s' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: C.body }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{p.stock === 0 ? 'Hết hàng' : `Còn ${p.stock} cái`}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: C.vnpt, fontSize: 13 }}>{vnd(p.price)}</div>
                    {p.stock > 0 && <div style={{ fontSize: 11, color: C.success, fontWeight: 700, marginTop: 2 }}>+ Thêm vào</div>}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Cart */}
          <Card style={{ padding: 20, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: C.body, marginBottom: 14 }}>🛒 Giỏ hàng</div>
            {cart.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 13, textAlign: 'center' }}>Chưa có sản phẩm nào</div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: 14 }}>
                {cart.map(item => (
                  <div key={item.product.id} style={{ paddingBottom: 12, marginBottom: 12, borderBottom: `1px solid ${C.shade}` }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.body, marginBottom: 6 }}>{item.product.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={() => setCart(prev => item.qty <= 1 ? prev.filter(i => i.product.id !== item.product.id) : prev.map(i => i.product.id === item.product.id ? { ...i, qty: i.qty - 1 } : i))}
                          style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${C.shade}`, background: C.cream, cursor: 'pointer', fontWeight: 800, color: C.body, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                        <span style={{ fontWeight: 800, fontSize: 14, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                        <button onClick={() => setCart(prev => prev.map(i => i.product.id === item.product.id ? { ...i, qty: i.qty + 1 } : i))}
                          style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${C.vnpt}`, background: C.vnptLight, cursor: 'pointer', fontWeight: 800, color: C.vnpt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>
                      <span style={{ fontWeight: 800, color: C.vnpt, fontSize: 13 }}>{vnd(item.product.price * item.qty)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ borderTop: `1px solid ${C.shade}`, paddingTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15, color: C.body, marginBottom: 14 }}>
                <span>Tổng</span><span style={{ color: C.vnpt }}>{vnd(totalAmount)}</span>
              </div>
              <Btn variant="primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setStep(3)} disabled={cart.length === 0}>
                Tiếp theo →
              </Btn>
            </div>
          </Card>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <Card style={{ padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.body, marginBottom: 20 }}>Xác nhận thông tin đơn hàng</div>

          {/* Order summary */}
          <div style={{ background: C.cream, borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: C.body, marginBottom: 12 }}>Khách hàng: {selectedUser.name} ({selectedUser.phone})</div>
            {cart.map(item => (
              <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, paddingBottom: 6, marginBottom: 6, borderBottom: `1px solid ${C.shade}` }}>
                <span style={{ color: C.body }}>{item.product.name} × {item.qty}</span>
                <span style={{ fontWeight: 700 }}>{vnd(item.product.price * item.qty)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15, marginTop: 8 }}>
              <span>Tổng cộng</span><span style={{ color: C.vnpt }}>{vnd(totalAmount)}</span>
            </div>
          </div>

          <Input label="Địa chỉ giao hàng" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành..." required />
          <Select label="Phương thức thanh toán" value={form.payment} onChange={e => setForm(p => ({ ...p, payment: e.target.value }))}
            options={[['cod','COD — Tiền mặt khi nhận'],['bank','Chuyển khoản ngân hàng'],['vnpay','VNPay'],['momo','Ví MoMo']]} />
          <Textarea label="Ghi chú" value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} placeholder="Giao hàng giờ hành chính, yêu cầu đặc biệt..." rows={2} />

          <div style={{ background: C.vnptLight, borderRadius: 9, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: C.vnpt, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            🛠️ Đơn hàng này sẽ ghi nhận được tạo bởi: <strong>{CURRENT_STAFF.name}</strong>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => setStep(2)}>← Quay lại</Btn>
            <Btn variant="accent" onClick={handleSubmit} disabled={!form.address}>✅ Xác nhận tạo đơn</Btn>
          </div>
        </Card>
      )}

      {/* Step 4: Done */}
      {step === 4 && createdOrder && (
        <Card style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.successTx, marginBottom: 8 }}>Đơn hàng đã được tạo!</div>
          <div style={{ fontSize: 14, color: C.muted, marginBottom: 24 }}>Mã đơn: <strong style={{ color: C.vnpt }}>{createdOrder.id}</strong></div>
          <div style={{ background: C.vnptLight, borderRadius: 12, padding: 20, textAlign: 'left', marginBottom: 24 }}>
            {[['Khách hàng', createdOrder.customer], ['SĐT', createdOrder.phone], ['Tổng tiền', vnd(createdOrder.total)], ['Thanh toán', createdOrder.payment.toUpperCase()], ['Địa chỉ', createdOrder.address], ['Tạo bởi nhân viên', createdOrder.staff]].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '7px 0', borderBottom: `1px solid ${C.shade}` }}>
                <span style={{ color: C.muted }}>{k}</span><span style={{ fontWeight: 700, color: C.body }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Btn variant="outline" onClick={handleReset}>Tạo đơn mới</Btn>
            <Btn variant="primary">In phiếu đặt hàng 🖨️</Btn>
          </div>
        </Card>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: MESSAGES
// ═══════════════════════════════════════════════════════════════════════════════
function StaffMessages({ contacts, setContacts }) {
  const [selected, setSelected] = useState(null)
  const [reply, setReply] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? contacts : contacts.filter(c => c.status === filter)

  const handleSelect = (c) => {
    setSelected(c); setReply('')
    if (c.status === 'new') setContacts(prev => prev.map(x => x.id === c.id ? { ...x, status: 'read', assignedTo: CURRENT_STAFF.name } : x))
  }

  const handleReply = () => {
    if (!reply.trim() || !selected) return
    const r = reply
    setContacts(prev => prev.map(c => c.id === selected.id ? { ...c, reply: r, status: 'replied' } : c))
    setSelected(prev => ({ ...prev, reply: r, status: 'replied' }))
    setReply('')
  }

  const handleAssign = (id) => setContacts(prev => prev.map(c => c.id === id ? { ...c, assignedTo: CURRENT_STAFF.name } : c))

  const statusBadge = {
    new:     { label: '🔵 Mới',         bg: '#dbeafe', color: '#1e40af' },
    read:    { label: '⬜ Đã đọc',      bg: C.cream,   color: C.muted },
    replied: { label: '✅ Đã trả lời',  bg: C.successBg, color: C.successTx },
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, height: 'calc(100vh - 145px)', minHeight: 500 }}>
      {/* List */}
      <Card style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.shade}` }}>
          <FilterTabs options={[['all','Tất cả'],['new','Mới'],['read','Đã đọc'],['replied','Đã trả lời']]} value={filter} onChange={setFilter} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map(c => (
            <div key={c.id} onClick={() => handleSelect(c)}
              style={{ padding: '13px 14px', borderBottom: `1px solid ${C.shade}`, cursor: 'pointer', background: selected?.id === c.id ? C.vnptLight : c.status === 'new' ? '#f0f7ff' : C.canvas, transition: 'background .1s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontWeight: c.status === 'new' ? 800 : 600, fontSize: 13, color: C.body, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 6 }}>{c.name}</span>
                <Badge {...statusBadge[c.status]} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.body, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{c.subject}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{c.date}</div>
              {c.assignedTo && <div style={{ fontSize: 10, color: C.vnpt, fontWeight: 700, marginTop: 3 }}>📌 {c.assignedTo === CURRENT_STAFF.name ? 'Bạn đang phụ trách' : `Phụ trách: ${c.assignedTo}`}</div>}
            </div>
          ))}
        </div>
      </Card>

      {/* Detail */}
      <Card style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, color: C.muted }}>
            <span style={{ fontSize: 44 }}>💬</span>
            <span style={{ fontSize: 14 }}>Chọn một tin nhắn để xem</span>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: '16px 22px', borderBottom: `1px solid ${C.shade}` }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: C.body, marginBottom: 4 }}>{selected.subject}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: C.muted }}>{selected.name} · {selected.email}</span>
                <Badge {...statusBadge[selected.status]} />
                {!selected.assignedTo && (
                  <button onClick={() => handleAssign(selected.id)}
                    style={{ padding: '3px 10px', borderRadius: 99, border: `1px solid ${C.vnpt}`, background: C.vnptLight, color: C.vnpt, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    📌 Nhận phụ trách
                  </button>
                )}
                {selected.assignedTo && <span style={{ fontSize: 11, color: C.vnpt, fontWeight: 700 }}>📌 {selected.assignedTo === CURRENT_STAFF.name ? 'Bạn phụ trách' : selected.assignedTo}</span>}
              </div>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, marginBottom: 8 }}>📨 Khách hàng · {selected.date}</div>
                <div style={{ background: C.cream, borderRadius: 12, padding: 16, fontSize: 14, color: C.body, lineHeight: 1.7 }}>{selected.msg}</div>
              </div>
              {selected.reply && (
                <div>
                  <div style={{ fontSize: 12, color: C.successTx, fontWeight: 700, marginBottom: 8 }}>✅ Phản hồi của bạn</div>
                  <div style={{ background: C.vnptLight, borderRadius: 12, padding: 16, fontSize: 14, color: C.body, lineHeight: 1.7, borderLeft: `4px solid ${C.vnpt}` }}>{selected.reply}</div>
                </div>
              )}
            </div>

            {/* Reply box */}
            {!selected.reply && (
              <div style={{ padding: '14px 22px', borderTop: `1px solid ${C.shade}` }}>
                <Textarea value={reply} onChange={e => setReply(e.target.value)} placeholder={`Trả lời ${selected.name}...`} rows={3} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                  <Btn variant="ghost" onClick={() => setSelected(null)}>Đóng</Btn>
                  <Btn variant="primary" onClick={handleReply} disabled={!reply.trim()}>Gửi phản hồi ➤</Btn>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: REVIEWS
// ═══════════════════════════════════════════════════════════════════════════════
function StaffReviews() {
  const [reviews, setReviews] = useState(INIT_REVIEWS)
  const [replies, setReplies] = useState({})
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? reviews : filter === 'pending' ? reviews.filter(r => !r.reply) : reviews.filter(r => !!r.reply)

  const handleReply = (id) => {
    const text = replies[id]?.trim()
    if (!text) return
    setReviews(prev => prev.map(r => r.id === id ? { ...r, reply: text } : r))
    setReplies(p => ({ ...p, [id]: '' }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <FilterTabs options={[['all','Tất cả'],['pending','Chờ phản hồi'],['replied','Đã phản hồi']]} value={filter} onChange={setFilter} />

      {filtered.map(r => (
        <Card key={r.id} style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 800, color: C.body, fontSize: 14 }}>{r.user}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                về <span style={{ fontWeight: 700, color: C.vnpt }}>{r.product}</span> · {r.date}
              </div>
              <div style={{ fontSize: 18, color: C.warning, marginTop: 6, letterSpacing: 2 }}>
                {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                <span style={{ fontSize: 12, color: C.muted, marginLeft: 6, letterSpacing: 0, fontWeight: 600 }}>{r.rating}/5 sao</span>
              </div>
            </div>
            <Badge
              label={r.reply ? '✅ Đã phản hồi' : '⏳ Chờ phản hồi'}
              bg={r.reply ? C.successBg : C.warningBg}
              color={r.reply ? C.successTx : C.warningTx}
            />
          </div>

          {/* Review text */}
          <div style={{ background: C.cream, borderRadius: 10, padding: '12px 16px', fontSize: 14, color: C.body, lineHeight: 1.7, marginBottom: 14, fontStyle: 'italic' }}>
            "{r.text}"
          </div>

          {/* Reply */}
          {r.reply ? (
            <div style={{ background: C.vnptLight, borderRadius: 10, padding: '12px 16px', fontSize: 13, borderLeft: `4px solid ${C.vnpt}` }}>
              <span style={{ fontWeight: 800, color: C.vnpt }}>Phản hồi của shop: </span>
              <span style={{ color: C.body }}>{r.reply}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <textarea
                  value={replies[r.id] || ''}
                  onChange={e => setReplies(p => ({ ...p, [r.id]: e.target.value }))}
                  placeholder={r.rating >= 4 ? 'Cảm ơn khách hàng đã đánh giá...' : 'Xin lỗi về trải nghiệm chưa tốt, chúng tôi sẽ...'}
                  rows={2}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.shade}`, fontSize: 13, resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: C.body }}
                />
              </div>
              <Btn variant="primary" size="sm" onClick={() => handleReply(r.id)} disabled={!replies[r.id]?.trim()}>Gửi</Btn>
            </div>
          )}
        </Card>
      ))}

      {filtered.length === 0 && (
        <Card style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 15, color: C.muted }}>Không còn đánh giá nào cần phản hồi!</div>
        </Card>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: INVENTORY (view only)
// ═══════════════════════════════════════════════════════════════════════════════
function StaffInventory() {
  const [search, setSearch] = useState('')
  const filtered = INVENTORY_VIEW.filter(i => i.product.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: C.warningBg, border: `1px solid #fcd34d`, borderRadius: 10, padding: '11px 16px', fontSize: 13, color: C.warningTx, fontWeight: 600 }}>
        ℹ️ Bạn đang xem thông tin kho hàng ở chế độ <strong>chỉ đọc</strong>. Để điều chỉnh tồn kho, vui lòng liên hệ quản trị viên.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <StatCard icon="✅" label="Sản phẩm đủ hàng"  value={INVENTORY_VIEW.filter(i => i.status === 'ok').length}  />
        <StatCard icon="⚠️" label="Sắp hết hàng"       value={INVENTORY_VIEW.filter(i => i.status === 'low').length} bg={C.warningBg} />
        <StatCard icon="❌" label="Hết hàng"            value={INVENTORY_VIEW.filter(i => i.status === 'out').length} bg={C.errorBg} />
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Tìm sản phẩm trong kho..."
        style={{ padding: '10px 16px', borderRadius: 99, border: `1px solid ${C.shade}`, fontSize: 13, color: C.body, outline: 'none', width: 280 }} />

      <Card>
        <Table headers={['Sản phẩm', 'Số lượng tồn', 'Ngưỡng tối thiểu', 'Trạng thái']}>
          {filtered.map((item, i) => (
            <TR key={item.id}>
              <TD bold>{item.product}</TD>
              <TD bold style={{ fontSize: 16, color: item.qty === 0 ? C.accent : item.qty <= item.min ? C.warning : C.body }}>{item.qty}</TD>
              <TD muted>{item.min === 0 ? '—' : item.min}</TD>
              <TD>
                <Badge
                  label={item.status === 'ok' ? '✅ Đủ hàng' : item.status === 'low' ? '⚠️ Sắp hết' : '❌ Hết hàng'}
                  bg={item.status === 'ok' ? C.successBg : item.status === 'low' ? C.warningBg : C.errorBg}
                  color={item.status === 'ok' ? C.successTx : item.status === 'low' ? C.warningTx : C.errorTx}
                />
              </TD>
            </TR>
          ))}
        </Table>
      </Card>

      {/* Low stock alert */}
      {INVENTORY_VIEW.some(i => i.status !== 'ok') && (
        <Card style={{ padding: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: C.body, marginBottom: 12 }}>📋 Cần báo cáo quản lý</div>
          {INVENTORY_VIEW.filter(i => i.status !== 'ok').map(i => (
            <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${C.shade}`, fontSize: 13 }}>
              <span style={{ color: C.body, fontWeight: 600 }}>{i.product}</span>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ color: C.muted, fontSize: 12 }}>Còn {i.qty} / min {i.min}</span>
                <Badge label={i.status === 'out' ? 'Hết hàng' : 'Sắp hết'} bg={i.status === 'out' ? C.errorBg : C.warningBg} color={i.status === 'out' ? C.errorTx : C.warningTx} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 14 }}>
            <Btn variant="outline" size="sm">📧 Gửi báo cáo cho quản lý</Btn>
          </div>
        </Card>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: PROFILE
// ═══════════════════════════════════════════════════════════════════════════════
function StaffProfile() {
  const [editing, setEditing] = useState(false)
  const [profile, setProfile] = useState({ name: CURRENT_STAFF.name, email: CURRENT_STAFF.email, phone: CURRENT_STAFF.phone })
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [saved, setSaved] = useState(false)

  const handleSave = () => { setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 860 }}>
      {/* Profile info */}
      <Card style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${C.shade}` }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: `linear-gradient(135deg, ${C.vnpt}, ${C.vnptMid})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 800 }}>{CURRENT_STAFF.avatar}</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.body }}>{profile.name}</div>
            <Badge label="Nhân viên" bg="#dbeafe" color="#1e40af" />
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Vào làm: {CURRENT_STAFF.joined}</div>
          </div>
        </div>

        <Input label="Họ và tên" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} disabled={!editing} />
        <Input label="Email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} type="email" disabled={!editing} />
        <Input label="Số điện thoại" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} disabled={!editing} />

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          {editing ? (
            <>
              <Btn variant="ghost" onClick={() => setEditing(false)}>Huỷ</Btn>
              <Btn variant="primary" onClick={handleSave}>Lưu thay đổi</Btn>
            </>
          ) : (
            <Btn variant="outline" onClick={() => setEditing(true)}>✏️ Chỉnh sửa thông tin</Btn>
          )}
          {saved && <span style={{ color: C.success, fontWeight: 700, fontSize: 13, alignSelf: 'center' }}>✓ Đã lưu!</span>}
        </div>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Change password */}
        <Card style={{ padding: 24 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: C.body, marginBottom: 18, paddingBottom: 14, borderBottom: `1px solid ${C.shade}` }}>🔑 Đổi mật khẩu</div>
          <Input label="Mật khẩu hiện tại" value={pwForm.current} onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))} type="password" />
          <Input label="Mật khẩu mới" value={pwForm.newPw} onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))} type="password" placeholder="Tối thiểu 8 ký tự" />
          <Input label="Xác nhận mật khẩu mới" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} type="password" />
          {pwForm.newPw && pwForm.confirm && pwForm.newPw !== pwForm.confirm && (
            <div style={{ background: C.errorBg, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: C.errorTx, fontWeight: 700, marginBottom: 10 }}>⚠️ Mật khẩu xác nhận không khớp</div>
          )}
          <Btn variant="primary" disabled={!pwForm.current || !pwForm.newPw || pwForm.newPw !== pwForm.confirm}>Cập nhật mật khẩu</Btn>
        </Card>

        {/* Work stats */}
        <Card style={{ padding: 24 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: C.body, marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${C.shade}` }}>📊 Hiệu suất công việc</div>
          {[['Tổng đơn đã xử lý', '57 đơn'], ['Đơn tháng này', '12 đơn'], ['Tin nhắn đã trả lời', '34 tin'], ['Đánh giá đã phản hồi', '18 đánh giá']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${C.shade}`, fontSize: 13 }}>
              <span style={{ color: C.muted }}>{k}</span>
              <span style={{ fontWeight: 800, color: C.vnpt }}>{v}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT STAFF PANEL
// ═══════════════════════════════════════════════════════════════════════════════
export default function StaffPanel() {
  const [page, setPage] = useState('home')
  const [orders, setOrders] = useState(INIT_ORDERS)
  const [contacts, setContacts] = useState(INIT_CONTACTS)

  const newMsgCount     = contacts.filter(c => c.status === 'new').length
  const pendingOrderCount = orders.filter(o => o.status === 'pending').length

  const renderPage = () => {
    switch (page) {
      case 'home':      return <StaffHome orders={orders} contacts={contacts} setPage={setPage} />
      case 'orders':    return <StaffOrders orders={orders} setOrders={setOrders} />
      case 'create':    return <StaffCreateOrder setOrders={setOrders} />
      case 'messages':  return <StaffMessages contacts={contacts} setContacts={setContacts} />
      case 'reviews':   return <StaffReviews />
      case 'inventory': return <StaffInventory />
      case 'profile':   return <StaffProfile />
      default:          return <StaffHome orders={orders} contacts={contacts} setPage={setPage} />
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Be Vietnam Pro', Roboto, sans-serif", background: C.cream, color: C.body }}>
      <StaffSidebar active={page} setActive={setPage} newMsgCount={newMsgCount} pendingOrderCount={pendingOrderCount} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <StaffTopBar page={page} />
        <main style={{ flex: 1, padding: 28, overflowY: 'auto' }}>
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
