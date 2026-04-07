import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { AppBottomNav, NavItem } from "@/components/layout/AppBottomNav"
import { MonthSelector, ViewMode } from "@/components/ui/month-selector"
import { SiteCombobox } from "@/components/ui/site-combobox"
import { useMonthlyAttendance } from "@/lib/queries/useMonthlyAttendance"
import { QueryErrorState } from "@/components/ui/query-error-state"
import { recordsToSiteLegend, groupRecordsByDate, getSiteColor } from "@/utils/attendance"
import { formatTimestamp, formatCurrency } from "@/utils/format"
import { AttendanceRecordCard } from "@/components/ui/attendance-record-card"
import { CorrectionDialog } from "@/components/ui/correction-dialog"
import { submitCorrectionRequest } from "@/lib/attendance"
import { reportError } from "@/lib/errorReporter"
import { useToast } from "@/contexts/ToastContext"

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

export function ListPage() {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState(currentMonth)
  const viewMode: ViewMode = "list"
  const [selectedSite, setSelectedSite] = useState("")

  // Correction dialog state
  const [showCorrectionDialog, setShowCorrectionDialog] = useState(false)
  const [correctionSiteName, setCorrectionSiteName] = useState("")
  const [correctionTimeRange, setCorrectionTimeRange] = useState("")
  const [correctionWorkEffort, setCorrectionWorkEffort] = useState("")
  const [correctionDailyWage, setCorrectionDailyWage] = useState("")
  const [correctionAttendanceId, setCorrectionAttendanceId] = useState<string | null>(null)

  const openCorrectionDialog = (record: { id: string; siteName: string; checkInTime: number; checkOutTime?: number; workEffort?: number; dailyWageSnapshot?: number }) => {
    setCorrectionSiteName(record.siteName)
    setCorrectionTimeRange(`${formatTimestamp(record.checkInTime)} - ${formatTimestamp(record.checkOutTime)}`)
    setCorrectionWorkEffort(record.workEffort != null ? String(record.workEffort) : "1.0")
    setCorrectionDailyWage(record.dailyWageSnapshot != null ? record.dailyWageSnapshot.toLocaleString("ko-KR") : "0")
    setCorrectionAttendanceId(record.id)
    setShowCorrectionDialog(true)
  }

  const handleCorrectionSubmit = async (data: { workEffort: string; dailyWage: string; reason: string }) => {
    if (!correctionAttendanceId) return
    const result = await submitCorrectionRequest({
      attendanceId: correctionAttendanceId,
      requestType: data.workEffort,
      requestedValue: data.dailyWage,
      reason: data.reason,
    })
    if (result.success) {
      showSuccess("정정 요청이 제출되었습니다.")
      setShowCorrectionDialog(false)
      setCorrectionAttendanceId(null)
    } else {
      reportError("CORRECTION_SUBMIT_FAIL", result.error)
      showError(result.error)
    }
  }
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
            options={sites.map((s) => ({ value: s.id, label: s.name, color: s.color }))}
            value={selectedSite}
            onChange={setSelectedSite}
          />
        </div>


        {/* Daily Attendance Cards */}
        {dayGroups.map((group) => {
          const isGroupToday = group.date === `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`
          return (
            <div key={group.date} className="px-4 pb-6">
              {/* Date Header */}
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-slate-700">
                  {group.dayOfMonth}일 {group.dayName}{isGroupToday ? " (오늘)" : ""}
                </h4>
              </div>

              {/* Records */}
              <div className="space-y-3">
                {group.records.map((record, index) => (
                  <AttendanceRecordCard
                    key={record.id || `${group.date}-${index}`}
                    siteName={record.siteName}
                    timeRange={`${formatTimestamp(record.checkInTime)} - ${formatTimestamp(record.checkOutTime)}`}
                    recordType={record.recordType || "일반"}
                    workEffort={record.workEffort}
                    dailyWageSnapshot={record.dailyWageSnapshot}
                    expectedWage={record.expectedWage}
                    statusBadge={record.hasCheckedOut ? "퇴근 완료" : "근무중"}
                    statusVariant={record.hasCheckedOut ? "default" : "active"}
                    showCorrection={isGroupToday}
                    onCorrectionClick={() => openCorrectionDialog(record)}
                    className="shadow-sm border border-slate-100 p-5"
                  />
                ))}
              </div>
            </div>
          )
        })}

        {/* Error state */}
        {isError && (
          <QueryErrorState onRetry={() => refetch()} message="출역 기록을 가져오지 못했습니다." />
        )}

        {/* Empty state */}
        {!isError && dayGroups.length === 0 && (
          <div className="px-4 py-8 text-center text-slate-500">
            출역 기록이 없습니다.
          </div>
        )}
      </div>

      <AppBottomNav active="attendance" className="shrink-0" onNavigate={handleNavigation} />

      {showCorrectionDialog && (
        <CorrectionDialog
          siteName={correctionSiteName}
          timeRange={correctionTimeRange}
          initialWorkEffort={correctionWorkEffort}
          initialDailyWage={correctionDailyWage}
          onClose={() => { setShowCorrectionDialog(false); setCorrectionAttendanceId(null) }}
          onSubmit={handleCorrectionSubmit}
        />
      )}
    </div>
  )
}
