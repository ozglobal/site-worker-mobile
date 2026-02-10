/**
 * Unified Attendance Agent
 * Manages attendance state, storage, and API operations
 *
 * PR 5: Uses React Query (useDailyAttendance) instead of todayAttendanceStorage
 */

import { useState, useEffect, useCallback, useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  buildCheckInRequest,
  buildCheckOutRequest,
  checkIn,
  checkOut,
  type WeeklyAttendanceRecord,
} from "@/lib/attendance"
import { useDailyAttendance } from "@/lib/queries/useDailyAttendance"

// Import skills
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
  todayRecords: WeeklyAttendanceRecord[]
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
// Helpers
// ============================================

function timestampToIso(time: number | undefined): string {
  if (!time) return ""
  return new Date(time).toISOString()
}

// ============================================
// Agent Hook
// ============================================

export function useAttendanceAgent(): AttendanceAgentState & AttendanceAgentActions {
  const queryClient = useQueryClient()
  const { todayRecords: serverRecords, currentCheckIn: serverCheckIn, completedCount: serverCompletedCount, isLoading } = useDailyAttendance()

  // Core state — local for immediate UI feedback
  const [checkedInSiteId, setCheckedInSiteId] = useState<string | null>(null)
  const [siteName, setSiteName] = useState("")
  const [siteAddress, setSiteAddress] = useState("")
  const [checkInTime, setCheckInTime] = useState<string | null>(null)
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null)
  const [completedCount, setCompletedCount] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  // Sync local state from server data (on initial load and after refetch)
  useEffect(() => {
    if (isLoading) return

    if (serverCheckIn) {
      setCheckedInSiteId(serverCheckIn.siteId)
      setSiteName(serverCheckIn.siteName)
      setSiteAddress("")
      setCheckInTime(timestampToIso(serverCheckIn.checkInTime))
    } else {
      // Only clear if we had data from server (not during initial load)
      if (!isProcessing) {
        setCheckedInSiteId((prev) => {
          // Don't clear if we just checked in locally (optimistic)
          if (prev && serverRecords.length === 0) return prev
          return null
        })
      }
    }

    setCompletedCount(serverCompletedCount)
  }, [serverCheckIn, serverCompletedCount, serverRecords.length, isLoading, isProcessing])

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

  // Check-in action
  const doCheckIn = useCallback(
    async (
      siteId: string,
      qrTimestamp: string | Date,
      location?: Location
    ): Promise<CheckInResult> => {
      setIsProcessing(true)

      const qrDate = typeof qrTimestamp === "string" ? new Date(qrTimestamp) : qrTimestamp

      try {
        const result = await executeCheckInApi(
          { siteId, qrTimestamp: qrDate, location },
          { buildCheckInRequest, checkIn }
        )

        if (result.success) {
          // Update local state immediately (optimistic)
          setCheckedInSiteId(siteId)
          setSiteName(result.data.siteName)
          setSiteAddress(result.data.siteAddress)
          setCheckInTime(result.data.serverTimestamp)
          setCheckOutTime(null)

          // Invalidate query so calendar and other consumers get fresh data
          queryClient.invalidateQueries({ queryKey: ['monthlyAttendance'] })

          return { success: true, data: result.data }
        }

        return { success: false, error: result.error }
      } finally {
        setIsProcessing(false)
      }
    },
    [queryClient]
  )

  // Check-out action
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
          const now = new Date().toISOString()
          setCheckOutTime(now)
          setCheckedInSiteId(null)
          setCompletedCount((prev) => prev + 1)

          // Invalidate query so calendar and other consumers get fresh data
          queryClient.invalidateQueries({ queryKey: ['monthlyAttendance'] })

          return { success: true }
        }

        return { success: false, error: result.error }
      } finally {
        setIsProcessing(false)
      }
    },
    [checkedInSiteId, checkInTime, queryClient]
  )

  // Refresh records — now triggers a React Query refetch
  const refreshRecords = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['monthlyAttendance'] })
  }, [queryClient])

  return {
    // State
    checkedInSiteId,
    siteName,
    siteAddress,
    checkInTime,
    checkOutTime,
    completedCount,
    isProcessing,
    todayRecords: serverRecords,

    // Derived (from skill)
    ...derivedState,

    // Actions
    checkIn: doCheckIn,
    checkOut: doCheckOut,
    refreshRecords,
  }
}
