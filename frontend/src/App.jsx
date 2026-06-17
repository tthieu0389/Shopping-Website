import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/common'

import HomePage from '@/pages/HomePage'
import {
  ProductsPage,
  ProductDetailPage,
  FlashSalePage,
  CartPage,
  CheckoutPage,
  CheckoutSuccessPage,
  LoginPage,
  RegisterPage,
  AccountPage,
  BlogPage,
  ContactPage,
  NotFoundPage,
} from '@/pages'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth pages - no layout */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Main layout */}
        <Route element={<Layout />}>
          <Route index                 element={<HomePage />} />
          <Route path="products"       element={<ProductsPage />} />
          <Route path="products/:slug" element={<ProductDetailPage />} />
          <Route path="flash-sale"     element={<FlashSalePage />} />
          <Route path="cart"           element={<CartPage />} />
          <Route path="blog"           element={<BlogPage />} />
          <Route path="contact"        element={<ContactPage />} />

          {/* Protected */}
          <Route path="checkout" element={
            <ProtectedRoute><CheckoutPage /></ProtectedRoute>
          }/>
          <Route path="checkout/success" element={
            <ProtectedRoute><CheckoutSuccessPage /></ProtectedRoute>
          }/>
          <Route path="account" element={
            <ProtectedRoute><AccountPage /></ProtectedRoute>
          }/>
          <Route path="account/orders"    element={<ProtectedRoute><AccountPage /></ProtectedRoute>}/>
          <Route path="account/wishlist"  element={<ProtectedRoute><AccountPage /></ProtectedRoute>}/>
          <Route path="account/addresses" element={<ProtectedRoute><AccountPage /></ProtectedRoute>}/>
          <Route path="account/settings"  element={<ProtectedRoute><AccountPage /></ProtectedRoute>}/>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
