import api from "./axiosInstance";

// ── AUTH ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
};

// ── PRODUCTS ─────────────────────────────────────────────────────────────────
export const productsApi = {
  getAll: (params) => api.get("/products", { params }),
  getAllForAdmin: (params) => api.get("/products/admin/list", { params }),
  getBySlug: (slug) => api.get(`/products/${slug}`),
  getById: (id) => api.get(`/products/${id}`),
  getRelated: (id) => api.get(`/products/${id}/related`),
  // Admin
  create: (data) => api.post("/products", data),
  update: (id, data) => api.put(`/products/${id}`, data),
  remove: (id) => api.delete(`/products/${id}`),
};

// ── PROMOTIONS ───────────────────────────────────────────────────────────────
export const promotionsApi = {
  getAll: () => api.get("/promotions"),
  getById: (id) => api.get(`/promotions/${id}`),
  getDiscountedProducts: (params) =>
    api.get("/promotions/discounted-products", { params }),
  // Admin
  create: (data) => api.post("/promotions", data),
  update: (id, data) => api.put(`/promotions/${id}`, data),
  remove: (id) => api.delete(`/promotions/${id}`),
};

// ── PRODUCT IMAGES (ADMIN) ───────────────────────────────────────────────────
export const productImagesApi = {
  getByProduct: (productId) => api.get(`/product-images/product/${productId}`),
  upload: (productId, files) => {
    const formData = new FormData();
    formData.append("product_id", productId);
    Array.from(files).forEach((file) => formData.append("images", file));
    return api.post("/product-images/upload", formData, {
      headers: { "Content-Type": undefined },
    });
  },
  remove: (id) => api.delete(`/product-images/${id}`),
  setThumbnail: (id, productId) =>
    api.patch(`/product-images/${id}/thumbnail`, { product_id: productId }),
};

