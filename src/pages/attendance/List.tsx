import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { AppBottomNav, NavItem } from "@/components/layout/AppBottomNav"
import { MonthSelector, ViewMode } from "@/components/ui/MonthSelector"
import { SiteCombobox } from "@/components/ui/SiteCombobox"
import { useMonthlyAttendance } from "@/lib/queries/useMonthlyAttendance"
import { QueryErrorState } from "@/components/ui/query-error-state"
import { recordsToSiteLegend, groupRecordsByDate, getSiteColor } from "@/utils/attendance"
import { formatTimestamp, formatCurrency } from "@/utils/format"

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

export function ListPage() {
  const navigate = useNavigate()
  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState(currentMonth)
  const viewMode: ViewMode = "list"
  const [selectedSite, setSelectedSite] = useState("")
  const { data, isError, refetch } = useMonthlyAttendance(year, month)
  const records = data?.records || []
  const sites = useMemo(() => recordsToSiteLegend(records), [records])
  const attendanceDays = data?.attendanceDays || 0
  const totalWorkEffort = data?.totalWorkEffort || 0

  // Filter records by selected site
  const filteredRecords = useMemo(() => {
    if (!selectedSite) return records
    return records.filter((r) => r.siteId === selectedSite)
  }, [records, selectedSite])

  // Group records by date
  const dayGroups = useMemo(() => groupRecordsByDate(filteredRecords), [filteredRecords])

  // Calculate total expected wage
  const totalExpectedWage = useMemo(() => {
    return records.reduce((sum, r) => sum + (r.expectedWage || 0), 0)
  }, [records])

  // Calculate work effort by site
  const siteWorkEfforts = useMemo(() => {
    const effortMap = new Map<string, { siteId: string; name: string; effort: number; color: string }>()
    records.forEach((r) => {
      if (r.siteId) {
        const existing = effortMap.get(r.siteId)
        if (existing) {
          existing.effort += r.workEffort || 0
        } else {
          effortMap.set(r.siteId, {
            siteId: r.siteId,
            name: r.siteName || "",
            effort: r.workEffort || 0,
            color: getSiteColor(r.siteId, sites),
          })
        }
      }
    })
    return Array.from(effortMap.values())
  }, [records, sites])

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

  const getBorderColor = (siteId: string) => getSiteColor(siteId, sites)

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

        {/* Site Selector */}
        <div className="px-4 pt-2 pb-6">
          <SiteCombobox
            options={sites.map((s) => ({ value: s.id, label: s.name }))}
            value={selectedSite}
            onChange={setSelectedSite}
          />
        </div>

        {/* Daily Attendance Cards */}
        {dayGroups.map((group) => (
          <div key={group.date} className="px-4 pb-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-base font-semibold text-slate-900">
                {group.dayOfMonth}일 {group.dayName}
              </h4>
              <span className="text-base font-semibold text-slate-900">
                {formatCurrency(group.totalExpectedWage)}
              </span>
            </div>

            {group.records.map((record, index) => (
              <div
                key={record.id || `${group.date}-${index}`}
                className={`bg-white rounded-xl border border-slate-200 p-4 ${
                  index < group.records.length - 1 ? "mb-3" : ""
                }`}
              >
                <span className={`inline-block px-2.5 py-1 text-xs font-medium border rounded mb-3 ${
                  record.complete ? "text-slate-500 border-slate-300" : "text-[#007DCA] border-[#007DCA]"
                }`}>
                  {record.complete ? "퇴근 완료" : "근무 중"}
                </span>
                <div
                  className="border-l-4 pl-3"
                  style={{ borderColor: getBorderColor(record.siteId) }}
                >
                  <div className="flex justify-between items-start">
                    <p className="text-base font-semibold text-slate-900">{record.siteName}</p>
                    <span className="text-base font-semibold text-slate-900 shrink-0 ml-2">
                      {formatCurrency(record.expectedWage)}
                    </span>
                  </div>
                  <p className="text-sm text-[#007DCA] mt-1">
                    {formatCurrency(record.dailyWageSnapshot)} / 1공수
                  </p>
                  <p className="text-sm text-[#007DCA] mt-1">
                    {formatTimestamp(record.checkInTime)} - {formatTimestamp(record.checkOutTime)} · {record.workEffort || 0}공수
                  </p>
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Error state */}
        {isError && (
          <QueryErrorState onRetry={() => refetch()} message="출역 기록을 불러오지 못했습니다." />
        )}

        {/* Empty state */}
        {!isError && dayGroups.length === 0 && (
          <div className="px-4 py-8 text-center text-slate-500">
            출역 기록이 없습니다.
          </div>
        )}
      </div>

      <AppBottomNav active="attendance" className="shrink-0" onNavigate={handleNavigation} />
    </div>
  )
}
