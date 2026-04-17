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
    // Always refetch when /attendance mounts so users get current data —
    // cached entries don't prevent a fresh network call on page entry.
    staleTime: 0,
    refetchOnMount: 'always',
    enabled: options?.enabled ?? true,
  })
}
