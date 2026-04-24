import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { useBottomNavHandler } from "@/hooks/useBottomNavHandler"
import { AppHeader } from "@/components/layout/AppHeader"
import { AppBottomNav } from "@/components/layout/AppBottomNav"
import { MonthSelector, ViewMode } from "@/components/ui/month-selector"
import { SiteCombobox } from "@/components/ui/site-combobox"
import { useMonthlyAttendance } from "@/lib/queries/useMonthlyAttendance"
import { useTodayAttendance } from "@/lib/queries/useTodayAttendance"
import { QueryErrorState } from "@/components/ui/query-error-state"
import { daysToSiteLegend, groupRecordsByDate, getSiteColor } from "@/utils/attendance"
import { formatCurrency } from "@/utils/format"
import { formatKstTime } from "@/utils/time"
import { AttendanceRecordCard, type AttendanceEntryDetail } from "@/components/ui/attendance-record-card"
import { CorrectionDialog, type CorrectionDialogSubmitData } from "@/components/ui/correction-dialog"
import { submitCorrectionRequest, type WeeklyAttendanceRecord } from "@/lib/attendance"
import { reportError } from "@/lib/errorReporter"
import { useToast } from "@/contexts/ToastContext"

export function ListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useToast()
  // Evaluate lazily so the page always opens on the real current month,
  // regardless of when this module was first loaded.
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth() + 1)
  const viewMode: ViewMode = "list"
  const [selectedSite, setSelectedSite] = useState("")

  // Correction dialog state
  const [showCorrectionDialog, setShowCorrectionDialog] = useState(false)
  const [correctionSiteName, setCorrectionSiteName] = useState("")
  const [correctionTimeRange, setCorrectionTimeRange] = useState("")
  const [correctionWorkEffort, setCorrectionWorkEffort] = useState("")
  const [correctionDailyWage, setCorrectionDailyWage] = useState("")
  const [correctionAttendanceId, setCorrectionAttendanceId] = useState<string | null>(null)

  const openCorrectionDialog = (
    record: { id: string; siteName: string; checkInTime: number; checkOutTime?: number; workEffort?: number; dailyWageSnapshot?: number },
    checkInOverride?: string | null,
    checkOutOverride?: string | null,
  ) => {
    setCorrectionSiteName(record.siteName)
    const ci = checkInOverride ?? record.checkInTime
    const co = checkOutOverride ?? record.checkOutTime
    setCorrectionTimeRange(`${formatKstTime(ci as never)} - ${formatKstTime(co as never)}`)
    setCorrectionWorkEffort(record.workEffort != null ? String(record.workEffort) : "")
    setCorrectionDailyWage(record.dailyWageSnapshot != null ? record.dailyWageSnapshot.toLocaleString("ko-KR") : "")
    setCorrectionAttendanceId(record.id)
    setShowCorrectionDialog(true)
  }

  const handleCorrectionSubmit = async (data: CorrectionDialogSubmitData) => {
    if (!correctionAttendanceId) return
    const result = await submitCorrectionRequest({
      attendanceId: correctionAttendanceId,
      workEntryId: correctionAttendanceId,
      requestType: data.requestType,
      requestedValue: data.requestedValue,
      requestedEffort: data.requestedEffort,
      requestedWage: data.requestedWage,
      reason: data.reason,
    })
    if (!result.success) {
      reportError("CORRECTION_SUBMIT_FAIL", result.error)
      showError(result.error)
      return
    }
    showSuccess("정정 요청이 제출되었습니다.")
    if (todayStr) queryClient.invalidateQueries({ queryKey: ["todayAttendance", todayStr] })
    else queryClient.invalidateQueries({ queryKey: ["todayAttendance"] })
    setShowCorrectionDialog(false)
    setCorrectionAttendanceId(null)
  }
  const { data, isError, refetch } = useMonthlyAttendance(year, month)
  // Today's daily is authoritative for whether a same-day attendance is
  // still active — monthly entries alone can't tell us that. Cross-reference
  // by siteId because monthly entries may not carry the attendanceId.
  const { data: todayDaily } = useTodayAttendance()
  const todayStr = todayDaily?.date
  const activeTodaySiteIds = useMemo(() => {
    const ids = new Set<string>()
    ;(todayDaily?.attendances || []).forEach((a) => {
      if (!a.checkOutTime && a.siteId) ids.add(a.siteId)
    })
    return ids
  }, [todayDaily])

  // Site ids that STILL accept correction requests today. Once a PENDING
  // request exists the backend drops canRequestCorrection to false; we
  // mirror that in the UI so the 정정 요청 button disables after submit.
  const correctableTodaySiteIds = useMemo(() => {
    const ids = new Set<string>()
    ;(todayDaily?.attendances || []).forEach((a) => {
      if (a.siteId && a.canRequestCorrection) ids.add(a.siteId)
    })
    return ids
  }, [todayDaily])

  // Build record rows from `days[].entries[]` — each entry becomes one row
  // on its day. The legacy `records` array is ignored when `days` is present.
  const records: WeeklyAttendanceRecord[] = useMemo(() => {
    const fromDays: WeeklyAttendanceRecord[] = []
    ;(data?.days || []).forEach((d) => {
      d.entries?.forEach((e, idx) => {
        // Today's entries: cross-reference /daily (by siteId) to tell
        // active from completed. Past days: treat as completed.
        const isToday = !!todayStr && d.date === todayStr
        const stillActiveToday = isToday && activeTodaySiteIds.has(e.siteId)
        const hasCheckedIn = e.hasCheckedIn ?? true
        // Backend-reported hasCheckedOut wins only when it says "not yet
        // checked out"; otherwise we override with /daily's live state so
        // today's active rows aren't stuck showing 퇴근 완료.
        const hasCheckedOut = stillActiveToday ? false : (e.hasCheckedOut ?? true)
        fromDays.push({
          id: e.attendanceId || e.entryId || `${d.date}-${e.siteId}-${idx}`,
          effectiveDate: d.date,
          siteId: e.siteId,
          siteName: e.siteName || "",
          checkInTime: e.checkInTime ?? 0,
          checkOutTime: e.checkOutTime,
          workHours: undefined,
          workEffort: e.effort,
          dailyWageSnapshot: e.dailyWageSnapshot,
          expectedWage: e.expectedWage,
          status: e.status || "",
          recordType: e.categoryLabel || e.category || "",
          hasCheckedIn,
          hasCheckedOut,
          complete: hasCheckedOut,
        })
      })
    })
    if (fromDays.length > 0) return fromDays
    return data?.records || []
  }, [data, todayStr, activeTodaySiteIds])
  const sites = useMemo(() => daysToSiteLegend(data?.days || []), [data])
  const attendanceDays = data?.totalWorkDays || 0
  const totalWorkEffort = data?.totalEffort || 0

  // Site dropdown options — union of today's attendance and all sites seen
  // in monthly records so the dropdown is populated even on historical months.
  const { data: today } = useTodayAttendance()
  const siteOptions = useMemo(() => {
    const seen = new Map<string, { value: string; label: string; color: string }>()
    const add = (siteId: string, siteName: string) => {
      if (!siteId || seen.has(siteId)) return
      seen.set(siteId, { value: siteId, label: siteName, color: getSiteColor(siteId, sites) })
    }
    ;(today?.attendances || []).forEach((a) => add(a.siteId, a.siteName || ""))
    records.forEach((r) => add(r.siteId, r.siteName))
    return Array.from(seen.values())
  }, [today, records, sites])

  // Filter records by selected site
  const filteredRecords = useMemo(() => {
    if (!selectedSite) return records
    return records.filter((r) => r.siteId === selectedSite)
  }, [records, selectedSite])

  // Group records by date
  const dayGroups = useMemo(() => groupRecordsByDate(filteredRecords), [filteredRecords])

  // Per-site breakdown and total expected wage — sourced from the backend's
  // siteBreakdown payload instead of being recomputed from records.
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

  const handleNavigation = useBottomNavHandler()

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
            options={siteOptions}
            value={selectedSite}
            onChange={setSelectedSite}
          />
        </div>


        {/* Daily Attendance Cards */}
        {dayGroups.map((group) => {
          const today = new Date()
          const isGroupToday = group.date === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
          return (
            <div key={group.date} className="px-4 pb-6">
              {/* Date Header */}
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-slate-700">
                  {group.dayOfMonth}일 {group.dayName}{isGroupToday ? " (오늘)" : ""}
                </h4>
              </div>

              {/* Records — all entries for the day merged into one card */}
              {(() => {
                const [first, ...rest] = group.records
                if (!first) return null
                const firstDailyEntry = isGroupToday
                  ? (todayDaily?.attendances || []).find((a) => a.siteId === first.siteId)
                  : null
                const checkIn = firstDailyEntry?.checkInTime ?? first.checkInTime
                const checkOut = firstDailyEntry?.checkOutTime ?? first.checkOutTime
                const additionalEntries: AttendanceEntryDetail[] = rest.map((r) => {
                  const rEntry = isGroupToday
                    ? (todayDaily?.attendances || []).find((a) => a.siteId === r.siteId)
                    : null
                  return {
                    recordType: r.recordType || "",
                    workEffort: r.workEffort,
                    dailyWageSnapshot: r.dailyWageSnapshot,
                    expectedWage: r.expectedWage,
                    showCorrection: isGroupToday,
                    correctionDisabled: !correctableTodaySiteIds.has(r.siteId),
                    onCorrectionClick: () => openCorrectionDialog(r, rEntry?.checkInTime, rEntry?.checkOutTime),
                  }
                })
                return (
                  <AttendanceRecordCard
                    key={first.id || group.date}
                    siteName={first.siteName}
                    timeRange={`${formatKstTime(checkIn as never)} - ${formatKstTime(checkOut as never)}`}
                    recordType={first.recordType || ""}
                    workEffort={first.workEffort}
                    dailyWageSnapshot={first.dailyWageSnapshot}
                    expectedWage={first.expectedWage}
                    statusBadge={first.hasCheckedOut ? "퇴근 완료" : "근무중"}
                    statusVariant={first.hasCheckedOut ? "default" : "active"}
                    showCorrection={isGroupToday}
                    correctionDisabled={!correctableTodaySiteIds.has(first.siteId)}
                    onCorrectionClick={() => openCorrectionDialog(first, firstDailyEntry?.checkInTime, firstDailyEntry?.checkOutTime)}
                    additionalEntries={additionalEntries.length > 0 ? additionalEntries : undefined}
                    className="shadow-sm border border-slate-100 p-5"
                  />
                )
              })()}
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
