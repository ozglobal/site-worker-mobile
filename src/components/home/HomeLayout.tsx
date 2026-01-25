import { WeeklyCalendar } from "@/components/calendar/WeeklyCalendar"

interface WorkSite {
  id: string
  name: string
  address: string
}

interface CalendarEvent {
  date: Date
  color: "blue" | "orange" | string
}

type AttendanceStatus = 'checked-out' | 'checked-in'

interface HomeLayoutProps {
  userName: string
  currentDate: Date
  workSite: WorkSite
  events?: CalendarEvent[]
  sites: { id: string; name: string; color: string }[]
  attendanceStatus: AttendanceStatus
  checkInTime?: string
  onClockIn: () => void
  onClockOut?: () => void
  onSelectDate?: (date: Date) => void
}

export function HomeLayout({
  userName,
  currentDate,
  workSite,
  events = [],
  sites,
  attendanceStatus,
  checkInTime,
  onClockIn,
  onClockOut,
  onSelectDate,
}: HomeLayoutProps) {
  const formatDate = (date: Date) => {
    const month = date.getMonth() + 1
    const day = date.getDate()
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"]
    const dayOfWeek = dayNames[date.getDay()]
    return `${month}월 ${day}일 (${dayOfWeek})`
  }

  // Convert serverTimestamp (UTC) to KST formatted string
  // Handles both ISO string (2026-01-15T09:53:11.259798085) and Unix ms
  const formatCheckInTime = (timestamp: string): string => {
    let date: Date

    // Check if it's an ISO string format (contains 'T')
    if (timestamp.includes('T')) {
      // Parse ISO string as UTC
      date = new Date(timestamp + 'Z')
    } else {
      // Handle Unix milliseconds
      const ms = Number(timestamp)
      if (!Number.isFinite(ms)) {
        return timestamp
      }
      date = new Date(ms)
    }

    // Convert to Seoul timezone (UTC+9)
    const seoulDate = new Date(date.getTime() + 9 * 60 * 60 * 1000)

    const year = seoulDate.getUTCFullYear()
    const month = String(seoulDate.getUTCMonth() + 1).padStart(2, '0')
    const day = String(seoulDate.getUTCDate()).padStart(2, '0')
    const hours = String(seoulDate.getUTCHours()).padStart(2, '0')
    const minutes = String(seoulDate.getUTCMinutes()).padStart(2, '0')

    return `${year}-${month}-${day} ${hours}:${minutes}`
  }

  return (
    <div className="flex flex-col flex-1 bg-slate-100 overflow-hidden">
      {/* Header - Greeting */}
      <div className="bg-transparent px-4 py-4 shrink-0">
        <h1 className="text-xl font-bold text-slate-900">
          안녕하세요, {userName}님!
        </h1>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {/* Today's Work Card */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">
              오늘의 근무{" "}
              <span className="text-base font-normal text-slate-500">
                {formatDate(currentDate)}
              </span>
            </h2>
          </div>

          <div className="p-4">
            {/* Work Site Info - only show when siteName is available */}
            {workSite.name && (
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <div className="mb-2">
                  <span className="text-sm text-slate-500">근무 현장</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  {workSite.name}
                </h3>
                {workSite.address && (
                  <div className="flex items-center gap-1 text-sm text-slate-500">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{workSite.address}</span>
                  </div>
                )}
              </div>
            )}

            {/* Clock In/Out Button */}
            {attendanceStatus === 'checked-out' ? (
              <button
                onClick={onClockIn}
                className="w-full py-4 bg-primary hover:bg-primary-active text-white font-semibold rounded-lg transition-colors"
              >
                출근하기
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-green-600">
                      <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M6.5 10L9 12.5L13.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-sm font-medium text-green-700">출근 완료</span>
                  </div>
                  {checkInTime && (
                    <span className="text-sm text-green-600">{formatCheckInTime(checkInTime)}</span>
                  )}
                </div>
                <button
                  onClick={onClockOut}
                  className="w-full py-4 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors"
                >
                  퇴근하기
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Work Status Card */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">주간 근무 현황</h2>
          </div>

          <div className="p-4">
            {/* Week Calendar */}
            <div className="mb-4">
              <WeeklyCalendar
                events={events}
                onSelect={onSelectDate}
              />
            </div>

            {/* Site Legend */}
            <div className="space-y-1">
              {sites.map((site) => (
                <div key={site.id} className="flex items-center gap-3">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: site.color }}
                  />
                  <span className="text-xs text-slate-700">{site.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
