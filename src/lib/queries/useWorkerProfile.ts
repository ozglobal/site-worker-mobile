import { useQuery } from '@tanstack/react-query'
import { fetchWorkerMe, type WorkerMeData } from '@/lib/profile'

/**
 * PR 7: React Query hook for worker profile data
 * Fetches from /system/worker/me — staleTime: Infinity (fetch once per session)
 */
export function useWorkerProfile() {
  return useQuery<WorkerMeData>({
    queryKey: ['workerProfile'],
    queryFn: async () => {
      const result = await fetchWorkerMe()
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch worker profile')
      }
      return result.data
    },
    staleTime: Infinity,
  })
}
