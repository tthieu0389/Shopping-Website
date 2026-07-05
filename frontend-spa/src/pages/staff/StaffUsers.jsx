import { useEffect, useState } from 'react'
import { adminUsersApi } from '../../api/index.js'
import { Card, Table, TR, TD, Badge, FilterTabs, AdminPagination, SearchInput } from '../admin/ui.jsx'
import { toast, formatDate, getInitials, debounce } from '../../utils/index.js'

const LIMIT = 10
const ROLE_LABELS = { user: 'Khách hàng', staff: 'Nhân viên', admin: 'Quản trị viên' }
const ROLE_TONES = { user: 'muted', staff: 'warning', admin: 'info' }

// Bản chỉ xem của trang quản lí người dùng — dành cho nhân viên (staff).
// Staff chỉ được xem + tìm kiếm/lọc, không có quyền thêm/sửa/xoá tài khoản
// (backend cũng đã chặn các route POST/PUT/DELETE ở checkRole("admin")).
export default function StaffUsers() {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    adminUsersApi.getAll({ page, limit: LIMIT, ...(search ? { q: search } : {}) })
      .then(res => { setUsers(res.data || []); setTotal(res.total || 0) })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [page, search])

  const handleSearchChange = debounce((v) => { setPage(1); setSearch(v) }, 400)

  const filtered = roleFilter === 'all' ? users : users.filter(u => u.role === roleFilter)

  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <SearchInput
            defaultValue={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
          />
          <FilterTabs options={[['all', 'Tất cả'], ['user', 'Khách hàng'], ['staff', 'Nhân viên'], ['admin', 'Quản trị viên']]} value={roleFilter} onChange={setRoleFilter} />
        </div>
      </div>

      <Card>
        <Table
          headers={['Tài khoản', 'Email', 'Vai trò', 'Ngày tạo']}
          colWidths={['200px', '240px', '140px', '120px']}
          loading={loading}
          empty={!loading && (search ? 'Không tìm thấy tài khoản nào phù hợp' : 'Không có tài khoản nào')}
        >
          {filtered.map((u, i) => (
            <TR key={u.id} striped={i % 2 !== 0}>
              <TD noTruncate>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-vnpt-light flex items-center justify-center text-vnpt text-xs font-extrabold flex-shrink-0">{getInitials(u.name)}</div>
                  <span className="font-bold text-body truncate">{u.name}</span>
                </div>
              </TD>
              <TD muted>{u.email}</TD>
              <TD noTruncate><Badge label={ROLE_LABELS[u.role] || u.role} tone={ROLE_TONES[u.role] || 'muted'} /></TD>
              <TD muted>{formatDate(u.created_at)}</TD>
            </TR>
          ))}
        </Table>
      </Card>

      <AdminPagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  )
}