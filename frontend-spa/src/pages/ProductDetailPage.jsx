import { useState, useEffect, useRef } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { useProduct, useRelatedProducts, useReviews } from '../hooks/index.js'
import { Breadcrumb, LoadingSpinner, EmptyState, ProductCard, StarRating } from '../components/common/index.jsx'
import { formatPrice, formatDate, toast, resolveImageUrl } from '../utils/index.js'
import { reviewsApi } from '../api/index.js'
import useCartStore from '../store/cartStore.js'
import useAuthStore from '../store/authStore.js'

const TABS = [
  { id: 'desc',    label: 'Mô tả sản phẩm' },
  { id: 'specs',   label: 'Thông số kỹ thuật' },
  { id: 'reviews', label: 'Đánh giá' },
]

export default function ProductDetailPage() {
  const { slug } = useParams()
  const { data: product, loading, error } = useProduct(slug)
  const { data: related } = useRelatedProducts(product?.id)
  const { data: reviews, loading: reviewsLoading, reload: reloadReviews } = useReviews(product?.id)

  const cartItems = useCartStore(s => s.items)
  const addItem  = useCartStore(s => s.addItem)
  const syncing  = useCartStore(s => s.syncing)
  const { isAuthenticated, user } = useAuthStore()

  const { hash } = useLocation()
  const tabsRef = useRef(null)

  const [qty, setQty]               = useState(1)
  const [activeTab, setActiveTab]   = useState(() => hash === '#reviews' ? 'reviews' : 'desc')
  const [activeImg, setActiveImg]   = useState(0)

  // Auto-scroll to reviews tab when navigated with #reviews hash
  useEffect(() => {
    if (hash === '#reviews' && product) {
      setActiveTab('reviews')
      const id = setTimeout(() => {
        tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
      return () => clearTimeout(id)
    }
  }, [hash, product])

  // Review form
  const [rating, setRating]         = useState(0)
  const [comment, setComment]       = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) return <LoadingSpinner />
  if (error || !product) return (
    <EmptyState
      icon="😢"
      title="Không tìm thấy sản phẩm"
      action={<Link to="/products" className="px-6 py-2.5 bg-vnpt text-white rounded-full text-sm font-bold">Quay lại</Link>}
    />
  )

  const images = product.images || []
  const mainImg = resolveImageUrl(images[activeImg]?.image_url || product.img || product.thumbnail || product.image_url || null)
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : 0

  const handleAdd = async () => {
    if (!isAuthenticated) { toast.error('Vui lòng đăng nhập để thêm vào giỏ'); return }
    const stock = product.stock ?? null
    if (product.is_available === false || (stock !== null && stock === 0)) {
      toast.error('Sản phẩm hiện đã hết hàng')
      return
    }
    if (stock !== null) {
      const inCart = cartItems.find(i => i.product_id === product.id)?.qty ?? 0
      const remaining = stock - inCart
      if (qty > remaining) {
        if (remaining <= 0) {
          toast.error(`Bạn đã thêm tối đa số lượng trong kho (${stock} sản phẩm)`)
        } else {
          toast.error(`Chỉ có thể thêm ${remaining} sản phẩm nữa (kho còn ${stock}, giỏ đã có ${inCart})`)
        }
        return
      }
    }
    try {
      await addItem(product, qty)
      toast.success('Đã thêm vào giỏ hàng! 🛒')
    } catch (err) {
      toast.error(err.message || 'Không thể thêm vào giỏ hàng')
    }
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!rating) { toast.error('Vui lòng chọn số sao đánh giá'); return }
    setSubmitting(true)
    try {
      await reviewsApi.create({ product_id: product.id, rating, comment })
      toast.success('Đã gửi đánh giá!')
      setRating(0)
      setComment('')
      reloadReviews()
    } catch (err) {
      toast.error(err.message || 'Gửi đánh giá thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  const myReview = reviews.find(r => String(r.user_id) === String(user?.id))

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return
    try {
      await reviewsApi.delete(reviewId)
      toast.success('Đã xóa đánh giá')
      reloadReviews()
    } catch (err) {
      toast.error(err.message || 'Xóa đánh giá thất bại')
    }
  }

  return (
    <div>
      <Breadcrumb items={[
        { to: '/', label: 'Trang chủ' },
        { to: '/products', label: 'Sản phẩm' },
        { label: product.name },
      ]} />

      <div className="max-w-[1200px] mx-auto px-10 py-8">
        {/* ── MAIN DETAIL ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-14 items-start mb-16">

          {/* Gallery */}
          <div className="sticky top-24">
            <div className="aspect-square rounded-[20px] bg-cream border border-shade flex items-center justify-center overflow-hidden mb-4">
              {mainImg ? (
                <img
                  src={mainImg}
                  alt={product.name}
                  className="w-3/4 h-3/4 object-contain"
                  onError={e => { e.target.src = 'https://placehold.co/400x400?text=No+Image' }}
                />
              ) : (
                <div className="text-8xl">📦</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`aspect-square rounded-lg border-2 overflow-hidden bg-cream flex items-center justify-center transition-colors ${
                      i === activeImg ? 'border-vnpt' : 'border-shade hover:border-vnpt-light'
                    }`}
                  >
                    <img src={resolveImageUrl(img.image_url)} alt="" className="w-full h-full object-contain p-2" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {product.brand && (
              <div className="text-xs text-vnpt font-bold uppercase tracking-wider mb-2">{product.brand} · Chính hãng VN/A</div>
            )}
            <h1 className="font-display text-2xl font-bold text-body leading-snug mb-3">{product.name}</h1>

            {/* Rating summary */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-warning font-bold">{avgRating}</span>
                <span className="text-warning">{'★'.repeat(Math.round(avgRating))}</span>
                <span className="text-sm text-muted">({reviews.length} đánh giá)</span>
              </div>
            )}

            {/* Price */}
            {(() => {
              const salePrice = product.sale_price ?? product.price
              const originalPrice = product.original_price ?? salePrice
              const hasDiscount = originalPrice > salePrice
              const discountPercent = hasDiscount
                ? product.discount_percent || Math.round((1 - salePrice / originalPrice) * 100)
                : 0
              const discount = discountPercent > 0 ? discountPercent : 0

              return (
                <div className="flex items-center gap-3 flex-wrap mb-6">
                  <span className="text-4xl font-bold text-accent font-display">{formatPrice(salePrice)}</span>
                  {hasDiscount && (
                    <span className="text-base text-muted line-through">{formatPrice(originalPrice)}</span>
                  )}
                  {discount > 0 && (
                    <span className="text-sm font-bold bg-accent/10 text-accent px-2 py-1 rounded">
                      -{discount}%
                    </span>
                  )}
                </div>
              )
            })()}

            {/* Policies */}
            <div className="grid grid-cols-2 gap-2.5 mb-6">
              {[
                ['🚚','Giao hàng 2H','Miễn phí nội thành'],
                ['🛡️','Bảo hành 12 tháng','Chính hãng'],
                ['🔄','Đổi trả 7 ngày','Không cần lý do'],
                ['💳','Trả góp 0%','Đến 24 tháng'],
              ].map(([icon, t, s]) => (
                <div key={t} className="flex items-center gap-2.5 p-3 bg-cream rounded-lg">
                  <span className="text-lg">{icon}</span>
                  <div>
                    <div className="text-xs font-bold text-body">{t}</div>
                    <div className="text-[11px] text-muted">{s}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stock status */}
            <div className="mb-4">
              {product.is_available !== false ? (
                <span className="text-sm text-success font-semibold">
                  ✓ Còn hàng
                  {product.stock > 0 && product.stock <= 10 && (
                    <span className="ml-2 text-warning font-semibold">
                      (còn {product.stock} sản phẩm)
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-sm text-accent font-semibold">✕ Hết hàng</span>
              )}
            </div>

            {/* Quantity */}
            {(() => {
              const stock = product.stock ?? null
              const inCart = cartItems.find(i => i.product_id === product.id)?.qty ?? 0
              const remaining = stock !== null ? Math.max(0, stock - inCart) : 999
              return (
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-sm font-semibold text-body">Số lượng:</span>
                  <div className="flex items-center border border-shade rounded-lg overflow-hidden">
                    <button
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                      disabled={qty <= 1}
                      className="w-9 h-9 bg-cream text-lg hover:bg-vnpt-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >−</button>
                    <span className="w-12 text-center text-sm font-bold border-x border-shade h-9 flex items-center justify-center">{qty}</span>
                    <button
                      onClick={() => setQty(q => Math.min(remaining, q + 1))}
                      disabled={qty >= remaining || remaining === 0}
                      className="w-9 h-9 bg-cream text-lg hover:bg-vnpt-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      title={qty >= remaining
                        ? (inCart > 0 ? `Giỏ đã có ${inCart}, kho còn ${stock}` : `Tối đa ${stock} sản phẩm`)
                        : ''}
                    >+</button>
                  </div>
                  {stock !== null && remaining <= 10 && remaining > 0 && (
                    <span className="text-xs text-warning font-medium">
                      {inCart > 0
                        ? `Còn thêm được ${remaining} SP (giỏ đã có ${inCart})`
                        : `Còn ${remaining} SP trong kho`}
                    </span>
                  )}
                  {remaining === 0 && inCart > 0 && (
                    <span className="text-xs text-accent font-medium">Đã đạt giới hạn tồn kho</span>
                  )}
                </div>
              )
            })()}

            {/* Actions */}
            {(() => {
              const isOutOfStock = product.is_available === false || (product.stock !== null && product.stock !== undefined && product.stock === 0)
              return (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleAdd}
                    disabled={isOutOfStock || syncing}
                    className="py-4 bg-vnpt text-white rounded-full font-bold text-base hover:bg-vnpt-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {syncing ? '⏳ Đang thêm...' : '🛒 Thêm vào giỏ'}
                  </button>
                  <button
                    disabled={isOutOfStock}
                    className="py-4 bg-accent text-white rounded-full font-bold text-base hover:bg-accent-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={async (e) => {
                      if (isOutOfStock) return
                      if (!isAuthenticated) { toast.error('Vui lòng đăng nhập'); return }
                      await addItem(product, qty)
                      window.location.href = '/checkout'
                    }}
                  >
                    ⚡ Mua ngay
                  </button>
                </div>
              )
            })()}
          </div>
        </div>

        {/* ── TABS ─────────────────────────────────────────────────────────── */}
        <div className="mb-16" ref={tabsRef}>
          <div className="flex border-b border-shade mb-7">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-6 py-3.5 text-sm font-semibold border-b-2 -mb-px transition-all ${
                  activeTab === id ? 'border-vnpt text-vnpt' : 'border-transparent text-muted hover:text-body'
                }`}
              >
                {label}
                {id === 'reviews' && reviews.length > 0 && (
                  <span className="ml-1.5 bg-vnpt-light text-vnpt text-xs px-1.5 py-0.5 rounded-full">{reviews.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* Mô tả */}
          {activeTab === 'desc' && (
            <div className="prose max-w-none text-sm text-muted leading-relaxed">
              {product.description
                ? <p style={{overflowWrap:"anywhere",whiteSpace:"pre-wrap"}}>{product.description}</p>
                : <p className="text-muted italic">Chưa có mô tả sản phẩm.</p>
              }
            </div>
          )}

          {/* Thông số */}
          {activeTab === 'specs' && (
            <div>
              {product.details && product.details.length > 0 ? (
                <table className="w-full text-sm border border-shade rounded-xl overflow-hidden">
                  <tbody>
                    {product.details.map((d, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-surface' : 'bg-cream'}>
                        <td className="py-3 px-5 font-semibold text-body w-1/3 border-r border-shade">{d.detail_name}</td>
                        <td className="py-3 px-5 text-body">{d.detail_value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted italic text-sm">Chưa có thông số kỹ thuật.</p>
              )}
            </div>
          )}

          {/* Đánh giá */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {/* Summary */}
              {reviews.length > 0 && (
                <div className="bg-cream rounded-xl p-6 flex items-center gap-8 mb-6">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-body font-display">{avgRating}</div>
                    <div className="text-warning text-xl mt-1">{'★'.repeat(Math.round(avgRating))}</div>
                    <div className="text-xs text-muted mt-1">{reviews.length} đánh giá</div>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[5,4,3,2,1].map(star => {
                      const count = reviews.filter(r => r.rating === star).length
                      const pct = Math.round(count / reviews.length * 100)
                      return (
                        <div key={star} className="flex items-center gap-2 text-sm">
                          <span className="w-4 text-muted">{star}</span>
                          <span className="text-warning text-xs">★</span>
                          <div className="flex-1 h-2 bg-shade rounded-full overflow-hidden">
                            <div className="h-full bg-warning rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-8 text-muted text-right">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Form gửi đánh giá */}
              {isAuthenticated ? (
                myReview ? null : (
                <form onSubmit={handleSubmitReview} className="bg-white border border-shade rounded-xl p-6">
                  <h3 className="text-base font-bold text-body mb-4">Viết đánh giá của bạn</h3>
                  <div className="mb-4">
                    <label className="text-sm font-semibold text-body block mb-2">Đánh giá sao *</label>
                    <StarRating value={rating} onChange={setRating} />
                  </div>
                  <div className="mb-4">
                    <label className="text-sm font-semibold text-body block mb-1.5">Nhận xét</label>
                    <textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      rows={4}
                      placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                      className="w-full px-4 py-3 border border-shade rounded-lg text-sm font-body outline-none focus:border-vnpt resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-vnpt text-white rounded-full text-sm font-bold hover:bg-vnpt-dark transition-colors disabled:opacity-60"
                  >
                    {submitting ? 'Đang gửi...' : '📤 Gửi đánh giá'}
                  </button>
                </form>
                )
              ) : (
                <div className="bg-vnpt-light rounded-xl p-6 text-center">
                  <p className="text-sm text-muted mb-3">Đăng nhập để viết đánh giá</p>
                  <Link to="/login" className="px-5 py-2 bg-vnpt text-white rounded-full text-sm font-bold">Đăng nhập</Link>
                </div>
              )}

              {/* Danh sách đánh giá */}
              {reviewsLoading ? (
                <LoadingSpinner text="Đang tải đánh giá..." />
              ) : reviews.length === 0 ? (
                <p className="text-muted text-sm text-center py-8">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map(r => (
                    <div key={r.id} className="bg-white border border-shade rounded-xl p-5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-vnpt-light text-vnpt flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden">
                            {r.user_avatar
                              ? <img src={resolveImageUrl(r.user_avatar)} alt={r.user_name} className="w-full h-full object-cover" onError={e => { e.currentTarget.replaceWith(Object.assign(document.createElement('span'), { textContent: r.user_name?.charAt(0)?.toUpperCase() || 'U' })) }} />
                              : (r.user_name?.charAt(0)?.toUpperCase() || 'U')
                            }
                          </div>
                          <span className="text-sm font-semibold text-body">{r.user_name || 'Khách hàng'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted">{formatDate(r.created_at)}</span>
                          {String(r.user_id) === String(user?.id) && (
                            <button
                              onClick={() => handleDeleteReview(r.id)}
                              className="text-xs text-accent hover:text-red-700 font-semibold transition-colors"
                              title="Xóa đánh giá"
                            >
                              🗑 Xóa
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="text-warning text-sm mb-2">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                      {r.comment && <p className="text-sm text-muted leading-relaxed">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RELATED PRODUCTS ─────────────────────────────────────────────── */}
        {related.length > 0 && (
          <div>
            <h2 className="font-display text-2xl font-bold text-body mb-6">Sản phẩm liên quan</h2>
            <div className="grid grid-cols-4 gap-4">
              {related.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}