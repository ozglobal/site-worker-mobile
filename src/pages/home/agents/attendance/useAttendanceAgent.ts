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
import { checkinSiteStorage } from "@/lib/storage"

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
  checkedInAttendanceId: string | null
  siteName: string
  siteAddress: string
  workStart?: string
  workEnd?: string
  lunchStart?: string
  lunchEnd?: string
  breakStart?: string
  breakEnd?: string
  dailyWageSnapshot: number | null
  workEffort: number | null
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
  | { success: true; attendanceId?: string }
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
  const [checkedInAttendanceId, setCheckedInAttendanceId] = useState<string | null>(null)
  const [siteName, setSiteName] = useState("")
  const [siteAddress, setSiteAddress] = useState("")
  const [dailyWageSnapshot, setDailyWageSnapshot] = useState<number | null>(null)
  const [workEffort, setWorkEffort] = useState<number | null>(null)
  const [workStart, setWorkStart] = useState<string | undefined>()
  const [workEnd, setWorkEnd] = useState<string | undefined>()
  const [lunchStart, setLunchStart] = useState<string | undefined>()
  const [lunchEnd, setLunchEnd] = useState<string | undefined>()
  const [breakStart, setBreakStart] = useState<string | undefined>()
  const [breakEnd, setBreakEnd] = useState<string | undefined>()
  const [checkInTime, setCheckInTime] = useState<string | null>(null)
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null)
  const [completedCount, setCompletedCount] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  // Sync local state from server data (on initial load and after refetch)
  useEffect(() => {
    if (isLoading) return

    if (serverCheckIn) {
      const cached = checkinSiteStorage.get()
      setCheckedInSiteId(serverCheckIn.siteId)
      setCheckedInAttendanceId(serverCheckIn.id || null)
      setSiteName(serverCheckIn.siteName)
      setSiteAddress(cached?.siteAddress || "")
      setDailyWageSnapshot(serverCheckIn.dailyWageSnapshot ?? cached?.dailyWageSnapshot ?? null)
      setWorkEffort(serverCheckIn.workEffort ?? null)
      setCheckInTime(timestampToIso(serverCheckIn.checkInTime))
      const sc = serverCheckIn as unknown as Record<string, unknown>
      if (sc.workStart) setWorkStart(String(sc.workStart))
      if (sc.workEnd) setWorkEnd(String(sc.workEnd))
      if (sc.lunchStart) setLunchStart(String(sc.lunchStart))
      if (sc.lunchEnd) setLunchEnd(String(sc.lunchEnd))
      if (sc.breakStart) setBreakStart(String(sc.breakStart))
      if (sc.breakEnd) setBreakEnd(String(sc.breakEnd))
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
          setCheckedInAttendanceId(result.data.id || null)
          setSiteName(result.data.siteName)
          setSiteAddress(result.data.siteAddress)
          setCheckInTime(result.data.serverTimestamp)
          setCheckOutTime(null)

          // Cache site info for reload
          checkinSiteStorage.set({
            siteAddress: result.data.siteAddress || "",
            dailyWageSnapshot: null,
          })

          // On check-in the home card rebuilds from /attendance/daily
          // (`todayAttendance`), not /home — invalidate that plus the
          // monthly cache so /attendance stays in sync.
          queryClient.invalidateQueries({ queryKey: ['todayAttendance'] })
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
            workEffort,
            location,
          },
          { buildCheckOutRequest, checkOut }
        )

        if (result.success) {
          const now = new Date().toISOString()
          setCheckOutTime(now)
          setCheckedInSiteId(null)
          setCheckedInAttendanceId(null)
          setCompletedCount((prev) => prev + 1)
          checkinSiteStorage.clear()

          // On check-out the home card rebuilds from /attendance/daily
          // (`todayAttendance`), not /home — invalidate that plus the
          // monthly cache so /attendance stays in sync.
          queryClient.invalidateQueries({ queryKey: ['todayAttendance'] })
          queryClient.invalidateQueries({ queryKey: ['monthlyAttendance'] })

          return { success: true, attendanceId: result.attendanceId }
        }

        return { success: false, error: result.error }
      } finally {
        setIsProcessing(false)
      }
    },
    [checkedInSiteId, checkInTime, queryClient]
  )

  // Refresh records — invalidate both home and /attendance caches.
  const refreshRecords = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['homeData'] })
    queryClient.invalidateQueries({ queryKey: ['monthlyAttendance'] })
  }, [queryClient])

  return {
    // State
    checkedInSiteId,
    checkedInAttendanceId,
    siteName,
    siteAddress,
    workStart,
    workEnd,
    lunchStart,
    lunchEnd,
    breakStart,
    breakEnd,
    dailyWageSnapshot,
    workEffort,
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
