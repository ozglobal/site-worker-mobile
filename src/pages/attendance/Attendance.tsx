import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { AppBottomNav, NavItem } from "@/components/layout/AppBottomNav"
import { MonthSelector, ViewMode } from "@/components/ui/MonthSelector"
import { SiteCombobox } from "@/components/ui/SiteCombobox"
import { Calendar, type CalendarEvent } from "@/components/ui/calendar"
import { ko } from "react-day-picker/locale"
import { fetchMonthlyAttendance, type WeeklyAttendanceRecord } from "@/lib/attendance"

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

const SITE_COLORS = ["#007DCA", "#F59E0B", "#10B981", "#EF4444"]

interface SiteLegendItem {
  id: string
  name: string
  color: string
}

function recordsToEvents(records: WeeklyAttendanceRecord[]): CalendarEvent[] {
  const siteIndexMap = new Map<string, number>()
  const checkedIn = records.filter((r) => r.hasCheckedIn)
  checkedIn.forEach((r) => {
    if (!siteIndexMap.has(r.siteId)) siteIndexMap.set(r.siteId, siteIndexMap.size)
  })
  return checkedIn.map((r) => ({
    date: new Date(r.effectiveDate),
    color: SITE_COLORS[(siteIndexMap.get(r.siteId) ?? 0) % SITE_COLORS.length],
    label: r.workEffort != null ? String(r.workEffort) : "",
    siteId: r.siteId,
  }))
}

function recordsToSiteLegend(records: WeeklyAttendanceRecord[]): SiteLegendItem[] {
  const seen = new Map<string, SiteLegendItem>()
  records
    .filter((r) => r.hasCheckedIn)
    .forEach((r) => {
      if (r.siteId && !seen.has(r.siteId)) {
        const index = seen.size
        seen.set(r.siteId, {
          id: r.siteId,
          name: r.siteName || "",
          color: SITE_COLORS[index % SITE_COLORS.length],
        })
      }
    })
  return Array.from(seen.values())
}

export function AttendancePage() {
  const navigate = useNavigate()
  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState(currentMonth)
  const [viewMode, setViewMode] = useState<ViewMode>("calendar")
  const [selectedSite, setSelectedSite] = useState("")
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [sites, setSites] = useState<SiteLegendItem[]>([])

  useEffect(() => {
    console.log('[ATTENDANCE] useEffect fired, year:', year, 'month:', month)
    fetchMonthlyAttendance(year, month).then((res) => {
      if (res.success && res.data) {
        setEvents(recordsToEvents(res.data.records))
        setSites(recordsToSiteLegend(res.data.records))
      }
    })
  }, [year, month])

  const handlePrevMonth = () => {
    if (month === 1) {
      setYear(year - 1)
      setMonth(12)
    } else {
      setMonth(month - 1)
    }
  }

  const handleNextMonth = () => {
    if (month === 12) {
      setYear(year + 1)
      setMonth(1)
    } else {
      setMonth(month + 1)
    }
  }

  const handleNavigation = (item: NavItem) => {
    if (item === "home") {
      navigate("/home")
    } else if (item === "contract") {
      navigate("/contract")
    } else if (item === "profile") {
      navigate("/profile")
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <AppHeader showLeftAction={false} title="시재건설" showRightAction={true} className="shrink-0" />

      <MonthSelector
        year={year}
        month={month}
        viewMode={viewMode}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onViewModeChange={setViewMode}
        className="shrink-0"
      />

      <div className="px-4 shrink-0">
        <SiteCombobox
          options={sites.map((s) => ({ value: s.id, label: s.name }))}
          value={selectedSite}
          onChange={setSelectedSite}
        />
      </div>

      <div className="flex-1 overflow-y-auto mt-3">
        {viewMode === "calendar" && (
          <>
            <Calendar
              mode="single"
              month={new Date(year, month - 1)}
              onMonthChange={(d) => {
                setYear(d.getFullYear())
                setMonth(d.getMonth() + 1)
              }}
              locale={ko}
              events={selectedSite ? events.filter((e) => e.siteId === selectedSite) : events}
              className="w-full"
            />
            {sites.length > 0 && (
              <div className="px-4 pt-1 pb-3 space-y-1">
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
            )}

            {/* Monthly Summary Card */}
            <div className="px-4 pt-3 pb-4">
              <div className="bg-slate-100 rounded-xl p-5">
                <h3 className="text-lg font-bold text-slate-900 mb-4">이번 달 요약</h3>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">총 출역일</span>
                    <span className="text-sm font-semibold text-slate-900">18일</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">총 공수</span>
                    <span className="text-sm font-semibold text-slate-900">18공수</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">예상 노임</span>
                    <span className="text-sm font-semibold text-slate-900">2,746,000원</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <AppBottomNav active="attendance" className="shrink-0" onNavigate={handleNavigation} />
    </div>
  )
}
