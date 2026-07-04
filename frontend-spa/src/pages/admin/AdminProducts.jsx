import { useEffect, useState } from 'react'
import { productsApi, categoriesApi, productImagesApi, inventoryApi } from '../../api/index.js'
import { Card, Table, TR, TD, Badge, Btn, Modal, Input, Select, Textarea, AdminPagination } from './ui.jsx'
import { formatPrice, toast, debounce, resolveImageUrl } from '../../utils/index.js'

const LIMIT = 10
const emptyForm = { name: '', description: '', price: '', stock: '', category_id: '', brand: 'VNPT', model: '', product_type: 'device', is_available: true, min_quantity: '5' }

function SectionLabel({ children }) {
  return <div className="text-[11px] font-bold text-muted uppercase tracking-wide mb-2.5">{children}</div>
}

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'add' | product
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [imageModal, setImageModal] = useState(null) // null | product

  useEffect(() => { categoriesApi.getAll().then(res => setCategories(res.data || [])) }, [])

  const load = () => {
    setLoading(true)
    productsApi.getAll({ page, limit: LIMIT, ...(search ? { q: search } : {}) })
      .then(res => { setProducts(res.data || []); setTotal(res.total || 0) })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, search])

  const handleSearchChange = debounce((v) => { setPage(1); setSearch(v) }, 400)

  const openAdd = () => { setForm(emptyForm); setModal('add') }
  const openEdit = (p) => {
    setForm({
      name: p.name, description: p.description || '', price: String(p.price), stock: String(p.stock ?? 0),
      category_id: p.category_id ? String(p.category_id) : '', brand: p.brand || 'VNPT', model: p.model || '',
      product_type: p.product_type || 'device', is_available: !!p.is_available,
    })
    setModal(p)
  }

  const handleSave = () => {
    if (!form.name || !form.price) return
    setSaving(true)
    const payload = {
      name: form.name, description: form.description, price: form.price, stock: form.stock,
      category_id: form.category_id || undefined, brand: form.brand, model: form.model,
      product_type: form.product_type, is_available: form.is_available,
    }

    if (modal === 'add') {
      // Tạo sản phẩm mới, đồng thời tạo luôn dòng tồn kho tương ứng để sản phẩm
      // xuất hiện ngay trong trang Inventory (BE chưa tự tạo dòng inventory khi
      // tạo sản phẩm — xem ghi chú cuối file).
      productsApi.create(payload)
        .then(res => {
          const newProductId = res.data?.id
          if (!newProductId) return
          return inventoryApi.create({
            product_id: newProductId,
            quantity: form.stock || 0,
            min_quantity: form.min_quantity || 5,
          }).catch(err => {
            // Không chặn việc tạo sản phẩm nếu tạo dòng tồn kho thất bại,
            // chỉ cảnh báo để admin biết cần vào Inventory bổ sung thủ công.
            toast.error('Đã tạo sản phẩm nhưng không thể tạo dòng tồn kho: ' + (err.message || 'Lỗi không xác định'))
          })
        })
        .then(() => { toast.success('Đã thêm sản phẩm'); setModal(null); load() })
        .catch(err => toast.error(err.message || 'Không thể lưu sản phẩm'))
        .finally(() => setSaving(false))
    } else {
      productsApi.update(modal.id, payload)
        .then(() => { toast.success('Đã cập nhật sản phẩm'); setModal(null); load() })
        .catch(err => toast.error(err.message || 'Không thể lưu sản phẩm'))
        .finally(() => setSaving(false))
    }
  }

  const handleDelete = (p) => {
    if (!confirm(`Xoá sản phẩm "${p.name}"?`)) return
    productsApi.remove(p.id)
      .then(() => { toast.success('Đã xoá sản phẩm'); load() })
      .catch(err => toast.error(err.message || 'Không thể xoá'))
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT))
  const catOptions = [['', '— Không chọn —'], ...categories.map(c => [String(c.id), c.name])]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <input
          defaultValue={search}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="🔍  Tìm theo tên hoặc slug..."
          className="px-4 py-2 rounded-full border border-shade text-sm outline-none w-64 focus:border-vnpt"
        />
        <Btn onClick={openAdd}>➕ Thêm sản phẩm</Btn>
      </div>

      <Card>
        <Table
          headers={['Tên sản phẩm', 'Danh mục', 'Thương hiệu', 'Giá bán', 'Tồn kho', 'Trạng thái', '']}
          colWidths={['280px', '140px', '130px', '110px', '100px', '110px', '120px']}
          loading={loading}
          empty={!loading && 'Không có sản phẩm nào'}
        >
          {products.map((p, i) => (
            <TR key={p.id} striped={i % 2 !== 0}>
              <TD bold>{p.name}</TD>
              <TD muted>{categories.find(c => c.id === p.category_id)?.name || '—'}</TD>
              <TD muted>{p.brand}</TD>
              <TD bold>{formatPrice(p.price)}</TD>
              <TD noTruncate>
                <Badge
                  label={p.stock === 0 ? 'Hết hàng' : p.stock <= 5 ? `⚠ ${p.stock} còn` : `${p.stock} còn`}
                  tone={p.stock === 0 ? 'error' : p.stock <= 5 ? 'warning' : 'success'}
                />
              </TD>
              <TD noTruncate><Badge label={p.is_available ? 'Đang bán' : 'Tạm ẩn'} tone={p.is_available ? 'success' : 'muted'} /></TD>
              <TD noTruncate>
                <div className="flex gap-3">
                  <span className="text-muted font-bold cursor-pointer text-xs" onClick={() => setImageModal(p)}>Ảnh</span>
                  <span className="text-vnpt font-bold cursor-pointer text-xs" onClick={() => openEdit(p)}>Sửa</span>
                  <span className="text-accent font-bold cursor-pointer text-xs" onClick={() => handleDelete(p)}>Xoá</span>
                </div>
              </TD>
            </TR>
          ))}
        </Table>
      </Card>

      <AdminPagination page={page} totalPages={totalPages} onChange={setPage} />

      {modal && (
        <Modal title={modal === 'add' ? 'Thêm sản phẩm mới' : `Sửa: ${modal.name}`} onClose={() => setModal(null)} width="max-w-[620px]">
          <div className="flex flex-col gap-5">
            <section>
              <SectionLabel>Thông tin cơ bản</SectionLabel>
              <Input label="Tên sản phẩm" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="VD: iPhone 16 Pro Max 256GB" />
              <Textarea label="Mô tả" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Mô tả sản phẩm..." />
            </section>

            <section>
              <SectionLabel>Phân loại</SectionLabel>
              <div className="grid grid-cols-2 gap-x-3">
                <Select label="Danh mục" value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))} options={catOptions} />
                <Select label="Loại sản phẩm" value={form.product_type} onChange={e => setForm(p => ({ ...p, product_type: e.target.value }))}
                  options={[['device', 'Điện thoại/Thiết bị'], ['sim', 'Sim số'], ['internet', 'Gói cước'], ['accessory', 'Phụ kiện']]} />
                <Input label="Thương hiệu" value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))} placeholder="Apple, Samsung, VNPT..." />
                <Input label="Mã thiết bị (model)" value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} placeholder="Không bắt buộc" />
              </div>
            </section>

            <section>
              <SectionLabel>Giá &amp; Tồn kho</SectionLabel>
              <div className={`grid gap-x-3 ${modal === 'add' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <Input label="Giá bán (VNĐ)" required type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="33990000" />
                <Input label="Tồn kho ban đầu" type="number" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} placeholder="10" />
                {modal === 'add' && (
                  <Input label="Ngưỡng cảnh báo" type="number" min="0" value={form.min_quantity} onChange={e => setForm(p => ({ ...p, min_quantity: e.target.value }))} placeholder="5" />
                )}
              </div>
            </section>

            <section>
              <SectionLabel>Hiển thị</SectionLabel>
              <Select label="Trạng thái hiển thị" value={form.is_available ? 'true' : 'false'} onChange={e => setForm(p => ({ ...p, is_available: e.target.value === 'true' }))}
                options={[['true', 'Đang bán'], ['false', 'Tạm ẩn']]} />
            </section>
          </div>

          <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-shade">
            <Btn variant="ghost" onClick={() => setModal(null)}>Huỷ</Btn>
            <Btn onClick={handleSave} disabled={saving || !form.name || !form.price}>{saving ? 'Đang lưu...' : 'Lưu sản phẩm'}</Btn>
          </div>
        </Modal>
      )}
      {imageModal && (
        <ProductImagesModal product={imageModal} onClose={() => setImageModal(null)} />
      )}
    </div>
  )
}

// ─── Modal quản lý ảnh sản phẩm (thêm / xoá / đặt ảnh đại diện) ──────────────
function ProductImagesModal({ product, onClose }) {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const load = () => {
    setLoading(true)
    productImagesApi.getByProduct(product.id)
      .then(res => setImages(res.data || []))
      .catch(err => toast.error(err.message || 'Không thể tải ảnh'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleUpload = (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    productImagesApi.upload(product.id, files)
      .then(() => { toast.success('Đã thêm ảnh'); load() })
      .catch(err => toast.error(err.message || 'Không thể tải ảnh lên'))
      .finally(() => { setUploading(false); e.target.value = '' })
  }

  const handleDelete = (img) => {
    if (!confirm('Xoá ảnh này?')) return
    setBusyId(img.id)
    productImagesApi.remove(img.id)
      .then(() => { toast.success('Đã xoá ảnh'); load() })
      .catch(err => toast.error(err.message || 'Không thể xoá ảnh'))
      .finally(() => setBusyId(null))
  }

  const handleSetThumbnail = (img) => {
    setBusyId(img.id)
    productImagesApi.setThumbnail(img.id, product.id)
      .then(() => { toast.success('Đã đặt ảnh đại diện'); load() })
      .catch(err => toast.error(err.message || 'Không thể đặt ảnh đại diện'))
      .finally(() => setBusyId(null))
  }

  return (
    <Modal title={`Ảnh sản phẩm — ${product.name}`} onClose={onClose} width="max-w-[640px]">
      <label className={`flex items-center justify-center gap-2 border-2 border-dashed border-shade rounded-xl py-6 mb-5 cursor-pointer text-sm font-semibold text-muted hover:border-vnpt hover:text-vnpt transition-colors ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
        {uploading ? 'Đang tải lên...' : '📤 Bấm để chọn ảnh (có thể chọn nhiều ảnh, tối đa 4MB/ảnh)'}
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={handleUpload} disabled={uploading} />
      </label>

      {loading ? (
        <div className="text-center text-sm text-muted py-8">Đang tải...</div>
      ) : images.length === 0 ? (
        <div className="text-center text-sm text-muted py-8">Sản phẩm chưa có ảnh nào</div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {images.map(img => (
            <div key={img.id} className="relative group rounded-lg border border-shade overflow-hidden aspect-square bg-cream">
              <img src={resolveImageUrl(img.image_url)} alt="" className="w-full h-full object-cover" />
              {img.is_thumbnail && (
                <span className="absolute top-1.5 left-1.5 bg-vnpt text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Đại diện</span>
              )}
              <div className="absolute inset-0 bg-vnpt-dark/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                {!img.is_thumbnail && (
                  <button
                    disabled={busyId === img.id}
                    onClick={() => handleSetThumbnail(img)}
                    className="px-2.5 py-1 rounded-full bg-white text-vnpt text-[11px] font-bold disabled:opacity-50"
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

      <div className="flex justify-end mt-5">
        <Btn variant="ghost" onClick={onClose}>Đóng</Btn>
      </div>
    </Modal>
  )
}