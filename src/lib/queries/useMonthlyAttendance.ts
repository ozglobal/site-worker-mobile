import { useQuery } from '@tanstack/react-query'
import { fetchMonthlyAttendance } from '@/lib/attendance'

export function useMonthlyAttendance(year: number, month: number) {
  return useQuery({
    queryKey: ['monthlyAttendance', year, month],
    queryFn: async () => {
      const result = await fetchMonthlyAttendance(year, month)
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch monthly attendance')
      }
      return result.data
    },
    staleTime: Infinity,
  })
}
