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
} from "./ui.jsx";
import { toast, formatDate, debounce } from "../../utils/index.js";

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
  // Dữ liệu toàn bộ kho (không phân trang) — chỉ dùng để tính 3 thẻ thống kê phía trên
  const [statsItems, setStatsItems] = useState([]);

  const load = () => {
    setLoading(true);
    inventoryApi
      .getAll({
        page,
        limit: LIMIT,
        ...(search.trim() ? { q: search.trim() } : {}),
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
    inventoryApi
      .getAll({ page: 1, limit: 100000 })
      .then((res) => setStatsItems(res.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, [page, search]);
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
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <StatCard
          icon="✅"
          label="Còn hàng đủ"
          value={okCount}
          tone="success"
        />
        <StatCard icon="⚠️" label="Sắp hết" value={lowCount} tone="warning" />
        <StatCard icon="❌" label="Hết hàng" value={outCount} tone="error" />
      </div>

      <div className="flex justify-between items-center flex-wrap gap-3">
        <SearchInput
          defaultValue={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Tìm theo tên sản phẩm..."
        />
      </div>

      <Card>
        <Table
          headers={[
            "Sản phẩm",
            "Tồn kho",
            "Ngưỡng tối thiểu",
            "Trạng thái",
            "Quản lý kho",
            "Cập nhật",
          ]}
          colWidths={[
            "260px",
            "90px",
            "120px",
            "110px",
            "120px",
            "110px",
          ]}
          loading={loading}
          empty={
            !loading &&
            (search.trim()
              ? "Không tìm thấy sản phẩm phù hợp trong trang này"
              : "Chưa có dữ liệu kho")
          }
        >
          {items.map((item, i) => (
            <TR key={item.id} striped={i % 2 !== 0}>
              <TD bold>
                {item.product_name || `Sản phẩm #${item.product_id}`}
              </TD>
              <TD bold className={item.quantity === 0 ? "text-accent" : ""}>
                {item.quantity}
              </TD>
              <TD muted>{item.min_quantity}</TD>
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
          ))}
        </Table>
      </Card>

      <AdminPagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}