// ── CATEGORIES ───────────────────────────────────────────────────────────────
// Backend: res.json({ data: [...] })
export const categoriesApi = {
  getAll: () =>
    api.get("/categories").then((res) => ({
      data: Array.isArray(res) ? res : res.data || [],
    })),
  // Admin
  create: (data) => api.post("/categories", data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  remove: (id) => api.delete(`/categories/${id}`),
};

// ── PRODUCT PROMOTIONS (ADMIN) — gán khuyến mãi cho sản phẩm ─────────────────
export const productPromotionsApi = {
  getAll: () => api.get("/product-promotions"),
  add: (data) => api.post("/product-promotions", data),
  remove: (id) => api.delete(`/product-promotions/${id}`),
};

// ── INVENTORY (ADMIN) ──────────────────────────────────────────────────────
export const inventoryApi = {
  getAll: (params) => api.get("/inventory", { params }),
  getLowStock: () => api.get("/inventory/low-stock"),
  getByProduct: (productId) => api.get(`/inventory/product/${productId}`),
  create: (data) => api.post("/inventory", data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  remove: (id) => api.delete(`/inventory/${id}`),
};

// ── INVENTORY LOGS (ADMIN) ─────────────────────────────────────────────────
export const inventoryLogApi = {
  getAll: (params) => api.get("/inventory-logs", { params }),
  getByInventory: (inventoryId) =>
    api.get(`/inventory-logs/inventory/${inventoryId}`),
  getByProduct: (productId) => api.get(`/inventory-logs/product/${productId}`),
};

// ── USERS (ADMIN) ───────────────────────────────────────────────────────────
export const adminUsersApi = {
  getAll: (params) => api.get("/users", { params }),
  create: (data) => api.post("/users", data),
  update: (id, data) => api.put(`/users/${id}`, data),
  remove: (id) => api.delete(`/users/${id}`),
};

// ── CART ─────────────────────────────────────────────────────────────────────
export const cartApi = {
  get: () => api.get("/cart"),
  addItem: (data) => api.post("/cart/items", data),
  updateItem: (itemId, data) => api.put(`/cart/items/${itemId}`, data),
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}`),
  clear: () => api.delete("/cart/clear"),
  toggleSelect: (itemId, data) =>
    api.patch(`/cart/toggle-select/${itemId}`, data),
  checkout: (data) => api.post("/cart/checkout", data),
};

// ── ORDERS ───────────────────────────────────────────────────────────────────
export const ordersApi = {
  preview: (data) => api.post("/orders/preview", data),
  // data có thể kèm user_id để admin/staff "lên đơn hộ" khách hàng
  // (backend tự nhận diện qua req.user.role, user_id sẽ bị bỏ qua nếu người gọi là user thường)
  create: (data) => api.post("/orders", data),
  getAll: (params) => api.get("/orders", { params }),
  // Staff: chỉ lấy đơn staff tự mua (vai trò khách) + đơn staff tạo hộ khách
  getStaffMine: (params) => api.get("/orders/staff/mine", { params }),
  getById: (id) => api.get(`/orders/${id}`),
  cancel: (id) => api.post(`/orders/${id}/cancel`),
  // Admin
  update: (id, data) => api.put(`/orders/${id}`, data),
  remove: (id) => api.delete(`/orders/${id}`),
  updatePaymentStatus: (id, payment_status) =>
    api.patch(`/orders/${id}/payment-status`, { payment_status }),
};

// ── FAVORITES ────────────────────────────────────────────────────────────────
export const favoritesApi = {
  getAll: () => api.get("/favorites"),
  add: (productId) => api.post("/favorites", { product_id: productId }),
  remove: (productId) => api.delete(`/favorites/${productId}`),
};

// ── REVIEWS ──────────────────────────────────────────────────────────────────
export const reviewsApi = {
  getFeatured: (limit) => api.get("/reviews/featured", { params: { limit } }),
  getByProduct: (productId) => api.get(`/reviews/product/${productId}`),
  create: (data) => api.post("/reviews", data),
  delete: (id) => api.delete(`/reviews/${id}`),
};

// ── BLOGS ────────────────────────────────────────────────────────────────────
export const blogsApi = {
  getAll: (params) => api.get("/blogs", { params }),
  getBySlug: (slug) => api.get(`/blogs/slug/${slug}`),
  // Admin
  create: (data) => api.post("/blogs", data),
  update: (id, data) => api.put(`/blogs/${id}`, data),
  remove: (id) => api.delete(`/blogs/${id}`),
};

// ── BLOG IMAGES (ADMIN) ──────────────────────────────────────────────────────
export const blogImagesApi = {
  // Upload ảnh thumbnail/ảnh trong bài viết — trả về { data: { image_url, ... } }
  upload: (file, blogId) => {
    const formData = new FormData();
    formData.append("image", file);
    if (blogId) formData.append("blog_id", blogId);
    return api.post("/blog-images/upload", formData, {
      headers: { "Content-Type": undefined },
    });
  },
};

// ── USER ─────────────────────────────────────────────────────────────────────
export const userApi = {
  getProfile: () => api.get("/user-profile"),
  updateProfile: (data) => api.put("/user-profile", data),
  // Upload avatar (multipart/form-data, field "avatar") — trả về { data: profile }
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return api.post("/user-profile/avatar", formData, {
      headers: { "Content-Type": undefined },
    });
  },
  getAddresses: () => api.get("/user-address"),
  // Admin/staff: lấy địa chỉ của MỘT khách hàng cụ thể (dùng khi lên đơn hộ khách)
  getAddressesByUserId: (userId) => api.get(`/user-address/user/${userId}`),
  addAddress: (data) => api.post("/user-address", data),
  updateAddress: (id, data) => api.put(`/user-address/${id}`, data),
  deleteAddress: (id) => api.delete(`/user-address/${id}`),
  setDefaultAddress: (id) => api.put(`/user-address/${id}/default`),
};

// ── CONTACT ──────────────────────────────────────────────────────────────────
export const contactApi = {
  send: (data) => api.post("/contacts", data),
  // Admin
  getAll: () => api.get("/contacts"),
  remove: (id) => api.delete(`/contacts/${id}`),
};

// ── PRODUCT DETAILS / THÔNG SỐ KỸ THUẬT (ADMIN) ─────────────────────────────
export const productDetailsApi = {
  getByProduct: (productId) => api.get(`/product-details/product/${productId}`),
  create: (data) => api.post("/product-details", data),
  update: (id, data) => api.put(`/product-details/${id}`, data),
  remove: (id) => api.delete(`/product-details/${id}`),
};

// ── STORES ───────────────────────────────────────────────────────────────────
export const storesApi = {
  getAll: () => api.get("/stores"),
};