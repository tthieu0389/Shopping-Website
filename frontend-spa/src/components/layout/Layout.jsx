import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const handler = (e) => {
      const id = Date.now()
      setToasts(prev => [...prev, { id, ...e.detail }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
    }
    window.addEventListener('vnpt:toast', handler)
    return () => window.removeEventListener('vnpt:toast', handler)
  }, [])

  const colorMap = {
    success: 'bg-success',
    error:   'bg-accent',
    info:    'bg-vnpt',
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`${colorMap[t.type] || 'bg-vnpt'} text-white px-5 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2`}
        >
          {t.type === 'success' && '✅'}
          {t.type === 'error'   && '❌'}
          {t.type === 'info'    && 'ℹ️'}
          {t.msg}
        </div>
      ))}
    </div>
  )
}

// ── ScrollTop ─────────────────────────────────────────────────────────────────
function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

// ── Layout ────────────────────────────────────────────────────────────────────
export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <ScrollTop />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <Toast />
    </div>
  )
}
