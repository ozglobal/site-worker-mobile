import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { AppBottomNav, NavItem } from "@/components/layout/AppBottomNav"
import { MonthSelector, ViewMode } from "@/components/ui/MonthSelector"
import { SiteCombobox } from "@/components/ui/SiteCombobox"
import { fetchMonthlyAttendance, type WeeklyAttendanceRecord } from "@/lib/attendance"

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

const SITE_COLORS = ["#007DCA", "#F59E0B", "#10B981", "#EF4444"]

interface SiteLegendItem {
  id: string
  name: string
  color: string
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

export function ListPage() {
  const navigate = useNavigate()
  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState(currentMonth)
  const viewMode: ViewMode = "list"
  const [selectedSite, setSelectedSite] = useState("")
  const [sites, setSites] = useState<SiteLegendItem[]>([])

  useEffect(() => {
    console.log('[ATTENDANCE_LIST] useEffect fired, year:', year, 'month:', month)
    fetchMonthlyAttendance(year, month).then((res) => {
      if (res.success && res.data) {
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

  const handleViewModeChange = (mode: ViewMode) => {
    if (mode === "calendar") {
      navigate("/attendance")
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

      <div className="flex-1 overflow-y-auto mt-3">
        {/* Monthly Summary Card */}
        <div className="px-4 pb-4">
          <div className="bg-slate-100 rounded-xl p-5">
            <h3 className="text-lg font-bold text-slate-900 mb-4">이번 달 요약</h3>

            {/* 총 출역일 */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <span className="text-sm text-slate-600">총 출역일</span>
              <span className="text-sm font-semibold text-slate-900">18일</span>
            </div>

            {/* 총 공수 */}
            <div className="py-4 border-b border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">총 공수</span>
                <span className="text-sm font-semibold text-slate-900">18공수</span>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#007DCA] mt-1.5 shrink-0" />
                    <span className="text-sm text-slate-600">무안성면개발사업</span>
                  </div>
                  <span className="text-sm text-slate-600 shrink-0 ml-2">15공수</span>
                </div>
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#F59E0B] mt-1.5 shrink-0" />
                    <span className="text-sm text-slate-600">용인성파라곤건축</span>
                  </div>
                  <span className="text-sm text-slate-600 shrink-0 ml-2">3공수</span>
                </div>
              </div>
            </div>

            {/* 예상 노임 */}
            <div className="flex justify-between items-center pt-4">
              <span className="text-sm text-slate-600">예상 노임</span>
              <span className="text-sm font-semibold text-slate-900">2,746,000원</span>
            </div>
          </div>
        </div>

        {/* Site Selector */}
        <div className="px-4 pt-2 pb-6">
          <SiteCombobox
            options={sites.map((s) => ({ value: s.id, label: s.name }))}
            value={selectedSite}
            onChange={setSelectedSite}
          />
        </div>

        {/* Previous Day Attendance Card */}
        <div className="px-4 pb-8">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-base font-semibold text-slate-900">29일 목요일</h4>
            <span className="text-base font-semibold text-slate-900">130,000원</span>
          </div>

          {/* First attendance entry */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-3">
            <span className="inline-block px-2.5 py-1 text-xs font-medium text-slate-500 border border-slate-300 rounded mb-3">
              퇴근 완료
            </span>
            <div className="border-l-4 border-[#007DCA] pl-3">
              <div className="flex justify-between items-start">
                <p className="text-base font-semibold text-slate-900">무안성면개발사업</p>
                <span className="text-base font-semibold text-slate-900 shrink-0 ml-2">50,000원</span>
              </div>
              <p className="text-sm text-[#007DCA] mt-1">100,000원 / 1공수</p>
              <p className="text-sm text-[#007DCA] mt-1">08:00 - 12:31 · 0.5공수</p>
            </div>
          </div>

          {/* Second attendance entry */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <span className="inline-block px-2.5 py-1 text-xs font-medium text-slate-500 border border-slate-300 rounded mb-3">
              퇴근 완료
            </span>
            <div className="border-l-4 border-[#F59E0B] pl-3">
              <div className="flex justify-between items-start">
                <p className="text-base font-semibold text-slate-900">용인성파라곤건축</p>
                <span className="text-base font-semibold text-slate-900 shrink-0 ml-2">80,000원</span>
              </div>
              <p className="text-sm text-[#007DCA] mt-1">160,000원 / 1공수</p>
              <p className="text-sm text-[#007DCA] mt-1">08:00 - 12:31 · 0.5공수</p>
            </div>
          </div>
        </div>

        {/* 27일 화요일 */}
        <div className="px-4 pb-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-base font-semibold text-slate-900">27일 화요일</h4>
            <span className="text-base font-semibold text-slate-900">100,000원</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <span className="inline-block px-2.5 py-1 text-xs font-medium text-slate-500 border border-slate-300 rounded mb-3">
              퇴근 완료
            </span>
            <div className="border-l-4 border-[#007DCA] pl-3">
              <div className="flex justify-between items-start">
                <p className="text-base font-semibold text-slate-900">무안성면개발사업</p>
                <span className="text-base font-semibold text-slate-900 shrink-0 ml-2">100,000원</span>
              </div>
              <p className="text-sm text-[#007DCA] mt-1">100,000원 / 1공수</p>
              <p className="text-sm text-[#007DCA] mt-1">08:00 - 12:31 · 0.5공수</p>
            </div>
          </div>
        </div>
      </div>

      <AppBottomNav active="attendance" className="shrink-0" onNavigate={handleNavigation} />
    </div>
  )
}
