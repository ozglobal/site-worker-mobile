import { useState, useMemo, useCallback } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { AppTopBar } from "@/components/layout/AppTopBar"
import { AppBottomNav } from "@/components/layout/AppBottomNav"
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from "lucide-react"
import { useMonthlyAttendance } from "@/lib/queries/useMonthlyAttendance"
import { useTodayAttendance } from "@/lib/queries/useTodayAttendance"
import { useBottomNavHandler } from "@/hooks/useBottomNavHandler"
import { formatTimestamp } from "@/utils/format"
import { AlertBanner } from "@/components/ui/alert-banner"
import { CorrectionDialog, type CorrectionDialogSubmitData } from "@/components/ui/correction-dialog"
import { submitCorrectionRequest } from "@/lib/attendance"
import { reportError } from "@/lib/errorReporter"
import { useToast } from "@/contexts/ToastContext"
import { Spinner } from "@/components/ui/spinner"
import { AttendanceRecordCard } from "@/components/ui/attendance-record-card"

export function DailyDetailPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useToast()
  const { date } = useParams<{ date: string }>()

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
    if (date) queryClient.invalidateQueries({ queryKey: ["todayAttendance", date] })
    setShowCorrectionDialog(false)
    setCorrectionAttendanceId(null)
  }

  const [yearStr, monthStr] = (date || "").split("-")
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)

  const { data, isLoading } = useMonthlyAttendance(year, month)

  const records = useMemo(() => {
    if (!data) return []
    return data.records.filter((r) => r.effectiveDate === date)
  }, [data, date])

  const today = useMemo(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
  }, [])

  const isToday = date === today

  // Site ids that STILL accept correction requests today. Backend flips
  // canRequestCorrection to false once a PENDING request exists.
  const { data: todayDaily } = useTodayAttendance()
  const correctableTodaySiteIds = useMemo(() => {
    const ids = new Set<string>()
    ;(todayDaily?.attendances || []).forEach((a) => {
      if (a.siteId && a.canRequestCorrection) ids.add(a.siteId)
    })
    return ids
  }, [todayDaily])

  const handleNavigation = useBottomNavHandler()

  // Format date for display: "2025년 12월 24일"
  const displayDate = useMemo(() => {
    if (!date) return ""
    const [y, m, d] = date.split("-")
    return `${y}년 ${parseInt(m, 10)}월 ${parseInt(d, 10)}일`
  }, [date])

  const navigateDay = useCallback((offset: number) => {
    if (!date) return
    const d = new Date(date)
    d.setDate(d.getDate() + offset)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    navigate(`/attendance/detail/${y}-${m}-${day}`, { replace: true })
  }, [date, navigate])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <AppTopBar title="상세내역" onBack={() => navigate(-1)} className="shrink-0" />

      {/* Date Picker */}
      <div className="flex items-center justify-between px-4 h-12 bg-white shrink-0 mt-2">
        <button onClick={() => navigateDay(-1)} className="p-1">
          <ChevronLeftIcon className="h-6 w-6 text-slate-900" />
        </button>
        <span className="text-base font-bold text-slate-900">{displayDate}</span>
        <button onClick={() => navigateDay(1)} className="p-1">
          <ChevronRightIcon className="h-6 w-6 text-slate-900" />
        </button>
      </div>

      {/* Info Banner */}
      <div className="px-4 pt-4 shrink-0">
        <AlertBanner
          variant="info"
          title="현장 단가나 공수 정정은 근무 당일만 요청할 수 있습니다."
        />
      </div>

      <main className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner />
          </div>
        ) : (
          <div className="px-4 py-4 space-y-4">
            {/* Attendance Records */}
            {records.length > 0 ? (
              records.map((record) => (
                <AttendanceRecordCard
                  key={record.id}
                  siteName={record.siteName}
                  timeRange={`${formatTimestamp(record.checkInTime)} - ${record.checkOutTime ? formatTimestamp(record.checkOutTime) : ""}`}
                  recordType={record.recordType || ""}
                  workEffort={record.workEffort}
                  dailyWageSnapshot={record.dailyWageSnapshot}
                  expectedWage={record.expectedWage}
                  statusBadge={record.hasCheckedOut ? "퇴근 완료" : "근무중"}
                  statusVariant={record.hasCheckedOut ? "default" : "active"}
                  showCorrection={isToday}
                  correctionDisabled={!correctableTodaySiteIds.has(record.siteId)}
                  onCorrectionClick={() => openCorrectionDialog(record)}
                  className="shadow-sm border border-slate-100 p-5"
                />
              ))
            ) : (
              <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                <p className="text-sm text-slate-500 text-center">해당 날짜에 출근 기록이 없습니다.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <AppBottomNav active="attendance" onNavigate={handleNavigation} className="shrink-0" />

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
