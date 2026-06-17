import { useState, useEffect, useCallback, useRef } from 'react'
import { productsApi, categoriesApi, blogsApi } from '@/api'
import { debounce } from '@/utils'

// ── useProducts ───────────────────────────────────────────────────────────────
export const useProducts = (params = {}) => {
  const [data, setData]       = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    productsApi.getAll(params)
      .then(res => {
        if (!cancelled) {
          setData(res.data || res)
          setTotal(res.total || res.length || 0)
          setLoading(false)
        }
      })
      .catch(err => { if (!cancelled) { setError(err.message); setLoading(false) } })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)])

  return { data, total, loading, error }
}

// ── useProduct (single) ───────────────────────────────────────────────────────
export const useProduct = (slug) => {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    productsApi.getBySlug(slug)
      .then(res => { setData(res.data || res); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [slug])

  return { data, loading, error }
}

// ── useCategories ─────────────────────────────────────────────────────────────
export const useCategories = () => {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    categoriesApi.getAll()
      .then(res => { setData(res.data || res); setLoading(false) })
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
      .then(res => { setData(res.data || res); setLoading(false) })
      .catch(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)])

  return { data, loading }
}

// ── useSearch (debounced) ────────────────────────────────────────────────────
export const useSearch = (delay = 400) => {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const search = useCallback(
    debounce(async (q) => {
      if (!q.trim()) { setResults([]); return }
      setLoading(true)
      try {
        const res = await productsApi.getAll({ q, limit: 8 })
        setResults(res.data || res)
      } catch (_) { setResults([]) }
      finally { setLoading(false) }
    }, delay),
    [delay]
  )

  const handleChange = (q) => { setQuery(q); search(q) }

  return { query, setQuery: handleChange, results, loading }
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

  const goTo    = (p) => setPage(Math.min(Math.max(1, p), totalPages))
  const next    = () => goTo(page + 1)
  const prev    = () => goTo(page - 1)

  return { page, totalPages, goTo, next, prev, limit, offset: (page - 1) * limit }
}

// ── useLocalFavorites (khi chưa đăng nhập) ───────────────────────────────────
export const useLocalFavorites = () => {
  const [favs, setFavs] = useState(
    () => JSON.parse(localStorage.getItem('vnpt_favs') || '[]')
  )

  const toggle = (productId) => {
    setFavs(prev => {
      const next = prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
      localStorage.setItem('vnpt_favs', JSON.stringify(next))
      return next
    })
  }

  const isFav = (productId) => favs.includes(productId)

  return { favs, toggle, isFav }
}
