import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { AppBottomNav, NavItem } from "@/components/layout/AppBottomNav"
import { MonthSelector, ViewMode } from "@/components/ui/MonthSelector"
import { SiteCombobox } from "@/components/ui/SiteCombobox"
import { fetchMonthlyAttendance, type WeeklyAttendanceRecord } from "@/lib/attendance"

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

const SITE_COLORS = ["#007DCA", "#F59E0B", "#10B981", "#EF4444"]
const DAY_NAMES = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"]

interface SiteLegendItem {
  id: string
  name: string
  color: string
}

interface DayGroup {
  date: string
  dayOfMonth: number
  dayName: string
  totalExpectedWage: number
  records: WeeklyAttendanceRecord[]
}

function recordsToSiteLegend(records: WeeklyAttendanceRecord[]): SiteLegendItem[] {
  const seen = new Map<string, SiteLegendItem>()
  records
    .filter((r) => r.hasCheckedIn && r.siteId)
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

function formatTimestamp(timestamp: number | undefined): string {
  if (!timestamp) return "--:--"
  const date = new Date(timestamp)
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${hours}:${minutes}`
}

function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || amount === null) return "0원"
  return amount.toLocaleString("ko-KR") + "원"
}

function groupRecordsByDate(records: WeeklyAttendanceRecord[]): DayGroup[] {
  // Filter records with valid siteId
  const validRecords = records.filter((r) => r.siteId)

  // Group by effectiveDate
  const groupMap = new Map<string, WeeklyAttendanceRecord[]>()
  validRecords.forEach((record) => {
    const date = record.effectiveDate
    if (!groupMap.has(date)) {
      groupMap.set(date, [])
    }
    groupMap.get(date)!.push(record)
  })

  // Convert to array and sort by date descending
  const groups: DayGroup[] = []
  groupMap.forEach((dayRecords, date) => {
    const dateObj = new Date(date)
    const dayOfMonth = dateObj.getDate()
    const dayName = DAY_NAMES[dateObj.getDay()]
    const totalExpectedWage = dayRecords.reduce((sum, r) => sum + (r.expectedWage || 0), 0)

    groups.push({
      date,
      dayOfMonth,
      dayName,
      totalExpectedWage,
      records: dayRecords,
    })
  })

  // Sort by date descending
  groups.sort((a, b) => b.date.localeCompare(a.date))

  return groups
}

export function ListPage() {
  const navigate = useNavigate()
  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState(currentMonth)
  const viewMode: ViewMode = "list"
  const [selectedSite, setSelectedSite] = useState("")
  const [sites, setSites] = useState<SiteLegendItem[]>([])
  const [records, setRecords] = useState<WeeklyAttendanceRecord[]>([])
  const [attendanceDays, setAttendanceDays] = useState(0)
  const [totalWorkEffort, setTotalWorkEffort] = useState(0)

  useEffect(() => {
    fetchMonthlyAttendance(year, month).then((res) => {
      if (res.success && res.data) {
        setSites(recordsToSiteLegend(res.data.records))
        setRecords(res.data.records)
        setAttendanceDays(res.data.attendanceDays || 0)
        setTotalWorkEffort(res.data.totalWorkEffort || 0)
      }
    })
  }, [year, month])

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
    const effortMap = new Map<string, { name: string; effort: number; color: string }>()
    records.forEach((r) => {
      if (r.siteId) {
        const existing = effortMap.get(r.siteId)
        if (existing) {
          existing.effort += r.workEffort || 0
        } else {
          const siteIndex = sites.findIndex((s) => s.id === r.siteId)
          effortMap.set(r.siteId, {
            name: r.siteName || "",
            effort: r.workEffort || 0,
            color: SITE_COLORS[siteIndex >= 0 ? siteIndex % SITE_COLORS.length : 0],
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

  // Get border color for a card based on its siteId (matching the legend color)
  const getBorderColor = (siteId: string): string => {
    const siteIndex = sites.findIndex((s) => s.id === siteId)
    return siteIndex >= 0 ? sites[siteIndex].color : SITE_COLORS[0]
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
                    <div key={site.name} className="flex justify-between items-start">
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
                key={record.id}
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

        {/* Empty state */}
        {dayGroups.length === 0 && (
          <div className="px-4 py-8 text-center text-slate-500">
            출역 기록이 없습니다.
          </div>
        )}
      </div>

      <AppBottomNav active="attendance" className="shrink-0" onNavigate={handleNavigation} />
    </div>
  )
}
