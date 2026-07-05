import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import { ProtectedRoute } from './components/common/index.jsx'
import useAuthStore from './store/authStore.js'
import useCartStore from './store/cartStore.js'

import HomePage            from './pages/HomePage.jsx'
import ProductsPage        from './pages/ProductsPage.jsx'
import ProductDetailPage   from './pages/ProductDetailPage.jsx'
import FlashSalePage       from './pages/FlashSalePage.jsx'
import CartPage            from './pages/CartPage.jsx'
import CheckoutPage        from './pages/CheckoutPage.jsx'
import CheckoutSuccessPage from './pages/CheckoutSuccessPage.jsx'
import LoginPage           from './pages/LoginPage.jsx'
import RegisterPage        from './pages/RegisterPage.jsx'
import AccountPage         from './pages/AccountPage.jsx'
import BlogPage, { BlogDetail } from './pages/BlogPage.jsx'
import OrderDetailPage        from './pages/OrderDetailPage.jsx'
import ContactPage         from './pages/ContactPage.jsx'
import NotFoundPage        from './pages/NotFoundPage.jsx'
import AdminLayout      from './pages/admin/AdminLayout.jsx'
import AdminDashboard   from './pages/admin/AdminDashboard.jsx'
import AdminOrders      from './pages/admin/AdminOrders.jsx'
import AdminProducts    from './pages/admin/AdminProducts.jsx'
import AdminPromotions  from './pages/admin/AdminPromotions.jsx'
import AdminCategories  from './pages/admin/AdminCategories.jsx'
import AdminInventory   from './pages/admin/AdminInventory.jsx'
import AdminUsers       from './pages/admin/AdminUsers.jsx'
import AdminContacts    from './pages/admin/AdminContacts.jsx'
import AdminBlogs       from './pages/admin/AdminBlogs.jsx'

import StaffLayout      from './pages/staff/StaffLayout.jsx'
import StaffDashboard   from './pages/staff/StaffDashboard.jsx'
import StaffOrders      from './pages/staff/StaffOrders.jsx'
import StaffProducts    from './pages/staff/StaffProducts.jsx'
import StaffInventory   from './pages/staff/StaffInventory.jsx'
import StaffBlogs       from './pages/staff/StaffBlogs.jsx'
import StaffContacts    from './pages/staff/StaffContacts.jsx'
import StaffUsers       from './pages/staff/StaffUsers.jsx'

export default function App() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const checkSession = useAuthStore(s => s.checkSession)
  const fetchCart = useCartStore(s => s.fetchCart)

  // Kiểm tra ngay khi app khởi động: nếu token đã hết hạn từ trước (session cũ)
  // thì dọn sạch trạng thái đăng nhập đã persist, coi như một khách vãng lai.
  useEffect(() => { checkSession() }, [])

  // Dọn dẹp localStorage cart cũ (từ phiên bản trước dùng persist)
  useEffect(() => { localStorage.removeItem('vnpt_cart') }, [])

  // Khi app khởi động và user đã đăng nhập, sync giỏ hàng từ DB
  useEffect(() => {
    if (isAuthenticated) fetchCart()
  }, [isAuthenticated])
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth — no layout */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Admin — own layout, role check inside AdminLayout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index                element={<AdminDashboard />} />
          <Route path="orders"        element={<AdminOrders />} />
          <Route path="products"      element={<AdminProducts />} />
          <Route path="promotions"    element={<AdminPromotions />} />
          <Route path="categories"    element={<AdminCategories />} />
          <Route path="inventory"     element={<AdminInventory />} />
          <Route path="users"         element={<AdminUsers />} />
          <Route path="contacts"      element={<AdminContacts />} />
          <Route path="blogs"         element={<AdminBlogs />} />
        </Route>

        {/* Staff — own layout, role check inside StaffLayout (staff + admin) */}
        <Route path="/staff" element={<StaffLayout />}>
          <Route index                element={<StaffDashboard />} />
          <Route path="orders"        element={<StaffOrders />} />
          <Route path="products"      element={<StaffProducts />} />
          <Route path="inventory"     element={<StaffInventory />} />
          <Route path="blogs"         element={<StaffBlogs />} />
          <Route path="contacts"      element={<StaffContacts />} />
          <Route path="users"         element={<StaffUsers />} />
        </Route>

        {/* Main layout */}
        <Route element={<Layout />}>
          <Route index                   element={<HomePage />} />
          <Route path="products"         element={<ProductsPage />} />
          <Route path="products/:slug"   element={<ProductDetailPage />} />
          <Route path="flash-sale"       element={<FlashSalePage />} />
          <Route path="cart"             element={<CartPage />} />
          <Route path="blog"             element={<BlogPage />} />
          <Route path="blog/:slug"       element={<BlogDetail />} />
          <Route path="contact"          element={<ContactPage />} />

          {/* Protected */}
          <Route path="checkout" element={
            <ProtectedRoute><CheckoutPage /></ProtectedRoute>
          } />
          <Route path="checkout/success" element={
            <ProtectedRoute><CheckoutSuccessPage /></ProtectedRoute>
          } />

          {/* Order detail */}
          <Route path="account/orders/:id" element={
            <ProtectedRoute><OrderDetailPage /></ProtectedRoute>
          } />

          {/* Account — tất cả sub-routes dùng chung AccountPage, tab được xác định theo path */}
          <Route path="account" element={
            <ProtectedRoute><AccountPage /></ProtectedRoute>
          } />
          <Route path="account/orders" element={
            <ProtectedRoute><AccountPage /></ProtectedRoute>
          } />
          <Route path="account/addresses" element={
            <ProtectedRoute><AccountPage /></ProtectedRoute>
          } />
          <Route path="account/settings" element={
            <ProtectedRoute><AccountPage /></ProtectedRoute>
          } />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}