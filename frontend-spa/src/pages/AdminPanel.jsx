/**
 * AdminPanel.jsx — VNPT Shop Admin Dashboard
 * Design: VNPT-Shopify-Hybrid (DESIGN.md)
 * Primary: #003087 | Accent/CTA: #E30613 | Font: Be Vietnam Pro + Roboto
 *
 * Tích hợp: đặt file vào frontend-spa/src/pages/AdminPanel.jsx
 * Thêm route trong App.jsx: <Route path="/admin/*" element={<AdminPanel />} />
 * Bảo vệ route: kiểm tra user.role === 'admin'
 */

import { useState, useEffect, useRef } from 'react'

// ─── Design tokens (khớp với index.css / DESIGN.md) ──────────────────────────
const C = {
  vnpt:       '#003087',
  vnptDark:   '#00205f',
  vnptMid:    '#1a4fa8',
  vnptLight:  '#e8eef8',
  accent:     '#E30613',
  accentBg:   '#fff0f0',
  canvas:     '#ffffff',
  cream:      '#f8f9fa',
  surface:    '#f1f3f5',
  shade:      '#e2e8f0',
  muted:      '#64748b',
  body:       '#1a1a2e',
  success:    '#10b981',
  successBg:  '#d1fae5',
  successTx:  '#065f46',
  warning:    '#f59e0b',
  warningBg:  '#fef3c7',
  warningTx:  '#92400e',
  errorBg:    '#fee2e2',
  errorTx:    '#991b1b',
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const ORDERS_DATA = [
  { id: 'DH-240612-001', customer: 'Nguyễn Văn An',   phone: '0901234567', email: 'an@gmail.com',    total: 33990000, status: 'pending',   items: 1, date: '12/06/2024', staff: null,        address: '12 Lê Lợi, Q1, TP.HCM',     payment: 'cod',    note: '' },
  { id: 'DH-240612-002', customer: 'Trần Thị Lan',    phone: '0912345678', email: 'lan@yahoo.com',   total: 8990000,  status: 'confirmed', items: 1, date: '12/06/2024', staff: 'Minh Hùng', address: '45 Trần Hưng Đạo, Đà Nẵng', payment: 'bank',   note: 'Giao giờ hành chính' },
  { id: 'DH-240611-003', customer: 'Lê Minh Tuấn',   phone: '0987654321', email: 'tuan@email.vn',   total: 1200000,  status: 'shipping',  items: 3, date: '11/06/2024', staff: 'Lan Anh',   address: '78 Nguyễn Huệ, Hà Nội',     payment: 'momo',   note: '' },
  { id: 'DH-240611-004', customer: 'Phạm Thùy Vân',  phone: '0978123456', email: 'van@outlook.com', total: 185000,   status: 'delivered', items: 1, date: '11/06/2024', staff: null,        address: '99 Điện Biên Phủ, Hải Phòng',payment: 'vnpay',  note: '' },
  { id: 'DH-240610-005', customer: 'Hoàng Đức Nam',  phone: '0965432100', email: 'nam@gmail.com',   total: 15990000, status: 'cancelled', items: 2, date: '10/06/2024', staff: 'Minh Hùng', address: '34 Pasteur, TP.HCM',         payment: 'cod',    note: 'Khách huỷ' },
  { id: 'DH-240610-006', customer: 'Vũ Thị Hương',   phone: '0934567890', email: 'huong@vnpt.vn',   total: 28990000, status: 'confirmed', items: 1, date: '10/06/2024', staff: 'Lan Anh',   address: '5 Bà Triệu, Hà Nội',        payment: 'bank',   note: '' },
  { id: 'DH-240609-007', customer: 'Đặng Văn Bình',  phone: '0923456789', email: 'binh@test.vn',    total: 6490000,  status: 'delivered', items: 1, date: '09/06/2024', staff: null,        address: '67 Trường Chinh, Hà Nội',    payment: 'vnpay',  note: '' },
]

const PRODUCTS_DATA = [
  { id: 1, name: 'iPhone 16 Pro Max 256GB',   slug: 'iphone-16-pro-max', category: 'device',   brand: 'Apple',   price: 33990000, stock: 12, status: 'active',   image: '📱', sold: 87 },
  { id: 2, name: 'Samsung Galaxy S25 Ultra',  slug: 'galaxy-s25-ultra',  category: 'device',   brand: 'Samsung', price: 28990000, stock: 5,  status: 'active',   image: '📱', sold: 43 },
  { id: 3, name: 'Oppo Find X8 Pro',          slug: 'oppo-find-x8-pro',  category: 'device',   brand: 'Oppo',    price: 19990000, stock: 8,  status: 'active',   image: '📱', sold: 21 },
  { id: 4, name: 'Sim số đẹp 0909.xxx.xxx',   slug: 'sim-dep-0909',      category: 'sim',      brand: 'VNPT',    price: 2500000,  stock: 3,  status: 'active',   image: '📶', sold: 155 },
  { id: 5, name: 'Gói 4G Flex 90GB/tháng',   slug: 'goi-4g-flex-90gb',  category: 'internet', brand: 'VNPT',    price: 185000,   stock: 999,status: 'active',   image: '🌐', sold: 412 },
  { id: 6, name: 'Gói 5G Pro 200GB/tháng',   slug: 'goi-5g-pro-200gb',  category: 'internet', brand: 'VNPT',    price: 350000,   stock: 999,status: 'active',   image: '🌐', sold: 98 },
  { id: 7, name: 'AirPods Pro 2 (USB-C)',     slug: 'airpods-pro-2',     category: 'accessory',brand: 'Apple',   price: 6490000,  stock: 0,  status: 'inactive', image: '🎧', sold: 34 },
  { id: 8, name: 'iPad Air M2 11 inch',       slug: 'ipad-air-m2',       category: 'tablet',   brand: 'Apple',   price: 16990000, stock: 7,  status: 'active',   image: '📋', sold: 19 },
]

const USERS_DATA = [
  { id: 1,  name: 'Nguyễn Văn An',  email: 'an@gmail.com',     phone: '0901234567', role: 'user',  joined: '01/01/2024', orders: 5,  spent: 67980000, status: 'active' },
  { id: 2,  name: 'Trần Thị Lan',   email: 'lan@yahoo.com',    phone: '0912345678', role: 'user',  joined: '15/02/2024', orders: 2,  spent: 17980000, status: 'active' },
  { id: 3,  name: 'Lê Minh Tuấn',   email: 'tuan@email.vn',    phone: '0987654321', role: 'staff', joined: '10/03/2024', orders: 0,  spent: 0,        status: 'active' },
  { id: 4,  name: 'Phạm Thùy Vân',  email: 'van@outlook.com',  phone: '0978123456', role: 'user',  joined: '20/04/2024', orders: 8,  spent: 45200000, status: 'active' },
  { id: 5,  name: 'Hoàng Đức Nam',  email: 'nam@gmail.com',    phone: '0965432100', role: 'user',  joined: '05/05/2024', orders: 1,  spent: 15990000, status: 'blocked' },
  { id: 6,  name: 'Võ Lan Anh',     email: 'lanh@vnpt.vn',     phone: '0933221100', role: 'staff', joined: '01/06/2024', orders: 0,  spent: 0,        status: 'active' },
  { id: 7,  name: 'Đỗ Thị Mai',     email: 'mai@vnpt.vn',      phone: '0944332211', role: 'admin', joined: '01/01/2023', orders: 0,  spent: 0,        status: 'active' },
]

const STAFF_DATA = [
  { id: 3, name: 'Lê Minh Tuấn', email: 'hungnv@vnpt.vn', phone: '0987654321', joined: '10/03/2024', handledOrders: 45, status: 'active',   lastLogin: '12/06/2024 08:32' },
  { id: 6, name: 'Võ Lan Anh',   email: 'lanh@vnpt.vn',   phone: '0933221100', joined: '01/06/2024', handledOrders: 12, status: 'active',   lastLogin: '12/06/2024 09:15' },
]

const CONTACTS_DATA = [
  { id: 1, name: 'Lê Văn Bình',   email: 'binh@gmail.com',  subject: 'Hỏi về gói 5G',         msg: 'Tôi muốn hỏi về gói cước 5G doanh nghiệp, giá như thế nào và cần đăng ký ở đâu?', date: '12/06/2024 10:30', status: 'new',     reply: null },
  { id: 2, name: 'Mai Thị Hoa',   email: 'hoa@yahoo.com',   subject: 'Chưa nhận xác nhận đơn', msg: 'Đặt hàng iPhone 16 hôm qua nhưng chưa nhận được email xác nhận đơn hàng.', date: '11/06/2024 15:20', status: 'replied', reply: 'Chào chị Hoa, đơn hàng DH-240611-003 của chị đã được xác nhận và đang chuẩn bị giao. Email xác nhận đã được gửi lại. Xin lỗi vì sự bất tiện này!' },
  { id: 3, name: 'Nguyễn Tuấn',   email: 'tuan@email.vn',   subject: 'Sim số đẹp còn hàng?',   msg: 'Sim số đẹp 0909 xxx xxx còn hàng không? Tôi cần mua gấp cho đối tác.', date: '11/06/2024 09:45', status: 'new',     reply: null },
  { id: 4, name: 'Vũ Hà Trang',   email: 'trang@test.vn',  subject: 'Yêu cầu đổi trả',        msg: 'Tôi nhận được điện thoại bị lỗi màn hình, muốn đổi máy mới.', date: '10/06/2024 14:10', status: 'read',    reply: null },
]

const REVIEWS_DATA = [
  { id: 1, product: 'iPhone 16 Pro Max', productId: 1, user: 'Trần Thị Lan',  rating: 5, text: 'Máy mượt, pin trâu, camera cực đỉnh. Giao hàng nhanh, đóng gói cẩn thận. Rất hài lòng!', date: '10/06/2024', reply: null,       status: 'published' },
  { id: 2, product: 'Samsung Galaxy S25',productId: 2, user: 'Nguyễn Văn An', rating: 4, text: 'Sản phẩm tốt nhưng hộp bên ngoài có vài vết xước nhỏ, không ảnh hưởng máy.',             date: '09/06/2024', reply: 'Cảm ơn anh đã phản hồi! Chúng tôi sẽ cẩn thận hơn trong đóng gói. Anh có thể liên hệ hotline để được hỗ trợ thêm.', status: 'published' },
  { id: 3, product: 'Gói 4G Flex 90GB',  productId: 5, user: 'Phạm Thùy Vân', rating: 3, text: 'Tốc độ ban ngày ổn nhưng ban đêm hay bị chậm, không đạt như quảng cáo.',                  date: '08/06/2024', reply: null,       status: 'published' },
  { id: 4, product: 'AirPods Pro 2',      productId: 7, user: 'Lê Văn Bình',  rating: 2, text: 'Chất lượng âm thanh không tệ nhưng tai nghe bị nhiễu khi kết nối lần đầu.',              date: '07/06/2024', reply: null,       status: 'flagged' },
]

const INVENTORY_DATA = [
  { id: 1, productId: 1, product: 'iPhone 16 Pro Max 256GB',  qty: 12, min: 5,  status: 'ok',  lastUpdate: '12/06/2024', logs: [{action:'import', qty:'+20', by:'Admin', date:'01/06/2024'},{action:'export', qty:'-8', by:'System', date:'10/06/2024'}] },
  { id: 2, productId: 2, product: 'Samsung Galaxy S25 Ultra', qty: 5,  min: 5,  status: 'low', lastUpdate: '12/06/2024', logs: [{action:'import', qty:'+10', by:'Admin', date:'01/06/2024'},{action:'export', qty:'-5', by:'System', date:'11/06/2024'}] },
  { id: 3, productId: 4, product: 'Sim số đẹp 0909',         qty: 3,  min: 10, status: 'low', lastUpdate: '11/06/2024', logs: [{action:'import', qty:'+15', by:'Admin', date:'15/05/2024'}] },
  { id: 4, productId: 5, product: 'Gói 4G Flex 90GB',        qty: 999,min: 0,  status: 'ok',  lastUpdate: '01/06/2024', logs: [] },
  { id: 5, productId: 7, product: 'AirPods Pro 2 (USB-C)',   qty: 0,  min: 3,  status: 'out', lastUpdate: '09/06/2024', logs: [{action:'export', qty:'-3', by:'System', date:'05/06/2024'}] },
]

const PROMOTIONS_DATA = [
  { id: 1, name: 'Flash Sale mùa hè',        code: 'SUMMER24',  type: 'percent', value: 20,      minOrder: 5000000,  used: 47, limit: 200, from: '01/06/2024', to: '30/06/2024', status: 'active' },
  { id: 2, name: 'Giảm 500K đơn từ 10 triệu',code: 'SAVE500K',  type: 'amount',  value: 500000,  minOrder: 10000000, used: 23, limit: 100, from: '01/06/2024', to: '30/06/2024', status: 'active' },
  { id: 3, name: 'Khai trương sim 5G',        code: 'SIM5G24',   type: 'percent', value: 30,      minOrder: 0,        used: 89, limit: 500, from: '01/05/2024', to: '31/05/2024', status: 'ended' },
  { id: 4, name: 'VIP khách cũ',              code: 'VIP10',     type: 'percent', value: 10,      minOrder: 0,        used: 12, limit: 50,  from: '01/06/2024', to: '31/12/2024', status: 'active' },
]

const BLOGS_DATA = [
  { id: 1, title: 'Top 5 điện thoại đáng mua nhất 2024',      slug: 'top-5-dien-thoai-2024',     status: 'published', author: 'Admin',   date: '10/06/2024', views: 1240, category: 'review' },
  { id: 2, title: 'Hướng dẫn chọn sim số đẹp cho doanh nhân', slug: 'chon-sim-so-dep',           status: 'published', author: 'Lan Anh', date: '08/06/2024', views: 856,  category: 'guide' },
  { id: 3, title: 'VNPT 5G — Tốc độ vượt trội, phủ sóng rộng',slug: 'vnpt-5g-toc-do-vuot-troi', status: 'draft',     author: 'Admin',   date: '12/06/2024', views: 0,    category: 'news' },
  { id: 4, title: 'So sánh iPhone 16 vs Samsung S25',          slug: 'iphone-16-vs-s25',         status: 'published', author: 'Admin',   date: '05/06/2024', views: 2100, category: 'review' },
]

const CATEGORIES_DATA = [
  { id: 1, name: 'Điện thoại',    slug: 'device',    icon: '📱', count: 45, parent: null,  status: 'active' },
  { id: 2, name: 'Sim số',        slug: 'sim',       icon: '📶', count: 120,parent: null,  status: 'active' },
  { id: 3, name: 'Gói cước',      slug: 'internet',  icon: '🌐', count: 18, parent: null,  status: 'active' },
  { id: 4, name: 'Máy tính bảng', slug: 'tablet',    icon: '📋', count: 12, parent: null,  status: 'active' },
  { id: 5, name: 'Phụ kiện',      slug: 'accessory', icon: '🎧', count: 67, parent: null,  status: 'active' },
  { id: 6, name: 'iPhone',        slug: 'iphone',    icon: '📱', count: 18, parent: 1,     status: 'active' },
  { id: 7, name: 'Samsung',       slug: 'samsung',   icon: '📱', count: 15, parent: 1,     status: 'active' },
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

const CAT_LABELS = { device: 'Điện thoại', sim: 'Sim số', internet: 'Gói cước', tablet: 'Máy tính bảng', accessory: 'Phụ kiện' }

// ─── Base UI components ───────────────────────────────────────────────────────
function Badge({ label, bg, color, size = 'sm' }) {
  return (
    <span style={{
      background: bg, color, fontSize: size === 'sm' ? 11 : 13,
      fontWeight: 700, padding: size === 'sm' ? '3px 9px' : '5px 14px',
      borderRadius: 99, whiteSpace: 'nowrap', display: 'inline-block',
    }}>
      {label}
    </span>
  )
}

function Btn({ children, onClick, variant = 'primary', size = 'md', disabled = false, style: extraStyle }) {
  const base = { borderRadius: 99, border: 'none', fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', opacity: disabled ? 0.5 : 1, transition: 'opacity .15s' }
  const sizes = { sm: { padding: '6px 14px', fontSize: 12 }, md: { padding: '9px 20px', fontSize: 13 }, lg: { padding: '12px 28px', fontSize: 14 } }
  const variants = {
    primary:  { background: C.vnpt,    color: '#fff' },
    accent:   { background: C.accent,  color: '#fff' },
    outline:  { background: C.canvas,  color: C.vnpt,  border: `1.5px solid ${C.vnpt}` },
    ghost:    { background: 'transparent', color: C.muted, border: `1px solid ${C.shade}` },
    danger:   { background: C.errorBg, color: C.errorTx, border: `1px solid #fca5a5` },
  }
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...sizes[size], ...variants[variant], ...extraStyle }}>{children}</button>
}

function Input({ label, value, onChange, placeholder, type = 'text', required }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.body, marginBottom: 6 }}>{label}{required && <span style={{ color: C.accent }}> *</span>}</label>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.shade}`, fontSize: 13, color: C.body, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: C.canvas }}
      />
    </div>
  )
}

function Select({ label, value, onChange, options, required }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.body, marginBottom: 6 }}>{label}{required && <span style={{ color: C.accent }}> *</span>}</label>}
      <select value={value} onChange={onChange}
        style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.shade}`, fontSize: 13, color: C.body, fontFamily: 'inherit', background: C.canvas }}>
        {options.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
      </select>
    </div>
  )
}

