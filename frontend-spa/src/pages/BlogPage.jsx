import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useBlogs } from '../hooks/index.js'
import { Breadcrumb, LoadingSpinner, EmptyState } from '../components/common/index.jsx'
import { formatDate, truncate } from '../utils/index.js'
import { blogsApi } from '../api/index.js'
import { useEffect } from 'react'

// ── Blog List ─────────────────────────────────────────────────────────────────
function BlogList() {
  const { data: blogs, loading } = useBlogs()

  return (
    <div>
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
        {loading ? (
          <LoadingSpinner />
        ) : blogs.length === 0 ? (
          <EmptyState icon="📰" title="Chưa có bài viết nào" desc="Hãy quay lại sau!" />
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {blogs.map(blog => (
              <Link
                key={blog.id}
                to={`/blog/${blog.slug}`}
                className="bg-white border border-shade rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-250 group"
              >
                {/* Thumbnail placeholder */}
                <div className="aspect-video bg-gradient-to-br from-vnpt-light to-vnpt/20 flex items-center justify-center">
                  <span className="text-5xl">📰</span>
                </div>
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
      .then(res => {
        setBlog(res.data || null)
        setLoading(false) // Update loading to false inside the effect
      })
      .catch(() => {
        setError('Không tìm thấy bài viết')
        setLoading(false) // Update loading to false inside the effect
      })
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
        <div className="text-sm text-muted mb-8 pb-8 border-b border-shade">
          {formatDate(blog.created_at)}
        </div>
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
