import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-10">
      <div className="text-8xl mb-6">🔍</div>
      <h1 className="font-display text-5xl font-bold text-body mb-4">404</h1>
      <p className="text-xl text-muted mb-8">Trang bạn tìm không tồn tại</p>
      <div className="flex gap-3">
        <Link
          to="/"
          className="px-8 py-3.5 bg-vnpt text-white rounded-full font-bold text-base hover:bg-vnpt-dark transition-all"
        >
          ← Về trang chủ
        </Link>
        <Link
          to="/products"
          className="px-8 py-3.5 border-2 border-vnpt text-vnpt rounded-full font-bold text-base hover:bg-vnpt hover:text-white transition-all"
        >
          Xem sản phẩm
        </Link>
      </div>
    </div>
  )
}
