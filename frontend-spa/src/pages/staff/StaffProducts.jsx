import { useEffect, useState } from "react";
import {
  productsApi,
  categoriesApi,
  productImagesApi,
  inventoryApi,
  productDetailsApi,
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
  Textarea,
  AdminPagination,
  SearchInput,
  SelectPill,
} from "../admin/ui.jsx";
import {
  formatPrice,
  toast,
  debounce,
  resolveImageUrl,
} from "../../utils/index.js";

const LIMIT = 10;

function SectionLabel({ children }) {
  return (
    <div className="text-[11px] font-bold text-muted uppercase tracking-wide mb-2.5">
      {children}
    </div>
  );
}

export default function StaffProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | product
  const [activeTab, setActiveTab] = useState("info"); // 'info' | 'specs' | 'images'
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

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

  const openEdit = (p) => {
    setForm({
      name: p.name,
      description: p.description || "",
      price: String(p.price),
      stock: String(p.stock ?? 0),
      category_id: p.category_id ? String(p.category_id) : "",
      brand: p.brand || "VNPT",
      model: p.model || "",
      product_type: p.product_type || "device",
      is_available: !!p.is_available,
      inventory_status: p.inventory_status || "active",
    });
    setActiveTab("info");
    setModal(p);
  };

  const syncInventory = (productId, stockValue) => {
    return inventoryApi
      .getByProduct(productId)
      .then((res) => res.data)
      .catch((err) => {
        if (err?.status === 404) return null;
        throw err;
      })
      .then((inv) => {
        const newQty = Number(stockValue) || 0;
        if (inv && inv.quantity !== newQty) {
          return inventoryApi.update(inv.id, { quantity: newQty });
        }
        if (!inv) {
          return inventoryApi.create({
            product_id: productId,
            quantity: newQty,
            min_quantity: 5,
          });
        }
      });
  };

  const handleSave = () => {
    if (!form.name || !form.price) return;
    if (
      form.is_available &&
      form.inventory_status &&
      form.inventory_status !== "active"
    ) {
      toast.error(
        "Không thể bật \"Đang bán\" khi Trạng thái kho chưa ở \"Đang mở kho\". Vui lòng mở kho trước hoặc chọn lại Trạng thái hiển thị.",
      );
      return;
    }
    if (
      form.inventory_status === "archived" &&
      !confirm("Ẩn sản phẩm này khỏi kho?\nSản phẩm sẽ biến mất khỏi danh sách sau khi lưu.")
    ) {
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description,
      price: form.price,
      category_id: form.category_id || undefined,
      brand: form.brand,
      model: form.model,
      product_type: form.product_type,
      is_available: form.is_available,
    };

    (async () => {
      try {
        await syncInventory(modal.id, form.stock);
        if (form.inventory_status) {
          await updateInvStatus(modal.id, form.inventory_status);
        }
        await productsApi.update(modal.id, payload);
        toast.success("Đã cập nhật sản phẩm");
        setModal(null);
        load();
      } catch (err) {
        toast.error(err.message || "Không thể lưu sản phẩm");
      } finally {
        setSaving(false);
      }
    })();
  };

  const updateInvStatus = async (productId, newStatus) => {
    const res = await inventoryApi.getByProduct(productId);
    const inv = res.data;
    if (!inv?.id) return;
    if (inv.status === newStatus) return;
    await inventoryApi.update(inv.id, { status: newStatus });
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const catOptions = [
    ["", "— Không chọn —"],
    ...categories.map((c) => [String(c.id), c.name]),
  ];

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
            "",
          ]}
          colWidths={[
            "5%",
            "24%",
            "10%",
            "9%",
            "9%",
            "12%",
            "12%",
            "9%",
            "10%",
          ]}
          alignRight={[4]}
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
                <TD noTruncate>
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
                <TD noTruncate>
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
                <TD noTruncate>
                  <Badge
                    label={p.is_available ? "Đang bán" : "Tạm ẩn"}
                    tone={p.is_available ? "success" : "muted"}
                  />
                </TD>
                <TD noTruncate>
                  <span
                    className="text-primary font-bold cursor-pointer text-xs"
                    onClick={() => openEdit(p)}
                  >
                    Sửa
                  </span>
                </TD>
              </TR>
            );
          })}
        </Table>
      </Card>

      <AdminPagination page={page} totalPages={totalPages} onChange={setPage} />

      {modal && (
        <Modal
          title={`Sửa: ${modal.name}`}
          onClose={() => setModal(null)}
          width="max-w-[620px]"
        >
          {/* Tab bar */}
          <div className="flex border-b border-shade mb-5 -mt-1">
            {[["info", "Thông tin"], ["specs", "Thông số kỹ thuật"], ["images", "Ảnh"]].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                  activeTab === id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-body"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Tab: Thông tin ── */}
          {activeTab === "info" && (
            <div className="flex flex-col gap-5">
              <section>
                <SectionLabel>Thông tin cơ bản</SectionLabel>
                <Input
                  label="Tên sản phẩm"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="VD: iPhone 16 Pro Max 256GB"
                  maxLength={200}
                />
                <Textarea
                  label="Mô tả"
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  rows={3}
                  placeholder="Mô tả sản phẩm..."
                  maxLength={3000}
                />
                <div className={`text-xs -mt-3 mb-3 text-right ${(form.description?.length || 0) >= 3000 ? "text-accent font-semibold" : "text-muted"}`}>
                  {form.description?.length || 0}/3000
                </div>
              </section>

              <section>
                <SectionLabel>Phân loại</SectionLabel>
                <div className="grid grid-cols-2 gap-x-3">
                  <Select
                    label="Danh mục"
                    value={form.category_id}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, category_id: e.target.value }))
                    }
                    options={catOptions}
                  />
                  <Select
                    label="Loại sản phẩm"
                    value={form.product_type}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, product_type: e.target.value }))
                    }
                    options={[
                      ["device", "Điện thoại/Thiết bị"],
                      ["sim", "Sim số"],
                      ["internet", "Gói cước"],
                      ["accessory", "Phụ kiện"],
                    ]}
                  />
                  <Input
                    label="Thương hiệu"
                    value={form.brand}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, brand: e.target.value }))
                    }
                    placeholder="Apple, Samsung, VNPT..."
                    maxLength={100}
                  />
                  <Input
                    label="Mã thiết bị (model)"
                    value={form.model}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, model: e.target.value }))
                    }
                    placeholder="Không bắt buộc"
                    maxLength={100}
                  />
                </div>
              </section>

              <section>
                <SectionLabel>Giá &amp; Tồn kho</SectionLabel>
                <div className="grid grid-cols-2 gap-x-3">
                  <Input
                    label="Giá bán (VNĐ)"
                    required
                    type="number"
                    value={form.price}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") { setForm((p) => ({ ...p, price: "" })); return; }
                      const num = parseFloat(raw);
                      if (!isNaN(num) && num > 9999999999.99) return;
                      setForm((p) => ({ ...p, price: raw }));
                    }}
                    onKeyDown={(e) =>
                      ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()
                    }
                    min="1"
                    max="9999999999.99"
                    step="0.01"
                    placeholder="33990000"
                  />
                  <Input
                    label="Tồn kho"
                    type="number"
                    value={form.stock}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      if (raw !== "" && parseInt(raw, 10) > 2147483647) return;
                      setForm((p) => ({ ...p, stock: raw }));
                    }}
                    onKeyDown={(e) =>
                      ["e", "E", "+", "-", "."].includes(e.key) && e.preventDefault()
                    }
                    min="0"
                    max="2147483647"
                    placeholder="10"
                  />
                </div>
              </section>

              <section>
                <SectionLabel>Hiển thị</SectionLabel>
                <div className="grid grid-cols-2 gap-x-3">
                  <Select
                    label="Trạng thái hiển thị"
                    value={form.is_available ? "true" : "false"}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        is_available: e.target.value === "true",
                      }))
                    }
                    options={[
                      ["true", "Đang bán"],
                      ["false", "Tạm ẩn"],
                    ]}
                  />
                  <Select
                    label="Trạng thái kho"
                    value={form.inventory_status || "active"}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, inventory_status: e.target.value }))
                    }
                    options={[
                      ["active", "Đang mở kho"],
                      ["inactive", "Tạm khóa kho"],
                      ["archived", "Ẩn khỏi kho"],
                    ]}
                  />
                </div>
              </section>
            </div>
          )}

          {/* ── Tab: Thông số kỹ thuật ── */}
          {activeTab === "specs" && (
            <SpecsTabContent product={modal} />
          )}

          {/* ── Tab: Ảnh ── */}
          {activeTab === "images" && (
            <ImagesTabContent product={modal} onChange={load} />
          )}

          <div className="flex items-center justify-between gap-2.5 mt-6 pt-4 border-t border-shade">
            <div className="text-xs text-muted italic">
              {(activeTab === "specs" || activeTab === "images")
                ? "✓ Các thay đổi ở tab này được lưu tự động"
                : ""}
            </div>
            <div className="flex gap-2.5">
              <Btn variant="ghost" onClick={() => setModal(null)}>
                {activeTab === "info" ? "Huỷ" : "Đóng"}
              </Btn>
              {activeTab === "info" && (
                <Btn
                  onClick={handleSave}
                  disabled={saving || !form.name || !form.price}
                >
                  {saving ? "Đang lưu..." : "Lưu sản phẩm"}
                </Btn>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Tab Thông số kỹ thuật ────────────────────────────────────────────────────
function SpecsTabContent({ product }) {
  const [specs, setSpecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editBuf, setEditBuf] = useState({ detail_name: "", detail_value: "" });
  const [newRow, setNewRow] = useState({ detail_name: "", detail_value: "" });
  const [saving, setSaving] = useState(false);
  const [addMode, setAddMode] = useState(false);

  const load = () => {
    setLoading(true);
    productDetailsApi
      .getByProduct(product.id)
      .then((res) => setSpecs(res.data || []))
      .catch((err) => toast.error(err.message || "Không thể tải thông số"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newRow.detail_name.trim() || !newRow.detail_value.trim()) return;
    setSaving(true);
    try {
      await productDetailsApi.create({ product_id: product.id, ...newRow });
      toast.success("Đã thêm thông số");
      setNewRow({ detail_name: "", detail_value: "" });
      setAddMode(false);
      load();
    } catch (err) {
      toast.error(err.message || "Không thể thêm thông số");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (spec) => {
    setEditingId(spec.id);
    setEditBuf({ detail_name: spec.detail_name, detail_value: spec.detail_value });
  };

  const handleUpdate = async (id) => {
    if (!editBuf.detail_name.trim() || !editBuf.detail_value.trim()) return;
    setSaving(true);
    try {
      await productDetailsApi.update(id, editBuf);
      toast.success("Đã cập nhật");
      setEditingId(null);
      load();
    } catch (err) {
      toast.error(err.message || "Không thể cập nhật");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (spec) => {
    if (!confirm(`Xoá thông số "${spec.detail_name}"?`)) return;
    try {
      await productDetailsApi.remove(spec.id);
      toast.success("Đã xoá");
      load();
    } catch (err) {
      toast.error(err.message || "Không thể xoá");
    }
  };

  if (loading) return <div className="text-center text-sm text-muted py-10">Đang tải...</div>;

  return (
    <div className="flex flex-col gap-4">
      {specs.length === 0 && !addMode ? (
        <div className="text-center text-sm text-muted py-10 border border-dashed border-shade rounded-xl">
          Sản phẩm chưa có thông số kỹ thuật nào
        </div>
      ) : (
        <div className="border border-shade rounded-xl overflow-hidden">
          <div className="max-h-[340px] overflow-y-auto">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[38%]" />
                <col className="w-[46%]" />
                <col className="w-[16%]" />
              </colgroup>
              <thead>
                <tr className="bg-cream border-b border-shade">
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-muted uppercase tracking-wide">Thông số</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-muted uppercase tracking-wide">Giá trị</th>
                  <th className="w-20" />
                </tr>
              </thead>
              <tbody>
                {specs.map((spec, i) => (
                  <tr key={spec.id} className={i % 2 !== 0 ? "bg-cream/50" : ""}>
                    {editingId === spec.id ? (
                      <>
                        <td className="px-3 py-2">
                          <textarea
                            className="w-full border border-shade rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-primary resize-y whitespace-pre-wrap break-words"
                            value={editBuf.detail_name}
                            onChange={(e) => setEditBuf((b) => ({ ...b, detail_name: e.target.value }))}
                            placeholder="VD: RAM"
                            maxLength={100}
                            rows={4}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <textarea
                            className="w-full border border-shade rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-primary resize-y whitespace-pre-wrap break-words"
                            value={editBuf.detail_value}
                            onChange={(e) => setEditBuf((b) => ({ ...b, detail_value: e.target.value }))}
                            placeholder="VD: 8GB"
                            maxLength={500}
                            rows={4}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2 justify-end">
                            <button disabled={saving} onClick={() => handleUpdate(spec.id)} className="text-[11px] font-bold text-primary hover:underline disabled:opacity-50">Lưu</button>
                            <button onClick={() => setEditingId(null)} className="text-[11px] font-bold text-muted hover:underline">Huỷ</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2.5 font-medium text-body break-words">{spec.detail_name}</td>
                        <td className="px-4 py-2.5 text-muted break-words">{spec.detail_value}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => startEdit(spec)} className="text-[11px] font-bold text-primary hover:underline">Sửa</button>
                            <button onClick={() => handleDelete(spec)} className="text-[11px] font-bold text-accent hover:underline">Xoá</button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}

                {addMode && (
                  <tr className="bg-primary-light/40 border-t border-shade">
                    <td className="px-3 py-2">
                      <textarea
                        autoFocus
                        className="w-full border border-shade rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-primary resize-y whitespace-pre-wrap break-words"
                        value={newRow.detail_name}
                        onChange={(e) => setNewRow((r) => ({ ...r, detail_name: e.target.value }))}
                        placeholder="VD: Màn hình, RAM, Pin..."
                        maxLength={100}
                        rows={4}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAdd(); } }}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <textarea
                        className="w-full border border-shade rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-primary resize-y whitespace-pre-wrap break-words"
                        value={newRow.detail_value}
                        onChange={(e) => setNewRow((r) => ({ ...r, detail_value: e.target.value }))}
                        placeholder="VD: 6.7 inch AMOLED"
                        maxLength={500}
                        rows={4}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAdd(); } }}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2 justify-end">
                        <button
                          disabled={saving || !newRow.detail_name.trim() || !newRow.detail_value.trim()}
                          onClick={handleAdd}
                          className="text-[11px] font-bold text-primary hover:underline disabled:opacity-40"
                        >{saving ? "..." : "Thêm"}</button>
                        <button
                          onClick={() => { setAddMode(false); setNewRow({ detail_name: "", detail_value: "" }); }}
                          className="text-[11px] font-bold text-muted hover:underline"
                        >Huỷ</button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!addMode && (
        <div>
          <button
            onClick={() => setAddMode(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary-light text-primary rounded-full text-sm font-bold hover:bg-primary hover:text-white transition-colors"
          >
            ➕ Thêm thông số
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Tab Ảnh ──────────────────────────────────────────────────────────────────
function ImagesTabContent({ product, onChange }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    productImagesApi
      .getByProduct(product.id)
      .then((res) => setImages(res.data || []))
      .catch((err) => toast.error(err.message || "Không thể tải ảnh"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    productImagesApi
      .upload(product.id, files)
      .then(() => {
        toast.success("Đã thêm ảnh");
        load();
        onChange?.();
      })
      .catch((err) => toast.error(err.message || "Không thể tải ảnh lên"))
      .finally(() => {
        setUploading(false);
        e.target.value = "";
      });
  };

  const handleDelete = (img) => {
    if (!confirm("Xoá ảnh này?")) return;
    setBusyId(img.id);
    productImagesApi
      .remove(img.id)
      .then(() => {
        toast.success("Đã xoá ảnh");
        load();
        onChange?.();
      })
      .catch((err) => toast.error(err.message || "Không thể xoá ảnh"))
      .finally(() => setBusyId(null));
  };

  const handleSetThumbnail = (img) => {
    setBusyId(img.id);
    productImagesApi
      .setThumbnail(img.id, product.id)
      .then(() => {
        toast.success("Đã đặt ảnh đại diện");
        load();
        onChange?.();
      })
      .catch((err) => toast.error(err.message || "Không thể đặt ảnh đại diện"))
      .finally(() => setBusyId(null));
  };

  return (
    <div>
      <label
        className={`flex items-center justify-center gap-2 border-2 border-dashed border-shade rounded-xl py-6 mb-5 cursor-pointer text-sm font-semibold text-muted hover:border-primary hover:text-primary transition-colors ${uploading ? "opacity-60 pointer-events-none" : ""}`}
      >
        {uploading
          ? "Đang tải lên..."
          : "📤 Bấm để chọn ảnh (có thể chọn nhiều ảnh, tối đa 4MB/ảnh)"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={handleUpload}
          disabled={uploading}
        />
      </label>

      {loading ? (
        <div className="text-center text-sm text-muted py-8">Đang tải...</div>
      ) : images.length === 0 ? (
        <div className="text-center text-sm text-muted py-8">
          Sản phẩm chưa có ảnh nào
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative group rounded-lg border border-shade overflow-hidden aspect-square bg-cream"
            >
              <img
                src={resolveImageUrl(img.image_url)}
                alt=""
                className="w-full h-full object-cover"
              />
              {img.is_thumbnail && (
                <span className="absolute top-1.5 left-1.5 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Đại diện
                </span>
              )}
              <div className="absolute inset-0 bg-primary-dark/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                {!img.is_thumbnail && (
                  <button
                    disabled={busyId === img.id}
                    onClick={() => handleSetThumbnail(img)}
                    className="px-2.5 py-1 rounded-full bg-white text-primary text-[11px] font-bold disabled:opacity-50"
                  >
                    ⭐ Đặt đại diện
                  </button>
                )}
                <button
                  disabled={busyId === img.id}
                  onClick={() => handleDelete(img)}
                  className="px-2.5 py-1 rounded-full bg-accent text-white text-[11px] font-bold disabled:opacity-50"
                >
                  ✕ Xoá
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}