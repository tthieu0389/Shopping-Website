import { useState, useEffect, useRef, Children } from "react";

// ─── Badge ──────────────────────────────────────────────────────────────────
const BADGE_TONES = {
  success: "bg-success/10 text-green-700",
  warning: "bg-warning/10 text-amber-700",
  error: "bg-error/10 text-red-700",
  info: "bg-vnpt-light text-vnpt",
  muted: "bg-cream text-muted",
};
export function Badge({ label, tone = "muted", children }) {
  return (
    <span
      className={`inline-block whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-bold ${BADGE_TONES[tone] || BADGE_TONES.muted}`}
    >
      {label ?? children}
    </span>
  );
}

// ─── Button ─────────────────────────────────────────────────────────────────
const BTN_VARIANTS = {
  primary: "bg-vnpt text-white hover:bg-vnpt-dark",
  accent: "bg-accent text-white hover:bg-accent-dark",
  outline: "bg-canvas text-vnpt border border-vnpt hover:bg-vnpt-light",
  ghost: "bg-transparent text-muted border border-shade hover:bg-cream",
  danger: "bg-error/10 text-red-700 border border-red-200 hover:bg-error/20",
};
const BTN_SIZES = {
  sm: "px-3.5 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3 text-[15px]",
};
export function Btn({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  type = "button",
  className = "",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap
        ${BTN_VARIANTS[variant]} ${BTN_SIZES[size]}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}
    >
      {children}
    </button>
  );
}

// ─── Form fields ────────────────────────────────────────────────────────────
export function Field({ label, required, children }) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-[13px] font-semibold text-body mb-1.5">
          {label}
          {required && <span className="text-accent"> *</span>}
        </label>
      )}
      {children}
    </div>
  );
}

const inputBase =
  "w-full px-3.5 py-2.5 rounded-lg border border-shade text-sm text-body outline-none focus:border-vnpt transition-colors bg-canvas font-body";

export function Input({ label, required, ...props }) {
  return (
    <Field label={label} required={required}>
      <input className={inputBase} {...props} />
    </Field>
  );
}

// Dropdown tùy biến cho form field — thay cho <select> gốc vì trình duyệt
// không cho bo góc phần list của native select. Cùng kiểu bo góc/màu sắc với
// SelectPill (dùng cho filter) nhưng full-width và có label giống Input.
// Giữ nguyên API (value, onChange nhận event giả `{ target: { value } }`,
// options dạng [value, label]) để không phải sửa nơi gọi.
export function Select({ label, required, options = [], value, onChange, disabled, className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(([v]) => String(v) === String(value));
  const selectedLabel = selected ? selected[1] : (options[0]?.[1] ?? "");

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handlePick = (v) => {
    onChange?.({ target: { value: v } });
    setOpen(false);
  };

  return (
    <Field label={label} required={required}>
      <div ref={ref} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          className={`${inputBase} flex items-center justify-between gap-2 text-left ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}
        >
          <span className="truncate">{selectedLabel}</span>
          <svg
            className={`w-4 h-4 text-muted flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-1.5 w-full bg-canvas border border-shade rounded-xl shadow-md z-50 overflow-hidden max-h-60 overflow-y-auto">
            {options.map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => handlePick(v)}
                className={`w-full text-left px-3.5 py-2.5 text-sm transition-colors whitespace-nowrap
                  ${String(v) === String(value) ? "bg-vnpt-light text-vnpt font-bold" : "text-body hover:bg-cream"}`}
              >
                {l}
              </button>
            ))}
          </div>
        )}
      </div>
    </Field>
  );
}

export function Textarea({ label, required, rows = 4, ...props }) {
  return (
    <Field label={label} required={required}>
      <textarea
        rows={rows}
        className={`${inputBase} resize-vertical`}
        {...props}
      />
    </Field>
  );
}

