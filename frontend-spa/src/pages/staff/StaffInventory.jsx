import { useEffect, useState, useCallback, useRef } from "react";
import { inventoryApi } from "../../api/index.js";
import {
  Card,
  Table,
  TR,
  TD,
  Badge,
  StatCard,
  AdminPagination,
  SearchInput,
  SelectPill,
} from "./ui.jsx";
import { toast, formatDate, resolveImageUrl } from "../../utils/index.js";

const LIMIT = 10;

function statusOf(qty, min) {
  if (qty === 0) return { label: "✕ Hết hàng", tone: "error" };
  if (qty <= min) return { label: "⚠ Sắp hết", tone: "warning" };
  return { label: "Đủ hàng", tone: "success" };
}

// Trạng thái quản lý của dòng tồn kho (khác với trạng thái "còn/hết hàng" ở
// trên — cái này là do admin/staff chủ động bật/tắt việc xuất-nhập kho, ví
// dụ tạm khoá lúc kiểm kê, hoặc mở lại khi tới đợt bán tiếp).
const INVENTORY_STATUS_LABEL = {
  active: { label: "Đang quản lý", tone: "success" },
  inactive: { label: "Tạm khoá kho", tone: "muted" },
};

export default function StaffInventory() {
  const [allItems, setAllItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef(null);
  // Bộ lọc trạng thái quản lý kho cho bảng danh sách — "all" (mặc định) để
  // không bỏ sót các dòng đang bị tạm khoá kho khi chỉ nhìn lướt qua thẻ
  // thống kê phía trên.
  const [filterStatus, setFilterStatus] = useState("all");
  // Bộ lọc trạng thái tồn kho (còn hàng đủ / sắp hết / hết hàng) — khớp với
  // tham số stock_status mà backend GET /inventory đã hỗ trợ sẵn.
  const [stockStatus, setStockStatus] = useState("all");
  // Dữ liệu toàn bộ kho (không phân trang) — chỉ dùng để tính 3 thẻ thống kê phía trên
  const [statsItems, setStatsItems] = useState([]);
  // Các dòng đang bị tạm khoá kho (status=inactive) — tách riêng để hiện
  // thẻ cảnh báo, vì 3 thẻ "Còn hàng đủ/Sắp hết/Hết hàng" chỉ tính trên
  // dòng active nên các sản phẩm tạm khoá dễ bị bỏ sót nếu không có ô này.
  const [inactiveItems, setInactiveItems] = useState([]);

  const load = useCallback(() => {
    setLoading(true);
    inventoryApi
      .getAll({
        page,
        limit: LIMIT,
        ...(search ? { q: search } : {}),
        ...(filterStatus !== "all" ? { status: filterStatus } : {}),
        ...(stockStatus !== "all" ? { stock_status: stockStatus } : {}),
      })
      .then((res) => {
        setAllItems(res.data || []);
        setTotal(res.total || 0);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [page, search, filterStatus, stockStatus]);

  const loadStats = () => {
    // Backend chưa có endpoint thống kê riêng nên tạm lấy toàn bộ bản ghi
    // (limit lớn) để tính số liệu trên toàn bộ kho thay vì chỉ trang hiện tại.
    // Chỉ định status="active" để khớp với dashboard — dòng "inactive" (tạm
    // khoá kho) không được tính là còn quản lý bán nên không nên gộp vào
    // 3 số liệu này.
    inventoryApi
      .getAll({ page: 1, limit: 100000, status: "active" })
      .then((res) => setStatsItems(res.data || []))
      .catch(() => {});
    // Lấy riêng danh sách các dòng tạm khoá kho để hiện thẻ "Tạm khoá kho"
    // — tránh trường hợp chỉ nhìn 3 thẻ "Hết hàng/Sắp hết/Còn hàng" rồi
    // tưởng nhầm đã thấy hết toàn bộ sản phẩm hết hàng thực tế.
    inventoryApi
      .getAll({ page: 1, limit: 100000, status: "inactive" })
      .then((res) => setInactiveItems(res.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    loadStats();
  }, []);

  const handleSearchInput = (val) => {
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val.trim());
      setPage(1);
    }, 400);
  };
  const items = allItems;

  const okCount = statsItems.filter((i) => i.quantity > i.min_quantity).length;
  const lowCount = statsItems.filter(
    (i) => i.quantity > 0 && i.quantity <= i.min_quantity,
  ).length;
  const outCount = statsItems.filter((i) => i.quantity === 0).length;
  const inactiveCount = inactiveItems.length;
  const inactiveOutCount = inactiveItems.filter((i) => i.quantity === 0).length;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const hasActiveFilters =
    filterStatus !== "all" || stockStatus !== "all" || !!search;

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setFilterStatus("all");
    setStockStatus("all");
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div
          onClick={() => {
            setStockStatus("in_stock");
            setPage(1);
          }}
          className="cursor-pointer"
          title="Xem sản phẩm còn hàng đủ"
        >
          <StatCard
            icon="✅"
            label="Còn hàng đủ"
            value={okCount}
            tone="success"
          />
        </div>
        <div
          onClick={() => {
            setStockStatus("low_stock");
            setPage(1);
          }}
          className="cursor-pointer"
          title="Xem sản phẩm sắp hết hàng"
        >
          <StatCard icon="⚠️" label="Sắp hết" value={lowCount} tone="warning" />
        </div>
        <div
          onClick={() => {
            setStockStatus("out_of_stock");
            setPage(1);
          }}
          className="cursor-pointer"
          title="Xem sản phẩm hết hàng"
        >
          <StatCard icon="❌" label="Hết hàng" value={outCount} tone="error" />
        </div>
        <div
          onClick={() => {
            setFilterStatus("inactive");
            setStockStatus("all");
            setPage(1);
          }}
          className="cursor-pointer"
          title="Xem danh sách các sản phẩm đang tạm khoá kho"
        >
          <StatCard
            icon="🔒"
            label="Tạm khoá kho"
            value={inactiveCount}
            sub={
              inactiveOutCount > 0
                ? `Trong đó ${inactiveOutCount} sản phẩm đang hết hàng`
                : undefined
            }
            tone="info"
          />
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        <SearchInput
          value={searchInput}
          onChange={(e) => handleSearchInput(e.target.value)}
          placeholder="Tìm theo tên sản phẩm..."
          wrapperClassName="flex-1 min-w-[220px]"
        />

        <SelectPill
          value={filterStatus}
          onChange={(v) => {
            setFilterStatus(v);
            setPage(1);
          }}
          options={[
            ["all", "Tất cả trạng thái quản lý"],
            ["active", "Đang quản lý"],
            ["inactive", "Tạm khoá kho"],
          ]}
        />

        <SelectPill
          value={stockStatus}
          onChange={(v) => {
            setStockStatus(v);
            setPage(1);
          }}
          options={[
            ["all", "Tất cả tồn kho"],
            ["in_stock", "Còn hàng đủ"],
            ["low_stock", "Sắp hết"],
            ["out_of_stock", "Hết hàng"],
          ]}
        />

        <button
          onClick={clearFilters}
          disabled={!hasActiveFilters}
          className={`px-3.5 py-2 rounded-full text-xs font-bold transition-colors flex-shrink-0
            ${hasActiveFilters ? "text-muted hover:text-vnpt hover:bg-vnpt-light cursor-pointer" : "text-transparent pointer-events-none select-none"}`}
        >
          ✕ Xoá lọc
        </button>
      </div>

      <Card>
        <Table
          headers={[
            "",
            "Sản phẩm",
            "Tồn kho",
            "Ngưỡng tối thiểu",
            "Trạng thái",
            "Quản lý kho",
            "Cập nhật",
          ]}
          colWidths={[
            "50px",
            "260px",
            "90px",
            "120px",
            "110px",
            "120px",
            "110px",
          ]}
          alignRight={[2, 3]}
          loading={loading}
          empty={
            !loading &&
            (search.trim()
              ? "Không tìm thấy sản phẩm phù hợp"
              : stockStatus !== "all"
                ? {
                    in_stock: "Không có sản phẩm nào còn hàng đủ",
                    low_stock: "Không có sản phẩm nào sắp hết hàng",
                    out_of_stock: "Không có sản phẩm nào hết hàng",
                  }[stockStatus]
                : filterStatus === "inactive"
                  ? "Không có sản phẩm nào đang tạm khoá kho"
                  : filterStatus === "active"
                    ? "Không có sản phẩm nào đang quản lý"
                    : "Chưa có dữ liệu kho")
          }
        >
          {items.map((item, i) => {
            const img = resolveImageUrl(item.thumbnail_url || null);
            return (
            <TR key={item.id} striped={i % 2 !== 0}>
              <TD noTruncate>
                <div className="w-9 h-9 rounded-lg bg-cream border border-shade flex items-center justify-center overflow-hidden flex-shrink-0">
                  {img ? (
                    <img
                      src={img}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="text-base">📦</span>
                  )}
                </div>
              </TD>
              <TD bold>
                {item.product_name || `Sản phẩm #${item.product_id}`}
              </TD>
              <TD bold align="right" className={item.quantity === 0 ? "text-accent" : ""}>
                {item.quantity}
              </TD>
              <TD muted align="right">{item.min_quantity}</TD>
              <TD noTruncate>
                <Badge {...statusOf(item.quantity, item.min_quantity)} />
              </TD>
              <TD noTruncate>
                <Badge
                  {...(INVENTORY_STATUS_LABEL[item.status] ||
                    INVENTORY_STATUS_LABEL.active)}
                />
              </TD>
              <TD muted>{formatDate(item.updated_at)}</TD>
            </TR>
            );
          })}
        </Table>
      </Card>

      <AdminPagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}