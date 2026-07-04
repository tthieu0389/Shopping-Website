import { useEffect, useState } from 'react'
import { inventoryApi } from '../../api/index.js'
import { Card, Table, TR, TD, Badge, Btn, StatCard, Modal, Input, AdminPagination } from './ui.jsx'
import { toast, formatDate, debounce } from '../../utils/index.js'

const LIMIT = 10

function statusOf(qty, min) {
  if (qty === 0) return { label: '✕ Hết hàng', tone: 'error' }
  if (qty <= min) return { label: '⚠ Sắp hết', tone: 'warning' }
  return { label: 'Đủ hàng', tone: 'success' }
}

export default function AdminInventory() {
  const [allItems, setAllItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [adjustItem, setAdjustItem] = useState(null)
  const [delta, setDelta] = useState('')
  const [saving, setSaving] = useState(false)
  // Thống kê 3 thẻ trên đầu — lấy từ /inventory/stats (BE tự COUNT), không
  // cần kéo hết dữ liệu kho về FE nữa.
  const [stats, setStats] = useState({ inStock: 0, lowStock: 0, outOfStock: 0 })

  const load = () => {
    setLoading(true)
    inventoryApi.getAll({ page, limit: LIMIT, ...(search.trim() ? { q: search.trim() } : {}) })
      .then(res => { setAllItems(res.data || []); setTotal(res.total || 0) })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  const loadStats = () => {
    inventoryApi.getStats()
      .then(res => setStats(res.data || { inStock: 0, lowStock: 0, outOfStock: 0 }))
      .catch(() => {})
  }

  useEffect(() => { load() }, [page, search])
  useEffect(() => { loadStats() }, [])

  // Search giờ đã lấy trực tiếp từ backend (/inventory hỗ trợ q — search theo
  // tên sản phẩm, join products), không còn giới hạn trong dữ liệu trang hiện tại.
  const handleSearchChange = debounce((v) => { setPage(1); setSearch(v) }, 400)
  const items = allItems

  const openAdjust = (item) => { setDelta(''); setAdjustItem(item) }

  const handleAdjust = () => {
    const d = parseInt(delta, 10)
    if (!d) return
    setSaving(true)
    const newQty = Math.max(0, adjustItem.quantity + d)
    inventoryApi.update(adjustItem.id, { quantity: newQty })
      .then(() => { toast.success('Đã cập nhật tồn kho'); setAdjustItem(null); load(); loadStats() })
      .catch(err => toast.error(err.message || 'Không thể cập nhật'))
      .finally(() => setSaving(false))
  }

  const okCount  = stats.inStock
  const lowCount = stats.lowStock
  const outCount = stats.outOfStock
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <StatCard icon="✅" label="Còn hàng đủ" value={okCount} tone="success" />
        <StatCard icon="⚠️" label="Sắp hết" value={lowCount} tone="warning" />
        <StatCard icon="❌" label="Hết hàng" value={outCount} tone="error" />
      </div>

      <div className="flex justify-between items-center flex-wrap gap-3">
        <input
          defaultValue={search}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="🔍  Tìm theo tên sản phẩm..."
          className="px-4 py-2 rounded-full border border-shade text-sm outline-none w-64 focus:border-vnpt"
        />
      </div>

      <Card>
        <Table
          headers={['Sản phẩm', 'Tồn kho', 'Ngưỡng tối thiểu', 'Trạng thái', 'Cập nhật', '']}
          colWidths={['320px', '100px', '140px', '130px', '120px', '100px']}
          loading={loading}
          empty={!loading && (search.trim() ? 'Không tìm thấy sản phẩm phù hợp' : 'Chưa có dữ liệu kho')}
        >
          {items.map((item, i) => (
            <TR key={item.id} striped={i % 2 !== 0}>
              <TD bold>{item.product_name || `Sản phẩm #${item.product_id}`}</TD>
              <TD bold className={item.quantity === 0 ? 'text-accent' : ''}>{item.quantity}</TD>
              <TD muted>{item.min_quantity}</TD>
              <TD noTruncate><Badge {...statusOf(item.quantity, item.min_quantity)} /></TD>
              <TD muted>{formatDate(item.updated_at)}</TD>
              <TD noTruncate><span className="text-vnpt text-xs font-bold cursor-pointer" onClick={() => openAdjust(item)}>Điều chỉnh</span></TD>
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
    </div>
  )
}