import { useQuery } from '@tanstack/react-query'
import { fetchMonthlyAttendance } from '@/lib/attendance'

export function useMonthlyAttendance(year: number, month: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['monthlyAttendance', year, month],
    queryFn: async () => {
      const result = await fetchMonthlyAttendance(year, month)
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch monthly attendance')
      }
      return result.data
    },
    // 1 min cache — navigating between list/calendar inside /attendance
    // reuses the fresh fetch without re-hitting the backend; browser back
    // after a minute still refreshes.
    staleTime: 60_000,
    enabled: options?.enabled ?? true,
  })
}