// ─── Card ───────────────────────────────────────────────────────────────────
export function Card({ children, className = "" }) {
  return (
    <div className={`bg-canvas border border-shade rounded-xl ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, action }) {
  return (
    <div className="px-5 py-4 border-b border-shade flex items-center justify-between">
      <h3 className="text-[15px] font-bold text-body m-0">{title}</h3>
      {action}
    </div>
  );
}

export function StatCard({ icon, label, value, sub, tone = "info" }) {
  const iconBg = {
    info: "bg-vnpt-light",
    warning: "bg-warning/10",
    error: "bg-error/10",
    success: "bg-success/10",
  }[tone];
  return (
    <Card className="p-5 flex gap-3.5 items-start">
      <div
        className={`w-11 h-11 rounded-[10px] ${iconBg} flex items-center justify-center text-xl flex-shrink-0`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted mb-0.5">{label}</div>
        <div className="text-[22px] font-bold text-body font-display leading-none">
          {value}
        </div>
        {sub && (
          <div className="text-[11px] text-success font-semibold mt-1">
            {sub}
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Modal ──────────────────────────────────────────────────────────────────
// maxWidth (tuỳ chọn): giá trị CSS thuần (vd "min(92vw, 620px)") áp bằng inline
// style — luôn ăn ngay lập tức, không phụ thuộc việc Tailwind/HMR có cập nhật
// kịp class hay không. Vẫn co giãn mượt theo màn hình nhờ đơn vị vw.
export function Modal({
  title,
  onClose,
  children,
  width = "max-w-[480px]",
  maxWidth,
}) {
  return (
    <div
      className="fixed inset-0 bg-vnpt-dark/55 z-[200] flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-canvas rounded-2xl w-full ${width} max-h-[90vh] flex flex-col shadow-2xl`}
        style={maxWidth ? { maxWidth } : undefined}
      >
        <div className="px-6 pt-5 pb-4 border-b border-shade flex justify-between items-center flex-shrink-0">
          <h3 className="text-base font-bold text-body m-0">{title}</h3>
          <button
            onClick={onClose}
            className="bg-transparent border-none text-xl cursor-pointer text-muted leading-none"
          >
            ✕
          </button>
        </div>
        <div className="px-6 pt-5 pb-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ─── Table ──────────────────────────────────────────────────────────────────
// colWidths: array of CSS width strings per column, e.g. ["220px","120px",...]
// Providing colWidths locks column widths via <colgroup> so filters/data changes
// never cause columns to shift or reflow.
export function Table({ headers, children, loading, empty, colWidths }) {
  const hasRows = Children.count(children) > 0;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px] table-fixed">
        {colWidths && (
          <colgroup>
            {colWidths.map((w, i) => (
              <col key={i} style={{ width: w, minWidth: w }} />
            ))}
          </colgroup>
        )}
        <thead>
          <tr className="bg-cream">
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-4 py-2.5 text-left text-muted font-bold text-xs whitespace-nowrap border-b border-shade overflow-hidden"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={headers.length}
                className="py-10 text-center text-muted text-sm"
              >
                Đang tải...
              </td>
            </tr>
          ) : hasRows ? (
            children
          ) : (
            empty && (
              <tr>
                <td
                  colSpan={headers.length}
                  className="py-10 text-center text-muted text-sm"
                >
                  {empty}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

export function TR({ children, onClick, striped }) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-shade transition-colors ${onClick ? "cursor-pointer hover:bg-vnpt-light" : ""} ${striped ? "bg-cream/60" : "bg-canvas"}`}
    >
      {children}
    </tr>
  );
}

export function TD({ children, className = "", muted, bold, noTruncate }) {
  return (
    <td
      className={`px-4 py-3 ${muted ? "text-muted" : "text-body"} ${bold ? "font-bold" : ""} ${noTruncate ? "" : "overflow-hidden"} ${className}`}
    >
      {/* Inner wrapper truncates long text so it never pushes the column wider */}
      <div className={noTruncate ? "" : "truncate"}>{children}</div>
    </td>
  );
}

// ─── Search input ───────────────────────────────────────────────────────────
// Ô tìm kiếm chuẩn dùng chung cho mọi trang admin: icon kính lúp bên trong,
// bo tròn pill, viền đổi màu vnpt khi focus. Truyền value/defaultValue,
// onChange, placeholder như input bình thường; wrapperClassName chỉnh độ
// rộng/flex của khối bọc ngoài (vd "w-64 flex-shrink-0" hoặc
// "flex-1 min-w-[220px]").
export function SearchInput({
  icon = "🔍",
  className = "",
  wrapperClassName = "w-64 flex-shrink-0",
  ...props
}) {
  return (
    <div className={`relative ${wrapperClassName}`}>
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none">
        {icon}
      </span>
      <input
        type="text"
        className={`w-full pl-9 pr-4 py-2 rounded-full border border-shade text-sm outline-none focus:border-vnpt transition-colors bg-canvas ${className}`}
        {...props}
      />
    </div>
  );
}

// ─── Select pill (custom dropdown bo tròn) ─────────────────────────────────
// Dùng thay cho <select> gốc khi cần list bo góc đầy đủ (native <select>
// không cho phép bo góc phần list). Dùng chung cho các bộ lọc dạng dropdown
// trên mọi trang admin để đồng bộ với thanh tìm kiếm.
export function SelectPill({ value, onChange, options, icon }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selectedLabel = options.find(([val]) => val === value)?.[1] ?? value;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 cursor-pointer rounded-full border border-shade bg-canvas text-sm font-semibold outline-none transition-colors hover:border-vnpt px-4 py-2 pr-3 whitespace-nowrap"
      >
        {icon && <span className="text-sm">{icon}</span>}
        <span className="text-body">{selectedLabel}</span>
        <svg
          className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-canvas border border-shade rounded-xl shadow-md z-50 overflow-hidden min-w-full">
          {options.map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => {
                onChange(val);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors whitespace-nowrap
                ${val === value ? "bg-vnpt-light text-vnpt font-bold" : "text-body hover:bg-cream"}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Toolbar ────────────────────────────────────────────────────────────────
// Thanh công cụ chuẩn cho đầu mỗi trang admin: search/filter bên trái, hành
// động chính (vd nút Thêm) bên phải. Dùng để mọi trang admin có cùng bố cục,
// khoảng cách và cách xuống dòng khi màn hình hẹp.
export function Toolbar({ children, actions }) {
  return (
    <div className="flex justify-between items-center flex-wrap gap-3">
      <div className="flex items-center gap-2.5 flex-wrap">{children}</div>
      {actions && <div className="flex items-center gap-2.5 flex-shrink-0">{actions}</div>}
    </div>
  );
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
            ${value === key ? "bg-vnpt border-vnpt text-white" : "bg-canvas border-shade text-muted hover:border-vnpt"}`}
        >
          {label}
          {count !== undefined ? ` (${count})` : ""}
        </button>
      ))}
    </div>
  );
}

