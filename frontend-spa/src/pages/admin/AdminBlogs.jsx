import { useEffect, useState } from 'react'
import { blogsApi, blogImagesApi } from '../../api/index.js'
import { Card, Table, TR, TD, Badge, Btn, Modal, Input, Textarea } from './ui.jsx'
import { toast, formatDate, resolveImageUrl, translateApiError } from '../../utils/index.js'

const LIMIT = 10
const MAX_TITLE = 200
const MAX_SLUG = 200
const MAX_CONTENT = 10000
const emptyForm = { title: '', slug: '', content: '', thumbnail_url: '' }

// Tạo slug từ tiêu đề (bỏ dấu tiếng Việt, khoảng trắng -> gạch ngang)
function slugify(str = '') {
  return str
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function AdminBlogs() {
  const [blogs, setBlogs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null) // null | 'add' | blog
  const [form, setForm] = useState(emptyForm)
  const [slugTouched, setSlugTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Phân trang lấy trực tiếp từ backend (/blogs hỗ trợ page, limit)
  const load = () => {
    setLoading(true)
    blogsApi.getAll({ page, limit: LIMIT })
      .then(res => { setBlogs(res.data || []); setTotal(res.total || 0) })
      .catch(err => toast.error(translateApiError(err, 'Không thể tải danh sách tin tức')))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [page])


  const totalPages = Math.max(1, Math.ceil(total / LIMIT))
  const pageItems = blogs

  const openAdd = () => { setForm(emptyForm); setSlugTouched(false); setModal('add') }
  const openEdit = (b) => {
    setForm({ title: b.title, slug: b.slug || '', content: b.content || '', thumbnail_url: b.thumbnail_url || '' })
    setSlugTouched(true)
    setModal(b)
  }

  const handleTitleChange = (v) => {
    const capped = v.slice(0, MAX_TITLE)
    setForm(p => ({ ...p, title: capped, slug: slugTouched ? p.slug : slugify(capped) }))
  }

  const handleThumbnailUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    blogImagesApi.upload(file, modal !== 'add' ? modal.id : undefined)
      .then(res => setForm(p => ({ ...p, thumbnail_url: res.data?.image_url || p.thumbnail_url })))
      .catch(err => toast.error(translateApiError(err, 'Không thể tải ảnh lên')))
      .finally(() => { setUploading(false); e.target.value = '' })
  }

  const handleSave = () => {
    if (!form.title.trim() || !form.content.trim()) return
    const slug = (form.slug || slugify(form.title)).trim()
    if (!slug) { toast.error('Vui lòng nhập slug hợp lệ'); return }
    setSaving(true)
    const payload = {
      title: form.title.trim(),
      slug,
      content: form.content,
      ...(form.thumbnail_url ? { thumbnail_url: form.thumbnail_url } : {}),
    }
    const req = modal === 'add' ? blogsApi.create(payload) : blogsApi.update(modal.id, payload)
    req
      .then(() => { toast.success(modal === 'add' ? 'Đã đăng bài viết' : 'Đã cập nhật bài viết'); setModal(null); load() })
      .catch(err => toast.error(translateApiError(err, 'Không thể lưu bài viết')))
      .finally(() => setSaving(false))
  }

  const handleDelete = (b) => {
    if (!confirm(`Xoá bài viết "${b.title}"?`)) return
    blogsApi.remove(b.id)
      .then(() => { toast.success('Đã xoá bài viết'); load() })
      .catch(err => toast.error(translateApiError(err, 'Không thể xoá bài viết')))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end items-center flex-wrap gap-3">
        <Btn onClick={openAdd}>➕ Đăng bài viết</Btn>
      </div>

      <Card>
        <Table
          headers={['Ảnh', 'Tiêu đề', 'Slug', 'Ngày đăng', '']}
          colWidths={['64px', '35%', '30%', '110px', '100px']}
          loading={loading}
          empty={!loading && 'Chưa có bài viết nào'}
        >
          {pageItems.map((b, i) => (
            <TR key={b.id} striped={i % 2 !== 0}>
              <TD noTruncate>
                {b.thumbnail_url ? (
                  <img src={resolveImageUrl(b.thumbnail_url)} alt="" className="w-12 h-12 rounded-lg object-cover border border-shade" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-cream flex items-center justify-center text-muted text-lg">📰</div>
                )}
              </TD>
              <TD bold>{b.title}</TD>
              <TD muted>{b.slug || <Badge label="Chưa có slug" tone="warning" />}</TD>
              <TD muted>{formatDate(b.created_at)}</TD>
              <TD noTruncate className="w-[100px] min-w-[100px] flex-shrink-0">
                <div className="flex gap-3">
                  <span className="text-vnpt font-bold cursor-pointer text-xs whitespace-nowrap" onClick={() => openEdit(b)}>Sửa</span>
                  <span className="text-accent font-bold cursor-pointer text-xs whitespace-nowrap" onClick={() => handleDelete(b)}>Xoá</span>
                </div>
              </TD>
            </TR>
          ))}
        </Table>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-1.5 py-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-8 min-w-8 px-2.5 rounded-lg text-xs font-semibold border transition-colors
                ${p === page ? 'bg-vnpt border-vnpt text-white' : 'border-shade text-muted bg-canvas hover:border-vnpt hover:text-vnpt'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {modal && (
        <Modal
          title={modal === 'add' ? 'Đăng bài viết mới' : (
            <span className="block truncate max-w-[520px]" title={`Sửa: ${modal.title}`}>
              Sửa: {modal.title}
            </span>
          )}
          onClose={() => setModal(null)} width="max-w-[640px]"
        >
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-body mb-1.5">Tiêu đề <span className="text-accent">*</span></label>
              <textarea
                rows={2}
                value={form.title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="VD: VNPT ra mắt gói cước 5G mới"
                maxLength={MAX_TITLE}
                className="w-full border border-shade rounded-lg px-3 py-2 text-[13px] text-body bg-canvas resize-y focus:outline-none focus:border-vnpt break-all"
              />
              <p className={`text-right text-[11px] mt-0.5 ${form.title.length >= MAX_TITLE ? 'text-accent font-semibold' : 'text-muted'}`}>
                {form.title.length}/{MAX_TITLE}
              </p>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-body mb-1.5">Slug (đường dẫn URL) <span className="text-accent">*</span></label>
              <textarea
                rows={2}
                value={form.slug}
                onChange={e => { setSlugTouched(true); setForm(p => ({ ...p, slug: slugify(e.target.value).slice(0, MAX_SLUG) })) }}
                placeholder="vnpt-ra-mat-goi-cuoc-5g-moi"
                maxLength={MAX_SLUG}
                className="w-full border border-shade rounded-lg px-3 py-2 text-[13px] text-body bg-canvas resize-y focus:outline-none focus:border-vnpt break-all font-mono"
              />
              <p className={`text-right text-[11px] mt-0.5 ${form.slug.length >= MAX_SLUG ? 'text-accent font-semibold' : 'text-muted'}`}>
                {form.slug.length}/{MAX_SLUG}
              </p>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-body mb-1.5">Ảnh đại diện</label>
              <div className="flex items-center gap-3">
                {form.thumbnail_url ? (
                  <img src={resolveImageUrl(form.thumbnail_url)} alt="" className="w-20 h-20 rounded-lg object-cover border border-shade flex-shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-cream flex items-center justify-center text-muted text-2xl flex-shrink-0">📰</div>
                )}
                <label className={`flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-shade rounded-xl py-4 cursor-pointer text-xs font-semibold text-muted hover:border-vnpt hover:text-vnpt transition-colors ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
                  {uploading ? 'Đang tải lên...' : '📤 Chọn ảnh đại diện (tối đa 4MB)'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleThumbnailUpload} disabled={uploading} />
                </label>
              </div>
            </div>

            <div>
              <Textarea label="Nội dung" required rows={10} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value.slice(0, MAX_CONTENT) }))} placeholder="Nội dung bài viết..." maxLength={MAX_CONTENT} />
              <p className={`text-right text-[11px] mt-0.5 ${form.content.length >= MAX_CONTENT ? 'text-accent font-semibold' : 'text-muted'}`}>
                {form.content.length.toLocaleString('vi-VN')}/{MAX_CONTENT.toLocaleString('vi-VN')}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-shade">
            <Btn variant="ghost" onClick={() => setModal(null)}>Huỷ</Btn>
            <Btn onClick={handleSave} disabled={saving || !form.title.trim() || !form.content.trim()}>
              {saving ? 'Đang lưu...' : modal === 'add' ? 'Đăng bài' : 'Lưu thay đổi'}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}