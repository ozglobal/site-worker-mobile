import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { AppBottomNav, NavItem } from "@/components/layout/AppBottomNav"
import { MonthSelector, ViewMode } from "@/components/ui/month-selector"
import { SiteCombobox } from "@/components/ui/site-combobox"
import { Calendar } from "@/components/ui/calendar"
import { ko } from "react-day-picker/locale"
import { useMonthlyAttendance } from "@/lib/queries/useMonthlyAttendance"
import { useTodayAttendance } from "@/lib/queries/useTodayAttendance"
import { daysToCalendarEvents, daysToSiteLegend, getSiteColor } from "@/utils/attendance"
import { formatCurrency } from "@/utils/format"

export function CalendarPage() {
  const navigate = useNavigate()
  // Evaluate lazily so the page always opens on the real current month,
  // regardless of when this module was first loaded.
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth() + 1)
  const viewMode: ViewMode = "calendar"
  const [selectedSite, setSelectedSite] = useState("")
  const { data } = useMonthlyAttendance(year, month)
  // Calendar date dots and site legend both come from `days` so their colors
  // stay in lock-step.
  const events = useMemo(() => daysToCalendarEvents(data?.days || []), [data])
  const sites = useMemo(() => daysToSiteLegend(data?.days || []), [data])

  // Site dropdown is populated from today's attendance (daily API).
  const { data: today } = useTodayAttendance()
  const siteOptions = useMemo(() => {
    const seen = new Map<string, { value: string; label: string; color: string }>()
    ;(today?.attendances || []).forEach((a) => {
      if (!a.siteId || seen.has(a.siteId)) return
      seen.set(a.siteId, {
        value: a.siteId,
        label: a.siteName || "",
        color: getSiteColor(a.siteId, sites),
      })
    })
    return Array.from(seen.values())
  }, [today, sites])
  const attendanceDays = data?.totalWorkDays || 0
  const totalWorkEffort = data?.totalEffort || 0

  // Per-site breakdown for the summary card — sourced directly from the
  // API's siteBreakdown payload (no longer recomputed from records).
  const siteWorkEfforts = useMemo(
    () =>
      (data?.siteBreakdown || []).map((s) => ({
        siteId: s.siteId,
        name: s.siteName,
        effort: s.effort,
        color: getSiteColor(s.siteId, sites),
      })),
    [data, sites]
  )

  const totalExpectedWage = data?.totalExpectedWage || 0

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

  const handleViewModeChange = (mode: ViewMode) => {
    if (mode === "list") {
      navigate("/attendance/list")
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
        onViewModeChange={handleViewModeChange}
        className="shrink-0"
      />

      <div className="px-4 shrink-0">
        <SiteCombobox
          options={siteOptions}
          value={selectedSite}
          onChange={setSelectedSite}
        />
      </div>

      <div className="flex-1 overflow-y-auto mt-3">
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
          onSelect={(date) => {
            if (date) {
              const y = date.getFullYear()
              const m = String(date.getMonth() + 1).padStart(2, "0")
              const d = String(date.getDate()).padStart(2, "0")
              navigate(`/attendance/detail/${y}-${m}-${d}`)
            }
          }}
        />

        {/* Monthly Summary Card */}
        <div className="px-4 pt-6 pb-4">
          <div className="bg-slate-100 rounded-xl p-5">
            <h3 className="text-lg font-bold text-slate-900 mb-4">이번 달 요약</h3>

            {/* 총 출역일 */}
            <div className="flex justify-between items-center pb-4">
              <span className="text-sm text-slate-600">총 출역일</span>
              <span className="text-sm font-semibold text-slate-900">{attendanceDays}일</span>
            </div>

            {/* 총 공수 */}
            <div className="py-4 border-b border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">총 공수</span>
                <span className="text-sm font-semibold text-slate-900">{totalWorkEffort}공수</span>
              </div>
              {siteWorkEfforts.length > 0 && (
                <div className="mt-3 space-y-2">
                  {siteWorkEfforts.map((site) => (
                    <div key={site.siteId} className="flex justify-between items-start">
                      <div className="flex items-start gap-2">
                        <span
                          className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                          style={{ backgroundColor: site.color }}
                        />
                        <span className="text-sm text-slate-600">{site.name}</span>
                      </div>
                      <span className="text-sm text-slate-600 shrink-0 ml-2">{site.effort}공수</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 예상 노임 */}
            <div className="flex justify-between items-center pt-4">
              <span className="text-sm text-slate-600">예상 노임</span>
              <span className="text-sm font-semibold text-slate-900">{formatCurrency(totalExpectedWage)}</span>
            </div>
          </div>
        </div>
      </div>

      <AppBottomNav active="attendance" className="shrink-0" onNavigate={handleNavigation} />
    </div>
  )
}
