import { useState, useEffect, useCallback, useRef } from 'react'
import { productsApi, categoriesApi, blogsApi, reviewsApi, favoritesApi, ordersApi, userApi, productImagesApi } from '../api/index.js'

// ── useProducts ───────────────────────────────────────────────────────────────
export const useProducts = (params = {}) => {
  const [data, setData]       = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    productsApi.getAll(params)
      .then(async (res) => {
        const list = res.data || []
        if (cancelled) return

        // Hiển thị sản phẩm trước (chưa có ảnh) để người dùng thấy nội dung ngay
        setData(list)
        setTotal(res.total || 0)
        setLoading(false)

        // Bổ sung ảnh đại diện cho từng sản phẩm (vì API danh sách không trả ảnh)
        if (list.length > 0) {
          const withImages = await Promise.all(
            list.map(async (p) => {
              try {
                const imgRes = await productImagesApi.getByProduct(p.id)
                const images = imgRes.data || []
                const thumb = images.find(img => img.is_thumbnail) || images[0]
                return thumb ? { ...p, thumbnail: thumb.image_url } : p
              } catch (_) {
                return p
              }
            })
          )
          if (!cancelled) setData(withImages)
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message || 'Lỗi tải sản phẩm')
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)])

  return { data, total, loading, error }
}

// ── useProduct (single by slug/id) ───────────────────────────────────────────
export const useProduct = (slug) => {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setError(null)
    productsApi.getBySlug(slug)
      .then(res => { setData(res.data || res); setLoading(false) })
      .catch(err => { setError(err.message || 'Không tìm thấy sản phẩm'); setLoading(false) })
  }, [slug])

  return { data, loading, error }
}

// ── useRelatedProducts ────────────────────────────────────────────────────────
export const useRelatedProducts = (id) => {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    productsApi.getRelated(id)
      .then(res => { setData(res.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  return { data, loading }
}

// ── useCategories ─────────────────────────────────────────────────────────────
export const useCategories = () => {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // categoriesApi.getAll() đã normalize về { data: [] }
    categoriesApi.getAll()
      .then(res => { setData(res.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return { data, loading }
}

// ── useBlogs ──────────────────────────────────────────────────────────────────
export const useBlogs = (params = {}) => {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    blogsApi.getAll(params)
      .then(res => { setData(res.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)])

  return { data, loading }
}

// ── useReviews ────────────────────────────────────────────────────────────────
export const useReviews = (productId) => {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(false)

  const reload = useCallback(() => {
    if (!productId) return
    setLoading(true)
    reviewsApi.getByProduct(productId)
      .then(res => { setData(res.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [productId])

  useEffect(() => { reload() }, [reload])

  return { data, loading, reload }
}

// ── useFavorites ──────────────────────────────────────────────────────────────
export const useFavorites = () => {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(false)

  const reload = useCallback(() => {
    setLoading(true)
    favoritesApi.getAll()
      .then(res => { setData(res.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { reload() }, [reload])

  const isFav = useCallback((productId) =>
    data.some(f => f.product_id === productId || f.id === productId), [data])

  const toggle = useCallback(async (productId) => {
    if (isFav(productId)) {
      await favoritesApi.remove(productId)
    } else {
      await favoritesApi.add(productId)
    }
    reload()
  }, [isFav, reload])

  return { data, loading, isFav, toggle, reload }
}

// ── useOrders ─────────────────────────────────────────────────────────────────
export const useOrders = (params = {}) => {
  const [data, setData]       = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(() => {
    setLoading(true)
    ordersApi.getAll(params)
      .then(res => {
        setData(res.data || [])
        setTotal(res.total || 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)])

  useEffect(() => { reload() }, [reload])

  return { data, total, loading, reload }
}

// ── useUserProfile ────────────────────────────────────────────────────────────
export const useUserProfile = () => {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(() => {
    setLoading(true)
    userApi.getProfile()
      .then(res => { setData(res.data || null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { reload() }, [reload])

  return { data, loading, reload }
}

// ── useUserAddresses ──────────────────────────────────────────────────────────
export const useUserAddresses = () => {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(() => {
    setLoading(true)
    userApi.getAddresses()
      .then(res => { setData(res.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { reload() }, [reload])

  return { data, loading, reload }
}

// ── useSearch (debounced) ────────────────────────────────────────────────────
export const useSearch = (delay = 400) => {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    let cancelled = false

    const timer = setTimeout(async () => {
      try {
        const res = await productsApi.getAll({ search: query, limit: 8 })
        if (!cancelled) setResults(res.data || [])
      } catch (_) {
        if (!cancelled) setResults([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, delay)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, delay])

  return { query, setQuery, results, loading }
}

// ── useCountdown ──────────────────────────────────────────────────────────────
export const useCountdown = (targetSeconds = 6443) => {
  const [time, setTime] = useState(targetSeconds)
  const ref = useRef(null)

  useEffect(() => {
    ref.current = setInterval(() => {
      setTime(t => (t <= 0 ? 0 : t - 1))
    }, 1000)
    return () => clearInterval(ref.current)
  }, [])

  const h = String(Math.floor(time / 3600)).padStart(2, '0')
  const m = String(Math.floor((time % 3600) / 60)).padStart(2, '0')
  const s = String(time % 60).padStart(2, '0')

  return { h, m, s, time }
}

// ── usePagination ─────────────────────────────────────────────────────────────
export const usePagination = (total, limit = 12) => {
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(total / limit)

  const goTo = (p) => setPage(Math.min(Math.max(1, p), totalPages || 1))
  const next  = () => goTo(page + 1)
  const prev  = () => goTo(page - 1)

  return { page, totalPages, goTo, next, prev, limit, offset: (page - 1) * limit }
}