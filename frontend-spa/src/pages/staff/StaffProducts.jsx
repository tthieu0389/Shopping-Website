import { useEffect, useState } from "react";
import { productsApi } from "../../api/index.js";
import { Card, Table, TR, TD, Badge, AdminPagination } from "../admin/ui.jsx";
import {
  formatPrice,
  toast,
  debounce,
  resolveImageUrl,
} from "../../utils/index.js";

const LIMIT = 10;

const TYPE_LABEL = {
  device: { label: "Điện thoại", tone: "info" },
  sim: { label: "Sim số", tone: "success" },
  internet: { label: "Cước 4G/5G", tone: "info" },
  tv: { label: "Máy tính bảng", tone: "muted" },
  accessory: { label: "Phụ kiện", tone: "muted" },
};

export default function StaffProducts() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    productsApi
      .getAll({ page, limit: LIMIT, ...(search ? { q: search } : {}) })
      .then((res) => {
        setProducts(res.data || []);
        setTotal(res.total || 0);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [page, search]);

  const handleSearchChange = debounce((v) => {
    setPage(1);
    setSearch(v);
  }, 400);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="flex items-center gap-3">
        <input
          defaultValue={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="🔍  Tìm theo tên sản phẩm..."
          className="px-4 py-2 rounded-full border border-shade text-sm outline-none w-72 focus:border-vnpt bg-canvas"
        />
        <span className="text-sm text-muted">
          Tổng: <strong className="text-body">{total}</strong> sản phẩm
        </span>
      </div>

      <Card>
        <Table
          headers={["Sản phẩm", "Giá", "Loại", "Thương hiệu", "Trạng thái"]}
          colWidths={["300px", "110px", "110px", "130px", "110px"]}
          loading={loading}
          empty={
            !loading &&
            (search ? "Không tìm thấy sản phẩm nào" : "Chưa có sản phẩm")
          }
        >
          {products.map((p, i) => {
            const img = resolveImageUrl(
              p.thumbnail_url || p.img || p.thumbnail || p.image_url || null,
            );
            const typeInfo = TYPE_LABEL[p.product_type] || {
              label: p.product_type || "—",
              tone: "muted",
            };
            return (
              <TR key={p.id} striped={i % 2 !== 0}>
                <TD noTruncate>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cream border border-shade flex items-center justify-center overflow-hidden flex-shrink-0">
                      {img ? (
                        <img
                          src={img}
                          alt={p.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <span className="text-lg">📦</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-body text-[13px] truncate">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-muted truncate">
                        {p.slug}
                      </div>
                    </div>
                  </div>
                </TD>
                <TD bold>{formatPrice(p.price)}</TD>
                <TD noTruncate>
                  <Badge label={typeInfo.label} tone={typeInfo.tone} />
                </TD>
                <TD muted>{p.brand || "—"}</TD>
                <TD noTruncate>
                  <Badge
                    label={p.is_available ? "Đang bán" : "Ngừng bán"}
                    tone={p.is_available ? "success" : "error"}
                  />
                </TD>
              </TR>
            );
          })}
        </Table>
      </Card>

      <AdminPagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
