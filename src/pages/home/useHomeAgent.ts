/**
 * Home Page Master Agent (Thin Orchestrator)
 *
 * Coordinates sub-agents for the home page:
 * - AttendanceAgent: Check-in/out state and API operations
 * - LocationAgent: Geolocation and permission handling
 * - CalendarAgent: Weekly calendar events
 * - NotificationAgent: Toast notifications
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import { profileStorage } from "@/lib/storage"
import { useAttendanceAgent } from "./agents/attendance"
import { useLocationAgent } from "./agents/location"
import { useCalendarAgent } from "./agents/calendar"
import { useNotificationAgent } from "./agents/notification"
import type { Location, Site, TodayWorkRecord } from "./home.types"
import type { QRCodeData } from "@/components/ui/QrScanner"

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
    isProcessing: boolean
    checkInTime: string | null
    checkOutTime: string | null
    canCheckIn: boolean
    canCheckOut: boolean
    siteName: string
    siteAddress: string
  }

  // Work site
  workSite: {
    id: string
    name: string
    address: string
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

  // Checkout popup
  checkoutPopup: {
    isOpen: boolean
    close: () => void
  }

  // Actions
  actions: {
    clockIn: () => Promise<void>
    clockOut: () => Promise<void>
  }
}

// ============================================
// Master Agent Hook
// ============================================

// Stable empty array to prevent infinite re-renders
const EMPTY_SITES: Site[] = []

export function useHomeAgent(): HomeAgentReturn {
  // ============================================
  // Sub-agents
  // ============================================
  const attendance = useAttendanceAgent()
  const location = useLocationAgent()
  const calendar = useCalendarAgent(EMPTY_SITES) // Sites will be computed from attendance records
  const notifications = useNotificationAgent()

  // ============================================
  // Local UI State
  // ============================================
  const [showScanner, setShowScanner] = useState(false)
  const [showCheckoutPopup, setShowCheckoutPopup] = useState(false)
  const [pendingAction, setPendingAction] = useState<"check-in" | "check-out" | null>(null)

  // ============================================
  // User Info
  // ============================================
  const userName = profileStorage.getWorkerName() || "사용자"
  const currentDate = new Date()

  // ============================================
  // Orchestrated Actions
  // ============================================

  /**
   * Clock In Flow:
   * 1. Open scanner immediately
   * 2. Fetch GPS in parallel (will be available by time user scans QR)
   */
  const handleClockIn = useCallback(async () => {
    if (!attendance.canCheckIn) return

    setShowScanner(true)
    // Fetch GPS in background — don't block the scanner
    location.requestLocation()
  }, [attendance.canCheckIn, location])

  /**
   * Clock Out Flow:
   * 1. Request location
   * 2. If granted -> execute check-out
   * 3. If denied -> show location popup
   */
  const handleClockOut = useCallback(async () => {
    if (!attendance.canCheckOut) return

    setPendingAction("check-out")
    const loc = await location.requestLocation()

    if (loc) {
      // Location granted -> execute check-out
      const result = await attendance.checkOut(loc)

      if (result.success) {
        setShowCheckoutPopup(true)
      } else {
        notifications.showError("퇴근 실패", result.error)
      }
      setPendingAction(null)
    }
    // If null, location agent will show popup
  }, [attendance, location, notifications])

  /**
   * Handle successful QR scan
   */
  const handleScanSuccess = useCallback(
    async (data: QRCodeData) => {
      setShowScanner(false)

      const result = await attendance.checkIn(
        data.siteId,
        data.issuedAt,
        location.currentLocation || undefined
      )

      if (result.success) {
        // Calendar will be refreshed automatically via useEffect when todayRecords changes
        notifications.showSuccess("출근 완료", `${result.data.siteName}에 출근하였습니다.`)
      } else {
        notifications.showError("출근 실패", result.error)
      }
    },
    [attendance, location.currentLocation, notifications]
  )

  /**
   * Handle location granted from popup
   */
  const handleLocationGranted = useCallback(
    (loc: Location) => {
      location.setLocation(loc)

      if (pendingAction === "check-out") {
        // Execute check-out with the granted location
        attendance.checkOut(loc).then((result) => {
          if (result.success) {
            setShowCheckoutPopup(true)
          } else {
            notifications.showError("퇴근 실패", result.error)
          }
        })
      }
      setPendingAction(null)
    },
    [pendingAction, location, attendance, notifications]
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

  // ============================================
  // Sync calendar with attendance records
  // ============================================

  // Track previous records length to detect actual changes (not just initial load)
  const prevRecordsLength = useRef<number | null>(null)
  useEffect(() => {
    const currentLength = attendance.todayRecords.length

    // Skip if this is the first render (prevRecordsLength is null)
    if (prevRecordsLength.current === null) {
      prevRecordsLength.current = currentLength
      return
    }

    // Skip if length hasn't actually changed
    if (prevRecordsLength.current === currentLength) {
      return
    }

    // Records changed - refresh calendar (after check-in/out)
    prevRecordsLength.current = currentLength
    calendar.refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendance.todayRecords.length])

  // ============================================
  // Derived Values
  // ============================================

  const workSite = useMemo(
    () => ({
      id: attendance.checkedInSiteId || "site-1",
      name: attendance.siteName,
      address: attendance.siteAddress,
    }),
    [attendance.checkedInSiteId, attendance.siteName, attendance.siteAddress]
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

  // Map completed attendance records to TodayWorkRecord format (only show after checkout)
  const todayWorkRecords: TodayWorkRecord[] = useMemo(
    () =>
      attendance.todayRecords
        .filter((record) => !!record.checkOutTime)
        .map((record) => ({
          siteName: record.siteName || "",
          checkInTime: record.checkInTime,
          checkOutTime: record.checkOutTime,
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
      isProcessing: attendance.isProcessing,
      checkInTime: attendance.checkInTime,
      checkOutTime: attendance.checkOutTime,
      canCheckIn: attendance.canCheckIn,
      canCheckOut: attendance.canCheckOut,
      siteName: attendance.siteName,
      siteAddress: attendance.siteAddress,
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

    // Checkout popup
    checkoutPopup: {
      isOpen: showCheckoutPopup,
      close: () => setShowCheckoutPopup(false),
    },

    // Actions
    actions: {
      clockIn: handleClockIn,
      clockOut: handleClockOut,
    },
  }
}
