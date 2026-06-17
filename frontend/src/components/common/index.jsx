import { Link } from 'react-router-dom'
import { formatPrice, calcDiscount } from '@/utils'
import useCartStore from '@/store/cartStore'
import { toast } from '@/utils'

// ── ProductCard ───────────────────────────────────────────────────────────────
export function ProductCard({ product, showProgress = false }) {
  const addItem = useCartStore(s => s.addItem)
  const discount = calcDiscount(product.price, product.oldPrice || product.original_price)
  const pct = product.sold && product.stock ? Math.round(product.sold / product.stock * 100) : null

  const handleAdd = (e) => {
    e.preventDefault()
    addItem(product)
    toast.success(`Đã thêm ${product.name} vào giỏ!`)
  }

  return (
    <Link
      to={`/products/${product.slug}`}
      className="bg-white border border-shade rounded-xl overflow-hidden transition-all duration-250 hover:-translate-y-1 hover:shadow-lg hover:border-vnpt-light group block"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-cream flex items-center justify-center">
        <img
          src={product.img || product.thumbnail}
          alt={product.name}
          className="w-3/4 h-3/4 object-contain transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={e => { e.target.src = 'https://via.placeholder.com/200x200?text=No+Image' }}
        />
        {discount > 0 && (
          <span className="absolute top-2.5 left-2.5 bg-accent text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
            -{discount}%
          </span>
        )}
        <button
          onClick={e => { e.preventDefault(); /* toggle wishlist */ }}
          className="absolute top-2.5 right-2.5 w-7 h-7 bg-white rounded-full flex items-center justify-center border border-shade text-muted hover:text-accent hover:border-accent transition-all text-base"
        >
          🤍
        </button>
      </div>

      {/* Info */}
      <div className="p-3.5">
        <div className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1">{product.brand}</div>
        <div className="text-sm font-semibold text-body leading-snug mb-2 min-h-[38px] line-clamp-2">{product.name}</div>

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-1 mb-2 text-xs">
            <span className="text-warning">{'⭐'.repeat(Math.round(product.rating))}</span>
            <span className="text-muted ml-1">({product.reviews?.toLocaleString() || 0})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 flex-wrap mb-2.5">
          <span className="text-lg font-bold text-accent font-display">{formatPrice(product.price)}</span>
          {(product.oldPrice || product.original_price) && (
            <span className="text-xs text-muted line-through">{formatPrice(product.oldPrice || product.original_price)}</span>
          )}
        </div>

        {/* Progress bar */}
        {showProgress && pct !== null && (
          <>
            <div className="h-1 bg-shade rounded-sm mb-1.5">
              <div className="h-full bg-accent rounded-sm transition-all" style={{ width: `${pct}%` }}/>
            </div>
            <div className="text-[11px] text-muted mb-2.5">Đã bán {product.sold}/{product.stock}</div>
          </>
        )}

        <button
          onClick={handleAdd}
          className="w-full py-2.5 bg-vnpt text-white rounded-full text-sm font-semibold hover:bg-vnpt-dark transition-colors"
        >
          Mua ngay
        </button>
      </div>
    </Link>
  )
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────
export function Breadcrumb({ items }) {
  return (
    <div className="bg-cream border-b border-shade px-10 py-3">
      <div className="max-w-[1200px] mx-auto flex items-center gap-2 text-sm text-muted">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span>›</span>}
            {item.to ? (
              <Link to={item.to} className="text-vnpt hover:underline">{item.label}</Link>
            ) : (
              <span>{item.label}</span>
            )}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── LoadingSpinner ────────────────────────────────────────────────────────────
export function LoadingSpinner({ text = 'Đang tải...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-10 h-10 border-4 border-vnpt-light border-t-vnpt rounded-full animate-spin"/>
      <p className="text-muted text-sm">{text}</p>
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="text-6xl">{icon}</div>
      <h3 className="text-xl font-bold text-body">{title}</h3>
      {desc && <p className="text-muted max-w-sm">{desc}</p>}
      {action}
    </div>
  )
}

// ── SectionHead ───────────────────────────────────────────────────────────────
export function SectionHead({ label, title, sub }) {
  return (
    <div className="text-center mb-11">
      {label && <div className="text-xs font-bold tracking-[2px] uppercase text-vnpt mb-2">{label}</div>}
      <h2 className="font-display text-[34px] font-bold text-body mb-3">{title}</h2>
      {sub && <p className="text-muted max-w-[520px] mx-auto text-sm leading-relaxed">{sub}</p>}
    </div>
  )
}

// ── TrustBand ─────────────────────────────────────────────────────────────────
export function TrustBand() {
  const items = [
    { icon: '🚚', title: 'Giao hàng nhanh 2H', sub: 'Miễn phí trong nội thành' },
    { icon: '🛡️', title: 'Hàng chính hãng 100%', sub: 'Bảo hành theo hãng' },
    { icon: '🔄', title: 'Đổi trả trong 7 ngày', sub: 'Không cần lý do' },
    { icon: '📞', title: 'Hỗ trợ 24/7', sub: '1800 1234 miễn phí' },
  ]
  return (
    <div className="bg-vnpt py-8 px-10">
      <div className="max-w-[1200px] mx-auto grid grid-cols-4 gap-6">
        {items.map(({ icon, title, sub }) => (
          <div key={title} className="flex items-center gap-3.5 text-white">
            <div className="w-11 h-11 bg-white/12 rounded-[10px] flex items-center justify-center text-xl flex-shrink-0">{icon}</div>
            <div>
              <div className="text-sm font-bold mb-0.5">{title}</div>
              <div className="text-xs text-white/65">{sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── CountdownTimer ────────────────────────────────────────────────────────────
export function CountdownTimer({ h, m, s }) {
  return (
    <div className="flex items-center gap-2">
      {[h, m, s].map((val, i) => (
        <span key={i} className="flex items-center gap-2">
          <span className="bg-accent text-white px-3.5 py-2 rounded-lg text-xl font-bold font-display min-w-[52px] text-center">{val}</span>
          {i < 2 && <span className="text-white text-xl font-bold">:</span>}
        </span>
      ))}
    </div>
  )
}

// ── ProtectedRoute ────────────────────────────────────────────────────────────
import { Navigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore'

export function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}
