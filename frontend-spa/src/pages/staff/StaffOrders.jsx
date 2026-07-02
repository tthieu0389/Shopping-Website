import { useEffect, useState } from 'react'
import { ordersApi } from '../../api/index.js'
import { Card, Table, TR, TD, Badge, FilterTabs, DrawerPanel, AdminPagination } from '../admin/ui.jsx'
import { formatPrice, formatDate, toast } from '../../utils/index.js'

const ORDER_STATUS = {
  pending:   { label: 'Chờ xác nhận', tone: 'warning' },
  confirmed: { label: 'Đã xác nhận',  tone: 'info' },
  shipping:  { label: 'Đang giao',    tone: 'info' },
  completed: { label: 'Hoàn tất',     tone: 'success' },
  cancelled: { label: 'Đã huỷ',       tone: 'error' },
}

const LIMIT = 10

export default function StaffOrders() {
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  const load = () => {
    setLoading(true)
    ordersApi.getAll({ page, limit: LIMIT, ...(status !== 'all' ? { status } : {}) })
      .then(res => { setOrders(res.data || []); setTotal(res.total || 0) })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, status])

  const tabs = [['all', 'Tất cả'], ...Object.entries(ORDER_STATUS).map(([k, v]) => [k, v.label])]
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  return (
    <div className="flex flex-col gap-4">
      {/* Read-only notice */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-semibold">
        👁️ Chế độ xem — Nhân viên không thể thay đổi trạng thái đơn hàng
      </div>

      <FilterTabs options={tabs} value={status} onChange={(v) => { setStatus(v); setPage(1) }} />

      <Card>
        <Table
          headers={['Mã đơn', 'Người nhận', 'SĐT', 'Tổng tiền', 'Thanh toán', 'Trạng thái', 'Ngày tạo', '']}
          loading={loading}
          empty={!loading && 'Không có đơn hàng nào'}
        >
          {orders.map((o, i) => (
            <TR key={o.id} striped={i % 2 !== 0} onClick={() => setSelected(o)}>
              <TD bold className="text-vnpt">{o.order_code}</TD>
              <TD bold>{o.receiver_name || '—'}</TD>
              <TD muted>{o.receiver_phone || '—'}</TD>
              <TD bold>{formatPrice(o.total_amount)}</TD>
              <TD muted className="uppercase text-[11px]">{o.payment_method === 'cod' ? 'COD' : `PM #${o.payment_method}`}</TD>
              <TD><Badge {...(ORDER_STATUS[o.status] || ORDER_STATUS.pending)} /></TD>
              <TD muted>{formatDate(o.created_at)}</TD>
              <TD><span className="text-vnpt text-xs font-bold cursor-pointer">Chi tiết</span></TD>
            </TR>
          ))}
        </Table>
      </Card>

      <AdminPagination page={page} totalPages={totalPages} onChange={setPage} />

      {/* Drawer xem chi tiết — không có nút đổi trạng thái */}
      <DrawerPanel open={!!selected} onClose={() => setSelected(null)} title={`Đơn hàng ${selected?.order_code || ''}`}>
        {selected && (
          <div>
            <div className="bg-cream rounded-xl p-4 mb-5">
              <div className="grid grid-cols-2 gap-3 text-[13px]">
                {[
                  ['Người nhận', selected.receiver_name],
                  ['SĐT', selected.receiver_phone],
                  ['Tổng tiền', formatPrice(selected.total_amount)],
                  ['Phí ship', formatPrice(selected.shipping_fee)],
                  ['Thanh toán', selected.payment_method === 'cod' ? 'COD' : `PM #${selected.payment_method}`],
                  ['Ngày tạo', formatDate(selected.created_at)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="text-muted text-[11px] mb-0.5">{k}</div>
                    <div className="font-bold text-body">{v ?? '—'}</div>
                  </div>
                ))}
              </div>
              {selected.shipping_address && (
                <div className="mt-3 text-xs text-muted">📍 {selected.shipping_address}</div>
              )}
              {selected.note && (
                <div className="mt-2 text-xs text-muted italic">📝 {selected.note}</div>
              )}
            </div>

            {/* Hiển thị trạng thái hiện tại — không có nút thay đổi */}
            <div className="mb-3 text-[13px] font-bold text-body">Trạng thái đơn hàng</div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-[9px] border border-vnpt bg-vnpt-light">
              <Badge {...(ORDER_STATUS[selected.status] || ORDER_STATUS.pending)} />
              <span className="text-[13px] text-vnpt font-semibold">
                {ORDER_STATUS[selected.status]?.label || selected.status}
              </span>
            </div>
            <div className="mt-3 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700 font-semibold">
              🔒 Thay đổi trạng thái đơn hàng chỉ dành cho Quản trị viên
            </div>
          </div>
        )}
      </DrawerPanel>
    </div>
  )
}
