import { useState } from "react"
import { useNavigate } from "react-router-dom"
import FmdGoodIcon from "@mui/icons-material/FmdGood"
import MeetingRoomOutlinedIcon from "@mui/icons-material/MeetingRoomOutlined"
import { AppHeader } from "@/components/layout/AppHeader"
import { AppBottomNav, NavItem } from "@/components/layout/AppBottomNav"
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
import { submitCorrectionRequest, purgeAttendance } from "@/lib/attendance"
import { reportError } from "@/lib/errorReporter"
import { CorrectionDialog } from "@/components/ui/correction-dialog"
import { useHomeAgent } from "./useHomeAgent"
// import { WeeklyCalendar } from "./components"

export function Home() {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const { worker } = useAuth()
  const {
    userName,
    currentDate,
    attendance,
    workSite,
    sites,
    todayWorkRecords,
    // calendar,
    scanner,
    locationPopup,
    notifications,
    actions,
  } = useHomeAgent()

  const [showMaxCheckInTooltip, setShowMaxCheckInTooltip] = useState(false)

  // Correction request dialog state
  const [showCorrectionDialog, setShowCorrectionDialog] = useState(false)
  const [correctionWorkEffort, setCorrectionWorkEffort] = useState("")
  const [correctionDailyWage, setCorrectionDailyWage] = useState("")
  const [showOvertimeDialog, setShowOvertimeDialog] = useState(false)
  const [overtimeApplied, setOvertimeApplied] = useState(false)
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false)
  const [correctionAttendanceId, setCorrectionAttendanceId] = useState<string | null>(null)

  const closeAll = () => {
    setShowCorrectionDialog(false)
    setShowCheckoutDialog(false)
    setCorrectionAttendanceId(null)
  }

  const handleCorrectionSubmit = async (data: { workEffort: string; dailyWage: string; reason: string }) => {
    // 1. If no attendanceId yet, execute checkout first
    let attendanceId = correctionAttendanceId
    if (!attendanceId) {
      const checkoutResult = await actions.clockOut()
      if (!checkoutResult?.success) {
        return
      }
      attendanceId = checkoutResult.attendanceId || null
      if (!attendanceId) {
        showError("출퇴근 기록을 찾을 수 없습니다.")
        return
      }
      setCorrectionAttendanceId(attendanceId)
    }

    // 2. Submit correction requests (work_effort + daily_wage)
    const effortResult = await submitCorrectionRequest({
      attendanceId,
      requestType: "work_effort",
      requestedValue: data.workEffort,
      reason: data.reason,
    })
    if (!effortResult.success) {
      reportError("CORRECTION_SUBMIT_FAIL", effortResult.error)
      showError(effortResult.error)
      return
    }

    const wageResult = await submitCorrectionRequest({
      attendanceId,
      requestType: "daily_wage",
      requestedValue: data.dailyWage,
      reason: data.reason,
    })
    if (!wageResult.success) {
      reportError("CORRECTION_SUBMIT_FAIL", wageResult.error)
      showError(wageResult.error)
      return
    }

    showSuccess("정정 요청이 제출되었습니다.")
    setCorrectionAttendanceId(null)
    setShowCorrectionDialog(false)
  }

  const handleNavigation = (item: NavItem) => {
    if (item === "attendance") {
      navigate("/attendance")
    } else if (item === "contract") {
      navigate("/contract")
    } else if (item === "profile") {
      navigate("/profile")
    }
  }

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

        {(worker?.onboardingCompleted === false || worker?.requiredDocsCompleted === false) && (
          <div className="px-4 shrink-0 space-y-3">
            {worker?.onboardingCompleted === false && (
              <AlertBanner
                title="필수 정보 입력이 완료되지 않았어요"
                description="내정보 메뉴에서 회원 정보 입력을 완료해주세요."
                onClick={() => navigate("/profile")}
              />
            )}
            {worker?.requiredDocsCompleted === false && (
              <AlertBanner
                title="서명되지 않은 근로계약서가 있어요"
                description="월말까지 서명되지 않을 경우, 급여가 지급되지 않을 수 있으니 반드시 확인해주세요."
                onClick={() => navigate("/contract")}
              />
            )}
          </div>
        )}

        {/* Main Content - Scrollable */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
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
                {attendance.status === "퇴근 완료" && <MeetingRoomOutlinedIcon sx={{ fontSize: 16 }} />}
                {attendance.status}
              </span>
            </div>

            <div className="p-4">
              {/* Work Site Info - only show when currently checked in */}
              {attendance.isCheckedIn && workSite.name && (
                <div className="bg-neutral-100 rounded-xl p-5 mb-4">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    {workSite.name}
                  </h3>
                  {workSite.address && (
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <FmdGoodIcon sx={{ fontSize: 16 }} />
                      <span>{workSite.address}</span>
                    </div>
                  )}

                  {/* Schedule */}
                  <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 gap-y-2 text-sm">
                    <div className="flex justify-between pr-4"><span className="text-slate-500">출근</span><span className="text-slate-900">{workSite.workStart || "no data"}</span></div>
                    <div className="flex justify-between pl-4"><span className="text-slate-500">퇴근</span><span className="text-slate-900">{workSite.workEnd || "no data"}</span></div>
                    <div className="flex justify-between pr-4"><span className="text-slate-500">점심</span><span className="text-slate-900">{workSite.lunchStart && workSite.lunchEnd ? `${workSite.lunchStart} ~ ${workSite.lunchEnd}` : "no data"}</span></div>
                    <div className="flex justify-between pl-4"><span className="text-slate-500">휴게</span><span className="text-slate-900">{workSite.breakStart && workSite.breakEnd ? `${workSite.breakStart} ~ ${workSite.breakEnd}` : "no data"}</span></div>
                  </div>
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
                    {showMaxCheckInTooltip && (
                      <div className="mb-2 bg-slate-800 text-white text-sm text-center rounded-lg px-4 py-2.5">
                        하루에 최대 두 개 현장에만 출근할 수 있습니다.
                      </div>
                    )}
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
                  </div>
                )}
              </div>
            </div>
          </div>


          {/* Today's Work Status Card */}
          <div>
            <div className="pt-4 pb-3">
              <h2 className="text-base font-bold text-slate-900">오늘 근무 기록</h2>
            </div>
            {todayWorkRecords.length > 0 ? (
              <div className="space-y-3">
                {todayWorkRecords.map((record) => (
                  <div key={record.id}>
                    <AttendanceRecordCard
                      siteName={record.siteName}
                      timeRange={`${formatKstTime(record.checkInTime)} - ${record.checkOutTime ? formatKstTime(record.checkOutTime) : ""}`}
                      recordType="용역"
                      workEffort={record.workEffort}
                      dailyWageSnapshot={record.dailyWageSnapshot}
                      expectedWage={record.expectedWage}
                      showCorrection
                      onCorrectionClick={() => {
                        setCorrectionWorkEffort(record.workEffort != null ? String(record.workEffort) : "0.5")
                        setCorrectionDailyWage(record.dailyWageSnapshot != null ? record.dailyWageSnapshot.toLocaleString("ko-KR") : "0")
                        setCorrectionAttendanceId(record.id)
                        setShowCorrectionDialog(true)
                      }}
                    />
                    <button
                      onClick={async () => {
                        const result = await purgeAttendance(record.id)
                        if (result.success) {
                          showSuccess("출근 기록이 삭제되었습니다.")
                        } else {
                          showError(result.error)
                        }
                      }}
                      className="mt-1 text-xs text-slate-400 underline"
                    >
                      [TEST] 삭제
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">당일 퇴근을 완료한 기록이 여기에 노출됩니다.</p>
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
                  // TODO: replace with overtime API when ready
                  const result = await actions.clockOut()
                  if (result?.success) {
                    setOvertimeApplied(true)
                    showSuccess("야근 상태가 정상적으로 기록되었습니다.")
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
                    <span className="text-sm font-medium text-slate-900">{attendance.workEffort != null ? `${attendance.workEffort}공수` : "no data"}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm text-slate-600">적용 단가</span>
                    <span className="text-sm font-medium text-slate-900">
                      {attendance.dailyWageSnapshot != null ? formatCurrency(attendance.dailyWageSnapshot) : "no data"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200">
                    <span className="text-sm text-slate-600">예상 임금(세전)</span>
                    <span className="text-sm font-medium text-slate-900">
                      {attendance.dailyWageSnapshot != null && attendance.workEffort != null ? formatCurrency(attendance.dailyWageSnapshot * attendance.workEffort) : "no data"}
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
          siteName={workSite.name}
          timeRange={`직영 · ${attendance.checkInTime ? formatKstTime(attendance.checkInTime) : ""} - ${formatKstTime(new Date().toISOString())}`}
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
