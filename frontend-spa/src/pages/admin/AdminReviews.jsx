import { useEffect, useState, useRef } from 'react'
import { reviewsApi, categoriesApi } from '../../api/index.js'
import {
  Card, Table, TR, TD, Badge, Btn,
  AdminPagination, SearchInput, SelectPill,
} from './ui.jsx'
import { toast, resolveImageUrl, formatDate } from '../../utils/index.js'

const LIMIT = 10

// ─── Star display ────────────────────────────────────────────────────────────
function Stars({ rating }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} sao`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          className={`w-3.5 h-3.5 flex-shrink-0 ${s <= rating ? 'text-warning' : 'text-shade'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

// ─── Confirm Delete Modal ────────────────────────────────────────────────────
function ConfirmDeleteModal({ review, onConfirm, onCancel, loading }) {
  if (!review) return null
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[200] backdrop-blur-[2px]"
        onClick={onCancel}
      />
      {/* Dialog */}
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
        <div className="bg-canvas rounded-2xl shadow-lg w-full max-w-[420px] overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-shade flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-error/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-bold text-body">Xoá đánh giá này?</h3>
              <p className="text-sm text-muted mt-1">
                Hành động này không thể hoàn tác.
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-muted hover:text-body transition-colors flex-shrink-0 -mt-0.5"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Preview card */}
          <div className="px-6 py-4">
            <div className="bg-cream rounded-xl p-4 flex gap-3 items-start">
              {/* Product thumbnail */}
              <div className="w-12 h-12 rounded-lg bg-shade flex items-center justify-center overflow-hidden flex-shrink-0 border border-shade">
                {review.thumbnail_url ? (
                  <img
                    src={resolveImageUrl(review.thumbnail_url)}
                    alt={review.product_name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <span className="text-xl">📦</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-muted uppercase tracking-wide mb-0.5">
                  {review.product_name}
                </p>
                <Stars rating={review.rating} />
                <p className="text-sm text-body mt-1.5 line-clamp-2 leading-relaxed">
                  {review.comment || <span className="italic text-muted">Không có nội dung</span>}
                </p>
                <p className="text-xs text-muted mt-1.5">
                  — {review.user_name}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 flex gap-2.5 justify-end">
            <Btn variant="ghost" onClick={onCancel} disabled={loading}>
              Huỷ
            </Btn>
            <Btn variant="accent" onClick={onConfirm} disabled={loading}>
              {loading ? 'Đang xoá...' : 'Xoá đánh giá'}
            </Btn>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function AdminReviews() {
  const [reviews, setReviews]           = useState([])
  const [categories, setCategories]     = useState([])
  const [total, setTotal]               = useState(0)
  const [page, setPage]                 = useState(1)
  const [search, setSearch]             = useState('')
  const [searchInput, setSearchInput]   = useState('')
  const [ratingFilter, setRatingFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [loading, setLoading]           = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null) // review to confirm delete
  const [deleting, setDeleting]         = useState(false)
  const debounceRef = useRef(null)

  // Load categories once
  useEffect(() => {
    categoriesApi.getAll()
      .then((res) => setCategories(res.data || []))
      .catch(() => {})
  }, [])

  // Load reviews when filters/page change
  const load = () => {
    setLoading(true)
    const params = {
      limit: LIMIT,
      offset: (page - 1) * LIMIT,
      ...(search        ? { q: search }                     : {}),
      ...(ratingFilter  ? { rating: Number(ratingFilter) }  : {}),
      ...(categoryFilter ? { category_id: Number(categoryFilter) } : {}),
    }
    // reviewsApi.getAllForAdmin calls GET /reviews/admin
    reviewsApi.getAllForAdmin(params)
      .then((res) => {
        setReviews(res.data || [])
        setTotal(res.total || 0)
      })
      .catch((err) => toast.error(err.message || 'Không thể tải đánh giá'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, search, ratingFilter, categoryFilter])

  const handleSearchInput = (val) => {
    setSearchInput(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearch(val.trim())
      setPage(1)
    }, 400)
  }

  const hasActiveFilters = !!search || !!ratingFilter || !!categoryFilter

  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    setRatingFilter('')
    setCategoryFilter('')
    setPage(1)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    setDeleting(true)
    reviewsApi.delete(deleteTarget.id)
      .then(() => {
        toast.success('Đã xoá đánh giá')
        setDeleteTarget(null)
        // Stay on page, re-fetch. If last item on page, go back one page.
        if (reviews.length === 1 && page > 1) {
          setPage((p) => p - 1)
        } else {
          load()
        }
      })
      .catch((err) => toast.error(err.message || 'Không thể xoá'))
      .finally(() => setDeleting(false))
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  // Label giữ nguyên số lượng sao tương ứng (⭐ x n). Không truyền thêm icon
  // cho SelectPill nữa vì icon sẽ cộng dư 1 sao vào label (vd chọn "3 sao"
  // nhưng hiển thị thành 4 sao do icon + label cộng lại).
  const ratingOptions = [
    ['', 'Tất cả sao'],
    ['5', '⭐⭐⭐⭐⭐ 5 sao'],
    ['4', '⭐⭐⭐⭐ 4 sao'],
    ['3', '⭐⭐⭐ 3 sao'],
    ['2', '⭐⭐ 2 sao'],
    ['1', '⭐ 1 sao'],
  ]

  const categoryOptions = [
    ['', 'Tất cả danh mục'],
    ...categories.map((c) => [String(c.id), c.name]),
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* ── Toolbar (đồng bộ layout với trang Đơn hàng) ── */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <SearchInput
          value={searchInput}
          onChange={(e) => handleSearchInput(e.target.value)}
          placeholder="Tìm tên khách hàng hoặc sản phẩm..."
          wrapperClassName="flex-1 min-w-[220px]"
        />

        <SelectPill
          value={ratingFilter}
          onChange={(v) => { setPage(1); setRatingFilter(v) }}
          options={ratingOptions}
        />

        <SelectPill
          value={categoryFilter}
          onChange={(v) => { setPage(1); setCategoryFilter(v) }}
          options={categoryOptions}
          icon="🗂️"
        />

        <button
          onClick={clearFilters}
          disabled={!hasActiveFilters}
          className={`px-3.5 py-2 rounded-full text-xs font-bold transition-colors flex-shrink-0
            ${hasActiveFilters ? 'text-muted hover:text-vnpt hover:bg-vnpt-light cursor-pointer' : 'text-transparent pointer-events-none select-none'}`}
        >
          ✕ Xoá lọc
        </button>
      </div>

      {/* ── Summary ── */}
      {!loading && (
        <p className="text-xs text-muted">
          {total > 0
            ? `Tìm thấy ${total} đánh giá${search ? ` cho "${search}"` : ''}`
            : 'Không có đánh giá nào'}
        </p>
      )}

      {/* ── Table ── */}
      <Card>
        <Table
          headers={['', 'Sản phẩm', 'Khách hàng', 'Đánh giá', 'Nội dung', 'Ngày', '']}
          colWidths={['5%', '22%', '14%', '11%', '36%', '8%', '4%']}
          loading={loading}
          empty={!loading && 'Không có đánh giá nào phù hợp'}
        >
          {reviews.map((r, i) => {
            const img = resolveImageUrl(r.thumbnail_url || null)
            return (
              <TR key={r.id} striped={i % 2 !== 0}>
                {/* Product thumbnail */}
                <TD noTruncate>
                  <div className="w-9 h-9 rounded-lg bg-cream border border-shade flex items-center justify-center overflow-hidden flex-shrink-0">
                    {img ? (
                      <img
                        src={img}
                        alt={r.product_name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    ) : (
                      <span className="text-base">📦</span>
                    )}
                  </div>
                </TD>

                {/* Product name */}
                <TD bold>{r.product_name || '—'}</TD>

                {/* User */}
                <TD>
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Avatar initials */}
                    <div className="w-6 h-6 rounded-full bg-vnpt-light text-vnpt text-[10px] font-bold flex items-center justify-center flex-shrink-0 uppercase">
                      {r.user_name ? r.user_name.charAt(0) : '?'}
                    </div>
                    <span className="truncate text-[13px]">{r.user_name || '—'}</span>
                  </div>
                </TD>

                {/* Stars + numeric */}
                <TD noTruncate>
                  <div className="flex flex-col gap-1">
                    <Stars rating={r.rating} />
                    <span className="text-[11px] text-muted font-semibold">{r.rating}/5</span>
                  </div>
                </TD>

                {/* Comment */}
                <TD>
                  {r.comment
                    ? <span className="text-[13px] leading-relaxed line-clamp-2">{r.comment}</span>
                    : <span className="text-muted italic text-[13px]">Không có nội dung</span>
                  }
                </TD>

                {/* Date */}
                <TD muted>
                  <span className="text-[12px] whitespace-nowrap">
                    {formatDate(r.created_at)}
                  </span>
                </TD>

                {/* Delete action */}
                <TD noTruncate>
                  <button
                    onClick={() => setDeleteTarget(r)}
                    className="text-accent font-bold cursor-pointer text-xs hover:underline"
                  >
                    Xoá
                  </button>
                </TD>
              </TR>
            )
          })}
        </Table>
      </Card>

      <AdminPagination page={page} totalPages={totalPages} onChange={setPage} />

      {/* ── Confirm delete modal ── */}
      <ConfirmDeleteModal
        review={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}