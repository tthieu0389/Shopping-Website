import { useRef, useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  formatPrice,
  calcDiscount,
  resolveImageUrl,
  notifyAvatarUpdated,
} from "../../utils/index.js";
import useCartStore from "../../store/cartStore.js";
import useAuthStore from "../../store/authStore.js";
import { toast } from "../../utils/index.js";
import { userApi } from "../../api/index.js";

// ── AvatarUploadModal ────────────────────────────────────────────────────────
// Modal đổi ảnh đại diện: chọn ảnh -> preview tại chỗ -> xác nhận mới upload.
const MAX_AVATAR_SIZE = 4 * 1024 * 1024; // khớp giới hạn 4MB của backend (multer)
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function AvatarUploadModal({ currentAvatarUrl, onClose, onSuccess }) {
  const fileInputRef = useRef(null);
  const overlayRef = useRef(null);
  const objectUrlRef = useRef(null);

  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // Dọn object URL tạm khi đổi ảnh khác hoặc unmount, tránh leak bộ nhớ
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current && !uploading) onClose();
  };

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // cho phép chọn lại cùng 1 file lần nữa nếu cần
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setError("Chỉ chấp nhận ảnh định dạng JPG, PNG hoặc WEBP.");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setError("Ảnh quá lớn. Vui lòng chọn ảnh tối đa 4MB.");
      return;
    }

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;

    setError("");
    setSelectedFile(file);
    setPreviewUrl(url);
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError("");
    try {
      const res = await userApi.uploadAvatar(selectedFile);
      toast.success("Cập nhật ảnh đại diện thành công!");
      notifyAvatarUpdated(res.data?.avatar);
      onSuccess?.(res.data);
      onClose();
    } catch (err) {
      setError(err.message || "Tải ảnh lên thất bại, vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      style={{ background: "rgba(10,10,10,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div className="w-full sm:max-w-[420px] bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-[fadeSlideUp_0.22s_ease]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-shade">
          <h2 className="font-display text-lg font-bold text-body">Đổi ảnh đại diện</h2>
          <button
            onClick={onClose}
            disabled={uploading}
            className="w-9 h-9 rounded-full hover:bg-surface flex items-center justify-center text-muted hover:text-body transition-colors text-lg disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Preview */}
        <div className="px-6 pt-6 pb-2 flex flex-col items-center">
          <div className="w-40 h-40 rounded-full overflow-hidden bg-vnpt-light border-4 border-shade flex items-center justify-center">
            {displayUrl ? (
              <img src={displayUrl} alt="Avatar preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-5xl">🧑</span>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={handlePickFile}
            disabled={uploading}
            className="mt-4 px-5 py-2 border border-vnpt text-vnpt rounded-full text-sm font-semibold hover:bg-vnpt hover:text-white transition-colors disabled:opacity-60"
          >
            📷 {selectedFile ? "Chọn ảnh khác" : "Chọn ảnh"}
          </button>

          <p className="text-xs text-muted mt-3 text-center">
            Hỗ trợ JPG, PNG, WEBP · Tối đa 4MB
          </p>

          {error && (
            <p className="text-xs text-accent font-medium mt-2 text-center">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="flex-1 px-4 py-2.5 border border-shade text-muted rounded-full text-sm font-semibold hover:border-body transition-colors disabled:opacity-60"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!selectedFile || uploading}
            className="flex-1 px-4 py-2.5 bg-vnpt text-white rounded-full text-sm font-bold hover:bg-vnpt-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploading ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ProductCard ───────────────────────────────────────────────────────────────
export function ProductCard({ product, showProgress = false }) {
  const addItem = useCartStore((s) => s.addItem);

  const salePrice = product.sale_price ?? product.price;
  const originalPrice = product.original_price ?? salePrice;
  // Có giảm giá thật (áp dụng cho cả giảm theo % lẫn giảm theo số tiền cố định)
  // khi giá gốc lớn hơn giá bán, không phụ thuộc vào discount_percent do backend trả về.
  const hasDiscount = originalPrice > salePrice;
  const discountPercent = hasDiscount
    ? product.discount_percent ||
      Math.round((1 - salePrice / originalPrice) * 100)
    : 0;
  // Giảm theo số tiền cố định nhỏ có thể làm tròn % về 0 -> chỉ hiện badge "-x%"
  // khi thực sự >= 1%, tránh hiện "-0%" xấu. Giá gốc gạch ngang vẫn luôn hiện
  // khi hasDiscount = true.
  const discount = discountPercent > 0 ? discountPercent : 0;

  const img = resolveImageUrl(
    product.img || product.thumbnail || product.image_url || null,
  );

  // Hết hàng: is_available = false HOẶC stock_quantity = 0
  const stockQty = product.stock_quantity ?? product.stock ?? null;
  const isOutOfStock =
    product.is_available === false ||
    product.is_available === 0 ||
    stockQty === 0;

  const handleAdd = (e) => {
    e.preventDefault();
    if (isOutOfStock) return;
    addItem(product)
      .then(() => toast.success(`Đã thêm ${product.name} vào giỏ!`))
      .catch((err) => toast.error(err?.message || "Không thể thêm vào giỏ"));
  };

  return (
    <Link
      to={`/products/${product.slug}`}
      className={`bg-white border rounded-xl overflow-hidden transition-all duration-250 group block relative
        ${
          isOutOfStock
            ? "border-shade opacity-60 cursor-pointer"
            : "border-shade hover:-translate-y-1 hover:shadow-lg hover:border-vnpt-light"
        }`}
    >
      {/* Badge hết hàng */}
      {isOutOfStock && (
        <div className="absolute top-2 left-2 z-10 bg-gray-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
          Hết hàng
        </div>
      )}

      <div className="relative aspect-square overflow-hidden bg-cream flex items-center justify-center">
        {img ? (
          <img
            src={img}
            alt={product.name}
            className={`w-3/4 h-3/4 object-contain transition-transform duration-300 ${isOutOfStock ? "" : "group-hover:scale-105"}`}
            loading="lazy"
            onError={(e) => {
              e.target.src = "https://placehold.co/200x200?text=No+Image";
            }}
          />
        ) : (
          <div className="w-3/4 h-3/4 flex items-center justify-center bg-surface rounded-lg text-4xl">
            📦
          </div>
        )}
      </div>

      <div className="p-3.5">
        {product.brand && (
          <div className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1">
            {product.brand}
          </div>
        )}
        <div className="text-sm font-semibold text-body leading-snug line-clamp-2">
          {product.name}
        </div>

        {/* Row cố định: hiện "Còn X sản phẩm" hoặc giá gốc gạch ngang hoặc trống — không bao giờ đẩy nút */}
        <div className="h-5 mb-1.5 mt-1">
          {!isOutOfStock && stockQty !== null && stockQty <= 5 ? (
            <span className="text-xs text-warning font-semibold">
              Còn {stockQty} sản phẩm
            </span>
          ) : hasDiscount ? (
            <span className="text-xs text-muted line-through">
              {formatPrice(originalPrice)}
            </span>
          ) : null}
        </div>

        <div className="mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-xl font-black font-display ${isOutOfStock ? "text-muted" : "text-accent"}`}
            >
              {formatPrice(salePrice)}
            </span>
            {discount > 0 && (
              <span
                className={`text-sm font-bold px-1.5 py-0.5 rounded ${
                  isOutOfStock
                    ? "bg-shade text-muted"
                    : "bg-accent/10 text-accent"
                }`}
              >
                -{discount}%
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleAdd}
          disabled={isOutOfStock}
          className={`w-full py-2.5 rounded-full text-sm font-semibold transition-colors
            ${
              isOutOfStock
                ? "bg-shade text-muted cursor-not-allowed"
                : "bg-vnpt text-white hover:bg-vnpt-dark"
            }`}
        >
          {isOutOfStock ? "Hết hàng" : "Thêm vào giỏ"}
        </button>
      </div>
    </Link>
  );
}

// ── FlashSaleCard ─────────────────────────────────────────────────────────────
export function FlashSaleCard({ product }) {
  const addItem = useCartStore((s) => s.addItem);

  const salePrice = product.sale_price ?? product.price;
  const originalPrice = product.original_price ?? salePrice;
  // Có giảm giá thật (áp dụng cho cả giảm theo % lẫn giảm theo số tiền cố định)
  // khi giá gốc lớn hơn giá bán, không phụ thuộc vào discount_percent do backend trả về.
  const hasDiscount = originalPrice > salePrice;
  const discountPercent = hasDiscount
    ? product.discount_percent ||
      Math.round((1 - salePrice / originalPrice) * 100)
    : 0;
  // Giảm theo số tiền cố định nhỏ có thể làm tròn % về 0 -> chỉ hiện badge "-x%"
  // khi thực sự >= 1%, tránh hiện "-0%" xấu. Giá gốc gạch ngang vẫn luôn hiện
  // khi hasDiscount = true.
  const discount = discountPercent > 0 ? discountPercent : 0;

  // Progress bar "Còn X suất"
  const stock = product.stock || 10;
  const sold =
    product.sold ||
    Math.max(
      1,
      Math.round(stock * (0.3 + (((product.id || 1) * 3) % 60) / 100)),
    );
  const remain = Math.max(0, stock - sold);
  const soldPct = Math.min(100, Math.round((sold / stock) * 100));

  const img = resolveImageUrl(
    product.img || product.thumbnail || product.image_url || null,
  );

  const handleAdd = (e) => {
    e.preventDefault();
    addItem(product);
    toast.success(`Đã thêm ${product.name} vào giỏ!`);
  };

  return (
    <Link
      to={`/products/${product.slug}`}
      className="bg-white border border-shade rounded-xl overflow-hidden transition-all duration-250 hover:-translate-y-1 hover:shadow-lg hover:border-vnpt-light group block"
    >
      {/* Ảnh */}
      <div className="relative aspect-square overflow-hidden bg-cream flex items-center justify-center">
        {img ? (
          <img
            src={img}
            alt={product.name}
            className="w-3/4 h-3/4 object-contain transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.target.src = "https://placehold.co/200x200?text=No+Image";
            }}
          />
        ) : (
          <div className="w-3/4 h-3/4 flex items-center justify-center bg-surface rounded-lg text-4xl">
            📦
          </div>
        )}
      </div>

      <div className="p-3.5">
        {product.brand && (
          <div className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1">
            {product.brand}
          </div>
        )}
        <div className="text-sm font-semibold text-body leading-snug mb-2.5 min-h-[38px] line-clamp-2">
          {product.name}
        </div>

        {/* Giá — kiểu TGDĐ */}
        <div className="mb-3">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-xl font-black text-accent font-display">
              {formatPrice(salePrice)}
            </span>
            {discount > 0 && (
              <span className="text-sm font-bold bg-accent/10 text-accent px-1.5 py-0.5 rounded">
                -{discount}%
              </span>
            )}
          </div>
          {hasDiscount && (
            <div className="text-xs text-muted line-through">
              {formatPrice(originalPrice)}
            </div>
          )}
        </div>

        <button
          onClick={handleAdd}
          className="w-full py-2.5 bg-vnpt text-white rounded-full text-sm font-bold hover:bg-vnpt-dark transition-colors"
        >
          Mua ngay
        </button>
      </div>
    </Link>
  );
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────
export function Breadcrumb({ items }) {
  return (
    <div className="bg-cream border-b border-shade px-10 py-3">
      <div className="max-w-[1200px] mx-auto flex items-center gap-2 text-sm text-muted flex-wrap">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span>›</span>}
            {item.to ? (
              <Link to={item.to} className="text-vnpt hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className="text-body">{item.label}</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── LoadingSpinner ────────────────────────────────────────────────────────────
export function LoadingSpinner({ text = "Đang tải..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-10 h-10 border-4 border-vnpt-light border-t-vnpt rounded-full animate-spin" />
      <p className="text-muted text-sm">{text}</p>
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon = "📭", title, desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="text-6xl">{icon}</div>
      <h3 className="text-xl font-bold text-body">{title}</h3>
      {desc && <p className="text-muted max-w-sm">{desc}</p>}
      {action}
    </div>
  );
}

// ── SectionHead ───────────────────────────────────────────────────────────────
export function SectionHead({ label, title, sub }) {
  return (
    <div className="text-center mb-11">
      {label && (
        <div className="text-xs font-bold tracking-[2px] uppercase text-vnpt mb-2">
          {label}
        </div>
      )}
      <h2 className="font-display text-[34px] font-bold text-body mb-3">
        {title}
      </h2>
      {sub && (
        <p className="text-muted max-w-[520px] mx-auto text-sm leading-relaxed">
          {sub}
        </p>
      )}
    </div>
  );
}

// ── TrustBand ─────────────────────────────────────────────────────────────────
export function TrustBand() {
  const items = [
    { icon: "🚚", title: "Giao hàng tận nơi", sub: "Hỗ trợ toàn quốc" },
    { icon: "🛡️", title: "Hàng chính hãng 100%", sub: "Bảo hành theo hãng" },
    {
      icon: "🔄",
      title: "Đổi trả trong 30 ngày",
      sub: "Trường hợp lỗi từ nhà sản xuất",
    },
    { icon: "📞", title: "Hỗ trợ 24/7", sub: "1800 1234 miễn phí" },
  ];
  return (
    <div className="bg-vnpt py-8 px-10">
      <div className="max-w-[1200px] mx-auto grid grid-cols-4 gap-6">
        {items.map(({ icon, title, sub }) => (
          <div key={title} className="flex items-center gap-3.5 text-white">
            <div className="w-11 h-11 bg-white/12 rounded-[10px] flex items-center justify-center text-xl flex-shrink-0">
              {icon}
            </div>
            <div>
              <div className="text-sm font-bold mb-0.5">{title}</div>
              <div className="text-xs text-white/65">{sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── CountdownTimer ────────────────────────────────────────────────────────────
export function CountdownTimer({ h, m, s }) {
  return (
    <div className="flex items-center gap-2">
      {[h, m, s].map((val, i) => (
        <span key={i} className="flex items-center gap-2">
          <span className="bg-accent text-white px-3.5 py-2 rounded-lg text-xl font-bold font-display min-w-[52px] text-center">
            {val}
          </span>
          {i < 2 && <span className="text-white text-xl font-bold">:</span>}
        </span>
      ))}
    </div>
  );
}

// ── ProtectedRoute ────────────────────────────────────────────────────────────
export function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

// ── StarRating ────────────────────────────────────────────────────────────────
export function StarRating({ value = 0, max = 5, onChange }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange && onChange(i + 1)}
          className={`text-xl transition-colors ${i < value ? "text-warning" : "text-shade"} ${onChange ? "cursor-pointer hover:text-warning" : "cursor-default"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
export function Pagination({ page, totalPages, goTo }) {
  if (totalPages === 0) return null;

  // Tạo danh sách trang với ellipsis: 1 … 4 5 6 … 55
  const getPages = () => {
    const delta = 4; // số trang hiển thị mỗi bên trang hiện tại
    const range = [];
    const rangeWithDots = [];

    const left = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);

    // Luôn có trang 1
    range.push(1);
    for (let i = left; i <= right; i++) range.push(i);
    // Luôn có trang cuối
    if (totalPages > 1) range.push(totalPages);

    // Thêm dấu ... vào giữa
    let prev = null;
    for (const p of range) {
      if (prev !== null) {
        if (p - prev === 2) {
          rangeWithDots.push(prev + 1); // chỉ 1 trang ở giữa, hiện luôn
        } else if (p - prev > 2) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(p);
      prev = p;
    }

    return rangeWithDots;
  };

  const btnBase =
    "w-9 h-9 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center";

  return (
    <div className="flex items-center justify-center gap-1.5 py-8">
      <button
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
        className="px-3 h-9 border border-shade rounded-lg text-sm text-muted hover:border-vnpt hover:text-vnpt transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ‹
      </button>

      {getPages().map((p, i) =>
        p === "..." ? (
          <span
            key={`dots-${i}`}
            className="w-9 h-9 flex items-center justify-center text-sm text-muted select-none"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => goTo(p)}
            className={`${btnBase} ${
              p === page
                ? "bg-vnpt text-white"
                : "border border-shade text-muted hover:border-vnpt hover:text-vnpt"
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
        className="px-3 h-9 border border-shade rounded-lg text-sm text-muted hover:border-vnpt hover:text-vnpt transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ›
      </button>
    </div>
  );
}