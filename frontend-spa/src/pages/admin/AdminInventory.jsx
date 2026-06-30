import { useEffect, useState } from 'react'
import { inventoryApi, productsApi } from '../../api/index.js'
import { Card, Table, TR, TD, Badge, Btn, StatCard, Modal, Select, Input, AdminPagination } from './ui.jsx'
import { toast, formatDate } from '../../utils/index.js'

const LIMIT = 10

function statusOf(qty, min) {
  if (qty === 0) return { label: '✕ Hết hàng', tone: 'error' }
  if (qty <= min) return { label: '⚠ Sắp hết', tone: 'warning' }
  return { label: 'Đủ hàng', tone: 'success' }
}

export default function AdminInventory() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [adjustItem, setAdjustItem] = useState(null)
  const [delta, setDelta] = useState('')
  const [saving, setSaving] = useState(false)

  // "Thêm vào kho" cho sản phẩm chưa có dòng inventory
  const [addModal, setAddModal] = useState(false)
  const [products, setProducts] = useState([])
  const [addForm, setAddForm] = useState({ product_id: '', quantity: '', min_quantity: '5' })

  const load = () => {
    setLoading(true)
    inventoryApi.getAll({ page, limit: LIMIT })
      .then(res => { setItems(res.data || []); setTotal(res.total || 0) })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [page])

  const openAdjust = (item) => { setDelta(''); setAdjustItem(item) }

  const handleAdjust = () => {
    const d = parseInt(delta, 10)
    if (!d) return
    setSaving(true)
    const newQty = Math.max(0, adjustItem.quantity + d)
    inventoryApi.update(adjustItem.id, { quantity: newQty })
      .then(() => { toast.success('Đã cập nhật tồn kho'); setAdjustItem(null); load() })
      .catch(err => toast.error(err.message || 'Không thể cập nhật'))
      .finally(() => setSaving(false))
  }

  const openAddModal = () => {
    setAddForm({ product_id: '', quantity: '', min_quantity: '5' })
    productsApi.getAll({ limit: 100 }).then(res => setProducts(res.data || []))
    setAddModal(true)
  }

  const handleAddInventory = () => {
    if (!addForm.product_id) return
    setSaving(true)
    inventoryApi.create(addForm)
      .then(() => { toast.success('Đã thêm sản phẩm vào kho'); setAddModal(false); load() })
      .catch(err => toast.error(err.message || 'Không thể thêm'))
      .finally(() => setSaving(false))
  }

  const okCount  = items.filter(i => i.quantity > i.min_quantity).length
  const lowCount = items.filter(i => i.quantity > 0 && i.quantity <= i.min_quantity).length
  const outCount = items.filter(i => i.quantity === 0).length
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <StatCard icon="✅" label="Còn hàng đủ (trang này)" value={okCount} tone="success" />
        <StatCard icon="⚠️" label="Sắp hết (trang này)" value={lowCount} tone="warning" />
        <StatCard icon="❌" label="Hết hàng (trang này)" value={outCount} tone="error" />
      </div>

      <div className="flex justify-end">
        <Btn onClick={openAddModal}>➕ Thêm sản phẩm vào kho</Btn>
      </div>

      <Card>
        <Table headers={['Sản phẩm', 'Tồn kho', 'Ngưỡng tối thiểu', 'Trạng thái', 'Cập nhật', '']} loading={loading} empty={!loading && 'Chưa có dữ liệu kho'}>
          {items.map((item, i) => (
            <TR key={item.id} striped={i % 2 !== 0}>
              <TD bold>{item.product_name || `Sản phẩm #${item.product_id}`}</TD>
              <TD bold className={item.quantity === 0 ? 'text-accent' : ''}>{item.quantity}</TD>
              <TD muted>{item.min_quantity}</TD>
              <TD><Badge {...statusOf(item.quantity, item.min_quantity)} /></TD>
              <TD muted>{formatDate(item.updated_at)}</TD>
              <TD><span className="text-vnpt text-xs font-bold cursor-pointer" onClick={() => openAdjust(item)}>Điều chỉnh</span></TD>
            </TR>
          ))}
        </Table>
      </Card>

      <AdminPagination page={page} totalPages={totalPages} onChange={setPage} />

      {adjustItem && (
        <Modal title={`Điều chỉnh kho — ${adjustItem.product_name || ''}`} onClose={() => setAdjustItem(null)} width="max-w-[400px]">
          <div className="bg-cream rounded-lg p-3 mb-4 text-sm text-body">
            Tồn kho hiện tại: <strong>{adjustItem.quantity}</strong>
          </div>
          <Input label="Số lượng thay đổi (+nhập / -xuất)" type="number" value={delta} onChange={e => setDelta(e.target.value)} placeholder="VD: +20 hoặc -5" />
          <div className="flex justify-end gap-2.5">
            <Btn variant="ghost" onClick={() => setAdjustItem(null)}>Huỷ</Btn>
            <Btn onClick={handleAdjust} disabled={saving || !delta}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</Btn>
          </div>
        </Modal>
      )}

      {addModal && (
        <Modal title="Thêm sản phẩm vào kho" onClose={() => setAddModal(false)} width="max-w-[440px]">
          <Select label="Sản phẩm" required value={addForm.product_id} onChange={e => setAddForm(p => ({ ...p, product_id: e.target.value }))}
            options={[['', '— Chọn sản phẩm —'], ...products.map(p => [String(p.id), p.name])]} />
          <Input label="Số lượng tồn kho ban đầu" type="number" value={addForm.quantity} onChange={e => setAddForm(p => ({ ...p, quantity: e.target.value }))} placeholder="0" />
          <Input label="Ngưỡng cảnh báo tối thiểu" type="number" value={addForm.min_quantity} onChange={e => setAddForm(p => ({ ...p, min_quantity: e.target.value }))} placeholder="5" />
          <div className="flex justify-end gap-2.5">
            <Btn variant="ghost" onClick={() => setAddModal(false)}>Huỷ</Btn>
            <Btn onClick={handleAddInventory} disabled={saving || !addForm.product_id}>{saving ? 'Đang lưu...' : 'Thêm vào kho'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
