import { useEffect, useState } from 'react'
import { contactApi } from '../../api/index.js'
import { Card, Btn, FilterTabs, SearchInput } from './ui.jsx'
import { toast, formatDate } from '../../utils/index.js'

export default function AdminContacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [replyBody, setReplyBody] = useState('')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const load = () => {
    setLoading(true)
    contactApi.getAll()
      .then(res => setContacts(res.data || []))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleSelect = (c) => {
    setSelected(c)
    const quotedMessage = (c.message || '')
      .split('\n')
      .map(line => `> ${line}`)
      .join('\n')
    setReplyBody(
`Kính gửi ${c.name},

Cảm ơn bạn đã liên hệ với VNPT Shop. Chúng tôi đã nhận được yêu cầu của bạn và xin phản hồi như sau:

[Nhập nội dung phản hồi tại đây]

Nếu bạn có thêm câu hỏi, vui lòng liên hệ lại với chúng tôi.

Trân trọng,
Đội ngũ hỗ trợ VNPT Shop
────────────────────────────
Tin nhắn gốc từ ${c.name} (${formatDate(c.created_at)}):
${quotedMessage}`
    )
  }

  const getMailtoLink = () => {
    if (!selected) return '#'
    const to      = encodeURIComponent(selected.email)
    const subject = encodeURIComponent(`[VNPT Shop] Phản hồi liên hệ của ${selected.name}`)
    const body    = encodeURIComponent(replyBody)
    return `https://mail.google.com/mail/?view=cm&to=${to}&su=${subject}&body=${body}`
  }

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

  const filtered = (filter === 'all'
    ? contacts
    : filter === 'newsletter'
      ? contacts.filter(c => c.name === 'Newsletter')
      : contacts.filter(c => c.name !== 'Newsletter')
  ).filter(c =>
    !search.trim() ||
    c.name.toLowerCase().includes(search.trim().toLowerCase()) ||
    c.email.toLowerCase().includes(search.trim().toLowerCase())
  )

  if (loading) return <div className="py-16 text-center text-muted text-sm">Đang tải...</div>

  return (
    <div className="flex flex-col gap-4">
      {/* Search + filter tabs */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <SearchInput
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm theo tên hoặc email..."
        />
        <FilterTabs
          options={[
            ['all', 'Tất cả', contacts.length],
            ['contact', 'Liên hệ', contacts.filter(c => c.name !== 'Newsletter').length],
            ['newsletter', 'Đăng ký email', contacts.filter(c => c.name === 'Newsletter').length],
          ]}
          value={filter}
          onChange={(v) => { setFilter(v); setSelected(null) }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4" style={{ minHeight: 480 }}>
        {/* Danh sách tin nhắn */}
        <Card className="flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 240px)' }}>
          <div className="px-4 py-3 border-b border-shade text-[13px] font-bold text-body">
            Tin nhắn ({filtered.length})
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="p-6 text-center text-muted text-sm">Chưa có tin nhắn nào</div>
            )}
            {filtered.map(c => (
              <div
                key={c.id}
                onClick={() => handleSelect(c)}
                className={`px-4 py-3.5 border-b border-shade cursor-pointer transition-colors ${
                  selected?.id === c.id ? 'bg-vnpt-light border-l-2 border-l-vnpt' : 'hover:bg-cream'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <div className="font-bold text-[13px] text-body truncate flex-1">{c.name}</div>
                  {c.name === 'Newsletter' && (
                    <span className="text-[10px] bg-blue-100 text-blue-600 font-bold px-1.5 py-0.5 rounded-full ml-1 flex-shrink-0">EMAIL</span>
                  )}
                </div>
                <div className="text-xs text-muted truncate mb-1">{c.email}</div>
                <div className="text-[11px] text-muted">{formatDate(c.created_at)}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Panel xem & trả lời */}
        <Card className="flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 240px)' }}>
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-muted flex-col gap-2.5">
              <span className="text-4xl">💬</span>
              <span className="text-sm font-semibold">Chọn một tin nhắn để xem và trả lời</span>
              <span className="text-xs">Bạn có thể trả lời trực tiếp qua email</span>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b border-shade flex justify-between items-start gap-3">
                <div>
                  <div className="font-extrabold text-base text-body mb-0.5">{selected.name}</div>
                  <div className="text-[13px] text-muted">{selected.email} · {formatDate(selected.created_at)}</div>
                </div>
                <Btn variant="danger" size="sm" onClick={() => handleDelete(selected)}>Xoá</Btn>
              </div>

              {/* Nội dung gốc */}
              <div className="px-6 py-4 border-b border-shade flex-shrink-0">
                <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Nội dung tin nhắn</div>
                <div className="bg-cream rounded-xl p-4 text-sm text-body leading-relaxed whitespace-pre-wrap">
                  {selected.message || <span className="italic text-muted">(Không có nội dung)</span>}
                </div>
              </div>

              {/* Soạn phản hồi */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Soạn phản hồi</div>
                <textarea
                  value={replyBody}
                  onChange={e => setReplyBody(e.target.value)}
                  rows={7}
                  className="w-full px-4 py-3 rounded-xl border border-shade text-sm text-body outline-none focus:border-vnpt transition-colors bg-canvas font-body resize-vertical"
                  placeholder="Nhập nội dung phản hồi..."
                />
                <div className="text-xs text-muted mt-1">
                  Nhấn "Gửi phản hồi" sẽ mở ứng dụng email với nội dung soạn sẵn gửi đến <strong>{selected.email}</strong>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3.5 border-t border-shade flex items-center justify-between">
                <a href={`mailto:${selected.email}`} className="text-xs font-bold text-muted hover:text-vnpt transition-colors">
                  ✉️ {selected.email}
                </a>
                <a
                  href={getMailtoLink()}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => replyBody.trim() && toast.success('Đã mở Gmail để gửi phản hồi')}
                  className={`px-6 py-2.5 bg-vnpt text-white rounded-full text-sm font-bold hover:bg-vnpt-dark transition-colors inline-flex items-center gap-2 ${!replyBody.trim() ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  📤 Gửi phản hồi qua Gmail
                </a>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}