import { useEffect, useMemo, useRef, useState } from "react";
import {
  promotionsApi,
  productPromotionsApi,
  productsApi,
  categoriesApi,
} from "../../api/index.js";
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
  FilterTabs,
  AdminPagination,
  SearchInput,
} from "./ui.jsx";
import {
  formatPrice,
  formatDate,
  toast,
  debounce,
  resolveImageUrl,
  getInitials,
} from "../../utils/index.js";

const PAGE_SIZE = 8;

const PRODUCT_TYPES = [
  ["", "Tất cả loại"],
  ["sim", "Sim số"],
  ["device", "Thiết bị"],
  ["internet", "Internet"],
  ["tv", "Truyền hình"],
  ["accessory", "Phụ kiện"],
];

const emptyForm = {
  name: "",
  discount_type: "percent",
  discount_value: "",
  start_date: "",
  end_date: "",
  priority: "0",
  stackable: true,
  is_active: true,
};

// ── Trạng thái chương trình khuyến mãi theo thời gian ──────────────────────
function getPromoStatus(p) {
  if (!p.is_active) return { label: "Đã tắt", tone: "muted" };
  const now = new Date();
  const start = new Date(p.start_date);
  const end = new Date(p.end_date);
  if (now < start) return { label: "Sắp diễn ra", tone: "info" };
  if (now > end) return { label: "Đã kết thúc", tone: "muted" };
  return { label: "Đang chạy", tone: "success" };
}

