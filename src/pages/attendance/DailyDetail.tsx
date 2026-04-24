import { useState, useMemo, useCallback } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { AppTopBar } from "@/components/layout/AppTopBar"
import { AppBottomNav } from "@/components/layout/AppBottomNav"
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useBottomNavHandler } from "@/hooks/useBottomNavHandler"
import { AlertBanner } from "@/components/ui/alert-banner"
import { CorrectionDialog, type CorrectionDialogSubmitData } from "@/components/ui/correction-dialog"
import { fetchTodayAttendance, submitCorrectionRequest, type DailyAttendanceSite, type DailyAttendanceEntry } from "@/lib/attendance"
import { reportError } from "@/lib/errorReporter"
import { useToast } from "@/contexts/ToastContext"
import { Spinner } from "@/components/ui/spinner"
import { AttendanceRecordCard, type AttendanceEntryDetail } from "@/components/ui/attendance-record-card"


function formatTime(t: string | null | undefined): string {
  if (!t) return ""
  return new Date(t).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })
}

export function DailyDetailPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useToast()
  const { date } = useParams<{ date: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ["todayAttendance", date],
    queryFn: async () => {
      const result = await fetchTodayAttendance(date!)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: !!date,
    staleTime: 30_000,
  })

  // Correction dialog state
  const [showCorrectionDialog, setShowCorrectionDialog] = useState(false)
  const [correctionAttendanceId, setCorrectionAttendanceId] = useState<string | null>(null)
  const [correctionEntryId, setCorrectionEntryId] = useState<string | null>(null)
  const [correctionSiteName, setCorrectionSiteName] = useState("")
  const [correctionTimeRange, setCorrectionTimeRange] = useState("")
  const [correctionWorkEffort, setCorrectionWorkEffort] = useState("")
  const [correctionDailyWage, setCorrectionDailyWage] = useState("")

  const openCorrectionDialog = (site: DailyAttendanceSite, entry: DailyAttendanceEntry) => {
    setCorrectionSiteName(site.siteName)
    setCorrectionTimeRange(`${formatTime(site.checkInTime)} - ${formatTime(site.checkOutTime)}`)
    setCorrectionWorkEffort(entry.effort != null ? String(entry.effort) : "")
    setCorrectionDailyWage(entry.dailyWageSnapshot != null ? entry.dailyWageSnapshot.toLocaleString("ko-KR") : "")
    setCorrectionAttendanceId(site.attendanceId)
    setCorrectionEntryId(entry.entryId)
    setShowCorrectionDialog(true)
  }

  const handleCorrectionSubmit = async (data: CorrectionDialogSubmitData) => {
    if (!correctionAttendanceId || !correctionEntryId) return
    const result = await submitCorrectionRequest({
      attendanceId: correctionAttendanceId,
      workEntryId: correctionEntryId,
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
    setCorrectionEntryId(null)
  }

  const today = useMemo(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
  }, [])

  const isToday = date === today
  const nextDisabled = !date || date >= today

  const handleNavigation = useBottomNavHandler()

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

  const attendances = data?.attendances ?? []

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <AppTopBar title="상세내역" onBack={() => navigate(-1)} className="shrink-0" />

      {/* Date navigator */}
      <div className="flex items-center justify-between px-4 h-12 bg-white shrink-0 mt-2">
        <button onClick={() => navigateDay(-1)} className="p-1">
          <ChevronLeftIcon className="h-6 w-6 text-slate-900" />
        </button>
        <span className="text-base font-bold text-slate-900">{displayDate}</span>
        <button onClick={nextDisabled ? undefined : () => navigateDay(1)} className={cn("p-1", nextDisabled && "invisible")}>
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
            {attendances.length > 0 ? (
              attendances.map((site) =>
                site.entries.length > 0 ? (
                  (() => {
                    const [firstEntry, ...restEntries] = site.entries
                    const additionalEntries: AttendanceEntryDetail[] = restEntries.map((e) => ({
                      recordType: e.categoryLabel,
                      workEffort: e.effort,
                      dailyWageSnapshot: e.dailyWageSnapshot,
                      expectedWage: e.expectedWage,
                      showCorrection: isToday,
                      correctionDisabled: !e.canRequestCorrection,
                      onCorrectionClick: () => openCorrectionDialog(site, e),
                    }))
                    return (
                      <AttendanceRecordCard
                        key={firstEntry.entryId}
                        siteName={site.siteName}
                        timeRange={`${formatTime(site.checkInTime)}${site.checkOutTime ? ` - ${formatTime(site.checkOutTime)}` : ""}`}
                        recordType={firstEntry.categoryLabel}
                        workEffort={firstEntry.effort}
                        dailyWageSnapshot={firstEntry.dailyWageSnapshot}
                        expectedWage={firstEntry.expectedWage}
                        statusBadge={site.checkOutTime ? "퇴근 완료" : "근무중"}
                        statusVariant={site.checkOutTime ? "default" : "active"}
                        showCorrection={isToday}
                        correctionDisabled={!firstEntry.canRequestCorrection}
                        onCorrectionClick={() => openCorrectionDialog(site, firstEntry)}
                        additionalEntries={additionalEntries.length > 0 ? additionalEntries : undefined}
                        className="shadow-sm border border-slate-100 p-5"
                      />
                    )
                  })()
                ) : (
                  // Site checked in but no entries yet
                  <div key={site.attendanceId} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-2">
                    <span className="inline-block text-xs font-medium px-2.5 py-1 rounded text-green-700 bg-green-100">근무중</span>
                    <p className="text-base font-bold text-slate-900">{site.siteName}</p>
                    <p className="text-sm text-slate-500">{formatTime(site.checkInTime)} -</p>
                  </div>
                )
              )
            ) : (
              <div className="bg-slate-100 rounded-xl p-4 flex items-center justify-center border border-slate-200">
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
          onClose={() => { setShowCorrectionDialog(false); setCorrectionAttendanceId(null); setCorrectionEntryId(null) }}
          onSubmit={handleCorrectionSubmit}
        />
      )}
    </div>
  )
}
