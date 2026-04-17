import { useQuery } from '@tanstack/react-query'
import { fetchHomeData, type HomeData } from '@/lib/attendance'

/**
 * Home-page bundle from GET /system/worker/me/home.
 * Returns today's attendance, monthly stats, notice count, etc. in a single call.
 */
export function useHomeData() {
  return useQuery<HomeData>({
    queryKey: ['homeData'],
    queryFn: async () => {
      const result = await fetchHomeData()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch home data')
      }
      if (!result.data) {
        throw new Error('Failed to fetch home data')
      }
      return result.data
    },
    staleTime: 30_000,
  })
}
