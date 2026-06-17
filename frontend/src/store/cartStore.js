import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { cartApi } from '@/api'

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],          // [{ id, product_id, name, price, img, qty, variant }]
      coupon: null,       // { code, discount_type, discount_value }
      isLoading: false,

      // ── Computed ─────────────────────────────────────────────────────────
      get count() { return get().items.reduce((s, i) => s + i.qty, 0) },
      get subtotal() { return get().items.reduce((s, i) => s + i.price * i.qty, 0) },
      get discount() {
        const { coupon, subtotal } = get()
        if (!coupon) return 0
        if (coupon.discount_type === 'percent') return subtotal * coupon.discount_value / 100
        return Math.min(coupon.discount_value, subtotal)
      },
      get total() { return Math.max(0, get().subtotal - get().discount) },

      // ── Actions ──────────────────────────────────────────────────────────
      addItem: (product, qty = 1, variant = null) => {
        const items = get().items
        const key = `${product.id}-${variant || 'default'}`
        const existing = items.find(i => i.key === key)
        if (existing) {
          set({ items: items.map(i => i.key === key ? { ...i, qty: i.qty + qty } : i) })
        } else {
          set({
            items: [...items, {
              key,
              id: Date.now(),
              product_id: product.id,
              name: product.name,
              price: product.price,
              img: product.img,
              brand: product.brand,
              qty,
              variant,
            }]
          })
        }
      },

      updateQty: (key, qty) => {
        if (qty < 1) { get().removeItem(key); return }
        set({ items: get().items.map(i => i.key === key ? { ...i, qty } : i) })
      },

      removeItem: (key) => set({ items: get().items.filter(i => i.key !== key) }),

      clearCart: () => set({ items: [], coupon: null }),

      applyCoupon: (coupon) => set({ coupon }),

      removeCoupon: () => set({ coupon: null }),

      // ── Sync với API (khi user đã login) ─────────────────────────────────
      syncFromApi: async () => {
        set({ isLoading: true })
        try {
          const res = await cartApi.get()
          const items = (res.items || []).map(i => ({
            key: `${i.product_id}-${i.variant || 'default'}`,
            id: i.id,
            product_id: i.product_id,
            name: i.product?.name,
            price: i.product?.price,
            img: i.product?.img,
            brand: i.product?.brand,
            qty: i.quantity,
            variant: i.variant,
          }))
          set({ items, isLoading: false })
        } catch (_) {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'vnpt_cart',
      partialize: (state) => ({ items: state.items, coupon: state.coupon }),
    }
  )
)

export default useCartStore
