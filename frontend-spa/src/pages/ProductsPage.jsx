import { useSearchParams } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useProducts, useCategories } from '../hooks/index.js'
import { ProductCard, Breadcrumb, LoadingSpinner, EmptyState, Pagination } from '../components/common/index.jsx'
import { formatPrice } from '../utils/index.js'

const PRODUCT_TYPES = [
  { value: '', label: 'Tất cả' },
  { value: 'sim', label: 'Sim số' },
  { value: 'device', label: 'Thiết bị' },
  { value: 'internet', label: 'Internet' },
  { value: 'tv', label: 'Truyền hình' },
  { value: 'accessory', label: 'Phụ kiện' },
]

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Mới nhất' },
  { value: 'price_asc',  label: 'Giá thấp đến cao' },
  { value: 'price_desc', label: 'Giá cao đến thấp' },
  { value: 'name_asc',   label: 'Tên A-Z' },
]

const PRICE_RANGES = [
  { label: 'Tất cả',             min: '',        max: '' },
  { label: 'Dưới 1 triệu',       min: '',        max: '1000000' },
  { label: '1 - 5 triệu',        min: '1000000', max: '5000000' },
  { label: '5 - 10 triệu',       min: '5000000', max: '10000000' },
  { label: '10 - 20 triệu',      min: '10000000',max: '20000000' },
  { label: 'Trên 20 triệu',      min: '20000000',max: '' },
]

const LIMIT = 12

