import { useEffect, useState } from 'react'
import { adminUsersApi } from '../../api/index.js'
import { Card, Table, TR, TD, Badge, Btn, Modal, Input, Select, FilterTabs, AdminPagination, SearchInput } from './ui.jsx'
import { toast, formatDate, getInitials, debounce, translateApiError } from '../../utils/index.js'

const LIMIT = 10
const emptyForm = { name: '', email: '', password: '', role: 'user' }
const ROLE_LABELS = { user: 'Khách hàng', staff: 'Nhân viên', admin: 'Quản trị viên' }
const ROLE_TONES = { user: 'muted', staff: 'warning', admin: 'info' }

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'add' | user
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    adminUsersApi.getAll({ page, limit: LIMIT, ...(search ? { q: search } : {}) })
      .then(res => { setUsers(res.data || []); setTotal(res.total || 0) })
      .catch(err => toast.error(translateApiError(err, 'Tải dữ liệu thất bại')))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [page, search])

  const handleSearchChange = debounce((v) => { setPage(1); setSearch(v) }, 400)

  const filtered = roleFilter === 'all' ? users : users.filter(u => u.role === roleFilter)

  const openAdd = () => { setForm(emptyForm); setModal('add') }
  const openEdit = (u) => { setForm({ name: u.name, email: u.email, password: '', role: u.role }); setModal(u) }

  const handleSave = () => {
    if (!form.name || !form.email || (modal === 'add' && !form.password)) return
    setSaving(true)
    const payload = { name: form.name, email: form.email, role: form.role }
    if (form.password) payload.password = form.password
    const action = modal === 'add' ? adminUsersApi.create(payload) : adminUsersApi.update(modal.id, payload)
    action
      .then(() => { toast.success(modal === 'add' ? 'Đã tạo tài khoản' : 'Đã cập nhật tài khoản'); setModal(null); load() })
      .catch(err => toast.error(translateApiError(err, 'Không thể lưu')))
      .finally(() => setSaving(false))
  }

  const handleDelete = (u) => {
    if (!confirm(`Xoá tài khoản "${u.name}"?`)) return
    adminUsersApi.remove(u.id)
      .then(() => { toast.success('Đã xoá tài khoản'); load() })
      .catch(err => toast.error(translateApiError(err, 'Không thể xoá')))
  }

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
        <Btn onClick={openAdd}>➕ Thêm tài khoản</Btn>
      </div>

      <Card>
        <Table
          headers={['Tài khoản', 'Email', 'Vai trò', 'Ngày tạo', '']}
          colWidths={['200px', '240px', '140px', '120px', '100px']}
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
              <TD noTruncate>
                <div className="flex gap-3">
                  <span className="text-vnpt font-bold cursor-pointer text-xs" onClick={() => openEdit(u)}>Sửa</span>
                  <span className="text-accent font-bold cursor-pointer text-xs" onClick={() => handleDelete(u)}>Xoá</span>
                </div>
              </TD>
            </TR>
          ))}
        </Table>
      </Card>

      <AdminPagination page={page} totalPages={totalPages} onChange={setPage} />

      {modal && (
        <Modal title={modal === 'add' ? 'Thêm tài khoản mới' : `Sửa: ${modal.name}`} onClose={() => setModal(null)} width="max-w-[500px]">
          <Input label="Họ và tên" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Nguyễn Văn A" />
          <Input label="Email" required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@vnpt.vn" />
          <Input label={modal === 'add' ? 'Mật khẩu' : 'Mật khẩu mới (để trống nếu không đổi)'} required={modal === 'add'} type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Tối thiểu 6 ký tự" />
          <Select label="Vai trò" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} options={[['user', 'Khách hàng'], ['staff', 'Nhân viên'], ['admin', 'Quản trị viên']]} />
          <div className="flex justify-end gap-2.5">
            <Btn variant="ghost" onClick={() => setModal(null)}>Huỷ</Btn>
            <Btn onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu tài khoản'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}