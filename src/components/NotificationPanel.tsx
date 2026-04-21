import { useState, useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useNotices, useMarkRead, useMarkAllRead } from "@/lib/queries/useNotices"
import type { NoticeItem } from "@/lib/notice"
import { X as CloseIcon } from "lucide-react"

const NOTICE_TYPE_LABELS: Record<string, string> = {
  ANNOUNCEMENT: '공지',
  GPS_OUT_OF_RANGE: 'GPS',
  UNCHECKOUT_FIRST: '미퇴근',
  UNCHECKOUT_SECOND: '미퇴근',
  ATTENDANCE_CANCELLED: '출근취소',
  WORK_AMOUNT_CHANGED: '공수변경',
  DAILY_WAGE_CHANGED: '단가변경',
  CORRECTION_RESOLVED: '정정요청',
  CONTRACT_SIGNING_REQUEST: '계약',
  DOCUMENT_EXPIRY_D14: '서류만료',
  DOCUMENT_EXPIRY_D7: '서류만료',
  DOCUMENT_SUBMISSION_REQUEST: '서류제출',
  SALARY_STATEMENT: '임금명세',
}

interface NotificationPanelProps {
  open: boolean
  onClose: () => void
}

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    if (open) {
      setVisible(true)
      setClosing(false)
      setEntered(false)
      // Trigger enter animation on next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true))
      })
    }
  }, [open])

  const handleClose = useCallback(() => {
    setClosing(true)
    setEntered(false)
    setTimeout(() => {
      setVisible(false)
      setClosing(false)
      onClose()
    }, 300)
  }, [onClose])

  const navigate = useNavigate()
  const { data, isLoading } = useNotices()
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()

  const notices = data?.list ?? []
  const unreadCount = notices.filter((n) => !n.readDate).length
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const filtered = filter === 'unread' ? notices.filter((n) => !n.readDate) : notices

  const handleClick = useCallback(
    (notice: NoticeItem) => {
      if (!notice.readDate) {
        markRead.mutate(notice.id)
      }
      if (notice.path) {
        handleClose()
        navigate(notice.path)
      }
    },
    [markRead, navigate, handleClose]
  )

  const handleMarkAll = useCallback(() => {
    markAllRead.mutate()
  }, [markAllRead])

  if (!visible) return null

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return "방금 전"
    if (diffMin < 60) return `${diffMin}분 전`
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour}시간 전`
    const diffDay = Math.floor(diffHour / 24)
    if (diffDay < 7) return `${diffDay}일 전`
    return `${d.getMonth() + 1}월 ${d.getDate()}일`
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${entered && !closing ? 'bg-black/30' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Full-screen panel — slides in from right */}
      <div
        className={`fixed inset-0 z-50 flex flex-col bg-white transition-transform duration-300 ease-out ${
          entered && !closing ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">알림</h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-red-500 px-1.5 py-px text-[10px] font-semibold text-white leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                disabled={markAllRead.isPending}
                className="text-xs text-slate-500 font-medium px-2 py-1 rounded-md active:bg-gray-100"
              >
                모두 읽음
              </button>
            )}
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-full active:bg-gray-100"
            >
              <CloseIcon size={20} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-4 px-5 py-2.5 border-b border-gray-100 shrink-0">
          <button
            onClick={() => setFilter('all')}
            className={`text-sm font-medium transition-colors ${
              filter === 'all' ? 'text-slate-900' : 'text-gray-400'
            }`}
          >
            모두 <span className="text-gray-400">{notices.length}</span>
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`text-sm font-medium transition-colors ${
              filter === 'unread' ? 'text-slate-900' : 'text-gray-400'
            }`}
          >
            안읽음 <span className="text-gray-400">{unreadCount}</span>
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-sm text-gray-400">
              로딩 중...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="text-4xl">🔕</span>
              <span className="text-sm text-gray-400">{filter === 'unread' ? '안읽은 알림이 없습니다' : '알림이 없습니다'}</span>
            </div>
          ) : (
            filtered.map((notice) => {
              const isUnread = !notice.readDate
              const category = NOTICE_TYPE_LABELS[notice.type] ?? '알림'
              return (
                <button
                  key={notice.id}
                  onClick={() => handleClick(notice)}
                  className={`w-full text-left px-5 py-4 border-b border-gray-50 active:bg-gray-50 ${
                    isUnread ? 'bg-white' : 'bg-gray-50/40'
                  }`}
                >
                  {/* Top: category + time */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                      {category}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {formatTime(notice.createTime)}
                    </span>
                  </div>
                  {/* Title */}
                  <p className={`text-[13px] leading-5 ${isUnread ? 'font-medium text-slate-900' : 'text-slate-500'}`}>
                    {notice.title}
                  </p>
                  {/* Content */}
                  {notice.content && (
                    <p className="text-[13px] leading-5 text-slate-400 mt-1 line-clamp-2">
                      {notice.content}
                    </p>
                  )}
                  {/* Unread dot */}
                  {isUnread && (
                    <div className="flex justify-end mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    </div>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
