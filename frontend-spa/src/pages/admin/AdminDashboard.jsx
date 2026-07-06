import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ordersApi, contactApi, inventoryApi } from '../../api/index.js'
import { Card, CardHeader, StatCard, Badge, Table, TR, TD } from './ui.jsx'
import { formatPrice, formatDate } from '../../utils/index.js'

const ORDER_STATUS = {
  pending:   { label: 'Chờ xác nhận', tone: 'warning' },
  confirmed: { label: 'Đã xác nhận',  tone: 'info' },
  shipping:  { label: 'Đang giao',    tone: 'info' },
  completed: { label: 'Hoàn tất',     tone: 'success' },
  cancelled: { label: 'Đã huỷ',       tone: 'error' },
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [totalOrders, setTotalOrders] = useState(0)
  const [newContacts, setNewContacts] = useState(0)
  const [lowStock, setLowStock] = useState([])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    Promise.allSettled([
      ordersApi.getAll({ limit: 6 }),
      contactApi.getAll(),
      inventoryApi.getLowStock(),
    ]).then(([ordersRes, contactsRes, lowStockRes]) => {
      if (!mounted) return
      if (ordersRes.status === 'fulfilled') {
        setOrders(ordersRes.value.data || [])
        setTotalOrders(ordersRes.value.total || 0)
      }
      if (contactsRes.status === 'fulfilled') {
        setNewContacts((contactsRes.value.data || []).length)
      }
      if (lowStockRes.status === 'fulfilled') {
        setLowStock(lowStockRes.value.data || [])
      }
      setLoading(false)
    })
    return () => { mounted = false }
  }, [])

  const revenue = orders
    .filter(o => o.status === 'completed')
    .reduce((s, o) => s + Number(o.total_amount || 0), 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="💰" label="Doanh thu (đơn gần đây, hoàn tất)" value={formatPrice(revenue)} />
        <StatCard icon="📦" label="Tổng số đơn hàng" value={totalOrders} />
        <StatCard icon="💬" label="Tin nhắn liên hệ" value={newContacts} tone="info" />
        <StatCard icon="⚠️" label="Sản phẩm sắp/hết hàng" value={lowStock.length} tone="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <Card>
          <CardHeader title="Đơn hàng gần đây" action={<Link to="/admin/orders" className="text-xs font-bold text-vnpt hover:underline">Xem tất cả →</Link>} />
          <Table headers={['Mã đơn', 'Người nhận', 'Tổng tiền', 'Trạng thái', 'Ngày tạo']} alignRight={[2]} loading={loading} empty={!loading && 'Chưa có đơn hàng nào'}>
            {orders.map((o, i) => (
              <TR key={o.id} striped={i % 2 !== 0}>
                <TD bold className="text-vnpt">{o.order_code}</TD>
                <TD bold>{o.receiver_name || '—'}</TD>
                <TD bold align="right">{formatPrice(o.total_amount)}</TD>
                <TD><Badge {...(ORDER_STATUS[o.status] || ORDER_STATUS.pending)} /></TD>
                <TD muted>{formatDate(o.created_at)}</TD>
              </TR>
            ))}
          </Table>
        </Card>

        <Card>
          <CardHeader title="⚠️ Sắp / hết hàng" action={<Link to="/admin/inventory" className="text-xs font-bold text-vnpt hover:underline">Xem kho →</Link>} />
          <div className="px-4 py-2">
            {lowStock.length === 0 && <div className="py-6 text-center text-muted text-sm">Không có cảnh báo</div>}
            {lowStock.slice(0, 8).map(item => (
              <div key={item.id} className="py-2.5 border-b border-shade flex items-center justify-between gap-2 last:border-0">
                <span className="text-[13px] text-body truncate">{item.product_name}</span>
                <Badge label={`${item.quantity} còn`} tone={item.quantity === 0 ? 'error' : 'warning'} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}