function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = SORT_OPTIONS.find(o => o.value === value) || SORT_OPTIONS[0]

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 border border-shade rounded-lg text-sm font-body hover:border-vnpt focus:border-vnpt transition-colors outline-none bg-white"
      >
        <span>{selected.label}</span>
        <svg className={`w-4 h-4 text-muted transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-white border border-shade rounded-xl shadow-lg z-50 overflow-hidden min-w-[160px]">
          {SORT_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                o.value === value
                  ? 'bg-vnpt text-white font-semibold'
                  : 'hover:bg-cream text-body'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: categories } = useCategories()

  // Derived state: filters & page được TÍNH TRỰC TIẾP từ searchParams mỗi lần
  // render, không lưu state riêng -> không cần effect để "đồng bộ" nữa, tránh
  // hẳn lỗi eslint(react-hooks/set-state-in-effect) và cascading renders.
  // searchParams (từ useSearchParams) đã là state, nên đây vẫn re-render đúng
  // khi URL đổi (back/forward, sửa filter, v.v).
  const slugFromUrl = searchParams.get('category')
  let categoryId = searchParams.get('category_id') || ''
  if (slugFromUrl && categories.length > 0) {
    const matched = categories.find(c => c.slug === slugFromUrl)
    if (matched) categoryId = String(matched.id)
  }

  const filters = {
    // Dùng category_id (số) thay vì category slug
    // vì backend products service chỉ filter theo category_id
    search:       searchParams.get('search') || searchParams.get('q') || '',
    category_id:  categoryId,
    product_type: searchParams.get('product_type') || '',
    price_min:    searchParams.get('price_min') || '',
    price_max:    searchParams.get('price_max') || '',
    sort:         searchParams.get('sort') || 'newest',
  }
  const page = Number(searchParams.get('page')) || 1

  // Lấy đúng trang hiện tại từ backend (đã tự sort hết hàng xuống cuối +
  // sort theo `sort` param, xem products.service.js -> orderByRaw is_available).
  // Trước đây FE xin limit: 999 rồi tự slice ở client, nhưng backend luôn giới
  // hạn tối đa 100 item/request (middlewares/pagination.js) nên nếu có > 100
  // sản phẩm khớp filter, phần dư sẽ bị cắt mất và totalPages/total hiển thị
  // sai (tính trên mảng đã bị cắt thay vì tổng thật). Gọi limit/offset đúng
  // trang giúp phân trang chính xác dù danh sách sản phẩm lớn tới đâu.
  const apiParams = {
    limit:  LIMIT,
    offset: (page - 1) * LIMIT,
    ...(filters.search       && { search: filters.search }),
    ...(filters.category_id  && { category_id: filters.category_id }),
    ...(filters.product_type && { product_type: filters.product_type }),
    ...(filters.price_min    && { price_min: filters.price_min }),
    ...(filters.price_max    && { price_max: filters.price_max }),
    ...(filters.sort         && { sort: filters.sort }),
  }

  const { data: products, total, loading, error } = useProducts(apiParams)

  const totalPages = Math.ceil(total / LIMIT)

  // ── Local search state (tránh lỗi IME/telex gõ ra "aá") ──────────────────
  // Dùng local value để hiển thị trong input, chỉ commit vào URL khi IME xong.
  const [localSearch, setLocalSearch] = useState(filters.search)
  const isComposing = useRef(false)
  const debounceRef = useRef(null)

  // Đồng bộ localSearch khi URL search thay đổi từ bên ngoài (xoá tag, clear filters...)
  useEffect(() => {
    setLocalSearch(filters.search)
  }, [filters.search])

  const commitSearch = (value) => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateFilters({ search: value })
    }, 300)
  }

  const handleSearchChange = (e) => {
    const val = e.target.value
    setLocalSearch(val)
    // Nếu đang compose (IME chưa xong) thì chưa commit
    if (!isComposing.current) commitSearch(val)
  }

  const handleCompositionStart = () => { isComposing.current = true }

  const handleCompositionEnd = (e) => {
    isComposing.current = false
    // Commit giá trị đúng sau khi IME hoàn tất
    commitSearch(e.target.value)
  }
  // ─────────────────────────────────────────────────────────────────────────

  const updateFilter = (key, value) => {
    updateFilters({ [key]: value })
  }

  // Cập nhật nhiều field cùng lúc, viết thẳng xuống URL (nguồn state duy nhất),
  // luôn reset về trang 1 khi đổi filter.
  const updateFilters = (patch) => {
    const next = { ...filters, ...patch }
    const params = {}
    Object.entries(next).forEach(([k, v]) => { if (v) params[k] = v })
    setSearchParams(params)
  }

  const goToPage = (p) => {
    const params = {}
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v })
    if (p > 1) params.page = p
    setSearchParams(params)
  }

  const clearFilters = () => setSearchParams({})

  const hasActiveFilters = filters.search || filters.category_id || filters.product_type || filters.price_min || filters.price_max
  const selectedCategory = categories.find(c => String(c.id) === String(filters.category_id))

  return (
    <div>
      <Breadcrumb items={[{ to: '/', label: 'Trang chủ' }, { label: 'Sản phẩm' }]} />

      <div className="max-w-[1200px] mx-auto px-10 py-8 grid grid-cols-[260px_minmax(0,1fr)] gap-7 items-start min-h-[calc(100vh-180px)]">

        {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
        <aside className="sticky top-24 self-start space-y-4">

          {/* Tìm kiếm */}
          <div className="bg-white border border-shade rounded-xl p-5">
            <div className="text-sm font-bold text-body mb-4 pb-3 border-b border-shade">Tìm kiếm</div>
            <div className="relative">
              <input
                type="text"
                placeholder="Tên sản phẩm..."
                value={localSearch}
                onChange={handleSearchChange}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                className="w-full px-4 py-2.5 border border-shade rounded-lg text-sm font-body outline-none focus:border-vnpt transition-colors pr-8"
              />
              {localSearch && (
                <button
                  onClick={() => { setLocalSearch(''); updateFilter('search', '') }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-body"
                >✕</button>
              )}
            </div>
          </div>

          {/* Danh mục */}
          <div className="bg-white border border-shade rounded-xl p-5">
            <div className="text-sm font-bold text-body mb-4 pb-3 border-b border-shade">Danh mục</div>
            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
              <label className="flex items-center gap-2.5 py-1.5 cursor-pointer">
                <input type="radio" name="category" checked={!filters.category_id} onChange={() => updateFilter('category_id', '')} className="accent-vnpt w-4 h-4" />
                <span className="text-sm text-body flex-1">Tất cả danh mục</span>
              </label>
              {categories.map(c => (
                <label key={c.id} className="flex items-center gap-2.5 py-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    checked={String(filters.category_id) === String(c.id)}
                    onChange={() => updateFilter('category_id', String(c.id))}
                    className="accent-vnpt w-4 h-4"
                  />
                  <span className="text-sm text-body flex-1">{c.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Loại sản phẩm */}
          <div className="bg-white border border-shade rounded-xl p-5">
            <div className="text-sm font-bold text-body mb-4 pb-3 border-b border-shade">Loại sản phẩm</div>
            <div className="space-y-1">
              {PRODUCT_TYPES.map(t => (
                <label key={t.value} className="flex items-center gap-2.5 py-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="product_type"
                    checked={filters.product_type === t.value}
                    onChange={() => updateFilter('product_type', t.value)}
                    className="accent-vnpt w-4 h-4"
                  />
                  <span className="text-sm text-body">{t.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Khoảng giá */}
          <div className="bg-white border border-shade rounded-xl p-5">
            <div className="text-sm font-bold text-body mb-4 pb-3 border-b border-shade">Khoảng giá</div>
            <div className="space-y-1">
              {PRICE_RANGES.map(r => (
                <label key={r.label} className="flex items-center gap-2.5 py-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="price_range"
                    checked={filters.price_min === r.min && filters.price_max === r.max}
                    onChange={() => updateFilters({ price_min: r.min, price_max: r.max })}
                    className="accent-vnpt w-4 h-4"
                  />
                  <span className="text-sm text-body">{r.label}</span>
                </label>
              ))}
            </div>
            {/* Tùy chỉnh */}
            <div className="mt-3 pt-3 border-t border-shade">
              <div className="text-xs text-muted mb-2">Tùy chỉnh (₫)</div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Từ"
                  value={filters.price_min}
                  onChange={e => updateFilter('price_min', e.target.value)}
                  className="px-3 py-2 border border-shade rounded-lg text-sm font-body outline-none focus:border-vnpt"
                />
                <input
                  type="number"
                  placeholder="Đến"
                  value={filters.price_max}
                  onChange={e => updateFilter('price_max', e.target.value)}
                  className="px-3 py-2 border border-shade rounded-lg text-sm font-body outline-none focus:border-vnpt"
                />
              </div>
            </div>
          </div>

          {/* Xoá bộ lọc */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-full py-2.5 border-2 border-accent text-accent rounded-lg text-sm font-semibold hover:bg-accent hover:text-white transition-colors"
            >
              ✕ Xoá bộ lọc
            </button>
          )}
        </aside>

        {/* ── PRODUCT GRID ─────────────────────────────────────────────────── */}
        <div className="flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-muted">
              {loading ? 'Đang tải...' : (
                <>Hiển thị <strong className="text-body">{products.length}</strong> / <strong className="text-body">{total}</strong> sản phẩm</>
              )}
            </p>
            <SortDropdown
              value={filters.sort}
              onChange={v => updateFilter('sort', v)}
            />
          </div>

          {/* Active filter tags — luôn render để tránh layout shift */}
          <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]">
            {filters.search && (
              <span className="inline-flex items-center gap-1 bg-vnpt-light text-vnpt text-xs font-semibold px-3 py-1.5 rounded-full">
                Tìm: {filters.search}
                <button onClick={() => updateFilter('search', '')} className="ml-1 hover:text-vnpt-dark">✕</button>
              </span>
            )}
            {filters.category_id && selectedCategory && (
              <span className="inline-flex items-center gap-1 bg-vnpt-light text-vnpt text-xs font-semibold px-3 py-1.5 rounded-full">
                {selectedCategory.name}
                <button onClick={() => updateFilter('category_id', '')} className="ml-1 hover:text-vnpt-dark">✕</button>
              </span>
            )}
            {filters.product_type && (
              <span className="inline-flex items-center gap-1 bg-vnpt-light text-vnpt text-xs font-semibold px-3 py-1.5 rounded-full">
                {PRODUCT_TYPES.find(t => t.value === filters.product_type)?.label}
                <button onClick={() => updateFilter('product_type', '')} className="ml-1 hover:text-vnpt-dark">✕</button>
              </span>
            )}
            {(filters.price_min || filters.price_max) && (
              <span className="inline-flex items-center gap-1 bg-vnpt-light text-vnpt text-xs font-semibold px-3 py-1.5 rounded-full">
                {filters.price_min ? formatPrice(filters.price_min) : '0'} - {filters.price_max ? formatPrice(filters.price_max) : '∞'}
                <button onClick={() => updateFilters({ price_min: '', price_max: '' })} className="ml-1 hover:text-vnpt-dark">✕</button>
              </span>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <EmptyState icon="⚠️" title="Có lỗi xảy ra" desc={error} />
          ) : products.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="Không tìm thấy sản phẩm"
              desc="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
              action={
                <button onClick={clearFilters} className="px-6 py-2.5 bg-vnpt text-white rounded-full text-sm font-bold">
                  Xoá bộ lọc
                </button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 items-start">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
              <Pagination page={page} totalPages={totalPages} goTo={goToPage} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}