function Textarea({ label, value, onChange, placeholder, rows = 4 }) {
  return (
    <div style={{ marginBottom: 16 }}>
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

function CardHeader({ title, action }) {
  return (
    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.shade}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.body }}>{title}</h3>
      {action}
    </div>
  )
}

function StatCard({ icon, label, value, sub, accentBg }) {
  return (
    <Card>
      <div style={{ padding: 20, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: accentBg || C.vnptLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{icon}</div>
        <div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 3 }}>{label}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.body, fontFamily: 'Roboto, sans-serif', lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: C.success, marginTop: 4, fontWeight: 600 }}>{sub}</div>}
        </div>
      </div>
    </Card>
  )
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, width = 480 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,32,95,.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: C.canvas, borderRadius: 16, width, maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,32,95,.25)' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.shade}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.body }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.muted, lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ padding: '20px 24px 24px', overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  )
}

// ─── Table shell ──────────────────────────────────────────────────────────────
function Table({ headers, children, empty }) {
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
        <tbody>
          {children}
          {empty && (
            <tr><td colSpan={headers.length} style={{ padding: 40, textAlign: 'center', color: C.muted, fontSize: 14 }}>{empty}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
function TR({ children, onClick, striped }) {
  const [hover, setHover] = useState(false)
  return (
    <tr onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ borderBottom: `1px solid ${C.shade}`, cursor: onClick ? 'pointer' : 'default', background: hover ? C.vnptLight : striped ? C.cream : C.canvas, transition: 'background .1s' }}>
      {children}
    </tr>
  )
}
function TD({ children, style: s, muted, bold }) {
  return <td style={{ padding: '12px 16px', color: muted ? C.muted : C.body, fontWeight: bold ? 700 : 400, ...s }}>{children}</td>
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
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

// ─── Side detail panel ────────────────────────────────────────────────────────
function DrawerPanel({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.2)', zIndex: 90 }} />
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 380, background: C.canvas, boxShadow: '-8px 0 32px rgba(0,32,95,.12)', zIndex: 91, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.shade}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.body }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.muted }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>{children}</div>
      </div>
    </>
  )
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
const ADMIN_MENU = [
  { section: 'Tổng quan' },
  { key: 'dashboard',  icon: '▦',  label: 'Dashboard' },
  { key: 'analytics',  icon: '📈', label: 'Báo cáo & Thống kê' },
  { section: 'Bán hàng' },
  { key: 'orders',     icon: '📦', label: 'Đơn hàng',    badge: 2 },
  { key: 'promotions', icon: '🏷️', label: 'Khuyến mãi' },
  { section: 'Danh mục & Sản phẩm' },
  { key: 'products',   icon: '🛍️', label: 'Sản phẩm' },
  { key: 'categories', icon: '🗂️', label: 'Danh mục' },
  { key: 'inventory',  icon: '🏭', label: 'Kho hàng',    badge: 2 },
  { section: 'Người dùng' },
  { key: 'users',      icon: '👤', label: 'Khách hàng' },
  { key: 'staff',      icon: '🧑‍💼', label: 'Nhân viên' },
  { section: 'Nội dung' },
  { key: 'blog',       icon: '📰', label: 'Tin tức & Blog' },
  { key: 'contacts',   icon: '💬', label: 'Tin nhắn',    badge: 2 },
  { key: 'reviews',    icon: '⭐', label: 'Đánh giá',    badge: 1 },
  { section: 'Hệ thống' },
  { key: 'settings',   icon: '⚙️', label: 'Cài đặt' },
]

