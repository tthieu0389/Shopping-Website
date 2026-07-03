import { useEffect, useMemo, useState } from 'react'
import { promotionsApi, productPromotionsApi, productsApi, categoriesApi } from '../../api/index.js'
import { Card, Table, TR, TD, Badge, Btn, Modal, Input, Select, FilterTabs, AdminPagination } from './ui.jsx'
import { formatPrice, formatDate, toast, debounce } from '../../utils/index.js'

const PAGE_SIZE = 8

const PRODUCT_TYPES = [
  ['', 'Tất cả loại'],
  ['sim', 'Sim số'],
  ['device', 'Thiết bị'],
  ['internet', 'Internet'],
  ['tv', 'Truyền hình'],
  ['accessory', 'Phụ kiện'],
]

const emptyForm = {
  name: '', discount_type: 'percent', discount_value: '',
  start_date: '', end_date: '', priority: '0', stackable: true, is_active: true,
}

// ── Trạng thái chương trình khuyến mãi theo thời gian ──────────────────────
function getPromoStatus(p) {
  if (!p.is_active) return { label: 'Đã tắt', tone: 'muted' }
  const now = new Date()
  const start = new Date(p.start_date)
  const end = new Date(p.end_date)
  if (now < start) return { label: 'Sắp diễn ra', tone: 'info' }
  if (now > end) return { label: 'Đã kết thúc', tone: 'muted' }
  return { label: 'Đang chạy', tone: 'success' }
}

function toInputDateTime(v) {
  if (!v) return ''
  const d = new Date(v)
  if (isNaN(d)) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'add' | promotion
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [assignPromo, setAssignPromo] = useState(null) // promotion đang gán sản phẩm

  const load = () => {
    setLoading(true)
    promotionsApi.getAll()
      .then(res => setPromotions(res.data || []))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openAdd = () => { setForm(emptyForm); setModal('add') }
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
    })
    setModal(p)
  }

  const handleSave = () => {
    if (!form.name || !form.discount_value || !form.start_date || !form.end_date) return
    if (new Date(form.end_date) <= new Date(form.start_date)) {
      toast.error('Ngày kết thúc phải sau ngày bắt đầu')
      return
    }
    setSaving(true)
    const payload = {
      name: form.name,
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      start_date: form.start_date,
      end_date: form.end_date,
      priority: form.priority || 0,
      stackable: form.stackable,
      is_active: form.is_active,
    }
    const req = modal === 'add' ? promotionsApi.create(payload) : promotionsApi.update(modal.id, payload)
    req
      .then(() => { toast.success(modal === 'add' ? 'Đã tạo chương trình khuyến mãi' : 'Đã cập nhật'); setModal(null); load() })
      .catch(err => toast.error(err.message || 'Không thể lưu'))
      .finally(() => setSaving(false))
  }

  const handleDelete = (p) => {
    if (!confirm(`Xoá chương trình "${p.name}"? Sản phẩm đang áp dụng sẽ gỡ khuyến mãi này.`)) return
    promotionsApi.remove(p.id)
      .then(() => { toast.success('Đã xoá'); load() })
      .catch(err => toast.error(err.message || 'Không thể xoá'))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-body m-0">Khuyến mãi &amp; Giảm giá</h2>
          <p className="text-xs text-muted mt-0.5">Tạo chương trình khuyến mãi rồi chọn sản phẩm áp dụng bên dưới</p>
        </div>
        <Btn onClick={openAdd}>➕ Thêm chương trình</Btn>
      </div>

      <Card>
        <Table
          headers={['Tên chương trình', 'Giảm giá', 'Thời gian', 'Trạng thái', 'Ưu tiên', 'Cộng dồn', '']}
          loading={loading}
          empty={!loading && 'Chưa có chương trình khuyến mãi nào'}
        >
          {promotions.map((p, i) => {
            const status = getPromoStatus(p)
            return (
              <TR key={p.id} striped={i % 2 !== 0}>
                <TD bold>{p.name}</TD>
                <TD>
                  <Badge
                    tone="info"
                    label={p.discount_type === 'percent' ? `-${Number(p.discount_value)}%` : `-${formatPrice(p.discount_value)}`}
                  />
                </TD>
                <TD muted className="whitespace-nowrap">{formatDate(p.start_date)} → {formatDate(p.end_date)}</TD>
                <TD><Badge label={status.label} tone={status.tone} /></TD>
                <TD muted>{p.priority ?? 0}</TD>
                <TD muted>{p.stackable ? 'Có' : 'Không'}</TD>
                <TD>
                  <div className="flex gap-3">
                    <span className="text-vnpt font-bold cursor-pointer text-xs" onClick={() => setAssignPromo(p)}>Gán sản phẩm</span>
                    <span className="text-muted font-bold cursor-pointer text-xs" onClick={() => openEdit(p)}>Sửa</span>
                    <span className="text-accent font-bold cursor-pointer text-xs" onClick={() => handleDelete(p)}>Xoá</span>
                  </div>
                </TD>
              </TR>
            )
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
        <AssignProductsModal promotion={assignPromo} onClose={() => setAssignPromo(null)} />
      )}
    </div>
  )
}

