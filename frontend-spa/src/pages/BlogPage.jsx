import { useState, useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useBlogs } from '../hooks/index.js'
import { Breadcrumb, LoadingSpinner, EmptyState, Pagination } from '../components/common/index.jsx'
import { formatDate, truncate, resolveImageUrl } from '../utils/index.js'
import { blogsApi } from '../api/index.js'

const LIMIT = 9

// ── Blog List ─────────────────────────────────────────────────────────────────
function BlogList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page')) || 1

  const { data: blogs, total, loading } = useBlogs({
    limit:  LIMIT,
    offset: (page - 1) * LIMIT,
  })

  const totalPages = Math.ceil(total / LIMIT)

  const goToPage = (p) => {
    if (p === 1) setSearchParams({})
    else setSearchParams({ page: p })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div>
      {/* Hero */}
      <div
        className="text-center py-14 px-10"
        style={{ background: 'linear-gradient(135deg, #00205f, #003087)' }}
      >
        <h1 className="font-display text-4xl font-bold text-white mb-3">📰 Tin tức & Công nghệ</h1>
        <p className="text-white/75 text-sm">
          Cập nhật tin tức mới nhất về điện thoại và dịch vụ viễn thông
        </p>
      </div>

      <div className="max-w-[1200px] mx-auto px-10 py-10">
        {/* Toolbar */}
        {!loading && total > 0 && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted">
              Hiển thị <strong className="text-body">{blogs.length}</strong> / <strong className="text-body">{total}</strong> bài viết
            </p>
            {totalPages > 1 && (
              <p className="text-sm text-muted">Trang {page} / {totalPages}</p>
            )}
          </div>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : blogs.length === 0 ? (
          <EmptyState icon="📰" title="Chưa có bài viết nào" desc="Hãy quay lại sau!" />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-6">
              {blogs.map(blog => (
                <Link
                  key={blog.id}
                  to={`/blog/${blog.slug}`}
                  className="bg-white border border-shade rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-250 group"
                >
                  {/* Thumbnail */}
                  {resolveImageUrl(blog.thumbnail_url) ? (
                    <div className="aspect-video overflow-hidden bg-surface">
                      <img
                        src={resolveImageUrl(blog.thumbnail_url)}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={e => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.parentElement.classList.add('flex', 'items-center', 'justify-center')
                          e.currentTarget.parentElement.innerHTML = '<span class="text-5xl">📰</span>'
                        }}
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-vnpt-light to-vnpt/20 flex items-center justify-center">
                      <span className="text-5xl">📰</span>
                    </div>
                  )}
                  <div className="p-5">
                    <h2 className="text-base font-bold text-body mb-2 line-clamp-2 group-hover:text-vnpt transition-colors">
                      {blog.title}
                    </h2>
                    <p className="text-sm text-muted leading-relaxed mb-4 line-clamp-3">
                      {truncate(blog.content, 120)}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span>{formatDate(blog.created_at)}</span>
                      <span className="text-vnpt font-semibold">Đọc thêm →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <Pagination page={page} totalPages={totalPages} goTo={goToPage} />
          </>
        )}
      </div>
    </div>
  )
}

// ── Blog Detail ───────────────────────────────────────────────────────────────
function BlogDetail() {
  const { slug } = useParams()
  const [blog, setBlog]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    blogsApi.getBySlug(slug)
      .then(res => { setBlog(res.data || null); setLoading(false) })
      .catch(() => { setError('Không tìm thấy bài viết'); setLoading(false) })
  }, [slug])

  if (loading) return <LoadingSpinner />
  if (error || !blog) return (
    <EmptyState
      icon="📰"
      title="Không tìm thấy bài viết"
      action={<Link to="/blog" className="px-6 py-2.5 bg-vnpt text-white rounded-full text-sm font-bold">Quay lại Blog</Link>}
    />
  )

  return (
    <div>
      <Breadcrumb items={[
        { to: '/', label: 'Trang chủ' },
        { to: '/blog', label: 'Tin tức' },
        { label: truncate(blog.title, 40) },
      ]} />
      <div className="max-w-[800px] mx-auto px-10 py-10">
        <h1 className="font-display text-3xl font-bold text-body mb-3 leading-tight">{blog.title}</h1>
        <div className="text-sm text-muted mb-6">
          {formatDate(blog.created_at)}
        </div>
        {resolveImageUrl(blog.thumbnail_url) && (
          <div className="rounded-xl overflow-hidden mb-8 border border-shade">
            <img
              src={resolveImageUrl(blog.thumbnail_url)}
              alt={blog.title}
              className="w-full object-cover max-h-[420px]"
            />
          </div>
        )}
        <div className="border-b border-shade mb-8" />
        <div className="prose max-w-none text-sm text-body leading-relaxed whitespace-pre-line">
          {blog.content}
        </div>
        <div className="mt-10 pt-6 border-t border-shade">
          <Link to="/blog" className="text-sm text-vnpt font-semibold hover:underline">
            ← Quay lại danh sách bài viết
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Export ────────────────────────────────────────────────────────────────────
export { BlogList, BlogDetail }
export default BlogList