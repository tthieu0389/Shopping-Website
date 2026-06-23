import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // [{ key, id, product_id, name, price, img, qty }]

      get count() {
        return get().items.reduce((s, i) => s + i.qty, 0)
      },
      get subtotal() {
        return get().items.reduce((s, i) => s + i.price * i.qty, 0)
      },
      get total() {
        return get().subtotal
      },

      addItem: (product, qty = 1) => {
        const items = get().items
        const key = `${product.id}`
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
              price: Number(product.price),
              img: product.img || product.thumbnail || product.image_url || null,
              brand: product.brand || '',
              qty,
            }]
          })
        }
      },

      updateQty: (key, qty) => {
        if (qty < 1) { get().removeItem(key); return }
        set({ items: get().items.map(i => i.key === key ? { ...i, qty } : i) })
      },

      removeItem: (key) => set({ items: get().items.filter(i => i.key !== key) }),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'vnpt_cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
)

export default useCartStore
