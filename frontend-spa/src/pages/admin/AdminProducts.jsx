import { useEffect, useState } from 'react'
import { productsApi, categoriesApi } from '../../api/index.js'
import { Card, Table, TR, TD, Badge, Btn, Modal, Input, Select, Textarea, AdminPagination } from './ui.jsx'
import { formatPrice, toast, debounce } from '../../utils/index.js'

const LIMIT = 10
const emptyForm = { name: '', description: '', price: '', stock: '', category_id: '', brand: 'VNPT', model: '', product_type: 'device', is_available: true }

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
    const action = modal === 'add' ? productsApi.create(payload) : productsApi.update(modal.id, payload)
    action
      .then(() => { toast.success(modal === 'add' ? 'Đã thêm sản phẩm' : 'Đã cập nhật sản phẩm'); setModal(null); load() })
      .catch(err => toast.error(err.message || 'Không thể lưu sản phẩm'))
      .finally(() => setSaving(false))
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
        <Table headers={['Tên sản phẩm', 'Danh mục', 'Thương hiệu', 'Giá bán', 'Tồn kho', 'Trạng thái', '']} loading={loading} empty={!loading && 'Không có sản phẩm nào'}>
          {products.map((p, i) => (
            <TR key={p.id} striped={i % 2 !== 0}>
              <TD bold>{p.name}</TD>
              <TD muted>{categories.find(c => c.id === p.category_id)?.name || '—'}</TD>
              <TD muted>{p.brand}</TD>
              <TD bold>{formatPrice(p.price)}</TD>
              <TD>
                <Badge
                  label={p.stock === 0 ? 'Hết hàng' : p.stock <= 5 ? `⚠ ${p.stock} còn` : `${p.stock} còn`}
                  tone={p.stock === 0 ? 'error' : p.stock <= 5 ? 'warning' : 'success'}
                />
              </TD>
              <TD><Badge label={p.is_available ? 'Đang bán' : 'Tạm ẩn'} tone={p.is_available ? 'success' : 'muted'} /></TD>
              <TD>
                <div className="flex gap-3">
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
        <Modal title={modal === 'add' ? 'Thêm sản phẩm mới' : `Sửa: ${modal.name}`} onClose={() => setModal(null)} width="max-w-[560px]">
          <Input label="Tên sản phẩm" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="VD: iPhone 16 Pro Max 256GB" />
          <Textarea label="Mô tả" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Mô tả sản phẩm..." />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Danh mục" value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))} options={catOptions} />
            <Select label="Loại sản phẩm" value={form.product_type} onChange={e => setForm(p => ({ ...p, product_type: e.target.value }))}
              options={[['device', 'Điện thoại/Thiết bị'], ['sim', 'Sim số'], ['internet', 'Gói cước'], ['accessory', 'Phụ kiện']]} />
            <Input label="Thương hiệu" value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))} placeholder="Apple, Samsung, VNPT..." />
            <Input label="Mã thiết bị (model)" value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} />
            <Input label="Giá bán (VNĐ)" required type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="33990000" />
            <Input label="Tồn kho ban đầu" type="number" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} placeholder="10" />
          </div>
          <Select label="Trạng thái hiển thị" value={form.is_available ? 'true' : 'false'} onChange={e => setForm(p => ({ ...p, is_available: e.target.value === 'true' }))}
            options={[['true', 'Đang bán'], ['false', 'Tạm ẩn']]} />
          <div className="flex justify-end gap-2.5 mt-2">
            <Btn variant="ghost" onClick={() => setModal(null)}>Huỷ</Btn>
            <Btn onClick={handleSave} disabled={saving || !form.name || !form.price}>{saving ? 'Đang lưu...' : 'Lưu sản phẩm'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
