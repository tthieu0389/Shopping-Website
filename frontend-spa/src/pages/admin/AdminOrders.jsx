import { useEffect, useState, useCallback, useRef } from "react";
import { ordersApi } from "../../api/index.js";
import {
  Card,
  Table,
  TR,
  TD,
  Badge,
  DrawerPanel,
  Btn,
  AdminPagination,
  SearchInput,
  SelectPill,
} from "./ui.jsx";
import { CreateOrderDrawer } from "./CreateOrderDrawer.jsx";
import { formatPrice, formatDate, toast } from "../../utils/index.js";

const ORDER_STATUS = {
  pending: { label: "Chờ xác nhận", tone: "warning" },
  confirmed: { label: "Đã xác nhận", tone: "info" },
  shipping: { label: "Đang giao", tone: "info" },
  completed: { label: "Hoàn tất", tone: "success" },
  cancelled: { label: "Đã huỷ", tone: "error" },
};
// Trạng thái có thể set qua PUT /orders/:id (cancelled phải dùng endpoint riêng)
const SETTABLE_STATUS = ["pending", "confirmed", "shipping", "completed"];

const PAYMENT_STATUS = {
  unpaid: { label: "Chưa thanh toán", tone: "warning" },
  paid: { label: "Đã thanh toán", tone: "success" },
  failed: { label: "Thất bại", tone: "error" },
  refunded: { label: "Đã hoàn tiền", tone: "info" },
};

// Nhãn hiển thị dễ đọc cho phương thức thanh toán (thay vì "PM #WALLET" khó hiểu)
const PAYMENT_METHOD_LABELS = {
  cod: "COD",
  wallet: "Ví điện tử",
  card: "Thẻ ngân hàng",
  bank_transfer: "Chuyển khoản",
};
// Ràng buộc chuyển trạng thái thanh toán hợp lệ (đồng bộ với backend)
const PAYMENT_TRANSITIONS = {
  unpaid: ["paid", "failed"],
  failed: ["unpaid", "paid"],
  paid: ["refunded"],
  refunded: [],
};

// Phương thức thanh toán (khớp giá trị lưu ở cột orders.payment_method bên backend)
const PAYMENT_METHOD_TABS = [
  ["all", "Tất cả PT"],
  ["cod", "COD"],
  ["wallet", "Ví điện tử"],
  ["card", "Thẻ"],
];
// Tính danh sách trạng thái thanh toán được phép chuyển tới, có xét thêm trạng thái đơn hàng
// - Đơn đã huỷ khi chưa thanh toán -> payment_status bị khoá ở "failed", không cho sửa nữa
// - Đơn đang giao -> không được chuyển sang "đã hoàn tiền"
const getAllowedPaymentTargets = (order) => {
  const current = order.payment_status || "unpaid";
  if (order.status === "cancelled" && current === "failed") return [];
  let allowed = PAYMENT_TRANSITIONS[current] || [];
  if (order.status === "shipping")
    allowed = allowed.filter((t) => t !== "refunded");
  return allowed;
};


