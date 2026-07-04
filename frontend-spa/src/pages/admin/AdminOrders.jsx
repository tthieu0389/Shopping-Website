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

// Dropdown gọn, bo tròn pill giống các input khác trong toolbar admin,
// dùng cho các bộ lọc có nhiều lựa chọn (trạng thái đơn, phương thức thanh toán)
// để tránh dàn hàng ngang quá nhiều nút như FilterTabs.
function SelectPill({ value, onChange, options, icon }) {
  const active = value !== "all";
  return (
    <div className="relative flex-shrink-0">
      {icon && (
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none">
          {icon}
        </span>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none cursor-pointer rounded-full border text-sm font-semibold outline-none transition-colors
          ${icon ? "pl-9" : "pl-4"} pr-9 py-2
          ${active ? "border-vnpt text-vnpt bg-vnpt-light" : "border-shade text-body bg-canvas hover:border-vnpt"}`}
      >
        {options.map(([val, label]) => (
          <option key={val} value={val}>
            {label}
          </option>
        ))}
      </select>
      <svg
        className={`absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${active ? "text-vnpt" : "text-muted"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

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
        <div className="relative flex-1 min-w-[220px]">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none">
            🔍
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="Tìm theo mã đơn hoặc tên người nhận..."
            className="w-full pl-9 pr-4 py-2 rounded-full border border-shade text-sm outline-none focus:border-vnpt transition-colors"
          />
        </div>

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
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none">
            📅
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setPage(1);
            }}
            className="pl-9 pr-3 py-2 rounded-full border border-shade text-sm outline-none focus:border-vnpt flex-shrink-0 w-[152px]"
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
            "",
          ]}
          loading={loading}
          empty={!loading && "Không có đơn hàng nào"}
        >
          {orders.map((o, i) => (
            <TR key={o.id} striped={i % 2 !== 0} onClick={() => setSelected(o)}>
              <TD bold className="text-vnpt">
                {o.order_code}
              </TD>
              <TD bold>{o.receiver_name || "—"}</TD>
              <TD muted>{o.receiver_phone || "—"}</TD>
              <TD bold>{formatPrice(o.total_amount)}</TD>
              <TD muted className="uppercase text-[11px]">
                {o.payment_method === "cod" ? "COD" : `PM #${o.payment_method}`}
              </TD>
              <TD>
                <Badge
                  {...(PAYMENT_STATUS[o.payment_status] ||
                    PAYMENT_STATUS.unpaid)}
                />
              </TD>
              <TD>
                <Badge {...(ORDER_STATUS[o.status] || ORDER_STATUS.pending)} />
              </TD>
              <TD muted>{formatDate(o.created_at)}</TD>
              <TD>
                <span className="text-vnpt text-xs font-bold">Chi tiết</span>
              </TD>
            </TR>
          ))}
        </Table>
      </Card>

      <AdminPagination page={page} totalPages={totalPages} onChange={setPage} />

      <DrawerPanel
        open={!!selected}
        onClose={() => setSelected(null)}
        title={`Đơn hàng ${selected?.order_code || ""}`}
      >
        {selected && (
          <div>
            <div className="bg-cream rounded-xl p-4 mb-5">
              <div className="grid grid-cols-2 gap-3 text-[13px]">
                {[
                  ["Người nhận", selected.receiver_name],
                  ["SĐT", selected.receiver_phone],
                  ["Tổng tiền", formatPrice(selected.total_amount)],
                  ["Phí ship", formatPrice(selected.shipping_fee)],
                  [
                    "Thanh toán",
                    selected.payment_method === "cod"
                      ? "COD"
                      : `PM #${selected.payment_method}`,
                  ],
                  ["Ngày tạo", formatDate(selected.created_at)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="text-muted text-[11px] mb-0.5">{k}</div>
                    <div className="font-bold text-body">{v ?? "—"}</div>
                  </div>
                ))}
                <div>
                  <div className="text-muted text-[11px] mb-0.5">
                    Trạng thái thanh toán
                  </div>
                  <Badge
                    {...(PAYMENT_STATUS[selected.payment_status] ||
                      PAYMENT_STATUS.unpaid)}
                  />
                </div>
              </div>
              {selected.shipping_address && (
                <div className="mt-3 text-xs text-muted">
                  📍 {selected.shipping_address}
                </div>
              )}
              {selected.note && (
                <div className="mt-2 text-xs text-muted italic">
                  📝 {selected.note}
                </div>
              )}
            </div>

            <div className="mb-2 text-[13px] font-bold text-body">
              Cập nhật trạng thái
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

            <div className="mt-5 pt-5 border-t border-shade">
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