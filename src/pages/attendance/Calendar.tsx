import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { AppBottomNav, NavItem } from "@/components/layout/AppBottomNav"
import { MonthSelector, ViewMode } from "@/components/ui/MonthSelector"
import { SiteCombobox } from "@/components/ui/SiteCombobox"
import { Calendar } from "@/components/ui/calendar"
import { ko } from "react-day-picker/locale"
import { useMonthlyAttendance } from "@/lib/queries/useMonthlyAttendance"
import { recordsToCalendarEvents, recordsToSiteLegend } from "@/utils/attendance"

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

export function CalendarPage() {
  const navigate = useNavigate()
  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState(currentMonth)
  const viewMode: ViewMode = "calendar"
  const [selectedSite, setSelectedSite] = useState("")
  const { data } = useMonthlyAttendance(year, month)
  const events = useMemo(() => data ? recordsToCalendarEvents(data.records) : [], [data])
  const sites = useMemo(() => data ? recordsToSiteLegend(data.records) : [], [data])
  const attendanceDays = data?.attendanceDays || 0
  const totalWorkEffort = data?.totalWorkEffort || 0

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
          options={sites.map((s) => ({ value: s.id, label: s.name }))}
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

            {/* 총 출역일 */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <span className="text-sm text-slate-600">총 출역일</span>
              <span className="text-sm font-semibold text-slate-900">{attendanceDays}일</span>
            </div>

            {/* 총 공수 */}
            <div className="py-4 border-b border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">총 공수</span>
                <span className="text-sm font-semibold text-slate-900">{totalWorkEffort}공수</span>
              </div>
              {sites.length > 0 && (
                <div className="mt-3 space-y-2">
                  {sites.map((site) => (
                    <div key={site.id} className="flex justify-between items-start">
                      <div className="flex items-start gap-2">
                        <span
                          className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                          style={{ backgroundColor: site.color }}
                        />
                        <span className="text-sm text-slate-600">{site.name}</span>
                      </div>
                      <span className="text-sm text-slate-600 shrink-0 ml-2">공수</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 예상 노임 */}
            <div className="flex justify-between items-center pt-4">
              <span className="text-sm text-slate-600">예상 노임</span>
              <span className="text-sm font-semibold text-slate-900">원</span>
            </div>
          </div>
        </div>
      </div>

      <AppBottomNav active="attendance" className="shrink-0" onNavigate={handleNavigation} />
    </div>
  )
}
