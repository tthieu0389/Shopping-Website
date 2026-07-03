import { useEffect, useRef, useState } from "react";
import {
  adminUsersApi,
  productsApi,
  storesApi,
  userApi,
  ordersApi,
} from "../../api/index.js";
import { DrawerPanel } from "./ui.jsx";
import { formatPrice, toast, resolveImageUrl } from "../../utils/index.js";

const PAYMENT_METHODS = [
  ["cod", "COD (Thanh toán khi nhận hàng)"],
  ["wallet", "Ví điện tử"],
  ["card", "Thẻ"],
];

// ── Drawer tạo đơn hộ khách hàng (dùng chung cho Admin + Staff) ──────────────
// Chỉ cần truyền onCreated để reload lại danh sách đơn sau khi tạo thành công.
export function CreateOrderDrawer({ open, onClose, onCreated }) {
  // Khách hàng
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [customer, setCustomer] = useState(null);
  const customerDebounce = useRef(null);

  // Giao hàng
  const [deliveryMethod, setDeliveryMethod] = useState("address"); // 'address' | 'pickup'
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressId, setAddressId] = useState(null);
  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState(null);

  // Sản phẩm
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [searchingProduct, setSearchingProduct] = useState(false);
  const [items, setItems] = useState([]); // [{product_id, name, price, stock, qty}]
  const productDebounce = useRef(null);

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [note, setNote] = useState("");

  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reset toàn bộ form mỗi khi đóng/mở lại drawer
  useEffect(() => {
    if (!open) return;
    setCustomerQuery("");
    setCustomer(null);
    setDeliveryMethod("address");
    setAddresses([]);
    setAddressId(null);
    setStoreId(null);
    setProductQuery("");
    setItems([]);
    setPaymentMethod("cod");
    setNote("");
    setPreview(null);
    storesApi
      .getAll()
      .then((res) => setStores(res?.data ?? res ?? []))
      .catch(() => setStores([]));
    // Tải sẵn danh sách khách hàng + sản phẩm để chọn ngay, không cần gõ tìm trước
    setSearchingCustomer(true);
    adminUsersApi
      .getAll({ limit: 10 })
      .then((res) => setCustomerResults(res?.data ?? res ?? []))
      .catch(() => setCustomerResults([]))
      .finally(() => setSearchingCustomer(false));
    setSearchingProduct(true);
    productsApi
      .getAll({ limit: 10 })
      .then((res) => setProductResults(res?.data ?? res ?? []))
      .catch(() => setProductResults([]))
      .finally(() => setSearchingProduct(false));
  }, [open]);

  // ── Tìm khách hàng ─────────────────────────────────────────────────────
  const handleCustomerQueryChange = (val) => {
    setCustomerQuery(val);
    clearTimeout(customerDebounce.current);
    customerDebounce.current = setTimeout(() => {
      setSearchingCustomer(true);
      // Không gõ gì -> hiện lại danh sách mặc định (10 khách gần nhất)
      adminUsersApi
        .getAll(val.trim() ? { search: val.trim(), limit: 10 } : { limit: 10 })
        .then((res) => setCustomerResults(res?.data ?? res ?? []))
        .catch(() => setCustomerResults([]))
        .finally(() => setSearchingCustomer(false));
    }, 350);
  };

  const selectCustomer = (u) => {
    setCustomer(u);
    setCustomerQuery("");
    setAddressId(null);
    setLoadingAddresses(true);
    userApi
      .getAddressesByUserId(u.id)
      .then((res) => {
        const list = res?.data ?? res ?? [];
        setAddresses(list);
        const def = list.find((a) => a.is_default) || list[0];
        if (def) setAddressId(def.id);
        // Khách chưa có địa chỉ nào -> chuyển gợi ý sang nhận tại cửa hàng
        if (list.length === 0) setDeliveryMethod("pickup");
      })
      .catch(() => setAddresses([]))
      .finally(() => setLoadingAddresses(false));
  };

  // ── Tìm sản phẩm ───────────────────────────────────────────────────────
  const handleProductQueryChange = (val) => {
    setProductQuery(val);
    clearTimeout(productDebounce.current);
    productDebounce.current = setTimeout(() => {
      setSearchingProduct(true);
      // Không gõ gì -> hiện lại danh sách mặc định (10 sản phẩm)
      productsApi
        .getAll(val.trim() ? { search: val.trim(), limit: 10 } : { limit: 10 })
        .then((res) => setProductResults(res?.data ?? res ?? []))
        .catch(() => setProductResults([]))
        .finally(() => setSearchingProduct(false));
    }, 350);
  };

  const addProduct = (p) => {
    setPreview(null);
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === p.id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === p.id ? { ...i, qty: i.qty + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          product_id: p.id,
          name: p.name,
          img: p.thumbnail_url ?? null,
          price: p.sale_price ?? p.price,
          stock: p.stock_quantity ?? p.stock ?? null,
          qty: 1,
        },
      ];
    });
    // Giữ nguyên danh sách sản phẩm bên dưới để chọn tiếp, không đóng lại
  };

  const updateQty = (productId, qty) => {
    setPreview(null);
    if (qty < 1) {
      setItems((prev) => prev.filter((i) => i.product_id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.product_id === productId ? { ...i, qty } : i)),
    );
  };

  const removeItem = (productId) => {
    setPreview(null);
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  };

  // ── Xây payload dùng chung cho preview + submit ────────────────────────
  const buildPayload = () => ({
    user_id: customer?.id,
    items: items.map((i) => ({ product_id: i.product_id, quantity: i.qty })),
    ...(deliveryMethod === "address"
      ? { address_id: addressId }
      : { pickup_store_id: storeId }),
    payment_method: paymentMethod,
    note: note || undefined,
  });

  const validate = () => {
    if (!customer) return "Vui lòng chọn khách hàng";
    if (items.length === 0) return "Vui lòng thêm ít nhất 1 sản phẩm";
    if (deliveryMethod === "address" && !addressId)
      return "Vui lòng chọn địa chỉ giao hàng";
    if (deliveryMethod === "pickup" && !storeId)
      return "Vui lòng chọn cửa hàng nhận";
    return null;
  };

  const handlePreview = () => {
    const err = validate();
    if (err) return toast.error(err);
    setPreviewing(true);
    ordersApi
      .preview(buildPayload())
      .then((res) => setPreview(res?.data ?? res))
      .catch((err) =>
        toast.error(
          err?.response?.data?.message ||
            err.message ||
            "Không thể xem trước đơn",
        ),
      )
      .finally(() => setPreviewing(false));
  };

  const handleSubmit = () => {
    const err = validate();
    if (err) return toast.error(err);
    setSubmitting(true);
    ordersApi
      .create(buildPayload())
      .then((res) => {
        toast.success(`Đã tạo đơn hàng cho ${customer.name || customer.email}`);
        onCreated?.(res?.data ?? res);
        onClose?.();
      })
      .catch((err) =>
        toast.error(
          err?.response?.data?.message ||
            err.message ||
            "Không thể tạo đơn hàng",
        ),
      )
      .finally(() => setSubmitting(false));
  };

  const itemsSubtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <DrawerPanel
      open={open}
      onClose={onClose}
      title="Tạo đơn hộ khách hàng"
      width="sm:w-[560px]"
    >
      <div className="flex flex-col gap-5">
        {/* ── Khách hàng ───────────────────────────────────────────────── */}
        <div>
          <div className="text-[13px] font-bold text-body mb-1.5">
            Khách hàng
          </div>
          {customer ? (
            <div className="flex items-center justify-between bg-cream rounded-lg px-3.5 py-2.5">
              <div>
                <div className="text-sm font-semibold text-body">
                  {customer.name || "—"}
                </div>
                <div className="text-xs text-muted">
                  {customer.email}
                  {customer.phone ? ` · ${customer.phone}` : ""}
                </div>
              </div>
              <button
                onClick={() => {
                  setCustomer(null);
                  setAddresses([]);
                  setAddressId(null);
                }}
                className="text-xs text-vnpt font-semibold hover:underline"
              >
                Đổi
              </button>
            </div>
          ) : (
            <div>
              <input
                type="text"
                value={customerQuery}
                onChange={(e) => handleCustomerQueryChange(e.target.value)}
                placeholder="Tìm theo tên, email hoặc SĐT..."
                className="w-full px-3.5 py-2.5 border border-shade rounded-lg text-sm outline-none focus:border-vnpt mb-2"
              />
              <div className="border border-shade rounded-lg max-h-56 overflow-y-auto">
                {searchingCustomer ? (
                  <div className="px-3.5 py-2.5 text-xs text-muted">
                    Đang tải danh sách khách hàng...
                  </div>
                ) : customerResults.length === 0 ? (
                  <div className="px-3.5 py-2.5 text-xs text-muted">
                    Không tìm thấy khách hàng
                  </div>
                ) : (
                  customerResults.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => selectCustomer(u)}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-cream border-b border-shade last:border-none"
                    >
                      <div className="text-sm font-semibold text-body">
                        {u.name || "—"}
                      </div>
                      <div className="text-xs text-muted">
                        {u.email}
                        {u.phone ? ` · ${u.phone}` : ""}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Hình thức nhận hàng ──────────────────────────────────────── */}
        {customer && (
          <div>
            <div className="text-[13px] font-bold text-body mb-1.5">
              Hình thức nhận hàng
            </div>
            <div className="flex gap-2 mb-2.5">
              {[
                ["address", "Giao hàng"],
                ["pickup", "Nhận tại cửa hàng"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => {
                    setDeliveryMethod(key);
                    setPreview(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors
                    ${deliveryMethod === key ? "bg-vnpt text-white border-vnpt" : "border-shade text-muted hover:border-vnpt"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {deliveryMethod === "address" ? (
              loadingAddresses ? (
                <div className="text-xs text-muted">Đang tải địa chỉ...</div>
              ) : addresses.length === 0 ? (
                <div className="text-xs text-muted italic">
                  Khách hàng chưa có địa chỉ nào. Vui lòng chọn "Nhận tại cửa
                  hàng" hoặc yêu cầu khách thêm địa chỉ trước.
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {addresses.map((a) => (
                    <label
                      key={a.id}
                      className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg border cursor-pointer text-[13px]
                        ${addressId === a.id ? "border-vnpt bg-vnpt-light" : "border-shade hover:border-vnpt"}`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={addressId === a.id}
                        onChange={() => {
                          setAddressId(a.id);
                          setPreview(null);
                        }}
                        className="accent-vnpt mt-0.5"
                      />
                      <div>
                        <div className="font-semibold text-body">
                          {a.receiver_name} · {a.phone}
                          {a.is_default && (
                            <span className="ml-1.5 text-[10px] text-vnpt font-bold">
                              (Mặc định)
                            </span>
                          )}
                        </div>
                        <div className="text-muted">
                          {a.address_line}, {a.ward}, {a.district}, {a.province}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )
            ) : (
              <div className="flex flex-col gap-1.5">
                {stores.length === 0 ? (
                  <div className="text-xs text-muted">Đang tải cửa hàng...</div>
                ) : (
                  stores.map((s) => (
                    <label
                      key={s.id}
                      className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg border cursor-pointer text-[13px]
                        ${storeId === s.id ? "border-vnpt bg-vnpt-light" : "border-shade hover:border-vnpt"}`}
                    >
                      <input
                        type="radio"
                        name="store"
                        checked={storeId === s.id}
                        onChange={() => {
                          setStoreId(s.id);
                          setPreview(null);
                        }}
                        className="accent-vnpt mt-0.5"
                      />
                      <div>
                        <div className="font-semibold text-body">{s.name}</div>
                        <div className="text-muted">{s.address}</div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Sản phẩm ─────────────────────────────────────────────────── */}
        {customer && (
          <div>
            <div className="text-[13px] font-bold text-body mb-1.5">
              Sản phẩm
            </div>
            <div className="mb-2.5">
              <input
                type="text"
                value={productQuery}
                onChange={(e) => handleProductQueryChange(e.target.value)}
                placeholder="Tìm sản phẩm theo tên..."
                className="w-full px-3.5 py-2.5 border border-shade rounded-lg text-sm outline-none focus:border-vnpt mb-2"
              />
              <div className="border border-shade rounded-lg max-h-56 overflow-y-auto">
                {searchingProduct ? (
                  <div className="px-3.5 py-2.5 text-xs text-muted">
                    Đang tải danh sách sản phẩm...
                  </div>
                ) : productResults.length === 0 ? (
                  <div className="px-3.5 py-2.5 text-xs text-muted">
                    Không tìm thấy sản phẩm
                  </div>
                ) : (
                  productResults.map((p) => {
                    const added = items.some((i) => i.product_id === p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => addProduct(p)}
                        className="w-full flex items-center justify-between text-left px-3.5 py-2.5 hover:bg-cream border-b border-shade last:border-none"
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <span className="w-9 h-9 rounded-md bg-cream border border-shade flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {p.thumbnail_url ? (
                              <img
                                src={resolveImageUrl(p.thumbnail_url)}
                                alt={p.name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  e.target.src =
                                    "https://placehold.co/40x40?text=No+Image";
                                }}
                              />
                            ) : (
                              <span className="text-sm">📦</span>
                            )}
                          </span>
                          <span className="text-sm text-body line-clamp-1">
                            {p.name}
                          </span>
                        </span>
                        <span className="flex items-center gap-2 flex-shrink-0 ml-2">
                          {added && (
                            <span className="text-[10px] font-bold text-vnpt bg-vnpt-light px-1.5 py-0.5 rounded">
                              Đã thêm
                            </span>
                          )}
                          <span className="text-xs font-bold text-accent">
                            {formatPrice(p.sale_price ?? p.price)}
                          </span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {items.length === 0 ? (
              <div className="text-xs text-muted italic">
                Chưa có sản phẩm nào trong đơn.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {items.map((i) => (
                  <div
                    key={i.product_id}
                    className="flex items-center gap-2.5 border border-shade rounded-lg px-3 py-2"
                  >
                    <span className="w-9 h-9 rounded-md bg-cream border border-shade flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {i.img ? (
                        <img
                          src={resolveImageUrl(i.img)}
                          alt={i.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.target.src =
                              "https://placehold.co/40x40?text=No+Image";
                          }}
                        />
                      ) : (
                        <span className="text-sm">📦</span>
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-body line-clamp-1">
                        {i.name}
                      </div>
                      <div className="text-xs text-muted">
                        {formatPrice(i.price)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => updateQty(i.product_id, i.qty - 1)}
                        className="w-6 h-6 rounded border border-shade text-sm hover:border-vnpt"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm">{i.qty}</span>
                      <button
                        onClick={() => updateQty(i.product_id, i.qty + 1)}
                        className="w-6 h-6 rounded border border-shade text-sm hover:border-vnpt"
                      >
                        +
                      </button>
                    </div>
                    <div className="w-24 text-right text-[13px] font-bold text-body flex-shrink-0">
                      {formatPrice(i.price * i.qty)}
                    </div>
                    <button
                      onClick={() => removeItem(i.product_id)}
                      className="text-muted hover:text-accent flex-shrink-0"
                      title="Xoá"
                    >
                      🗑
                    </button>
                  </div>
                ))}
                <div className="flex justify-between text-[13px] pt-1">
                  <span className="text-muted">Tạm tính</span>
                  <span className="font-bold text-body">
                    {formatPrice(itemsSubtotal)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Thanh toán + ghi chú ─────────────────────────────────────── */}
        {customer && (
          <div>
            <div className="text-[13px] font-bold text-body mb-1.5">
              Phương thức thanh toán
            </div>
            <div className="flex flex-col gap-1.5 mb-3.5">
              {PAYMENT_METHODS.map(([key, label]) => (
                <label
                  key={key}
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-lg border cursor-pointer text-[13px]
                    ${paymentMethod === key ? "border-vnpt bg-vnpt-light" : "border-shade hover:border-vnpt"}`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    checked={paymentMethod === key}
                    onChange={() => setPaymentMethod(key)}
                    className="accent-vnpt"
                  />
                  {label}
                </label>
              ))}
            </div>

            <div className="text-[13px] font-bold text-body mb-1.5">
              Ghi chú (tuỳ chọn)
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Ghi chú cho đơn hàng..."
              className="w-full px-3.5 py-2.5 border border-shade rounded-lg text-sm outline-none focus:border-vnpt resize-none"
            />
          </div>
        )}

        {/* ── Preview ──────────────────────────────────────────────────── */}
        {preview && (
          <div className="bg-cream rounded-xl p-4 text-[13px] space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted">Tạm tính</span>
              <span>{formatPrice(preview.total_base_amount)}</span>
            </div>
            {preview.total_discount_amount > 0 && (
              <div className="flex justify-between text-accent">
                <span>Giảm giá</span>
                <span>-{formatPrice(preview.total_discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted">Phí vận chuyển</span>
              <span>{formatPrice(preview.shipping_fee)}</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-shade font-bold text-base">
              <span>Tổng cộng</span>
              <span className="text-accent">
                {formatPrice(preview.total_final_amount)}
              </span>
            </div>
          </div>
        )}

        {/* ── Actions ──────────────────────────────────────────────────── */}
        {customer && (
          <div className="flex gap-2.5 pt-1">
            <button
              onClick={handlePreview}
              disabled={previewing || items.length === 0}
              className="flex-1 py-2.5 rounded-full border border-vnpt text-vnpt text-sm font-bold hover:bg-vnpt-light disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {previewing ? "Đang tính..." : "Xem trước"}
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-full bg-vnpt text-white text-sm font-bold hover:bg-vnpt-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Đang tạo..." : "Tạo đơn hàng"}
            </button>
          </div>
        )}
      </div>
    </DrawerPanel>
  );
}
