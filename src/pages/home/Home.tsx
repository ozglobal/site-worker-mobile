import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { MapPin as FmdGoodIcon } from "lucide-react"
import { AppHeader } from "@/components/layout/AppHeader"
import { AppBottomNav } from "@/components/layout/AppBottomNav"
import QRCodeScanner from "@/components/ui/qr-scanner"
import { LocationPermissionPopup } from "@/components/ui/location-permission-popup"
import { formatKstTime } from "@/utils/time"
import { formatCurrency } from "@/utils/format"
import { AttendanceRecordCard } from "@/components/ui/attendance-record-card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { AlertBanner } from "@/components/ui/alert-banner"
import { useToast } from "@/contexts/ToastContext"
import { useAuth } from "@/contexts/AuthContext"
import { CorrectionDialog, type CorrectionDialogSubmitData } from "@/components/ui/correction-dialog"
import { useHomeAgent } from "./useHomeAgent"
import { useTodayAttendance } from "@/lib/queries/useTodayAttendance"
import { useHomeData } from "@/lib/queries/useHomeData"
import { useBottomNavHandler } from "@/hooks/useBottomNavHandler"

export function Home() {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const { worker } = useAuth()
  // Fire GET /system/worker/me/home first — aggregates today's attendance,
  // monthly stats, unread notices, and onboarding/documents flags in one call.
  useHomeData()
  // /attendance/daily carries per-site `attendanceId` which /home omits — we
  // need it to open the correction dialog against a specific record.
  const { data: todayDaily } = useTodayAttendance()
  const {
    userName,
    currentDate,
    attendance,
    workSite,
    scanner,
    locationPopup,
    notifications,
    actions,
  } = useHomeAgent()

  // Active attendance from /daily (currently checked in, not yet checked out).
  // Drives the site-info block — name, address, and the day's schedule.
  const activeAttendance = useMemo(
    () => (todayDaily?.attendances || []).find((a) => !a.checkOutTime),
    [todayDaily]
  )

  // Today's completed records — rendered in the "오늘 근무 기록" card.
  // One row per entry from data.attendances[].entries[], inheriting the
  // site-level check-in/out times. Every field shown on the card resolves
  // to either an attendance-level or entry-level property of /daily.
  const todayWorkRecords = useMemo(
    () =>
      (todayDaily?.attendances || [])
        .filter((a) => !!a.checkOutTime)
        .flatMap((a) =>
          (a.entries || []).map((e) => ({
            id: a.attendanceId,
            workEntryId: e.entryId || "",
            siteName: a.siteName || "",
            checkInTime: a.checkInTime || "",
            checkOutTime: a.checkOutTime || undefined,
            recordType: e.categoryLabel || e.category || "",
            workEffort: e.effort,
            dailyWageSnapshot: e.dailyWageSnapshot,
            expectedWage: e.expectedWage,
            // Backend flag — flipped to false once a PENDING request exists,
            // so the 정정 요청 button can't be tapped twice.
            canRequestCorrection:
              e.canRequestCorrection ?? a.canRequestCorrection ?? true,
          }))
        ),
    [todayDaily]
  )

  const [showMaxCheckInTooltip, setShowMaxCheckInTooltip] = useState(false)

  // Correction request dialog state
  const [showCorrectionDialog, setShowCorrectionDialog] = useState(false)
  const [correctionWorkEffort, setCorrectionWorkEffort] = useState("")
  const [correctionDailyWage, setCorrectionDailyWage] = useState("")
  const [correctionSiteName, setCorrectionSiteName] = useState("")
  const [correctionTimeRange, setCorrectionTimeRange] = useState("")
  const [showOvertimeDialog, setShowOvertimeDialog] = useState(false)
  const [overtimeApplied, setOvertimeApplied] = useState(false)
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false)
  const [correctionAttendanceId, setCorrectionAttendanceId] = useState<string | null>(null)
  const [correctionWorkEntryId, setCorrectionWorkEntryId] = useState<string | null>(null)

  const closeAll = () => {
    setShowCorrectionDialog(false)
    setShowCheckoutDialog(false)
    setCorrectionAttendanceId(null)
  }

  const handleCorrectionSubmit = async (data: CorrectionDialogSubmitData) => {
    if (!correctionAttendanceId) {
      showError("출퇴근 기록을 찾을 수 없습니다.")
      return
    }

    const result = await actions.submitCorrection({
      attendanceId: correctionAttendanceId,
      workEntryId: correctionWorkEntryId || correctionAttendanceId,
      requestType: data.requestType,
      requestedValue: data.requestedValue,
      requestedEffort: data.requestedEffort,
      requestedWage: data.requestedWage,
      reason: data.reason,
    })
    if (!result.success) {
      showError(result.error)
      return
    }

    showSuccess("정정 요청이 제출되었습니다.")
    setCorrectionAttendanceId(null)
    setCorrectionWorkEntryId(null)
    setShowCorrectionDialog(false)
  }

  const handleNavigation = useBottomNavHandler()

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <AppHeader showLeftAction={false} title="시재건설" showRightAction={true} className="shrink-0" />

      {/* Main Content */}
      <div className="flex flex-col flex-1 bg-slate-100 overflow-hidden">
        {/* Header - Greeting */}
        <div className="bg-transparent px-4 py-4 shrink-0">
          <p className="text-sm text-slate-500 mb-1">
            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월 {currentDate.getDate()}일 ({["일", "월", "화", "수", "목", "금", "토"][currentDate.getDay()]})
          </p>
          <h1 className="text-lg font-bold text-slate-900">
            안녕하세요, {userName}님!
          </h1>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {/* Notice banners */}
          {(worker?.onboardingCompleted === false || worker?.requiredContractsCompleted === false || worker?.requiredDocsCompleted === false) && (
            <div className="space-y-3">
              {worker?.onboardingCompleted === false && (
                <AlertBanner
                  title="필수 정보 입력이 완료되지 않았어요"
                  description="내정보 메뉴에서 회원 정보 입력을 완료해주세요."
                  onClick={() => navigate("/profile")}
                />
              )}
              {worker?.requiredContractsCompleted === false && (
                <AlertBanner
                  title="서명하지 않은 근로계약서가 있어요"
                  description="월말까지 서명하지 않을 경우, 급여가 지급되지 않을 수 있으니 반드시 확인해주세요."
                  onClick={() => navigate("/contract")}
                />
              )}
              {worker?.requiredDocsCompleted === false && (
                <AlertBanner
                  title="제출하지 않은 서류가 있어요."
                  description="월말까지 제출하지 않을 경우, 급여가 지급되지 않을 수 있으니 반드시 확인해주세요."
                  onClick={() => navigate("/profile/documents")}
                />
              )}
            </div>
          )}
          {/* Today's Work Card */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-4 pt-3 flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">현장 체크인</h2>
              <span
                className={`flex items-center gap-1 text-sm font-semibold px-2 py-0.5 rounded ${
                  attendance.status === "근무 중"
                    ? "text-primary bg-primary/10"
                    : "text-slate-500 bg-slate-100"
                }`}
              >
                {attendance.status}
              </span>
            </div>

            <div className="p-4">
              {/* Work Site Info - only show when currently checked in.
                  All fields come from /attendance/daily's active attendance. */}
              {attendance.isCheckedIn && activeAttendance && (
                <div className="bg-neutral-100 rounded-xl p-5 mb-4">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    {activeAttendance.siteName}
                  </h3>
                  {activeAttendance.siteAddress && (
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <FmdGoodIcon size={16} />
                      <span>{activeAttendance.siteAddress}</span>
                    </div>
                  )}

                  {/* Schedule — pulled from siteSchedule on the active attendance.
                      Times arrive as HH:mm:ss; trim to HH:mm for display. */}
                  {(() => {
                    const hm = (t?: string) => (t ? t.slice(0, 5) : "")
                    const s = activeAttendance.siteSchedule
                    const lunch = hm(s?.lunchStartTime) && hm(s?.lunchEndTime) ? `${hm(s?.lunchStartTime)} ~ ${hm(s?.lunchEndTime)}` : "—"
                    const rest = hm(s?.restStartTime) && hm(s?.restStopTime) ? `${hm(s?.restStartTime)} ~ ${hm(s?.restStopTime)}` : "—"
                    return (
                      <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 gap-y-2 text-sm">
                        <div className="flex justify-between pr-4"><span className="text-slate-500">출근</span><span className="text-slate-900">{hm(s?.standardCheckIn) || "—"}</span></div>
                        <div className="flex justify-between pl-4"><span className="text-slate-500">퇴근</span><span className="text-slate-900">{hm(s?.standardCheckOut) || "—"}</span></div>
                        <div className="flex justify-between pr-4"><span className="text-slate-500">점심</span><span className="text-slate-900">{lunch}</span></div>
                        <div className="flex justify-between pl-4"><span className="text-slate-500">휴게</span><span className="text-slate-900">{rest}</span></div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Clock In/Out Section */}
              <div className="space-y-3">
                {/* Time Display - show only when currently checked in */}
                {attendance.isCheckedIn && attendance.checkInTime && (
                  <div>
                    <div className="flex items-center justify-between rounded-lg px-4 py-1">
                      <span className="text-sm font-medium text-slate-500">출근</span>
                      <span className="text-sm font-semibold text-slate-500">{formatKstTime(attendance.checkInTime)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg px-4 py-2">
                      <span className="text-sm font-medium text-slate-500">퇴근</span>
                      <span className="text-sm font-semibold text-slate-500">아직 퇴근하지 않았습니다</span>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                {attendance.isCheckedIn ? (
                  <div className="flex gap-3">
                    {!overtimeApplied && (
                      <Button variant="outline" size="full" onClick={() => setShowOvertimeDialog(true)} disabled={attendance.isProcessing}
                        className="basis-1/3 bg-white border-gray-300 text-slate-900 hover:bg-gray-50">
                        야근 신청
                      </Button>
                    )}
                    <Button variant={attendance.isProcessing ? "primaryDisabled" : "primary"} size="full" onClick={() => setShowCheckoutDialog(true)} disabled={attendance.isProcessing}
                      className={overtimeApplied ? "flex-1" : "basis-2/3"}>
                      {attendance.isProcessing ? "처리 중..." : "퇴근하기"}
                    </Button>
                  </div>
                ) : (
                  <div
                    className="relative"
                    onMouseEnter={() => !attendance.canCheckIn && setShowMaxCheckInTooltip(true)}
                    onMouseLeave={() => setShowMaxCheckInTooltip(false)}
                    onTouchStart={() => !attendance.canCheckIn && setShowMaxCheckInTooltip(true)}
                    onTouchEnd={() => setTimeout(() => setShowMaxCheckInTooltip(false), 2000)}
                  >
                    <Button
                      variant={!attendance.canCheckIn || attendance.isProcessing ? "primaryDisabled" : "primary"}
                      size="full"
                      onClick={() => {
                        if (!attendance.canCheckIn) return
                        actions.clockIn()
                      }}
                    >
                      {attendance.isProcessing ? "처리 중..." : "출근하기"}
                    </Button>
                    {showMaxCheckInTooltip && (
                      <div className="mt-2 bg-slate-800 text-white text-sm text-center rounded-lg px-4 py-2.5">
                        하루에 최대 두 개 현장에만 출근할 수 있습니다.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>


          {/* Today's Work Status Card */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="pb-3">
              <h2 className="text-base font-bold text-slate-900">오늘 근무 기록</h2>
            </div>
            {todayWorkRecords.length > 0 ? (
              <div className="space-y-3">
                {todayWorkRecords.map((record, idx) => (
                  <div key={record.workEntryId || `${record.id}-${idx}`}>
                    <AttendanceRecordCard
                      siteName={record.siteName}
                      timeRange={`${formatKstTime(record.checkInTime)} - ${record.checkOutTime ? formatKstTime(record.checkOutTime) : ""}`}
                      recordType={record.recordType || ""}
                      workEffort={record.workEffort}
                      dailyWageSnapshot={record.dailyWageSnapshot}
                      expectedWage={record.expectedWage}
                      showCorrection
                      correctionDisabled={!record.canRequestCorrection}
                      onCorrectionClick={() => {
                        setCorrectionWorkEffort(record.workEffort != null ? String(record.workEffort) : "")
                        setCorrectionDailyWage(record.dailyWageSnapshot != null ? record.dailyWageSnapshot.toLocaleString("ko-KR") : "")
                        setCorrectionAttendanceId(record.id)
                        setCorrectionWorkEntryId(record.workEntryId || null)
                        setCorrectionSiteName(record.siteName || "")
                        setCorrectionTimeRange(
                          `직영 · ${record.checkInTime ? formatKstTime(record.checkInTime) : ""} - ${record.checkOutTime ? formatKstTime(record.checkOutTime) : ""}`
                        )
                        setShowCorrectionDialog(true)
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-100 rounded-xl p-4 flex items-center justify-center border border-slate-200">
                <p className="text-sm text-slate-500">아직 오늘 퇴근한 기록이 없어요.</p>
              </div>
            )}
          </div>

          {/* Weekly Work Status Card - temporarily hidden
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-4 pt-3">
              <h2 className="text-base font-bold text-slate-900">주간 근무 현황</h2>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <WeeklyCalendar
                  events={calendar.events}
                  onSelect={calendar.onDateSelect}
                />
              </div>

              {calendar.hasEventsThisWeek ? (
                <div className="space-y-1">
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
              ) : (
                <p className="text-sm text-slate-500 bg-neutral-100 px-3 py-2 rounded-lg text-center">
                  이번 주에 출근한 날이 아직 없어요
                </p>
              )}
            </div>
          </div>
          */}
        </div>
      </div>

      <AppBottomNav className="shrink-0" onNavigate={handleNavigation} />

      {/* QR Scanner Overlay Popup */}
      {scanner.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={scanner.close} />
          <div className="relative z-10 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-xl">
            <Button variant="ghost" size="icon" onClick={scanner.close}
              className="absolute top-4 right-4 z-20 rounded-full bg-slate-100 hover:bg-slate-200">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </Button>
            <QRCodeScanner
              onScanSuccess={scanner.onSuccess}
              onScanError={(error) => console.error("QR error:", error)}
              autoStart={true}
            />
          </div>
        </div>
      )}

      {/* Location Permission Popup */}
      {locationPopup.isOpen && (
        <LocationPermissionPopup
          onGranted={locationPopup.onGranted}
          onDenied={locationPopup.onDenied}
          onClose={locationPopup.onClose}
          isDenied={locationPopup.isDenied}
        />
      )}

      {/* Check-in Loading Overlay */}
      {attendance.isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg px-6 py-4 flex items-center gap-3">
            <Spinner size="md" />
            <span className="text-sm text-slate-900">처리 중...</span>
          </div>
        </div>
      )}

      {/* Check-in Success Notification */}
      {notifications.showSuccess && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 pointer-events-none">
          <div
            className="w-full max-w-sm bg-slate-800 text-white rounded-lg shadow-lg px-4 py-3 flex items-start gap-3 pointer-events-auto"
            onClick={notifications.dismissSuccess}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0 mt-0.5">
              <path
                d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
                fill="currentColor"
                fillOpacity="0.2"
              />
              <path
                d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M6.5 10L9 12.5L13.5 7.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex-1">
              <p className="font-medium text-sm">출근 완료</p>
              <p className="text-xs text-slate-300 mt-0.5"><span className="font-semibold">{notifications.siteName}</span> 에 정상적으로 출근 처리되었습니다.</p>
            </div>
          </div>
        </div>
      )}

      {/* Overtime Request Dialog */}
      {showOvertimeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowOvertimeDialog(false)} />
          <div className="relative z-10 w-80 bg-white rounded-xl shadow-xl p-6">
            <h2 className="text-lg font-bold text-slate-900 text-center mb-3">야근 신청</h2>
            <p className="text-sm text-slate-500 text-center mb-6 leading-relaxed">
              금일 야간 근로를 실제 진행하는 경우에만<br />야근 신청을 진행해주세요.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" size="full" onClick={() => setShowOvertimeDialog(false)}
                className="flex-1 bg-gray-100 border-0 text-slate-900 hover:bg-gray-200">
                취소하기
              </Button>
              <Button variant="primary" size="full" onClick={async () => {
                  setShowOvertimeDialog(false)
                  const id = attendance.attendanceId
                  if (!id) {
                    showError("출퇴근 기록을 찾을 수 없습니다.")
                    return
                  }
                  const result = await actions.requestOvertime(id)
                  if (result.success) {
                    setOvertimeApplied(true)
                    showSuccess("야근 상태가 정상적으로 기록되었습니다.")
                  } else {
                    showError(result.error)
                  }
                }}
                className="flex-1">
                신청하기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Confirmation Dialog */}
      {showCheckoutDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCheckoutDialog(false)} />
          <div className="relative z-10 w-[calc(100%-2rem)] max-w-sm bg-white rounded-2xl shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5">
              <h2 className="text-lg font-bold text-slate-900">퇴근하기</h2>
              <button onClick={() => setShowCheckoutDialog(false)} className="p-1 text-slate-400">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Current attendance (not yet checked out) */}
              <div>
                <h3 className="text-base font-bold text-slate-900">{workSite.name}</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {attendance.checkInTime ? formatKstTime(attendance.checkInTime) : ""} - {formatKstTime(new Date().toISOString())}
                </p>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                <div className="px-4 py-2.5">
                  <span className="text-sm font-bold text-slate-900">용역</span>
                </div>
                <div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm text-slate-600">공수</span>
                    <span className="text-sm font-medium text-slate-900">{attendance.workEffort != null ? `${attendance.workEffort}공수` : "—"}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm text-slate-600">적용 단가</span>
                    <span className="text-sm font-medium text-slate-900">
                      {attendance.dailyWageSnapshot != null ? formatCurrency(attendance.dailyWageSnapshot) : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200">
                    <span className="text-sm text-slate-600">예상 임금(세전)</span>
                    <span className="text-sm font-medium text-slate-900">
                      {attendance.dailyWageSnapshot != null && attendance.workEffort != null ? formatCurrency(attendance.dailyWageSnapshot * attendance.workEffort) : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Message */}
              <div className="bg-slate-50 rounded-lg p-4 flex gap-3">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0 mt-0.5">
                  <path
                    d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
                    stroke="#94A3B8"
                    strokeWidth="1.5"
                  />
                  <path d="M10 6V11" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="10" cy="14" r="1" fill="#94A3B8" />
                </svg>
                <p className="text-sm text-gray-700">
                  당일 공수/단가 변경이 필요한 경우, 퇴근 완료 후 정정 요청을 통해 관리자에게 수정을 요청할 수 있습니다.
                </p>
              </div>
            </div>

            {/* Button - outside scroll area */}
            <div className="px-5 pb-5">
              <Button variant="primary" size="full" onClick={async () => {
                setShowCheckoutDialog(false)
                const result = await actions.clockOut()
                if (result?.success) {
                  showSuccess("퇴근 완료", "정상적으로 퇴근처리 되었습니다. 오늘도 수고하셨습니다.")
                }
              }}>
                퇴근하기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Check-in Error Dialog */}
      {notifications.showError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={notifications.dismissError} />
          <div className="relative z-10 w-[calc(100%-2rem)] max-w-sm bg-white rounded-2xl shadow-xl pt-8 pb-5 px-5">
            {/* Error Icon */}
            <div className="flex justify-center mb-5">
              <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            {/* Title */}
            <h2 className="text-lg font-bold text-slate-900 text-center mb-3">출근에 실패했어요</h2>
            {/* Message */}
            <p className="text-sm text-slate-500 text-center leading-relaxed mb-6">
              {notifications.errorMessage || "출근 가능 반경에서 벗어났습니다.\n출근 현장 근처로 이동 후 다시 시도하거나,\n현장 관리자에게 문의해주세요."}
            </p>
            {/* Button */}
            <Button variant="outline" size="full" onClick={notifications.dismissError}
              className="bg-white border-gray-200 text-slate-900 hover:bg-gray-50">
              닫기
            </Button>
          </div>
        </div>
      )}


      {/* Correction Request Dialog */}
      {showCorrectionDialog && (
        <CorrectionDialog
          siteName={correctionSiteName || workSite.name}
          timeRange={correctionTimeRange || `직영 · ${attendance.checkInTime ? formatKstTime(attendance.checkInTime) : ""} - ${formatKstTime(new Date().toISOString())}`}
          initialWorkEffort={correctionWorkEffort}
          initialDailyWage={correctionDailyWage}
          onBack={() => { setShowCorrectionDialog(false); setShowCheckoutDialog(true) }}
          onClose={closeAll}
          onSubmit={handleCorrectionSubmit}
        />
      )}
    </div>
  )
}
