import { useQuery } from '@tanstack/react-query'
import { fetchTodayAttendance, type DailyAttendanceData } from '@/lib/attendance'

function getTodayDateString(): string {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * React Query hook for today's attendance from
 * GET /system/worker/me/attendance/daily/{yyyy-MM-dd}.
 * Used by the Home page to render today's check-in/out state.
 */
export function useTodayAttendance() {
  const date = getTodayDateString()
  return useQuery<DailyAttendanceData>({
    queryKey: ['todayAttendance', date],
    queryFn: async () => {
      const result = await fetchTodayAttendance(date)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch today attendance')
      }
      if (!result.data) {
        throw new Error('Failed to fetch today attendance')
      }
      return result.data
    },
    // 알림 → 상세화면 진입 시 항상 fresh 한 데이터 보장 위해 staleTime 0.
    // (반려 알림 클릭 → 상세화면 떠도 캐시가 옛 데이터 들고 있는 문제 방지)
    staleTime: 0,
    refetchOnMount: 'always',
  })
}
