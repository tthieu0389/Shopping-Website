import { useState } from "react";
import { useDiscountedProducts, useCountdown } from "../hooks/index.js";
import {
  FlashSaleCard,
  LoadingSpinner,
  EmptyState,
  CountdownTimer,
  Pagination,
} from "../components/common/index.jsx";
import { Link } from "react-router-dom";

const LIMIT = 8;

export default function FlashSalePage() {
  const { h, m, s } = useCountdown(6443);
  const [page, setPage] = useState(1);

  const {
    data: products,
    total,
    loading,
  } = useDiscountedProducts({ page, limit: LIMIT });

  const totalPages = Math.ceil((total || 0) / LIMIT);

  const goTo = (p) => {
    const clamped = Math.min(Math.max(1, p), totalPages || 1);
    setPage(clamped);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      {/* Hero */}
      <div
        className="text-white text-center py-14 px-10"
        style={{ background: "linear-gradient(135deg, #7b0000, #E30613)" }}
      >
        <div className="text-xs font-bold uppercase tracking-[2px] text-white/70 mb-2">
          ⚡ Flash Sale đặc biệt
        </div>
        <h1 className="font-display text-5xl font-bold mb-3">
          🔥 FLASH SALE HÔM NAY
        </h1>
        <p className="text-white/80 mb-6 text-sm">
          Giảm đến <strong>50%</strong> cho hàng trăm sản phẩm công nghệ chính
          hãng
        </p>
        <div className="flex justify-center">
          <CountdownTimer h={h} m={m} s={s} />
        </div>
      </div>

      {/* Products */}
      <div className="max-w-[1200px] mx-auto px-10 py-10">
        {loading ? (
          <LoadingSpinner />
        ) : products.length === 0 ? (
          <EmptyState
            icon="⚡"
            title="Chưa có sản phẩm Flash Sale"
            desc="Quay lại sau để xem các ưu đãi hấp dẫn"
            action={
              <Link
                to="/products"
                className="px-6 py-2.5 bg-vnpt text-white rounded-full text-sm font-bold"
              >
                Xem tất cả sản phẩm
              </Link>
            }
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted">
                Hiển thị{" "}
                <strong className="text-body">{products.length}</strong> /{" "}
                <strong className="text-body">{total}</strong> sản phẩm
              </p>
              {totalPages > 1 && (
                <p className="text-sm text-muted">
                  Trang <strong className="text-body">{page}</strong> /{" "}
                  {totalPages}
                </p>
              )}
            </div>
            <div className="grid grid-cols-4 gap-4">
              {products.map((p) => (
                <FlashSaleCard key={p.id} product={p} />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} goTo={goTo} />
          </>
        )}
      </div>
    </div>
  );
}