// ─── Modal thêm/sửa chương trình khuyến mãi ─────────────────────────────────
function PromotionFormModal({ modal, form, setForm, saving, onSave, onClose }) {
  return (
    <Modal title={modal === 'add' ? 'Thêm chương trình khuyến mãi' : `Sửa: ${modal.name}`} onClose={onClose} width="max-w-[520px]">
      <div className="flex flex-col gap-1">
        <Input label="Tên chương trình" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="VD: Flash Sale hè 2026" />

        <div className="grid grid-cols-2 gap-x-3">
          <Select
            label="Loại giảm giá" value={form.discount_type}
            onChange={e => setForm(f => ({ ...f, discount_type: e.target.value }))}
            options={[['percent', 'Phần trăm (%)'], ['fixed', 'Số tiền cố định (₫)']]}
          />
          <Input
            label={form.discount_type === 'percent' ? 'Giá trị giảm (%)' : 'Giá trị giảm (₫)'}
            required type="number" min="0" max={form.discount_type === 'percent' ? 100 : undefined}
            value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))}
            placeholder={form.discount_type === 'percent' ? '20' : '500000'}
          />
        </div>

        <div className="grid grid-cols-2 gap-x-3">
          <Input label="Bắt đầu" required type="datetime-local" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
          <Input label="Kết thúc" required type="datetime-local" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
        </div>

        <div className="grid grid-cols-2 gap-x-3">
          <Input label="Độ ưu tiên" type="number" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} placeholder="0" />
          <Select
            label="Cho phép cộng dồn"
            value={form.stackable ? 'true' : 'false'}
            onChange={e => setForm(f => ({ ...f, stackable: e.target.value === 'true' }))}
            options={[['true', 'Có — cộng dồn với KM khác'], ['false', 'Không — dùng riêng lẻ, ưu tiên cao nhất']]}
          />
        </div>

        <Select
          label="Trạng thái"
          value={form.is_active ? 'true' : 'false'}
          onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'true' }))}
          options={[['true', 'Kích hoạt'], ['false', 'Tạm tắt']]}
        />
      </div>

      <div className="flex justify-end gap-2.5 mt-5 pt-4 border-t border-shade">
        <Btn variant="ghost" onClick={onClose}>Huỷ</Btn>
        <Btn onClick={onSave} disabled={saving || !form.name || !form.discount_value || !form.start_date || !form.end_date}>
          {saving ? 'Đang lưu...' : 'Lưu chương trình'}
        </Btn>
      </div>
    </Modal>
  )
}