function AdminSidebar({ active, setActive }) {
  return (
    <aside style={{ width: 230, background: C.vnptDark, display: 'flex', flexDirection: 'column', flexShrink: 0, minHeight: '100vh' }}>
      {/* Logo */}
      <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: C.canvas, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🔷</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, fontFamily: 'Roboto, sans-serif', letterSpacing: -.3 }}>VNPT Shop</div>
            <div style={{ color: 'rgba(255,255,255,.45)', fontSize: 11, fontWeight: 500, letterSpacing: .5 }}>ADMIN PANEL</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        {ADMIN_MENU.map((item, idx) => {
          if (item.section) return (
            <div key={idx} style={{ padding: '14px 12px 6px', fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase' }}>{item.section}</div>
          )
          const isActive = active === item.key
          return (
            <button key={item.key} onClick={() => setActive(item.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: isActive ? 'rgba(255,255,255,.13)' : 'transparent', color: isActive ? '#fff' : 'rgba(255,255,255,.6)', fontSize: 13, fontWeight: isActive ? 700 : 400, marginBottom: 1, textAlign: 'left', transition: 'all .15s', fontFamily: 'inherit' }}>
              <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge ? <span style={{ background: C.accent, color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 99 }}>{item.badge}</span> : null}
              {isActive && <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#fff', flexShrink: 0 }} />}
            </button>
          )
        })}
      </nav>

      {/* Profile */}
      <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>AD</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: '#fff', fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Đỗ Thị Mai</div>
          <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 11 }}>Quản trị viên</div>
        </div>
        <span style={{ color: 'rgba(255,255,255,.3)', fontSize: 18, cursor: 'pointer', marginLeft: 'auto' }}>⏏</span>
      </div>
    </aside>
  )
}

// ─── TOP BAR ─────────────────────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard: 'Dashboard',     analytics: 'Báo cáo & Thống kê',
  orders: 'Quản lý đơn hàng', promotions: 'Khuyến mãi',
  products: 'Sản phẩm',      categories: 'Danh mục',
  inventory: 'Kho hàng',     users: 'Khách hàng',
  staff: 'Nhân viên',        blog: 'Tin tức & Blog',
  contacts: 'Tin nhắn',      reviews: 'Đánh giá sản phẩm',
  settings: 'Cài đặt hệ thống',
}

