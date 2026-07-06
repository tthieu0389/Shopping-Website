import { useEffect, useState } from 'react'
import { contactApi } from '../../api/index.js'
import { Card, SearchInput, SelectPill } from './ui.jsx'
import { toast, formatDate } from '../../utils/index.js'

export default function StaffContacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [replyBody, setReplyBody] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
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
    const template =
`Kính gửi ${c.name},

Cảm ơn bạn đã liên hệ với VNPT Shop. Chúng tôi đã nhận được yêu cầu của bạn và xin phản hồi như sau:

[Nhập nội dung phản hồi tại đây]

Nếu bạn có thêm câu hỏi, vui lòng liên hệ lại với chúng tôi.

Trân trọng,
Đội ngũ hỗ trợ VNPT Shop
────────────────────────────
Tin nhắn gốc từ ${c.name} (${formatDate(c.created_at)}):
${quotedMessage}`
    // Template dựng sẵn có thể vượt quá giới hạn nếu tin nhắn gốc quá dài
    // (vì có quote lại) — cắt bớt để không vượt REPLY_MAX_LEN ngay từ đầu.
    setReplyBody(template.slice(0, REPLY_MAX_LEN))
  }

  const GMAIL_URL_SAFE_LIMIT = 7500 // Gmail trả về lỗi 400 Bad Request nếu URL quá dài
  const REPLY_MAX_LEN = 2000 // BE giới hạn 2200 ký tự, chừa buffer an toàn

  const getMailtoLink = () => {
    if (!selected) return '#'
    const to      = encodeURIComponent(selected.email)
    const subject = encodeURIComponent(`[VNPT Shop] Phản hồi liên hệ của ${selected.name}`)
    const base    = `https://mail.google.com/mail/?view=cm&to=${to}&su=${subject}&body=`
    const maxBodyLen = GMAIL_URL_SAFE_LIMIT - base.length

    let body = replyBody
    let encodedBody = encodeURIComponent(body)

    if (encodedBody.length > maxBodyLen) {
      // Tìm độ dài cắt lớn nhất sao cho phần đã encode vẫn nằm trong giới hạn
      let lo = 0, hi = body.length
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2)
        if (encodeURIComponent(body.slice(0, mid)).length <= maxBodyLen) lo = mid
        else hi = mid - 1
      }
      body = body.slice(0, lo) + '\n\n[... nội dung đã bị cắt bớt do quá dài ...]'
      encodedBody = encodeURIComponent(body)
    }

    return base + encodedBody
  }

  const hasActiveFilters = typeFilter !== 'all' || statusFilter !== 'all' || !!search.trim()

  const clearFilters = () => {
    setSearch('')
    setTypeFilter('all')
    setStatusFilter('all')
    setSelected(null)
  }

  // Gửi phản hồi thật sự vào hệ thống — khách hàng (nếu có tài khoản) sẽ
  // thấy phản hồi này trong tab "Phản hồi của tôi" ở trang Liên hệ, kèm
  // chấm đỏ thông báo ở Navbar.
  const handleSendReply = () => {
    if (!selected || !replyBody.trim()) return
    setSendingReply(true)
    contactApi.reply(selected.id, replyBody.trim())
      .then((res) => {
        const updated = res.data
        setContacts(prev => prev.map(x => x.id === selected.id ? { ...x, ...updated } : x))
        setSelected(prev => ({ ...prev, ...updated }))
        toast.success('Đã gửi phản hồi cho khách hàng')
      })
      .catch(err => toast.error(err.message || 'Không thể gửi phản hồi'))
      .finally(() => setSendingReply(false))
  }

  const filtered = contacts
    .filter(c => typeFilter === 'all' || (typeFilter === 'newsletter' ? c.name === 'Newsletter' : c.name !== 'Newsletter'))
    .filter(c => statusFilter === 'all' || (statusFilter === 'resolved' ? c.status === 'resolved' : c.status !== 'resolved'))
    .filter(c =>
      !search.trim() ||
      c.name.toLowerCase().includes(search.trim().toLowerCase()) ||
      c.email.toLowerCase().includes(search.trim().toLowerCase())
    )

  if (loading) return <div className="py-16 text-center text-muted text-sm">Đang tải...</div>

  return (
    <div className="flex flex-col gap-4">
      {/* Search + filter dropdowns */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <SearchInput
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm theo tên hoặc email..."
        />
        <SelectPill
          value={typeFilter}
          onChange={(v) => { setTypeFilter(v); setSelected(null) }}
          options={[
            ['all', 'Loại liên hệ'],
            ['contact', 'Liên hệ'],
            ['newsletter', 'Đăng ký email'],
          ]}
        />
        <SelectPill
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setSelected(null) }}
          options={[
            ['all', 'Trạng thái'],
            ['pending', 'Chưa giải quyết'],
            ['resolved', 'Đã giải quyết'],
          ]}
        />
        <button
          onClick={clearFilters}
          disabled={!hasActiveFilters}
          className={`px-3.5 py-2 rounded-full text-xs font-bold transition-colors flex-shrink-0
            ${hasActiveFilters ? 'text-muted hover:text-primary hover:bg-primary-light cursor-pointer' : 'text-transparent pointer-events-none select-none'}`}
        >
          ✕ Xoá lọc
        </button>
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
                  <div className="flex items-center gap-1 ml-1 flex-shrink-0">
                    {c.name === 'Newsletter' && (
                      <span className="text-[10px] bg-blue-100 text-blue-600 font-bold px-1.5 py-0.5 rounded-full">EMAIL</span>
                    )}
                    {c.status === 'resolved' && (
                      <span
                        className="text-[10px] bg-success/10 text-green-600 font-bold px-1.5 py-0.5 rounded-full"
                        title={c.replied_by_name ? `Đã xử lý bởi ${c.replied_by_name}` : 'Đã xử lý'}
                      >
                        ✓
                      </span>
                    )}
                  </div>
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
              <span className="text-xs">Phản hồi sẽ được gửi trực tiếp cho khách hàng qua hệ thống</span>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b border-shade flex justify-between items-start gap-3">
                <div>
                  <div className="font-extrabold text-base text-body mb-0.5">{selected.name}</div>
                  <div className="text-[13px] text-muted">{selected.email} · {formatDate(selected.created_at)}</div>
                </div>
              </div>

              {/* Nội dung gốc */}
              <div className="px-6 py-4 border-b border-shade flex-shrink-0">
                <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Nội dung tin nhắn</div>
                <div className="bg-cream rounded-xl p-4 text-sm text-body leading-relaxed whitespace-pre-wrap break-words h-56 resize-y overflow-y-auto">
                  {selected.message || <span className="italic text-muted">(Không có nội dung)</span>}
                </div>
              </div>

              {/* Đã phản hồi bởi ai — chỉ hiện khi liên hệ này đã được xử lý */}
              {selected.status === 'resolved' && selected.reply && (
                <div className="px-6 py-4 border-b border-shade flex-shrink-0 bg-success/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[11px] font-bold text-green-700 uppercase tracking-wider">
                      ✓ Đã phản hồi
                    </div>
                    <div className="text-xs text-muted">
                      bởi <strong className="text-body">{selected.replied_by_name || 'Không rõ'}</strong>
                      {selected.replied_at && <> · {formatDate(selected.replied_at)}</>}
                    </div>
                  </div>
                  <div className="bg-white border border-success/20 rounded-xl p-4 text-sm text-body leading-relaxed whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                    {selected.reply}
                  </div>
                </div>
              )}

              {/* Soạn phản hồi — mỗi liên hệ chỉ được phản hồi 1 lần, ẩn hẳn
                  phần soạn sau khi đã resolved để tránh gửi đè/gửi thêm */}
              {selected.status !== 'resolved' && (
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Soạn phản hồi</div>
                  <textarea
                    value={replyBody}
                    onChange={e => setReplyBody(e.target.value)}
                    rows={7}
                    maxLength={REPLY_MAX_LEN}
                    className="w-full px-4 py-3 rounded-xl border border-shade text-sm text-body outline-none focus:border-vnpt transition-colors bg-canvas font-body resize-vertical"
                    placeholder="Nhập nội dung phản hồi..."
                  />
                  <div className={`text-xs mt-1 text-right ${replyBody.length >= REPLY_MAX_LEN ? 'text-accent font-semibold' : 'text-muted'}`}>
                    {replyBody.length}/{REPLY_MAX_LEN}
                  </div>
                  <div className="text-xs text-muted mt-1">
                    Nhấn "Gửi phản hồi" để lưu phản hồi vào hệ thống — khách hàng sẽ thấy trong mục "Phản hồi của tôi" kèm thông báo.
                  </div>
                </div>
              )}
              {selected.status === 'resolved' && <div className="flex-1" />}

              {/* Footer */}
              <div className="px-6 py-3.5 border-t border-shade flex items-center justify-between gap-3">
                <a
                  href={selected.status === 'resolved' ? undefined : getMailtoLink()}
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={selected.status === 'resolved' || !replyBody.trim()}
                  title={selected.status === 'resolved' ? 'Liên hệ này đã được phản hồi' : undefined}
                  className={`text-xs font-bold text-muted hover:text-vnpt transition-colors whitespace-nowrap ${
                    selected.status === 'resolved' || !replyBody.trim() ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  ✉️ Mở Gmail thay thế
                </a>
                <button
                  onClick={handleSendReply}
                  disabled={selected.status === 'resolved' || !replyBody.trim() || sendingReply}
                  title={selected.status === 'resolved' ? 'Liên hệ này đã được phản hồi' : undefined}
                  className="px-6 py-2.5 bg-vnpt text-white rounded-full text-sm font-bold hover:bg-vnpt-dark transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {sendingReply ? '⏳ Đang gửi...' : '📤 Gửi phản hồi'}
                </button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}