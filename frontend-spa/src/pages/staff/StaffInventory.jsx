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
  // Thống kê 3 thẻ trên đầu — lấy từ /inventory/stats (BE tự COUNT), không
  // cần kéo hết dữ liệu kho về FE nữa.
  const [stats, setStats] = useState({ inStock: 0, lowStock: 0, outOfStock: 0, total: 0 })

  const load = () => {
    setLoading(true)
    inventoryApi.getAll({ page, limit: LIMIT, ...(search.trim() ? { q: search.trim() } : {}) })
      .then(res => { setAllItems(res.data || []); setTotal(res.total || 0) })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  const loadStats = () => {
    inventoryApi.getStats()
      .then(res => setStats(res.data || { inStock: 0, lowStock: 0, outOfStock: 0, total: 0 }))
      .catch(() => {})
  }

  useEffect(() => { load() }, [page, search])
  useEffect(() => { loadStats() }, [])

  // Search giờ đã lấy trực tiếp từ backend (/inventory hỗ trợ q), không còn
  // giới hạn trong dữ liệu trang hiện tại.
  const handleSearchChange = debounce((v) => { setPage(1); setSearch(v) }, 400)
  const items = allItems

  const totalPages = Math.max(1, Math.ceil(total / LIMIT))
  const outOfStock = stats.outOfStock
  const lowStock = stats.lowStock

  return (
    <div className="flex flex-col gap-5">

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon="📦" label="Tổng sản phẩm trong kho" value={stats.total} />
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
          colWidths={['360px', '100px', '110px', '130px']}
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
                <TD noTruncate><Badge {...st} /></TD>
              </TR>
            )
          })}
        </Table>
      </Card>

      <AdminPagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  )
}