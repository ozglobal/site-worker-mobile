import { useMemo } from 'react'
import { useMonthlyAttendance } from './useMonthlyAttendance'
import type { WeeklyAttendanceRecord } from '@/lib/attendance'

function getTodayDateString(): string {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function useDailyAttendance() {
  const now = new Date()
  const { data, isLoading, refetch } = useMonthlyAttendance(now.getFullYear(), now.getMonth() + 1)
  const todayStr = getTodayDateString()

  const todayRecords = useMemo((): WeeklyAttendanceRecord[] => {
    if (!data) return []
    return data.records.filter(r => r.effectiveDate === todayStr)
  }, [data, todayStr])

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
