import { useEffect, useState } from 'react'
import { contactApi } from '../../api/index.js'
import { Card, Btn } from './ui.jsx'
import { toast, formatDate } from '../../utils/index.js'

export default function AdminContacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  const load = () => {
    setLoading(true)
    contactApi.getAll()
      .then(res => setContacts(res.data || []))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleDelete = (c) => {
    if (!confirm(`Xoá tin nhắn từ "${c.name}"?`)) return
    contactApi.remove(c.id)
      .then(() => {
        toast.success('Đã xoá tin nhắn')
        setContacts(prev => prev.filter(x => x.id !== c.id))
        if (selected?.id === c.id) setSelected(null)
      })
      .catch(err => toast.error(err.message || 'Không thể xoá'))
  }

  if (loading) return <div className="py-16 text-center text-muted text-sm">Đang tải...</div>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 h-[calc(100vh-160px)] min-h-[480px]">
      <Card className="flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-shade text-[13px] font-bold text-body">Tất cả tin nhắn ({contacts.length})</div>
        <div className="flex-1 overflow-y-auto">
          {contacts.length === 0 && <div className="p-6 text-center text-muted text-sm">Chưa có tin nhắn nào</div>}
          {contacts.map(c => (
            <div
              key={c.id}
              onClick={() => setSelected(c)}
              className={`px-4 py-3.5 border-b border-shade cursor-pointer transition-colors ${selected?.id === c.id ? 'bg-vnpt-light' : 'hover:bg-cream'}`}
            >
              <div className="font-bold text-[13px] text-body truncate mb-0.5">{c.name}</div>
              <div className="text-xs text-muted truncate mb-1">{c.email}</div>
              <div className="text-[11px] text-muted">{formatDate(c.created_at)}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-muted flex-col gap-2.5">
            <span className="text-4xl">💬</span>
            <span className="text-sm">Chọn một tin nhắn để xem nội dung</span>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-shade flex justify-between items-start gap-3">
              <div>
                <div className="font-extrabold text-base text-body mb-1">{selected.name}</div>
                <div className="text-[13px] text-muted">{selected.email} · {formatDate(selected.created_at)}</div>
              </div>
              <Btn variant="danger" size="sm" onClick={() => handleDelete(selected)}>Xoá</Btn>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-cream rounded-xl p-4 text-sm text-body leading-relaxed whitespace-pre-wrap">{selected.message}</div>
            </div>
            <div className="px-6 py-3.5 border-t border-shade">
              <a href={`mailto:${selected.email}`} className="text-xs font-bold text-vnpt hover:underline">✉️ Trả lời qua email: {selected.email}</a>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
