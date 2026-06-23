import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import { ProtectedRoute } from './components/common/index.jsx'

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
import ContactPage         from './pages/ContactPage.jsx'
import NotFoundPage        from './pages/NotFoundPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth — no layout */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

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

          {/* Account — tất cả sub-routes dùng chung AccountPage, tab được xác định theo path */}
          <Route path="account" element={
            <ProtectedRoute><AccountPage /></ProtectedRoute>
          } />
          <Route path="account/orders" element={
            <ProtectedRoute><AccountPage /></ProtectedRoute>
          } />
          <Route path="account/wishlist" element={
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
