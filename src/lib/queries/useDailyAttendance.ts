import { useMemo } from 'react'
import { useTodayAttendance } from './useTodayAttendance'
import type { WeeklyAttendanceRecord } from '@/lib/attendance'

/**
 * Today's attendance — derived from `GET /system/worker/me/attendance/daily/{today}`
 * (useTodayAttendance) so that invalidating `['todayAttendance']` after a
 * check-in/out immediately refreshes the home agent.
 *
 * Returns records in the WeeklyAttendanceRecord shape for callers that
 * already consume that type (useAttendanceAgent). Fields missing from the
 * daily payload (workHours) are filled with safe defaults.
 */
export function useDailyAttendance() {
  const { data, isLoading, refetch } = useTodayAttendance()

  const todayRecords = useMemo((): WeeklyAttendanceRecord[] => {
    if (!data?.attendances) return []
    const effectiveDate = data.date || ''
    const toMs = (t: string | null | undefined): number => {
      if (!t) return 0
      const ms = Date.parse(t)
      return Number.isFinite(ms) ? ms : 0
    }
    return data.attendances.map((a) => {
      const firstEntry = a.entries?.[0]
      return {
        id: a.attendanceId,
        effectiveDate,
        siteId: a.siteId,
        siteName: a.siteName,
        checkInTime: toMs(a.checkInTime),
        checkOutTime: a.checkOutTime ? toMs(a.checkOutTime) : undefined,
        workHours: undefined,
        workEffort: a.totalEffort,
        dailyWageSnapshot: firstEntry?.dailyWageSnapshot,
        expectedWage: a.totalExpectedWage,
        status: a.status || '',
        recordType: firstEntry?.categoryLabel || firstEntry?.category || '',
        hasCheckedIn: !!a.checkInTime,
        hasCheckedOut: !!a.checkOutTime,
        complete: !!a.checkOutTime,
      }
    })
  }, [data])

  const currentCheckIn = useMemo((): WeeklyAttendanceRecord | null => {
    return todayRecords.find(r => r.hasCheckedIn && !r.hasCheckedOut) || null
  }, [todayRecords])

  const completedCount = useMemo(() => {
    return todayRecords.filter(r => r.hasCheckedOut).length
  }, [todayRecords])

  return {
    todayRecords,
    currentCheckIn,
    completedCount,
    isLoading,
    refetch,
  }
}
