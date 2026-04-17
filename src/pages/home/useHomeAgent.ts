/**
 * Home Page Master Agent (Thin Orchestrator)
 *
 * Coordinates sub-agents for the home page:
 * - AttendanceAgent: Check-in/out state and API operations
 * - LocationAgent: Geolocation and permission handling
 * - CalendarAgent: Weekly calendar events
 * - NotificationAgent: Toast notifications
 */

import { useState, useCallback, useMemo } from "react"
import { getWorkerName } from "@/lib/auth"
import { useAttendanceAgent } from "./agents/attendance"
import { useLocationAgent } from "./agents/location"
import { useCalendarAgent } from "./agents/calendar"
import { useNotificationAgent } from "./agents/notification"
import type { Location, Site, TodayWorkRecord } from "./home.types"
import type { QRCodeData } from "@/components/ui/qr-scanner"

// ============================================
// Types
// ============================================

interface HomeAgentReturn {
  // User info
  userName: string
  currentDate: Date

  // Attendance (from sub-agent)
  attendance: {
    status: string
    isCheckedIn: boolean
    attendanceId: string | null
    isProcessing: boolean
    checkInTime: string | null
    checkOutTime: string | null
    canCheckIn: boolean
    canCheckOut: boolean
    siteName: string
    siteAddress: string
    dailyWageSnapshot: number | null
    workEffort: number | null
  }

  // Work site
  workSite: {
    id: string
    name: string
    address: string
    workStart?: string
    workEnd?: string
    lunchStart?: string
    lunchEnd?: string
    breakStart?: string
    breakEnd?: string
  }
  sites: Site[]

  // Today's work records (for 오늘 근무 현황 card)
  todayWorkRecords: TodayWorkRecord[]

  // Calendar (from sub-agent)
  calendar: {
    events: Array<{ date: Date; color: string }>
    hasEventsThisWeek: boolean
    isLoading: boolean
    onDateSelect: (date: Date) => void
  }

  // Scanner UI state
  scanner: {
    isOpen: boolean
    open: () => void
    close: () => void
    onSuccess: (data: QRCodeData) => Promise<void>
  }

  // Location popup UI state
  locationPopup: {
    isOpen: boolean
    isDenied: boolean
    onGranted: (location: Location) => void
    onDenied: () => void
    onClose: () => void
  }

  // Notifications (from sub-agent)
  notifications: {
    showSuccess: boolean
    showError: boolean
    errorMessage: string
    siteName: string
    dismissSuccess: () => void
    dismissError: () => void
  }

  // Actions
  actions: {
    clockIn: () => Promise<void>
    clockOut: () => Promise<{ success: boolean; attendanceId?: string | null } | undefined>
  }
}

// ============================================
// Master Agent Hook
// ============================================