const LIMIT = 10;

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [orderDetail, setOrderDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const debounceRef = useRef(null);

  const load = useCallback(() => {
    setLoading(true);
    ordersApi
      .getAll({
        page,
        limit: LIMIT,
        ...(status !== "all" ? { status } : {}),
        ...(paymentMethod !== "all" ? { payment_method: paymentMethod } : {}),
        ...(date ? { date } : {}),
        ...(search ? { search } : {}),
      })
      .then((res) => {
        setOrders(res.data || []);
        setTotal(res.total || 0);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [page, status, paymentMethod, date, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearchInput = (val) => {
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val.trim());
      setPage(1);
    }, 400);
  };

  const handleStatusChange = (order, newStatus) => {
    if (
      newStatus === "cancelled" &&
      !window.confirm(
        `Bạn có chắc muốn huỷ đơn hàng ${order.order_code || order.id} không?`,
      )
    )
      return;
    setUpdating(true);
    const action =
      newStatus === "cancelled"
        ? ordersApi.cancel(order.id)
        : ordersApi.update(order.id, { status: newStatus });
    action
      .then(() => {
        toast.success("Đã cập nhật trạng thái đơn hàng");
        setSelected((prev) => {
          if (!prev || prev.id !== order.id) return prev;
          const next = { ...prev, status: newStatus };
          // Backend tự động khoá/chuyển trạng thái thanh toán khi huỷ đơn
          if (newStatus === "cancelled") {
            if (prev.payment_status === "paid")
              next.payment_status = "refunded";
            else if (["unpaid", "failed"].includes(prev.payment_status))
              next.payment_status = "failed";
          }
          return next;
        });
        load();
      })
      .catch((err) => toast.error(err.message || "Không thể cập nhật"))
      .finally(() => setUpdating(false));
  };

  const handlePaymentStatusChange = (order, newStatus) => {
    if (
      newStatus === "refunded" &&
      !window.confirm(
        `Xác nhận hoàn tiền cho đơn hàng ${order.order_code || order.id}?`,
      )
    )
      return;
    setUpdatingPayment(true);
    ordersApi
      .updatePaymentStatus(order.id, newStatus)
      .then(() => {
        toast.success("Đã cập nhật trạng thái thanh toán");
        setSelected((prev) =>
          prev && prev.id === order.id
            ? { ...prev, payment_status: newStatus }
            : prev,
        );
        load();
      })
      .catch((err) =>
        toast.error(err.message || "Không thể cập nhật thanh toán"),
      )
      .finally(() => setUpdatingPayment(false));
  };

  const tabs = [
    ["all", "Tất cả"],
    ...Object.entries(ORDER_STATUS).map(([k, v]) => [k, v.label]),
  ];
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const hasActiveFilters =
    status !== "all" || paymentMethod !== "all" || !!date || !!search;

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus("all");
    setPaymentMethod("all");
    setDate("");
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5 flex-wrap">
        <SearchInput
          value={searchInput}
          onChange={(e) => handleSearchInput(e.target.value)}
          placeholder="Tìm theo mã đơn, người nhận hoặc số điện thoại..."
          wrapperClassName="flex-1 min-w-[220px]"
        />

        <SelectPill
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={tabs}
        />

        <SelectPill
          value={paymentMethod}
          onChange={(v) => {
            setPaymentMethod(v);
            setPage(1);
          }}
          options={PAYMENT_METHOD_TABS}
        />

        <div className="relative flex-shrink-0">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none z-10">
            📅
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setPage(1);
            }}
            className="pl-9 pr-2 py-2 rounded-full border border-shade text-sm outline-none focus:border-vnpt flex-shrink-0 w-[168px] bg-canvas"
          />
        </div>

        <button
          onClick={clearFilters}
          disabled={!hasActiveFilters}
          className={`px-3.5 py-2 rounded-full text-xs font-bold transition-colors flex-shrink-0
            ${hasActiveFilters ? "text-muted hover:text-vnpt hover:bg-vnpt-light cursor-pointer" : "text-transparent pointer-events-none select-none"}`}
        >
          ✕ Xoá lọc
        </button>

        <button
          onClick={() => setShowCreate(true)}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-full bg-vnpt text-white text-sm font-bold hover:bg-vnpt-dark transition-colors shadow-sm flex-shrink-0"
        >
          <span className="text-base leading-none">+</span> Tạo đơn hộ khách
        </button>
      </div>

      <Card>
        <Table
          headers={[
            "Mã đơn",
            "Người nhận",
            "SĐT",
            "Tổng tiền",
            "Thanh toán",
            "TT Thanh toán",
            "Trạng thái",
            "Ngày tạo",
          ]}
          colWidths={[
            "20%",  // Mã đơn
            "14%",  // Người nhận
            "11%",  // SĐT
            "11%",  // Tổng tiền
            "9%",   // Thanh toán
            "13%",  // TT Thanh toán
            "12%",  // Trạng thái
            "10%",  // Ngày tạo
          ]}
          alignRight={[3]}
          loading={loading}
          empty={!loading && "Không có đơn hàng nào"}
        >
          {orders.map((o, i) => (
            <TR key={o.id} striped={i % 2 !== 0} onClick={() => {
              setSelected(o);
              setOrderDetail(null);
              setLoadingDetail(true);
              ordersApi.getById(o.id)
                .then((res) => setOrderDetail(res.data))
                .catch((err) => toast.error(err.message))
                .finally(() => setLoadingDetail(false));
            }}>
              <TD bold className="text-vnpt">
                {o.order_code}
              </TD>
              <TD bold>{o.receiver_name || "—"}</TD>
              <TD muted>{o.receiver_phone || "—"}</TD>
              <TD bold align="right">{formatPrice(o.total_amount)}</TD>
              <TD muted className="text-[12px]">
                {PAYMENT_METHOD_LABELS[o.payment_method] ||
                  o.payment_method?.toUpperCase() ||
                  "—"}
              </TD>
              <TD noTruncate>
                <Badge
                  {...(PAYMENT_STATUS[o.payment_status] ||
                    PAYMENT_STATUS.unpaid)}
                />
              </TD>
              <TD noTruncate>
                <Badge {...(ORDER_STATUS[o.status] || ORDER_STATUS.pending)} />
              </TD>
              <TD muted>{formatDate(o.created_at)}</TD>
            </TR>
          ))}
        </Table>
      </Card>

      <AdminPagination page={page} totalPages={totalPages} onChange={setPage} />

      <DrawerPanel
        open={!!selected}
        onClose={() => { setSelected(null); setOrderDetail(null); }}
        title={`Đơn hàng ${selected?.order_code || ""}`}
      >
        {selected && (
          <div className="flex flex-col gap-5">

            {/* ── Thông tin khách hàng & đơn hàng ── */}
            <div className="bg-cream rounded-xl p-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
                {[
                  ["Người nhận", selected.receiver_name],
                  ["SĐT", selected.receiver_phone],
                  ["Thanh toán", PAYMENT_METHOD_LABELS[selected.payment_method] || selected.payment_method?.toUpperCase() || "—"],
                  ["Ngày tạo", formatDate(selected.created_at)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="text-muted text-[11px] mb-0.5">{k}</div>
                    <div className="font-semibold text-body">{v ?? "—"}</div>
                  </div>
                ))}
              </div>
              {selected.shipping_address && (
                <div className="mt-3 pt-3 border-t border-shade text-xs text-muted flex gap-1.5">
                  <span>📍</span>
                  <span>{selected.shipping_address}</span>
                </div>
              )}
              {selected.note && (
                <div className="mt-2 text-xs text-muted italic flex gap-1.5">
                  <span>📝</span>
                  <span>{selected.note}</span>
                </div>
              )}
            </div>

            {/* ── Sản phẩm trong đơn ── */}
            <div>
              <div className="text-[13px] font-bold text-body mb-2.5 flex items-center gap-2">
                <span>🛍️ Sản phẩm đã đặt</span>
                {loadingDetail && (
                  <span className="text-[11px] text-muted font-normal animate-pulse">Đang tải...</span>
                )}
                {!loadingDetail && orderDetail?.items && (
                  <span className="text-[11px] text-muted font-normal">
                    ({orderDetail.items.length} sản phẩm)
                  </span>
                )}
              </div>

              {loadingDetail ? (
                <div className="flex flex-col gap-2">
                  {[1,2].map(i => (
                    <div key={i} className="flex gap-3 p-3 rounded-xl bg-surface animate-pulse">
                      <div className="w-14 h-14 rounded-lg bg-shade flex-shrink-0" />
                      <div className="flex-1 flex flex-col gap-2 justify-center">
                        <div className="h-3 bg-shade rounded w-3/4" />
                        <div className="h-3 bg-shade rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : orderDetail?.items?.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {orderDetail.items.map((item) => (
                    <div key={item.id} className="flex gap-3 p-3 rounded-xl bg-surface border border-shade hover:border-vnpt/30 transition-colors">
                      {/* Ảnh sản phẩm */}
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-white border border-shade flex-shrink-0">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                        ) : null}
                        <div
                          className="w-full h-full flex items-center justify-center text-2xl"
                          style={{ display: item.image_url ? 'none' : 'flex' }}
                        >
                          📦
                        </div>
                      </div>

                      {/* Thông tin */}
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-body leading-tight truncate">
                          {item.product_name}
                        </div>
                        {item.brand && (
                          <div className="text-[11px] text-muted mt-0.5">{item.brand}</div>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-[11px] text-muted bg-white border border-shade rounded-full px-2 py-0.5">
                            x{item.quantity}
                          </span>
                          {item.discount_amount > 0 && (
                            <span className="text-[11px] text-muted line-through">
                              {formatPrice(item.unit_price * item.quantity)}
                            </span>
                          )}
                          <span className="text-[13px] font-bold text-vnpt">
                            {formatPrice(item.final_price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Tổng tiền */}
                  <div className="mt-1 pt-3 border-t border-shade flex flex-col gap-1.5">
                    {selected.shipping_fee > 0 && (
                      <div className="flex justify-between text-[12px] text-muted">
                        <span>Phí giao hàng</span>
                        <span>{formatPrice(selected.shipping_fee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-[13px] font-bold text-body">Tổng cộng</span>
                      <span className="text-[16px] font-bold text-vnpt">{formatPrice(selected.total_amount)}</span>
                    </div>
                  </div>
                </div>
              ) : !loadingDetail ? (
                <div className="text-center py-6 text-muted text-[13px] bg-surface rounded-xl border border-shade border-dashed">
                  Không có sản phẩm
                </div>
              ) : null}
            </div>

            {/* ── Trạng thái giao hàng ── */}
            <div className="pt-4 border-t border-shade">
              <div className="mb-2 text-[13px] font-bold text-body">
                Trạng thái giao hàng
              </div>
              <div className="flex flex-col gap-1.5">
                {SETTABLE_STATUS.map((key) => {
                  const { label } = ORDER_STATUS[key];
                  const isCurrent = selected.status === key;
                  return (
                    <button
                      key={key}
                      disabled={
                        updating ||
                        isCurrent ||
                        selected.status === "cancelled" ||
                        selected.status === "completed"
                      }
                      onClick={() => handleStatusChange(selected, key)}
                      className={`text-left px-4 py-2.5 rounded-[9px] border text-[13px] transition-all
                        ${isCurrent ? "border-vnpt bg-vnpt-light text-vnpt font-bold" : "border-shade text-body hover:border-vnpt"}
                        disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {isCurrent ? "✓ " : ""}
                      {label}
                    </button>
                  );
                })}
                {["pending", "confirmed"].includes(selected.status) && (
                  <button
                    disabled={updating}
                    onClick={() => handleStatusChange(selected, "cancelled")}
                    className="text-left px-4 py-2.5 rounded-[9px] border border-red-200 bg-error/5 text-red-700 text-[13px] font-semibold hover:bg-error/10"
                  >
                    ✕ Huỷ đơn hàng
                  </button>
                )}
              </div>
            </div>

            {/* ── Trạng thái thanh toán ── */}
            <div className="pt-4 border-t border-shade">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[13px] font-bold text-body">
                  Trạng thái thanh toán
                </div>
                <Badge
                  {...(PAYMENT_STATUS[selected.payment_status] ||
                    PAYMENT_STATUS.unpaid)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                {(() => {
                  const allowedTargets = getAllowedPaymentTargets(selected);
                  return Object.entries(PAYMENT_STATUS).map(
                    ([key, { label }]) => {
                      const current = selected.payment_status || "unpaid";
                      const isCurrent = current === key;
                      const allowed = allowedTargets.includes(key);
                      const isRefund = key === "refunded";
                      return (
                        <button
                          key={key}
                          disabled={updatingPayment || isCurrent || !allowed}
                          onClick={() =>
                            handlePaymentStatusChange(selected, key)
                          }
                          className={`text-left px-4 py-2.5 rounded-[9px] border text-[13px] transition-all
                          ${
                            isCurrent
                              ? "border-vnpt bg-vnpt-light text-vnpt font-bold"
                              : isRefund && allowed
                                ? "border-red-200 bg-error/5 text-red-700 font-semibold hover:bg-error/10"
                                : "border-shade text-body hover:border-vnpt"
                          }
                          disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          {isCurrent ? "✓ " : isRefund && allowed ? "↩ " : ""}
                          {label}
                        </button>
                      );
                    },
                  );
                })()}
              </div>
              {selected.status === "cancelled" &&
                selected.payment_status === "failed" && (
                  <div className="mt-1.5 text-[11px] text-muted italic">
                    Đơn hàng đã huỷ khi chưa thanh toán, trạng thái thanh toán
                    đã bị khoá.
                  </div>
                )}
              {selected.status === "shipping" &&
                selected.payment_status === "paid" && (
                  <div className="mt-1.5 text-[11px] text-muted italic">
                    Đơn đang giao, chưa thể hoàn tiền.
                  </div>
                )}
              {!(
                selected.status === "cancelled" &&
                selected.payment_status === "failed"
              ) &&
                !(
                  selected.status === "shipping" &&
                  selected.payment_status === "paid"
                ) &&
                getAllowedPaymentTargets(selected).length === 0 && (
                  <div className="mt-1.5 text-[11px] text-muted italic">
                    Trạng thái thanh toán cuối cùng, không thể thay đổi thêm.
                  </div>
                )}
            </div>

          </div>
        )}
      </DrawerPanel>

      <CreateOrderDrawer
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setPage(1);
          load();
        }}
      />
    </div>
  );
}