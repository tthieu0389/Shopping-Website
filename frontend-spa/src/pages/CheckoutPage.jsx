import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useUserAddresses } from "../hooks/index.js";
import { formatPrice, resolveImageUrl, toast } from "../utils/index.js";
import { cartApi, ordersApi, storesApi } from "../api/index.js";
import useCartStore from "../store/cartStore.js";
import useAuthStore from "../store/authStore.js";

const PAYMENT_METHODS = [
  {
    value: "momo",
    icon: "💜",
    name: "MoMo",
    sub: "Ví điện tử · Thanh toán nhanh",
  },
  { value: "vnpay", icon: "🏦", name: "VNPAY", sub: "ATM / QR Code" },
  {
    value: "card",
    icon: "💳",
    name: "Thẻ Visa / Mastercard",
    sub: "Trả góp 0% đến 24 tháng",
  },
  {
    value: "cod",
    icon: "💵",
    name: "Tiền mặt (COD)",
    sub: "Kiểm tra hàng trước khi thanh toán",
  },
];

const toBackendPayment = (value) => {
  if (value === "momo" || value === "vnpay") return "wallet";
  return value;
};

export default function CheckoutPage() {
  const {
    items: allItems,
    removeSelectedItems,
    selectItemsForCheckout,
  } = useCartStore();

  const selectedIds = (() => {
    try {
      return new Set(
        JSON.parse(sessionStorage.getItem("checkout_items") || "[]"),
      );
    } catch {
      return new Set();
    }
  })();
  const items =
    selectedIds.size > 0
      ? allItems.filter((i) => selectedIds.has(i.id))
      : allItems;
  const selectedTotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const { user } = useAuthStore();
  const { data: rawAddresses } = useUserAddresses();
  const addresses = [...rawAddresses].sort(
    (a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0),
  );
  const navigate = useNavigate();

  // 'delivery' | 'pickup'
  const [deliveryMode, setDeliveryMode] = useState("delivery");
  const [stores, setStores] = useState([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [earlyDiscount, setEarlyDiscount] = useState(null); // discount tính sớm khi chưa chọn địa chỉ
  const earlyDiscountFetched = useRef(false);

  // Gọi preview ngay khi items sẵn sàng để lấy discount (không cần address)
  useEffect(() => {
    if (items.length === 0 || earlyDiscountFetched.current) return;
    earlyDiscountFetched.current = true;
    ordersApi
      .preview({
        items: items.map((i) => ({
          product_id: i.product_id ?? i.id,
          quantity: i.qty,
        })),
      })
      .then((res) => {
        const data = res.data ?? res;
        setEarlyDiscount(data.total_discount_amount ?? 0);
      })
      .catch(() => {});
  }, [items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      note: "",
      payment_method: "cod",
      address_id: "",
    },
  });

  const selectedAddressId = watch("address_id");

  // Tự động chọn địa chỉ mặc định một lần duy nhất khi load xong, không ghi đè lựa chọn của user
  const autoSelectedRef = useRef(false);
  useEffect(() => {
    if (addresses.length === 0 || autoSelectedRef.current) return;
    autoSelectedRef.current = true;
    const defaultAddr = addresses.find((a) => a.is_default) ?? addresses[0];
    setValue("address_id", String(defaultAddr.id));
  }, [addresses]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load danh sách cửa hàng khi chọn tab pickup
  useEffect(() => {
    if (deliveryMode !== "pickup" || stores.length > 0) return;
    setStoresLoading(true);
    storesApi
      .getAll()
      .then((res) => {
        const list = Array.isArray(res) ? res : res.data || [];
        setStores(list);
        if (list.length > 0) setSelectedStoreId(list[0].id);
      })
      .catch(() => {})
      .finally(() => setStoresLoading(false));
  }, [deliveryMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Gọi API preview khi địa chỉ hoặc store thay đổi
  useEffect(() => {
    const hasDelivery = deliveryMode === "delivery" && selectedAddressId;
    const hasPickup = deliveryMode === "pickup" && selectedStoreId;
    if (!hasDelivery && !hasPickup) {
      setPreview(null);
      return;
    }

    setPreviewLoading(true);
    const payload = {
      items: items.map((i) => ({
        product_id: i.product_id ?? i.id,
        quantity: i.qty,
      })),
      ...(hasDelivery
        ? { address_id: Number(selectedAddressId) }
        : { pickup_store_id: Number(selectedStoreId) }),
    };
    ordersApi
      .preview(payload)
      .then((res) => setPreview(res.data ?? res))
      .catch(() => setPreview(null))
      .finally(() => setPreviewLoading(false));
  }, [selectedAddressId, selectedStoreId, deliveryMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const shippingFee = preview?.shipping_fee ?? null;
  const discountAmount = preview?.total_discount_amount ?? earlyDiscount ?? 0;
  const finalTotal =
    preview?.total_final_amount ??
    selectedTotal - discountAmount + (shippingFee ?? 0);

  const canSubmit =
    deliveryMode === "delivery" ? !!selectedAddressId : !!selectedStoreId;

  const onInvalid = () =>
    toast.error("Vui lòng kiểm tra lại thông tin đã nhập");

  const onSubmit = async (data) => {
    if (items.length === 0) {
      toast.error("Giỏ hàng trống");
      return;
    }
    if (!canSubmit) {
      toast.error(
        deliveryMode === "delivery"
          ? "Vui lòng chọn địa chỉ giao hàng"
          : "Vui lòng chọn cửa hàng nhận",
      );
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        payment_method: toBackendPayment(data.payment_method),
        note: data.note || undefined,
        items: items.map((i) => ({
          product_id: i.product_id ?? i.id,
          quantity: i.qty,
        })),
        ...(deliveryMode === "delivery"
          ? { address_id: Number(selectedAddressId) }
          : { pickup_store_id: Number(selectedStoreId) }),
      };
      await selectItemsForCheckout(items.map((i) => i.id));
      await cartApi.checkout(payload);
      sessionStorage.removeItem("checkout_items");
      await removeSelectedItems(items.map((i) => i.id));
      toast.success("Đặt hàng thành công! 🎉");
      navigate("/checkout/success");
    } catch (err) {
      toast.error(err.message || "Đặt hàng thất bại, vui lòng thử lại");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-[680px] mx-auto px-10 py-16 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="font-display text-2xl font-bold text-body mb-3">
          Giỏ hàng trống
        </h2>
        <Link
          to="/products"
          className="inline-block px-6 py-3 bg-vnpt text-white rounded-full font-bold text-sm mt-4"
        >
          Mua sắm ngay
        </Link>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
        <div className="max-w-[1100px] mx-auto px-10 py-8 grid grid-cols-[1fr_380px] gap-8 items-start">
          {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
          <div className="space-y-5">
            {/* Địa chỉ / Nhận tại cửa hàng */}
            <div className="bg-white border border-shade rounded-xl p-7">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3 text-base font-bold text-body">
                  <span className="w-7 h-7 rounded-full bg-vnpt text-white flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  Nhận hàng
                </div>
                {deliveryMode === "delivery" && (
                  <a
                    href="/account/addresses"
                    className="text-xs text-vnpt font-semibold hover:underline"
                  >
                    Quản lý địa chỉ →
                  </a>
                )}
              </div>

              {/* Toggle tab */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <button
                  type="button"
                  onClick={() => setDeliveryMode("delivery")}
                  className={`flex flex-col items-center gap-1.5 py-4 px-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                    deliveryMode === "delivery"
                      ? "border-vnpt bg-vnpt text-white shadow-md"
                      : "border-shade bg-white text-body hover:border-vnpt hover:bg-vnpt-light"
                  }`}
                >
                  <span className="text-2xl">🚚</span>
                  <span>Giao hàng tận nơi</span>
                  {deliveryMode !== "delivery" && (
                    <span className="text-xs text-muted font-normal">
                      15.000₫ – 25.000₫
                    </span>
                  )}
                  {deliveryMode === "delivery" && (
                    <span className="text-xs text-white/80 font-normal">
                      Nhận tại địa chỉ của bạn
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryMode("pickup")}
                  className={`flex flex-col items-center gap-1.5 py-4 px-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                    deliveryMode === "pickup"
                      ? "border-vnpt bg-vnpt text-white shadow-md"
                      : "border-shade bg-white text-body hover:border-vnpt hover:bg-vnpt-light"
                  }`}
                >
                  <span className="text-2xl">🏪</span>
                  <span>Nhận tại cửa hàng</span>
                  {deliveryMode !== "pickup" && (
                    <span className="text-xs text-success font-semibold">
                      Miễn phí ship
                    </span>
                  )}
                  {deliveryMode === "pickup" && (
                    <span className="text-xs text-white/80 font-normal">
                      Miễn phí vận chuyển
                    </span>
                  )}
                </button>
              </div>

              {/* --- DELIVERY MODE --- */}
              {deliveryMode === "delivery" && (
                <>
                  {addresses.length > 0 ? (
                    <div className="space-y-2">
                      {addresses.map((addr) => (
                        <label
                          key={addr.id}
                          className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${selectedAddressId == addr.id ? "border-vnpt bg-vnpt-light" : "border-shade hover:border-vnpt-light"}`}
                        >
                          <input
                            type="radio"
                            {...register("address_id")}
                            value={addr.id}
                            className="accent-vnpt mt-0.5"
                          />
                          <div className="text-sm flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-semibold text-body">
                                {addr.receiver_name}
                              </span>
                              <span className="text-muted">·</span>
                              <span className="text-muted">{addr.phone}</span>
                              {addr.is_default && (
                                <span className="ml-auto text-[11px] text-vnpt font-semibold bg-vnpt-light border border-vnpt/20 px-2 py-0.5 rounded-full">
                                  Mặc định
                                </span>
                              )}
                            </div>
                            <div className="text-muted">
                              {addr.address_line}, {addr.ward}, {addr.district},{" "}
                              {addr.province}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted">
                      <div className="text-3xl mb-2">📍</div>
                      <p className="text-sm mb-3">
                        Bạn chưa có địa chỉ nào được lưu.
                      </p>
                      <a
                        href="/account/addresses"
                        className="inline-block px-5 py-2 border border-vnpt text-vnpt rounded-full text-sm font-semibold hover:bg-vnpt hover:text-white transition-colors"
                      >
                        Thêm địa chỉ mới
                      </a>
                    </div>
                  )}
                </>
              )}

              {/* --- PICKUP MODE --- */}
              {deliveryMode === "pickup" && (
                <div>
                  {/* Badge miễn phí ship */}

                  {storesLoading ? (
                    <div className="text-center py-8 text-muted text-sm">
                      ⏳ Đang tải danh sách cửa hàng...
                    </div>
                  ) : stores.length === 0 ? (
                    <div className="text-center py-8 text-muted text-sm">
                      Không tìm thấy cửa hàng nào.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {stores.map((store) => (
                        <label
                          key={store.id}
                          className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedStoreId === store.id
                              ? "border-vnpt bg-vnpt-light"
                              : "border-shade hover:border-vnpt-light"
                          }`}
                        >
                          <input
                            type="radio"
                            name="store_id"
                            checked={selectedStoreId === store.id}
                            onChange={() => setSelectedStoreId(store.id)}
                            className="accent-vnpt mt-0.5"
                          />
                          <div className="text-sm flex-1">
                            <div className="font-semibold text-body mb-0.5">
                              {store.name}
                            </div>
                            <div className="text-muted">
                              {store.address}, {store.province}
                            </div>
                            {store.phone && (
                              <div className="text-muted mt-0.5">
                                📞 {store.phone}
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Ghi chú */}
              {(deliveryMode === "delivery"
                ? addresses.length > 0
                : stores.length > 0) && (
                <div className="mt-4 pt-4 border-t border-shade">
                  <label className="text-sm font-semibold block mb-1.5">
                    Ghi chú
                  </label>
                  <input
                    {...register("note")}
                    placeholder={
                      deliveryMode === "delivery"
                        ? "Giao giờ hành chính, gọi trước 30 phút..."
                        : "Thời gian dự kiến đến nhận..."
                    }
                    className="w-full px-4 py-3 border border-shade rounded-lg text-sm font-body outline-none focus:border-vnpt"
                  />
                </div>
              )}
            </div>

            {/* Phương thức thanh toán */}
            <div className="bg-white border border-shade rounded-xl p-7">
              <div className="flex items-center gap-3 text-base font-bold text-body mb-5">
                <span className="w-7 h-7 rounded-full bg-vnpt text-white flex items-center justify-center text-xs font-bold">
                  2
                </span>
                Phương thức thanh toán
              </div>
              <div className="space-y-3">
                {PAYMENT_METHODS.map(({ value, icon, name, sub }) => (
                  <label
                    key={value}
                    className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${watch("payment_method") === value ? "border-vnpt bg-vnpt-light" : "border-shade hover:border-vnpt-light"}`}
                  >
                    <input
                      type="radio"
                      {...register("payment_method")}
                      value={value}
                      className="accent-vnpt w-4 h-4"
                    />
                    <span className="text-2xl">{icon}</span>
                    <div>
                      <div className="text-sm font-semibold text-body">
                        {name}
                      </div>
                      <div className="text-xs text-muted">{sub}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* ── ORDER SUMMARY ────────────────────────────────────────────── */}
          <div className="bg-white border border-shade rounded-xl p-6 sticky top-24">
            <div className="text-base font-bold text-body mb-4 pb-4 border-b border-shade">
              Đơn hàng ({items.reduce((s, i) => s + i.qty, 0)} sản phẩm)
            </div>

            <div className="space-y-1 mb-4 max-h-[320px] overflow-y-auto pr-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 py-3 border-b border-shade last:border-0"
                >
                  {/* Ảnh + badge số lượng */}
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 bg-cream rounded-lg border border-shade flex items-center justify-center overflow-hidden">
                      {(() => {
                        const img = resolveImageUrl(
                          item.img || item.image_url || item.thumbnail || null,
                        );
                        return img ? (
                          <img
                            src={img}
                            alt={item.name}
                            className="w-full h-full object-contain p-1.5"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                "https://placehold.co/200x200?text=No+Image";
                            }}
                          />
                        ) : (
                          <span className="text-2xl">📦</span>
                        );
                      })()}
                    </div>
                    <span className="absolute -top-2 -right-2 min-w-[20px] h-5 bg-vnpt text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white shadow-sm">
                      {item.qty}
                    </span>
                  </div>

                  {/* Tên + đơn giá */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-body leading-snug mb-1">
                      {item.name}
                    </div>
                    <div className="text-xs text-muted">
                      {formatPrice(item.price)} × {item.qty}
                    </div>
                  </div>

                  {/* Thành tiền */}
                  <div className="text-[13px] font-bold text-body flex-shrink-0 whitespace-nowrap pt-0.5">
                    {formatPrice(item.price * item.qty)}
                  </div>
                </div>
              ))}
            </div>

            <hr className="border-shade mb-4" />

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-muted">Tạm tính</span>
                <span>{formatPrice(selectedTotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted">Giảm giá</span>
                  <span className="text-success font-semibold">
                    -{formatPrice(discountAmount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-muted">Vận chuyển</span>
                {previewLoading ? (
                  <span className="text-muted italic">Đang tính...</span>
                ) : shippingFee === null ? (
                  <span className="text-muted italic">
                    {deliveryMode === "delivery"
                      ? "Chọn địa chỉ để tính"
                      : "Chọn cửa hàng để tính"}
                  </span>
                ) : shippingFee === 0 ? (
                  <span className="text-success font-semibold">Miễn phí</span>
                ) : (
                  <span className="font-semibold">
                    {formatPrice(shippingFee)}
                  </span>
                )}
              </div>

              {shippingFee !== null && shippingFee > 0 && (
                <div className="text-xs text-muted bg-cream rounded-lg px-3 py-2">
                  💡 Nhận hàng tại cửa hàng VNPT để được{" "}
                  <span className="text-success font-semibold">
                    miễn phí ship
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t-2 border-shade mb-5">
              <span className="text-base font-bold flex-shrink-0">
                Tổng cộng
              </span>
              {previewLoading ? (
                <span className="text-xl font-bold text-muted font-display whitespace-nowrap">
                  ...
                </span>
              ) : (
                <span className="text-xl font-bold text-accent font-display whitespace-nowrap">
                  {formatPrice(finalTotal)}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || previewLoading || !canSubmit}
              className="w-full py-4 bg-accent text-white rounded-full font-bold text-base hover:bg-accent-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting
                ? "⏳ Đang xử lý..."
                : !canSubmit
                  ? deliveryMode === "delivery"
                    ? "Chọn địa chỉ để tiếp tục"
                    : "Chọn cửa hàng để tiếp tục"
                  : "✓ Đặt hàng ngay"}
            </button>
            <p className="text-center text-xs text-muted mt-3">
              🔒 Thanh toán SSL 256-bit an toàn
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
