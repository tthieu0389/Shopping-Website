import { create } from 'zustand'
import { cartApi } from '../api/index.js'

// Cart store — single source of truth là DB.
// localStorage KHÔNG còn được dùng để lưu items.
// Items chỉ được lấy từ server qua fetchCart().

const useCartStore = create((set, get) => ({
  items: [],      // [{ id, product_id, name, price, img, brand, qty }]
  loading: false,
  syncing: false, // true khi đang gọi add/update/remove

  count:    () => get().items.reduce((s, i) => s + i.qty, 0),
  subtotal: () => get().items.reduce((s, i) => s + i.price * i.qty, 0),
  total:    () => get().subtotal(),

  // ── Lấy giỏ hàng từ server ───────────────────────────────────────────────
  fetchCart: async () => {
    set({ loading: true })
    try {
      const res = await cartApi.get()
      const serverItems = res?.data?.items ?? []
      const baseItems = serverItems.map(item => ({
        id:           item.id,
        product_id:   item.product_id,
        name:         item.product_name,
        price:        Number(item.unit_price ?? item.final_price ?? item.base_price ?? 0),
        img:          item.image_url ?? item.thumbnail ?? item.img ?? null,
        brand:        item.brand ?? '',
        qty:          item.quantity,
        stock:        null,       // sẽ được bổ sung bên dưới
        is_available: true,       // mặc định true, sẽ override sau
      }))

      set({ items: baseItems, loading: false })

      // Bổ sung stock + is_available từ products API
      if (baseItems.length > 0) {
        const { productsApi } = await import('../api/index.js')
        const stockMap = {}
        await Promise.all(
          baseItems.map(item =>
            productsApi.getById(item.product_id)
              .then(res => {
                const p = res?.data ?? res
                stockMap[item.product_id] = {
                  stock:        p?.stock        ?? null,
                  is_available: p?.is_available !== false && p?.is_available !== 0,
                }
              })
              .catch(() => {})
          )
        )
        set({
          items: get().items.map(i => ({
            ...i,
            ...(stockMap[i.product_id] ?? {}),
          }))
        })
      }
    } catch {
      set({ loading: false })
    }
  },

  // ── Thêm sản phẩm ────────────────────────────────────────────────────────
  addItem: async (product, qty = 1) => {
    set({ syncing: true })
    try {
      await cartApi.addItem({ product_id: product.id, quantity: qty })
      await get().fetchCart()
    } catch (err) {
      // Lấy message từ backend (vd: "Chỉ còn X sản phẩm trong kho")
      const msg = err?.response?.data?.message || err?.message || 'Không thể thêm vào giỏ'
      const error = new Error(msg)
      throw error
    } finally {
      set({ syncing: false })
    }
  },

  // ── Cập nhật số lượng ────────────────────────────────────────────────────
  // cartItemId = item.id (cart_item id từ DB, không phải product_id)
  updateQty: async (cartItemId, qty) => {
    if (qty < 1) { get().removeItem(cartItemId); return }
    // Optimistic update
    set({ items: get().items.map(i => i.id === cartItemId ? { ...i, qty } : i) })
    set({ syncing: true })
    try {
      await cartApi.updateItem(cartItemId, { quantity: qty })
    } catch {
      // Rollback khi lỗi
      await get().fetchCart()
    } finally {
      set({ syncing: false })
    }
  },

  // ── Xoá một sản phẩm ─────────────────────────────────────────────────────
  removeItem: async (cartItemId) => {
    // Optimistic update
    set({ items: get().items.filter(i => i.id !== cartItemId) })
    set({ syncing: true })
    try {
      await cartApi.removeItem(cartItemId)
    } catch {
      await get().fetchCart()
    } finally {
      set({ syncing: false })
    }
  },

  // ── Xoá toàn bộ giỏ (gọi sau checkout thành công) ────────────────────────
  clearCart: async () => {
    set({ items: [] })
    try { await cartApi.clear() } catch { /* ignore */ }
  },

  // ── Xoá chỉ các item đã đặt hàng, giữ lại phần còn lại ──────────────────
  removeSelectedItems: async (cartItemIds) => {
    set({ items: get().items.filter(i => !cartItemIds.includes(i.id)) })
    try {
      await Promise.all(cartItemIds.map(id => cartApi.removeItem(id)))
    } catch {
      await get().fetchCart()
    }
  },

  // ── Đánh dấu is_selected=true cho các item trước khi checkout ─────────────
  // itemIds: mảng cart_item id cần select. Nếu không truyền → select tất cả.
  selectItemsForCheckout: async (itemIds) => {
    const ids = itemIds ?? get().items.map(i => i.id)
    if (ids.length === 0) return
    await Promise.all(
      ids.map(id => cartApi.toggleSelect(id, { is_selected: true }))
    )
  },
}))

export default useCartStore