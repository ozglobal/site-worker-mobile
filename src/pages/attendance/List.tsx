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
import { groupRecordsByDate, buildSiteColorMap } from "@/utils/attendance"
import { formatCurrency } from "@/utils/format"
import { formatKstTime } from "@/utils/time"
import { AttendanceRecordCard, type AttendanceEntryDetail } from "@/components/ui/attendance-record-card"
import { CorrectionDialog, type CorrectionDialogSubmitData } from "@/components/ui/correction-dialog"
import { CorrectionSuccessModal } from "@/components/ui/correction-success-modal"
import { submitCorrectionRequest, type WeeklyAttendanceRecord } from "@/lib/attendance"
import { reportError } from "@/lib/errorReporter"
import { useToast } from "@/contexts/ToastContext"
import { useCorrectionRequests } from "@/lib/queries/useCorrectionRequests"

export function ListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showError } = useToast()
  // Evaluate lazily so the page always opens on the real current month,
  // regardless of when this module was first loaded.
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth() + 1)
  const viewMode: ViewMode = "list"
  const [selectedSite, setSelectedSite] = useState("")

  // Correction dialog state
  const [showCorrectionDialog, setShowCorrectionDialog] = useState(false)
  const [showCorrectionSuccess, setShowCorrectionSuccess] = useState(false)
  const [correctionSiteName, setCorrectionSiteName] = useState("")
  const [correctionTimeRange, setCorrectionTimeRange] = useState("")
  const [correctionWorkEffort, setCorrectionWorkEffort] = useState("")
  const [correctionDailyWage, setCorrectionDailyWage] = useState("")
  const [correctionAttendanceId, setCorrectionAttendanceId] = useState<string | null>(null)
  const [correctionWorkEntryId, setCorrectionWorkEntryId] = useState<string | null>(null)

  const openCorrectionDialog = (
    record: { id: string; siteName: string; checkInTime: number; checkOutTime?: number; workEffort?: number; dailyWageSnapshot?: number; workEntryId?: string },
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
    setCorrectionWorkEntryId(record.workEntryId ?? null)
    setShowCorrectionDialog(true)
  }

  const handleCorrectionSubmit = async (data: CorrectionDialogSubmitData) => {
    if (!correctionAttendanceId || !correctionWorkEntryId) return
    const result = await submitCorrectionRequest({
      attendanceId: correctionAttendanceId,
      workEntryId: correctionWorkEntryId,
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
    setShowCorrectionSuccess(true)
    if (todayStr) queryClient.invalidateQueries({ queryKey: ["todayAttendance", todayStr] })
    else queryClient.invalidateQueries({ queryKey: ["todayAttendance"] })
    void queryClient.invalidateQueries({ queryKey: ['correctionRequests'] })
    setShowCorrectionDialog(false)
    setCorrectionAttendanceId(null)
    setCorrectionWorkEntryId(null)
  }
  const { data, isError, refetch } = useMonthlyAttendance(year, month)
  // Today's daily is authoritative for whether a same-day attendance is
  // still active — monthly entries alone can't tell us that. Cross-reference
  // by siteId because monthly entries may not carry the attendanceId.
  const { data: todayDaily } = useTodayAttendance()

  const { data: correctionRequests = [] } = useCorrectionRequests()
  const correctionMap = useMemo(() => {
    // workEntryId 단위로 매핑. 같은 workEntryId 에 여러 이력이 있으면 pending 우선.
    const map: Record<string, typeof correctionRequests[0]> = {}
    correctionRequests.forEach((r) => {
      if (!r.workEntryId) return
      const existing = map[r.workEntryId]
      if (!existing || (existing.status !== 'pending' && r.status === 'pending')) {
        map[r.workEntryId] = r
      }
    })
    return map
  }, [correctionRequests])
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
    // Monthly 응답에는 entryId/attendanceId 가 없음 → 오늘 분만 todayDaily 에서
    // (siteId, category) 로 매칭해 entryId/attendanceId 채워주기. 분할 entry 의
    // 정정요청을 entryId 단위로 정확히 매핑하기 위함.
    const todayEntryMap = new Map<string, { entryId: string; attendanceId: string }>()
    ;(todayDaily?.attendances || []).forEach((a) => {
      a.entries.forEach((entry) => {
        const key = `${a.siteId}::${entry.category}`
        if (!todayEntryMap.has(key)) {
          todayEntryMap.set(key, { entryId: entry.entryId, attendanceId: a.attendanceId })
        }
      })
    })

    const fromDays: WeeklyAttendanceRecord[] = []
    ;(data?.days || []).forEach((d) => {
      d.entries?.forEach((e, idx) => {
        const isToday = !!todayStr && d.date === todayStr
        const stillActiveToday = isToday && activeTodaySiteIds.has(e.siteId)
        const hasCheckedIn = e.hasCheckedIn ?? true
        const hasCheckedOut = stillActiveToday ? false : (e.hasCheckedOut ?? true)
        const bridged = isToday ? todayEntryMap.get(`${e.siteId}::${e.category}`) : undefined
        const entryId = e.entryId ?? bridged?.entryId
        const attendanceId = e.attendanceId ?? bridged?.attendanceId
        fromDays.push({
          id: attendanceId || entryId || `${d.date}-${e.siteId}-${idx}`,
          workEntryId: entryId,
          effectiveDate: d.date,
          siteId: e.siteId,
          siteName: e.siteName || "",
          checkInTime: e.checkInTime ?? (undefined as unknown as number),
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
  }, [data, todayStr, activeTodaySiteIds, todayDaily])
  const colorMap = useMemo(
    () => buildSiteColorMap((todayDaily?.attendances || []).map((a) => a.siteId), data?.days || []),
    [todayDaily, data],
  )
  const attendanceDays = data?.totalWorkDays || 0
  const totalWorkEffort = data?.totalEffort || 0

  // Site dropdown options — union of today's attendance and all sites seen
  // in monthly records so the dropdown is populated even on historical months.
  const { data: today } = useTodayAttendance()
  const siteOptions = useMemo(() => {
    const seen = new Map<string, { value: string; label: string; color: string }>()
    const add = (siteId: string, siteName: string) => {
      if (!siteId || seen.has(siteId)) return
      seen.set(siteId, { value: siteId, label: siteName, color: colorMap.get(siteId) || "#007DCA" })
    }
    ;(today?.attendances || []).forEach((a) => add(a.siteId, a.siteName || ""))
    records.forEach((r) => add(r.siteId, r.siteName))
    return Array.from(seen.values())
  }, [today, records, colorMap])

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
        color: colorMap.get(s.siteId) || "#007DCA",
      })),
    [data, colorMap]
  )

  const totalExpectedWage = data?.totalExpectedWage || 0

  const handleYearMonthChange = (y: number, m: number) => {
    setYear(y)
    setMonth(m)
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
        onYearMonthChange={handleYearMonthChange}
        onViewModeChange={handleViewModeChange}
        className="shrink-0"
      />

      <div className="flex-1 overflow-y-auto mt-3">
        {/* Monthly Summary Card */}
        <div className="px-4 pb-4">
          <div className="rounded-xl p-5" style={{ backgroundColor: "#00000008" }}>
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
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-700">
                  {group.dayOfMonth}일 {group.dayName}{isGroupToday ? " (오늘)" : ""}
                </h4>
                <span className="text-sm font-semibold text-slate-900">
                  {formatCurrency(group.records.reduce((sum, r) => sum + (r.expectedWage ?? 0), 0))}
                </span>
              </div>

              {/* Records — 현장별로 카드 분리, 같은 현장 내 분할 entry 는 한 카드에 묶음 */}
              {(() => {
                // 같은 현장끼리 그룹핑 (현장 등장 순서 유지)
                const bySite = new Map<string, typeof group.records>()
                group.records.forEach((r) => {
                  const list = bySite.get(r.siteId) ?? []
                  list.push(r)
                  bySite.set(r.siteId, list)
                })
                return Array.from(bySite.entries()).map(([siteId, siteRecords]) => {
                  const [first, ...rest] = siteRecords
                  if (!first) return null
                  const firstDailyEntry = isGroupToday
                    ? (todayDaily?.attendances || []).find((a) => a.siteId === first.siteId)
                    : null
                  const checkIn = firstDailyEntry?.checkInTime ?? first.checkInTime
                  const checkOut = firstDailyEntry?.checkOutTime ?? first.checkOutTime
                  const inStr = formatKstTime(checkIn as never)
                  const outStr = formatKstTime(checkOut as never)
                  const timeRange = inStr || outStr ? `${inStr}${outStr ? ` - ${outStr}` : ""}` : ""
                  const additionalEntries: AttendanceEntryDetail[] = rest.map((r) => ({
                    recordType: r.recordType || "",
                    workEffort: r.workEffort,
                    dailyWageSnapshot: r.dailyWageSnapshot,
                    expectedWage: r.expectedWage,
                    showCorrection: isGroupToday,
                    correctionDisabled: !correctableTodaySiteIds.has(r.siteId),
                    pendingCorrection: r.workEntryId ? correctionMap[r.workEntryId] : undefined,
                    onCorrectionClick: () => openCorrectionDialog(r, firstDailyEntry?.checkInTime, firstDailyEntry?.checkOutTime),
                  }))
                  return (
                    <div key={siteId} className="mb-3 last:mb-0">
                      <AttendanceRecordCard
                        key={first.id || `${group.date}-${siteId}`}
                        siteName={first.siteName}
                        timeRange={timeRange}
                        recordType={first.recordType || ""}
                        workEffort={first.workEffort}
                        dailyWageSnapshot={first.dailyWageSnapshot}
                        expectedWage={first.expectedWage}
                        statusBadge={first.hasCheckedOut ? "퇴근 완료" : "근무중"}
                        statusVariant={first.hasCheckedOut ? "default" : "active"}
                        showCorrection={isGroupToday}
                        correctionDisabled={!correctableTodaySiteIds.has(first.siteId)}
                        pendingCorrection={first.workEntryId ? correctionMap[first.workEntryId] : undefined}
                        onCorrectionClick={() => openCorrectionDialog(first, firstDailyEntry?.checkInTime, firstDailyEntry?.checkOutTime)}
                        additionalEntries={additionalEntries.length > 0 ? additionalEntries : undefined}
                        className="shadow-sm border border-slate-100 p-5"
                      />
                    </div>
                  )
                })
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
          onClose={() => { setShowCorrectionDialog(false); setCorrectionAttendanceId(null); setCorrectionWorkEntryId(null) }}
          onSubmit={handleCorrectionSubmit}
        />
      )}

      <CorrectionSuccessModal open={showCorrectionSuccess} onClose={() => setShowCorrectionSuccess(false)} />
    </div>
  )
}
