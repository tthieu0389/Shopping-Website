import { useEffect, useState } from 'react'
import { categoriesApi } from '../../api/index.js'
import { Card, Btn, Modal, Input, Textarea, Badge } from './ui.jsx'
import { toast } from '../../utils/index.js'

const emptyForm = { name: '', slug: '', description: '' }

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'add' | category
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    categoriesApi.getAll()
      .then(res => setCategories(res.data || []))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setForm(emptyForm); setModal('add') }
  const openEdit = (c) => { setForm({ name: c.name, slug: c.slug || '', description: c.description || '' }); setModal(c) }

  const handleSave = () => {
    if (!form.name) return
    setSaving(true)
    const action = modal === 'add' ? categoriesApi.create(form) : categoriesApi.update(modal.id, form)
    action
      .then(() => { toast.success(modal === 'add' ? 'Đã thêm danh mục' : 'Đã cập nhật danh mục'); setModal(null); load() })
      .catch(err => toast.error(err.message || 'Không thể lưu danh mục'))
      .finally(() => setSaving(false))
  }

  const handleDelete = (c) => {
    if (!confirm(`Xoá danh mục "${c.name}"? Sản phẩm thuộc danh mục này sẽ không bị xoá.`)) return
    categoriesApi.remove(c.id)
      .then(() => { toast.success('Đã xoá danh mục'); load() })
      .catch(err => toast.error(err.message || 'Không thể xoá danh mục'))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Btn onClick={openAdd}>➕ Thêm danh mục</Btn>
      </div>

      {loading ? (
        <div className="py-16 text-center text-muted text-sm">Đang tải...</div>
      ) : categories.length === 0 ? (
        <div className="py-16 text-center text-muted text-sm">Chưa có danh mục nào</div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
          {categories.map(c => (
            <Card key={c.id} className="p-4 text-center relative">
              <div className="text-3xl mb-2">🗂️</div>
              <div className="font-bold text-sm text-body mb-1 truncate">{c.name}</div>
              <div className="text-xs text-muted mb-2.5 truncate">{c.description || c.slug}</div>
              <Badge label={c.is_deleted ? 'Đã ẩn' : 'Hiển thị'} tone={c.is_deleted ? 'muted' : 'success'} />
              <div className="flex gap-2.5 justify-center mt-3">
                <span className="text-xs text-vnpt font-bold cursor-pointer" onClick={() => openEdit(c)}>Sửa</span>
                <span className="text-xs text-accent font-bold cursor-pointer" onClick={() => handleDelete(c)}>Xoá</span>
              </div>
            </Card>
          ))}
          <div onClick={openAdd} className="border-2 border-dashed border-shade rounded-xl flex flex-col items-center justify-center gap-2 min-h-[140px] cursor-pointer text-muted hover:border-vnpt hover:text-vnpt transition-colors">
            <span className="text-3xl">➕</span>
            <span className="text-[13px] font-semibold">Thêm mới</span>
          </div>
        </div>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Thêm danh mục' : `Sửa: ${modal.name}`} onClose={() => setModal(null)}>
          <Input label="Tên danh mục" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="VD: Điện thoại" />
          <Input label="Slug (URL, để trống để tự sinh)" value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="dien-thoai" />
          <Textarea label="Mô tả" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Mô tả ngắn về danh mục..." />
          <div className="flex justify-end gap-2.5">
            <Btn variant="ghost" onClick={() => setModal(null)}>Huỷ</Btn>
            <Btn onClick={handleSave} disabled={saving || !form.name}>{saving ? 'Đang lưu...' : 'Lưu danh mục'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
