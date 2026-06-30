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
  // Admin
  create: (data)     => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  remove: (id)        => api.delete(`/products/${id}`),
}

// ── PRODUCT IMAGES (ADMIN) ───────────────────────────────────────────────────
export const productImagesApi = {
  getByProduct: (productId) => api.get(`/product-images/product/${productId}`),
  upload: (productId, files) => {
    const formData = new FormData()
    formData.append('product_id', productId)
    Array.from(files).forEach(file => formData.append('images', file))
    return api.post('/product-images/upload', formData, { headers: { 'Content-Type': undefined } })
  },
  remove:       (id)             => api.delete(`/product-images/${id}`),
  setThumbnail: (id, productId)  => api.patch(`/product-images/${id}/thumbnail`, { product_id: productId }),
}

// ── CATEGORIES ───────────────────────────────────────────────────────────────
// Backend: res.json({ data: [...] })
export const categoriesApi = {
  getAll: () => api.get('/categories').then(res => ({
    data: Array.isArray(res) ? res : (res.data || [])
  })),
  // Admin
  create: (data)     => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  remove: (id)        => api.delete(`/categories/${id}`),
}

// ── INVENTORY (ADMIN) ──────────────────────────────────────────────────────
export const inventoryApi = {
  getAll:     (params) => api.get('/inventory', { params }),
  getLowStock:()        => api.get('/inventory/low-stock'),
  getByProduct: (productId) => api.get(`/inventory/product/${productId}`),
  create: (data)     => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  remove: (id)        => api.delete(`/inventory/${id}`),
}

// ── INVENTORY LOGS (ADMIN) ─────────────────────────────────────────────────
export const inventoryLogApi = {
  getAll:          (params) => api.get('/inventory-logs', { params }),
  getByInventory:  (inventoryId) => api.get(`/inventory-logs/inventory/${inventoryId}`),
  getByProduct:    (productId)   => api.get(`/inventory-logs/product/${productId}`),
}

// ── USERS (ADMIN) ───────────────────────────────────────────────────────────
export const adminUsersApi = {
  getAll: (params)   => api.get('/users', { params }),
  create: (data)      => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  remove: (id)         => api.delete(`/users/${id}`),
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
  // Admin
  update: (id, data) => api.put(`/orders/${id}`, data),
  remove: (id)        => api.delete(`/orders/${id}`),
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
  // Admin
  getAll: () => api.get('/contacts'),
  remove: (id) => api.delete(`/contacts/${id}`),
}

// ── STORES ───────────────────────────────────────────────────────────────────
export const storesApi = {
  getAll: () => api.get('/stores'),
}