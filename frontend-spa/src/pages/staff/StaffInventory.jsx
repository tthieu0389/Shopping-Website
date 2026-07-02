import { useEffect, useState } from 'react'
import { inventoryApi } from '../../api/index.js'
import { Card, Table, TR, TD, Badge, StatCard, AdminPagination } from '../admin/ui.jsx'
import { toast, debounce } from '../../utils/index.js'

const LIMIT = 10

function statusOf(qty, min) {
  if (qty === 0) return { label: '✕ Hết hàng', tone: 'error' }
  if (qty <= min) return { label: '⚠ Sắp hết', tone: 'warning' }
  return { label: 'Đủ hàng', tone: 'success' }
}

export default function StaffInventory() {
  const [allItems, setAllItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [statsItems, setStatsItems] = useState([])

  const load = () => {
    setLoading(true)
    inventoryApi.getAll({ page, limit: LIMIT })
      .then(res => { setAllItems(res.data || []); setTotal(res.total || 0) })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  const loadStats = () => {
    inventoryApi.getAll({ page: 1, limit: 100000 })
      .then(res => setStatsItems(res.data || []))
      .catch(() => {})
  }

  useEffect(() => { load() }, [page])
  useEffect(() => { loadStats() }, [])

  const handleSearchChange = debounce((v) => setSearch(v), 400)
  const items = search.trim()
    ? allItems.filter(item => (item.product_name || '').toLowerCase().includes(search.trim().toLowerCase()))
    : allItems

  const totalPages = Math.max(1, Math.ceil(total / LIMIT))
  const outOfStock = statsItems.filter(i => i.quantity === 0).length
  const lowStock = statsItems.filter(i => i.quantity > 0 && i.quantity <= (i.min_quantity || 5)).length

  return (
    <div className="flex flex-col gap-5">
      {/* Read-only notice */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-semibold">
        👁️ Chế độ xem — Điều chỉnh tồn kho chỉ dành cho Quản trị viên
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon="📦" label="Tổng sản phẩm trong kho" value={statsItems.length} />
        <StatCard icon="⚠️" label="Sắp hết hàng" value={lowStock} tone="warning" />
        <StatCard icon="❌" label="Đã hết hàng" value={outOfStock} tone="error" />
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <input
          defaultValue={search}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="🔍  Tìm theo tên sản phẩm..."
          className="px-4 py-2 rounded-full border border-shade text-sm outline-none w-72 focus:border-vnpt bg-canvas"
        />
      </div>

      <Card>
        <Table
          headers={['Sản phẩm', 'Tồn kho', 'Tối thiểu', 'Trạng thái']}
          loading={loading}
          empty={!loading && 'Không có dữ liệu kho'}
        >
          {items.map((item, i) => {
            const st = statusOf(item.quantity, item.min_quantity)
            return (
              <TR key={item.id} striped={i % 2 !== 0}>
                <TD bold>{item.product_name || `SP #${item.product_id}`}</TD>
                <TD bold className={item.quantity === 0 ? 'text-red-600' : item.quantity <= item.min_quantity ? 'text-amber-600' : 'text-success'}>
                  {item.quantity}
                </TD>
                <TD muted>{item.min_quantity ?? 5}</TD>
                <TD><Badge {...st} /></TD>
              </TR>
            )
          })}
        </Table>
      </Card>

      <AdminPagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  )
}
