import { create } from "zustand";
import { cartApi } from "../api/index.js";

// Cart store — single source of truth là DB.
// localStorage KHÔNG còn được dùng để lưu items.
// Items chỉ được lấy từ server qua fetchCart().

const useCartStore = create((set, get) => ({
  items: [], // [{ id, product_id, name, price, img, brand, qty }]
  loading: false,
  syncing: false, // true khi đang gọi add/update/remove

  count: () => get().items.reduce((s, i) => s + i.qty, 0),
  subtotal: () => get().items.reduce((s, i) => s + i.price * i.qty, 0),
  total: () => get().subtotal(),

  // ── Lấy giỏ hàng từ server ───────────────────────────────────────────────
  // BE (getCartItems) đã tính sẵn is_available + stock chính xác cho từng item.
  // KHÔNG gọi lại productsApi — vừa dư thừa (N+1 request), vừa dễ lệch dữ liệu
  // (race condition), vừa sai vì API sản phẩm đơn lẻ không trả field "stock".
  fetchCart: async () => {
    set({ loading: true });
    try {
      const res = await cartApi.get();
      const serverItems = res?.data?.items ?? [];
      const items = serverItems.map((item) => {
        const quantity = item.quantity ?? 1;
        const unitPrice = Number(item.unit_price ?? 0);
        // Giá sau giảm mỗi đơn vị: ưu tiên final_price (đã áp discount) chia cho quantity
        const salePrice =
          item.final_price !== undefined
            ? Number(item.final_price) / quantity
            : unitPrice;
        return {
          id: item.id,
          product_id: item.product_id,
          name: item.product_name,
          price: salePrice,
          originalPrice: unitPrice > salePrice ? unitPrice : null,
          img: item.image_url ?? item.thumbnail ?? item.img ?? null,
          brand: item.brand ?? "",
          qty: quantity,
          // BE đã tính chính xác — tin hoàn toàn, không gọi lại API sản phẩm
          stock: item.stock ?? null,
          is_available: item.is_available !== false && item.is_available !== 0,
        };
      });
      set({ items, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  // ── Thêm sản phẩm ────────────────────────────────────────────────────────
  addItem: async (product, qty = 1) => {
    // Kiểm tra stock phía client: tính cả số lượng đã có trong giỏ
    const stock = product.stock ?? null;
    if (stock !== null) {
      const existing = get().items.find((i) => i.product_id === product.id);
      const currentQty = existing?.qty ?? 0;
      if (currentQty + qty > stock) {
        const remaining = Math.max(0, stock - currentQty);
        const msg =
          remaining === 0
            ? `Bạn đã thêm tối đa số lượng trong kho (${stock} sản phẩm)`
            : `Chỉ có thể thêm ${remaining} sản phẩm nữa (kho còn ${stock}, giỏ đã có ${currentQty})`;
        throw new Error(msg);
      }
    }
    set({ syncing: true });
    try {
      await cartApi.addItem({ product_id: product.id, quantity: qty });
      await get().fetchCart();
    } catch (err) {
      // Lấy message từ backend (vd: "Chỉ còn X sản phẩm trong kho")
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể thêm vào giỏ";
      throw new Error(msg);
    } finally {
      set({ syncing: false });
    }
  },

  // ── Cập nhật số lượng ────────────────────────────────────────────────────
  // cartItemId = item.id (cart_item id từ DB, không phải product_id)
  updateQty: async (cartItemId, qty) => {
    if (qty < 1) {
      get().removeItem(cartItemId);
      return;
    }
    // Kiểm tra stock phía client trước khi gọi API
    const item = get().items.find((i) => i.id === cartItemId);
    if (item?.stock != null && qty > item.stock) {
      const { toast } = await import("../utils/index.js");
      toast.error(`Chỉ còn ${item.stock} sản phẩm trong kho`);
      return;
    }
    // Optimistic update
    set({
      items: get().items.map((i) => (i.id === cartItemId ? { ...i, qty } : i)),
    });
    set({ syncing: true });
    try {
      await cartApi.updateItem(cartItemId, { quantity: qty });
    } catch {
      // Rollback khi lỗi
      await get().fetchCart();
    } finally {
      set({ syncing: false });
    }
  },

  // ── Xoá một sản phẩm ─────────────────────────────────────────────────────
  removeItem: async (cartItemId) => {
    // Optimistic update
    set({ items: get().items.filter((i) => i.id !== cartItemId) });
    set({ syncing: true });
    try {
      await cartApi.removeItem(cartItemId);
    } catch {
      await get().fetchCart();
    } finally {
      set({ syncing: false });
    }
  },

  // ── Xoá toàn bộ giỏ (gọi sau checkout thành công) ────────────────────────
  clearCart: async () => {
    set({ items: [] });
    try {
      await cartApi.clear();
    } catch {
      /* ignore */
    }
  },

  // ── Xoá chỉ các item đã đặt hàng, giữ lại phần còn lại ──────────────────
  removeSelectedItems: async (cartItemIds) => {
    set({ items: get().items.filter((i) => !cartItemIds.includes(i.id)) });
    try {
      await Promise.all(cartItemIds.map((id) => cartApi.removeItem(id)));
    } catch {
      await get().fetchCart();
    }
  },

  // ── Đánh dấu is_selected=true cho các item trước khi checkout ─────────────
  // itemIds: mảng cart_item id cần select. Nếu không truyền → select tất cả.
  selectItemsForCheckout: async (itemIds) => {
    const ids = itemIds ?? get().items.map((i) => i.id);
    if (ids.length === 0) return;
    await Promise.all(
      ids.map((id) => cartApi.toggleSelect(id, { is_selected: true })),
    );
  },
}));

export default useCartStore;