// ─── Drawer ─────────────────────────────────────────────────────────────────
// width (tuỳ chọn): class Tailwind cho chiều rộng ở breakpoint sm trở lên,
// vd "sm:w-[560px]". Mặc định giữ nguyên 400px như trước để không ảnh hưởng
// các chỗ đang dùng DrawerPanel khác.
export function DrawerPanel({
  open,
  onClose,
  title,
  children,
  width = "sm:w-[400px]",
}) {
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/20 z-[90]" />
      <div
        className={`fixed right-0 top-0 bottom-0 w-full ${width} bg-canvas shadow-2xl z-[91] flex flex-col`}
      >
        <div className="px-6 py-4 border-b border-shade flex justify-between items-center flex-shrink-0">
          <h3 className="text-[15px] font-bold text-body m-0">{title}</h3>
          <button
            onClick={onClose}
            className="bg-transparent border-none text-xl cursor-pointer text-muted"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </>
  );
}

// ─── Pagination (compact, for admin tables) ─────────────────────────────────
// Sinh danh sách số trang để hiển thị, có dấu "…" khi nhiều trang
// VD: trang 1/10 -> [1, 2, 3, '…', 10] | trang 6/10 -> [1, '…', 5, 6, 7, '…', 10]
function getPageNumbers(page, totalPages) {
  const pages = [];
  const add = (v) => pages.push(v);
  const siblings = 1;

  add(1);
  const start = Math.max(2, page - siblings);
  const end = Math.min(totalPages - 1, page + siblings);

  if (start > 2) add("…");
  for (let i = start; i <= end; i++) add(i);
  if (end < totalPages - 1) add("…");
  if (totalPages > 1) add(totalPages);

  return pages;
}

const pageBtnBase =
  "h-8 min-w-8 px-2.5 rounded-lg text-xs font-semibold transition-colors disabled:cursor-not-allowed";

export function AdminPagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = getPageNumbers(page, totalPages);

  return (
    <div className="sticky bottom-0 -mx-7 px-7 bg-cream/95 backdrop-blur-sm border-t border-shade flex items-center justify-center gap-1.5 py-3.5">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className={`${pageBtnBase} border border-shade text-muted bg-canvas hover:border-vnpt hover:text-vnpt disabled:opacity-40`}
      >
        ‹
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span
            key={`ellipsis-${i}`}
            className="w-8 text-center text-xs text-muted select-none"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            disabled={p === page}
            className={`${pageBtnBase} border ${
              p === page
                ? "bg-vnpt border-vnpt text-white"
                : "border-shade text-muted bg-canvas hover:border-vnpt hover:text-vnpt"
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className={`${pageBtnBase} border border-shade text-muted bg-canvas hover:border-vnpt hover:text-vnpt disabled:opacity-40`}
      >
        ›
      </button>
    </div>
  );
}

export function useToggle(init = false) {
  const [v, setV] = useState(init);
  return [v, () => setV((s) => !s), setV];
}