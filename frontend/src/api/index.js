// ── AUTH ─────────────────────────────────────────────────────────────────────
import api from './axiosInstance'

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh'),
}

// ── PRODUCTS ─────────────────────────────────────────────────────────────────
export const productsApi = {
  getAll: (params) => api.get('/products', { params }),
  // params: { category, brand, price_min, price_max, sort, page, limit, q }
  getBySlug: (slug) => api.get(`/products/${slug}`),
  getById: (id) => api.get(`/products/${id}`),
  getFeatured: () => api.get('/products?featured=true&limit=8'),
  getFlashSale: () => api.get('/products?flash_sale=true&limit=8'),
  getRelated: (id) => api.get(`/products/${id}/related`),
}

// ── CATEGORIES ───────────────────────────────────────────────────────────────
export const categoriesApi = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
}

// ── CART ─────────────────────────────────────────────────────────────────────
export const cartApi = {
  get: () => api.get('/cart'),
  addItem: (data) => api.post('/cart/items', data),
  // data: { product_id, quantity, variant? }
  updateItem: (itemId, data) => api.put(`/cart/items/${itemId}`, data),
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}`),
  clear: () => api.delete('/cart'),
}

// ── ORDERS ───────────────────────────────────────────────────────────────────
export const ordersApi = {
  create: (data) => api.post('/orders', data),
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  cancel: (id) => api.put(`/orders/${id}/cancel`),
}

// ── FAVORITES ────────────────────────────────────────────────────────────────
export const favoritesApi = {
  getAll: () => api.get('/favorites'),
  add: (productId) => api.post('/favorites', { product_id: productId }),
  remove: (productId) => api.delete(`/favorites/${productId}`),
}

// ── REVIEWS ──────────────────────────────────────────────────────────────────
export const reviewsApi = {
  getByProduct: (productId, params) =>
    api.get(`/reviews?product_id=${productId}`, { params }),
  create: (data) => api.post('/reviews', data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
}

// ── BLOGS ────────────────────────────────────────────────────────────────────
export const blogsApi = {
  getAll: (params) => api.get('/blogs', { params }),
  getBySlug: (slug) => api.get(`/blogs/${slug}`),
}

// ── USER PROFILE ─────────────────────────────────────────────────────────────
export const userApi = {
  getProfile: () => api.get('/user-profile'),
  updateProfile: (data) => api.put('/user-profile', data),
  getAddresses: () => api.get('/user-address'),
  addAddress: (data) => api.post('/user-address', data),
  updateAddress: (id, data) => api.put(`/user-address/${id}`, data),
  deleteAddress: (id) => api.delete(`/user-address/${id}`),
  getPaymentMethods: () => api.get('/user-payment'),
  addPaymentMethod: (data) => api.post('/user-payment', data),
}

// ── PROMOTIONS ───────────────────────────────────────────────────────────────
export const promotionsApi = {
  getAll: () => api.get('/promotions'),
  validate: (code) => api.post('/promotions/validate', { code }),
}

// ── CONTACT ──────────────────────────────────────────────────────────────────
export const contactApi = {
  send: (data) => api.post('/contacts', data),
}
