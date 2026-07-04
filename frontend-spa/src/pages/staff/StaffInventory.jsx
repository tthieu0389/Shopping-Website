import { useEffect, useState } from "react";
import { inventoryApi } from "../../api/index.js";
import {
  Card,
  Table,
  TR,
  TD,
  Badge,
  Btn,
  Modal,
  Input,
  Select,
  StatCard,
  AdminPagination,
} from "../admin/ui.jsx";
import { toast, debounce } from "../../utils/index.js";

const LIMIT = 10;

function statusOf(qty, min) {
  if (qty === 0) return { label: "✕ Hết hàng", tone: "error" };
  if (qty <= min) return { label: "⚠ Sắp hết", tone: "warning" };
  return { label: "Đủ hàng", tone: "success" };
}

// Trạng thái quản lý dòng tồn kho (khác trạng thái còn/hết hàng ở trên) —
// staff cũng được phép đổi (BE cho phép cả admin, staff gọi PUT /inventory/{id}).
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
  const [statsItems, setStatsItems] = useState([]);
  const [adjustItem, setAdjustItem] = useState(null);
  const [delta, setDelta] = useState("");
  const [status, setStatus] = useState("active");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    inventoryApi
      .getAll({ page, limit: LIMIT })
      .then((res) => {
        setAllItems(res.data || []);
        setTotal(res.total || 0);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  const loadStats = () => {
    inventoryApi
      .getAll({ page: 1, limit: 100000 })
      .then((res) => setStatsItems(res.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, [page]);
  useEffect(() => {
    loadStats();
  }, []);

  const handleSearchChange = debounce((v) => setSearch(v), 400);
  const items = search.trim()
    ? allItems.filter((item) =>
        (item.product_name || "")
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
      )
    : allItems;

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const outOfStock = statsItems.filter((i) => i.quantity === 0).length;
  const lowStock = statsItems.filter(
    (i) => i.quantity > 0 && i.quantity <= (i.min_quantity || 5),
  ).length;

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

  return (
    <div className="flex flex-col gap-5">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon="📦"
          label="Tổng sản phẩm trong kho"
          value={statsItems.length}
        />
        <StatCard
          icon="⚠️"
          label="Sắp hết hàng"
          value={lowStock}
          tone="warning"
        />
        <StatCard
          icon="❌"
          label="Đã hết hàng"
          value={outOfStock}
          tone="error"
        />
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <input
          defaultValue={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="🔍  Tìm theo tên sản phẩm..."
          className="px-4 py-2 rounded-full border border-shade text-sm outline-none w-72 focus:border-vnpt bg-canvas"
        />
      </div>

      <Card>
        <Table
          headers={[
            "Sản phẩm",
            "Tồn kho",
            "Tối thiểu",
            "Trạng thái",
            "Quản lý kho",
            "",
          ]}
          loading={loading}
          empty={!loading && "Không có dữ liệu kho"}
        >
          {items.map((item, i) => {
            const st = statusOf(item.quantity, item.min_quantity);
            return (
              <TR key={item.id} striped={i % 2 !== 0}>
                <TD bold>{item.product_name || `SP #${item.product_id}`}</TD>
                <TD
                  bold
                  className={
                    item.quantity === 0
                      ? "text-red-600"
                      : item.quantity <= item.min_quantity
                        ? "text-amber-600"
                        : "text-success"
                  }
                >
                  {item.quantity}
                </TD>
                <TD muted>{item.min_quantity ?? 5}</TD>
                <TD>
                  <Badge {...st} />
                </TD>
                <TD noTruncate>
                  <Badge
                    {...(INVENTORY_STATUS_LABEL[item.status] ||
                      INVENTORY_STATUS_LABEL.active)}
                  />
                </TD>
                <TD noTruncate>
                  <span
                    className="text-vnpt text-xs font-bold cursor-pointer"
                    onClick={() => openAdjust(item)}
                  >
                    Điều chỉnh
                  </span>
                </TD>
              </TR>
            );
          })}
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
