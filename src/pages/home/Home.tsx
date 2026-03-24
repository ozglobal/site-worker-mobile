import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import FmdGoodIcon from "@mui/icons-material/FmdGood"
import { AppHeader } from "@/components/layout/AppHeader"
import { AppBottomNav, NavItem } from "@/components/layout/AppBottomNav"
import QRCodeScanner from "@/components/ui/QrScanner"
import { LocationPermissionPopup } from "@/components/ui/LocationPermissionPopup"
import { formatKstTime } from "@/utils/time"
import { formatCurrency } from "@/utils/format"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { AlertBanner } from "@/components/ui/alert-banner"
import { useToast } from "@/contexts/ToastContext"
import { submitCorrectionRequest } from "@/lib/attendance"
import { reportError } from "@/lib/errorReporter"
import { useHomeAgent } from "./useHomeAgent"
import { WeeklyCalendar } from "./components"

export function Home() {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const {
    userName,
    currentDate,
    attendance,
    workSite,
    sites,
    todayWorkRecords,
    calendar,
    scanner,
    locationPopup,
    notifications,
    checkoutPopup,
    actions,
  } = useHomeAgent()

  // Correction request dialog state
  const [showCorrectionDialog, setShowCorrectionDialog] = useState(false)
  const [correctionWorkEffort, setCorrectionWorkEffort] = useState("")
  const [correctionDailyWage, setCorrectionDailyWage] = useState("")
  const [correctionReason, setCorrectionReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const record = checkoutPopup.lastCheckoutRecord

  const expectedWage = useMemo(() => {
    const effort = parseFloat(correctionWorkEffort) || 0
    const wage = parseFloat(correctionDailyWage.replace(/,/g, "")) || 0
    return effort * wage
  }, [correctionWorkEffort, correctionDailyWage])

  const openCorrectionDialog = () => {
    if (record) {
      setCorrectionWorkEffort(record.workEffort != null ? String(record.workEffort) : "1.0")
      setCorrectionDailyWage(record.dailyWageSnapshot != null ? record.dailyWageSnapshot.toLocaleString("ko-KR") : "0")
    } else {
      setCorrectionWorkEffort("1.0")
      setCorrectionDailyWage("0")
    }
    setCorrectionReason("")
    setShowCorrectionDialog(true)
  }

  const closeCorrectionDialog = () => {
    setShowCorrectionDialog(false)
  }

  const closeAll = () => {
    setShowCorrectionDialog(false)
    checkoutPopup.close()
  }

  const handleCorrectionSubmit = async () => {
    if (!record) return
    const attendanceId = checkoutPopup.attendanceId || record.id
    if (!attendanceId) {
      showError("출퇴근 기록을 찾을 수 없습니다.")
      return
    }
    if (!correctionReason.trim()) {
      showError("변경사유를 입력해주세요.")
      return
    }

    setIsSubmitting(true)
    const result = await submitCorrectionRequest({
      attendanceId,
      requestType: correctionWorkEffort,
      requestedValue: correctionDailyWage.replace(/,/g, ""),
      reason: correctionReason.trim(),
    })
    setIsSubmitting(false)

    if (result.success) {
      showSuccess("정정 요청이 제출되었습니다.")
      closeAll()
    } else {
      reportError("CORRECTION_SUBMIT_FAIL", result.error)
      showError(result.error)
    }
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
          <h1 className="text-xl font-bold text-slate-900">
            안녕하세요, {userName}님!
          </h1>
        </div>

        <div className="px-4 shrink-0 space-y-3">
          {/* ProfileAlertBanner: conditionally show when profile is incomplete */}
          <AlertBanner
            variant="error"
            title="필수 정보 입력이 완료되지 않았어요"
            description="급여 지급을 위해 월말까지 반드시 작성을 완료해주세요."
            onClick={() => navigate("/profile")}
          />

          {/* ContractAlertBanner: conditionally show when unsigned contract exists */}
          <AlertBanner
            variant="error"
            title="서명하지 않은 근로계약서가 있어요"
            description="급여 지급을 위해 월말까지 반드시 서명해주세요."
            onClick={() => navigate("/contract")}
          />
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {/* Today's Work Card */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-4 pt-3 flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">현장 체크인</h2>
              <span
                className={`text-sm font-semibold px-2 py-0.5 rounded ${
                  attendance.status === "근무 중"
                    ? "text-primary bg-primary/10"
                    : "text-slate-500 bg-slate-100"
                }`}
              >
                {attendance.status}
              </span>
            </div>

            <div className="p-4">
              {/* Work Site Info - only show when currently checked in */}
              {attendance.isCheckedIn && workSite.name && (
                <div className="bg-slate-100 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    {workSite.name}
                  </h3>
                  {workSite.address && (
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <FmdGoodIcon sx={{ fontSize: 16 }} />
                      <span>{workSite.address}</span>
                    </div>
                  )}
                  {attendance.dailyWageSnapshot != null && (
                    <p className="text-sm text-[#007DCA] mt-1">
                      {formatCurrency(attendance.dailyWageSnapshot)} / 1공수
                    </p>
                  )}
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
                  <Button variant={attendance.isProcessing ? "primaryDisabled" : "primary"} size="full" onClick={actions.clockOut} disabled={attendance.isProcessing}>
                    {attendance.isProcessing ? "처리 중..." : "퇴근하기"}
                  </Button>
                ) : attendance.canCheckIn && (
                  <Button variant={attendance.isProcessing ? "primaryDisabled" : "primary"} size="full" onClick={actions.clockIn} disabled={attendance.isProcessing}>
                    {attendance.isProcessing ? "처리 중..." : "출근하기"}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Today's Work Status Card */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-4 py-3">
              <h2 className="text-base font-bold text-slate-900">오늘 근무 기록</h2>
            </div>

            <div className="px-4 pb-4 space-y-3">
              {todayWorkRecords.length > 0 ? (
                todayWorkRecords.map((record, index) => {
                  const siteColor = sites.find((s) => s.name === record.siteName)?.color || "#cbd5e1"
                  return (
                    <div key={index}>
                      {index > 0 && <div className="border-t border-slate-100 mb-3" />}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: siteColor }}
                          />
                          <div>
                            <p className="text-sm font-medium text-slate-900">{record.siteName}</p>
                            <p className="text-xs text-slate-500">
                              {formatKstTime(record.checkInTime)} - {record.checkOutTime ? formatKstTime(record.checkOutTime) : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-slate-500 bg-slate-100 px-3 py-2 rounded-lg text-center">
                  오늘 퇴근한 기록이 아직 없어요.
                </p>
              )}
            </div>
          </div>

          {/* Weekly Work Status Card */}
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
                <p className="text-sm text-slate-500 bg-slate-100 px-3 py-2 rounded-lg text-center">
                  이번 주에 출근한 날이 아직 없어요
                </p>
              )}
            </div>
          </div>
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

      {/* Check-in Error Notification */}
      {notifications.showError && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 pointer-events-none">
          <div
            className="w-full max-w-sm bg-red-600 text-white rounded-lg shadow-lg px-4 py-3 flex items-start gap-3 pointer-events-auto"
            onClick={notifications.dismissError}
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
              <path d="M7 7L13 13M13 7L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div className="flex-1">
              <p className="font-medium text-sm">오류</p>
              <p className="text-xs text-red-200 mt-0.5">{notifications.errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Complete Popup */}
      {checkoutPopup.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={checkoutPopup.close} />
          <div className="relative z-10 w-80 bg-white rounded-xl shadow-xl border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4">
              <h2 className="text-lg font-bold text-slate-900">퇴근하기</h2>
              <Button variant="ghost" size="icon" onClick={checkoutPopup.close}
                className="w-6 h-6 hover:bg-transparent text-slate-900">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </Button>
            </div>

            {/* Content */}
            <div className="px-5 py-4 space-y-4">
              {/* Check-in Time */}
              <div className="text-sm text-slate-600">
                <span>출근</span>
                <span className="float-right text-slate-900 font-medium">
                  {attendance.checkInTime ? formatKstTime(attendance.checkInTime) : ""}
                </span>
              </div>

              {/* Check-out Time */}
              <div className="text-sm text-slate-600">
                <span>퇴근</span>
                <span className="float-right text-slate-900 font-medium">
                  {attendance.checkOutTime ? formatKstTime(attendance.checkOutTime) : ""}
                </span>
              </div>

              {/* Warning Box */}
              <div className="bg-orange-50 rounded-lg p-4 flex gap-3">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0 mt-0.5">
                  <path
                    d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
                    stroke="#EA580C"
                    strokeWidth="1.5"
                  />
                  <path d="M10 6V11" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="10" cy="14" r="1" fill="#EA580C" />
                </svg>
                <p className="text-sm text-orange-600">
                  공수가 실제와 다른 경우, '정정 요청' 버튼을 눌러 정정 요청할 수 있습니다.
                </p>
              </div>

              {/* Buttons */}
              <div className="space-y-2">
                <Button variant="neutral" size="full" onClick={openCorrectionDialog}
                  className="bg-slate-100 border-0 hover:bg-slate-200 text-slate-900 font-semibold">
                  정정 요청
                </Button>
                <Button variant="primary" size="full" onClick={checkoutPopup.close}>
                  확인 완료
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Correction Request Dialog */}
      {showCorrectionDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeAll} />
          <div className="relative z-10 w-[calc(100%-2rem)] max-w-sm bg-white rounded-xl shadow-xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <button onClick={closeCorrectionDialog} className="p-1 -ml-1">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <h2 className="text-lg font-bold text-slate-900">정정 요청</h2>
              <button onClick={closeAll} className="p-1 -mr-1">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {!record ? (
                <div className="flex items-center justify-center py-10">
                  <Spinner size="md" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Site Info */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{attendance.siteName}</h3>
                    {attendance.siteAddress && (
                      <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                        <FmdGoodIcon sx={{ fontSize: 16 }} />
                        <span>{attendance.siteAddress}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-100" />

                  {/* Times */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">출근</span>
                      <span className="text-sm font-medium text-slate-900">
                        {attendance.checkInTime ? formatKstTime(attendance.checkInTime) : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">퇴근</span>
                      <span className="text-sm font-medium text-slate-900">
                        {attendance.checkOutTime ? formatKstTime(attendance.checkOutTime) : ""}
                      </span>
                    </div>

                    {/* Work Effort */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">내 공수</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={correctionWorkEffort}
                          onChange={(e) => setCorrectionWorkEffort(e.target.value)}
                          className="w-20 h-10 text-center text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007DCA]"
                        />
                        <span className="text-sm text-slate-600">공수</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100" />

                  {/* Daily Wage */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">현장 단가</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={correctionDailyWage}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9]/g, "")
                            setCorrectionDailyWage(raw ? Number(raw).toLocaleString("ko-KR") : "")
                          }}
                          className="w-28 h-10 text-center text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007DCA]"
                        />
                        <span className="text-sm text-slate-600">원</span>
                      </div>
                    </div>

                    {/* Expected Wage */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">예상 임금(세전)</span>
                      <span className="text-base font-semibold text-[#007DCA]">
                        {formatCurrency(expectedWage)}
                      </span>
                    </div>
                  </div>

                  {/* Reason */}
                  <textarea
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    placeholder="변경사유를 입력해주세요..."
                    rows={4}
                    className="w-full p-4 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#007DCA]"
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            {record && (
              <div className="px-5 pb-5 pt-2">
                <Button
                  variant={isSubmitting || !correctionReason.trim() ? "primaryDisabled" : "primary"}
                  size="full"
                  onClick={handleCorrectionSubmit}
                  disabled={isSubmitting || !correctionReason.trim()}
                >
                  {isSubmitting ? "제출 중..." : "정정 요청 제출"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
