import { useState } from 'react'

// ─── Badge ──────────────────────────────────────────────────────────────────
const BADGE_TONES = {
  success: 'bg-success/10 text-green-700',
  warning: 'bg-warning/10 text-amber-700',
  error:   'bg-error/10 text-red-700',
  info:    'bg-vnpt-light text-vnpt',
  muted:   'bg-cream text-muted',
}
export function Badge({ label, tone = 'muted', children }) {
  return (
    <span className={`inline-block whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-bold ${BADGE_TONES[tone] || BADGE_TONES.muted}`}>
      {label ?? children}
    </span>
  )
}

// ─── Button ─────────────────────────────────────────────────────────────────
const BTN_VARIANTS = {
  primary: 'bg-vnpt text-white hover:bg-vnpt-dark',
  accent:  'bg-accent text-white hover:bg-accent-dark',
  outline: 'bg-canvas text-vnpt border border-vnpt hover:bg-vnpt-light',
  ghost:   'bg-transparent text-muted border border-shade hover:bg-cream',
  danger:  'bg-error/10 text-red-700 border border-red-200 hover:bg-error/20',
}
const BTN_SIZES = {
  sm: 'px-3.5 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3 text-[15px]',
}
export function Btn({ children, onClick, variant = 'primary', size = 'md', disabled = false, type = 'button', className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap
        ${BTN_VARIANTS[variant]} ${BTN_SIZES[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {children}
    </button>
  )
}

// ─── Form fields ────────────────────────────────────────────────────────────
export function Field({ label, required, children }) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-[13px] font-semibold text-body mb-1.5">
          {label}{required && <span className="text-accent"> *</span>}
        </label>
      )}
      {children}
    </div>
  )
}

const inputBase = 'w-full px-3.5 py-2.5 rounded-lg border border-shade text-sm text-body outline-none focus:border-vnpt transition-colors bg-canvas font-body'

export function Input({ label, required, ...props }) {
  return (
    <Field label={label} required={required}>
      <input className={inputBase} {...props} />
    </Field>
  )
}

export function Select({ label, required, options = [], ...props }) {
  return (
    <Field label={label} required={required}>
      <select className={inputBase} {...props}>
        {options.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
      </select>
    </Field>
  )
}

export function Textarea({ label, required, rows = 4, ...props }) {
  return (
    <Field label={label} required={required}>
      <textarea rows={rows} className={`${inputBase} resize-vertical`} {...props} />
    </Field>
  )
}

// ─── Card ───────────────────────────────────────────────────────────────────
export function Card({ children, className = '' }) {
  return <div className={`bg-canvas border border-shade rounded-xl ${className}`}>{children}</div>
}

export function CardHeader({ title, action }) {
  return (
    <div className="px-5 py-4 border-b border-shade flex items-center justify-between">
      <h3 className="text-[15px] font-bold text-body m-0">{title}</h3>
      {action}
    </div>
  )
}

export function StatCard({ icon, label, value, sub, tone = 'info' }) {
  const iconBg = { info: 'bg-vnpt-light', warning: 'bg-warning/10', error: 'bg-error/10', success: 'bg-success/10' }[tone]
  return (
    <Card className="p-5 flex gap-3.5 items-start">
      <div className={`w-11 h-11 rounded-[10px] ${iconBg} flex items-center justify-center text-xl flex-shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-xs text-muted mb-0.5">{label}</div>
        <div className="text-[22px] font-bold text-body font-display leading-none">{value}</div>
        {sub && <div className="text-[11px] text-success font-semibold mt-1">{sub}</div>}
      </div>
    </Card>
  )
}

// ─── Modal ──────────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children, width = 'max-w-[480px]' }) {
  return (
    <div className="fixed inset-0 bg-vnpt-dark/55 z-[200] flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={`bg-canvas rounded-2xl w-full ${width} max-h-[90vh] flex flex-col shadow-2xl`}>
        <div className="px-6 pt-5 pb-4 border-b border-shade flex justify-between items-center flex-shrink-0">
          <h3 className="text-base font-bold text-body m-0">{title}</h3>
          <button onClick={onClose} className="bg-transparent border-none text-xl cursor-pointer text-muted leading-none">✕</button>
        </div>
        <div className="px-6 pt-5 pb-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

// ─── Table ──────────────────────────────────────────────────────────────────
export function Table({ headers, children, loading, empty }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="bg-cream">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-2.5 text-left text-muted font-bold text-xs whitespace-nowrap border-b border-shade">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={headers.length} className="py-10 text-center text-muted text-sm">Đang tải...</td></tr>
          ) : children}
          {!loading && empty && (
            <tr><td colSpan={headers.length} className="py-10 text-center text-muted text-sm">{empty}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export function TR({ children, onClick, striped }) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-shade transition-colors ${onClick ? 'cursor-pointer hover:bg-vnpt-light' : ''} ${striped ? 'bg-cream/60' : 'bg-canvas'}`}
    >
      {children}
    </tr>
  )
}

export function TD({ children, className = '', muted, bold }) {
  return <td className={`px-4 py-3 ${muted ? 'text-muted' : 'text-body'} ${bold ? 'font-bold' : ''} ${className}`}>{children}</td>
}

// ─── Filter tabs ────────────────────────────────────────────────────────────
export function FilterTabs({ options, value, onChange }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map(([key, label, count]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer
            ${value === key ? 'bg-vnpt border-vnpt text-white' : 'bg-canvas border-shade text-muted hover:border-vnpt'}`}
        >
          {label}{count !== undefined ? ` (${count})` : ''}
        </button>
      ))}
    </div>
  )
}

// ─── Drawer ─────────────────────────────────────────────────────────────────
export function DrawerPanel({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/20 z-[90]" />
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] bg-canvas shadow-2xl z-[91] flex flex-col">
        <div className="px-6 py-4 border-b border-shade flex justify-between items-center flex-shrink-0">
          <h3 className="text-[15px] font-bold text-body m-0">{title}</h3>
          <button onClick={onClose} className="bg-transparent border-none text-xl cursor-pointer text-muted">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </>
  )
}

// ─── Pagination (compact, for admin tables) ─────────────────────────────────
export function AdminPagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 py-5">
      <button onClick={() => onChange(page - 1)} disabled={page <= 1}
        className="px-3 h-8 border border-shade rounded-lg text-xs text-muted hover:border-vnpt hover:text-vnpt disabled:opacity-40 disabled:cursor-not-allowed">‹ Trước</button>
      <span className="text-xs text-muted font-semibold px-2">Trang {page} / {totalPages}</span>
      <button onClick={() => onChange(page + 1)} disabled={page >= totalPages}
        className="px-3 h-8 border border-shade rounded-lg text-xs text-muted hover:border-vnpt hover:text-vnpt disabled:opacity-40 disabled:cursor-not-allowed">Sau ›</button>
    </div>
  )
}

export function useToggle(init = false) {
  const [v, setV] = useState(init)
  return [v, () => setV(s => !s), setV]
}
