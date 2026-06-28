import api from './axiosInstance'

// ── AUTH ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login:    (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
}

// ── PRODUCTS ─────────────────────────────────────────────────────────────────
export const productsApi = {
  getAll:     (params) => api.get('/products', { params }),
  getBySlug:  (slug)   => api.get(`/products/${slug}`),
  getById:    (id)     => api.get(`/products/${id}`),
  getRelated: (id)     => api.get(`/products/${id}/related`),
}

// ── CATEGORIES ───────────────────────────────────────────────────────────────
// Backend: res.json(categories) → trả thẳng array, không wrap { data }
// Wrapper normalise về { data: [] } để hooks dùng res.data nhất quán
export const categoriesApi = {
  getAll: () => api.get('/categories').then(res => ({
    data: Array.isArray(res) ? res : (res.data || [])
  })),
}

// ── CART ─────────────────────────────────────────────────────────────────────
export const cartApi = {
  get:          ()              => api.get('/cart'),
  addItem:      (data)          => api.post('/cart/items', data),
  updateItem:   (itemId, data)  => api.put(`/cart/items/${itemId}`, data),
  removeItem:   (itemId)        => api.delete(`/cart/items/${itemId}`),
  clear:        ()              => api.delete('/cart/clear'),
  toggleSelect: (itemId, data)  => api.patch(`/cart/toggle-select/${itemId}`, data),
  checkout:     (data)          => api.post('/cart/checkout', data),
}

// ── ORDERS ───────────────────────────────────────────────────────────────────
export const ordersApi = {
  preview: (data)   => api.post('/orders/preview', data),
  create:  (data)   => api.post('/orders', data),
  getAll:  (params) => api.get('/orders', { params }),
  getById: (id)     => api.get(`/orders/${id}`),
  cancel:  (id)     => api.post(`/orders/${id}/cancel`),
}

// ── FAVORITES ────────────────────────────────────────────────────────────────
export const favoritesApi = {
  getAll: ()          => api.get('/favorites'),
  add:    (productId) => api.post('/favorites', { product_id: productId }),
  remove: (productId) => api.delete(`/favorites/${productId}`),
}

// ── REVIEWS ──────────────────────────────────────────────────────────────────
export const reviewsApi = {
  getByProduct: (productId) => api.get(`/reviews/product/${productId}`),
  create:       (data)      => api.post('/reviews', data),
  delete:       (id)        => api.delete(`/reviews/${id}`),
}

// ── BLOGS ────────────────────────────────────────────────────────────────────
export const blogsApi = {
  getAll:    (params) => api.get('/blogs', { params }),
  getBySlug: (slug)   => api.get(`/blogs/slug/${slug}`),
}

// ── USER ─────────────────────────────────────────────────────────────────────
export const userApi = {
  getProfile:    ()         => api.get('/user-profile'),
  updateProfile: (data)     => api.put('/user-profile', data),
  getAddresses:       ()         => api.get('/user-address'),
  addAddress:         (data)     => api.post('/user-address', data),
  updateAddress:      (id, data) => api.put(`/user-address/${id}`, data),
  deleteAddress:      (id)       => api.delete(`/user-address/${id}`),
  setDefaultAddress:  (id)       => api.put(`/user-address/${id}/default`),
}

// ── CONTACT ──────────────────────────────────────────────────────────────────
export const contactApi = {
  send: (data) => api.post('/contacts', data),
}

// ── STORES ───────────────────────────────────────────────────────────────────
export const storesApi = {
  getAll: () => api.get('/stores'),
}