// ─── Modal gán khuyến mãi cho sản phẩm — có filter + search như trang Sản phẩm ─
function AssignProductsModal({ promotion, onClose }) {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  // Toàn bộ dòng gán sản phẩm hiện có (để biết SP nào đã áp dụng KM này + lấy id để xoá)
  const [assignedMap, setAssignedMap] = useState({}) // product_id -> product_promotion row id
  const [busyProductId, setBusyProductId] = useState(null)

  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [productType, setProductType] = useState('')
  const [onlyAssigned, setOnlyAssigned] = useState(false)

  useEffect(() => { categoriesApi.getAll().then(res => setCategories(res.data || [])) }, [])

  const loadAssigned = () => {
    // Backend productPromotion.getAll không trả promotion_id trên mỗi dòng,
    // chỉ trả promotion_name — match theo tên chương trình để xác định
    // dòng nào thuộc promotion đang thao tác.
    return productPromotionsApi.getAll().then(res => {
      const map = {}
      ;(res.data || []).forEach(row => {
        if (row.promotion_name === promotion.name) map[row.product_id] = row.id
      })
      setAssignedMap(map)
    }).catch(err => toast.error(err.message || 'Không thể tải danh sách sản phẩm đã áp dụng'))
  }

  const loadProducts = () => {
    setLoading(true)
    productsApi.getAll({
      page, limit: PAGE_SIZE,
      ...(search ? { q: search } : {}),
      ...(categoryId ? { category_id: categoryId } : {}),
      ...(productType ? { product_type: productType } : {}),
    })
      .then(res => { setProducts(res.data || []); setTotal(res.total || 0) })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadAssigned() }, [])
  useEffect(() => { loadProducts() }, [page, search, categoryId, productType])

  const handleSearchChange = debounce((v) => { setPage(1); setSearch(v) }, 400)

  const visibleProducts = useMemo(() => {
    if (!onlyAssigned) return products
    return products.filter(p => assignedMap[p.id] !== undefined)
  }, [products, onlyAssigned, assignedMap])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const catOptions = [['', 'Tất cả danh mục'], ...categories.map(c => [String(c.id), c.name])]

  const toggleProduct = (product) => {
    const rowId = assignedMap[product.id]
    setBusyProductId(product.id)
    const req = rowId
      ? productPromotionsApi.remove(rowId)
      : productPromotionsApi.add({ product_id: product.id, promotion_id: promotion.id })

    req
      .then(() => {
        toast.success(rowId ? `Đã gỡ khuyến mãi khỏi "${product.name}"` : `Đã áp dụng khuyến mãi cho "${product.name}"`)
        return loadAssigned()
      })
      .catch(err => toast.error(err.message || 'Thao tác thất bại'))
      .finally(() => setBusyProductId(null))
  }

  const assignedCount = Object.keys(assignedMap).length
  const discountLabel = promotion.discount_type === 'percent' ? `-${Number(promotion.discount_value)}%` : `-${formatPrice(promotion.discount_value)}`

  return (
    <Modal title={`Gán sản phẩm — ${promotion.name}`} onClose={onClose} width="max-w-[880px]">
      <div className="flex items-center gap-2 mb-4">
        <Badge label={discountLabel} tone="info" />
        <span className="text-xs text-muted">Đã áp dụng cho <strong className="text-body">{assignedCount}</strong> sản phẩm</span>
      </div>

      {/* Toolbar filter + search — cùng kiểu với trang Sản phẩm */}
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <input
          defaultValue={search}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="🔍  Tìm theo tên hoặc slug..."
          className="px-4 py-2 rounded-full border border-shade text-sm outline-none w-56 focus:border-vnpt"
        />
        <select
          value={categoryId}
          onChange={e => { setPage(1); setCategoryId(e.target.value) }}
          className="px-3.5 py-2 rounded-full border border-shade text-sm outline-none focus:border-vnpt bg-canvas"
        >
          {catOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select
          value={productType}
          onChange={e => { setPage(1); setProductType(e.target.value) }}
          className="px-3.5 py-2 rounded-full border border-shade text-sm outline-none focus:border-vnpt bg-canvas"
        >
          {PRODUCT_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <div className="ml-auto">
          <FilterTabs
            options={[['all', 'Tất cả'], ['assigned', `Đã áp dụng (${assignedCount})`]]}
            value={onlyAssigned ? 'assigned' : 'all'}
            onChange={(k) => setOnlyAssigned(k === 'assigned')}
          />
        </div>
      </div>

      <div className="border border-shade rounded-xl overflow-hidden">
        <Table headers={['', 'Sản phẩm', 'Danh mục', 'Giá gốc', 'Giá sau giảm', '']} loading={loading} empty={!loading && 'Không tìm thấy sản phẩm phù hợp'}>
          {visibleProducts.map((p, i) => {
            const isAssigned = assignedMap[p.id] !== undefined
            const discounted = promotion.discount_type === 'percent'
              ? p.price * (1 - Number(promotion.discount_value) / 100)
              : Math.max(0, p.price - Number(promotion.discount_value))
            return (
              <TR key={p.id} striped={i % 2 !== 0}>
                <TD>
                  <input
                    type="checkbox"
                    checked={isAssigned}
                    disabled={busyProductId === p.id}
                    onChange={() => toggleProduct(p)}
                    className="w-4 h-4 accent-vnpt cursor-pointer"
                  />
                </TD>
                <TD bold>{p.name}</TD>
                <TD muted>{categories.find(c => c.id === p.category_id)?.name || '—'}</TD>
                <TD muted className="line-through">{formatPrice(p.price)}</TD>
                <TD bold className={isAssigned ? 'text-accent' : ''}>{isAssigned ? formatPrice(discounted) : '—'}</TD>
                <TD>{isAssigned && <Badge label="Đang áp dụng" tone="success" />}</TD>
              </TR>
            )
          })}
        </Table>
      </div>

      {!onlyAssigned && <div className="mt-3"><AdminPagination page={page} totalPages={totalPages} onChange={setPage} /></div>}

      <div className="flex justify-end mt-5 pt-4 border-t border-shade">
        <Btn variant="ghost" onClick={onClose}>Đóng</Btn>
      </div>
    </Modal>
  )
}