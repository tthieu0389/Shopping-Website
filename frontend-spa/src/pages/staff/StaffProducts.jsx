import { useEffect, useState } from "react";
import { productsApi, categoriesApi } from "../../api/index.js";
import {
  Card,
  Table,
  TR,
  TD,
  Badge,
  AdminPagination,
  SearchInput,
  SelectPill,
} from "./ui.jsx";
import {
  formatPrice,
  toast,
  debounce,
  resolveImageUrl,
} from "../../utils/index.js";

const LIMIT = 10;

export default function StaffProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoriesApi.getAll().then((res) => setCategories(res.data || []));
  }, []);

  const load = () => {
    setLoading(true);
    productsApi
      .getAllForAdmin({
        page,
        limit: LIMIT,
        ...(search ? { q: search } : {}),
        ...(categoryFilter ? { category_id: categoryFilter } : {}),
      })
      .then((res) => {
        setProducts(res.data || []);
        setTotal(res.total || 0);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [page, search, categoryFilter]);

  const handleSearchChange = debounce((v) => {
    setPage(1);
    setSearch(v);
  }, 400);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <SearchInput
            defaultValue={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Tìm theo tên hoặc slug..."
          />
          <SelectPill
            value={categoryFilter}
            onChange={(v) => {
              setPage(1);
              setCategoryFilter(v);
            }}
            options={[
              ["", "Tất cả danh mục"],
              ...categories.map((c) => [String(c.id), c.name]),
            ]}
          />
        </div>
        <span className="text-sm text-muted">
          Tổng: <strong className="text-body">{total}</strong> sản phẩm
        </span>
      </div>

      <Card>
        <Table
          headers={[
            "",
            "Tên sản phẩm",
            "Danh mục",
            "Thương hiệu",
            "Giá bán",
            "Tồn kho",
            "Trạng thái kho",
            "Trạng thái",
          ]}
          colWidths={[
            "4%",
            "27%",
            "13%",
            "11%",
            "13%",
            "12%",
            "12%",
            "8%",
          ]}
          alignRight={[4]}
          alignCenter={[5, 6, 7]}
          loading={loading}
          empty={!loading && "Không có sản phẩm nào"}
        >
          {products.map((p, i) => {
            const img = resolveImageUrl(
              p.thumbnail_url || p.thumbnail || p.img || p.image_url || null,
            );
            return (
              <TR key={p.id} striped={i % 2 !== 0}>
                <TD noTruncate>
                  <div className="w-9 h-9 rounded-lg bg-cream border border-shade flex items-center justify-center overflow-hidden flex-shrink-0">
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
                      <span className="text-base">📦</span>
                    )}
                  </div>
                </TD>
                <TD bold>{p.name}</TD>
                <TD muted>
                  {categories.find((c) => c.id === p.category_id)?.name || "—"}
                </TD>
                <TD muted>{p.brand}</TD>
                <TD bold align="right">{formatPrice(p.price)}</TD>
                <TD noTruncate className="text-center">
                  <Badge
                    label={
                      p.stock == null
                        ? "Chưa nhập kho"
                        : p.stock === 0
                          ? "Hết hàng"
                          : p.stock <= 5
                            ? `⚠ ${p.stock} còn`
                            : `${p.stock} còn`
                    }
                    tone={
                      p.stock == null
                        ? "muted"
                        : p.stock === 0
                          ? "error"
                          : p.stock <= 5
                            ? "warning"
                            : "success"
                    }
                  />
                </TD>
                <TD noTruncate className="text-center">
                  <Badge
                    label={
                      p.inventory_status == null ? "Chưa có"
                      : p.inventory_status === "active" ? "Đang mở kho"
                      : p.inventory_status === "inactive" ? "Tạm khóa kho"
                      : "Ẩn khỏi kho"
                    }
                    tone={
                      p.inventory_status == null ? "muted"
                      : p.inventory_status === "active" ? "success"
                      : p.inventory_status === "inactive" ? "warning"
                      : "error"
                    }
                  />
                </TD>
                <TD noTruncate className="text-center">
                  <Badge
                    label={p.is_available ? "Đang bán" : "Tạm ẩn"}
                    tone={p.is_available ? "success" : "muted"}
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