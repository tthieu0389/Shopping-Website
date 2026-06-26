import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Breadcrumb, EmptyState } from '../components/common/index.jsx'
import { formatPrice } from '../utils/index.js'
import useCartStore from '../store/cartStore.js'

export default function CartPage() {
  const { items, updateQty, removeItem, fetchCart, loading, syncing } = useCartStore()
  const navigate = useNavigate()

  // IDs của cart_item được chọn (dùng item.id)
  const [selectedIds, setSelectedIds] = useState(new Set())

  useEffect(() => { fetchCart() }, [])

  // Khi items load xong, mặc định chọn tất cả
  useEffect(() => {
    if (items.length > 0) {
      setSelectedIds(new Set(items.map(i => i.id)))
    }
  }, [items.length])

  const toggleItem = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const allChecked = items.length > 0 && items.every(i => selectedIds.has(i.id))
  const toggleAll = () => {
    setSelectedIds(allChecked ? new Set() : new Set(items.map(i => i.id)))
  }

  const selectedItems = items.filter(i => selectedIds.has(i.id))
  const selectedCount = selectedItems.reduce((s, i) => s + i.qty, 0)
  const selectedTotal = selectedItems.reduce((s, i) => s + i.price * i.qty, 0)

  const handleCheckout = () => {
    if (selectedItems.length === 0) return
    // Lưu danh sách item đã chọn để CheckoutPage đọc
    sessionStorage.setItem('checkout_items', JSON.stringify(selectedItems.map(i => i.id)))
    navigate('/checkout')
  }

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-10 py-20 text-center text-muted">
        ⏳ Đang tải giỏ hàng...
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-[1200px] mx-auto px-10 py-20">
        <EmptyState
          icon="🛒"
          title="Giỏ hàng trống"
          desc="Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm"
          action={
            <Link to="/products" className="px-7 py-3 bg-vnpt text-white rounded-full font-bold text-sm">
              Mua sắm ngay
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div>
      <Breadcrumb items={[{ to: '/', label: 'Trang chủ' }, { label: 'Giỏ hàng' }]} />

      <div className="max-w-[1200px] mx-auto px-10 py-8">
        <h1 className="font-display text-3xl font-bold text-body mb-6">
          Giỏ hàng{' '}
          <span className="text-lg text-muted font-normal">
            ({items.reduce((s, i) => s + i.qty, 0)} sản phẩm)
          </span>
        </h1>

        <div className="grid grid-cols-[1fr_360px] gap-7 items-start">

          {/* ── CART ITEMS ──────────────────────────────────────────────── */}
          <div className="bg-white border border-shade rounded-xl overflow-hidden">
            {/* Header */}
            <div className="hidden md:grid grid-cols-[32px_2fr_1fr_1fr_1fr_40px] px-5 py-3.5 bg-cream text-xs font-bold text-muted uppercase tracking-wider border-b border-shade items-center gap-2">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={toggleAll}
                className="accent-vnpt w-4 h-4 cursor-pointer"
                title="Chọn tất cả"
              />
              <span>Sản phẩm</span>
              <span>Đơn giá</span>
              <span>Số lượng</span>
              <span>Thành tiền</span>
              <span />
            </div>

            {items.map(item => {
              const checked = selectedIds.has(item.id)
              return (
                <div
                  key={item.id}
                  className={`grid grid-cols-[32px_2fr_1fr_1fr_1fr_40px] px-5 py-4 border-b border-shade last:border-none items-center gap-2 transition-colors ${checked ? '' : 'opacity-50'}`}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleItem(item.id)}
                    className="accent-vnpt w-4 h-4 cursor-pointer"
                  />

                  {/* Product */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-[70px] h-[70px] rounded-lg bg-cream border border-shade flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.img ? (
                        <img
                          src={item.img}
                          alt={item.name}
                          className="w-full h-full object-contain p-2"
                          onError={e => { e.target.src = 'https://placehold.co/70x70?text=📦' }}
                        />
                      ) : (
                        <span className="text-2xl">📦</span>
                      )}
                    </div>
                    <div>
                      <Link
                        to={`/products/${item.product_id}`}
                        className="text-sm font-semibold text-body hover:text-vnpt transition-colors line-clamp-2"
                      >
                        {item.name}
                      </Link>
                      {item.brand && <div className="text-xs text-muted mt-0.5">{item.brand}</div>}
                    </div>
                  </div>

                  {/* Unit price */}
                  <div className="text-sm font-semibold text-body">{formatPrice(item.price)}</div>

                  {/* Quantity */}
                  <div className="flex items-center border border-shade rounded-lg overflow-hidden w-fit">
                    <button
                      onClick={() => updateQty(item.id, item.qty - 1)}
                      disabled={syncing}
                      className="w-8 h-8 bg-cream text-base hover:bg-vnpt-light transition-colors disabled:opacity-50"
                    >−</button>
                    <span className="w-10 text-center text-sm font-bold border-x border-shade h-8 flex items-center justify-center">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      disabled={syncing}
                      className="w-8 h-8 bg-cream text-base hover:bg-vnpt-light transition-colors disabled:opacity-50"
                    >+</button>
                  </div>

                  {/* Subtotal */}
                  <div className="text-base font-bold text-accent">{formatPrice(item.price * item.qty)}</div>

                  {/* Remove */}
                  <button
                    onClick={() => {
                      removeItem(item.id)
                      setSelectedIds(prev => { const n = new Set(prev); n.delete(item.id); return n })
                    }}
                    disabled={syncing}
                    className="w-8 h-8 rounded-lg hover:bg-red-50 hover:text-accent transition-all text-muted text-lg flex items-center justify-center disabled:opacity-50"
                    title="Xoá khỏi giỏ"
                  >
                    🗑
                  </button>
                </div>
              )
            })}

            {/* Footer */}
            <div className="flex justify-between items-center px-5 py-4 bg-cream">
              <Link to="/products" className="text-sm text-vnpt font-semibold hover:underline">
                ← Tiếp tục mua hàng
              </Link>
              <span className="text-xs text-muted">
                Đã chọn {selectedItems.length}/{items.length} sản phẩm
              </span>
            </div>
          </div>

          {/* ── ORDER SUMMARY ────────────────────────────────────────────── */}
          <div className="bg-white border border-shade rounded-xl p-6 sticky top-24">
            <div className="text-base font-bold text-body mb-5 pb-4 border-b border-shade">
              Tóm tắt đơn hàng
            </div>

            <div className="space-y-3 text-sm mb-5">
              <div className="flex justify-between">
                <span className="text-muted">Tạm tính ({selectedCount} sản phẩm)</span>
                <span className="font-semibold">{formatPrice(selectedTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Phí vận chuyển</span>
                <span className="text-muted italic text-xs">Tính khi thanh toán</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t-2 border-shade mb-5">
              <span className="text-base font-bold text-body">Tổng cộng</span>
              <span className="text-2xl font-bold text-accent font-display">{formatPrice(selectedTotal)}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={selectedItems.length === 0}
              className="block w-full py-4 bg-accent text-white rounded-full font-bold text-base text-center hover:bg-accent-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ⚡ Thanh toán ngay {selectedItems.length > 0 && `(${selectedItems.length})`}
            </button>

            <div className="flex justify-center gap-2 mt-4">
              {['MOMO', 'VNPAY', 'VISA', 'COD'].map(p => (
                <span key={p} className="bg-cream border border-shade rounded px-2 py-1 text-[11px] text-muted font-semibold">{p}</span>
              ))}
            </div>
            <p className="text-center text-xs text-muted mt-3">🔒 Thanh toán SSL 256-bit an toàn</p>
          </div>
        </div>
      </div>
    </div>
  )
}