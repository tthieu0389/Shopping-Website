import { useEffect, useState } from "react";
import { inventoryApi } from "../../api/index.js";
import {
  Card,
  Table,
  TR,
  TD,
  Badge,
  Btn,
  StatCard,
  Modal,
  Input,
  Select,
  AdminPagination,
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

export default function AdminInventory() {
  const [allItems, setAllItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [adjustItem, setAdjustItem] = useState(null);
  const [delta, setDelta] = useState("");
  const [status, setStatus] = useState("active");
  const [saving, setSaving] = useState(false);
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

  const openAdjust = (item) => {
    setDelta("");
    setStatus(item.status || "active");
    setAdjustItem(item);
  };

  const handleAdjust = () => {
    const d = parseInt(delta, 10) || 0;
    const payload = {};
    if (d) payload.quantity = Math.max(0, adjustItem.quantity + d);
    if (status !== (adjustItem.status || "active")) payload.status = status;
    if (Object.keys(payload).length === 0) return;

    setSaving(true);
    inventoryApi
      .update(adjustItem.id, payload)
      .then(() => {
        toast.success("Đã cập nhật tồn kho");
        setAdjustItem(null);
        load();
        loadStats();
      })
      .catch((err) => toast.error(err.message || "Không thể cập nhật"))
      .finally(() => setSaving(false));
  };

  const hasChange =
    (parseInt(delta, 10) || 0) !== 0 ||
    (adjustItem && status !== (adjustItem.status || "active"));

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
        <input
          defaultValue={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="🔍  Tìm theo tên sản phẩm..."
          className="px-4 py-2 rounded-full border border-shade text-sm outline-none w-64 focus:border-vnpt"
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
            "",
          ]}
          colWidths={[
            "260px",
            "90px",
            "120px",
            "110px",
            "120px",
            "110px",
            "90px",
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
              <TD noTruncate>
                <span
                  className="text-vnpt text-xs font-bold cursor-pointer"
                  onClick={() => openAdjust(item)}
                >
                  Điều chỉnh
                </span>
              </TD>
            </TR>
          ))}
        </Table>
      </Card>

      <AdminPagination page={page} totalPages={totalPages} onChange={setPage} />

      {adjustItem && (
        <Modal
          title={`Điều chỉnh kho — ${adjustItem.product_name || ""}`}
          onClose={() => setAdjustItem(null)}
          width="max-w-[400px]"
        >
          <div className="bg-cream rounded-lg p-3 mb-4 text-sm text-body">
            Tồn kho hiện tại: <strong>{adjustItem.quantity}</strong>
          </div>
          <Input
            label="Số lượng thay đổi (+nhập / -xuất)"
            type="number"
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            placeholder="VD: +20 hoặc -5"
          />
          <Select
            label="Trạng thái quản lý kho"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              ["active", "Đang quản lý"],
              ["inactive", "Tạm khoá kho"],
            ]}
          />
          <div className="flex justify-end gap-2.5 mt-3">
            <Btn variant="ghost" onClick={() => setAdjustItem(null)}>
              Huỷ
            </Btn>
            <Btn onClick={handleAdjust} disabled={saving || !hasChange}>
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