function TopBar({ page, setPage }) {
  const [notifs] = useState(3)
  return (
    <div style={{ background: C.canvas, borderBottom: `1px solid ${C.shade}`, padding: '0 28px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: C.muted, fontSize: 13 }}>Admin</span>
        <span style={{ color: C.shade }}>›</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.body }}>{PAGE_TITLES[page]}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 12, color: C.muted }}>12/06/2024</span>
        <div style={{ position: 'relative', cursor: 'pointer' }}>
          <span style={{ fontSize: 20 }}>🔔</span>
          {notifs > 0 && <span style={{ position: 'absolute', top: -4, right: -6, background: C.accent, color: '#fff', fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 99 }}>{notifs}</span>}
        </div>
        <div style={{ width: 1, height: 24, background: C.shade }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 800 }}>AD</div>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.body }}>Đỗ Thị Mai</span>
          <span style={{ color: C.muted, fontSize: 12 }}>▾</span>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function DashboardPage({ setPage }) {
  const monthData = [
    { m: 'T1', rev: 680, ord: 95 }, { m: 'T2', rev: 920, ord: 130 },
    { m: 'T3', rev: 780, ord: 108 }, { m: 'T4', rev: 1100, ord: 158 },
    { m: 'T5', rev: 1050, ord: 145 }, { m: 'T6', rev: 1240, ord: 178 },
  ]
  const maxRev = Math.max(...monthData.map(d => d.rev))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <StatCard icon="💰" label="Doanh thu tháng 6" value="1.24 tỷ"   sub="↑ 18% vs tháng 5" />
        <StatCard icon="📦" label="Đơn hàng hôm nay"  value="38"       sub="↑ 5 đơn vs hôm qua" />
        <StatCard icon="👥" label="Khách mới (7 ngày)" value="124"     sub="↑ 12% vs tuần trước" />
        <StatCard icon="🛍️" label="Sản phẩm sắp hết"  value="3"       accentBg={C.warningBg} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        {/* Chart */}
        <Card>
          <CardHeader title="Doanh thu 6 tháng (triệu VNĐ)" />
          <div style={{ padding: '20px 24px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 140 }}>
              {monthData.map(d => (
                <div key={d.m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>{d.rev}M</div>
                  <div style={{ width: '100%', background: `linear-gradient(180deg, ${C.vnptMid}, ${C.vnpt})`, borderRadius: '6px 6px 0 0', height: `${(d.rev / maxRev) * 110}px`, minHeight: 6 }} />
                  <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{d.m}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Kho cảnh báo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <CardHeader title="⚠️ Cần xử lý" action={<span style={{ fontSize: 12, color: C.accent, fontWeight: 700, cursor: 'pointer' }} onClick={() => setPage('orders')}>Xem đơn →</span>} />
            <div style={{ padding: '12px 16px' }}>
              <div style={{ padding: '10px 0', borderBottom: `1px solid ${C.shade}`, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: C.body }}>Đơn chờ xác nhận</span>
                <Badge label="2 đơn" bg={C.warningBg} color={C.warningTx} />
              </div>
              <div style={{ padding: '10px 0', borderBottom: `1px solid ${C.shade}`, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: C.body }}>Sản phẩm hết hàng</span>
                <Badge label="1 sp" bg={C.errorBg} color={C.errorTx} />
              </div>
              <div style={{ padding: '10px 0', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: C.body }}>Đánh giá cần duyệt</span>
                <Badge label="1 đánh giá" bg={C.warningBg} color={C.warningTx} />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Tin nhắn mới" action={<span style={{ fontSize: 12, color: C.vnpt, fontWeight: 700, cursor: 'pointer' }} onClick={() => setPage('contacts')}>Xem tất cả →</span>} />
            <div style={{ padding: '8px 16px 12px' }}>
              {CONTACTS_DATA.filter(c => c.status === 'new').map(c => (
                <div key={c.id} style={{ padding: '10px 0', borderBottom: `1px solid ${C.shade}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.body }}>{c.name}</span>
                    <span style={{ fontSize: 11, color: C.muted }}>{c.date.split(' ')[0]}</span>
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.subject}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader title="Đơn hàng gần đây" action={<Btn size="sm" variant="outline" onClick={() => setPage('orders')}>Xem tất cả</Btn>} />
        <Table headers={['Mã đơn', 'Khách hàng', 'Tổng tiền', 'Trạng thái', 'Nhân viên', 'Ngày tạo']}>
          {ORDERS_DATA.slice(0, 5).map((o, i) => (
            <TR key={o.id} striped={i % 2 !== 0}>
              <TD bold style={{ color: C.vnpt }}>{o.id}</TD>
              <TD bold>{o.customer}</TD>
              <TD bold>{vnd(o.total)}</TD>
              <TD><Badge {...ORDER_STATUS[o.status]} /></TD>
              <TD muted>{o.staff || '—'}</TD>
              <TD muted>{o.date}</TD>
            </TR>
          ))}
        </Table>
      </Card>
    </div>
  )
}

// ─── ORDERS ──────────────────────────────────────────────────────────────────
function OrdersPage() {
  const [orders, setOrders] = useState(ORDERS_DATA)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ userId: '', products: '', address: '', payment: 'cod', note: '' })

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const handleStatusChange = (id, newStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o))
    if (selected?.id === id) setSelected(prev => ({ ...prev, status: newStatus }))
  }

  const handleCreate = () => {
    if (!form.userId) return
    const newO = {
      id: `DH-${Date.now()}`.slice(0, 16), customer: `KH #${form.userId}`, phone: '—', email: '—',
      total: 0, status: 'pending', items: 0, date: new Date().toLocaleDateString('vi-VN'),
      staff: 'Admin', address: form.address, payment: form.payment, note: form.note,
    }
    setOrders(prev => [newO, ...prev])
    setShowCreate(false)
    setForm({ userId: '', products: '', address: '', payment: 'cod', note: '' })
  }

  const tabs = [['all', 'Tất cả'], ...Object.entries(ORDER_STATUS).map(([k, v]) => [k, v.label])]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <FilterTabs options={tabs} value={filter} onChange={setFilter} />
        <Btn variant="accent" onClick={() => setShowCreate(true)}>➕ Tạo đơn mới</Btn>
      </div>

      {/* Table */}
      <Card>
        <Table headers={['Mã đơn', 'Khách hàng', 'SĐT', 'Tổng tiền', 'Thanh toán', 'Trạng thái', 'Nhân viên', 'Ngày tạo', '']}>
          {filtered.map((o, i) => (
            <TR key={o.id} striped={i % 2 !== 0} onClick={() => setSelected(o)}>
              <TD bold style={{ color: C.vnpt }}>{o.id}</TD>
              <TD bold>{o.customer}</TD>
              <TD muted>{o.phone}</TD>
              <TD bold>{vnd(o.total)}</TD>
              <TD muted style={{ textTransform: 'uppercase', fontSize: 11 }}>{o.payment}</TD>
              <TD><Badge {...ORDER_STATUS[o.status]} /></TD>
              <TD muted>{o.staff || '—'}</TD>
              <TD muted>{o.date}</TD>
              <TD><span style={{ color: C.vnpt, fontSize: 12, fontWeight: 700 }}>Chi tiết</span></TD>
            </TR>
          ))}
        </Table>
        {filtered.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>Không có đơn nào</div>}
      </Card>

      {/* Drawer: order detail */}
      <DrawerPanel open={!!selected} onClose={() => setSelected(null)} title={`Đơn hàng ${selected?.id || ''}`}>
        {selected && (
          <div>
            <div style={{ background: C.cream, borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                {[['Khách hàng', selected.customer], ['SĐT', selected.phone], ['Email', selected.email], ['Tổng tiền', vnd(selected.total)], ['Thanh toán', selected.payment.toUpperCase()], ['Ngày tạo', selected.date]].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ color: C.muted, fontSize: 11, marginBottom: 2 }}>{k}</div>
                    <div style={{ fontWeight: 700, color: C.body }}>{v}</div>
                  </div>
                ))}
              </div>
              {selected.address && <div style={{ marginTop: 12, fontSize: 12, color: C.muted }}>📍 {selected.address}</div>}
              {selected.note && <div style={{ marginTop: 8, fontSize: 12, color: C.muted, fontStyle: 'italic' }}>📝 {selected.note}</div>}
              {selected.staff && (
                <div style={{ marginTop: 10, background: C.vnptLight, borderRadius: 7, padding: '7px 12px', fontSize: 12, color: C.vnpt, fontWeight: 700 }}>
                  👤 Nhân viên tạo đơn: {selected.staff}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 700, color: C.body }}>Cập nhật trạng thái</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {Object.entries(ORDER_STATUS).map(([key, { label, bg, color }]) => (
                <button key={key} onClick={() => handleStatusChange(selected.id, key)}
                  style={{ padding: '10px 16px', borderRadius: 9, border: `1.5px solid ${selected.status === key ? C.vnpt : C.shade}`, background: selected.status === key ? C.vnptLight : C.canvas, color: selected.status === key ? C.vnpt : C.body, fontSize: 13, fontWeight: selected.status === key ? 700 : 400, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all .15s' }}>
                  {selected.status === key ? '✓ ' : ''}{label}
                </button>
              ))}
            </div>
          </div>
        )}
      </DrawerPanel>

      {/* Modal: create order */}
      {showCreate && (
        <Modal title="Tạo đơn hàng mới" onClose={() => setShowCreate(false)} width={500}>
          <div style={{ background: C.vnptLight, borderRadius: 9, padding: '10px 14px', marginBottom: 18, fontSize: 13, color: C.vnpt, fontWeight: 700 }}>
            🛠️ Đơn tạo bởi Admin — sẽ được ghi nhận vào lịch sử
          </div>
          <Input label="ID hoặc email khách hàng" value={form.userId} onChange={e => setForm(p => ({ ...p, userId: e.target.value }))} placeholder="Nhập ID số hoặc email..." required />
          <Textarea label="Sản phẩm" value={form.products} onChange={e => setForm(p => ({ ...p, products: e.target.value }))} placeholder="Nhập tên hoặc ID sản phẩm, mỗi dòng 1 sản phẩm..." rows={3} />
          <Input label="Địa chỉ giao hàng" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành..." />
          <Select label="Phương thức thanh toán" value={form.payment} onChange={e => setForm(p => ({ ...p, payment: e.target.value }))} options={[['cod','COD — Tiền mặt khi nhận'],['bank','Chuyển khoản ngân hàng'],['vnpay','VNPay'],['momo','Ví MoMo']]} />
          <Textarea label="Ghi chú" value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} placeholder="Ghi chú nội bộ hoặc yêu cầu của khách..." rows={2} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setShowCreate(false)}>Huỷ</Btn>
            <Btn variant="primary" onClick={handleCreate} disabled={!form.userId}>Tạo đơn hàng</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── PRODUCTS ────────────────────────────────────────────────────────────────
function ProductsPage() {
  const [products, setProducts] = useState(PRODUCTS_DATA)
  const [catFilter, setCatFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | 'add' | product obj
  const [form, setForm] = useState({ name: '', category: 'device', brand: '', price: '', stock: '', status: 'active' })

  const filtered = products.filter(p => {
    const matchCat = catFilter === 'all' || p.category === catFilter
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const openAdd = () => { setForm({ name: '', category: 'device', brand: '', price: '', stock: '', status: 'active' }); setModal('add') }
  const openEdit = (p) => { setForm({ name: p.name, category: p.category, brand: p.brand, price: String(p.price), stock: String(p.stock), status: p.status }); setModal(p) }

  const handleSave = () => {
    if (!form.name) return
    if (modal === 'add') {
      setProducts(prev => [...prev, { id: Date.now(), ...form, price: +form.price, stock: +form.stock, image: '📦', sold: 0 }])
    } else {
      setProducts(prev => prev.map(p => p.id === modal.id ? { ...p, ...form, price: +form.price, stock: +form.stock } : p))
    }
    setModal(null)
  }

  const handleDelete = (id) => { if (confirm('Xoá sản phẩm này?')) setProducts(prev => prev.filter(p => p.id !== id)) }

  const cats = [['all', 'Tất cả'], ...Object.entries(CAT_LABELS).map(([k, v]) => [k, v])]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <FilterTabs options={cats} value={catFilter} onChange={setCatFilter} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Tìm sản phẩm..."
            style={{ padding: '7px 14px', borderRadius: 99, border: `1px solid ${C.shade}`, fontSize: 13, color: C.body, outline: 'none', width: 200 }} />
        </div>
        <Btn variant="primary" onClick={openAdd}>➕ Thêm sản phẩm</Btn>
      </div>

      <Card>
        <Table headers={['', 'Tên sản phẩm', 'Danh mục', 'Thương hiệu', 'Giá bán', 'Tồn kho', 'Đã bán', 'Trạng thái', '']}>
          {filtered.map((p, i) => (
            <TR key={p.id} striped={i % 2 !== 0}>
              <TD style={{ fontSize: 22, width: 44 }}>{p.image}</TD>
              <TD bold>{p.name}</TD>
              <TD><Badge label={CAT_LABELS[p.category] || p.category} bg={C.vnptLight} color={C.vnpt} /></TD>
              <TD muted>{p.brand}</TD>
              <TD bold>{vnd(p.price)}</TD>
              <TD>
                <Badge
                  label={p.stock === 0 ? 'Hết hàng' : p.stock <= 5 ? `⚠ ${p.stock} còn` : `${p.stock} còn`}
                  bg={p.stock === 0 ? C.errorBg : p.stock <= 5 ? C.warningBg : C.successBg}
                  color={p.stock === 0 ? C.errorTx : p.stock <= 5 ? C.warningTx : C.successTx}
                />
              </TD>
              <TD muted>{p.sold}</TD>
              <TD><Badge label={p.status === 'active' ? 'Đang bán' : 'Tạm ẩn'} bg={p.status === 'active' ? C.successBg : C.surface} color={p.status === 'active' ? C.successTx : C.muted} /></TD>
              <TD>
                <div style={{ display: 'flex', gap: 10 }}>
                  <span style={{ color: C.vnpt, fontWeight: 700, cursor: 'pointer', fontSize: 12 }} onClick={() => openEdit(p)}>Sửa</span>
                  <span style={{ color: C.accent, fontWeight: 700, cursor: 'pointer', fontSize: 12 }} onClick={() => handleDelete(p.id)}>Xoá</span>
                </div>
              </TD>
            </TR>
          ))}
        </Table>
      </Card>

      {modal && (
        <Modal title={modal === 'add' ? 'Thêm sản phẩm mới' : `Sửa: ${modal.name}`} onClose={() => setModal(null)} width={520}>
          <Input label="Tên sản phẩm" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="VD: iPhone 16 Pro Max 256GB" required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select label="Danh mục" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} options={Object.entries(CAT_LABELS)} />
            <Input label="Thương hiệu" value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))} placeholder="Apple, Samsung, VNPT..." />
            <Input label="Giá bán (VNĐ)" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="33990000" type="number" required />
            <Input label="Tồn kho ban đầu" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} placeholder="10" type="number" />
          </div>
          <Select label="Trạng thái" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} options={[['active', 'Đang bán'],['inactive', 'Tạm ẩn']]} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Btn variant="ghost" onClick={() => setModal(null)}>Huỷ</Btn>
            <Btn variant="primary" onClick={handleSave} disabled={!form.name}>Lưu sản phẩm</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── CATEGORIES ──────────────────────────────────────────────────────────────
function CategoriesPage() {
  const [cats, setCats] = useState(CATEGORIES_DATA)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '', icon: '📦', parent: '' })

  const handleAdd = () => {
    if (!form.name) return
    setCats(prev => [...prev, { id: Date.now(), ...form, count: 0, parent: form.parent ? +form.parent : null, status: 'active' }])
    setModal(false); setForm({ name: '', slug: '', icon: '📦', parent: '' })
  }
  const handleDelete = id => { if (confirm('Xoá danh mục?')) setCats(prev => prev.filter(c => c.id !== id)) }

  const roots = cats.filter(c => !c.parent)
  const subs  = cats.filter(c =>  c.parent)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Btn variant="primary" onClick={() => setModal(true)}>➕ Thêm danh mục</Btn>
      </div>

      {/* Root categories */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Danh mục gốc</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {roots.map(c => {
            const childCount = subs.filter(s => s.parent === c.id).length
            return (
              <Card key={c.id} style={{ padding: 18, textAlign: 'center', position: 'relative' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{c.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.body, marginBottom: 3 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>{c.count} sản phẩm{childCount > 0 ? ` · ${childCount} danh mục con` : ''}</div>
                <Badge label={c.status === 'active' ? 'Hiển thị' : 'Ẩn'} bg={c.status === 'active' ? C.successBg : C.surface} color={c.status === 'active' ? C.successTx : C.muted} />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12 }}>
                  <span style={{ fontSize: 12, color: C.vnpt, fontWeight: 700, cursor: 'pointer' }}>Sửa</span>
                  <span style={{ fontSize: 12, color: C.accent, fontWeight: 700, cursor: 'pointer' }} onClick={() => handleDelete(c.id)}>Xoá</span>
                </div>
              </Card>
            )
          })}
          <div onClick={() => setModal(true)} style={{ border: `2px dashed ${C.shade}`, borderRadius: 12, padding: 18, textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 140, color: C.muted }}>
            <span style={{ fontSize: 28 }}>➕</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Thêm mới</span>
          </div>
        </div>
      </div>

      {/* Sub categories */}
      {subs.length > 0 && (
        <Card>
          <CardHeader title="Danh mục con" />
          <Table headers={['Tên danh mục', 'Thuộc danh mục', 'Số sản phẩm', 'Trạng thái', '']}>
            {subs.map((c, i) => (
              <TR key={c.id} striped={i % 2 !== 0}>
                <TD bold>{c.icon} {c.name}</TD>
                <TD muted>{cats.find(r => r.id === c.parent)?.name || '—'}</TD>
                <TD muted>{c.count}</TD>
                <TD><Badge label={c.status === 'active' ? 'Hiển thị' : 'Ẩn'} bg={c.status === 'active' ? C.successBg : C.surface} color={c.status === 'active' ? C.successTx : C.muted} /></TD>
                <TD><span style={{ color: C.accent, fontSize: 12, fontWeight: 700, cursor: 'pointer' }} onClick={() => handleDelete(c.id)}>Xoá</span></TD>
              </TR>
            ))}
          </Table>
        </Card>
      )}

      {modal && (
        <Modal title="Thêm danh mục" onClose={() => setModal(false)}>
          <Input label="Tên danh mục" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="VD: Điện thoại" required />
          <Input label="Slug (URL)" value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="dien-thoai" />
          <Input label="Icon (emoji)" value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} placeholder="📱" />
          <Select label="Thuộc danh mục (để trống nếu là danh mục gốc)" value={form.parent} onChange={e => setForm(p => ({ ...p, parent: e.target.value }))}
            options={[['', '— Danh mục gốc —'], ...roots.map(r => [String(r.id), r.name])]} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Btn variant="ghost" onClick={() => setModal(false)}>Huỷ</Btn>
            <Btn variant="primary" onClick={handleAdd} disabled={!form.name}>Thêm danh mục</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── INVENTORY ───────────────────────────────────────────────────────────────
function InventoryPage() {
  const [inv, setInv] = useState(INVENTORY_DATA)
  const [adj, setAdj] = useState({})
  const [adjNote, setAdjNote] = useState({})
  const [detail, setDetail] = useState(null)

  const calcStatus = (qty, min) => qty === 0 ? 'out' : qty <= min ? 'low' : 'ok'

  const handleAdjust = (id) => {
    const delta = parseInt(adj[id] || 0)
    if (!delta) return
    setInv(prev => prev.map(i => {
      if (i.id !== id) return i
      const newQty = Math.max(0, i.qty + delta)
      const newLog = { action: delta > 0 ? 'import' : 'export', qty: `${delta > 0 ? '+' : ''}${delta}`, by: 'Admin', date: new Date().toLocaleDateString('vi-VN') }
      return { ...i, qty: newQty, status: calcStatus(newQty, i.min), lastUpdate: new Date().toLocaleDateString('vi-VN'), logs: [newLog, ...i.logs] }
    }))
    setAdj(p => ({ ...p, [id]: '' }))
    setAdjNote(p => ({ ...p, [id]: '' }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <StatCard icon="✅" label="Còn hàng đủ"    value={inv.filter(i => i.status === 'ok').length}  />
        <StatCard icon="⚠️" label="Sắp hết hàng"   value={inv.filter(i => i.status === 'low').length} accentBg={C.warningBg} />
        <StatCard icon="❌" label="Hết hàng"        value={inv.filter(i => i.status === 'out').length} accentBg={C.errorBg} />
      </div>

      <Card>
        <Table headers={['Sản phẩm', 'Tồn kho', 'Ngưỡng tối thiểu', 'Trạng thái', 'Cập nhật', 'Điều chỉnh số lượng', '']}>
          {inv.map((item, i) => (
            <TR key={item.id} striped={i % 2 !== 0}>
              <TD bold>{item.product}</TD>
              <TD bold style={{ fontSize: 16, color: item.qty === 0 ? C.accent : C.body }}>{item.qty}</TD>
              <TD muted>{item.min}</TD>
              <TD>
                <Badge
                  label={item.status === 'ok' ? 'Đủ hàng' : item.status === 'low' ? '⚠ Sắp hết' : '✕ Hết hàng'}
                  bg={item.status === 'ok' ? C.successBg : item.status === 'low' ? C.warningBg : C.errorBg}
                  color={item.status === 'ok' ? C.successTx : item.status === 'low' ? C.warningTx : C.errorTx}
                />
              </TD>
              <TD muted>{item.lastUpdate}</TD>
              <TD>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="number" value={adj[item.id] || ''} onChange={e => setAdj(p => ({ ...p, [item.id]: e.target.value }))}
                    placeholder="±số" style={{ width: 70, padding: '6px 10px', borderRadius: 7, border: `1px solid ${C.shade}`, fontSize: 12, color: C.body }} />
                  <Btn size="sm" onClick={() => handleAdjust(item.id)}>Lưu</Btn>
                </div>
              </TD>
              <TD><span style={{ color: C.vnpt, fontSize: 12, fontWeight: 700, cursor: 'pointer' }} onClick={() => setDetail(item)}>Lịch sử</span></TD>
            </TR>
          ))}
        </Table>
      </Card>

      <DrawerPanel open={!!detail} onClose={() => setDetail(null)} title={`Lịch sử kho — ${detail?.product || ''}`}>
        {detail && (
          <div>
            <div style={{ background: C.cream, borderRadius: 10, padding: 14, marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
              <div><div style={{ fontSize: 11, color: C.muted }}>Tồn kho hiện tại</div><div style={{ fontSize: 24, fontWeight: 800, color: C.vnpt }}>{inv.find(i => i.id === detail.id)?.qty}</div></div>
              <div><div style={{ fontSize: 11, color: C.muted }}>Ngưỡng tối thiểu</div><div style={{ fontSize: 24, fontWeight: 800, color: C.muted }}>{detail.min}</div></div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.body, marginBottom: 12 }}>Lịch sử điều chỉnh</div>
            {(inv.find(i => i.id === detail.id)?.logs || []).length === 0
              ? <div style={{ color: C.muted, fontSize: 13 }}>Chưa có lịch sử</div>
              : (inv.find(i => i.id === detail.id)?.logs || []).map((log, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${C.shade}` }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: log.action === 'import' ? C.successTx : C.accent }}>{log.action === 'import' ? '↑ Nhập kho' : '↓ Xuất kho'}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>bởi {log.by}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: log.action === 'import' ? C.success : C.accent }}>{log.qty}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{log.date}</div>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </DrawerPanel>
    </div>
  )
}

// ─── USERS ───────────────────────────────────────────────────────────────────
function UsersPage() {
  const [users, setUsers] = useState(USERS_DATA.filter(u => u.role === 'user'))
  const [statusFilter, setStatusFilter] = useState('all')
  const [detail, setDetail] = useState(null)

  const filtered = statusFilter === 'all' ? users : users.filter(u => u.status === statusFilter)
  const toggleBlock = (id) => setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'blocked' : 'active' } : u))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
        <FilterTabs options={[['all','Tất cả'],['active','Hoạt động'],['blocked','Đã khoá']]} value={statusFilter} onChange={setStatusFilter} />
        <div style={{ fontSize: 13, color: C.muted }}>Tổng: {users.length} khách hàng</div>
      </div>

      <Card>
        <Table headers={['Khách hàng', 'Email', 'SĐT', 'Số đơn', 'Tổng chi tiêu', 'Ngày tham gia', 'Trạng thái', '']}>
          {filtered.map((u, i) => (
            <TR key={u.id} striped={i % 2 !== 0} onClick={() => setDetail(u)}>
              <TD>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.vnptLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.vnpt, fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{u.name.split(' ').slice(-1)[0][0]}</div>
                  <span style={{ fontWeight: 700, color: C.body }}>{u.name}</span>
                </div>
              </TD>
              <TD muted>{u.email}</TD>
              <TD muted>{u.phone}</TD>
              <TD bold>{u.orders}</TD>
              <TD bold style={{ color: C.vnpt }}>{u.spent > 0 ? vnd(u.spent) : '—'}</TD>
              <TD muted>{u.joined}</TD>
              <TD><Badge label={u.status === 'active' ? 'Hoạt động' : 'Đã khoá'} bg={u.status === 'active' ? C.successBg : C.errorBg} color={u.status === 'active' ? C.successTx : C.errorTx} /></TD>
              <TD>
                <button onClick={e => { e.stopPropagation(); toggleBlock(u.id) }}
                  style={{ padding: '5px 12px', borderRadius: 99, border: `1px solid ${u.status === 'active' ? C.shade : C.vnpt}`, background: 'none', color: u.status === 'active' ? C.muted : C.vnpt, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  {u.status === 'active' ? 'Khoá' : 'Mở khoá'}
                </button>
              </TD>
            </TR>
          ))}
        </Table>
      </Card>

      <DrawerPanel open={!!detail} onClose={() => setDetail(null)} title="Thông tin khách hàng">
        {detail && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: C.vnptLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.vnpt, fontSize: 20, fontWeight: 800 }}>{detail.name.split(' ').slice(-1)[0][0]}</div>
              <div><div style={{ fontSize: 16, fontWeight: 800, color: C.body }}>{detail.name}</div><Badge label="Khách hàng" bg={C.cream} color={C.muted} /></div>
            </div>
            {[['Email', detail.email], ['SĐT', detail.phone], ['Ngày tham gia', detail.joined], ['Tổng đơn hàng', `${detail.orders} đơn`], ['Tổng chi tiêu', detail.spent > 0 ? vnd(detail.spent) : '—']].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.shade}`, fontSize: 13 }}>
                <span style={{ color: C.muted }}>{k}</span><span style={{ fontWeight: 700, color: C.body }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <Btn variant="outline" style={{ flex: 1 }}>Xem đơn hàng</Btn>
              <Btn variant="danger" style={{ flex: 1 }} onClick={() => toggleBlock(detail.id)}>
                {detail.status === 'active' ? 'Khoá tài khoản' : 'Mở khoá'}
              </Btn>
            </div>
          </div>
        )}
      </DrawerPanel>
    </div>
  )
}

// ─── STAFF MANAGEMENT ────────────────────────────────────────────────────────
function StaffPage() {
  const [staff, setStaff] = useState(STAFF_DATA)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })

  const handleAdd = () => {
    if (!form.name || !form.email) return
    setStaff(prev => [...prev, { id: Date.now(), ...form, joined: new Date().toLocaleDateString('vi-VN'), handledOrders: 0, status: 'active', lastLogin: '—' }])
    setModal(false); setForm({ name: '', email: '', phone: '', password: '' })
  }
  const handleToggle = (id) => setStaff(prev => prev.map(s => s.id === id ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s))
  const handleResetPw = (id) => alert(`Đã gửi email đặt lại mật khẩu cho nhân viên #${id}`)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Btn variant="primary" onClick={() => setModal(true)}>➕ Thêm nhân viên</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {staff.map(s => (
          <Card key={s.id} style={{ padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, paddingBottom: 16, borderBottom: `1px solid ${C.shade}` }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: C.vnptLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.vnpt, fontSize: 18, fontWeight: 800, flexShrink: 0 }}>
                {s.name.split(' ').slice(-1)[0][0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: C.body, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                <Badge label={s.status === 'active' ? 'Đang làm việc' : 'Ngưng hoạt động'} bg={s.status === 'active' ? C.successBg : C.errorBg} color={s.status === 'active' ? C.successTx : C.errorTx} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
              {[['📧', s.email], ['📞', s.phone], ['📅 Vào làm', s.joined], ['📦 Đơn đã xử lý', `${s.handledOrders} đơn`], ['🕐 Đăng nhập cuối', s.lastLogin]].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: C.muted }}>{k}</span>
                  <span style={{ fontWeight: 600, color: C.body }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn variant="ghost" size="sm" style={{ flex: 1 }} onClick={() => handleResetPw(s.id)}>🔑 Đặt lại mật khẩu</Btn>
              <Btn variant={s.status === 'active' ? 'danger' : 'outline'} size="sm" style={{ flex: 1 }} onClick={() => handleToggle(s.id)}>
                {s.status === 'active' ? 'Khoá' : 'Mở khoá'}
              </Btn>
            </div>
          </Card>
        ))}

        {/* Add card */}
        <div onClick={() => setModal(true)} style={{ border: `2px dashed ${C.shade}`, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 200, cursor: 'pointer', color: C.muted }}>
          <span style={{ fontSize: 36 }}>➕</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Thêm nhân viên mới</span>
        </div>
      </div>

      {modal && (
        <Modal title="Thêm nhân viên mới" onClose={() => setModal(false)}>
          <Input label="Họ và tên" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Nguyễn Văn A" required />
          <Input label="Email đăng nhập" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@vnpt.vn" type="email" required />
          <Input label="Số điện thoại" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="09xxxxxxxx" />
          <Input label="Mật khẩu tạm thời" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Tối thiểu 8 ký tự" type="password" />
          <div style={{ background: C.cream, borderRadius: 8, padding: 12, fontSize: 12, color: C.muted, marginBottom: 16 }}>
            💡 Nhân viên sẽ được yêu cầu đổi mật khẩu khi đăng nhập lần đầu.
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Btn variant="ghost" onClick={() => setModal(false)}>Huỷ</Btn>
            <Btn variant="primary" onClick={handleAdd} disabled={!form.name || !form.email}>Tạo tài khoản</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── BLOG ────────────────────────────────────────────────────────────────────
function BlogPage() {
  const [blogs, setBlogs] = useState(BLOGS_DATA)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ title: '', category: 'news', content: '' })

  const handlePublish = (isDraft) => {
    if (!form.title) return
    setBlogs(prev => [{ id: Date.now(), title: form.title, slug: form.title.toLowerCase().replace(/ /g, '-'), status: isDraft ? 'draft' : 'published', author: 'Admin', date: new Date().toLocaleDateString('vi-VN'), views: 0, category: form.category }, ...prev])
    setModal(false); setForm({ title: '', category: 'news', content: '' })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Btn variant="primary" onClick={() => setModal(true)}>✏️ Viết bài mới</Btn>
      </div>
      <Card>
        <Table headers={['Tiêu đề', 'Chuyên mục', 'Tác giả', 'Trạng thái', 'Lượt xem', 'Ngày đăng', '']}>
          {blogs.map((b, i) => (
            <TR key={b.id} striped={i % 2 !== 0}>
              <TD bold style={{ maxWidth: 300 }}>{b.title}</TD>
              <TD><Badge label={b.category === 'review' ? 'Review' : b.category === 'guide' ? 'Hướng dẫn' : 'Tin tức'} bg={C.vnptLight} color={C.vnpt} /></TD>
              <TD muted>{b.author}</TD>
              <TD><Badge label={b.status === 'published' ? '✓ Đã đăng' : '⬜ Nháp'} bg={b.status === 'published' ? C.successBg : C.surface} color={b.status === 'published' ? C.successTx : C.muted} /></TD>
              <TD muted>{b.views.toLocaleString()}</TD>
              <TD muted>{b.date}</TD>
              <TD>
                <div style={{ display: 'flex', gap: 10 }}>
                  <span style={{ color: C.vnpt, fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>Sửa</span>
                  <span style={{ color: C.accent, fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>Xoá</span>
                </div>
              </TD>
            </TR>
          ))}
        </Table>
      </Card>

      {modal && (
        <Modal title="Bài viết mới" onClose={() => setModal(false)} width={580}>
          <Input label="Tiêu đề bài viết" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Nhập tiêu đề hấp dẫn..." required />
          <Select label="Chuyên mục" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} options={[['news','Tin tức'],['review','Review sản phẩm'],['guide','Hướng dẫn'],['promo','Khuyến mãi']]} />
          <Textarea label="Nội dung bài viết" value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Nhập nội dung bài viết... (hỗ trợ Markdown)" rows={8} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Btn variant="ghost" onClick={() => setModal(false)}>Huỷ</Btn>
            <Btn variant="ghost" onClick={() => handlePublish(true)} disabled={!form.title}>Lưu nháp</Btn>
            <Btn variant="primary" onClick={() => handlePublish(false)} disabled={!form.title}>Đăng ngay</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── CONTACTS ────────────────────────────────────────────────────────────────
function ContactsPage() {
  const [contacts, setContacts] = useState(CONTACTS_DATA)
  const [selected, setSelected] = useState(null)
  const [reply, setReply] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? contacts : contacts.filter(c => c.status === filter)

  const handleSelect = (c) => { setSelected(c); setReply(''); if (c.status === 'new') setContacts(prev => prev.map(x => x.id === c.id ? { ...x, status: 'read' } : x)) }

  const handleReply = () => {
    if (!reply.trim() || !selected) return
    const r = reply
    setContacts(prev => prev.map(c => c.id === selected.id ? { ...c, reply: r, status: 'replied' } : c))
    setSelected(prev => ({ ...prev, reply: r, status: 'replied' }))
    setReply('')
  }

  const statusBadge = { new: { label: 'Mới', bg: '#dbeafe', color: '#1e40af' }, read: { label: 'Đã đọc', bg: C.cream, color: C.muted }, replied: { label: 'Đã trả lời', bg: C.successBg, color: C.successTx } }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, height: 'calc(100vh - 140px)', minHeight: 500 }}>
      {/* Inbox list */}
      <Card style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.shade}` }}>
          <FilterTabs options={[['all','Tất cả'],['new','Mới'],['read','Đã đọc'],['replied','Đã trả lời']]} value={filter} onChange={setFilter} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map(c => (
            <div key={c.id} onClick={() => handleSelect(c)}
              style={{ padding: '13px 16px', borderBottom: `1px solid ${C.shade}`, cursor: 'pointer', background: selected?.id === c.id ? C.vnptLight : c.status === 'new' ? '#f0f7ff' : C.canvas, transition: 'background .1s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: c.status === 'new' ? 800 : 600, fontSize: 13, color: C.body, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 6 }}>{c.name}</span>
                <Badge {...statusBadge[c.status]} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.body, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.subject}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{c.date}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Detail + reply */}
      <Card style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, flexDirection: 'column', gap: 10 }}>
            <span style={{ fontSize: 40 }}>💬</span>
            <span style={{ fontSize: 14 }}>Chọn một tin nhắn để xem nội dung</span>
          </div>
        ) : (
          <>
            <div style={{ padding: '16px 22px', borderBottom: `1px solid ${C.shade}` }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: C.body, marginBottom: 4 }}>{selected.subject}</div>
              <div style={{ fontSize: 13, color: C.muted }}>{selected.name} · {selected.email} · {selected.date}</div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Customer message */}
              <div>
                <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, marginBottom: 8 }}>📨 Từ khách hàng</div>
                <div style={{ background: C.cream, borderRadius: 12, padding: 16, fontSize: 14, color: C.body, lineHeight: 1.7 }}>{selected.msg}</div>
              </div>
              {/* Reply (if any) */}
              {selected.reply && (
                <div>
                  <div style={{ fontSize: 12, color: C.successTx, fontWeight: 700, marginBottom: 8 }}>✅ Phản hồi của bạn</div>
                  <div style={{ background: C.vnptLight, borderRadius: 12, padding: 16, fontSize: 14, color: C.body, lineHeight: 1.7, borderLeft: `4px solid ${C.vnpt}` }}>{selected.reply}</div>
                </div>
              )}
            </div>
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

// ─── REVIEWS ─────────────────────────────────────────────────────────────────
function ReviewsPage() {
  const [reviews, setReviews] = useState(REVIEWS_DATA)
  const [replies, setReplies] = useState({})
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? reviews : reviews.filter(r => filter === 'pending' ? !r.reply : filter === 'flagged' ? r.status === 'flagged' : r.status === filter)

  const handleReply = (id) => {
    const text = replies[id]?.trim()
    if (!text) return
    setReviews(prev => prev.map(r => r.id === id ? { ...r, reply: text, status: 'published' } : r))
    setReplies(p => ({ ...p, [id]: '' }))
  }

  const handleHide = (id) => setReviews(prev => prev.map(r => r.id === id ? { ...r, status: r.status === 'hidden' ? 'published' : 'hidden' } : r))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <FilterTabs options={[['all','Tất cả'],['pending','Chờ phản hồi'],['flagged','Cần duyệt'],['hidden','Đã ẩn']]} value={filter} onChange={setFilter} />
      {filtered.map(r => (
        <Card key={r.id} style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 800, color: C.body, fontSize: 14, marginBottom: 2 }}>{r.user}</div>
              <div style={{ fontSize: 12, color: C.muted }}>về <span style={{ fontWeight: 700, color: C.vnpt }}>{r.product}</span> · {r.date}</div>
              <div style={{ fontSize: 18, color: C.warning, marginTop: 6, letterSpacing: 2 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Badge label={r.reply ? 'Đã phản hồi' : r.status === 'flagged' ? '⚑ Cần duyệt' : 'Chờ phản hồi'}
                bg={r.reply ? C.successBg : r.status === 'flagged' ? C.errorBg : C.warningBg}
                color={r.reply ? C.successTx : r.status === 'flagged' ? C.errorTx : C.warningTx} />
              <button onClick={() => handleHide(r.id)} style={{ background: 'none', border: `1px solid ${C.shade}`, borderRadius: 99, padding: '3px 10px', fontSize: 11, color: C.muted, cursor: 'pointer', fontWeight: 700 }}>
                {r.status === 'hidden' ? '👁 Hiện' : '🚫 Ẩn'}
              </button>
            </div>
          </div>
          <div style={{ background: C.cream, borderRadius: 10, padding: '12px 16px', fontSize: 14, color: C.body, lineHeight: 1.7, marginBottom: 14, fontStyle: 'italic' }}>"{r.text}"</div>
          {r.reply ? (
            <div style={{ background: C.vnptLight, borderRadius: 10, padding: '10px 16px', fontSize: 13, color: C.vnptMid, borderLeft: `4px solid ${C.vnpt}` }}>
              <span style={{ fontWeight: 800, color: C.vnpt }}>Shop: </span>{r.reply}
            </div>
          ) : r.status !== 'hidden' && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <textarea value={replies[r.id] || ''} onChange={e => setReplies(p => ({ ...p, [r.id]: e.target.value }))} placeholder="Nhập phản hồi..." rows={2}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.shade}`, fontSize: 13, resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: C.body }} />
              </div>
              <Btn variant="primary" size="sm" onClick={() => handleReply(r.id)} disabled={!replies[r.id]?.trim()}>Gửi</Btn>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}

// ─── PROMOTIONS ──────────────────────────────────────────────────────────────
function PromotionsPage() {
  const [promos, setPromos] = useState(PROMOTIONS_DATA)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name: '', code: '', type: 'percent', value: '', minOrder: '', limit: '', from: '', to: '' })

  const handleAdd = () => {
    if (!form.name || !form.code) return
    setPromos(prev => [...prev, { id: Date.now(), ...form, value: +form.value, minOrder: +form.minOrder, limit: +form.limit, used: 0, status: 'active' }])
    setModal(false); setForm({ name: '', code: '', type: 'percent', value: '', minOrder: '', limit: '', from: '', to: '' })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Btn variant="accent" onClick={() => setModal(true)}>🏷️ Tạo khuyến mãi</Btn>
      </div>
      <Card>
        <Table headers={['Tên chương trình', 'Mã giảm', 'Loại giảm', 'Giá trị', 'Đơn tối thiểu', 'Đã dùng / Giới hạn', 'Thời gian', 'Trạng thái', '']}>
          {promos.map((p, i) => (
            <TR key={p.id} striped={i % 2 !== 0}>
              <TD bold>{p.name}</TD>
              <TD><code style={{ background: C.cream, border: `1px solid ${C.shade}`, padding: '2px 8px', borderRadius: 5, fontSize: 12, fontWeight: 800, color: C.body }}>{p.code}</code></TD>
              <TD muted>{p.type === 'percent' ? 'Phần trăm' : 'Số tiền'}</TD>
              <TD bold style={{ color: C.accent }}>{p.type === 'percent' ? `${p.value}%` : vnd(p.value)}</TD>
              <TD muted>{p.minOrder > 0 ? vnd(p.minOrder) : 'Không giới hạn'}</TD>
              <TD>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 700 }}>{p.used}</span>
                  <span style={{ color: C.muted }}>/</span>
                  <span style={{ color: C.muted }}>{p.limit}</span>
                  <div style={{ flex: 1, height: 4, background: C.shade, borderRadius: 2, minWidth: 60 }}>
                    <div style={{ width: `${Math.min(100, (p.used / p.limit) * 100)}%`, height: '100%', background: C.vnpt, borderRadius: 2 }} />
                  </div>
                </div>
              </TD>
              <TD muted style={{ fontSize: 12 }}>{p.from} → {p.to}</TD>
              <TD><Badge label={p.status === 'active' ? '🟢 Đang chạy' : '⬛ Kết thúc'} bg={p.status === 'active' ? C.successBg : C.surface} color={p.status === 'active' ? C.successTx : C.muted} /></TD>
              <TD><span style={{ color: C.accent, fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>Dừng</span></TD>
            </TR>
          ))}
        </Table>
      </Card>

      {modal && (
        <Modal title="Tạo chương trình khuyến mãi" onClose={() => setModal(false)} width={520}>
          <Input label="Tên chương trình" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Flash Sale mùa hè 2024" required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Mã giảm giá" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="SUMMER24" required />
            <Select label="Loại giảm" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} options={[['percent','Phần trăm (%)'],['amount','Số tiền (VNĐ)']]} />
            <Input label={form.type === 'percent' ? 'Mức giảm (%)' : 'Số tiền giảm (VNĐ)'} value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} placeholder={form.type === 'percent' ? '20' : '500000'} type="number" />
            <Input label="Đơn tối thiểu (VNĐ)" value={form.minOrder} onChange={e => setForm(p => ({ ...p, minOrder: e.target.value }))} placeholder="0 = không giới hạn" type="number" />
            <Input label="Giới hạn sử dụng" value={form.limit} onChange={e => setForm(p => ({ ...p, limit: e.target.value }))} placeholder="Số lượt tối đa" type="number" />
            <div />
            <Input label="Ngày bắt đầu" value={form.from} onChange={e => setForm(p => ({ ...p, from: e.target.value }))} type="date" />
            <Input label="Ngày kết thúc" value={form.to} onChange={e => setForm(p => ({ ...p, to: e.target.value }))} type="date" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Btn variant="ghost" onClick={() => setModal(false)}>Huỷ</Btn>
            <Btn variant="accent" onClick={handleAdd} disabled={!form.name || !form.code}>Tạo khuyến mãi</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── ANALYTICS ───────────────────────────────────────────────────────────────
function AnalyticsPage() {
  const monthly = [
    { m: 'T1', rev: 680, ord: 95 }, { m: 'T2', rev: 920, ord: 130 }, { m: 'T3', rev: 780, ord: 108 },
    { m: 'T4', rev: 1100, ord: 158 }, { m: 'T5', rev: 1050, ord: 145 }, { m: 'T6', rev: 1240, ord: 178 },
  ]
  const maxRev = Math.max(...monthly.map(d => d.rev))
  const topProducts = [
    { name: 'Gói 4G Flex 90GB',     sold: 412, rev: 76220000 },
    { name: 'Sim số đẹp 0909',      sold: 155, rev: 387500000 },
    { name: 'iPhone 16 Pro Max',    sold: 87,  rev: 2957130000 },
    { name: 'Gói 5G Pro 200GB',     sold: 98,  rev: 34300000 },
    { name: 'Samsung Galaxy S25',   sold: 43,  rev: 1246570000 },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard icon="💰" label="Doanh thu 6 tháng" value="5.77 tỷ" sub="↑ 23% vs 6 tháng trước" />
        <StatCard icon="📦" label="Tổng đơn hàng"     value="814"    sub="↑ 18% cùng kỳ" />
        <StatCard icon="🛍️" label="Giá trị đơn TB"    value="7.09M"  sub="↑ 4% so tháng trước" />
        <StatCard icon="↩️" label="Tỷ lệ hoàn/huỷ"   value="2.1%"   accentBg={C.successBg} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Bar chart */}
        <Card>
          <CardHeader title="Doanh thu theo tháng (triệu VNĐ)" />
          <div style={{ padding: '20px 24px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 160 }}>
              {monthly.map(d => (
                <div key={d.m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                  <div style={{ fontSize: 11, color: C.vnpt, fontWeight: 800 }}>{d.rev}M</div>
                  <div title={`${d.ord} đơn`} style={{ width: '100%', background: `linear-gradient(180deg, ${C.vnptMid}, ${C.vnpt})`, borderRadius: '6px 6px 0 0', height: `${(d.rev / maxRev) * 120}px`, minHeight: 8, cursor: 'default', position: 'relative' }} />
                  <div style={{ fontSize: 12, color: C.muted, fontWeight: 700 }}>{d.m}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{d.ord} đơn</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Category breakdown */}
        <Card>
          <CardHeader title="Doanh thu theo danh mục" />
          <div style={{ padding: '16px 20px' }}>
            {[['📱 Điện thoại', 68, C.vnpt], ['📶 Sim số', 15, C.vnptMid], ['🌐 Gói cước', 10, '#4a90d9'], ['🎧 Phụ kiện', 7, C.shade]].map(([label, pct, color]) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                  <span style={{ fontWeight: 600, color: C.body }}>{label}</span>
                  <span style={{ fontWeight: 800, color: C.vnpt }}>{pct}%</span>
                </div>
                <div style={{ height: 6, background: C.surface, borderRadius: 3 }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width .4s' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top products */}
      <Card>
        <CardHeader title="Top sản phẩm bán chạy" />
        <Table headers={['Hạng', 'Sản phẩm', 'Đã bán', 'Doanh thu']}>
          {topProducts.map((p, i) => (
            <TR key={i} striped={i % 2 !== 0}>
              <TD>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: i < 3 ? [C.warning, C.muted, '#cd7f32'][i] + '22' : C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: i < 3 ? [C.warning, C.muted, '#cd7f32'][i] : C.muted }}>
                  {i + 1}
                </div>
              </TD>
              <TD bold>{p.name}</TD>
              <TD muted>{p.sold.toLocaleString()}</TD>
              <TD bold style={{ color: C.vnpt }}>{vnd(p.rev)}</TD>
            </TR>
          ))}
        </Table>
      </Card>
    </div>
  )
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────
function SettingsPage() {
  const [store, setStore] = useState({ name: 'VNPT Shop', email: 'shop@vnpt.vn', phone: '1800 1166', address: '57 Huỳnh Thúc Kháng, Đống Đa, Hà Nội', tax: '0100109106', description: 'Cửa hàng điện thoại, sim số và dịch vụ viễn thông VNPT uy tín.' })
  const [saved, setSaved] = useState(false)

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2500) }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 900 }}>
      {/* Store info */}
      <Card style={{ padding: 24 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: C.body, marginBottom: 18, paddingBottom: 14, borderBottom: `1px solid ${C.shade}` }}>🏪 Thông tin cửa hàng</div>
        <Input label="Tên cửa hàng" value={store.name} onChange={e => setStore(p => ({ ...p, name: e.target.value }))} />
        <Input label="Email liên hệ" value={store.email} onChange={e => setStore(p => ({ ...p, email: e.target.value }))} type="email" />
        <Input label="Số điện thoại / Hotline" value={store.phone} onChange={e => setStore(p => ({ ...p, phone: e.target.value }))} />
        <Input label="Địa chỉ" value={store.address} onChange={e => setStore(p => ({ ...p, address: e.target.value }))} />
        <Input label="Mã số thuế" value={store.tax} onChange={e => setStore(p => ({ ...p, tax: e.target.value }))} />
        <Textarea label="Mô tả ngắn" value={store.description} onChange={e => setStore(p => ({ ...p, description: e.target.value }))} rows={3} />
        <Btn variant="primary" onClick={handleSave}>{saved ? '✓ Đã lưu' : 'Lưu thay đổi'}</Btn>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Shipping */}
        <Card style={{ padding: 24 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: C.body, marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${C.shade}` }}>🚚 Phí vận chuyển</div>
          {[['Phí giao hàng mặc định', '30,000 VNĐ'], ['Miễn phí từ đơn', '500,000 VNĐ'], ['Thời gian giao hàng', '2–5 ngày làm việc']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${C.shade}`, fontSize: 13 }}>
              <span style={{ color: C.muted }}>{k}</span>
              <span style={{ fontWeight: 700, color: C.body }}>{v}</span>
            </div>
          ))}
          <div style={{ marginTop: 14 }}><Btn variant="outline" size="sm">Chỉnh sửa</Btn></div>
        </Card>

        {/* Payment */}
        <Card style={{ padding: 24 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: C.body, marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${C.shade}` }}>💳 Phương thức thanh toán</div>
          {[['COD', true], ['VNPay', true], ['Ví MoMo', true], ['Chuyển khoản', true], ['Thẻ tín dụng', false]].map(([m, active]) => (
            <div key={m} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.shade}` }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.body }}>{m}</span>
              <Badge label={active ? 'Bật' : 'Tắt'} bg={active ? C.successBg : C.surface} color={active ? C.successTx : C.muted} />
            </div>
          ))}
        </Card>

        {/* Roles */}
        <Card style={{ padding: 24 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: C.body, marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${C.shade}` }}>🔐 Phân quyền hệ thống</div>
          {[['Admin', 'Toàn quyền quản trị', C.accent], ['Nhân viên', 'Xử lý đơn, tin nhắn, đánh giá', C.vnpt], ['Khách hàng', 'Mua hàng, đánh giá', C.muted]].map(([r, desc, color]) => (
            <div key={r} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.shade}`, alignItems: 'flex-start' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, marginTop: 5, flexShrink: 0 }} />
              <div><div style={{ fontSize: 13, fontWeight: 700, color: C.body }}>{r}</div><div style={{ fontSize: 12, color: C.muted }}>{desc}</div></div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT ADMIN PANEL
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminPanel() {
  const [page, setPage] = useState('dashboard')

  const renderPage = () => {
    switch (page) {
      case 'dashboard':  return <DashboardPage setPage={setPage} />
      case 'analytics':  return <AnalyticsPage />
      case 'orders':     return <OrdersPage />
      case 'promotions': return <PromotionsPage />
      case 'products':   return <ProductsPage />
      case 'categories': return <CategoriesPage />
      case 'inventory':  return <InventoryPage />
      case 'users':      return <UsersPage />
      case 'staff':      return <StaffPage />
      case 'blog':       return <BlogPage />
      case 'contacts':   return <ContactsPage />
      case 'reviews':    return <ReviewsPage />
      case 'settings':   return <SettingsPage />
      default:           return <DashboardPage setPage={setPage} />
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Be Vietnam Pro', Roboto, sans-serif", background: C.cream, color: C.body }}>
      <AdminSidebar active={page} setActive={setPage} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar page={page} setPage={setPage} />
        <main style={{ flex: 1, padding: 28, overflowY: 'auto' }}>
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