function toInputDateTime(v) {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d)) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | promotion
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [assignPromo, setAssignPromo] = useState(null); // promotion đang gán sản phẩm
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    promotionsApi
      .getAll()
      .then((res) => setPromotions(res.data || []))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setForm(emptyForm);
    setModal("add");
  };
  const openEdit = (p) => {
    setForm({
      name: p.name,
      discount_type: p.discount_type,
      discount_value: String(p.discount_value),
      start_date: toInputDateTime(p.start_date),
      end_date: toInputDateTime(p.end_date),
      priority: String(p.priority ?? 0),
      stackable: !!p.stackable,
      is_active: !!p.is_active,
    });
    setModal(p);
  };

  const handleSave = () => {
    if (
      !form.name ||
      !form.discount_value ||
      !form.start_date ||
      !form.end_date
    )
      return;
    if (new Date(form.end_date) <= new Date(form.start_date)) {
      toast.error("Ngày kết thúc phải sau ngày bắt đầu");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name,
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      start_date: form.start_date,
      end_date: form.end_date,
      priority: form.priority || 0,
      stackable: form.stackable,
      is_active: form.is_active,
    };
    const req =
      modal === "add"
        ? promotionsApi.create(payload)
        : promotionsApi.update(modal.id, payload);
    req
      .then(() => {
        toast.success(
          modal === "add" ? "Đã tạo chương trình khuyến mãi" : "Đã cập nhật",
        );
        setModal(null);
        load();
      })
      .catch((err) => toast.error(err.message || "Không thể lưu"))
      .finally(() => setSaving(false));
  };

  const handleDelete = (p) => {
    if (
      !confirm(
        `Xoá chương trình "${p.name}"? Sản phẩm đang áp dụng sẽ gỡ khuyến mãi này.`,
      )
    )
      return;
    promotionsApi
      .remove(p.id)
      .then(() => {
        toast.success("Đã xoá");
        load();
      })
      .catch((err) => toast.error(err.message || "Không thể xoá"));
  };

  const filteredPromotions = search.trim()
    ? promotions.filter((p) =>
        p.name.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : promotions;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-body m-0">
            Khuyến mãi &amp; Giảm giá
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Tạo chương trình khuyến mãi rồi chọn sản phẩm áp dụng bên dưới
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên chương trình..."
          />
          <Btn onClick={openAdd}>➕ Thêm chương trình</Btn>
        </div>
      </div>

      <Card>
        <Table
          headers={[
            "Tên chương trình",
            "Giảm giá",
            "Thời gian",
            "Trạng thái",
            "Ưu tiên",
            "Cộng dồn",
            "",
          ]}
          colWidths={['220px', '100px', '220px', '110px', '80px', '90px', '160px']}
          loading={loading}
          empty={
            !loading &&
            (search.trim()
              ? "Không tìm thấy chương trình phù hợp"
              : "Chưa có chương trình khuyến mãi nào")
          }
        >
          {filteredPromotions.map((p, i) => {
            const status = getPromoStatus(p);
            return (
              <TR key={p.id} striped={i % 2 !== 0}>
                <TD bold>{p.name}</TD>
                <TD noTruncate>
                  <Badge
                    tone="info"
                    label={
                      p.discount_type === "percent"
                        ? `-${Number(p.discount_value)}%`
                        : `-${formatPrice(p.discount_value)}`
                    }
                  />
                </TD>
                <TD muted noTruncate>
                  {formatDate(p.start_date)} → {formatDate(p.end_date)}
                </TD>
                <TD noTruncate>
                  <Badge label={status.label} tone={status.tone} />
                </TD>
                <TD muted>{p.priority ?? 0}</TD>
                <TD muted>{p.stackable ? "Có" : "Không"}</TD>
                <TD noTruncate>
                  <div className="flex gap-3">
                    <span
                      className="text-vnpt font-bold cursor-pointer text-xs"
                      onClick={() => setAssignPromo(p)}
                    >
                      Gán sản phẩm
                    </span>
                    <span
                      className="text-muted font-bold cursor-pointer text-xs"
                      onClick={() => openEdit(p)}
                    >
                      Sửa
                    </span>
                    <span
                      className="text-accent font-bold cursor-pointer text-xs"
                      onClick={() => handleDelete(p)}
                    >
                      Xoá
                    </span>
                  </div>
                </TD>
              </TR>
            );
          })}
        </Table>
      </Card>

      {modal && (
        <PromotionFormModal
          modal={modal}
          form={form}
          setForm={setForm}
          saving={saving}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {assignPromo && (
        <AssignProductsModal
          promotion={assignPromo}
          onClose={() => setAssignPromo(null)}
        />
      )}
    </div>
  );
}

// ─── Modal thêm/sửa chương trình khuyến mãi ─────────────────────────────────
function PromotionFormModal({ modal, form, setForm, saving, onSave, onClose }) {
  return (
    <Modal
      title={
        modal === "add" ? "Thêm chương trình khuyến mãi" : `Sửa: ${modal.name}`
      }
      onClose={onClose}
      width="max-w-[520px]"
    >
      <div className="flex flex-col gap-1">
        <Input
          label="Tên chương trình"
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="VD: Flash Sale hè 2026"
        />

        <div className="grid grid-cols-2 gap-x-3">
          <Select
            label="Loại giảm giá"
            value={form.discount_type}
            onChange={(e) =>
              setForm((f) => ({ ...f, discount_type: e.target.value }))
            }
            options={[
              ["percent", "Phần trăm (%)"],
              ["fixed", "Số tiền cố định (₫)"],
            ]}
          />
          <Input
            label={
              form.discount_type === "percent"
                ? "Giá trị giảm (%)"
                : "Giá trị giảm (₫)"
            }
            required
            type="number"
            min="0"
            max={form.discount_type === "percent" ? 100 : undefined}
            value={form.discount_value}
            onChange={(e) =>
              setForm((f) => ({ ...f, discount_value: e.target.value }))
            }
            placeholder={form.discount_type === "percent" ? "20" : "500000"}
          />
        </div>

        <div className="grid grid-cols-2 gap-x-3">
          <Input
            label="Bắt đầu"
            required
            type="datetime-local"
            value={form.start_date}
            onChange={(e) =>
              setForm((f) => ({ ...f, start_date: e.target.value }))
            }
          />
          <Input
            label="Kết thúc"
            required
            type="datetime-local"
            value={form.end_date}
            onChange={(e) =>
              setForm((f) => ({ ...f, end_date: e.target.value }))
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-x-3">
          <Input
            label="Độ ưu tiên"
            type="number"
            value={form.priority}
            onChange={(e) =>
              setForm((f) => ({ ...f, priority: e.target.value }))
            }
            placeholder="0"
          />
          <Select
            label="Cho phép cộng dồn"
            value={form.stackable ? "true" : "false"}
            onChange={(e) =>
              setForm((f) => ({ ...f, stackable: e.target.value === "true" }))
            }
            options={[
              ["true", "Có — cộng dồn với KM khác"],
              ["false", "Không — dùng riêng lẻ, ưu tiên cao nhất"],
            ]}
          />
        </div>

        <Select
          label="Trạng thái"
          value={form.is_active ? "true" : "false"}
          onChange={(e) =>
            setForm((f) => ({ ...f, is_active: e.target.value === "true" }))
          }
          options={[
            ["true", "Kích hoạt"],
            ["false", "Tạm tắt"],
          ]}
        />
      </div>

      <div className="flex justify-end gap-2.5 mt-5 pt-4 border-t border-shade">
        <Btn variant="ghost" onClick={onClose}>
          Huỷ
        </Btn>
        <Btn
          onClick={onSave}
          disabled={
            saving ||
            !form.name ||
            !form.discount_value ||
            !form.start_date ||
            !form.end_date
          }
        >
          {saving ? "Đang lưu..." : "Lưu chương trình"}
        </Btn>
      </div>
    </Modal>
  );
}

// ─── Modal gán khuyến mãi cho sản phẩm — có filter + search như trang Sản phẩm ─
// Ghi chú: tab "Đã áp dụng" cần load hết sản phẩm khớp filter rồi tự phân trang ở
// client (vì lọc theo assignedMap trên 1 trang nhỏ sẽ ra rỗng nếu SP đã gán không nằm
// trong trang đó). Backend giới hạn limit tối đa 100/request (xem middlewares/pagination.js)
// nên phải gọi lặp nhiều trang cho tới khi lấy đủ, không thể xin limit lớn trong 1 lần.
const FETCH_ALL_PAGE_LIMIT = 100;
const FETCH_ALL_MAX_PAGES = 20; // chặn an toàn, tối đa 2000 sản phẩm

function fetchAllProducts(filters) {
  const collect = (page, acc) =>
    productsApi
      .getAll({ page, limit: FETCH_ALL_PAGE_LIMIT, ...filters })
      .then((res) => {
        const data = res.data || [];
        const merged = acc.concat(data);
        const total = res.total ?? merged.length;
        const hasMore =
          data.length > 0 &&
          merged.length < total &&
          page < FETCH_ALL_MAX_PAGES;
        return hasMore ? collect(page + 1, merged) : merged;
      });
  return collect(1, []);
}

function AssignProductsModal({ promotion, onClose }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Toàn bộ dòng gán sản phẩm hiện có (để biết SP nào đã áp dụng KM này + lấy id để xoá).
  // Đây là dữ liệu THÔ từ API — backend hiện không lọc sản phẩm đã bị xoá mềm
  // (is_deleted = true), nên có thể chứa cả những dòng "mồ côi" trỏ tới sản phẩm
  // không còn tồn tại nữa.
  const [rawAssignedMap, setRawAssignedMap] = useState({}); // product_id -> product_promotion row id
  // Tập hợp id của các sản phẩm CÒN TỒN TẠI (chưa xoá) — lấy 1 lần từ /products
  // (endpoint này tự lọc is_deleted ở backend rồi). Dùng để lọc rawAssignedMap
  // ở phía frontend, không cần sửa backend.
  const [validProductIds, setValidProductIds] = useState(null); // null = chưa load xong
  const [busyProductId, setBusyProductId] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [productType, setProductType] = useState("");
  const [onlyAssigned, setOnlyAssigned] = useState(false);

  // assignedMap "sạch" — chỉ giữ lại sản phẩm còn tồn tại, loại bỏ các dòng mồ côi
  // trỏ tới sản phẩm đã xoá mềm. Trước khi validProductIds load xong thì tạm dùng
  // rawAssignedMap để không bị chớp nháy giao diện (đa số trường hợp không có sản
  // phẩm nào bị xoá nên khác biệt là không đáng kể).
  const assignedMap = useMemo(() => {
    if (!validProductIds) return rawAssignedMap;
    const cleaned = {};
    Object.entries(rawAssignedMap).forEach(([productId, rowId]) => {
      if (validProductIds.has(Number(productId))) cleaned[productId] = rowId;
    });
    return cleaned;
  }, [rawAssignedMap, validProductIds]);

  // Đánh số thứ tự mỗi lần loadProducts được gọi. Khi chuyển tab/filter liên tục,
  // request "Tất cả" (nhỏ, nhanh) và request "Đã áp dụng" (fetchAllProducts, chậm
  // hơn vì lặp nhiều trang) có thể chạy song song và trả về KHÔNG đúng thứ tự.
  // Nếu không chặn lại, response đến trễ của request cũ sẽ ghi đè state của
  // request mới hơn -> tab "Đã áp dụng" hiện sai (chỉ thấy đúng phần trùng với
  // trang nhỏ của tab "Tất cả" trước đó). requestIdRef đảm bảo chỉ response của
  // lần gọi MỚI NHẤT mới được phép cập nhật state.
  const requestIdRef = useRef(0);

  useEffect(() => {
    categoriesApi.getAll().then((res) => setCategories(res.data || []));
  }, []);

  // Lấy 1 lần toàn bộ id sản phẩm còn tồn tại (không filter gì) để làm "danh sách
  // trắng" lọc rawAssignedMap phía trên.
  useEffect(() => {
    fetchAllProducts({})
      .then((list) => setValidProductIds(new Set(list.map((p) => p.id))))
      .catch(() => {
        // Nếu lỗi thì thôi, giữ nguyên rawAssignedMap (không lọc được cũng không sao)
      });
  }, []);

  const loadAssigned = () => {
    // Backend productPromotion.getAll không trả promotion_id trên mỗi dòng,
    // chỉ trả promotion_name — match theo tên chương trình để xác định
    // dòng nào thuộc promotion đang thao tác.
    return productPromotionsApi
      .getAll()
      .then((res) => {
        const map = {};
        (res.data || []).forEach((row) => {
          if (row.promotion_name === promotion.name)
            map[row.product_id] = row.id;
        });
        setRawAssignedMap(map);
      })
      .catch((err) =>
        toast.error(
          err.message || "Không thể tải danh sách sản phẩm đã áp dụng",
        ),
      );
  };

  const loadProducts = () => {
    setLoading(true);
    // Tăng requestId cho lần gọi này; dùng để nhận diện đây có còn là request
    // mới nhất tại thời điểm response trả về hay không.
    const myRequestId = ++requestIdRef.current;
    const filters = {
      ...(search ? { q: search } : {}),
      ...(categoryId ? { category_id: categoryId } : {}),
      ...(productType ? { product_type: productType } : {}),
    };
    // Tab "Đã áp dụng": lấy hết SP khớp filter (gọi lặp nhiều trang) để lọc đúng
    // toàn bộ SP đã gán, không chỉ 1 trang nhỏ.
    const req = onlyAssigned
      ? fetchAllProducts(filters).then((data) => ({ data, total: data.length }))
      : productsApi.getAll({ page, limit: PAGE_SIZE, ...filters });

    req
      .then((res) => {
        // Bỏ qua nếu đã có request mới hơn được gọi sau request này (stale response) —
        // tránh ghi đè state đúng bằng dữ liệu cũ, sai tab/filter.
        if (myRequestId !== requestIdRef.current) return;
        setProducts(res.data || []);
        setTotal(res.total || 0);
      })
      .catch((err) => {
        if (myRequestId !== requestIdRef.current) return;
        toast.error(err.message);
      })
      .finally(() => {
        if (myRequestId !== requestIdRef.current) return;
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAssigned();
  }, []);
  useEffect(() => {
    loadProducts();
  }, [page, search, categoryId, productType, onlyAssigned]);

  const handleSearchChange = debounce((v) => {
    setPage(1);
    setSearch(v);
  }, 400);
  const changeFilter = (setter) => (v) => {
    setPage(1);
    setter(v);
  };

  // Khi ở tab "Đã áp dụng", products đã là full-list khớp filter → lọc theo assignedMap
  // rồi tự phân trang ở client. Khi ở tab "Tất cả", products đã được server phân trang sẵn.
  const assignedFiltered = useMemo(
    () => products.filter((p) => assignedMap[p.id] !== undefined),
    [products, assignedMap],
  );
  const visibleProducts = onlyAssigned
    ? assignedFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : products;

  const totalPages = onlyAssigned
    ? Math.max(1, Math.ceil(assignedFiltered.length / PAGE_SIZE))
    : Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Khi bỏ tick làm assignedFiltered co lại (ở tab "Đã áp dụng"), trang hiện tại
  // có thể vượt quá totalPages mới -> slice ra mảng rỗng dù vẫn còn SP ở trang trước.
  // Tự kéo page về trang hợp lệ cuối cùng thay vì bắt người dùng tự chuyển trang/reload.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages]);

  const catOptions = [
    ["", "Tất cả danh mục"],
    ...categories.map((c) => [String(c.id), c.name]),
  ];

  const toggleProduct = (product) => {
    const rowId = assignedMap[product.id];
    setBusyProductId(product.id);
    const req = rowId
      ? productPromotionsApi.remove(rowId)
      : productPromotionsApi.add({
          product_id: product.id,
          promotion_id: promotion.id,
        });

    req
      .then(() => {
        toast.success(
          rowId
            ? `Đã gỡ khuyến mãi khỏi "${product.name}"`
            : `Đã áp dụng khuyến mãi cho "${product.name}"`,
        );
        return loadAssigned();
      })
      .catch((err) => toast.error(err.message || "Thao tác thất bại"))
      .finally(() => setBusyProductId(null));
  };

  // Chọn / bỏ chọn tất cả sản phẩm đang hiển thị trên trang hiện tại
  const pageAllAssigned =
    visibleProducts.length > 0 &&
    visibleProducts.every((p) => assignedMap[p.id] !== undefined);
  const togglePage = () => {
    setBulkBusy(true);
    const jobs = pageAllAssigned
      ? visibleProducts
          .filter((p) => assignedMap[p.id] !== undefined)
          .map((p) => productPromotionsApi.remove(assignedMap[p.id]))
      : visibleProducts
          .filter((p) => assignedMap[p.id] === undefined)
          .map((p) =>
            productPromotionsApi.add({
              product_id: p.id,
              promotion_id: promotion.id,
            }),
          );

    Promise.allSettled(jobs)
      .then(() => {
        toast.success(
          pageAllAssigned
            ? "Đã gỡ khuyến mãi khỏi trang này"
            : "Đã áp dụng khuyến mãi cho trang này",
        );
        return loadAssigned();
      })
      .finally(() => setBulkBusy(false));
  };

  const assignedCount = Object.keys(assignedMap).length;
  const isPercent = promotion.discount_type === "percent";
  const discountLabel = isPercent
    ? `-${Number(promotion.discount_value)}%`
    : `-${formatPrice(promotion.discount_value)}`;

  return (
    <Modal
      title={`Gán sản phẩm — ${promotion.name}`}
      onClose={onClose}
      maxWidth="min(94vw, 760px)"
    >
      {/* Banner tổng quan — tự xuống dòng khi hẹp, không tràn */}
      <div className="flex flex-wrap items-center gap-3 mb-4 px-4 py-3 rounded-xl bg-vnpt-light border border-vnpt/15">
        <span className="inline-flex items-center justify-center h-8 px-3 rounded-full bg-vnpt text-white font-display font-bold text-sm flex-shrink-0">
          {discountLabel}
        </span>
        <span className="text-sm text-muted">
          Áp dụng cho <strong className="text-vnpt">{assignedCount}</strong> sản
          phẩm · {formatDate(promotion.start_date)} →{" "}
          {formatDate(promotion.end_date)}
        </span>
      </div>

      {/* Toolbar filter + search — hàng 1 */}
      <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
        <SearchInput
          defaultValue={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Tìm sản phẩm..."
          wrapperClassName="flex-1 min-w-[180px]"
        />
        <SelectPill
          value={categoryId}
          onChange={changeFilter(setCategoryId)}
          options={catOptions}
        />
        <SelectPill
          value={productType}
          onChange={changeFilter(setProductType)}
          options={PRODUCT_TYPES}
        />
      </div>

      {/* Tab + chọn nhanh — hàng 2, tách riêng để hàng 1 không bị chật */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <FilterTabs
          options={[
            ["all", "Tất cả"],
            ["assigned", `Đã áp dụng (${assignedCount})`],
          ]}
          value={onlyAssigned ? "assigned" : "all"}
          onChange={(k) => {
            setPage(1);
            setOnlyAssigned(k === "assigned");
          }}
        />
        {visibleProducts.length > 0 && (
          <button
            onClick={togglePage}
            disabled={bulkBusy}
            className="text-xs font-bold text-vnpt hover:text-vnpt-dark disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            {bulkBusy
              ? "Đang xử lý..."
              : pageAllAssigned
                ? "Bỏ chọn trang này"
                : "Chọn trang này"}
          </button>
        )}
      </div>

      {/* Danh sách sản phẩm — có min-height cố định để khung không co lại khi ít sản phẩm */}
      <div className="border border-shade rounded-xl overflow-hidden min-h-[320px] flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-muted text-sm">
            Đang tải...
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted text-sm">
            {onlyAssigned
              ? "Chưa có sản phẩm nào được áp dụng"
              : "Không tìm thấy sản phẩm phù hợp"}
          </div>
        ) : (
          <div className="divide-y divide-shade max-h-[420px] overflow-y-auto">
            {visibleProducts.map((p) => {
              const isAssigned = assignedMap[p.id] !== undefined;
              const isBusy = busyProductId === p.id;
              const isOutOfStock = p.is_available === false;
              const discounted = isPercent
                ? p.price * (1 - Number(promotion.discount_value) / 100)
                : Math.max(0, p.price - Number(promotion.discount_value));
              const catName = categories.find(
                (c) => c.id === p.category_id,
              )?.name;

              return (
                <div
                  key={p.id}
                  onClick={() => !isBusy && toggleProduct(p)}
                  className={`flex items-center gap-3.5 px-4 py-3 cursor-pointer transition-colors
                    ${isAssigned ? "bg-vnpt-light/40" : "hover:bg-cream/70"} ${isBusy ? "opacity-50 pointer-events-none" : ""} ${isOutOfStock ? "opacity-50" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={isAssigned}
                    readOnly
                    className="w-4 h-4 accent-vnpt cursor-pointer flex-shrink-0"
                  />

                  {p.thumbnail_url ? (
                    <img
                      src={resolveImageUrl(p.thumbnail_url)}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover border border-shade flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-cream border border-shade flex items-center justify-center text-xs font-bold text-muted flex-shrink-0">
                      {getInitials(p.name)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="text-sm font-bold text-body truncate">
                        {p.name}
                      </div>
                      {isOutOfStock && (
                        <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wide text-white bg-shade-50 rounded px-1.5 py-0.5">
                          Hết hàng
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted truncate mt-0.5">
                      {catName || "Chưa phân loại"}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    {isAssigned ? (
                      <div className="flex items-baseline gap-2 justify-end">
                        <span className="text-xs text-muted line-through">
                          {formatPrice(p.price)}
                        </span>
                        <span className="text-sm font-bold text-accent whitespace-nowrap">
                          {formatPrice(discounted)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm font-semibold text-body whitespace-nowrap">
                        {formatPrice(p.price)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-3">
        <AdminPagination
          page={page}
          totalPages={totalPages}
          onChange={setPage}
        />
      </div>

      <div className="flex justify-end mt-4 pt-3 border-t border-shade">
        <Btn onClick={onClose}>Xong</Btn>
      </div>
    </Modal>
  );
}