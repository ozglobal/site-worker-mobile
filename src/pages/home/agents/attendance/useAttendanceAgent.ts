/**
 * Unified Attendance Agent
 * Manages attendance state, storage, and API operations
 * Replaces useAttendanceStateAgent + useAttendanceWorkflowAgent
 */

import { useState, useEffect, useCallback, useMemo } from "react"
import { todayAttendanceStorage, type AttendanceRecord } from "@/lib/storage"
import {
  buildCheckInRequest,
  buildCheckOutRequest,
  checkIn,
  checkOut,
} from "@/lib/attendance"

// Import skills
import {
  loadTodayAttendance,
  persistCheckIn,
  persistCheckOut,
} from "./skills/attendance-storage.skill"
import {
  executeCheckInApi,
  executeCheckOutApi,
  type CheckInSuccessData,
} from "./skills/attendance-api.skill"
import { deriveAttendanceState, type CheckInStatus } from "./skills/attendance-state.skill"
import type { Location } from "../../home.types"

// ============================================
// Constants
// ============================================

const MAX_CHECKINS_PER_DAY = 2

// ============================================
// Types
// ============================================

export interface AttendanceAgentState {
  // Core state
  checkedInSiteId: string | null
  siteName: string
  siteAddress: string
  checkInTime: string | null
  checkOutTime: string | null
  completedCount: number
  isProcessing: boolean
  // Today's records (for "오늘 근무 현황" card)
  todayRecords: AttendanceRecord[]
  // Derived state
  checkInStatus: CheckInStatus
  canCheckIn: boolean
  canCheckOut: boolean
}

export type CheckInResult =
  | { success: true; data: CheckInSuccessData }
  | { success: false; error: string }

export type CheckOutResult =
  | { success: true }
  | { success: false; error: string }

export interface AttendanceAgentActions {
  checkIn: (
    siteId: string,
    qrTimestamp: string | Date,
    location?: Location
  ) => Promise<CheckInResult>
  checkOut: (location?: Location) => Promise<CheckOutResult>
  refreshRecords: () => void
}

// ============================================
// Agent Hook
// ============================================

export function useAttendanceAgent(): AttendanceAgentState & AttendanceAgentActions {
  // Core state
  const [checkedInSiteId, setCheckedInSiteId] = useState<string | null>(null)
  const [siteName, setSiteName] = useState("")
  const [siteAddress, setSiteAddress] = useState("")
  const [checkInTime, setCheckInTime] = useState<string | null>(null)
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null)
  const [completedCount, setCompletedCount] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([])

  // Load initial state from storage using skill
  useEffect(() => {
    const summary = loadTodayAttendance(todayAttendanceStorage)

    if (summary.currentCheckIn) {
      setCheckedInSiteId(summary.currentCheckIn.siteId)
      setSiteName(summary.currentCheckIn.siteName)
      setSiteAddress(summary.currentCheckIn.siteAddress)
      setCheckInTime(summary.currentCheckIn.serverTimestamp)
    }

    setCompletedCount(summary.completedCount)
    setTodayRecords(todayAttendanceStorage.getRecords())
  }, [])

  // Derive state using skill
  const derivedState = useMemo(
    () =>
      deriveAttendanceState({
        isCheckedIn: !!checkedInSiteId,
        completedCount,
        maxCheckInsPerDay: MAX_CHECKINS_PER_DAY,
      }),
    [checkedInSiteId, completedCount]
  )

  // Check-in action - uses skills for API and storage
  const doCheckIn = useCallback(
    async (
      siteId: string,
      qrTimestamp: string | Date,
      location?: Location
    ): Promise<CheckInResult> => {
      setIsProcessing(true)

      // Convert string to Date if needed
      const qrDate = typeof qrTimestamp === "string" ? new Date(qrTimestamp) : qrTimestamp

      try {
        const result = await executeCheckInApi(
          { siteId, qrTimestamp: qrDate, location },
          { buildCheckInRequest, checkIn }
        )

        if (result.success) {
          // Update local state
          setCheckedInSiteId(siteId)
          setSiteName(result.data.siteName)
          setSiteAddress(result.data.siteAddress)
          setCheckInTime(result.data.serverTimestamp)
          // Clear previous check-out time on new check-in
          setCheckOutTime(null)

          // Persist using skill
          persistCheckIn(todayAttendanceStorage, {
            id: result.data.id,
            siteId,
            siteName: result.data.siteName,
            siteAddress: result.data.siteAddress,
            serverTimestamp: result.data.serverTimestamp,
          })

          // Refresh records after check-in (calendar.refresh will sync with server)
          setTodayRecords(todayAttendanceStorage.getRecords())

          return { success: true, data: result.data }
        }

        return { success: false, error: result.error }
      } finally {
        setIsProcessing(false)
      }
    },
    []
  )

  // Check-out action - uses skills for API and storage
  const doCheckOut = useCallback(
    async (location?: Location): Promise<CheckOutResult> => {
      if (!checkedInSiteId) {
        return { success: false, error: "Not checked in" }
      }

      setIsProcessing(true)

      try {
        const result = await executeCheckOutApi(
          {
            siteId: checkedInSiteId,
            checkInTime: checkInTime || undefined,
            location,
          },
          { buildCheckOutRequest, checkOut }
        )

        if (result.success) {
          // Record check-out time
          const now = new Date().toISOString()

          // Persist to storage with checkout time
          persistCheckOut(todayAttendanceStorage, now)

          setCheckOutTime(now)

          // Update local state - keep checkInTime for display
          setCheckedInSiteId(null)
          // Don't clear siteName, siteAddress, checkInTime - keep them for display
          setCompletedCount((prev) => prev + 1)

          // Refresh records after check-out (calendar.refresh will sync with server)
          setTodayRecords(todayAttendanceStorage.getRecords())

          return { success: true }
        }

        return { success: false, error: result.error }
      } finally {
        setIsProcessing(false)
      }
    },
    [checkedInSiteId, checkInTime]
  )

  // Refresh records from storage (called after calendar sync)
  const refreshRecords = useCallback(() => {
    const summary = loadTodayAttendance(todayAttendanceStorage)
    setCompletedCount(summary.completedCount)
    setTodayRecords(todayAttendanceStorage.getRecords())

    // Also update current check-in state if changed
    if (summary.currentCheckIn) {
      setCheckedInSiteId(summary.currentCheckIn.siteId)
      setSiteName(summary.currentCheckIn.siteName)
      setSiteAddress(summary.currentCheckIn.siteAddress)
      setCheckInTime(summary.currentCheckIn.serverTimestamp)
    } else if (checkedInSiteId && !summary.currentCheckIn) {
      // Clear check-in state if no longer checked in
      setCheckedInSiteId(null)
    }
  }, [checkedInSiteId])

  return {
    // State
    checkedInSiteId,
    siteName,
    siteAddress,
    checkInTime,
    checkOutTime,
    completedCount,
    isProcessing,
    todayRecords,

    // Derived (from skill)
    ...derivedState,

    // Actions
    checkIn: doCheckIn,
    checkOut: doCheckOut,
    refreshRecords,
  }
}
