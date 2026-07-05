import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'

// ── Toast ─────────────────────────────────────────────────────────────────────
export function Toast() {
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
    // Mobile: bottom-center với margin để không đè nav; Desktop: bottom-right
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`${colorMap[t.type] || 'bg-vnpt'} text-white px-4 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 pointer-events-auto w-full sm:w-auto sm:max-w-sm`}
        >
          <button
            onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
            className="text-white/80 hover:text-white leading-none text-base cursor-pointer flex-shrink-0"
            aria-label="Đóng thông báo"
          >
            ✕
          </button>
          {t.type === 'success' && '✅'}
          {t.type === 'info'    && 'ℹ️'}
          <span className="flex-1">{t.msg}</span>
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