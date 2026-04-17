import { useMemo } from 'react'
import { useHomeData } from './useHomeData'
import type { WeeklyAttendanceRecord } from '@/lib/attendance'

/**
 * Today's attendance — derived from `GET /system/worker/me/home` (useHomeData)
 * so the Home page doesn't also need to hit the monthly endpoint.
 *
 * Returns records in the WeeklyAttendanceRecord shape for callers that
 * already consume that type (useAttendanceAgent). Fields missing from the
 * home payload (workHours, status, recordType, complete) are filled with
 * safe defaults — none of them are read on the Home page.
 */
export function useDailyAttendance() {
  const { data, isLoading, refetch } = useHomeData()

  const todayRecords = useMemo((): WeeklyAttendanceRecord[] => {
    if (!data?.todayAttendance) return []
    return data.todayAttendance.map((r) => ({
      id: r.id || '',
      effectiveDate: r.effectiveDate,
      siteId: r.siteId,
      siteName: r.siteName,
      checkInTime: r.checkInTime ?? 0,
      checkOutTime: r.checkOutTime ?? undefined,
      workHours: undefined,
      workEffort: r.workEffort,
      dailyWageSnapshot: r.dailyWageSnapshot ?? undefined,
      expectedWage: r.expectedWage,
      status: '',
      recordType: '',
      hasCheckedIn: r.hasCheckedIn,
      hasCheckedOut: r.hasCheckedOut,
      complete: r.hasCheckedOut,
    }))
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
