# VNPT Shop — Frontend React

Frontend hiện đại cho VNPT Shop, xây dựng với React + Vite + Tailwind CSS.

## Tech Stack

| Công nghệ | Vai trò |
|---|---|
| React 18 | UI framework |
| Vite | Build tool, dev server |
| Tailwind CSS v4 | Styling với VNPT design tokens |
| React Router v6 | Client-side routing |
| Zustand | State management (auth, cart) |
| Axios | HTTP client với JWT interceptor |
| React Hook Form | Form handling & validation |

## Cài đặt & Chạy

```bash
# 1. Cài dependencies
npm install

# 2. Tạo file .env từ mẫu
cp .env.example .env
# Sửa VITE_API_URL trỏ về backend: http://localhost:3000/api

# 3. Chạy dev server
npm run dev
# App chạy tại http://localhost:5173

# 4. Build production
npm run build
```

## Cấu trúc thư mục

```
src/
├── api/
│   ├── axiosInstance.js    ← Axios + JWT interceptor
│   └── index.js            ← API services: auth, products, cart...
├── components/
│   ├── common/index.jsx    ← ProductCard, Breadcrumb, TrustBand, Toast...
│   └── layout/             ← Layout, Navbar, Footer
├── pages/
│   ├── HomePage.jsx        ← Trang chủ đầy đủ
│   └── index.jsx           ← Tất cả page còn lại
├── store/
│   ├── authStore.js        ← Zustand auth: user, token, login/logout
│   └── cartStore.js        ← Zustand cart: items, qty, total, coupon
├── hooks/index.js          ← useProducts, useCountdown, useSearch...
├── utils/index.js          ← formatPrice, toast, debounce...
├── App.jsx                 ← Routes
└── index.css               ← Tailwind + VNPT design tokens
```

## Design Tokens

```
bg-vnpt / text-vnpt     #003087  (xanh chính)
bg-vnpt-dark            #00205f  (xanh đậm)
bg-vnpt-light           #e8eef8  (xanh nhạt)
bg-accent / text-accent #E30613  (đỏ CTA)
text-muted              #64748b
bg-cream                #f8f9fa
border-shade            #e2e8f0
text-success            #10b981
font-display            Roboto
font-body               Be Vietnam Pro
```

## Thêm trang mới

```jsx
// 1. Tạo component
export function MyPage() { return <div>...</div> }

// 2. Thêm route vào App.jsx
<Route path="my-page" element={<MyPage />} />
```

## Toast

```js
import { toast } from '@/utils'
toast.success('Thành công!')
toast.error('Có lỗi!')
toast.info('Thông tin')
```