export function useHomeAgent(): HomeAgentReturn {
  // ============================================
  // Sub-agents
  // ============================================
  const attendance = useAttendanceAgent()
  const location = useLocationAgent()
  const calendar = useCalendarAgent() // Sites will be computed from attendance records
  const notifications = useNotificationAgent()

  // ============================================
  // Local UI State
  // ============================================
  const [showScanner, setShowScanner] = useState(false)
  const [pendingAction, setPendingAction] = useState<"check-out" | null>(null)

  // ============================================
  // User Info
  // ============================================
  const userName = getWorkerName() || "사용자"
  const currentDate = new Date()

  // ============================================
  // Orchestrated Actions
  // ============================================

  /**
   * Clock In Flow:
   * 1. Open scanner
   * 2. GPS is fetched fresh after successful QR scan in handleScanSuccess
   */
  const handleClockIn = useCallback(async () => {
    if (!attendance.canCheckIn) return

    setShowScanner(true)
  }, [attendance.canCheckIn])

  /**
   * Clock Out Flow:
   * Get fresh GPS location, then execute check-out
   */
  const handleClockOut = useCallback(async () => {
    if (!attendance.canCheckOut) return

    setPendingAction("check-out")

    const freshLocation = await location.requestLocation()
    const result = await attendance.checkOut(freshLocation || undefined)

    if (!result.success) {
      notifications.showError("퇴근 실패", result.error)
      setPendingAction(null)
      return { success: false }
    }
    setPendingAction(null)
    return { success: true, attendanceId: result.attendanceId }
  }, [attendance, location, notifications])

  /**
   * Handle successful QR scan
   */
  const handleScanSuccess = useCallback(
    async (data: QRCodeData) => {
      setShowScanner(false)

      // Always request fresh location for each check-in
      // Don't rely on cached currentLocation due to React closure stale state
      const freshLocation = await location.requestLocation()

      const result = await attendance.checkIn(
        data.siteId,
        data.issuedAt,
        freshLocation || undefined
      )

      if (result.success) {
        notifications.showSuccess("출근 완료", `${result.data.siteName}에 출근하였습니다.`)
      } else {
        notifications.showError("출근 실패", result.error)
      }
    },
    [attendance, location, notifications]
  )

  /**
   * Handle location granted from popup (used during check-in flow)
   */
  const handleLocationGranted = useCallback(
    (loc: Location) => {
      location.setLocation(loc)
      setPendingAction(null)
    },
    [location]
  )

  /**
   * Handle location denied from popup
   */
  const handleLocationDenied = useCallback(() => {
    location.markDenied()
    setPendingAction(null)
  }, [location])

  /**
   * Close location popup
   */
  const handleLocationPopupClose = useCallback(() => {
    location.dismissPopup()
    setPendingAction(null)
  }, [location])

  // Note: Calendar is refreshed after check-in/out by calling calendar.refresh()
  // which fetches fresh data from the monthly attendance API.

  // ============================================
  // Derived Values
  // ============================================

  const workSite = useMemo(
    () => ({
      id: attendance.checkedInSiteId || "site-1",
      name: attendance.siteName,
      address: attendance.siteAddress,
      workStart: attendance.workStart,
      workEnd: attendance.workEnd,
      lunchStart: attendance.lunchStart,
      lunchEnd: attendance.lunchEnd,
      breakStart: attendance.breakStart,
      breakEnd: attendance.breakEnd,
    }),
    [attendance.checkedInSiteId, attendance.siteName, attendance.siteAddress,
     attendance.workStart, attendance.workEnd, attendance.lunchStart, attendance.lunchEnd,
     attendance.breakStart, attendance.breakEnd]
  )

  // Check if there's an active success/error notification
  const hasSuccessNotification = notifications.notifications.some(
    (n) => n.type === "success"
  )
  const hasErrorNotification = notifications.notifications.some(
    (n) => n.type === "error"
  )
  const errorNotification = notifications.notifications.find(
    (n) => n.type === "error"
  )

  // PR 5: todayRecords now comes from WeeklyAttendanceRecord (API type, timestamps are numbers)
  const todayWorkRecords: TodayWorkRecord[] = useMemo(
    () =>
      attendance.todayRecords
        .filter((record) => record.hasCheckedOut)
        .map((record) => ({
          id: record.id,
          siteName: record.siteName || "",
          checkInTime: record.checkInTime ? new Date(record.checkInTime).toISOString() : "",
          checkOutTime: record.checkOutTime ? new Date(record.checkOutTime).toISOString() : undefined,
          workEffort: record.workEffort,
          dailyWageSnapshot: record.dailyWageSnapshot,
          expectedWage: record.expectedWage,
        })),
    [attendance.todayRecords]
  )


  // ============================================
  // Return Grouped API
  // ============================================

  return {
    // User info
    userName,
    currentDate,

    // Attendance
    attendance: {
      status: attendance.checkInStatus,
      isCheckedIn: !!attendance.checkedInSiteId,
      attendanceId: attendance.checkedInAttendanceId,
      // Include pendingAction to show loading during GPS fetch phase
      isProcessing: attendance.isProcessing || pendingAction !== null,
      checkInTime: attendance.checkInTime,
      checkOutTime: attendance.checkOutTime,
      canCheckIn: attendance.canCheckIn,
      canCheckOut: attendance.canCheckOut,
      siteName: attendance.siteName,
      siteAddress: attendance.siteAddress,
      dailyWageSnapshot: attendance.dailyWageSnapshot,
      workEffort: attendance.workEffort,
    },

    // Work site
    workSite,
    sites: calendar.sites,

    // Today's work records
    todayWorkRecords,

    // Calendar
    calendar: {
      events: calendar.events,
      hasEventsThisWeek: calendar.hasEventsThisWeek,
      isLoading: calendar.isLoading,
      onDateSelect: calendar.selectDate,
    },

    // Scanner
    scanner: {
      isOpen: showScanner,
      open: () => setShowScanner(true),
      close: () => setShowScanner(false),
      onSuccess: handleScanSuccess,
    },

    // Location popup
    locationPopup: {
      isOpen: location.showPermissionPopup,
      isDenied: location.isDenied,
      onGranted: handleLocationGranted,
      onDenied: handleLocationDenied,
      onClose: handleLocationPopupClose,
    },

    // Notifications (bridge to legacy API for now)
    notifications: {
      showSuccess: hasSuccessNotification,
      showError: hasErrorNotification,
      errorMessage: errorNotification?.message || "",
      siteName: attendance.siteName,
      dismissSuccess: () => {
        const successNotif = notifications.notifications.find((n) => n.type === "success")
        if (successNotif) notifications.dismiss(successNotif.id)
      },
      dismissError: () => {
        const errorNotif = notifications.notifications.find((n) => n.type === "error")
        if (errorNotif) notifications.dismiss(errorNotif.id)
      },
    },

    // Actions
    actions: {
      clockIn: handleClockIn,
      clockOut: handleClockOut,
    },
  }
}
