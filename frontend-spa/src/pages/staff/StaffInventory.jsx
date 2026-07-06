import { useEffect, useState } from "react";
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
import { toast, formatDate, debounce, resolveImageUrl } from "../../utils/index.js";

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
  const [loading, setLoading] = useState(true);
  // Bộ lọc trạng thái quản lý kho cho bảng danh sách — "all" (mặc định) để
  // không bỏ sót các dòng đang bị tạm khoá kho khi chỉ nhìn lướt qua thẻ
  // thống kê phía trên.
  const [filterStatus, setFilterStatus] = useState("all");
  // Dữ liệu toàn bộ kho (không phân trang) — chỉ dùng để tính 3 thẻ thống kê phía trên
  const [statsItems, setStatsItems] = useState([]);
  // Các dòng đang bị tạm khoá kho (status=inactive) — tách riêng để hiện
  // thẻ cảnh báo, vì 3 thẻ "Còn hàng đủ/Sắp hết/Hết hàng" chỉ tính trên
  // dòng active nên các sản phẩm tạm khoá dễ bị bỏ sót nếu không có ô này.
  const [inactiveItems, setInactiveItems] = useState([]);

  const load = () => {
    setLoading(true);
    inventoryApi
      .getAll({
        page,
        limit: LIMIT,
        ...(search.trim() ? { q: search.trim() } : {}),
        ...(filterStatus !== "all" ? { status: filterStatus } : {}),
      })
      .then((res) => {
        setAllItems(res.data || []);
        setTotal(res.total || 0);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

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
  }, [page, search, filterStatus]);
  useEffect(() => {
    loadStats();
  }, []);

  // Search giờ đã lấy trực tiếp từ backend (/inventory hỗ trợ q — search theo
  // tên sản phẩm, join products), không còn giới hạn trong dữ liệu trang hiện tại.
  const handleSearchChange = debounce((v) => {
    setPage(1);
    setSearch(v);
  }, 400);
  const items = allItems;

  const okCount = statsItems.filter((i) => i.quantity > i.min_quantity).length;
  const lowCount = statsItems.filter(
    (i) => i.quantity > 0 && i.quantity <= i.min_quantity,
  ).length;
  const outCount = statsItems.filter((i) => i.quantity === 0).length;
  const inactiveCount = inactiveItems.length;
  const inactiveOutCount = inactiveItems.filter((i) => i.quantity === 0).length;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          icon="✅"
          label="Còn hàng đủ"
          value={okCount}
          tone="success"
        />
        <StatCard icon="⚠️" label="Sắp hết" value={lowCount} tone="warning" />
        <StatCard icon="❌" label="Hết hàng" value={outCount} tone="error" />
        <div
          onClick={() => {
            setFilterStatus("inactive");
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

      <div className="flex justify-between items-center flex-wrap gap-3">
        <SearchInput
          defaultValue={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Tìm theo tên sản phẩm..."
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
              ? "Không tìm thấy sản phẩm phù hợp trong trang này"
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