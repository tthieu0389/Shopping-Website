import { useEffect, useState } from 'react'
import { blogsApi } from '../../api/index.js'
import { Card, Table, TR, TD, AdminPagination } from '../admin/ui.jsx'
import { toast, formatDate, debounce, resolveImageUrl } from '../../utils/index.js'

const LIMIT = 10

export default function StaffBlogs() {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    setLoading(true)
    blogsApi.getAll()
      .then(res => setBlogs(res.data || []))
      .catch(err => toast.error(err.message || 'Không thể tải danh sách tin tức'))
      .finally(() => setLoading(false))
  }, [])

  const handleSearchChange = debounce((v) => { setPage(1); setSearch(v) }, 400)

  const filtered = search.trim()
    ? blogs.filter(b =>
        (b.title || '').toLowerCase().includes(search.trim().toLowerCase()) ||
        (b.slug  || '').toLowerCase().includes(search.trim().toLowerCase()))
    : blogs

  const totalPages = Math.max(1, Math.ceil(filtered.length / LIMIT))
  const pageItems = filtered.slice((page - 1) * LIMIT, page * LIMIT)

  return (
    <div className="flex flex-col gap-4">
      {/* Read-only notice */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-semibold">
        👁️ Chế độ xem — Tạo, sửa, xoá bài viết chỉ dành cho Quản trị viên
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <input
          defaultValue={search}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="🔍  Tìm tiêu đề bài viết..."
          className="px-4 py-2 rounded-full border border-shade text-sm outline-none w-72 focus:border-vnpt bg-canvas"
        />
        <span className="text-sm text-muted">Tổng: <strong className="text-body">{filtered.length}</strong> bài viết</span>
      </div>

      <Card>
        <Table
          headers={['Bài viết', 'Slug', 'Ngày tạo', '']}
          loading={loading}
          empty={!loading && (search ? 'Không tìm thấy bài viết nào' : 'Chưa có bài viết nào')}
        >
          {pageItems.map((b, i) => {
            const thumb = resolveImageUrl(b.thumbnail_url || null)
            return (
              <TR key={b.id} striped={i % 2 !== 0}>
                <TD>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-8 rounded-md bg-cream border border-shade flex items-center justify-center overflow-hidden flex-shrink-0">
                      {thumb
                        ? <img src={thumb} alt={b.title} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
                        : <span className="text-base">📰</span>
                      }
                    </div>
                    <span className="font-bold text-body text-[13px] line-clamp-1">{b.title}</span>
                  </div>
                </TD>
                <TD muted className="text-[11px]">{b.slug}</TD>
                <TD muted>{formatDate(b.created_at)}</TD>
                <TD>
                  <button
                    onClick={() => setPreview(b)}
                    className="text-vnpt text-xs font-bold hover:underline cursor-pointer"
                  >
                    Đọc
                  </button>
                </TD>
              </TR>
            )
          })}
        </Table>
      </Card>

      <AdminPagination page={page} totalPages={totalPages} onChange={setPage} />

      {/* Preview modal */}
      {preview && (
        <div
          className="fixed inset-0 bg-vnpt-dark/55 z-[200] flex items-center justify-center p-4"
          onMouseDown={e => { if (e.target === e.currentTarget) setPreview(null) }}
        >
          <div className="bg-canvas rounded-2xl shadow-lg w-full max-w-[640px] max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-shade">
              <h3 className="text-[15px] font-bold text-body line-clamp-1">{preview.title}</h3>
              <button onClick={() => setPreview(null)} className="text-muted hover:text-body text-xl leading-none cursor-pointer">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {preview.thumbnail_url && (
                <img
                  src={resolveImageUrl(preview.thumbnail_url)}
                  alt={preview.title}
                  className="w-full h-48 object-cover rounded-xl mb-4"
                  onError={e => { e.target.style.display = 'none' }}
                />
              )}
              <div className="text-xs text-muted mb-4">{formatDate(preview.created_at)} · {preview.slug}</div>
              <div className="text-sm text-body leading-relaxed whitespace-pre-wrap">
                {preview.content || <span className="text-muted italic">Không có nội dung</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
